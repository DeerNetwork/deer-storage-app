import { proxy } from "valtio";
import * as base64 from "js-base64";
import * as polkadotStore from "./polkadot";
import axios from "axios";

export interface IpfsState {
  ipfsServer: string;
  auth?: string;
  authStatus?: "pending" | "success" | "error";
  authError?: string;
}

export const state = proxy<IpfsState>({
  ipfsServer:
    localStorage.getItem("ipfsServer") ||
    process.env.REACT_APP_IPFS_SERVER ||
    "https://testnet-ipfs.deernetwork.vip",
  auth: localStorage.getItem("ipfsAuth") || undefined,
});

export async function login() {
  state.authStatus = "pending";
  const { injectedAccount, selectedAccount } = polkadotStore.state;
  if (!injectedAccount || !selectedAccount || !injectedAccount.signer.signRaw) {
    state.authError = "Have not connected to web3 account?";
    state.authStatus = "error";
    return false;
  }
  const { address } = selectedAccount;
  let message: string;
  try {
    const {
      data: { nonce },
    } = await axios({
      url: `${state.ipfsServer}/nonce?address=${address}`,
    });
    message = `login to deer ipfs gateway, nonce=${nonce}`;
  } catch (err) {
    state.authError = "Fail to fetch nonce from ipfs server";
    state.authStatus = "error";
    return false;
  }

  let signature;
  try {
    const result = await injectedAccount.signer.signRaw({
      type: "bytes",
      address,
      data: message,
    });
    signature = result.signature;
  } catch (err) {
    state.authError = "Fail to sign the message";
    state.authStatus = "error";
    return false;
  }
  try {
    const {
      data: { address: user, secret },
    } = await axios({
      url: `${state.ipfsServer}/login`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        signature,
        address,
      },
    });
    const auth = base64.encode(`${user}:${secret}`);
    state.auth = auth;
    state.authStatus = "success";
    return true;
  } catch (err) {
    state.authError = "Fail to login to ipfs server";
    state.authStatus = "error";
    return false;
  }
}
