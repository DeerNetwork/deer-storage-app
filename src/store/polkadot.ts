import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  ExtrinsicStatus,
  DispatchError,
  Hash,
} from "@polkadot/types/interfaces";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import {
  web3Enable,
  web3Accounts,
  web3FromAddress,
  web3AccountsSubscribe,
} from "@polkadot/extension-dapp";
import { typesBundle } from "@deernetwork/type-definitions";
import "@deernetwork/type-definitions/interfaces/augment-api";
import "@deernetwork/type-definitions/interfaces/augment-types";
import { proxy } from "valtio";
import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";

import { Account } from "../types";

export interface PolkadotState {
  status: "uninitialized" | "ready" | "error";
  originName: string;
  endpoint: string;
  accounts: InjectedAccountWithMeta[];
  selectedAccount?: Account;
  injectedAccount?: InjectedExtension;
  chain: string;
  api?: ApiPromise;
  tokenSymbol?: string;
  tokenDecimals?: number;
}

const logError = console.error.bind(console, "[PolkadotStore]");

export const state = proxy<PolkadotState>({
  status: "uninitialized",
  originName: "Deer Operator",
  chain: "Deer network",
  endpoint:
    localStorage.getItem("endpoint") ||
    process.env.RECAT_APP_ENDPOINT ||
    "wss://testnet-ws.deernetwork.vip",
  accounts: [],
});

export async function init() {
  try {
    const [api] = await Promise.all([
      ApiPromise.create({
        provider: new WsProvider(state.endpoint),
        typesBundle,
      }),
      cryptoWaitReady(),
      web3Enable(state.originName),
    ]);
    state.api = api;
    const accounts = await web3Accounts({ ss58Format: api.registry.chainSS58 });
    setAccounts(accounts);
    web3AccountsSubscribe((accounts) => setAccounts(accounts), {
      ss58Format: api.registry.chainSS58,
    });
    state.status = "ready";
    const [chain, properties] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.properties(),
    ]);
    state.chain = chain.toHuman();
    state.tokenSymbol = (
      properties.tokenSymbol.toJSON() as string[] | undefined
    )?.[0];
    state.tokenDecimals = (
      properties.tokenDecimals.toJSON() as number[] | undefined
    )?.[0];
  } catch (err) {
    logError("Fail to init:", err);
    state.status = "error";
  }
}

export async function selectAccount(account: Account) {
  if (state.selectedAccount?.address !== account.address) {
    state.selectedAccount = account;
    state.injectedAccount = await web3FromAddress(account.address);
  }
}

export async function initWeb3Signer() {
  if (!state.injectedAccount) {
    if (!state.selectedAccount) {
      return false;
    }
  }
}

export interface WaitSignAndSendArgs {
  extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>;
  onstatus?: (status: ExtrinsicStatus) => void;
}

export async function waitSignAndSend(args: WaitSignAndSendArgs) {
  const { selectedAccount, injectedAccount, api } = state;
  if (!api || !selectedAccount || !injectedAccount)
    throw new Error("Api is not ready");

  const { extrinsic, onstatus } = args;
  const extrinsicResultPromise = new Promise<Hash>((resolve, reject) => {
    extrinsic
      .signAndSend(
        selectedAccount.address as string,
        { signer: injectedAccount.signer, nonce: -1 },
        ({ events, status }) => {
          if (status.isFinalized || status.isInBlock) {
            const failures = events.filter(({ event }) => {
              return api.events.system.ExtrinsicFailed.is(event);
            });

            const errors = failures.map(
              ({
                event: {
                  data: [error],
                },
              }) => {
                if ((error as DispatchError)?.isModule?.valueOf()) {
                  // https://polkadot.js.org/docs/api/cookbook/tx#how-do-i-get-the-decoded-enum-for-an-extrinsicfailed-event
                  const decoded = api.registry.findMetaError(
                    (error as DispatchError).asModule
                  );
                  const { docs, method, section } = decoded;

                  reject(new ExtrinsicFailedError(section, method, docs));
                } else {
                  reject(
                    new SimpleExtrinsicFailedError(
                      error?.toString() ?? String.toString.call(error)
                    )
                  );
                }
              }
            );

            if (errors.length === 0) {
              resolve(status.hash);
            } else {
              reject(errors);
            }
          }

          onstatus?.(status);
        }
      )
      .then((unsubscribe) => {
        extrinsicResultPromise.finally(() => unsubscribe());
      })
      .catch((reason) => {
        reject(new ExtrinsicSendError((reason as Error)?.message ?? reason));
      });
  });

  return extrinsicResultPromise;
}

export class SimpleExtrinsicFailedError extends Error {
  constructor(error: string) {
    super(`Extrinsic Failed: ${error}`);
  }
}

export class ExtrinsicFailedError extends SimpleExtrinsicFailedError {
  constructor(section: string, method: string, documentation: string[]) {
    super(`Extrinsic Failed: ${section}.${method}: ${documentation.join(" ")}`);
  }
}

export class ExtrinsicSendError extends Error {}

async function setAccounts(accounts: InjectedAccountWithMeta[]) {
  state.accounts = accounts;
  const saved = localStorage.getItem("account");
  if (saved) {
    try {
      const account: Account = JSON.parse(saved);
      if (accounts.find((v) => v.address === account.address)) {
        state.selectedAccount = account;
      }
    } catch {}
  }
}
