"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, Bookmark, ClipboardList, Flame, Heart, HelpCircle, ImagePlus, MessageCircle, MessagesSquare, Plus, Send, ShieldCheck, Star, Trophy } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { useCommunityWork } from "@/components/community-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { uploadImage } from "@/lib/image-upload";
import { CASE_TAGS, caseProblem } from "@/lib/forms/p0";
import {
  communityCategories,
  communityRules,
  type CommunityPost,
  type PostKind,
} from "@/data/desktop-hub";
import type { CommunityPost as LivePost } from "@/data/community";
import "./hub.css";
import "./community.css";

const kinds = [
  { id: "keys" as PostKind, label: "Klinik keys", icon: ClipboardList },
  { id: "savol" as PostKind, label: "Savol", icon: HelpCircle },
  { id: "muhokama" as PostKind, label: "Muhokama", icon: MessagesSquare },
];

const tabs = [
  { id: "lenta", label: "Lenta" },
  { id: "keys", label: "Klinik keyslar" },
  { id: "savol", label: "Savollar" },
  { id: "mine", label: "Mening postlarim" },
] as const;

function mapLive(post: LivePost, viewerId: string | null): CommunityPost {
  const lines = post.text.split("\n").filter((line) => line.trim());
  const kind: PostKind = post.kind === "savol" ? "savol" : post.kind === "yangilik" ? "muhokama" : "keys";
  return {
    id: post.id,
    author: post.author.name,
    role: post.author.specialty,
    city: post.author.city,
    avatar: post.author.avatar || "/img/design-pr13/ui/avatar.png",
    // The first line is the headline and the rest is the body; a one-line post is body only.
    title: lines.length > 1 ? lines[0].slice(0, 120) : "",
    body: lines.length > 1 ? lines.slice(1).join("\n").trim() : post.text,
    kind,
    time: post.time,
    category: post.tags[0] || "Klinik holatlar",
    photos: (post.images ?? []).map((src) => ({ src, label: "" })),
    tags: post.tags,
    likes: post.likes,
    comments: post.comments,
    mine: Boolean(viewerId && post.authorId === viewerId),
  };
}

export function CommunityDesktop() {
  const cartCount = useShopLineCount();
  const work = useCommunityWork();
  const { profile } = useDoctorProfile();
  const params = useSearchParams();
  const paramQ = params.get("q") ?? "";
  const [q, setQ] = useState(paramQ);
  const posts = useMemo(() => work.feed.map((post) => mapLive(post, work.viewerId)), [work.feed, work.viewerId]);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<PostKind>("keys");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("lenta");
  const [category, setCategory] = useState("Barchasi");
  const [sort, setSort] = useState<"new" | "hot">("new");
  const [sortOpen, setSortOpen] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<string[]>([]);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [trendOn, setTrendOn] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(true);
  const [consent, setConsent] = useState(false);
  const [faceAck, setFaceAck] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setQ(paramQ);
  }, [paramQ]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const rows = posts.filter((post) => {
      if (tab === "keys" && post.kind !== "keys") return false;
      if (tab === "savol" && post.kind !== "savol") return false;
      if (tab === "mine" && !post.mine) return false;
      if (category !== "Barchasi" && post.category !== category && !(category === "Klinik holatlar" && post.kind === "keys")) return false;
      if (trendOn && !post.tags.some((tag) => tag.toLowerCase() === trendOn.toLowerCase()) && !post.title.toLowerCase().includes(trendOn.replace("#", "").toLowerCase())) return false;
      if (!query) return true;
      return `${post.title} ${post.body} ${post.author} ${post.tags.join(" ")}`.toLowerCase().includes(query);
    });
    if (sort === "hot") return [...rows].sort((a, b) => b.likes - a.likes);
    return rows;
  }, [posts, tab, category, q, sort, trendOn]);

  async function publish() {
    const body = text.trim();
    if (!body) return;
    if (kind === "keys") {
      const problem = caseProblem({
        text: body,
        tags: CASE_TAGS.slice(0, 1),
        images: [],
        consent,
        faceAck,
        complaint: body,
        diagnosis: body,
        steps: body,
      });
      setNote(problem || "Klinik holatni /community dagi to‘liq formada joylang: rozilik, oldin/keyin rasmlar va bosqichlar.");
      return;
    }
    let images: string[] | undefined;
    if (photoFile) {
      try {
        images = [await uploadImage(photoFile, "post")];
      } catch {
        return;
      }
    }
    const result = await work.publish({
      kind: kind === "savol" ? "savol" : "yangilik",
      text: body,
      tags: category === "Barchasi" ? [] : [category],
      images,
    });
    if (!result.ok) {
      setNote(result.error);
      return;
    }
    setNote("");
    setText("");
    setPhoto(null);
    setPhotoFile(null);
    setTab("mine");
  }

  return (
    <ShopShell searchPath="/community" cartCount={cartCount} placeholder="Stomatologga nima kerak?" showCamera={false}>
      <div className="hub-split cmd">
        <div className="hub-page">
          <div className="hub-head">
            <div>
              <h1>Community</h1>
              <p>Stomatologlar uchun professional bilim va tajriba almashish maydoni.</p>
            </div>
            <button type="button" className="hub-btn" onClick={() => document.getElementById("hub-composer")?.focus()}>
              <Plus className="i" /> Post yozish
            </button>
          </div>
          <section className="hub-box hub-compose">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" />
            ) : (
              <span className="cm-ini" aria-hidden>
                {(profile?.fullName || "S").replace(/^Dr\.?\s*/i, "").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div style={{ flex: 1 }}>
              <textarea id="hub-composer" value={text} onChange={(event) => setText(event.target.value)} placeholder="Keys yoki savolingizni yozing..." />
              <div className="hub-kinds">
                {kinds.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" className={kind === item.id ? "cm-kind on" : "cm-kind"} aria-pressed={kind === item.id} onClick={() => setKind(item.id)}>
                      <Icon className="i" /> {item.label}
                    </button>
                  );
                })}
                <label className="cm-photo">
                  <ImagePlus className="i" /> Rasm qo‘shish
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setPhotoFile(file);
                      const reader = new FileReader();
                      reader.onload = () => setPhoto(String(reader.result));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <button type="button" className="hub-btn cm-publish" onClick={publish} disabled={!text.trim()}>
                  Post joylash
                </button>
              </div>
              {kind === "keys" ? (
                <div className="mt-2 grid gap-1 text-[12.5px]">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Bemor roziligi</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={faceAck} onChange={(event) => setFaceAck(event.target.checked)} /> Yuz ko‘rinmaydi</label>
                </div>
              ) : null}
              {note ? <p className="mt-2 text-[13px] text-[#9a3412]">{note}</p> : null}
              {photo ? <img className="hub-preview" src={photo} alt="" /> : null}
            </div>
          </section>
          <div className="hub-frow cm-tabs" role="tablist">
            {tabs.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "cm-tab on" : "cm-tab"} onClick={() => setTab(item.id)}>
                {item.label}
              </button>
            ))}
            <div className="hub-tools">
              <div className={sortOpen ? "dk-drop on" : "dk-drop"}>
                <button type="button" onClick={() => setSortOpen((open) => !open)}>
                  Saralash: {sort === "new" ? "Yangi" : "Mashhur"}
                </button>
                {sortOpen ? (
                  <div className="dk-pop">
                    <button type="button" className="hub-check" onClick={() => { setSort("new"); setSortOpen(false); }}>
                      Yangi
                    </button>
                    <button type="button" className="hub-check" onClick={() => { setSort("hot"); setSortOpen(false); }}>
                      Mashhur
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="hub-frow cmd-cats">
            {communityCategories.map((item) => (
              <button key={item} type="button" className={category === item ? "hub-chip on" : "hub-chip"} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
          {shown.length === 0 ? <div className="hub-empty">Bu bo‘limda post yo‘q. Birinchi bo‘lib yozing.</div> : null}
          {shown.map((post) => {
            const liked = Boolean(likes[post.id]);
            return (
              <article className="hub-post" key={post.id}>
                <div className="top">
                  <img src={post.avatar} alt="" />
                  <div>
                    <b>
                      {post.author} <BadgeCheck className="cm-verified" aria-label="Tasdiqlangan" />
                    </b>
                    <small>
                      {post.role} · {post.city}
                    </small>
                  </div>
                  <span className="hub-pill">
                    {post.kind === "keys" ? <ClipboardList className="i" /> : post.kind === "savol" ? <HelpCircle className="i" /> : <MessagesSquare className="i" />}
                    {post.kind === "keys" ? "Klinik keys" : post.kind === "savol" ? "Savol" : "Muhokama"}
                  </span>
                  <small>{post.time}</small>
                </div>
                {post.title ? <h3>{post.title}</h3> : null}
                {post.body ? <p className="body">{post.body}</p> : null}
                {post.fdi ? (
                  <div className="hub-facts">
                    <div className="hub-fact">
                      <small>FDI tish raqami</small>
                      <b>{post.fdi}</b>
                    </div>
                    <div className="hub-fact">
                      <small>Diagnoz</small>
                      <b>{post.diagnoz}</b>
                    </div>
                    <div className="hub-fact">
                      <small>Davolash</small>
                      <b>{post.davolash}</b>
                    </div>
                    <div className="hub-fact">
                      <small>Natija</small>
                      <b>{post.natija}</b>
                    </div>
                  </div>
                ) : null}
                {post.photos.length ? (
                  <div className={post.photos.length > 4 ? "hub-photos five" : "hub-photos"}>
                    {post.photos.slice(0, 5).map((photoItem, index) => (
                      <figure key={`${index}-${photoItem.src}`}>
                        <img src={photoItem.src} alt={photoItem.label || `${post.title || post.author}, rasm ${index + 1}`} />
                        {photoItem.label ? <figcaption>{photoItem.label}</figcaption> : null}
                      </figure>
                    ))}
                  </div>
                ) : null}
                <div className="hub-ptags">
                  {post.tags.map((tag) => (
                    <span key={tag}>#{tag.replace(/\s+/g, "")}</span>
                  ))}
                </div>
                <div className="hub-react">
                  <button type="button" className={work.isLiked(post.id) || liked ? "on" : ""} onClick={() => void work.toggleLike(post.id)}>
                    <Heart className="i" /> {post.likes}
                  </button>
                  {post.mine ? <button type="button" onClick={() => void work.deletePost(post.id)}>O‘chirish</button> : null}
                  <button type="button" onClick={() => setReplyFor(replyFor === post.id ? null : post.id)}>
                    <MessageCircle className="i" /> {post.comments}
                  </button>
                  <button type="button" className={saved.includes(post.id) ? "on" : ""} onClick={() => setSaved((prev) => (prev.includes(post.id) ? prev.filter((id) => id !== post.id) : [...prev, post.id]))}>
                    <Bookmark className="i" /> {saved.includes(post.id) ? "Saqlangan" : "Saqlash"}
                  </button>
                  <button type="button" className="go" onClick={() => setReplyFor(replyFor === post.id ? null : post.id)}>
                    Javob berish <ArrowRight className="i" />
                  </button>
                </div>
                {replyFor === post.id ? (
                  <form
                    className="hub-reply"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!reply.trim()) return;
                      void work.addComment(post.id, reply).then((ok) => {
                        if (!ok) return;
                        setReply("");
                        setReplyFor(null);
                      });
                    }}
                  >
                    <input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Javob yozing..." />
                    <button type="submit" className="hub-btn" aria-label="Yuborish">
                      <Send className="i" />
                    </button>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
        <aside className="hub-rail">
          <section className="hub-box">
            <h3>
              <span className="cm-h">
                <Trophy className="i gold" /> Haftaning top a’zolari
              </span>
            </h3>
            {work.doctors.length === 0 ? <p className="hub-empty">Hali a’zo yo‘q</p> : work.doctors.map((member, index) => (
              <div className="hub-member" key={member.id}>
                <span className={`n r${index + 1}`}>{index + 1}</span>
                <img src={member.avatar || "/img/design-pr13/ui/avatar.png"} alt="" />
                <div>
                  <b>{member.name}</b>
                  <small>{member.specialty}</small>
                </div>
                <em>
                  <Star className="i" /> {member.score}
                  <small>ball</small>
                </em>
              </div>
            ))}
          </section>
          <section className="hub-box">
            <h3>
              <span className="cm-h">
                <Flame className="i fire" /> Trend mavzular
              </span>
            </h3>
            {work.trends.length === 0 ? <p className="hub-empty">Hali trend yo‘q</p> : work.trends.map((item, index) => (
              <button key={item.tag} type="button" className="hub-trend" onClick={() => setTrendOn(trendOn === item.tag ? null : item.tag)}>
                <span>{index + 1}</span>
                <b>#{item.tag.replace(/\s+/g, "")}</b>
                <em>{item.posts} ta post</em>
              </button>
            ))}
            <button type="button" className="hub-more" onClick={() => setTrendOn(null)}>
              Barcha trend mavzular →
            </button>
          </section>
          <section className="hub-box">
            <h3>
              <span className="cm-h">
                <ShieldCheck className="i shield" /> Community qoidalari
              </span>
              <button type="button" onClick={() => setRulesOpen((open) => !open)}>
                {rulesOpen ? "Yig‘ish" : "Ochish"}
              </button>
            </h3>
            {rulesOpen
              ? communityRules.map((rule, index) => (
                  <div className="hub-rule" key={rule}>
                    <i>{index + 1}</i>
                    <span>{rule}</span>
                  </div>
                ))
              : null}
          </section>
        </aside>
      </div>
    </ShopShell>
  );
}
