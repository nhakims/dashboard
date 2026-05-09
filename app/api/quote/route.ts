import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://zenquotes.io/api/random", { next: { revalidate: 86400 } });
  if (!res.ok) return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  const data = await res.json();
  return NextResponse.json(data[0]);
}
