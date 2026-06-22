"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CampaignCard from "@/components/CampaignCard";
import { Campaign, useContract } from "@/hooks/contract";
import { CampaignMeta, fetchCampaignsMeta } from "@/lib/utils";

export default function Home() {
  const [campaigns, setCampaigns] = useState<
    Array<{ id: number; data: Campaign; meta?: CampaignMeta | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCampaigns: 0, totalRaised: "0" });
  const { getCampaignIds, getCampaign } = useContract();

  useEffect(() => {
    async function loadCampaigns() {
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

        const validItems = items.filter(Boolean) as Array<{
          id: number;
          data: Campaign;
          meta?: CampaignMeta | null;
        }>;
        setCampaigns(validItems);

        const total = validItems.reduce(
          (sum, item) => sum + item.data.total_raised,
          0n
        );
        setStats({
          totalCampaigns: validItems.length,
          totalRaised: (Number(total) / 10_000_000).toFixed(2),
        });
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, [getCampaignIds, getCampaign]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Decentralized
              <span className="text-pink-200"> Crowdfunding</span>
              <br />
              on Stellar
            </h1>
            <p className="mt-6 text-lg leading-8 text-indigo-100">
              Launch your idea, raise funds from the community, and build
              together — all powered by Soroban smart contracts on the Stellar
              network. Transparent, secure, and truly decentralized.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/create"
                className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl"
              >
                Start a Campaign
              </Link>
              <Link
                href="/campaigns"
                className="rounded-full border-2 border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10"
              >
                Explore Campaigns
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-zinc-950" />
      </section>

      {/* Stats Bar */}
      <section className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.totalCampaigns}
              </div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Campaigns
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.totalRaised}
              </div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                XLM Raised
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {campaigns.filter((c) => c.data.total_raised >= c.data.goal).length}
              </div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Funded
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {campaigns.filter((c) => !c.data.withdrawn && c.data.total_raised < c.data.goal).length}
              </div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Featured Campaigns
            </h2>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              Discover and support amazing projects
            </p>
          </div>
          <Link
            href="/campaigns"
            className="hidden rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 sm:inline-block"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
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
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-16 text-center dark:border-zinc-800">
            <svg
              className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
              No campaigns yet
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Be the first to launch a crowdfunding campaign on Stellar.
            </p>
            <Link
              href="/create"
              className="mt-6 inline-flex rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Launch Campaign
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.slice(0, 6).map((item) => (
              <CampaignCard
                key={item.id}
                campaign={item.data}
                meta={item.meta}
                campaignId={item.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              How It Works
            </h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Three simple steps to launch or support a campaign
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Connect Wallet",
                desc: "Connect your Freighter wallet to get started. Your wallet is your identity on Stellar.",
                icon: "🔗",
              },
              {
                step: "2",
                title: "Create or Contribute",
                desc: "Launch your own campaign with a goal and deadline, or support projects you believe in.",
                icon: "🚀",
              },
              {
                step: "3",
                title: "Achieve or Refund",
                desc: "If the goal is met, funds go to the creator. If not, contributors get a full refund.",
                icon: "✅",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
              >
                <span className="text-4xl">{item.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
