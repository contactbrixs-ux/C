"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Campaign, useContract } from "@/hooks/contract";
import { useWallet } from "@/hooks/useWallet";
import {
  CampaignMeta,
  fetchCampaignMeta,
  formatAmount,
  formatDate,
  formatTimeRemaining,
  shortAddress,
} from "@/lib/utils";

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const campaignId = parseInt(id, 10);
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const {
    getCampaign,
    getContribution,
    contribute,
    withdraw,
    refund,
  } = useContract();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [meta, setMeta] = useState<CampaignMeta | null>(null);
  const [contribution, setContribution] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [campaignData, campaignMeta] = await Promise.all([
          getCampaign(campaignId),
          fetchCampaignMeta(campaignId),
        ]);
        if (!campaignData) {
          return;
        }
        setCampaign(campaignData);
        setMeta(campaignMeta);

        if (address) {
          const contrib = await getContribution(campaignId, address);
          setContribution(contrib);
        }
      } catch (err) {
        console.error("Failed to load campaign:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaignId, getCampaign, getContribution, address]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="aspect-[2/1] rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Campaign Not Found
        </h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          This campaign doesn&apos;t exist or was removed.
        </p>
        <Link
          href="/campaigns"
          className="mt-6 inline-flex rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Browse Campaigns
        </Link>
      </div>
    );
  }

  const progress =
    campaign.goal > 0n
      ? Number((campaign.total_raised * 100n) / campaign.goal)
      : 0;
  const timeLeft = formatTimeRemaining(campaign.deadline);
  const isEnded = timeLeft === "Ended";
  const isSuccessful = campaign.total_raised >= campaign.goal && isEnded;
  const isFailed = campaign.total_raised < campaign.goal && isEnded;
  const isCreator = address?.toLowerCase() === campaign.creator.toLowerCase();
  const hasContributed = contribution > 0n;

  async function handleContribute() {
    if (!address || !campaign || !contributeAmount) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const amount = BigInt(Math.round(parseFloat(contributeAmount) * 10_000_000));
      if (amount <= 0n) {
        setActionError("Please enter a valid amount");
        return;
      }
      const success = await contribute(address, campaignId, amount);
      if (success) {
        setActionSuccess(
          `Successfully contributed ${contributeAmount} XLM!`
        );
        setContributeAmount("");
        // Refresh
        const updated = await getCampaign(campaignId);
        if (updated) setCampaign(updated);
        const contrib = await getContribution(campaignId, address);
        setContribution(contrib);
      } else {
        setActionError("Transaction failed. Please try again.");
      }
    } catch (err: any) {
      setActionError(err?.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!address) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const success = await withdraw(address, campaignId);
      if (success) {
        setActionSuccess("Funds withdrawn successfully!");
        const updated = await getCampaign(campaignId);
        if (updated) setCampaign(updated);
      } else {
        setActionError("Withdrawal failed.");
      }
    } catch (err: any) {
      setActionError(err?.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRefund() {
    if (!address) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const success = await refund(address, campaignId);
      if (success) {
        setActionSuccess("Refund claimed successfully!");
        const contrib = await getContribution(campaignId, address);
        setContribution(contrib);
      } else {
        setActionError("Refund failed.");
      }
    } catch (err: any) {
      setActionError(err?.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Image */}
      <div className="aspect-[2/1] overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50">
        {meta?.imageUrl ? (
          <img
            src={meta.imageUrl}
            alt={campaign.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-16 w-16 text-indigo-300 dark:text-indigo-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left: Campaign Details */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              {meta?.category && (
                <span className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {meta.category}
                </span>
              )}
              <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">
                {campaign.title}
              </h1>
            </div>
            {isSuccessful && (
              <span className="shrink-0 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                ✓ Funded
              </span>
            )}
            {isFailed && (
              <span className="shrink-0 rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                ✕ Failed
              </span>
            )}
          </div>

          {/* Creator Info */}
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              by <span className="font-medium text-zinc-700 dark:text-zinc-300">{shortAddress(campaign.creator)}</span>
            </span>
            <span>•</span>
            <span>Deadline: {formatDate(campaign.deadline)}</span>
            <span>•</span>
            <span>{timeLeft}</span>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              About this campaign
            </h2>
            <div className="mt-3 text-zinc-600 leading-relaxed dark:text-zinc-400">
              {meta?.description ? (
                <p>{meta.description}</p>
              ) : (
                <p className="italic text-zinc-400">
                  No description provided for this campaign.
                </p>
              )}
            </div>
          </div>

          {/* Token Info */}
          <div className="mt-8 rounded-xl bg-zinc-50 p-5 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Campaign Details
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Token</dt>
                <dd className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {shortAddress(campaign.token)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Goal</dt>
                <dd className="font-medium text-zinc-900 dark:text-white">
                  {formatAmount(campaign.goal)} XLM
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Raised</dt>
                <dd className="font-medium text-zinc-900 dark:text-white">
                  {formatAmount(campaign.total_raised)} XLM
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
                <dd>
                  {campaign.withdrawn ? (
                    <span className="text-amber-600 dark:text-amber-400">Withdrawn</span>
                  ) : isSuccessful ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Ready to withdraw</span>
                  ) : isFailed ? (
                    <span className="text-red-600 dark:text-red-400">Goal not met</span>
                  ) : (
                    <span className="text-indigo-600 dark:text-indigo-400">Active</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right: Actions Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-2xl text-zinc-900 dark:text-white">
                  {formatAmount(campaign.total_raised)}
                </span>
                <span className="text-zinc-400">XLM</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    isSuccessful
                      ? "bg-emerald-500"
                      : isFailed
                      ? "bg-red-500"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-zinc-400">
                <span>{Math.min(progress, 100)}%</span>
                <span>Goal: {formatAmount(campaign.goal)} XLM</span>
              </div>
            </div>

            {/* Your Contribution */}
            {hasContributed && (
              <div className="mb-4 rounded-lg bg-indigo-50 p-3 text-sm dark:bg-indigo-900/20">
                <span className="text-indigo-600 dark:text-indigo-400">
                  Your contribution:{" "}
                  <strong>{formatAmount(contribution)} XLM</strong>
                </span>
              </div>
            )}

            {/* Actions */}
            {!isEnded && !campaign.withdrawn && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Amount (XLM)
                  </label>
                  <input
                    type="number"
                    step="0.0000001"
                    min="0"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    placeholder="10"
                    className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <button
                  onClick={handleContribute}
                  disabled={actionLoading || !isConnected || !contributeAmount}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : !isConnected ? (
                    "Connect Wallet to Contribute"
                  ) : (
                    "Contribute"
                  )}
                </button>
              </div>
            )}

            {/* Creator: Withdraw */}
            {isCreator && isSuccessful && !campaign.withdrawn && (
              <button
                onClick={handleWithdraw}
                disabled={actionLoading}
                className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Withdraw Funds"}
              </button>
            )}

            {/* Contributor: Refund */}
            {hasContributed && isFailed && !campaign.withdrawn && (
              <button
                onClick={handleRefund}
                disabled={actionLoading}
                className="w-full rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-amber-500 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Claim Refund"}
              </button>
            )}

            {/* Messages */}
            {actionError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                {actionSuccess}
              </div>
            )}

            {/* Ended No Action */}
            {isEnded && !isCreator && !hasContributed && (
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                This campaign has ended.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
