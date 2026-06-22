import { NextRequest, NextResponse } from "next/server";

// Shared in-memory store (same as campaigns/route.ts)
// In production, use a proper database
const campaignsMeta = new Map<
  number,
  {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    creatorAddress: string;
    createdAt: number;
  }
>();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaignId = parseInt(id, 10);
  if (isNaN(campaignId)) {
    return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
  }

  const meta = campaignsMeta.get(campaignId);
  if (!meta) {
    return NextResponse.json(
      { error: "Campaign metadata not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(meta);
}
