"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, Bookmark, ChevronDown, ClipboardList, Flame, Heart, HelpCircle, MessageCircle, MessagesSquare, MoreHorizontal, Plus, Send, Share2, Trophy, X } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { useCommunityWork } from "@/components/community-provider";
import { useFavorites } from "@/components/favorites-provider";
import { CASE_TAGS } from "@/lib/forms/p0";
import type { CommunityPost, PostKind } from "@/data/desktop-hub";
import type { CommunityPost as LivePost } from "@/data/community";
import { COMPOSER_KINDS, PostComposer } from "./PostComposer";
import "./hub.css";
import "./community.css";

const tabs = [
  { id: "lenta", label: "Lenta" },
  { id: "keys", label: "Klinik keyslar" },
  { id: "savol", label: "Savollar" },
  { id: "muhokama", label: "Muhokamalar" },
  { id: "mine", label: "Mening postlarim" },
] as const;

type Tab = (typeof tabs)[number]["id"];

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
    category: post.tags[0] || "",
    photos: (post.images ?? []).map((src) => ({ src, label: "" })),
    tags: post.tags,
    likes: post.likes,
    comments: post.comments,
    mine: Boolean(viewerId && post.authorId === viewerId),
  };
}

const kindLabel: Record<PostKind, string> = { keys: "Klinik keys", savol: "Savol", muhokama: "Muhokama" };

/** Desktop /community (mock "community dizayini"). Posting happens in PostComposer. */
export function CommunityDesktop() {
  const cartCount = useShopLineCount();
  const work = useCommunityWork();
  const favorites = useFavorites();
  const params = useSearchParams();
  const paramQ = params.get("q") ?? "";
  const [q, setQ] = useState(paramQ);
  const posts = useMemo(() => work.feed.map((post) => mapLive(post, work.viewerId)), [work.feed, work.viewerId]);
  const [tab, setTab] = useState<Tab>("lenta");
  const [topic, setTopic] = useState("");
  const [sort, setSort] = useState<"new" | "hot">("new");
  const [trendOn, setTrendOn] = useState<string | null>(null);
  const [composer, setComposer] = useState<PostKind | null>(null);
  const [promoOpen, setPromoOpen] = useState(true);

  // A new ?q= from the header search replaces whatever was typed before.
  const [seenQ, setSeenQ] = useState(paramQ);
  if (seenQ !== paramQ) {
    setSeenQ(paramQ);
    setQ(paramQ);
  }

  const topics = useMemo(
    () => CASE_TAGS.map((label) => ({ label, count: posts.filter((post) => post.tags.some((tag) => tag.toLowerCase() === label.toLowerCase())).length })),
    [posts],
  );

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const rows = posts.filter((post) => {
      if (tab === "keys" && post.kind !== "keys") return false;
      if (tab === "savol" && post.kind !== "savol") return false;
      if (tab === "muhokama" && post.kind !== "muhokama") return false;
      if (tab === "mine" && !post.mine) return false;
      if (topic && !post.tags.some((tag) => tag.toLowerCase() === topic.toLowerCase())) return false;
      if (trendOn && !post.tags.some((tag) => tag.toLowerCase() === trendOn.toLowerCase())) return false;
      if (!query) return true;
      return `${post.title} ${post.body} ${post.author} ${post.tags.join(" ")}`.toLowerCase().includes(query);
    });
    if (sort === "hot") return [...rows].sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
    return rows;
  }, [posts, tab, topic, q, sort, trendOn]);

  const savedPosts = useMemo(() => posts.filter((post) => favorites.has(`post:${post.id}`)).slice(0, 3), [favorites, posts]);

  return (
    <ShopShell searchPath="/community" cartCount={cartCount} placeholder="Stomatologlar, mavzular yoki postlarni qidirish..." showCamera={false}>
      <div className="cv">
        <div className="cv-main">
          <div className="cv-head">
            <div>
              <h1>Community</h1>
              <p>Stomatologlar uchun professional bilim, tajriba va muhokama maydoni.</p>
            </div>
            <button type="button" className="cv-write" onClick={() => setComposer("keys")} data-testid="cv-write">
              <Plus /> Post yozish
            </button>
          </div>

          <div className="cv-kinds">
            {COMPOSER_KINDS.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" className={`cv-kind ${item.tone}`} onClick={() => setComposer(item.id)}>
                  <i><Icon /></i>
                  <span><b>{item.label} <ArrowRight /></b><small>{item.text}</small></span>
                </button>
              );
            })}
          </div>

          <div className="cv-topics">
            <button type="button" className={topic === "" ? "on" : undefined} onClick={() => setTopic("")}>Barchasi</button>
            {topics.map((item) => (
              <button key={item.label} type="button" className={topic === item.label ? "on" : undefined} onClick={() => setTopic(topic === item.label ? "" : item.label)}>
                {item.label} <small>{item.count}</small>
              </button>
            ))}
          </div>

          <div className="cv-tabs" role="tablist">
            {tabs.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "on" : undefined} onClick={() => setTab(item.id)}>
                {item.label}
              </button>
            ))}
            <label className="cv-sort">
              Saralash:
              <select value={sort} onChange={(event) => setSort(event.target.value as "new" | "hot")} aria-label="Saralash">
                <option value="new">Yangi</option>
                <option value="hot">Mashhur</option>
              </select>
              <ChevronDown />
            </label>
          </div>

          {trendOn ? (
            <p className="cv-filter">
              #{trendOn.replace(/\s+/g, "")} bo‘yicha postlar
              <button type="button" aria-label="Filtrni olib tashlash" onClick={() => setTrendOn(null)}><X /></button>
            </p>
          ) : null}

          {!work.ready ? <div className="cv-empty">Yuklanmoqda…</div> : shown.length === 0 ? (
            <div className="cv-empty">
              Bu bo‘limda post yo‘q.
              <button type="button" onClick={() => setComposer(tab === "savol" ? "savol" : tab === "muhokama" ? "muhokama" : "keys")}>Birinchi bo‘lib yozing</button>
            </div>
          ) : (
            shown.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>

        <aside className="cv-rail">
          <section className="cv-box">
            <h3><span><Trophy className="gold" /> Haftaning top a’zolari</span><Link href="/mutaxassislar">Barchasini ko‘rish <ArrowRight /></Link></h3>
            {work.doctors.length === 0 ? <p className="cv-muted">Hali a’zo yo‘q</p> : work.doctors.slice(0, 5).map((member, index) => (
              <div className="cv-member" key={member.id}>
                <span className={`n r${index + 1}`}>{index + 1}</span>
                <img src={member.avatar || "/img/design-pr13/ui/avatar.png"} alt="" />
                <span className="who"><b>{member.name}</b><small>{member.specialty}</small></span>
                <em>{member.score}<small>ball</small></em>
              </div>
            ))}
          </section>

          <section className="cv-box">
            <h3><span><Flame className="fire" /> Trend mavzular</span>{trendOn ? <button type="button" onClick={() => setTrendOn(null)}>Barchasi</button> : null}</h3>
            {work.trends.length === 0 ? <p className="cv-muted">Hali trend yo‘q</p> : work.trends.slice(0, 5).map((item, index) => (
              <button key={item.tag} type="button" className={trendOn === item.tag ? "cv-trend on" : "cv-trend"} onClick={() => setTrendOn(trendOn === item.tag ? null : item.tag)}>
                <span>{index + 1}</span>
                <b>#{item.tag.replace(/\s+/g, "")}</b>
                <em>{item.posts} post</em>
              </button>
            ))}
          </section>

          {promoOpen ? (
            <section className="cv-promo">
              <img src="/img/marketing/community-share.jpg" alt="" />
              <button type="button" className="cv-promo-x" aria-label="Yopish" onClick={() => setPromoOpen(false)}><X /></button>
              <b>Klinik holatingizni ulashing</b>
              <small>Hamkasblaringizdan fikr oling, tajriba almashing</small>
              <button type="button" className="cv-promo-go" onClick={() => setComposer("keys")}><Plus /> Post yozish</button>
            </section>
          ) : null}

          <section className="cv-box">
            <h3><span>Mening saqlanganlarim</span><Link href="/saqlanganlar">Barchasini ko‘rish <ArrowRight /></Link></h3>
            {savedPosts.length === 0 ? <p className="cv-muted">Saqlangan post yo‘q. Postdagi “Saqlash” tugmasini bosing.</p> : savedPosts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`} className="cv-saved">
                {post.photos[0] ? <img src={post.photos[0].src} alt="" /> : <i><Bookmark /></i>}
                <span><b>{post.title || post.body.slice(0, 60)}</b><small>{post.author} · {post.time}</small></span>
              </Link>
            ))}
          </section>
        </aside>
      </div>

      {composer ? (
        <PostComposer
          initialKind={composer}
          onClose={() => setComposer(null)}
          onPublished={() => {
            setComposer(null);
            setTab("lenta");
            setTopic("");
            setTrendOn(null);
          }}
        />
      ) : null}
    </ShopShell>
  );
}

function PostCard({ post }: { post: CommunityPost }) {
  const work = useCommunityWork();
  const favorites = useFavorites();
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [menu, setMenu] = useState(false);
  const saved = favorites.has(`post:${post.id}`);
  const KindIcon = post.kind === "keys" ? ClipboardList : post.kind === "savol" ? HelpCircle : MessagesSquare;
  const photos = post.photos.slice(0, 4);
  const extra = post.photos.length - photos.length;

  return (
    <article className="cv-post">
      <header>
        <img src={post.avatar} alt="" />
        <span className="who">
          <b>{post.author} <BadgeCheck aria-label="Tasdiqlangan" /></b>
          <small>{[post.role, post.city].filter(Boolean).join(" · ")}<i>{post.time}</i></small>
        </span>
        <div className="cv-menu">
          <button type="button" aria-label="Amallar" aria-expanded={menu} onClick={() => setMenu(!menu)}><MoreHorizontal /></button>
          {menu ? (
            <div role="menu" onMouseLeave={() => setMenu(false)}>
              <Link role="menuitem" href={`/community/${post.id}`}>Postni ochish</Link>
              {post.mine ? <button role="menuitem" type="button" onClick={() => { setMenu(false); if (window.confirm("Postni o‘chirasizmi?")) void work.deletePost(post.id); }}>O‘chirish</button> : null}
            </div>
          ) : null}
        </div>
      </header>
      {post.title ? <h3><Link href={`/community/${post.id}`}>{post.title}</Link></h3> : null}
      {post.body ? <p className="body">{post.body}</p> : null}
      <div className="cv-tags">
        <span className={`kind ${post.kind}`}><KindIcon /> {kindLabel[post.kind]}</span>
        {post.tags.map((tag) => <span key={tag}>#{tag.replace(/\s+/g, "")}</span>)}
      </div>
      {photos.length ? (
        <div className="cv-photos" style={{ gridTemplateColumns: `repeat(${Math.max(photos.length, 2)}, minmax(0, 1fr))` }}>
          {photos.map((photo, index) => (
            <Link key={`${index}-${photo.src}`} href={`/community/${post.id}`}>
              <img src={photo.src} alt={`${post.title || post.author}, rasm ${index + 1}`} />
              {index === photos.length - 1 && extra > 0 ? <i>+{extra}</i> : null}
            </Link>
          ))}
        </div>
      ) : null}
      <footer>
        <button type="button" className={work.isLiked(post.id) ? "like on" : "like"} aria-pressed={work.isLiked(post.id)} onClick={() => void work.toggleLike(post.id)}>
          <Heart /> {post.likes}
        </button>
        <button type="button" onClick={() => setReplyOpen(!replyOpen)}><MessageCircle /> {post.comments}</button>
        <button type="button" className={saved ? "save on" : "save"} aria-pressed={saved} onClick={() => favorites.toggle(`post:${post.id}`)}>
          <Bookmark /> {saved ? "Saqlangan" : "Saqlash"}
        </button>
        <button type="button" className="share" onClick={() => void work.share(post.id)}><Share2 /> Ulashish</button>
      </footer>
      {replyOpen ? (
        <form
          className="cv-reply"
          onSubmit={(event) => {
            event.preventDefault();
            if (!reply.trim()) return;
            void work.addComment(post.id, reply).then((ok) => {
              if (!ok) return;
              setReply("");
              setReplyOpen(false);
            });
          }}
        >
          <input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Javob yozing..." autoFocus />
          <button type="submit" aria-label="Yuborish"><Send /></button>
        </form>
      ) : null}
    </article>
  );
}
