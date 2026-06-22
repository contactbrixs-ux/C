import { Address, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";

// === Network Config ===

export const NETWORK_CONFIG = {
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
};

// === Formatting ===

export function formatAmount(amount: bigint | number, decimals: number = 7): string {
  const num = typeof amount === "bigint" ? amount : BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = num / divisor;
  const fraction = num % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fractionStr ? `${whole}.${fractionStr}` : `${whole}`;
}

export function formatDate(timestamp: bigint | number): string {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeRemaining(deadline: bigint | number): string {
  const dl = typeof deadline === "bigint" ? Number(deadline) : deadline;
  const now = Math.floor(Date.now() / 1000);
  if (dl <= now) return "Ended";
  const diff = dl - now;
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h remaining`;
  const mins = Math.floor((diff % 3600) / 60);
  return `${hours}h ${mins}m remaining`;
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || "";
  return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
}

// === Off-Chain Data Types ===

export interface CampaignMeta {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  creatorAddress: string;
  createdAt: number;
}

// === API Helpers ===

const API_BASE = "/api";

export async function fetchCampaignsMeta(): Promise<CampaignMeta[]> {
  try {
    const res = await fetch(`${API_BASE}/campaigns`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchCampaignMeta(id: number): Promise<CampaignMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/campaigns/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveCampaignMeta(meta: CampaignMeta): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
    return res.ok;
  } catch {
    return false;
  }
}
