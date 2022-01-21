import { Box, Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import * as polkadotStore from "../store/polkadot";
import { IpfsFile } from "../types";

interface Props {
  file: IpfsFile;
}

export default ({ file }: Props) => {
  const [fee, setFee] = useState(0);
  const [days, setDays] = useState(180);
  const { api } = useSnapshot(polkadotStore.state);
  useEffect(() => {
    const run = async () => {
      if (!api) return;
      const storeFee = await api.rpc.fileStorage.storeFee(
        file.Size,
        14400 * days
      );
      setFee(storeFee.fee.toNumber());
    };
    run();
  }, [days, api, file]);
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
          value={fee}
          variant="standard"
          disabled
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained">Save</Button>
      </Box>
    </Box>
  );
};
