"use client";

import { useEffect, useState } from "react";
import CampaignCard from "@/components/CampaignCard";
import { Campaign, useContract } from "@/hooks/contract";
import { CampaignMeta, fetchCampaignsMeta } from "@/lib/utils";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<
    Array<{ id: number; data: Campaign; meta?: CampaignMeta | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "funded" | "failed">("all");
  const { getCampaignIds, getCampaign } = useContract();

  useEffect(() => {
    async function load() {
      try {
        const ids = await getCampaignIds();
        const metas = await fetchCampaignsMeta();

        const items = await Promise.all(
          ids.map(async (id) => {
            const data = await getCampaign(id);
            const meta = metas.find((m) => m.id === id);
            return data ? { id, data, meta } : null;
          })
        );

        setCampaigns(
          items.filter(Boolean) as Array<{
            id: number;
            data: Campaign;
            meta?: CampaignMeta | null;
          }>
        );
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getCampaignIds, getCampaign]);

  const filtered = campaigns.filter((item) => {
    if (filter === "active") return !item.data.withdrawn && item.data.total_raised < item.data.goal;
    if (filter === "funded") return item.data.total_raised >= item.data.goal;
    if (filter === "failed") return item.data.withdrawn === false && item.data.total_raised < item.data.goal;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Explore Campaigns
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Discover projects and contribute to the ones you believe in.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "funded", label: "Funded" },
          { key: "failed", label: "Failed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({campaigns.filter((c) => {
                  if (tab.key === "active") return !c.data.withdrawn && c.data.total_raised < c.data.goal;
                  if (tab.key === "funded") return c.data.total_raised >= c.data.goal;
                  if (tab.key === "failed") return c.data.withdrawn === false && c.data.total_raised < c.data.goal;
                  return true;
                }).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="aspect-[16/9] rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-16 text-center dark:border-zinc-800">
          <svg
            className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            No campaigns found
          </h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Try a different filter or be the first to create a campaign.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <CampaignCard
              key={item.id}
              campaign={item.data}
              meta={item.meta}
              campaignId={item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
