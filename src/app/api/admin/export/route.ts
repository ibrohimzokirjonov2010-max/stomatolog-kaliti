import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { rpc } from "@/lib/server/db";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function csv(rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    // neutralize spreadsheet formula injection
    const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
    return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

const n = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const s = (v: unknown) => (v == null ? "" : String(v));

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;
  const sp = new URL(request.url).searchParams;
  const kind = sp.get("kind") ?? "summary";
  const days = Math.min(Math.max(Number(sp.get("days")) || 30, 1), 366);
  const admin = guard.admin.id;
  let rows: (string | number | null | undefined)[][] = [];

  try {
    if (kind === "summary") {
      const d = await rpc<Row & { current: Row; mrr: number; escrow: Row; series: Row[]; from: string; to: string }>(
        "sh_admin_dashboard",
        { p_admin: admin, p_days: days },
      );
      const c = d.current;
      rows = [
        ["StomaHub hisobot", `${d.from} — ${d.to}`],
        [],
        ["Ko‘rsatkich", "Qiymat (so‘m / dona)", "Ta’rif"],
        ["Sof foyda", n(c.net), "Komissiya (yakunlangan buyurtmalar) + reklama + kanal auksion + obunalar − qaytarishlar"],
        ["GMV", n(c.gmv), "To‘langan buyurtmalar summasi (qaytarilganlarsiz)"],
        ["MRR", n(d.mrr), "Faol obunalar + reklama shartnomalari (oylik) + joriy oy avto-yangilanuvchi kanal stavkalari"],
        ["Escrowda", n(d.escrow.amount), "Platformada ushlab turilgan to‘lovlar"],
        ["Marketplace komissiyasi", n(c.commission), "Sotuvchiga o‘tkazilgan buyurtmalardan"],
        ["Reklama daromadi", n(c.ads), "Shartnoma qiymati kunlarga taqsimlangan"],
        ["Kanal auksion", n(c.channels), "Davrdagi stavkalar"],
        ["Obunalar", n(c.subs), ""],
        ["Qaytarishlar (platforma zarari)", n(c.refunds), ""],
        ["Buyurtmalar", n(c.orders), ""],
        ["Faol foydalanuvchilar", n(c.activeUsers), "Davrda tizimga kirganlar"],
        ["Yangi ro‘yxatdan o‘tganlar", n(c.newUsers), ""],
        [],
        ["Sana", "Sof foyda", "GMV"],
        ...d.series.map((p) => [s(p.date), n(p.net), n(p.gmv)]),
      ];
    } else if (kind === "orders") {
      const d = await rpc<{ rows: Row[] }>("sh_admin_orders", { p_admin: admin, p_filter: "all", p_query: "" });
      rows = [
        ["ID", "Sana", "Shifokor", "Do‘kon", "Summa", "Komissiya", "To‘lov usuli", "Yetkazish holati", "Pul holati"],
        ...d.rows.map((o) => [s(o.id), s(o.createdAt), s(o.buyerName ?? o.name), s(o.shopName), n(o.total), n(o.commission), s(o.payment), s(o.status), s(o.paymentState)]),
      ];
    } else if (kind === "users") {
      const all: Row[] = [];
      for (let offset = 0; offset < 5000; offset += 200) {
        const d = await rpc<{ rows: Row[] }>("sh_admin_users", {
          p_admin: admin, p_query: "", p_filter: "all", p_city: "", p_limit: 200, p_offset: offset,
        });
        all.push(...d.rows);
        if (d.rows.length < 200) break;
      }
      rows = [
        ["ID", "Ism", "Telefon", "Email", "Kirish", "Shahar", "Mutaxassislik", "Sotuvchi", "Admin roli", "Bloklangan", "Ro‘yxatdan o‘tgan", "Oxirgi faollik"],
        ...all.map((u) => [s(u.id), s(u.fullName), s(u.phone), s(u.email), s(u.provider), s(u.city), s(u.specialty), u.isSeller ? "ha" : "", u.isAdmin ? s(u.adminRole) : "", u.blocked ? "ha" : "", s(u.createdAt), s(u.lastSeenAt)]),
      ];
    } else if (kind === "stores") {
      const d = await rpc<{ rows: (Row & { metrics: Row })[] }>("sh_admin_stores", { p_admin: admin, p_days: days });
      rows = [
        ["ID", "Do‘kon", "Egasi", "Shahar", "Holat", "Komissiya %", "Sotuvlar", "GMV", "Komissiya", "O‘rtacha chek", "Mahsulotlar"],
        ...d.rows.map((r) => [s(r.id), s(r.name), s(r.ownerName), s(r.city), s(r.status), n(r.commissionRate), n(r.metrics.sales), n(r.metrics.gmv), n(r.metrics.commission), n(r.metrics.avgCheck), n(r.products)]),
      ];
    } else {
      return NextResponse.json({ ok: false, error: "Noma’lum hisobot." }, { status: 400 });
    }
    await rpc("sh_admin_log", { p_admin: admin, p_action: "export.csv", p_type: "report", p_id: kind, p_details: { days } }).catch(() => null);
  } catch {
    return NextResponse.json({ ok: false, error: "Hisobotni tayyorlab bo‘lmadi." }, { status: 502 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stomahub-${kind}-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
