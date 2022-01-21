import { ApiPromise, WsProvider } from "@polkadot/api";
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
  chain: string;
  endpoint: string;
  accounts: InjectedAccountWithMeta[];
  selectedAccount?: Account;
  injectedAccount?: InjectedExtension;
  api?: ApiPromise;
}

const logError = console.error.bind(console, "[PolkadotStore]");

export const state = proxy<PolkadotState>({
  status: "uninitialized",
  originName: "Deer Operator",
  chain: "Deer network",
  endpoint:
    localStorage.getItem("endpoint") ||
    process.env.ENDPOINT ||
    "wss://pretest-ws.deernetwork.vip",
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
    const chain = await api.rpc.system.chain();
    state.chain = chain.toHuman();
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
