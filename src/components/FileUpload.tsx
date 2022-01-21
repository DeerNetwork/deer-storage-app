import { styled } from "@mui/material/styles";
import { Button, Box, LinearProgress } from "@mui/material";
import { useState } from "react";
import axios from "axios";
import { useSnapshot } from "valtio";
import * as ipfsStore from "../store/ipfs";
import { IpfsFile } from "../types";

const Input = styled("input")({
  display: "none",
});

interface Props {
  onFinish: (file: IpfsFile) => void;
}

export default ({ onFinish }: Props) => {
  const { ipfsServer, auth } = useSnapshot(ipfsStore.state);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const handleUpload = async (file: File) => {
    setProgress(0);
    setFile(file);
    const form = new FormData();
    form.append("file", file);
    const {
      data: { Hash, Size, Name },
    } = await axios({
      url: ipfsServer + "/api/v0/add",
      method: "post",
      data: form,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (e) => {
        const percent = (e.loaded / e.total) * 100;
        setProgress(percent);
      },
    });
    onFinish({ Hash, Size, Name });
  };
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
      <Box sx={{ fontSize: "1.2rem" }}>
        Select a file then upload it to ipfs gateway
      </Box>
      {file && (
        <Box sx={{ width: "300px" }}>
          <Box>{file.name}</Box>
          <Box sx={{ width: "100%" }}>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        </Box>
      )}
      <Box sx={{ mt: 3 }}>
        <label htmlFor="ipfs-button-file">
          <Input
            id="ipfs-button-file"
            type="file"
            onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
          />
          <Button variant="contained" component="span" disabled={!!file}>
            Upload
          </Button>
        </label>
      </Box>
    </Box>
  );
};
