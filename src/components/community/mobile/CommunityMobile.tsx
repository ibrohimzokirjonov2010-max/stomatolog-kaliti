"use client";
/* eslint-disable @next/next/no-img-element -- post photos are sized by the fluid unit */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Heart, HelpCircle, Image as ImageIcon, Lightbulb, MessageCircle, MoreHorizontal, Plus, Search, Share2, SlidersHorizontal, Stethoscope, Video } from "lucide-react";
import { useCommunityWork } from "@/components/community-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useFavorites } from "@/components/favorites-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import type { CommunityPost, PostKind } from "@/data/community";
import { initialsFromName } from "@/lib/doctor-profile";
import { uploadImage } from "@/lib/image-upload";
import "./community-mobile.css";

type Kind = "klinik" | "savol" | "maslahat" | "yangilik";

type Post = {
  id: string;
  /** Real post from the database (design samples have no id there). */
  real?: CommunityPost;
  liked?: boolean;
  name: string;
  avatar: string;
  time: string;
  kind: Kind;
  kindLabel: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
  pair?: { before: string; after: string };
  mosaic?: { big: string; stack: string[] };
};

const chips: { id: "all" | Kind; label: string }[] = [
  { id: "all", label: "Hammasi" },
  { id: "klinik", label: "Klinik case" },
  { id: "savol", label: "Savollar" },
  { id: "maslahat", label: "Maslahatlar" },
  { id: "yangilik", label: "Yangiliklar" },
];

const seed: Post[] = [
  {
    id: "cct",
    name: "Ibrohim Zokirjonov",
    avatar: "/img/mobile/cm-ibrohim.jpg",
    time: "3 kun oldin",
    kind: "klinik",
    kindLabel: "Klinik case",
    title: "Davolash natijasi: CCT bilan milk retessiyasini yopish",
    body: "Mandibular old tishlar sohasida milk retessiyasi kuzatildi. CCT (Connective Tissue Graft) usuli bilan yopildi. 6 oylik nazorat natijasi. Bemorda sezgirlik kamaydi va estetik ko‘rinish yaxshilandi.",
    likes: 24,
    comments: 8,
    pair: { before: "/img/mobile/cm-before.jpg", after: "/img/mobile/cm-after.jpg" },
  },
  {
    id: "qatlam",
    name: "Dr. Dilnoza Karimova",
    avatar: "/img/mobile/se-dilnoza.jpg",
    time: "5 kun oldin",
    kind: "maslahat",
    kindLabel: "Maslahatlar",
    title: "Kompozit restavratsiyada qatlamma usul",
    body: "Posterior tishlarda kompozit bilan ishlashda qatlamma usul natijani yanada mustahkam va estetik qiladi. Siz qanday materiallardan foydalanasiz?",
    likes: 18,
    comments: 12,
    mosaic: { big: "/img/mobile/cm-composite.jpg", stack: ["/img/mobile/cm-teeth-a.jpg", "/img/mobile/cm-teeth-b.jpg"] },
  },
  {
    id: "protez",
    name: "Dr. Azizbek Murodov",
    avatar: "/img/mobile/tl-azizbek.jpg",
    time: "1 hafta oldin",
    kind: "savol",
    kindLabel: "Savollar",
    title: "Implantdan keyingi protetik bosqich",
    body: "Implant joylashgach, vaqtinchalik tojni qachon qo‘yishni ma’qul ko‘rasiz?",
    likes: 9,
    comments: 4,
  },
  {
    id: "yangilik",
    name: "StomaHub",
    avatar: "/img/mobile/avatar.jpg",
    time: "2 hafta oldin",
    kind: "yangilik",
    kindLabel: "Yangiliklar",
    title: "Seminarlar kalendari yangilandi",
    body: "Oktabr oyi uchun yangi amaliy kurslar qo‘shildi. Ro‘yxatdan o‘tish ochiq.",
    likes: 31,
    comments: 2,
  },
];

const KIND_OF: Record<Kind, { kind: PostKind; tags: string[] }> = {
  klinik: { kind: "case", tags: ["klinik"] },
  savol: { kind: "savol", tags: [] },
  maslahat: { kind: "case", tags: ["maslahat"] },
  yangilik: { kind: "yangilik", tags: [] },
};
const LABEL: Record<Kind, string> = { klinik: "Klinik case", savol: "Savollar", maslahat: "Maslahatlar", yangilik: "Yangiliklar" };

function fromReal(p: CommunityPost): Post {
  const kind: Kind = p.tags.includes("maslahat") ? "maslahat" : p.kind === "case" ? "klinik" : p.kind === "yangilik" ? "yangilik" : "savol";
  const [first, ...rest] = p.text.split("\n");
  const restText = rest.join("\n").trim();
  const imgs = p.images ?? [];
  return {
    id: p.id,
    real: p,
    liked: Boolean(p.likedByMe),
    name: p.author.name,
    avatar: p.author.avatar ?? "",
    time: p.time,
    kind,
    kindLabel: LABEL[kind],
    title: restText ? first : "",
    body: restText || first,
    likes: p.likes,
    comments: p.comments,
    mosaic: imgs.length ? { big: imgs[0], stack: imgs.slice(1, 3) } : undefined,
  };
}

function Ava({ src, name }: { src: string; name: string }) {
  return src ? <img src={src} alt="" /> : <span className="cm-ini">{initialsFromName(name || "S H")}</span>;
}

export function CommunityMobile() {
  const { profile } = useDoctorProfile();
  const work = useCommunityWork();
  const favorites = useFavorites();
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | Kind>("all");
  const [menu, setMenu] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [composer, setComposer] = useState(false);
  const [postKind, setPostKind] = useState<Kind>("savol");
  const [sheetTitle, setSheetTitle] = useState("");
  const [sheetBody, setSheetBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [commentFor, setCommentFor] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [filters, setFilters] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [note, setNote] = useState("");
  const [sample, setSample] = useState(false);
  const myName = profile?.fullName ?? "";

  const posts = useMemo(() => [...work.feed.map(fromReal), ...seed], [work.feed]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (kind !== "all" && post.kind !== kind) return false;
      if (onlySaved && !favorites.has(`post-${post.id}`)) return false;
      if (!q) return true;
      return `${post.title} ${post.body} ${post.name} ${post.kindLabel}`.toLowerCase().includes(q);
    });
  }, [favorites, kind, onlySaved, posts, query]);

  async function publish(title: string, text: string, as: Kind) {
    const full = [title.trim(), text.trim()].filter(Boolean).join("\n");
    if (!full || busy) return;
    if (!profile) {
      setNote("Post joylash uchun hisobingizga kiring.");
      return;
    }
    setBusy(true);
    let images: string[] | undefined;
    if (photo) {
      try {
        images = [await uploadImage(photo.file, "post")];
      } catch {
        setBusy(false);
        setNote("Rasmni yuklab bo‘lmadi. Qayta urinib ko‘ring.");
        return;
      }
    }
    const res = await work.publish({ ...KIND_OF[as], text: full, images });
    setBusy(false);
    if (!res.ok) {
      setNote(res.error);
      return;
    }
    setDraft("");
    setSheetTitle("");
    setSheetBody("");
    setPhoto(null);
    setComposer(false);
    setNote("");
  }

  function like(post: Post) {
    if (!post.real) {
      setSample(true);
      return;
    }
    void work.toggleLike(post.id);
  }

  function openComments(post: Post) {
    if (!post.real) {
      setSample(true);
      return;
    }
    setCommentFor(post);
    setComment("");
  }

  async function share(post: Post) {
    if (post.real) {
      await work.share(post.id);
      return;
    }
    setSample(true);
  }

  return (
    <div className="cm lg:hidden" data-testid="mobile-community">
      <div className="cm-body">
        <MobileBrandBar search />
        <h1 className="cm-title">Hamjamiyat</h1>
        <p className="cm-sub">Stomatologlar tajribasi, savollari va klinik holatlar</p>
        <form className="cm-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input data-community-search data-section-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mavzu yoki savollarni izlash..." aria-label="Qidiruv" />
          <button type="button" className="cm-filter" aria-label="Filtr" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
          </button>
        </form>

        <form
          className="cm-compose"
          onSubmit={(event) => {
            event.preventDefault();
            void publish("", draft, "savol");
          }}
        >
          <Ava src={profile?.avatarUrl ?? ""} name={myName} />
          <input data-testid="cm-draft" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nima haqida o‘ylayapsiz?" aria-label="Nima haqida o‘ylayapsiz?" />
          <button type="button" className="cm-ico" aria-label="Rasm" onClick={() => fileRef.current?.click()}>
            <ImageIcon />
          </button>
          <button type="button" className="cm-ico" aria-label="Video" onClick={() => setNote("Video yuklash hozircha qo‘llab-quvvatlanmaydi — rasm biriktiring.")}>
            <Video />
          </button>
          <button type="submit" className="cm-plus" aria-label="Joylash" data-testid="cm-quick-post" disabled={busy}>
            <Plus />
          </button>
        </form>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          aria-label="Rasm fayli"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setPhoto({ file, url: URL.createObjectURL(file) });
          }}
        />
        {photo ? (
          <div className="cm-preview-wrap">
            <img className="cm-preview" src={photo.url} alt="" />
            <button type="button" onClick={() => setPhoto(null)}>Olib tashlash</button>
          </div>
        ) : null}

        <div className="cm-cats" aria-label="Toifalar">
          {chips.map((chip) => (
            <button key={chip.id} type="button" className={kind === chip.id ? "on" : undefined} onClick={() => setKind(chip.id)}>
              {chip.label}
            </button>
          ))}
        </div>

        {note ? (
          <p className="cm-note" role="status">
            {note} {!profile && /kiring/.test(note) ? <Link href="/kirish?next=/community">Kirish →</Link> : null}
          </p>
        ) : null}
        {list.length === 0 ? <p className="cm-note">Mos post topilmadi</p> : null}

        {list.map((post) => {
          const on = Boolean(post.liked);
          const kept = favorites.has(`post-${post.id}`);
          return (
            <article key={post.id} id={post.id} className="cm-post" data-testid="cm-post" data-real={post.real ? "1" : undefined}>
              <div className="cm-who">
                <Ava src={post.avatar} name={post.name} />
                <div>
                  <b>{post.name}</b>
                  <span>
                    {post.real?.author.specialty || "Stomatolog"} · {post.time}
                    {!post.real ? " · namuna" : ""}
                  </span>
                </div>
                <div className="cm-side">
                  <span className={`cm-badge ${post.kind}`}>
                    {post.kind === "klinik" ? <Stethoscope /> : post.kind === "maslahat" ? <Lightbulb /> : post.kind === "savol" ? <HelpCircle /> : null}
                    {post.kindLabel}
                  </span>
                  <button type="button" className="cm-more" aria-label="Yana" aria-expanded={menu === post.id} onClick={() => setMenu((current) => (current === post.id ? null : post.id))}>
                    <MoreHorizontal />
                  </button>
                  {menu === post.id ? (
                    <span className="cm-menu">
                      <button type="button" onClick={() => { favorites.toggle(`post-${post.id}`); setMenu(null); }}>{kept ? "Saqlangan" : "Saqlash"}</button>
                      <button type="button" onClick={() => { setMenu(null); void share(post); }}>Ulashish</button>
                      {post.real ? <Link href={`/community/${post.id}`}>Ochish</Link> : null}
                    </span>
                  ) : null}
                </div>
              </div>
              {post.title ? <h2>{post.title}</h2> : null}
              <p>{post.body}</p>
              {post.pair ? (
                <div className="cm-pair">
                  <figure>
                    <img src={post.pair.before} alt="Oldin" />
                    <figcaption>Oldin</figcaption>
                  </figure>
                  <figure>
                    <img src={post.pair.after} alt="Keyin" />
                    <figcaption>Keyin</figcaption>
                  </figure>
                </div>
              ) : null}
              {post.mosaic ? (
                <div className={post.mosaic.stack.length ? "cm-mosaic" : "cm-mosaic one"}>
                  <img className="big" src={post.mosaic.big} alt="" />
                  {post.mosaic.stack.length ? (
                    <div className="cm-stack">
                      {post.mosaic.stack.map((src) => (
                        <figure key={src}>
                          <img src={src} alt="" />
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="cm-acts">
                <button type="button" className={on ? "like on" : "like"} aria-pressed={on} data-testid="cm-like" onClick={() => like(post)}>
                  <Heart fill={on || !post.real ? "currentColor" : "none"} /> {post.likes}
                </button>
                <button type="button" aria-label="Izohlar" data-testid="cm-comment" onClick={() => openComments(post)}>
                  <MessageCircle /> {post.comments}
                </button>
                <button type="button" className="save" aria-pressed={kept} onClick={() => favorites.toggle(`post-${post.id}`)}>
                  <Bookmark fill={kept ? "currentColor" : "none"} /> Saqlash
                </button>
                <button type="button" onClick={() => void share(post)}>
                  <Share2 /> Ulashish
                </button>
              </div>
            </article>
          );
        })}
        <div className="cm-pad" />
      </div>

      <button type="button" className="cm-new" data-testid="cm-new" onClick={() => setComposer(true)}>
        <Plus /> Yangi post
      </button>

      {composer ? (
        <div className="mb-sheet" role="dialog" aria-label="Yangi post">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setComposer(false)} />
          <form className="mb-panel" onSubmit={(event) => { event.preventDefault(); void publish(sheetTitle, sheetBody, postKind); }}>
            <h3>Yangi post</h3>
            <select aria-label="Turi" value={postKind} onChange={(event) => setPostKind(event.target.value as Kind)}>
              <option value="savol">Savol</option>
              <option value="klinik">Klinik case</option>
              <option value="maslahat">Maslahat</option>
              <option value="yangilik">Yangilik</option>
            </select>
            <input aria-label="Sarlavha" value={sheetTitle} onChange={(event) => setSheetTitle(event.target.value)} placeholder="Sarlavha" />
            <textarea aria-label="Matn" rows={4} value={sheetBody} onChange={(event) => setSheetBody(event.target.value)} placeholder="Nima haqida o‘ylayapsiz?" />
            <button type="button" className="cm-attach" onClick={() => fileRef.current?.click()}>
              <ImageIcon /> {photo ? "Rasm biriktirildi" : "Rasm biriktirish"}
            </button>
            {note ? <p className="note">{note}</p> : null}
            <div className="row">
              <button type="button" onClick={() => setComposer(false)}>Yopish</button>
              <button type="submit" className="go" data-testid="cm-publish" disabled={busy}>{busy ? "Joylanmoqda..." : "Joylash"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {commentFor ? (
        <div className="mb-sheet" role="dialog" aria-label="Izoh">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setCommentFor(null)} />
          <form
            className="mb-panel"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!comment.trim() || busy) return;
              setBusy(true);
              const ok = await work.addComment(commentFor.id, comment.trim());
              setBusy(false);
              if (ok) setCommentFor(null);
              else setNote("Izohni yuborib bo‘lmadi.");
            }}
          >
            <h3>Izoh</h3>
            <textarea aria-label="Izoh matni" rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Izoh yozing" />
            <div className="row">
              <button type="button" onClick={() => setCommentFor(null)}>Yopish</button>
              <button type="submit" className="go" disabled={busy}>Yuborish</button>
            </div>
          </form>
        </div>
      ) : null}

      {filters ? (
        <div className="mb-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setFilters(false)} />
          <form className="mb-panel" onSubmit={(event) => { event.preventDefault(); setFilters(false); }}>
            <h3>Filtr</h3>
            <label className="cm-check">
              <input type="checkbox" checked={onlySaved} onChange={(event) => setOnlySaved(event.target.checked)} /> Faqat saqlanganlar
            </label>
            <div className="row">
              <button type="button" onClick={() => { setOnlySaved(false); setFilters(false); }}>Tozalash</button>
              <button type="submit" className="go">Ko‘rish</button>
            </div>
          </form>
        </div>
      ) : null}

      {sample ? (
        <div className="mb-sheet" role="dialog" aria-label="Namuna post" data-testid="cm-sample">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setSample(false)} />
          <div className="mb-panel">
            <h3>Namuna post</h3>
            <p>Bu post bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan — unga layk yoki izoh qoldirib bo‘lmaydi. Hamkasblaringizning haqiqiy postlari ro‘yxat boshida chiqadi.</p>
            <div className="row">
              <button type="button" onClick={() => setSample(false)}>Yopish</button>
              <button type="button" className="go" onClick={() => { setSample(false); setComposer(true); }}>Post yozish</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
