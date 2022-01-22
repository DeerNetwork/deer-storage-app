import { useState } from "react";
import { Box, Typography, Stepper, Step, StepLabel } from "@mui/material";
import { useSnapshot } from "valtio";

import ConnectWallet from "./components/ConnectWallet";
import LoginIpfsGateway from "./components/LoginIpfsGateway";
import FileUpload from "./components/FileUpload";
import SaveToChain from "./components/SaveToChain";
import * as polkadotStore from "./store/polkadot";
import { IpfsFile } from "./types";

const steps = [
  "Connect Wallet",
  "Login ipfs gateway",
  "Upload file",
  "Save on chain",
];

function App() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<IpfsFile | null>(null);
  const { chain } = useSnapshot(polkadotStore.state);
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ textAlign: "center", p: 3 }}>
        <Typography variant="h4" component="h2">
          Save file to {chain}
        </Typography>
      </Box>
      <Stepper activeStep={step} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {step === 0 && <ConnectWallet onFinish={() => setStep(1)} />}
      {step === 1 && <LoginIpfsGateway onFinish={() => setStep(2)} />}
      {step === 2 && (
        <FileUpload
          onFinish={(file) => {
            setStep(3);
            setFile(file);
          }}
        />
      )}
      {step === 3 && !!file && (
        <SaveToChain file={file} onBack={() => setStep(step - 1)} />
      )}
    </Box>
  );
}

export default App;
