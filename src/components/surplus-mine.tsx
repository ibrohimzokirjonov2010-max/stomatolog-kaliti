"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Package, Phone, Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ListingImage, Modal, PostForm } from "@/components/surplus-forms";
import { useSurplusWork } from "@/components/surplus-provider";
import { EmptyState, Gate, ModBanner, StatusPill, TabBar } from "@/components/work-ui";
import { expiryLabel, phoneHref, statusLabel, surplusCategories, telegramHref, type SurplusListing } from "@/data/surplus";
import { formatMoney } from "@/lib/format";
import { interestStatusCopy, type SurplusInterest } from "@/lib/surplus-work";
import { timeAgoUz } from "@/lib/work-client";
import { cn } from "@/lib/utils";

type Tab = "elonlarim" | "kelgan" | "yuborgan";

const MOD_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Moderatsiyada", cls: "bg-[#fffbeb] text-[#92400e]" },
  published: { label: "E’londa", cls: "bg-[#ecfdf3] text-[#15803d]" },
  rejected: { label: "Rad etilgan", cls: "bg-[#fef2f2] text-[#b91c1c]" },
  hidden: { label: "Yashirilgan", cls: "bg-[#f3f5f9] text-[#475569]" },
  closed: { label: "Yopilgan", cls: "bg-[#f3f5f9] text-[#8b93a7]" },
};

export function SurplusMinePage() {
  const { mine, incoming, outgoing, setListing, setInterest, ready, authed } = useSurplusWork();
  const params = useSearchParams();
  const router = useRouter();
  const tab: Tab = params.get("tab") === "kelgan" ? "kelgan" : params.get("tab") === "yuborgan" ? "yuborgan" : "elonlarim";
  const [editing, setEditing] = useState<SurplusListing | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const items = useMemo(() => [...mine].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")), [mine]);
  const newIncoming = incoming.filter((i) => i.status === "yuborildi").length;

  async function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    const res = await fn();
    setBusyId(null);
    if (!res.ok) setError(res.error ?? "Amalni bajarib bo‘lmadi.");
  }

  function go(next: Tab) {
    router.replace(next === "elonlarim" ? "/ortiqcha-material/elonlarim" : `/ortiqcha-material/elonlarim?tab=${next}`, { scroll: false });
  }

  return (
    <div>
      <header className="mb-4">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/ortiqcha-material" className="text-[#0066FF] hover:underline">Ortiqcha material</Link>
          <span className="mx-1">/</span>
          <span>Mening e’lonlarim</span>
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#0B1F4D] lg:text-[#1a1d26]">Mening e’lonlarim</h1>
            <p className="mt-1 text-sm text-[#8b93a7]">E’lonlaringiz, kelgan bog‘lanish so‘rovlari va o‘zingiz yuborgan so‘rovlar.</p>
          </div>
          <Link href="/ortiqcha-material/yangi" className={cn(buttonVariants(), "hidden h-11 !rounded-xl px-4 lg:inline-flex")}>+ E’lon joylash</Link>
          <Button className="h-11 !rounded-xl px-4 lg:hidden" onClick={() => setCreating(true)}>E’lon joylash</Button>
        </div>
        <div className="mt-3">
          <TabBar
            value={tab}
            onChange={go}
            tabs={[
              ["elonlarim", `E’lonlarim${items.length ? ` (${items.length})` : ""}`],
              ["kelgan", `Kelgan so‘rovlar${newIncoming ? ` (${newIncoming})` : ""}`],
              ["yuborgan", `Yuborganlarim${outgoing.length ? ` (${outgoing.length})` : ""}`],
            ] as const}
          />
        </div>
      </header>

      {ready && !authed && items.length === 0 ? (
        <Gate title="Kirish talab qilinadi" text="E’lonlar va so‘rovlar shaxsiy — ko‘rish uchun tizimga kiring." next="/ortiqcha-material/elonlarim" />
      ) : !ready ? (
        <p className="py-16 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : (
        <>
          {error ? <p role="alert" className="mb-3 rounded-xl bg-[#fef2f2] px-3.5 py-2.5 text-[13px] font-medium text-[#b91c1c]">{error}</p> : null}

          {tab === "elonlarim" ? (
            items.length === 0 ? (
              <EmptyState title="Hali e’lon yo‘q" text="Klinika ortiqchasini joylang. E’lon admin tasdiqlagach hamma ko‘radi. Dilerlik va ulgurji e’lonlar qabul qilinmaydi." icon={<Package className="size-6" />} />
            ) : (
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <MineRow
                    key={item.id}
                    listing={item}
                    busy={busyId === item.id}
                    onEdit={() => setEditing(item)}
                    onToggle={() => run(item.id, () => setListing(item.id, item.modStatus === "closed" ? "open" : "close"))}
                    onDelete={() => {
                      if (window.confirm("E’lonni o‘chirasizmi? Unga kelgan so‘rovlar ham o‘chadi.")) void run(item.id, () => setListing(item.id, "delete"));
                    }}
                  />
                ))}
              </ul>
            )
          ) : tab === "kelgan" ? (
            incoming.length === 0 ? (
              <EmptyState title="Hali so‘rov yo‘q" text="E’loningizga qiziqqanlar shu yerda ko‘rinadi. Qabul qilsangiz, ularga telefon raqamingiz ochiladi." icon={<Send className="size-6" />} />
            ) : (
              <ul className="space-y-2.5">
                {incoming.map((row) => (
                  <InterestRow key={row.id} row={row} owner busy={busyId === row.id} onSet={(s) => run(row.id, () => setInterest(row.id, s))} />
                ))}
              </ul>
            )
          ) : outgoing.length === 0 ? (
            <EmptyState title="Hali so‘rov yubormagansiz" text="E’lonlar ro‘yxatidan “Bog‘lanish” tugmasi orqali so‘rov yuboring." href="/ortiqcha-material" cta="E’lonlarni ko‘rish" icon={<Send className="size-6" />} />
          ) : (
            <ul className="space-y-2.5">
              {outgoing.map((row) => (
                <InterestRow key={row.id} row={row} busy={busyId === row.id} onSet={(s) => run(row.id, () => setInterest(row.id, s))} />
              ))}
            </ul>
          )}
        </>
      )}

      {creating ? (
        <Modal title="E’lon joylash" onClose={() => setCreating(false)}>
          <PostForm onCancel={() => setCreating(false)} onDone={() => setCreating(false)} />
        </Modal>
      ) : null}
      {editing ? (
        <Modal title="E’lonni tahrirlash" onClose={() => setEditing(null)}>
          <PostForm listing={editing} onCancel={() => setEditing(null)} onDone={() => setEditing(null)} />
        </Modal>
      ) : null}
    </div>
  );
}

function InterestRow({ row, owner, busy, onSet }: { row: SurplusInterest; owner?: boolean; busy: boolean; onSet: (s: "qabul" | "rad" | "bekor") => void }) {
  const st = interestStatusCopy[row.status];
  const tg = telegramHref(row.sellerTelegram ?? undefined);
  return (
    <li className="rounded-[14px] border border-[#eceff5] bg-white p-4" data-testid="interest-row">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[#1a1d26]">{row.listingName}</p>
          <p className="mt-0.5 text-[13px] text-[#4b5568]">{owner ? `${row.name} · so‘rov yubordi` : "Siz yuborgan so‘rov"} · {timeAgoUz(row.createdAt)}</p>
        </div>
        <StatusPill label={st.label} cls={st.cls} />
      </div>
      {row.message ? <p className="mt-2 text-[13px] leading-relaxed text-[#4b5568]">“{row.message}”</p> : null}
      {owner && row.phone ? (
        <a href={phoneHref(row.phone)} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0066FF]">
          <Phone className="size-3.5" />
          {row.phone}
        </a>
      ) : null}
      {!owner && row.status === "qabul" && row.sellerPhone ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-[#f0fdf4] px-3 py-2.5" data-testid="seller-phone">
          <a href={phoneHref(row.sellerPhone)} className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#15803d]">
            <Phone className="size-4" />
            {row.sellerPhone}
          </a>
          {tg ? <a href={tg} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-[#0066FF]">Telegram</a> : null}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {owner && row.status === "yuborildi" ? (
          <>
            <Button type="button" className="h-11 !rounded-xl text-[13px]" disabled={busy} onClick={() => onSet("qabul")}>Qabul qilish</Button>
            <Button type="button" variant="outline" className="h-11 !rounded-xl text-[13px]" disabled={busy} onClick={() => onSet("rad")}>Rad etish</Button>
          </>
        ) : null}
        {!owner && (row.status === "yuborildi" || row.status === "qabul") ? (
          <Button type="button" variant="outline" className="h-11 !rounded-xl text-[13px]" disabled={busy} onClick={() => onSet("bekor")}>So‘rovni bekor qilish</Button>
        ) : null}
      </div>
    </li>
  );
}

function MineRow({ listing, busy, onEdit, onToggle, onDelete }: { listing: SurplusListing; busy: boolean; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const category = surplusCategories.find((row) => row.id === listing.category)?.label;
  const place = listing.district ? `${listing.city}, ${listing.district}` : listing.city;
  const mod = MOD_LABEL[listing.modStatus ?? "pending"] ?? MOD_LABEL.pending;
  const closed = listing.modStatus === "closed";
  const canToggle = ["published", "pending", "closed"].includes(listing.modStatus ?? "");

  return (
    <li className="flex gap-3 rounded-[14px] border border-[#eceff5] bg-white p-4" data-testid="mine-row">
      <div className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f7f9fc]">
        <ListingImage src={listing.image} alt="" className="size-full object-contain p-1.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[14px] font-semibold text-[#1a1d26]">{listing.name}</p>
            <p className="mt-0.5 text-[13px] text-[#4b5568]">{listing.brand}{category ? ` · ${category}` : ""}</p>
          </div>
          <StatusPill label={mod.label} cls={mod.cls} />
        </div>
        <p className="mt-1 text-[15px] font-bold text-[#0066FF]">{formatMoney(listing.price, "UZS")}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#8b93a7]">
          <span className="inline-flex items-center gap-1"><Package className="size-3.5" />{statusLabel[listing.status]} · {expiryLabel(listing.expiryMonths)}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{place}</span>
          {listing.interestCount ? <span>{listing.interestCount} ta so‘rov</span> : null}
        </p>
        {listing.modStatus === "rejected" || listing.modStatus === "hidden" ? <div className="mt-2"><ModBanner status={listing.modStatus} reason={listing.rejectReason} /></div> : null}
        {listing.note ? <p className="mt-2 text-[13px] leading-relaxed text-[#4b5568]">{listing.note}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-11 !rounded-xl text-[13px]" disabled={busy} onClick={onEdit}>Tahrirlash</Button>
          {canToggle ? (
            <Button type="button" variant="outline" className="h-11 !rounded-xl text-[13px]" disabled={busy} onClick={onToggle}>{closed ? "Qayta ochish" : "Yopish"}</Button>
          ) : null}
          <Button type="button" variant="ghost" className="h-11 !rounded-xl text-[13px] text-[#8b93a7]" disabled={busy} onClick={onDelete}>O‘chirish</Button>
          <Link href={`/ortiqcha-material/${listing.id}`} className={cn(buttonVariants({ variant: "ghost" }), "h-11 !rounded-xl text-[13px]")}>Sahifasini ko‘rish</Link>
        </div>
      </div>
    </li>
  );
}
