import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, period, summary } = await request.json();

  console.info(
    `[Aurora Finance] Scheduled ${period} analytics email for ${email}: ${summary ?? "no summary"}`,
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}
