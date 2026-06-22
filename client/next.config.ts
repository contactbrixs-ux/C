import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS:
      "CBYTUMUWK5HWAQUYCMM7SQN73WKZYVARS6ZVNDRBDDUM4K7XGQFSWBVZ",
    NEXT_PUBLIC_NETWORK: "testnet",
  },
  turbopack: {
    resolveAlias: {
      contract: "./packages/contract/src",
    },
  },
};

export default nextConfig;
