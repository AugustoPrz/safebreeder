import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { supabaseService } from "@/lib/supabase/service";
import { renderHpgReminder } from "@/lib/email/hpg-reminder-template";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://safebreeder.com";
const FROM =
  process.env.RESEND_FROM ?? "Safebreeder <onboarding@resend.dev>";

interface DueRow {
  lot_id: string;
  month_key: string;
  sample_date: string;
  lot_name: string;
  est_name: string;
  user_id: string;
  /** Always non-null when this struct is built — rows without email are skipped earlier. */
  email: string;
}

interface CronResult {
  sent: number;
  skipped: number;
  errors: Array<{ lotId: string; monthKey: string; error: string }>;
}

export async function GET(request: NextRequest) {
  // Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when
  // the deployment has a CRON_SECRET env var set.
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY" },
      { status: 500 },
    );
  }

  const sb = supabaseService();
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Find HPG records sampled exactly 27 days ago that haven't been notified.
  // We resolve names + email in JS because PostgREST doesn't expose auth.users
  // directly. Service-role bypasses RLS so all rows are visible.
  const today = new Date();
  const target = new Date(today);
  target.setUTCDate(target.getUTCDate() - 27);
  const targetIso = target.toISOString().slice(0, 10);

  const { data: hpgRows, error: hpgErr } = await sb
    .from("hpg_records")
    .select("lot_id, month_key, sample_date")
    .eq("sample_date", targetIso)
    .is("reminder_sent_at", null);

  if (hpgErr) {
    return NextResponse.json(
      { error: `hpg_records query failed: ${hpgErr.message}` },
      { status: 500 },
    );
  }

  const result: CronResult = { sent: 0, skipped: 0, errors: [] };
  if (!hpgRows || hpgRows.length === 0) {
    return NextResponse.json({ ...result, target: targetIso });
  }

  // Resolve lot + establishment + owner email in one round-trip per record.
  for (const row of hpgRows) {
    try {
      const lotRes = await sb
        .from("lots")
        .select("id, name, user_id, establishment_id")
        .eq("id", row.lot_id)
        .single();
      if (lotRes.error || !lotRes.data) {
        result.errors.push({
          lotId: row.lot_id,
          monthKey: row.month_key,
          error: `lot not found: ${lotRes.error?.message ?? "missing"}`,
        });
        continue;
      }
      const estRes = await sb
        .from("establishments")
        .select("name")
        .eq("id", lotRes.data.establishment_id)
        .single();

      // Look up the user's email via the auth admin API (service-role only).
      const userRes = await sb.auth.admin.getUserById(lotRes.data.user_id);
      const email = userRes.data.user?.email ?? null;
      if (!email) {
        result.skipped += 1;
        continue;
      }

      const due: DueRow = {
        lot_id: row.lot_id,
        month_key: row.month_key,
        sample_date: row.sample_date,
        lot_name: lotRes.data.name,
        est_name: estRes.data?.name ?? "—",
        user_id: lotRes.data.user_id,
        email,
      };

      const { subject, html, text } = renderHpgReminder({
        lotName: due.lot_name,
        estName: due.est_name,
        sampleDate: due.sample_date,
        lotUrl: `${SITE_URL}/lots/${due.lot_id}/hpg?m=${due.month_key}`,
      });

      const sendRes = await resend.emails.send({
        from: FROM,
        to: due.email,
        subject,
        html,
        text,
      });
      if (sendRes.error) {
        result.errors.push({
          lotId: row.lot_id,
          monthKey: row.month_key,
          error: `resend: ${sendRes.error.message}`,
        });
        continue;
      }

      const updateRes = await sb
        .from("hpg_records")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("lot_id", row.lot_id)
        .eq("month_key", row.month_key);
      if (updateRes.error) {
        // Mail already went out — surface the bookkeeping error so we can fix
        // it, but don't double-count as failure on the metric.
        result.errors.push({
          lotId: row.lot_id,
          monthKey: row.month_key,
          error: `update reminder_sent_at failed: ${updateRes.error.message}`,
        });
      }
      result.sent += 1;
    } catch (e) {
      result.errors.push({
        lotId: row.lot_id,
        monthKey: row.month_key,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ ...result, target: targetIso });
}
