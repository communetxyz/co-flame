import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Co-Flame",
  projectId: "co-flame-demo", // WalletConnect project ID (placeholder for MVP)
  chains: [sepolia],
  ssr: true,
});
