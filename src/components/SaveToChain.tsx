import { Box, Button, TextField } from "@mui/material";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSnapshot } from "valtio";
import { BN } from "@polkadot/util";
import * as polkadotStore from "../store/polkadot";
import useFormat from "../hooks/useFormat";
import { IpfsFile } from "../types";
import useWaitSignAndSend from "../hooks/useWaitSignAndSend";

export interface SaveToChainProps {
  file: IpfsFile;
  onBack: () => void;
}

const SaveToChain = ({ file, onBack }: SaveToChainProps) => {
  const [fee, setFee] = useState(new BN(0));
  const [days, setDays] = useState(180);
  const waitSignAndSend = useWaitSignAndSend();
  const { api } = useSnapshot(polkadotStore.state);
  const format = useFormat();
  useEffect(() => {
    const run = async () => {
      if (!api) return;
      const storeFee = await api.rpc.fileStorage.storeFee(
        file.Size,
        14400 * days
      );
      setFee(storeFee.fee.toBn());
    };
    run();
  }, [days, api, file]);
  const action = useMemo(() => {
    if (api) {
      return api.tx.fileStorage.store(file.Hash, file.Size, fee);
    } else {
      return;
    }
  }, [api, file, fee]);
  const onConfirm = useCallback(async () => {
    if (action) {
      return waitSignAndSend({ extrinsic: action });
    }
  }, [action, waitSignAndSend]);
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        mt: 3,
      }}
    >
      <Box sx={{ fontSize: "1.2rem" }}>Save to file to chain</Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <TextField
          id="hash"
          label="Hash"
          value={file.Hash}
          variant="standard"
          disabled
        />
        <TextField
          id="size"
          label="Size"
          value={file.Size}
          variant="standard"
          disabled
        />
        <TextField
          id="days"
          label="Days"
          value={days}
          type={"number"}
          onChange={(e) => {
            setDays(parseInt(e.target.value));
          }}
          variant="standard"
        />
        <TextField
          id="fee"
          label="Fee"
          value={format(fee)}
          variant="standard"
          disabled
        />
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={onConfirm}>
            Save
          </Button>
          <Button sx={{ ml: 1 }} variant="outlined" onClick={onBack}>
            Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SaveToChain;
