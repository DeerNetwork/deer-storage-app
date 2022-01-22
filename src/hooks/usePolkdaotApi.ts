import { ApiPromise } from "@polkadot/api";
import { useSnapshot } from "valtio";
import * as polkadotStore from "../store/polkadot";

interface UsePolkadotApiResult {
  api?: ApiPromise;
  tokenSymbol?: string;
  tokenDecimals?: number;
}

const usePolkadotApi = () => {
  const { api, tokenDecimals, tokenSymbol } = useSnapshot(polkadotStore.state, {
    sync: true,
  });
  return { api, tokenDecimals, tokenSymbol } as UsePolkadotApiResult;
};

export default usePolkadotApi;
