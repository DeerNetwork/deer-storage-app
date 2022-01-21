import { useSnapshot } from "valtio";
import * as ipfsStore from "../store/ipfs";
import { Box, Alert, CircularProgress, Button } from "@mui/material";

interface Props {
  onFinish: () => void;
}

export default ({ onFinish }: Props) => {
  const handleClick = async () => {
    const ok = await ipfsStore.login();
    if (ok) {
      onFinish();
    }
  };
  const { authStatus, authError } = useSnapshot(ipfsStore.state);
  const Status = () => {
    if (authStatus === "error") {
      return <Alert severity="error">{authError}</Alert>;
    } else if (authStatus === "success") {
      return <div></div>;
    } else if (authStatus === "pending") {
      return <CircularProgress />;
    } else {
      return (
        <div>
          <Button onClick={() => handleClick()} variant="text">
            Sign
          </Button>{" "}
          <Box sx={{ fontSize: "1.2rem", display: "inline" }}>
            an message with your wallet to login to ipfs server.
          </Box>
        </div>
      );
    }
  };
  return (
    <Box
      sx={{ display: "flex", width: "100%", justifyContent: "center", mt: 3 }}
    >
      <Status />
    </Box>
  );
};
