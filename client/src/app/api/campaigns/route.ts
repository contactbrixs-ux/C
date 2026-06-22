import { NextRequest, NextResponse } from "next/server";

// In-memory store for off-chain campaign metadata
// In production, replace with your database (PostgreSQL, MongoDB, etc.)
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

export async function GET() {
  const campaigns = Array.from(campaignsMeta.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, imageUrl, category, creatorAddress } = body;

    if (!id || !title || !creatorAddress) {
      return NextResponse.json(
        { error: "Missing required fields: id, title, creatorAddress" },
        { status: 400 }
      );
    }

    const meta = {
      id,
      title,
      description: description || "",
      imageUrl: imageUrl || "",
      category: category || "General",
      creatorAddress,
      createdAt: Date.now(),
    };

    campaignsMeta.set(id, meta);
    return NextResponse.json(meta, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
