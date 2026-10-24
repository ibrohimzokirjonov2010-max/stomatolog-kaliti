"use client";

import { AdBanner } from "@/components/ad-banner";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Camera,
  ChevronDown,
  Eye,
  FileText,
  Flame,
  MessageCircle,
  ShieldAlert,
  Users,
  HelpCircle,
  ImagePlus,
  Loader2,
  RefreshCw,
  X,
  Newspaper,
  Plus,
  Search,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { FeedPost, initialsOf, PostMedia } from "@/components/community-card";
import { useCommunityWork } from "@/components/community-provider";
import { MobileSectionHeader } from "@/components/mobile-section-header";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  communityRules,
  communityRulesExtra,
  suggestedTags,
  type PostKind,
} from "@/data/community";
import { initialsFromName } from "@/lib/doctor-profile";
import { looksLikePatientName, parseTags } from "@/lib/community-work";
import { CASE_TAGS, caseProblem } from "@/lib/forms/p0";
import { prepareImage, uploadImage, type PreparedImage } from "@/lib/image-upload";

const MAX_IMAGES = 6;
import { cn } from "@/lib/utils";

const mobileChips: { id: PostKind | ""; label: string }[] = [
  { id: "", label: "Hammasi" },
  { id: "yangilik", label: "Klinika yangiliklari" },
  { id: "case", label: "Maslahatlar" },
  { id: "savol", label: "Savol-javob" },
];

type Cat = "" | "case" | "savol" | "yangilik" | "klinik" | "materiallar" | "protokol" | "qiziqarli";
type DeskSort = "new" | "popular" | "discussed" | "liked";

const deskCats: { id: Cat; label: string }[] = [
  { id: "", label: "Barchasi" },
  { id: "case", label: "Case" },
  { id: "savol", label: "Savol" },
  { id: "yangilik", label: "Yangilik" },
  { id: "klinik", label: "Klinik holat" },
  { id: "materiallar", label: "Materiallar" },
  { id: "protokol", label: "Protokol" },
  { id: "qiziqarli", label: "Qiziqarli holatlar" },
];

/** Keyword categories (matched against tags and text). */
const catKeywords: Partial<Record<Cat, RegExp>> = {
  klinik: /klinik|holat|bemor|diagnoz/i,
  materiallar: /material|graft|membran|kompozit|sement|implant\s*sistem/i,
  protokol: /protokol|prf|retention|irrigatsiya|obturatsiya/i,
  qiziqarli: /qiziq|noyob|kam uchra|ajoyib|rare/i,
};

const sortTabs: { id: DeskSort; label: string }[] = [
  { id: "new", label: "Eng yangi" },
  { id: "popular", label: "Eng mashhur" },
  { id: "discussed", label: "Eng ko‘p muhokama" },
  { id: "liked", label: "Eng ko‘p like" },
];

const composerTabs: { kind: PostKind; label: string; icon: typeof ImagePlus; tone: string }[] = [
  { kind: "case", label: "Case yuklash", icon: ImagePlus, tone: "text-[#0F766E]" },
  { kind: "savol", label: "Savol berish", icon: HelpCircle, tone: "text-[#f5a623]" },
  { kind: "yangilik", label: "Yangilik ulashish", icon: Newspaper, tone: "text-[#22c55e]" },
];

const templates: Record<PostKind, string> = {
  case: "Klinik vaziyat:\nYondashuv:\nNatija:\nSavol hamkasblarga:",
  savol: "Savol:\nQisqa kontekst:\nNimani sinab ko‘rdim:",
  yangilik: "Sarlavha:\nMatn:\nHavola:",
};

const photoLabels = ["Before", "Intraoral", "X-ray", "CBCT"];

const deskRules = [
  ...communityRules,
  communityRulesExtra[1] ?? "Reklama va spam taqiqlanadi.",
  "Faqat stomatologiya mavzusidagi kontent.",
];

type Clinical = { age: string; gender: string; complaint: string; diagnosis: string; plan: string; steps: string; consent: boolean; faceAck: boolean };
const emptyClinical: Clinical = { age: "", gender: "", complaint: "", diagnosis: "", plan: "", steps: "", consent: false, faceAck: false };

function DeskField({ label, value, onChange, placeholder, className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[11.5px] font-semibold text-[#6b7488]">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 rounded-xl" />
    </label>
  );
}

function DeskSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-semibold text-[#6b7488]">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full cursor-pointer appearance-none rounded-xl border border-input bg-transparent pr-8 pl-3 text-[13px] text-[#1a1d26] outline-none focus:border-ring"
        >
          {options.map((o) => (
            <option key={o || "none"} value={o}>
              {o || "Tanlang"}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[#8b93a7]" />
      </span>
    </label>
  );
}

export function CommunityFeed() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const mobileComposerRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    feed,
    trends,
    doctors,
    ready,
    loading,
    error: loadError,
    reload,
    viewerId,
    publish,
    toggleLike,
    addComment,
    deleteComment,
    deletePost,
    share,
  } = useCommunityWork();
  const { profile, ready: authReady } = useDoctorProfile();

  const [kind, setKind] = useState<PostKind | "">("");
  const [tag, setTag] = useState("");
  const [draft, setDraft] = useState("");
  const [draftKind, setDraftKind] = useState<PostKind>("case");
  const [draftTags, setDraftTags] = useState("");
  const [pending, setPending] = useState<PreparedImage[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [busyText, setBusyText] = useState("");
  const [openComposer, setOpenComposer] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(q);
  const [error, setError] = useState("");
  const [nameWarn, setNameWarn] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [cat, setCat] = useState<Cat>("");
  const [sort, setSort] = useState<DeskSort>("new");
  const [newMenu, setNewMenu] = useState(false);
  const [clinical, setClinical] = useState<Clinical>(emptyClinical);

  const searchTerm = (mobileSearch || q).trim().toLowerCase();

  const visible = useMemo(() => {
    return feed.filter((post) => {
      const catKind = cat === "case" || cat === "savol" || cat === "yangilik" ? cat : "";
      const kw = catKeywords[cat];
      const matchesCat =
        !cat ||
        Boolean(catKind && post.kind === catKind) ||
        Boolean(kw && (post.tags.some((item) => kw.test(item)) || kw.test(post.text)));
      if (!matchesCat) return false;
      const matchesKind = !kind || post.kind === kind;
      const matchesTag = !tag || post.tags.includes(tag);
      const matchesQ =
        !searchTerm ||
        post.text.toLowerCase().includes(searchTerm) ||
        post.author.name.toLowerCase().includes(searchTerm) ||
        post.tags.some((item) => item.toLowerCase().includes(searchTerm));
      return matchesKind && matchesTag && matchesQ;
    });
  }, [feed, kind, searchTerm, tag, cat]);

  const sortedVisible = useMemo(() => {
    const rows = [...visible];
    const t = (p: (typeof rows)[number]) => (p.createdAt ? new Date(p.createdAt).getTime() : 0);
    if (sort === "new") rows.sort((a, b) => t(b) - t(a));
    else if (sort === "popular") rows.sort((a, b) => b.likes + b.comments * 2 + b.shares - (a.likes + a.comments * 2 + a.shares));
    else if (sort === "discussed") rows.sort((a, b) => b.comments - a.comments || b.likes - a.likes);
    else rows.sort((a, b) => b.likes - a.likes || b.comments - a.comments);
    return rows;
  }, [visible, sort]);

  function focusComposer(nextKind?: PostKind, mobile = false) {
    if (nextKind) setDraftKind(nextKind);
    setOpenComposer(true);
    requestAnimationFrame(() => {
      document.getElementById(mobile ? "composer-mobile" : "composer")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      (mobile ? mobileComposerRef : composerRef).current?.focus();
    });
  }

  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => () => pendingRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl)), []);

  function removePending(id: string) {
    setPending((current) => {
      const hit = current.find((img) => img.id === id);
      if (hit) URL.revokeObjectURL(hit.previewUrl);
      return current.filter((img) => img.id !== id);
    });
  }

  async function onPickImages(files: FileList | null) {
    if (!files?.length) return;
    setOpenComposer(true);
    const room = MAX_IMAGES - pending.length;
    if (room <= 0) {
      setError(`Ko‘pi bilan ${MAX_IMAGES} ta rasm qo‘shish mumkin.`);
      return;
    }
    const picked = [...files].slice(0, room);
    setPreparing(true);
    setError("");
    const next: PreparedImage[] = [];
    let failed = "";
    for (const file of picked) {
      try {
        next.push(await prepareImage(file));
      } catch (err) {
        failed = err instanceof Error ? err.message : "Rasmni o‘qib bo‘lmadi.";
      }
    }
    setPending((current) => [...current, ...next].slice(0, MAX_IMAGES));
    setPreparing(false);
    if (failed) setError(failed);
    else if (files.length > room) setError(`Ko‘pi bilan ${MAX_IMAGES} ta rasm — qolganlari qo‘shilmadi.`);
  }

  function openPicker() {
    if (!profile) {
      setError("Post joylash uchun tizimga kiring.");
      setOpenComposer(true);
      return;
    }
    fileRef.current?.click();
  }

  /** Case: clinical fields are appended to the post text (backend stores text/tags/images only). */
  function composeText() {
    const base = draft.trim();
    if (draftKind !== "case") return base;
    const lines = [
      clinical.age || clinical.gender ? `Bemor: ${[clinical.age, clinical.gender].filter(Boolean).join(", ")}` : "",
      clinical.complaint.trim() ? `Shikoyat: ${clinical.complaint.trim()}` : "",
      clinical.diagnosis.trim() ? `Diagnoz: ${clinical.diagnosis.trim()}` : "",
      clinical.plan.trim() ? `Davolash rejasi: ${clinical.plan.trim()}` : "",
      clinical.steps.trim() ? `Bosqichlar:\n${clinical.steps.trim()}` : "",
    ].filter(Boolean);
    return lines.length ? `${base}\n\n${lines.join("\n")}` : base;
  }

  function resetComposer() {
    pending.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setPending([]);
    setDraft("");
    setDraftTags("");
    setClinical(emptyClinical);
    setNameWarn(false);
    setError("");
  }

  async function publishPost() {
    if (busyText) return;
    if (!profile) {
      setError("Post joylash uchun tizimga kiring.");
      setOpenComposer(true);
      return;
    }
    if (!draft.trim()) {
      setError("Post matnini yozing.");
      setOpenComposer(true);
      return;
    }
    const warn = draftKind === "case" && looksLikePatientName(draft);
    if (warn && !nameWarn) {
      setNameWarn(true);
      setError("");
      return;
    }
    if (draftKind === "case") {
      const problem = caseProblem({
        text: composeText(),
        tags: parseTags(draftTags, draftKind),
        images: pending.map(() => "pending"),
        consent: clinical.consent,
        faceAck: clinical.faceAck,
        complaint: clinical.complaint,
        diagnosis: clinical.diagnosis,
        steps: clinical.steps,
      });
      if (problem) {
        setError(problem);
        setOpenComposer(true);
        return;
      }
    }
    setError("");
    const urls: string[] = [];
    try {
      for (let i = 0; i < pending.length; i++) {
        setBusyText(pending.length > 1 ? `Rasmlar yuklanmoqda ${i + 1}/${pending.length}…` : "Rasm yuklanmoqda…");
        urls.push(await uploadImage(pending[i].blob, "post"));
      }
      setBusyText("Joylanmoqda…");
      const result = await publish({
        kind: draftKind,
        text: composeText(),
        tags: parseTags(draftTags, draftKind),
        images: urls,
        consent: clinical.consent,
        faceAck: clinical.faceAck,
        complaint: clinical.complaint,
        diagnosis: clinical.diagnosis,
        steps: clinical.steps,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Postni saqlab bo‘lmadi.");
      return;
    } finally {
      setBusyText("");
    }
    pending.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setPending([]);
    setDraft("");
    setDraftTags("");
    setClinical(emptyClinical);
    setNameWarn(false);
    setOpenComposer(false);
    setKind("");
    setCat("");
    setTag("");
  }

  function renderImagePicker(variant: "desktop" | "mobile") {
    const mobile = variant === "mobile";
    return (
      <div className={mobile ? "mt-2.5" : ""}>
        {pending.length || preparing ? (
          <div className={cn("grid gap-2", mobile ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4")}>
            {pending.map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-[#f4f7fb] ring-1 ring-[#eceff5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt="Tanlangan rasm" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePending(img.id)}
                  disabled={Boolean(busyText)}
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70"
                  aria-label="Rasmni olib tashlash"
                >
                  <X className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
            ))}
            {preparing ? (
              <div className="grid aspect-square place-items-center rounded-xl bg-[#f4f7fb] text-[#8b93a7] ring-1 ring-[#eceff5]">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : null}
            {pending.length < MAX_IMAGES && !preparing ? (
              <button
                type="button"
                onClick={openPicker}
                disabled={Boolean(busyText)}
                className="grid aspect-square place-items-center rounded-xl border border-dashed border-[#CCFBF1] bg-white text-[#0F766E] hover:bg-[#f5f9ff]"
                aria-label="Yana rasm qo‘shish"
              >
                <span className="flex flex-col items-center gap-1 text-[11.5px] font-semibold">
                  <ImagePlus className="size-5" />
                  Qo‘shish
                </span>
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className={cn(
              "flex w-full items-center justify-center gap-2 border border-dashed border-[#CCFBF1] bg-[#f8fbff] font-semibold text-[#0F766E] hover:bg-[#eef5ff]",
              mobile ? "h-12 rounded-2xl text-[14px]" : "h-10 rounded-xl text-[13px]",
            )}
          >
            <ImagePlus className="size-4" />
            Qurilmadan rasm tanlash
            <span className="font-medium text-[#8b93a7]">(ko‘pi bilan {MAX_IMAGES} ta)</span>
          </button>
        )}
        {pending.length ? (
          <p className="mt-1.5 text-[11.5px] text-[#8b93a7]">
            {pending.length}/{MAX_IMAGES} rasm · joylashda avtomatik siqiladi (1600px)
          </p>
        ) : null}
      </div>
    );
  }

  function composerAvatar(size: "sm" | "lg") {
    const cls = size === "lg" ? "size-11 ring-2 ring-[#F0FDFA]" : "size-10";
    if (profile?.avatarUrl) {
      return <PostMedia src={profile.avatarUrl} width={44} height={44} className={cn(cls, "shrink-0 rounded-full object-cover")} />;
    }
    return (
      <span className={cn(cls, "flex shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-[13px] font-bold text-[#0F766E]")}>
        {profile ? initialsFromName(profile.fullName) : "?"}
      </span>
    );
  }

  function renderFeedState(variant: "desktop" | "mobile") {
    if (!ready || (loading && feed.length === 0 && !loadError)) {
      return (
        <div className="space-y-3" aria-busy="true" aria-label="Yuklanmoqda">
          {[0, 1].map((i) => (
            <div key={i} className={cn("border border-[#eceff5] bg-white p-4", variant === "mobile" ? "rounded-[18px]" : "rounded-[14px]")}>
              <div className="flex items-center gap-3">
                <div className="size-11 animate-pulse rounded-full bg-slate-200/80" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-slate-200/80" />
                  <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/60" />
                </div>
              </div>
              <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-200/60" />
              <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-200/60" />
              <div className="mt-4 h-36 animate-pulse rounded-xl bg-slate-200/50" />
            </div>
          ))}
        </div>
      );
    }
    if (loadError && feed.length === 0) {
      return (
        <div className="rounded-2xl border border-[#fde2e1] bg-white px-5 py-10 text-center">
          <p className="text-[15px] font-semibold text-[#1a1d26]">Postlarni yuklab bo‘lmadi</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">{loadError}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-[13.5px] font-semibold text-white"
          >
            <RefreshCw className="size-4" />
            Qayta urinish
          </button>
        </div>
      );
    }
    if (feed.length === 0) {
      return (
        <div className="rounded-2xl border border-[#eceff5] bg-white px-5 py-12 text-center">
          <p className="text-[15px] font-semibold text-[#1a1d26]">Hali post yo‘q</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Birinchi bo‘lib case yoki savol ulashing.</p>
          <button
            type="button"
            onClick={() => focusComposer("case", variant === "mobile")}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-[13.5px] font-semibold text-white"
          >
            <Plus className="size-4" />
            Yangi post
          </button>
        </div>
      );
    }
    return null;
  }

  function renderFeedPost(post: (typeof visible)[number], variant: "desktop" | "mobile") {
    return (
      <FeedPost
        key={post.id}
        post={post}
        variant={variant}
        liked={Boolean(post.likedByMe)}
        commentsOpen={openComments === post.id}
        replyDraft={openComments === post.id ? replyDraft : ""}
        onLike={() => toggleLike(post.id)}
        onShare={() => {
          void share(post.id);
        }}
        onToggleComments={() => {
          setOpenComments((current) => (current === post.id ? null : post.id));
          setReplyDraft("");
        }}
        onReplyChange={setReplyDraft}
        onReply={() => {
          const text = replyDraft;
          void addComment(post.id, text).then((ok) => {
            if (ok) setReplyDraft("");
          });
        }}
        onOpenImage={setLightbox}
        onTag={(next) => {
          setTag(next);
          setKind("");
        }}
        likes={post.likes}
        viewerId={viewerId}
        canDelete={Boolean(viewerId && (post.authorId === viewerId || profile?.role === "admin"))}
        onDelete={() => {
          void deletePost(post.id);
        }}
        onDeleteReply={(id) => {
          void deleteComment(id);
        }}
      />
    );
  }

  const filterMeta =
    q || tag ? (
      <div className="mb-3 space-y-1">
        {q ? (
          <p className="text-sm text-muted-foreground">
            Qidiruv: “{params.get("q")}” — {visible.length} ta post
          </p>
        ) : null}
        {tag ? (
          <p className="text-sm text-muted-foreground">
            Mavzu: #{tag}{" "}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => setTag("")}>
              tozalash
            </button>
          </p>
        ) : null}
      </div>
    ) : null;

  return (
    <div>
      <AdBanner placement="community" />
      {/* ════════════════════════════════════════════════
          MOBILE LAYOUT (≤768px / lg shell)
          ════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <MobileSectionHeader title="Hamjamiyat" />

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#9aa8bc]" />
          <input
            data-section-search
            value={mobileSearch}
            onChange={(event) => setMobileSearch(event.target.value)}
            placeholder="Mavzu yoki savollarni izlash..."
            className="h-12 w-full rounded-full border border-[#e6eaf2] bg-white pr-4 pl-11 text-[14px] text-[#1a1d26] outline-none placeholder:text-[#9aa8bc] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15"
          />
        </div>

        <div className="mb-3 flex items-center gap-3">
          {composerAvatar("lg")}
          <button
            type="button"
            onClick={() => focusComposer(undefined, true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#0F766E] px-4 text-[15px] font-semibold text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)]"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Yangi post
          </button>
        </div>

        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mobileChips.map((item) => {
            const on = kind === item.id;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setKind(item.id)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors",
                  on
                    ? "bg-[#0F766E] text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)]"
                    : "bg-[#F0FDFA] text-[#0F766E]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {filterMeta}

        {openComposer ? (
          <section
            id="composer-mobile"
            className="mb-4 rounded-2xl border border-[#eceff5] bg-white p-3.5 shadow-[0_4px_16px_rgba(17, 24, 39, 0.05)]"
          >
            <Textarea
              ref={mobileComposerRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setNameWarn(false);
              }}
              placeholder={
                draftKind === "case"
                  ? "Case: klinik vaziyat, yondashuv, natija — bemor ismisiz."
                  : draftKind === "savol"
                    ? "Savolingizni yozing — hamkasblar javob beradi."
                    : "Yangilik yoki e’lon matni."
              }
              className="min-h-[88px] rounded-2xl border-0 bg-[#f4f7fb] px-3.5 py-3 text-[14px] shadow-none focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
            />
            {draftKind === "case" ? (
              <p className="mt-2.5 rounded-2xl bg-[#fff7ed] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#9a3412]">
                Case qoidasi: bemor ismi, familiyasi va yuzini yoping. Klinik fotosuratlarda ID ko‘rinmasin.
              </p>
            ) : null}
            <div className="mt-2.5 -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {suggestedTags.map((item) => {
                const on = draftTags.toLowerCase().includes(item.toLowerCase());
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      const parts = parseTags(draftTags, draftKind).filter(
                        (tagItem) => tagItem !== "Case" && tagItem !== "Savol" && tagItem !== "Yangilik",
                      );
                      const next = parts.includes(item)
                        ? parts.filter((tagItem) => tagItem !== item)
                        : [...parts, item];
                      setDraftTags(next.join(", "));
                    }}
                    className={cn(
                      "h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold",
                      on ? "bg-[#0F766E] text-white" : "bg-[#F0FDFA] text-[#0F766E]",
                    )}
                  >
                    #{item}
                  </button>
                );
              })}
            </div>
            <Input
              value={draftTags}
              onChange={(event) => setDraftTags(event.target.value)}
              placeholder="Teglar: Implantologiya, Case"
              className="mt-2.5 h-11 rounded-2xl"
            />
            {renderImagePicker("mobile")}
            {nameWarn ? (
              <p className="mt-2.5 text-sm text-amber-700">
                Matnda bemor ismiga o‘xshash ibora bor. Ismni olib tashlang yoki «Joylash»ni qayta bosing — post
                chiqaveradi.
              </p>
            ) : null}
            {busyText ? <p className="mt-2.5 text-[13px] font-medium text-[#0F766E]">{busyText}</p> : null}
            {error ? (
              <p className="mt-2.5 text-sm text-destructive">
                {error}
                {!profile && authReady ? (
                  <Link href="/kirish" className="ml-1.5 font-semibold text-[#0F766E] underline">
                    Kirish
                  </Link>
                ) : null}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-[#f0f3f8] pt-3">
              <button
                type="button"
                onClick={() => {
                  setDraftKind("case");
                  openPicker();
                }}
                className={cn(
                  "inline-flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold text-[#5d6b7d] active:bg-[#f4f7fb]",
                  draftKind === "case" && "bg-[#F0FDFA] text-[#0F766E]",
                )}
              >
                <ImagePlus className="size-4 text-[#0F766E]" />
                Case
              </button>
              <button
                type="button"
                onClick={() => focusComposer("savol", true)}
                className={cn(
                  "inline-flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold text-[#5d6b7d] active:bg-[#f4f7fb]",
                  draftKind === "savol" && "bg-amber-50 text-amber-700",
                )}
              >
                <HelpCircle className="size-4 text-[#f5a623]" />
                Savol
              </button>
              <button
                type="button"
                onClick={() => focusComposer("yangilik", true)}
                className={cn(
                  "inline-flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold text-[#5d6b7d] active:bg-[#f4f7fb]",
                  draftKind === "yangilik" && "bg-emerald-50 text-emerald-700",
                )}
              >
                <Newspaper className="size-4 text-[#22c55e]" />
                Yangilik
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpenComposer(false);
                  setError("");
                  setNameWarn(false);
                }}
                className="flex h-12 items-center justify-center rounded-2xl border border-[#e6eaf2] bg-white text-[14px] font-semibold text-[#1a1d26]"
              >
                Bekor
              </button>
              <button
                type="button"
                onClick={() => void publishPost()}
                disabled={Boolean(busyText) || preparing}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0F766E] text-[15px] font-semibold text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)] disabled:opacity-70"
              >
                {busyText ? <Loader2 className="size-4 animate-spin" /> : null}
                {busyText ? "Yuklanmoqda…" : "Joylash"}
              </button>
            </div>
          </section>
        ) : (
          <div id="composer-mobile" className="sr-only" aria-hidden="true" />
        )}

        <section className="mb-2">
          {renderFeedState("mobile") ?? (visible.length === 0 ? (
            <div className="rounded-2xl border border-[#eceff5] bg-white px-4 py-12 text-center">
              <p className="text-[14px] font-semibold text-[#1a1d26]">Bu filtr bo‘yicha post yo‘q</p>
              <p className="mt-1 text-[13px] text-[#8b93a7]">Barchasini ko‘ring yoki yangi post yozing.</p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setKind("");
                    setTag("");
                    setMobileSearch("");
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#e6eaf2] bg-white text-[14px] font-semibold text-[#1a1d26]"
                >
                  Filtrlarni tozalash
                </button>
                <button
                  type="button"
                  onClick={() => focusComposer(kind || "case", true)}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#0F766E] text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)]"
                >
                  Yangi post
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">{visible.map((post) => renderFeedPost(post, "mobile"))}</div>
          ))}
        </section>
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP LAYOUT (≥1024px / lg:)
          ════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-[#F0FDFA] bg-gradient-to-r from-[#eaf2ff] via-[#f3f8ff] to-[#F0FDFA]">
          <div className="absolute inset-y-0 right-0 w-[48%]">
            <Image src="/images/hero-dentist.png" alt="" fill priority sizes="640px" className="object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#eaf2ff] via-[#eaf2ff]/55 to-transparent" />
          </div>
          <div className="relative z-10 flex min-h-[176px] items-center justify-between gap-6 px-7 py-6">
            <div className="min-w-0 max-w-[600px]">
              <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-[#111827]">Community</h1>
              <p className="mt-1.5 max-w-[470px] text-[14px] leading-snug text-[#4b5568]">
                Stomatologlar uchun professional bilim va tajriba almashish maydoni.
              </p>
              <ul className="mt-5 flex gap-6">
                {[
                  { icon: Users, value: "12.4K", label: "stomatolog" },
                  { icon: Camera, value: "2.8K", label: "case" },
                  { icon: MessageCircle, value: "8.6K", label: "savol-javob" },
                  { icon: Newspaper, value: "4.1K", label: "yangilik" },
                ].map(({ icon: Icon, value, label }) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-full bg-white text-[#0F766E] shadow-[0_2px_8px_rgba(17, 94, 89, 0.12)]">
                      <Icon className="size-[17px]" strokeWidth={1.9} />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[16px] font-extrabold text-[#111827]">{value}</span>
                      <span className="block text-[11px] text-[#6b7488]">{label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative self-start">
              <button
                type="button"
                onClick={() => setNewMenu((v) => !v)}
                aria-expanded={newMenu}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white shadow-[0_6px_16px_rgba(15, 118, 110, 0.32)] hover:bg-[#115E59]"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Yangi post
                <ChevronDown className="size-4" />
              </button>
              {newMenu ? (
                <div className="absolute right-0 z-20 mt-2 w-[200px] overflow-hidden rounded-xl border border-[#eceff5] bg-white py-1 shadow-[0_12px_36px_rgba(17, 24, 39, 0.16)]">
                  {composerTabs.map((tab) => (
                    <button
                      key={tab.kind}
                      type="button"
                      onClick={() => {
                        setNewMenu(false);
                        focusComposer(tab.kind);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-[#1a1d26] hover:bg-slate-50"
                    >
                      <tab.icon className={cn("size-4", tab.tone)} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Category pills */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {deskCats.map((item) => {
            const on = cat === item.id;
            return (
              <button
                key={item.id || "all"}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setCat(item.id);
                  setTag("");
                }}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-[7px] text-[13px] font-semibold transition-colors",
                  on
                    ? "border-[#0F766E] bg-[#0F766E] text-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.28)]"
                    : "border-[#e6eaf2] bg-white text-[#4b5568] hover:border-[#0F766E]/40",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {filterMeta ? <div className="mt-3">{filterMeta}</div> : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-3">
            {/* Composer */}
            {!openComposer ? (
              <section id="composer" className="flex items-center gap-3 rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
                {composerAvatar("sm")}
                <button
                  type="button"
                  onClick={() => focusComposer()}
                  className="h-10 min-w-0 flex-1 rounded-[12px] bg-[#f4f7fb] px-3.5 text-left text-[13.5px] text-[#8b93a7] hover:bg-[#eef3f9]"
                >
                  Yangi post yozing…
                </button>
                <Button className="h-10 !rounded-xl px-4 text-[13px] font-semibold" onClick={() => focusComposer("case")}>
                  <Plus className="mr-1 size-4" strokeWidth={2.5} />
                  Case yuklash
                </Button>
              </section>
            ) : (
            <section id="composer" className="rounded-[14px] border border-[#eceff5] bg-white p-4 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
              <div className="flex items-center justify-between border-b border-[#f0f3f8] pb-2">
                <div className="flex items-center gap-1">
                  {composerTabs.map((tab) => {
                    const on = draftKind === tab.kind;
                    return (
                      <button
                        key={tab.kind}
                        type="button"
                        onClick={() => setDraftKind(tab.kind)}
                        aria-pressed={on}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors",
                          on ? "bg-[#eaf2ff] text-[#0F766E]" : "text-[#5d6b7d] hover:bg-[#f4f7fb]",
                        )}
                      >
                        <tab.icon className={cn("size-4", on ? "text-[#0F766E]" : tab.tone)} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(templates[draftKind]);
                    composerRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0F766E] hover:underline"
                >
                  <FileText className="size-3.5" />
                  Shablonlardan foydalanish
                </button>
              </div>

              <div className={cn("mt-3 grid gap-3", draftKind === "case" ? "grid-cols-[minmax(0,1fr)_230px]" : "grid-cols-1")}>
                <div className="flex gap-3">
                  {composerAvatar("sm")}
                  <Textarea
                    ref={composerRef}
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setNameWarn(false);
                    }}
                    placeholder={
                      draftKind === "case"
                        ? "Case haqida yozing..."
                        : draftKind === "savol"
                          ? "Savolingizni yozing — hamkasblar javob beradi."
                          : "Yangilik yoki e’lon matni."
                    }
                    className="min-h-[84px] flex-1 rounded-[12px] border-0 bg-[#f4f7fb] px-3.5 py-2.5 shadow-none focus-visible:bg-white"
                  />
                </div>
                {draftKind === "case" ? (
                  <div className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-3">
                    <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#c2410c]">
                      <ShieldAlert className="size-4" />
                      Bemor maxfiyligi
                    </p>
                    <p className="mt-1 text-[11.5px] leading-snug text-[#9a3412]">
                      Bemor ismi, familiyasi va yuzini yuklamang. Klinik fotosuratlarda ID ko‘rinmasin.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <p className="mb-1 text-[11.5px] font-semibold text-[#6b7488]">Teglar</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Input
                      value={draftTags}
                      onChange={(event) => setDraftTags(event.target.value)}
                      placeholder="Teg qo‘shing: Implantologiya, Case"
                      className="h-9 w-[250px] rounded-xl"
                    />
                    {suggestedTags.slice(0, 4).map((item) => {
                      const on = draftTags.toLowerCase().includes(item.toLowerCase());
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const parts = parseTags(draftTags, draftKind).filter(
                              (tagItem) => tagItem !== "Case" && tagItem !== "Savol" && tagItem !== "Yangilik",
                            );
                            const next = parts.includes(item) ? parts.filter((tagItem) => tagItem !== item) : [...parts, item];
                            setDraftTags(next.join(", "));
                          }}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11.5px] font-medium",
                            on ? "bg-[#0F766E] text-white" : "bg-[#F0FDFA] text-[#0F766E] hover:bg-[#F0FDFA]",
                          )}
                        >
                          #{item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {draftKind === "case" ? (
                  <div className="grid grid-cols-3 gap-2.5">
                    <DeskSelect label="Bemor yoshi" value={clinical.age} onChange={(v) => setClinical((c) => ({ ...c, age: v }))} options={["", "0–12", "13–17", "18–35", "36–55", "56+"]} />
                    <DeskSelect label="Bemor jinsi" value={clinical.gender} onChange={(v) => setClinical((c) => ({ ...c, gender: v }))} options={["", "Erkak", "Ayol"]} />
                    <DeskField label="Shikoyat" value={clinical.complaint} onChange={(v) => setClinical((c) => ({ ...c, complaint: v }))} placeholder="Asosiy shikoyat" />
                    <DeskField label="Diagnoz" value={clinical.diagnosis} onChange={(v) => setClinical((c) => ({ ...c, diagnosis: v }))} placeholder="Diagnoz" className="col-span-1" />
                    <DeskField label="Davolash rejasi" value={clinical.plan} onChange={(v) => setClinical((c) => ({ ...c, plan: v }))} placeholder="Davolash rejasi" className="col-span-2" />
                    <label className="col-span-3 block text-[12px] font-semibold text-[#6b7488]">
                      Bosqichlar
                      <textarea
                        data-testid="case-steps"
                        value={clinical.steps}
                        onChange={(event) => setClinical((c) => ({ ...c, steps: event.target.value }))}
                        placeholder={"1. Diagnostika\n2. Davolash\n3. Natija"}
                        className="mt-1 min-h-[72px] w-full rounded-xl border border-[#e6eaf2] px-3 py-2 text-[13px] font-normal"
                      />
                    </label>
                    <div className="col-span-3 flex flex-wrap gap-1.5">
                      {CASE_TAGS.map((tag) => {
                        const on = parseTags(draftTags, "case").some((item) => item.toLowerCase() === tag.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium", on ? "bg-[#0F766E] text-white" : "bg-[#F0FDFA] text-[#0F766E]")}
                            onClick={() => {
                              const parts = parseTags(draftTags, "case").filter((item) => item !== "Case");
                              const next = on ? parts.filter((item) => item.toLowerCase() !== tag.toLowerCase()) : [...parts, tag];
                              setDraftTags(next.join(", "));
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                    <label className="col-span-3 flex items-start gap-2 text-[12.5px] text-[#1a1d26]">
                      <input data-testid="case-consent" type="checkbox" checked={clinical.consent} onChange={(event) => setClinical((c) => ({ ...c, consent: event.target.checked }))} />
                      Bemor roziligini oldim. Ism, familiya va telefon yo‘q.
                    </label>
                    <label className="col-span-3 flex items-start gap-2 text-[12.5px] text-[#1a1d26]">
                      <input data-testid="case-face" type="checkbox" checked={clinical.faceAck} onChange={(event) => setClinical((c) => ({ ...c, faceAck: event.target.checked }))} />
                      Yuz ko‘rinmasligini o‘zim tekshirdim. Avtomatik xiralashtirish keyingi bosqichda.
                    </label>
                  </div>
                ) : null}

                <div>
                  <p className="mb-1 text-[11.5px] font-semibold text-[#6b7488]">Rasm va fayllar</p>
                  <div className="flex flex-wrap gap-2">
                    {pending.map((img, index) => (
                      <div key={img.id} className="relative size-[68px] overflow-hidden rounded-lg bg-[#f4f7fb] ring-1 ring-[#eceff5]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.previewUrl} alt="Tanlangan rasm" className="size-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[9.5px] font-semibold text-white">
                          {photoLabels[index] ?? `Rasm ${index + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePending(img.id)}
                          disabled={Boolean(busyText)}
                          className="absolute top-0.5 right-0.5 grid size-5 place-items-center rounded-full bg-black/55 text-white hover:bg-black/70"
                          aria-label="Rasmni olib tashlash"
                        >
                          <X className="size-3" strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                    {preparing ? (
                      <div className="grid size-[68px] place-items-center rounded-lg bg-[#f4f7fb] text-[#8b93a7] ring-1 ring-[#eceff5]">
                        <Loader2 className="size-5 animate-spin" />
                      </div>
                    ) : null}
                    {pending.length < MAX_IMAGES && !preparing ? (
                      <button
                        type="button"
                        onClick={openPicker}
                        disabled={Boolean(busyText)}
                        className="flex h-[68px] min-w-[68px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#CCFBF1] bg-[#f8fbff] px-2 text-[10.5px] font-semibold text-[#0F766E] hover:bg-[#eef5ff]"
                        aria-label="Rasm qo‘shish"
                      >
                        <Plus className="size-4" />
                        {pending.length === 0 ? "Rasm qo‘shish" : ""}
                      </button>
                    ) : null}
                    {pending.length === 0
                      ? photoLabels.map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={openPicker}
                            className="grid h-[68px] w-[68px] place-items-center rounded-lg bg-[#f4f7fb] text-[10.5px] font-semibold text-[#8b93a7] ring-1 ring-[#eceff5] hover:bg-[#eef3f9]"
                          >
                            <span className="flex flex-col items-center gap-1">
                              <ImagePlus className="size-4 text-[#9aa8bc]" />
                              {label}
                            </span>
                          </button>
                        ))
                      : null}
                  </div>
                  {pending.length ? (
                    <p className="mt-1.5 text-[11px] text-[#8b93a7]">
                      {pending.length}/{MAX_IMAGES} rasm · joylashda avtomatik siqiladi (1600px)
                    </p>
                  ) : null}
                </div>

                {nameWarn ? (
                  <p className="text-sm text-amber-700">
                    Matnda bemor ismiga o‘xshash ibora bor. Ismni olib tashlang yoki «Joylash»ni qayta bosing — post chiqaveradi.
                  </p>
                ) : null}
                {error ? (
                  <p className="text-sm text-destructive">
                    {error}
                    {!profile && authReady ? (
                      <Link href="/kirish" className="ml-1.5 font-semibold text-[#0F766E] underline">
                        Kirish
                      </Link>
                    ) : null}
                  </p>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f3f8] pt-3">
                <label className="flex items-center gap-2 text-[12.5px] text-[#6b7488]">
                  <Eye className="size-4 text-[#8b93a7]" />
                  Kimlar ko‘ra oladi?
                  <span className="relative">
                    <select
                      value="all"
                      onChange={() => {}}
                      aria-label="Kimlar ko‘ra oladi?"
                      className="h-9 cursor-pointer appearance-none rounded-lg border border-[#e6eaf2] bg-white pr-8 pl-3 text-[12.5px] font-semibold text-[#1a1d26] outline-none"
                    >
                      <option value="all">Barchasi</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[#8b93a7]" />
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-9 !rounded-[10px] px-5 text-[13px]" onClick={() => {
                      resetComposer();
                      setOpenComposer(false);
                    }} disabled={Boolean(busyText)}>
                    Bekor
                  </Button>
                  <Button
                    className="h-9 !rounded-[10px] px-6 text-[13px] font-semibold"
                    onClick={() => void publishPost()}
                    disabled={Boolean(busyText) || preparing}
                  >
                    {busyText ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    {busyText || "Joylash"}
                  </Button>
                </div>
              </div>
            </section>
            )}

            {/* Sort tabs */}
            <div className="flex items-center gap-1 border-b border-[#e6eaf2]">
              {sortTabs.map((item) => {
                const on = sort === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSort(item.id)}
                    aria-pressed={on}
                    className={cn(
                      "-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
                      on ? "border-[#0F766E] text-[#0F766E]" : "border-transparent text-[#6b7488] hover:text-[#1a1d26]",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {renderFeedState("desktop") ?? (visible.length === 0 ? (
              <div className="rounded-[14px] border border-[#eceff5] bg-white px-6 py-16 text-center text-[#8b93a7]">
                <p className="text-[15px] font-semibold text-[#1a1d26]">Bu filtr bo‘yicha post yo‘q</p>
                <p className="mt-1 text-sm">Barchasini ko‘ring yoki yangi post yozing.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    className="h-9 !rounded-xl"
                    onClick={() => {
                      setKind("");
                      setCat("");
                      setTag("");
                    }}
                  >
                    Filtrlarni tozalash
                  </Button>
                  <Button className="h-9 !rounded-xl" onClick={() => focusComposer(kind || "case")}>
                    Yangi post
                  </Button>
                </div>
              </div>
            ) : (
              sortedVisible.map((post) => renderFeedPost(post, "desktop"))
            ))}
          </div>

          <aside className="space-y-3">
            <Rail title="Trend mavzular" icon={Flame} iconClass="text-[#ff6b35]" action="Barcha trend mavzular" onAction={() => setTag("")}>
              {trends.length === 0 ? (
                <p className="text-[13px] text-[#8b93a7]">Postlarda teglar paydo bo‘lganda shu yerda ko‘rinadi.</p>
              ) : null}
              <ol className="space-y-2.5">
                {trends.slice(0, 5).map((item, index) => (
                  <li key={item.tag}>
                    <button type="button" onClick={() => { setTag(item.tag); setCat(""); }} className="flex w-full items-center gap-3 text-left">
                      <span className="w-4 text-[13px] font-semibold text-[#c5cad6]">{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-[#0F766E]">#{item.tag.replace(/\s+/g, "")}</span>
                      </span>
                      <span className="text-[12px] text-[#8b93a7]">{item.posts} post</span>
                    </button>
                  </li>
                ))}
              </ol>
            </Rail>

            <Rail title="Haftaning top doktorlari" icon={Trophy} iconClass="text-[#f5b400]" action="Barcha ustalar" href="/ustalar">
              {doctors.length === 0 ? (
                <p className="text-[13px] text-[#8b93a7]">Faol shifokorlar reytingi post va izohlar asosida hisoblanadi.</p>
              ) : null}
              <ol className="space-y-3">
                {doctors.slice(0, 3).map((doc, index) => (
                  <li key={doc.id} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                        index === 0 && "bg-[#f5c518]",
                        index === 1 && "bg-[#c5cad3]",
                        index === 2 && "bg-[#d0894b]",
                      )}
                    >
                      {index + 1}
                    </span>
                    {doc.avatar ? (
                      <PostMedia src={doc.avatar} width={36} height={36} className="size-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex size-9 items-center justify-center rounded-full bg-[#F0FDFA] text-[11px] font-semibold text-primary">
                        {initialsOf(doc.name)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-[#1a1d26]">{doc.name}</span>
                      <span className="block text-[12px] text-[#8b93a7]">{doc.specialty}</span>
                    </span>
                    <span className="rounded-full bg-[#e6f7ed] px-2 py-0.5 text-[11.5px] font-bold text-[#16a34a]">+{doc.score}</span>
                  </li>
                ))}
              </ol>
            </Rail>

            <div className="rounded-[14px] border border-[#eceff5] bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#0F766E]" />
                <h2 className="text-[13.5px] font-semibold text-[#1a1d26]">Community qoidalari</h2>
              </div>
              <ol className="space-y-2.5">
                {deskRules.map((rule, index) => (
                  <li key={rule} className="flex gap-2.5 text-[13px] leading-snug text-[#4b5568]">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-[11px] font-bold text-[#0F766E]">
                      {index + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          void onPickImages(event.target.files);
          event.target.value = "";
        }}
      />

      {lightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-6"
          onClick={() => setLightbox(null)}
        >
          <PostMedia src={lightbox} width={960} height={720} className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
        </button>
      ) : null}
    </div>
  );
}

function Rail({
  title,
  icon: Icon,
  iconClass,
  children,
  action,
  href,
  onAction,
}: {
  title: string;
  icon: typeof Flame;
  iconClass: string;
  children: ReactNode;
  action: string;
  href?: string;
  onAction?: () => void;
}) {
  const footerClass =
    "mt-3 flex w-full items-center justify-between text-[13px] font-medium text-[#0F766E] hover:underline";

  return (
    <section className="rounded-[14px] border border-[#eceff5] bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn("size-4", iconClass)} />
        <h2 className="flex-1 text-[13.5px] font-semibold text-[#1a1d26]">{title}</h2>
      </div>
      {children}
      {href ? (
        <Link href={href} className={footerClass}>
          {action}
          <ArrowRight className="size-3.5" />
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={footerClass}>
          {action}
          <ArrowRight className="size-3.5" />
        </button>
      )}
    </section>
  );
}
