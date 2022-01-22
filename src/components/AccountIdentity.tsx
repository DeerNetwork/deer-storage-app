import Identicon from "@polkadot/react-identicon";
import { Box } from "@mui/material";
import { Account } from "../types";

export interface AccountIdentityProps {
  account: Account;
  size?: "small" | "normal";
  onSelect?: (account: Account) => void;
}

const AccountIdentity = ({
  account,
  size = "normal",
  onSelect,
}: AccountIdentityProps) => {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center" }}
      onClick={() => onSelect && onSelect(account)}
    >
      <Box>
        <Identicon value={account.address} theme={"substrate"} size={32} />
      </Box>
      <Box sx={{ ml: 1 }}>
        <Box sx={{ fontSize: "1.2rem" }}>{account.name}</Box>
        <Box>
          {size === "small" ? toShortAddress(account.address) : account.address}
        </Box>
      </Box>
    </Box>
  );
};

export default AccountIdentity;

function toShortAddress(address: string): string {
  return address.length > 13
    ? `${address.slice(0, 6)}…${address.slice(-6)}`
    : address;
}
