import { useSnackbar } from "notistack";
import * as polkadotStore from "../store/polkadot";

const useWaitSignAndSend = (): ((
  args: polkadotStore.WaitSignAndSendArgs
) => Promise<
  | (typeof polkadotStore.waitSignAndSend extends (
      ...args: any
    ) => Promise<infer U>
      ? U
      : never)
  | void
>) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  return async ({ extrinsic, onstatus }) => {
    const extrinsicId = extrinsic.hash.toString();
    return polkadotStore
      .waitSignAndSend({
        extrinsic,
        onstatus: (status) => {
          if (status.isReady) {
            enqueueSnackbar("Submitting transaction", {
              key: extrinsicId,
              variant: "default",
            });
          }
          onstatus?.(status);
        },
      })
      .then((res) => {
        closeSnackbar(extrinsicId);
        enqueueSnackbar("Transaction in block", {
          key: extrinsicId + ":success",
          variant: "success",
          autoHideDuration: 3000,
        });
        return res;
      })
      .catch((err) => {
        closeSnackbar(extrinsicId);
        enqueueSnackbar(err?.message, {
          key: extrinsicId + ":error",
          variant: "error",
          autoHideDuration: 5000,
        });
        throw err;
      });
  };
};

export default useWaitSignAndSend;
