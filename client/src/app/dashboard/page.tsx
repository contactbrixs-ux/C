"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { Campaign, useContract } from "@/hooks/contract";
import { CampaignMeta, fetchCampaignsMeta, formatAmount, formatTimeRemaining } from "@/lib/utils";

export default function DashboardPage() {
  const { address, isConnected, connect } = useWallet();
  const { getCampaignIds, getCampaign, getContribution } = useContract();

  const [myCampaigns, setMyCampaigns] = useState<
    Array<{ id: number; data: Campaign; meta?: CampaignMeta | null }>
  >([]);
  const [myContributions, setMyContributions] = useState<
    Array<{ id: number; data: Campaign; amount: bigint; meta?: CampaignMeta | null }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const ids = await getCampaignIds();
        const metas = await fetchCampaignsMeta();

        const campaigns = await Promise.all(
          ids.map(async (id) => {
            const data = await getCampaign(id);
            const meta = metas.find((m) => m.id === id);
            return { id, data, meta };
          })
        );

        const valid = campaigns.filter((c) => c.data) as Array<{
          id: number;
          data: Campaign;
          meta?: CampaignMeta | null;
        }>;

        // Campaigns I created
        const created = valid.filter(
          (c) => c.data.creator.toLowerCase() === address.toLowerCase()
        );
        setMyCampaigns(created);

        // Campaigns I contributed to
        const contributed = await Promise.all(
          valid.map(async (c) => {
            const amount = await getContribution(c.id, address);
            return amount > 0n
              ? { ...c, amount }
              : null;
          })
        );
        setMyContributions(
          contributed.filter(Boolean) as Array<{
            id: number;
            data: Campaign;
            amount: bigint;
            meta?: CampaignMeta | null;
          }>
        );
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address, getCampaignIds, getCampaign, getContribution]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <svg
          className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Connect your wallet to view your campaigns and contributions.
        </p>
        <button
          onClick={connect}
          className="mt-6 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalContributed = myContributions.reduce(
    (sum, c) => sum + c.amount,
    0n
  );
  const totalRaisedFromMine = myCampaigns.reduce(
    (sum, c) => sum + c.data.total_raised,
    0n
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage your campaigns and track your contributions.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {myCampaigns.length}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Campaigns Created
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatAmount(totalRaisedFromMine).slice(0, 8)}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            XLM Raised
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatAmount(totalContributed).slice(0, 8)}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            XLM Contributed
          </div>
        </div>
      </div>

      {/* My Campaigns */}
      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            My Campaigns
          </h2>
          <Link
            href="/create"
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            + New Campaign
          </Link>
        </div>

        {myCampaigns.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">
              You haven&apos;t created any campaigns yet.
            </p>
            <Link
              href="/create"
              className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Create your first campaign →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myCampaigns.map((item) => (
              <Link
                key={item.id}
                href={`/campaigns/${item.id}`}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 text-sm font-bold text-indigo-700 dark:from-indigo-900/50 dark:to-purple-900/50 dark:text-indigo-400">
                  #{item.id}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-zinc-900 truncate dark:text-white">
                    {item.data.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatAmount(item.data.total_raised)} /{" "}
                    {formatAmount(item.data.goal)} XLM •{" "}
                    {formatTimeRemaining(item.data.deadline)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {item.data.total_raised > 0n
                      ? `${Number((item.data.total_raised * 100n) / item.data.goal)}%`
                      : "0%"}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {item.data.withdrawn
                      ? "Withdrawn"
                      : item.data.total_raised >= item.data.goal
                      ? "Goal met"
                      : "Active"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* My Contributions */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
          My Contributions
        </h2>

        {myContributions.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">
              You haven&apos;t contributed to any campaigns yet.
            </p>
            <Link
              href="/campaigns"
              className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Explore campaigns →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myContributions.map((item) => (
              <Link
                key={item.id}
                href={`/campaigns/${item.id}`}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 text-sm font-bold text-emerald-700 dark:from-emerald-900/50 dark:to-teal-900/50 dark:text-emerald-400">
                  {formatAmount(item.amount).slice(0, 4)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-zinc-900 truncate dark:text-white">
                    {item.data.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Contributed {formatAmount(item.amount)} XLM •{" "}
                    {item.data.withdrawn
                      ? "Withdrawn by creator"
                      : item.data.total_raised >= item.data.goal
                      ? "Goal reached 🎉"
                      : formatTimeRemaining(item.data.deadline)}
                  </p>
                </div>
                <div className="text-xs text-zinc-400">
                  #{item.id}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
