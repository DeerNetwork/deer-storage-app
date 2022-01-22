import { useEffect } from "react";
import { useSnapshot } from "valtio";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";

import * as polkadotStore from "../store/polkadot";
import AccountIdentity from "./AccountIdentity";

export interface ConnectWalletProps {
  onFinish: () => void;
}

const ConnectWallet = ({ onFinish }: ConnectWalletProps) => {
  useEffect(() => {
    polkadotStore.init();
  }, []);
  const state = useSnapshot(polkadotStore.state);
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
      {state.status === "uninitialized" && <CircularProgress />}
      {state.status === "ready" && (
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">
              Choose Account
            </Typography>
            <Divider />
            <List>
              {state.accounts.map((account) => (
                <ListItem key={account.address} disablePadding>
                  <ListItemButton>
                    <AccountIdentity
                      onSelect={async (account) => {
                        await polkadotStore.selectAccount(account);
                        onFinish();
                      }}
                      account={{
                        name: account.meta.name,
                        address: account.address,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ConnectWallet;
