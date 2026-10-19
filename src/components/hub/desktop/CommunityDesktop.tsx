"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, Heart, ImagePlus, MessageCircle, Plus, Send, Star } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  communityCategories,
  communityPosts,
  communityRules,
  topMembers,
  trends,
  type CommunityPost,
  type PostKind,
} from "@/data/desktop-hub";
import "./hub.css";

const kinds: { id: PostKind; label: string }[] = [
  { id: "keys", label: "Klinik keys" },
  { id: "savol", label: "Savol" },
  { id: "muhokama", label: "Muhokama" },
];

const tabs = [
  { id: "lenta", label: "Lenta" },
  { id: "keys", label: "Klinik keyslar" },
  { id: "savol", label: "Savollar" },
  { id: "mine", label: "Mening postlarim" },
] as const;

export function CommunityDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const paramQ = params.get("q") ?? "";
  const [q, setQ] = useState(paramQ);
  const [posts, setPosts] = useState<CommunityPost[]>(communityPosts);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<PostKind>("keys");
  const [photo, setPhoto] = useState<string | null>(null);
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

  function publish() {
    const body = text.trim();
    if (!body) return;
    const post: CommunityPost = {
      id: `mine-${Date.now()}`,
      author: "Dr. Ibrohim",
      role: "Stomatolog",
      city: "Toshkent",
      avatar: "/img/design-pr13/ui/avatar.png",
      title: body.slice(0, 80),
      body,
      kind,
      time: "hozir",
      category: category === "Barchasi" ? "Klinik holatlar" : category,
      photos: photo ? [{ src: photo, label: "Rasm" }] : [],
      tags: ["#Case"],
      likes: 0,
      comments: 0,
      mine: true,
    };
    setPosts((prev) => [post, ...prev]);
    setText("");
    setPhoto(null);
    setTab("mine");
  }

  return (
    <ShopShell searchPath="/community" cartCount={cartCount} placeholder="Stomatologga nima kerak?" showCamera={false}>
      <div className="hub-split">
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
            <img src="/img/design-pr13/ui/avatar.png" alt="" />
            <div style={{ flex: 1 }}>
              <textarea id="hub-composer" value={text} onChange={(event) => setText(event.target.value)} placeholder="Keys yoki savolingizni yozing..." />
              <div className="hub-kinds">
                {kinds.map((item) => (
                  <button key={item.id} type="button" className={kind === item.id ? "hub-chip on" : "hub-chip"} onClick={() => setKind(item.id)}>
                    {item.label}
                  </button>
                ))}
                <label className="hub-chip" style={{ cursor: "pointer" }}>
                  <ImagePlus className="i" /> Rasm qo‘shish
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setPhoto(String(reader.result));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <button type="button" className="hub-btn" style={{ marginLeft: "auto" }} onClick={publish} disabled={!text.trim()}>
                  Post joylash
                </button>
              </div>
              {photo ? <img className="hub-preview" src={photo} alt="" /> : null}
            </div>
          </section>
          <div className="hub-frow">
            {tabs.map((item) => (
              <button key={item.id} type="button" className={tab === item.id ? "hub-tab on" : "hub-tab"} onClick={() => setTab(item.id)}>
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
          <div className="hub-frow">
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
                    <b>{post.author}</b>
                    <small>
                      {post.role} · {post.city}
                    </small>
                  </div>
                  <span className="hub-pill">{post.kind === "keys" ? "Klinik keys" : post.kind === "savol" ? "Savol" : "Muhokama"}</span>
                  <small>{post.time}</small>
                </div>
                <h3>{post.title}</h3>
                <p className="body">{post.body}</p>
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
                    {post.photos.map((photoItem) => (
                      <figure key={photoItem.src + photoItem.label}>
                        <img src={photoItem.src} alt={photoItem.label} />
                        <figcaption>{photoItem.label}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
                <div className="hub-ptags">
                  {post.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="hub-react">
                  <button type="button" className={liked ? "on" : ""} onClick={() => setLikes((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}>
                    <Heart className="i" /> {post.likes + (liked ? 1 : 0)}
                  </button>
                  <span>
                    <MessageCircle className="i" /> {post.comments}
                  </span>
                  <button type="button" className={saved.includes(post.id) ? "on" : ""} onClick={() => setSaved((prev) => (prev.includes(post.id) ? prev.filter((id) => id !== post.id) : [...prev, post.id]))}>
                    <Bookmark className="i" /> {saved.includes(post.id) ? "Saqlangan" : "Saqlash"}
                  </button>
                  <button type="button" className="go" onClick={() => setReplyFor(replyFor === post.id ? null : post.id)}>
                    Javob berish →
                  </button>
                </div>
                {replyFor === post.id ? (
                  <form
                    className="hub-reply"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!reply.trim()) return;
                      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, comments: item.comments + 1 } : item)));
                      setReply("");
                      setReplyFor(null);
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
            <h3>Haftaning top a’zolari</h3>
            {topMembers.map((member, index) => (
              <div className="hub-member" key={member.name}>
                <span className="n">{index + 1}</span>
                <img src={member.avatar} alt="" />
                <div>
                  <b>{member.name}</b>
                  <small>
                    {member.role} · {member.posts} post · {member.likes} ta like
                  </small>
                </div>
                <em>
                  <Star className="i" /> {member.rating.toFixed(1)}
                </em>
              </div>
            ))}
          </section>
          <section className="hub-box">
            <h3>Trend mavzular</h3>
            {trends.map((item, index) => (
              <button key={item.tag} type="button" className="hub-trend" onClick={() => setTrendOn(trendOn === item.tag ? null : item.tag)}>
                <span>{index + 1}</span>
                <b>{item.tag}</b>
                <em>{item.count} ta post</em>
              </button>
            ))}
            <button type="button" className="hub-more" onClick={() => setTrendOn(null)}>
              Barcha trend mavzular →
            </button>
          </section>
          <section className="hub-box">
            <h3>
              Community qoidalari
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
