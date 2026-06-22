"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useContract } from "@/hooks/contract";
import { saveCampaignMeta } from "@/lib/utils";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { address, isConnected, connect } = useWallet();
  const { createCampaign } = useContract();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "",
    deadlineDays: "30",
    token: "",
    imageUrl: "",
    category: "Technology",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"details" | "confirm">("details");

  // Default token (XLM address on testnet)
  const XLM_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_XLM_TOKEN || 
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

  const categories = [
    "Technology",
    "Community",
    "Arts & Culture",
    "Education",
    "Health",
    "Environment",
    "Business",
    "Other",
  ];

  const goalInSmallest = formData.goal
    ? BigInt(Math.round(parseFloat(formData.goal) * 10_000_000))
    : 0n;

  const deadlineTimestamp = BigInt(
    Math.floor(Date.now() / 1000) +
      parseInt(formData.deadlineDays || "30") * 86400
  );

  async function handleCreate() {
    if (!address) return;
    setLoading(true);
    setError(null);

    try {
      // Create on-chain campaign
      const { id, error } = await createCampaign(
        address,
        formData.title,
        goalInSmallest,
        deadlineTimestamp,
        formData.token || XLM_TOKEN_ADDRESS
      );

      if (id === null) {
        setError(error || "Failed to create campaign on-chain. Please try again.");
        return;
      }

      // Save off-chain metadata
      await saveCampaignMeta({
        id,
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        category: formData.category,
        creatorAddress: address,
        createdAt: Date.now(),
      });

      // Redirect to campaign page
      router.push(`/campaigns/${id}`);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <svg
          className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">
          Connect Your Wallet
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          You need to connect your Freighter wallet to create a campaign.
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

  if (step === "confirm") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Confirm Campaign
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Please review your campaign details before submitting.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Title
              </span>
              <p className="mt-1 font-medium text-zinc-900 dark:text-white">
                {formData.title}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Category
              </span>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                {formData.category}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Goal
              </span>
              <p className="mt-1 font-mono text-zinc-700 dark:text-zinc-300">
                {formData.goal} XLM
              </p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Duration
              </span>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                {formData.deadlineDays} days
              </p>
            </div>
            {formData.description && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Description
                </span>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {formData.description.slice(0, 200)}
                  {formData.description.length > 200 ? "..." : ""}
                </p>
              </div>
            )}
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <strong>⚠️ One-time action:</strong> This will create a smart
              contract transaction on Stellar testnet. A small fee in XLM will
              be charged.
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep("details")}
              className="rounded-xl bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              ← Edit
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Confirm & Create Campaign"
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Launch a Campaign
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Fill in the details below to start your crowdfunding campaign on
          Stellar.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep("confirm");
          }}
          className="mt-8 space-y-6"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Campaign Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g., Help Build a School in Rural Area"
              className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((f) => ({ ...f, category: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Tell people about your campaign, what you're raising funds for, and why they should support you..."
              className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          {/* Goal + Duration */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Funding Goal (XLM) *
              </label>
              <input
                type="number"
                required
                min="0.0000001"
                step="0.0000001"
                value={formData.goal}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, goal: e.target.value }))
                }
                placeholder="1000"
                className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Duration (days) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="365"
                value={formData.deadlineDays}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, deadlineDays: e.target.value }))
                }
                className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData((f) => ({ ...f, imageUrl: e.target.value }))
              }
              placeholder="https://example.com/image.jpg"
              className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          {/* Token Address */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Token Contract Address (optional, defaults to XLM)
            </label>
            <input
              type="text"
              value={formData.token}
              onChange={(e) =>
                setFormData((f) => ({ ...f, token: e.target.value }))
              }
              placeholder={XLM_TOKEN_ADDRESS}
              className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-mono text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
            <strong>Summary:</strong> Raising{" "}
            {formData.goal || "..."} XLM over{" "}
            {formData.deadlineDays || "..."} days. A one-time network fee
            applies for contract interaction.
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-500 hover:to-purple-500"
          >
            Review Campaign →
          </button>
        </form>
      </div>
    </div>
  );
}
