import { NextRequest, NextResponse } from "next/server";
import { runPeriodicReportsIfDue } from "@/lib/periodic-report";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPeriodicReportsIfDue();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal kirim laporan periodik" },
      { status: 500 }
    );
  }
}
