"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Flag,
  Bookmark,
  BookmarkCheck,
  Heart,
  ImageOff,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { Button } from "@/components/ui/button";
import { communityHref, postKindLabels, type CommunityPost } from "@/data/community";
import { cn } from "@/lib/utils";

export function initialsOf(name: string) {
  return name.replace("Dr. ", "").slice(0, 2);
}

export function PostMedia({
  src,
  className,
  width,
  height,
  alt = "",
}: {
  src: string;
  className?: string;
  width: number;
  height: number;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const local = src.startsWith("/") && !src.startsWith("//") && !src.startsWith("/http");
  if (failed) {
    // Rasm yuklanmadi: neutral placeholder (bir xil o‘lcham)
    return (
      <span
        role="img"
        aria-label={alt || "Rasm yuklanmadi"}
        className={cn("grid place-items-center bg-gradient-to-br from-[#F0FDFA] to-[#F0FDFA] text-[#0F766E]/50", className)}
      >
        <ImageOff className="size-5" strokeWidth={1.6} />
      </span>
    );
  }
  if (local) {
    return <Image src={src} alt={alt} width={width} height={height} className={className} onError={() => setFailed(true)} />;
  }
  return (
    // Uploaded (Supabase Storage) image, OAuth avatar, or blob preview
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} loading="eager" decoding="async" onError={() => setFailed(true)} className={className} />
  );
}

export function PostMenu({
  postId,
  onDelete,
  canReport = false,
  className,
}: {
  postId: string;
  onDelete?: () => void;
  canReport?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [status, setStatus] = useState<"" | "sending" | "sent" | "error">("");
  if (!onDelete && !canReport) return null;

  async function report(reason: string) {
    setStatus("sending");
    try {
      const res = await fetch(`/api/community/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reason }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setReportOpen(false);
          setStatus("");
        }}
        className="grid size-8 place-items-center rounded-full text-[#8b93a7] hover:bg-slate-50"
        aria-label="Ko‘proq"
        aria-expanded={open}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-10 cursor-default" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl border border-[#eceff5] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (window.confirm("Postni o‘chirasizmi? Bu amalni qaytarib bo‘lmaydi.")) onDelete();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-[#d92d20] hover:bg-[#fff1f0]"
              >
                <Trash2 className="size-4" />
                Postni o‘chirish
              </button>
            ) : null}
            {canReport && status === "sent" ? (
              <p className="px-3 py-2.5 text-[12.5px] font-medium text-[#15803d]">Shikoyat yuborildi. Rahmat!</p>
            ) : canReport && reportOpen ? (
              <div className="py-1">
                <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8b93a7]">Sabab</p>
                {["spam", "reklama", "haqorat", "noto‘g‘ri ma’lumot", "boshqa"].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    disabled={status === "sending"}
                    onClick={() => void report(reason)}
                    className="block w-full px-3 py-2 text-left text-[13px] capitalize text-[#1a1d26] hover:bg-slate-50 disabled:opacity-60"
                  >
                    {reason}
                  </button>
                ))}
                {status === "error" ? <p className="px-3 py-1 text-[12px] text-[#d92d20]">Yuborilmadi. Qayta urinib ko‘ring.</p> : null}
              </div>
            ) : canReport ? (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-[#4b5568] hover:bg-slate-50"
              >
                <Flag className="size-4" />
                Shikoyat qilish
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function DesktopGallery({ images, onOpen }: { images: string[]; onOpen: (src: string) => void }) {
  const shown = images.slice(0, 5);
  const extra = images.length - shown.length;
  const wide = shown.length <= 2;
  return (
    <div
      className={cn("mt-3 grid gap-2", wide ? "grid-cols-2" : "")}
      style={wide ? undefined : { gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}
    >
      {shown.map((src, index) => (
        <button
          key={`${src}-${index}`}
          type="button"
          onClick={() => onOpen(src)}
          className={cn("relative overflow-hidden rounded-[10px] bg-slate-100", wide ? "aspect-[16/10] max-h-[280px] min-h-[148px] w-full" : "h-[96px]")}
        >
          <PostMedia src={src} width={480} height={280} className="size-full object-cover" />
          {extra > 0 && index === shown.length - 1 ? (
            <span className="absolute inset-0 grid place-items-center bg-black/55 text-[18px] font-bold text-white">+{extra}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** Desktop card: first line / sentence becomes a bold title, the rest is the summary. */
function splitTitle(text: string) {
  const clean = text.trim();
  const nl = clean.indexOf("\n");
  const firstLine = nl === -1 ? clean : clean.slice(0, nl).trim();
  if (firstLine.length <= 90 && nl !== -1) return { title: firstLine, body: clean.slice(nl + 1).trim() };
  const sentence = clean.match(/^.{12,}?[.!?](\s|$)/)?.[0].trim();
  if (sentence && sentence.length <= 90 && sentence.length < clean.length) {
    return { title: sentence.replace(/[.]$/, ""), body: clean.slice(sentence.length).trim() };
  }
  if (clean.length <= 90) return { title: clean, body: "" };
  const cut = clean.slice(0, 80).replace(/\s+\S*$/, "");
  return { title: `${cut}…`, body: clean };
}

const kindTone: Record<CommunityPost["kind"], string> = {
  case: "bg-[#F0FDFA] text-[#0F766E]",
  savol: "bg-amber-50 text-amber-700",
  yangilik: "bg-emerald-50 text-emerald-700",
};

export function FeedPost({
  post,
  liked,
  commentsOpen,
  replyDraft,
  likes,
  onLike,
  onShare,
  onToggleComments,
  onReplyChange,
  onReply,
  onOpenImage,
  onTag,
  variant = "desktop",
  canDelete = false,
  onDelete,
  viewerId,
  onDeleteReply,
}: {
  post: CommunityPost;
  liked: boolean;
  commentsOpen: boolean;
  replyDraft: string;
  likes: number;
  onLike: () => void;
  onShare: () => void;
  onToggleComments: () => void;
  onReplyChange: (value: string) => void;
  onReply: () => void;
  onOpenImage: (src: string) => void;
  onTag: (tag: string) => void;
  variant?: "desktop" | "mobile";
  canDelete?: boolean;
  onDelete?: () => void;
  viewerId?: string | null;
  onDeleteReply?: (id: string) => void;
}) {
  const favorites = useFavorites();
  const saved = favorites.has(`post:${post.id}`);

  if (variant === "mobile") {
    return (
      <MobileFeedPost
        post={post}
        liked={liked}
        commentsOpen={commentsOpen}
        replyDraft={replyDraft}
        likes={likes}
        onLike={onLike}
        onShare={onShare}
        onToggleComments={onToggleComments}
        onReplyChange={onReplyChange}
        onReply={onReply}
        onOpenImage={onOpenImage}
        onTag={onTag}
        canDelete={canDelete}
        onDelete={onDelete}
        viewerId={viewerId}
        onDeleteReply={onDeleteReply}
      />
    );
  }

  const preview = post.replies[0];

  function onComment(event: FormEvent) {
    event.preventDefault();
    onReply();
  }

  return (
    <article id={post.id} className="scroll-mt-24 rounded-[14px] border border-[#eceff5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        {post.author.avatar ? (
          <PostMedia
            src={post.author.avatar}
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-11 items-center justify-center rounded-full bg-[#CCFBF1] text-sm font-semibold text-primary">
            {initialsOf(post.author.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1 text-[14px] font-semibold text-[#1a1d26]">
                <Link href={communityHref(post.id)} className="hover:text-primary">
                  {post.author.name}
                </Link>
                {post.author.verified ? <BadgeCheck className="size-3.5 fill-[#0F766E] text-white" /> : null}
              </p>
              <p className="text-[12px] text-[#8b93a7]">
                {post.author.specialty} · {post.author.city}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[12px] text-[#8b93a7]">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  kindTone[post.kind],
                )}
              >
                {postKindLabels[post.kind]}
              </span>
              <Link href={communityHref(post.id)} className="hover:text-primary">
                {post.time}
              </Link>
              <PostMenu postId={post.id} onDelete={canDelete ? onDelete : undefined} canReport={!canDelete && Boolean(viewerId)} />
            </div>
          </div>
          {(() => {
            const { title, body } = splitTitle(post.text);
            return (
              <>
                <h3 className="mt-3 text-[15px] leading-snug font-bold text-[#1a1d26]">{title}</h3>
                {body ? <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] leading-relaxed text-[#4b5568]">{body}</p> : null}
              </>
            );
          })()}
          {post.images?.length ? <DesktopGallery images={post.images} onOpen={onOpenImage} /> : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onTag(item)}
                className="text-[12px] font-medium text-[#0F766E] hover:underline"
              >
                #{item.replace(/\s+/g, "")}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-5 border-t border-[#f0f3f8] pt-3 text-[13px] text-[#6b7488]">
            <button
              type="button"
              onClick={onLike}
              className={cn("inline-flex items-center gap-1.5 hover:text-[#0F766E]", liked && "text-[#0F766E]")}
            >
              <Heart className={cn("size-4", liked && "fill-[#0F766E]")} />
              Like <span className="font-semibold">{likes}</span>
            </button>
            <button type="button" onClick={onToggleComments} className="inline-flex items-center gap-1.5 hover:text-[#0F766E]">
              <MessageCircle className="size-4" />
              Izoh <span className="font-semibold">{post.comments}</span>
            </button>
            <button type="button" onClick={onShare} className="inline-flex items-center gap-1.5 hover:text-[#0F766E]">
              <Share2 className="size-4" />
              Ulashish {post.shares > 0 ? <span className="font-semibold">{post.shares}</span> : null}
            </button>
            <button
              type="button"
              onClick={() => favorites.toggle(`post:${post.id}`)}
              aria-pressed={saved}
              className={cn("inline-flex items-center gap-1.5 hover:text-[#0F766E]", saved && "text-[#0F766E]")}
            >
              {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {saved ? "Saqlangan" : "Saqlash"}
            </button>
            <Link
              href={communityHref(post.id)}
              className="ml-auto inline-flex h-8 items-center rounded-[9px] border border-[#99F6E4] bg-white px-3.5 text-[12.5px] font-semibold text-[#0F766E] hover:bg-[#f5f8ff]"
            >
              Batafsil
            </Link>
          </div>
        </div>
      </div>

      {preview && !commentsOpen ? (
        <div className="mt-3 ml-[56px] flex gap-2.5">
          {preview.avatar ? (
            <PostMedia
              src={preview.avatar}
              alt=""
              width={28}
              height={28}
              className="mt-0.5 size-7 rounded-full object-cover"
            />
          ) : (
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#CCFBF1] text-[10px] font-semibold text-primary">
              {initialsOf(preview.author)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#8b93a7]">
              <span className="font-semibold text-[#1a1d26]">{preview.author}</span>
              <span className="mx-1.5">·</span>
              {preview.time}
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[#4b5568]">{preview.text}</p>
            <button
              type="button"
              onClick={onToggleComments}
              className="mt-1 text-[12px] font-medium text-[#0F766E] hover:underline"
            >
              Javoblarni ko‘rish ({post.replies.length})
            </button>
          </div>
        </div>
      ) : null}

      {commentsOpen ? (
        <div className="mt-3 ml-[56px] space-y-2.5">
          {post.replies.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Hali javob yo‘q. Birinchi bo‘lib yozing.</p>
          ) : (
            post.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2.5">
                {reply.avatar ? (
                  <PostMedia
                    src={reply.avatar}
                    alt=""
                    width={28}
                    height={28}
                    className="mt-0.5 size-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#CCFBF1] text-[10px] font-semibold text-primary">
                    {initialsOf(reply.author)}
                  </span>
                )}
                <div className="min-w-0 flex-1 rounded-[12px] bg-[#f7f8fb] px-3 py-2">
                  <p className="text-[12px] text-[#8b93a7]">
                    <span className="font-semibold text-[#1a1d26]">{reply.author}</span>
                    <span className="mx-1.5">·</span>
                    {reply.time}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#4b5568]">{reply.text}</p>
                  {viewerId && reply.authorId === viewerId && onDeleteReply ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Izohni o‘chirasizmi?")) onDeleteReply(reply.id);
                      }}
                      className="mt-1 text-[11.5px] font-semibold text-[#8b93a7] hover:text-[#d92d20]"
                    >
                      O‘chirish
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
          <form className="flex gap-2" onSubmit={onComment}>
            <input
              value={replyDraft}
              onChange={(event) => onReplyChange(event.target.value)}
              placeholder="Javob yozing..."
              className="h-9 flex-1 rounded-full border border-[#e6eaf2] bg-white px-3 text-sm outline-none focus:border-primary"
            />
            <Button type="submit" size="sm" className="!rounded-full">
              Yuborish
            </Button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function MobileFeedPost({
  post,
  liked,
  commentsOpen,
  replyDraft,
  likes,
  onLike,
  onShare,
  onToggleComments,
  onReplyChange,
  onReply,
  onOpenImage,
  onTag: _onTag,
  canDelete = false,
  onDelete,
  viewerId,
  onDeleteReply,
}: {
  post: CommunityPost;
  liked: boolean;
  commentsOpen: boolean;
  replyDraft: string;
  likes: number;
  onLike: () => void;
  onShare: () => void;
  onToggleComments: () => void;
  onReplyChange: (value: string) => void;
  onReply: () => void;
  onOpenImage: (src: string) => void;
  onTag: (tag: string) => void;
  canDelete?: boolean;
  onDelete?: () => void;
  viewerId?: string | null;
  onDeleteReply?: (id: string) => void;
}) {
  void _onTag;
  const preview = post.replies[0];
  const imageCount = post.images?.length ?? 0;

  function onComment(event: FormEvent) {
    event.preventDefault();
    onReply();
  }

  return (
    <article
      id={post.id}
      className="scroll-mt-24 rounded-[18px] border border-[#eceff5] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-start gap-3">
        {post.author.avatar ? (
          <PostMedia
            src={post.author.avatar}
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#CCFBF1] text-sm font-semibold text-[#0F766E]">
            {initialsOf(post.author.name)}
          </span>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="flex min-w-0 items-center gap-1 text-[15px] font-bold text-[#1a1d26]">
            <Link href={communityHref(post.id)} className="truncate hover:text-[#0F766E]">
              {post.author.name}
            </Link>
            {post.author.verified ? (
              <BadgeCheck className="size-4 shrink-0 fill-[#0F766E] text-white" />
            ) : null}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-[#8b93a7]">
            {post.author.specialty}
            <span className="mx-1.5 text-[#c5cad6]">•</span>
            {post.time}
          </p>
        </div>
        <PostMenu postId={post.id} onDelete={canDelete ? onDelete : undefined} canReport={!canDelete && Boolean(viewerId)} className="-mr-1 shrink-0" />
      </div>

      <Link href={communityHref(post.id)} className="mt-3 block">
        <p className="line-clamp-4 whitespace-pre-line text-[14.5px] leading-relaxed text-[#1a1d26]">
          {post.text}
        </p>
      </Link>

      {post.images?.length ? (
        <div
          className={cn(
            "mt-3 grid gap-2",
            imageCount >= 3 ? "grid-cols-3" : imageCount === 2 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {post.images.map((src, index) => (
            <button
              key={`${index}-${src}`}
              type="button"
              onClick={() => onOpenImage(src)}
              className="overflow-hidden rounded-2xl bg-[#f4f7fb]"
            >
              <PostMedia
                src={src}
                width={480}
                height={280}
                className={cn(
                  "w-full object-cover",
                  imageCount >= 3 ? "h-[96px]" : imageCount === 2 ? "h-[132px]" : "h-[180px]",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3.5 flex items-center gap-5 text-[13.5px] font-medium text-[#8b93a7]">
        <button
          type="button"
          onClick={onLike}
          className={cn("inline-flex items-center gap-1.5 active:opacity-70", liked && "text-[#0F766E]")}
        >
          <Heart className={cn("size-[18px]", liked && "fill-[#0F766E]")} />
          {likes}
        </button>
        <button
          type="button"
          onClick={onToggleComments}
          className="inline-flex items-center gap-1.5 active:opacity-70"
        >
          <MessageCircle className="size-[18px]" />
          {post.comments}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1.5 active:opacity-70"
          aria-label="Ulashish"
        >
          <Share2 className="size-[18px]" />
        </button>
      </div>

      {preview && !commentsOpen ? (
        <div className="mt-3 flex gap-2.5 rounded-2xl bg-[#f7f8fb] px-3 py-2.5">
          {preview.avatar ? (
            <PostMedia
              src={preview.avatar}
              alt=""
              width={32}
              height={32}
              className="mt-0.5 size-8 rounded-full object-cover"
            />
          ) : (
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#CCFBF1] text-[10px] font-semibold text-[#0F766E]">
              {initialsOf(preview.author)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#8b93a7]">
              <span className="font-semibold text-[#1a1d26]">{preview.author}</span>
              <span className="mx-1.5">·</span>
              {preview.time}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-[#4b5568]">{preview.text}</p>
            <button
              type="button"
              onClick={onToggleComments}
              className="mt-1.5 inline-flex h-8 items-center text-[12px] font-semibold text-[#0F766E]"
            >
              Javoblarni ko‘rish ({post.replies.length})
            </button>
          </div>
        </div>
      ) : null}

      {commentsOpen ? (
        <div className="mt-3 space-y-2.5">
          {post.replies.length === 0 ? (
            <p className="text-[13px] text-[#8b93a7]">Hali javob yo‘q. Birinchi bo‘lib yozing.</p>
          ) : (
            post.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2.5">
                {reply.avatar ? (
                  <PostMedia
                    src={reply.avatar}
                    alt=""
                    width={32}
                    height={32}
                    className="mt-0.5 size-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#CCFBF1] text-[10px] font-semibold text-[#0F766E]">
                    {initialsOf(reply.author)}
                  </span>
                )}
                <div className="min-w-0 flex-1 rounded-2xl bg-[#f7f8fb] px-3 py-2.5">
                  <p className="text-[12px] text-[#8b93a7]">
                    <span className="font-semibold text-[#1a1d26]">{reply.author}</span>
                    <span className="mx-1.5">·</span>
                    {reply.time}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#4b5568]">{reply.text}</p>
                  {viewerId && reply.authorId === viewerId && onDeleteReply ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Izohni o‘chirasizmi?")) onDeleteReply(reply.id);
                      }}
                      className="mt-1 text-[11.5px] font-semibold text-[#8b93a7] hover:text-[#d92d20]"
                    >
                      O‘chirish
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
          <form className="flex gap-2" onSubmit={onComment}>
            <input
              value={replyDraft}
              onChange={(event) => onReplyChange(event.target.value)}
              placeholder="Javob yozing..."
              className="h-11 flex-1 rounded-2xl border border-[#e6eaf2] bg-white px-3.5 text-[14px] outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15"
            />
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-[#0F766E] px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(15,118,110,0.22)]"
            >
              Yuborish
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
