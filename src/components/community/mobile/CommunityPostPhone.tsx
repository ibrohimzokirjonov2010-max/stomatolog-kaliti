"use client";
/* eslint-disable @next/next/no-img-element -- avatars are user uploads */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronDown, Heart, MapPin, MessageCircle, MoreVertical, Send, Share2, Trash2 } from "lucide-react";
import { PostMedia } from "@/components/community-card";
import { useCommunityWork } from "@/components/community-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useFavorites } from "@/components/favorites-provider";
import { postKindLabels, type CommunityPost } from "@/data/community";
import "./community-post-phone.css";

function initials(name: string) {
  return name.replace(/^dr\.?\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function Avatar({ src, name, className }: { src?: string; name: string; className: string }) {
  return src ? <img src={src} alt="" className={className} /> : <span className={`${className} cp-initials`}>{initials(name)}</span>;
}

/** Phone layout of /community/[id] (mock "hamjamiyat posti"). */
export function CommunityPostPhone({ post, onOpenImage }: { post: CommunityPost; onOpenImage: (src: string) => void }) {
  const router = useRouter();
  const { toggleLike, addComment, deleteComment, deletePost, share, viewerId } = useCommunityWork();
  const { profile } = useDoctorProfile();
  const favorites = useFavorites();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [newest, setNewest] = useState(true);
  const [menu, setMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canDelete = Boolean(viewerId && (post.authorId === viewerId || profile?.role === "admin"));
  const saved = favorites.has(`post:${post.id}`);
  const images = post.images ?? [];
  const replies = [...post.replies].sort((a, b) => {
    const order = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    return newest ? -order : order;
  });

  async function send() {
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await addComment(post.id, draft);
    setSending(false);
    if (ok) setDraft("");
  }

  function replyTo(name: string) {
    setDraft((value) => (value.startsWith(`@${name}`) ? value : `@${name} ${value}`));
    inputRef.current?.focus();
  }

  return (
    <div className="cp lg:hidden" data-testid="community-post-phone">
      <article className="cp-card">
        <header className="cp-head">
          <Avatar src={post.author.avatar} name={post.author.name} className="cp-ava" />
          <div className="cp-who">
            <b>{post.author.name}</b>
            {post.author.specialty ? <span>{post.author.specialty}</span> : null}
            {post.author.city ? <span className="cp-city"><MapPin /> {post.author.city}</span> : null}
          </div>
          <span className="cp-time">{post.time}</span>
          {canDelete ? (
            <span className="cp-menu-wrap">
              <button type="button" className="cp-more" aria-label="Yana" aria-expanded={menu} onClick={() => setMenu((open) => !open)}><MoreVertical /></button>
              {menu ? (
                <span className="cp-menu">
                  <button type="button" onClick={() => { setMenu(false); if (window.confirm("Post o‘chirilsinmi?")) void deletePost(post.id).then((ok) => ok && router.push("/community")); }}><Trash2 /> O‘chirish</button>
                </span>
              ) : null}
            </span>
          ) : null}
        </header>

        <p className="cp-text">{post.text}</p>

        {images.length ? (
          <div className={`cp-imgs n${Math.min(images.length, 3)}`}>
            {images.slice(0, 3).map((src, index) => (
              <button key={src + index} type="button" onClick={() => onOpenImage(src)} aria-label={`Rasm ${index + 1}`}>
                <PostMedia src={src} width={360} height={280} className="cp-img" />
                {index === 2 && images.length > 3 ? <span className="cp-more-imgs">+{images.length - 3}</span> : null}
              </button>
            ))}
          </div>
        ) : null}

        <div className="cp-tags">
          <span>{postKindLabels[post.kind]}</span>
          {post.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>

        <div className="cp-actions">
          <button type="button" className={post.likedByMe ? "on" : ""} aria-pressed={Boolean(post.likedByMe)} onClick={() => void toggleLike(post.id)}>
            <Heart /> {post.likes > 0 ? `${post.likes} ta` : "Yoqdi"}
          </button>
          <button type="button" onClick={() => inputRef.current?.focus()}><MessageCircle /> {post.comments} ta izoh</button>
          <button type="button" onClick={() => void share(post.id)}><Share2 /> Ulashish</button>
          <button type="button" className={saved ? "cp-save on" : "cp-save"} aria-pressed={saved} onClick={() => favorites.toggle(`post:${post.id}`)}>
            <Bookmark /> {saved ? "Saqlangan" : "Saqlash"}
          </button>
        </div>
      </article>

      <section className="cp-card cp-comments">
        <div className="cp-c-head">
          <h2>Izohlar ({post.replies.length})</h2>
          <button type="button" className="cp-sort" onClick={() => setNewest((value) => !value)}>{newest ? "Eng yangi" : "Eng eski"} <ChevronDown /></button>
        </div>

        {viewerId ? (
          <form className="cp-compose" onSubmit={(event) => { event.preventDefault(); void send(); }}>
            <Avatar src={profile?.avatarUrl} name={profile?.fullName ?? ""} className="cp-ava sm" />
            <input ref={inputRef} value={draft} placeholder="Izoh yozing..." aria-label="Izoh" onChange={(event) => setDraft(event.target.value.slice(0, 1000))} />
            <button type="submit" className="cp-send" aria-label="Yuborish" disabled={!draft.trim() || sending}><Send /></button>
          </form>
        ) : (
          <button type="button" className="cp-login" onClick={() => router.push(`/kirish?next=/community/${post.id}`)}>Izoh yozish uchun tizimga kiring</button>
        )}

        {replies.length === 0 ? <p className="cp-empty">Hali izoh yo‘q. Birinchi bo‘lib fikr bildiring.</p> : null}
        <ul className="cp-list">
          {replies.map((reply) => (
            <li key={reply.id}>
              <Avatar src={reply.avatar} name={reply.author} className="cp-ava sm" />
              <div className="cp-reply">
                <div className="cp-r-head">
                  <b>{reply.author}</b>
                  <span>{reply.time}</span>
                  {viewerId && (reply.authorId === viewerId || profile?.role === "admin") ? (
                    <button type="button" className="cp-r-del" aria-label="Izohni o‘chirish" onClick={() => void deleteComment(reply.id)}><Trash2 /></button>
                  ) : null}
                </div>
                <p>{reply.text}</p>
                {viewerId ? <button type="button" className="cp-r-reply" onClick={() => replyTo(reply.author)}>Javob berish</button> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
