import { useCallback } from "react";
import { BN } from "@polkadot/util";
import usePolkadotApi from "./usePolkdaotApi";

type Format = (
  value: BN | number | undefined | null,
  option?: { unit: string | null }
) => string;

const useFormat = (): Format => {
  const { tokenSymbol, tokenDecimals } = usePolkadotApi();

  return useCallback<Format>((value, option) => {
    if (
      (typeof value === "number" && Number.isNaN(value)) ||
      typeof value === "undefined" ||
      value === null
    ) {
      return "-";
    }

    const { unit = tokenSymbol } = option || {};
    if (tokenDecimals && (value || value === 0)) {
      return `${toFixed(new BN(value), tokenDecimals)}${
        unit ? ` ${unit}` : ""
      }`;
    }
    return "-";
  }, []);
};

export default useFormat;

export function toFixed(
  value: BN,
  decimals: number,
  fractionDigits = 4
): string {
  const valueStr = value.toString();
  const valueLen = valueStr.length;
  if (valueStr.length <= decimals) {
    return (
      "0." + "0".repeat(decimals - valueLen) + valueStr.slice(0, fractionDigits)
    );
  }
  const int = valueStr.slice(0, valueLen - decimals);
  const frac = valueStr.slice(
    valueLen - decimals,
    valueLen - decimals + fractionDigits
  );
  return int + "." + frac;
}
