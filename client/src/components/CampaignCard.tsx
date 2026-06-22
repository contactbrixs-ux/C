"use client";

import Link from "next/link";
import { Campaign } from "@/hooks/contract";
import { CampaignMeta, formatAmount, formatTimeRemaining, shortAddress } from "@/lib/utils";

interface CampaignCardProps {
  campaign: Campaign;
  meta?: CampaignMeta | null;
  campaignId: number;
}

export default function CampaignCard({
  campaign,
  meta,
  campaignId,
}: CampaignCardProps) {
  const progress =
    campaign.goal > 0n
      ? Number((campaign.total_raised * 100n) / campaign.goal)
      : 0;
  const timeLeft = formatTimeRemaining(campaign.deadline);
  const isEnded = timeLeft === "Ended";
  const isSuccessful = campaign.total_raised >= campaign.goal && isEnded;
  const isFailed = campaign.total_raised < campaign.goal && isEnded;

  return (
    <Link
      href={`/campaigns/${campaignId}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50">
        {meta?.imageUrl ? (
          <img
            src={meta.imageUrl}
            alt={campaign.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-12 w-12 text-indigo-300 dark:text-indigo-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
        <div className="absolute right-3 top-3">
          {isSuccessful ? (
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
              Funded
            </span>
          ) : isFailed ? (
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
              Failed
            </span>
          ) : campaign.withdrawn ? (
            <span className="rounded-full bg-zinc-500 px-3 py-1 text-xs font-semibold text-white">
              Withdrawn
            </span>
          ) : (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700 backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-300">
              {timeLeft}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {meta?.category && (
          <span className="mb-2 text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {meta.category}
          </span>
        )}
        <h3 className="text-lg font-semibold leading-tight text-zinc-900 dark:text-white line-clamp-2">
          {campaign.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {meta?.description || "No description available."}
        </p>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {formatAmount(campaign.total_raised)} XLM
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              raised of {formatAmount(campaign.goal)} XLM
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
        </div>

        {/* Creator */}
        <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span>by {shortAddress(campaign.creator)}</span>
        </div>
      </div>
    </Link>
  );
}
