"use client";

import { useCallback } from "react";
import { Client, networks, Campaign as ContractCampaign } from "contract";
import { signTransaction } from "@stellar/freighter-api";
import type { u64, i128 } from "@stellar/stellar-sdk/contract";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || networks.testnet.contractId;
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "testnet";

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

// === Contract Types ===

export interface Campaign {
  creator: string;
  title: string;
  goal: bigint;
  deadline: bigint;
  total_raised: bigint;
  withdrawn: boolean;
  token: string;
}

// === RPC Client ===

function createClient() {
  return new Client({
    contractId: CONTRACT_ADDRESS,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
  });
}

// === Wallet Helpers ===

export async function getWalletAddress(): Promise<string | null> {
  try {
    const { isConnected: connected } = await import("@stellar/freighter-api").then(m => m.isConnected());
    if (!connected) return null;
    const { address } = await import("@stellar/freighter-api").then(m => m.getAddress());
    return address;
  } catch {
    return null;
  }
}

// === Transaction Sender (signs with Freighter) ===

async function signWithFreighter(txXdr: string): Promise<{ signedTxXdr: string; signerAddress?: string }> {
  return signTransaction(txXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
}

// === Execute a state-changing transaction: simulate → sign → send → wait for result ===

async function executeTx<T>(
  action: (client: Client) => Promise<import("contract").contract.AssembledTransaction<T>>
): Promise<{ success: boolean; result?: T }> {
  try {
    const client = createClient();
    const tx = await action(client);
    const sent = await tx.signAndSend();
    return {
      success: sent.getTransactionResponse?.status === "SUCCESS",
      result: sent.result,
    };
  } catch (err) {
    console.error("Transaction failed:", err);
    return { success: false };
  }
}

// === Public Hooks ===

export function useContract() {
  const createCampaign = useCallback(
    async (
      creator: string,
      title: string,
      goal: bigint,
      deadline: bigint,
      token: string
    ): Promise<number | null> => {
      const { success, result } = await executeTx<bigint>((client) =>
        client.create_campaign(
          {
            creator,
            title,
            goal: goal as unknown as i128,
            deadline: deadline as unknown as u64,
            token,
          },
          { signTransaction: signWithFreighter }
        )
      );
      if (success && result != null) {
        return Number(result.toString());
      }
      return null;
    },
    []
  );

  const contribute = useCallback(
    async (contributor: string, campaignId: number, amount: bigint): Promise<boolean> => {
      const { success } = await executeTx((client) =>
        client.contribute(
          {
            contributor,
            campaign_id: campaignId as unknown as u64,
            amount: amount as unknown as i128,
          },
          { signTransaction: signWithFreighter }
        )
      );
      return success;
    },
    []
  );

  const withdraw = useCallback(
    async (creator: string, campaignId: number): Promise<boolean> => {
      const { success } = await executeTx((client) =>
        client.withdraw(
          { campaign_id: campaignId as unknown as u64 },
          { signTransaction: signWithFreighter }
        )
      );
      return success;
    },
    []
  );

  const refund = useCallback(
    async (contributor: string, campaignId: number): Promise<boolean> => {
      const { success } = await executeTx((client) =>
        client.refund(
          {
            campaign_id: campaignId as unknown as u64,
            contributor,
          },
          { signTransaction: signWithFreighter }
        )
      );
      return success;
    },
    []
  );

  const getCampaign = useCallback(
    async (campaignId: number): Promise<Campaign | null> => {
      try {
        const client = createClient();
        const tx = await client.get_campaign({
          campaign_id: campaignId as unknown as u64,
        });
        const c = tx.result as unknown as ContractCampaign;
        if (!c) return null;
        return {
          creator: c.creator,
          title: c.title,
          goal: BigInt(c.goal.toString()),
          deadline: BigInt(c.deadline.toString()),
          total_raised: BigInt(c.total_raised.toString()),
          withdrawn: c.withdrawn,
          token: c.token,
        };
      } catch (err) {
        console.error("Error getting campaign:", err);
        return null;
      }
    },
    []
  );

  const getContribution = useCallback(
    async (campaignId: number, contributor: string): Promise<bigint> => {
      try {
        const client = createClient();
        const tx = await client.get_contribution({
          campaign_id: campaignId as unknown as u64,
          contributor,
        });
        return BigInt((tx.result as unknown as bigint).toString());
      } catch (err) {
        console.error("Error getting contribution:", err);
        return 0n;
      }
    },
    []
  );

  const getCampaignCount = useCallback(async (): Promise<number> => {
    try {
      const client = createClient();
      const tx = await client.get_campaign_count();
      return Number((tx.result as unknown as bigint).toString());
    } catch (err) {
      console.error("Error getting campaign count:", err);
      return 0;
    }
  }, []);

  const getCampaignIds = useCallback(async (): Promise<number[]> => {
    try {
      const client = createClient();
      const tx = await client.get_campaign_ids();
      const ids = tx.result as unknown as Array<bigint>;
      return ids.map((id) => Number(id.toString()));
    } catch (err) {
      console.error("Error getting campaign IDs:", err);
      return [];
    }
  }, []);

  return {
    createCampaign,
    contribute,
    withdraw,
    refund,
    getCampaign,
    getContribution,
    getCampaignCount,
    getCampaignIds,
  };
}
