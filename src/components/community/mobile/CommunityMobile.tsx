"use client";
/* eslint-disable @next/next/no-img-element -- post photos are sized by the fluid unit */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Heart, HelpCircle, Image as ImageIcon, Lightbulb, MessageCircle, MoreHorizontal, Plus, Search, Share2, ShoppingCart, SlidersHorizontal, Stethoscope, Video } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { useCommunityWork } from "@/components/community-provider";
import { CASE_TAGS, caseProblem } from "@/lib/forms/p0";
import { uploadImage } from "@/lib/image-upload";
import "./community-mobile.css";

type Kind = "klinik" | "savol" | "maslahat" | "yangilik";

type Post = {
  id: string;
  name: string;
  avatar: string;
  time: string;
  kind: Kind;
  kindLabel: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
  mine: boolean;
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

export function CommunityMobile() {
  const { count } = useCart();
  const { profile } = useDoctorProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | Kind>("all");
  const work = useCommunityWork();
  const posts = useMemo<Post[]>(() => work.feed.map((post): Post => ({
    id: post.id,
    name: post.author.name,
    avatar: post.author.avatar || "/img/mobile/avatar.jpg",
    time: post.time,
    kind: post.kind === "savol" ? "savol" : post.kind === "yangilik" ? "yangilik" : "klinik",
    kindLabel: post.kind === "savol" ? "Savollar" : post.kind === "yangilik" ? "Yangiliklar" : "Klinik case",
    title: post.text.slice(0, 90),
    body: post.text,
    likes: post.likes,
    comments: post.comments,
    mine: Boolean(work.viewerId && post.authorId === work.viewerId),
    mosaic: post.images?.[0] ? { big: post.images[0], stack: post.images.slice(1, 3) } : undefined,
  })), [work.feed, work.viewerId]);
  const [saved, setSaved] = useState<string[]>([]);
  const [menu, setMenu] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState("");
  const [video, setVideo] = useState(false);
  const [composer, setComposer] = useState(false);
  const [sheetTitle, setSheetTitle] = useState("");
  const [sheetBody, setSheetBody] = useState("");
  const [clinical, setClinical] = useState(false);
  const [complaint, setComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [steps, setSteps] = useState("");
  const [consent, setConsent] = useState(false);
  const [faceAck, setFaceAck] = useState(false);
  const [caseTag, setCaseTag] = useState<string>(CASE_TAGS[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [commentFor, setCommentFor] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [filters, setFilters] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [note, setNote] = useState("");
  const avatar = profile?.avatarUrl || "/img/mobile/avatar.jpg";

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (kind !== "all" && post.kind !== kind) return false;
      if (onlySaved && !saved.includes(post.id)) return false;
      if (!q) return true;
      return `${post.title} ${post.body} ${post.name} ${post.kindLabel}`.toLowerCase().includes(q);
    });
  }, [kind, onlySaved, posts, query, saved]);

  async function publish(title: string, body: string) {
    const text = [title.trim(), body.trim()].filter(Boolean).join("\n");
    if (!text && !clinical) return;
    if (clinical) {
      const problem = caseProblem({
        text,
        tags: [caseTag],
        images: files.map(() => "pending"),
        consent,
        faceAck,
        complaint,
        diagnosis,
        steps,
      });
      if (problem) {
        setNote(problem);
        return;
      }
      try {
        const images: string[] = [];
        for (const file of files.slice(0, 6)) images.push(await uploadImage(file, "post"));
        const result = await work.publish({
          kind: "case",
          text: `${text}\n\nShikoyat: ${complaint.trim()}\nDiagnoz: ${diagnosis.trim()}\nBosqichlar:\n${steps.trim()}`,
          tags: [caseTag],
          images,
          consent,
          faceAck,
          complaint,
          diagnosis,
          steps,
        });
        if (!result.ok) {
          setNote(result.error);
          return;
        }
      } catch (error) {
        setNote(error instanceof Error ? error.message : "Postni saqlab bo‘lmadi.");
        return;
      }
      setClinical(false);
      setFiles([]);
      setConsent(false);
      setFaceAck(false);
    } else {
    const result = await work.publish({ kind: "yangilik", text, tags: [] });
    if (!result.ok) {
      setNote(result.error);
      return;
    }
    }
    setDraft("");
    setSheetTitle("");
    setSheetBody("");
    setPhoto("");
    setVideo(false);
    setComposer(false);
    setNote("Post joylandi");
  }

  async function share(post: Post) {
    const url = `${window.location.origin}/community#${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* the note still confirms the action */
      }
    }
    setNote("Havola nusxalandi");
  }

  return (
    <div className="cm lg:hidden" data-testid="mobile-community">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-community-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? <span className="mh-badge">{count > 9 ? "9+" : count}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>

      <div className="cm-body">
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
            publish(draft, draft);
          }}
        >
          <img src={avatar} alt="" />
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nima haqida o‘ylayapsiz?" aria-label="Nima haqida o‘ylayapsiz?" />
          <button type="button" className="cm-ico" aria-label="Rasm" onClick={() => fileRef.current?.click()}>
            <ImageIcon />
          </button>
          <button type="button" className={video ? "cm-ico" : "cm-ico"} aria-label="Video" aria-pressed={video} onClick={() => setVideo((value) => !value)}>
            <Video />
          </button>
          <button type="submit" className="cm-plus" aria-label="Joylash">
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
            const reader = new FileReader();
            reader.onload = () => {
              setPhoto(String(reader.result || ""));
              setNote("Rasm biriktirildi");
            };
            reader.readAsDataURL(file);
          }}
        />
        {photo ? <img className="cm-preview" src={photo} alt="" /> : null}

        <div className="cm-cats" aria-label="Toifalar">
          {chips.map((chip) => (
            <button key={chip.id} type="button" className={kind === chip.id ? "on" : undefined} onClick={() => setKind(chip.id)}>
              {chip.label}
            </button>
          ))}
        </div>

        {note ? <p className="cm-note">{note}</p> : null}
        {list.length === 0 ? <p className="cm-note">Mos post topilmadi</p> : null}

        {list.map((post) => {
          const kept = saved.includes(post.id);
          return (
            <article key={post.id} id={post.id} className="cm-post">
              <div className="cm-who">
                <img src={post.avatar} alt="" />
                <div>
                  <b>{post.name}</b>
                  <span>Stomatolog · {post.time}</span>
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
                      <button type="button" onClick={() => { setSaved((current) => (current.includes(post.id) ? current.filter((id) => id !== post.id) : [...current, post.id])); setMenu(null); }}>Saqlash</button>
                      <button type="button" onClick={() => { setMenu(null); void share(post); }}>Ulashish</button>
                      {post.mine ? <button type="button" onClick={() => { setMenu(null); void work.deletePost(post.id); }}>O‘chirish</button> : null}
                    </span>
                  ) : null}
                </div>
              </div>
              <h2>{post.title}</h2>
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
                <div className="cm-mosaic">
                  <img className="big" src={post.mosaic.big} alt="" />
                  {post.mosaic.stack.length ? (
                    <div className="cm-stack">
                      {post.mosaic.stack.map((src, index) => (
                        <figure key={`${index}-${src}`}>
                          <img src={src} alt="" />
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="cm-acts">
                <button type="button" className={work.isLiked(post.id) ? "like on" : "like"} aria-pressed={work.isLiked(post.id)} onClick={() => void work.toggleLike(post.id)}>
                  <Heart fill={work.isLiked(post.id) ? "currentColor" : "none"} /> {post.likes}
                </button>
                <button type="button" aria-label="Izohlar" onClick={() => { setCommentFor(post); setComment(""); }}>
                  <MessageCircle /> {post.comments}
                </button>
                <button type="button" className="save" aria-pressed={kept} onClick={() => setSaved((current) => (current.includes(post.id) ? current.filter((id) => id !== post.id) : [...current, post.id]))}>
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

      <button type="button" className="cm-new" onClick={() => setComposer(true)}>
        <Plus /> Yangi post
      </button>

      {composer ? (
        <div className="cm-sheet" role="dialog" aria-label="Yangi post">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setComposer(false)} />
          <form className="cm-box" onSubmit={(event) => { event.preventDefault(); publish(sheetTitle, sheetBody); }}>
            <h3>Yangi post</h3>
            <input aria-label="Sarlavha" value={sheetTitle} onChange={(event) => setSheetTitle(event.target.value)} placeholder="Sarlavha" />
            <textarea aria-label="Matn" value={sheetBody} onChange={(event) => setSheetBody(event.target.value)} placeholder="Nima haqida o‘ylayapsiz?" />
            <label className="row" style={{ fontSize: 13 }}>
              <input type="checkbox" checked={clinical} onChange={(event) => setClinical(event.target.checked)} /> Klinik holat
            </label>
            {clinical ? (
              <>
                <input aria-label="Shikoyat" value={complaint} onChange={(event) => setComplaint(event.target.value)} placeholder="Shikoyat" />
                <input aria-label="Diagnoz" value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Diagnoz" />
                <textarea aria-label="Bosqichlar" value={steps} onChange={(event) => setSteps(event.target.value)} placeholder={"1. Diagnostika\n2. Davolash"} />
                <select aria-label="Mutaxassislik" value={caseTag} onChange={(event) => setCaseTag(event.target.value)}>
                  {CASE_TAGS.map((item) => <option key={item}>{item}</option>)}
                </select>
                <input aria-label="Oldin va keyin rasmlari" type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 6))} />
                <label style={{ fontSize: 13 }}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Bemor roziligi bor, ism va telefon yo‘q</label>
                <label style={{ fontSize: 13 }}><input type="checkbox" checked={faceAck} onChange={(event) => setFaceAck(event.target.checked)} /> Yuz ko‘rinmasligini tekshirdim</label>
              </>
            ) : null}
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => setComposer(false)}>Yopish</button>
              <button type="submit" className="go">Joylash</button>
            </div>
          </form>
        </div>
      ) : null}

      {commentFor ? (
        <div className="cm-sheet" role="dialog" aria-label="Izoh">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setCommentFor(null)} />
          <form
            className="cm-box"
            onSubmit={(event) => {
              event.preventDefault();
              if (!comment.trim()) return;
              const id = commentFor.id;
              void work.addComment(id, comment).then((ok) => {
                if (!ok) return;
                setComment("");
                setCommentFor(null);
                setNote("Izoh qo‘shildi");
              });
            }}
          >
            <h3>Izoh</h3>
            <textarea aria-label="Izoh matni" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Izoh yozing" />
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => setCommentFor(null)}>Yopish</button>
              <button type="submit" className="go">Yuborish</button>
            </div>
          </form>
        </div>
      ) : null}

      {filters ? (
        <div className="cm-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form className="cm-box" onSubmit={(event) => { event.preventDefault(); setFilters(false); }}>
            <h3>Filtr</h3>
            <label>
              <input type="checkbox" checked={onlySaved} onChange={(event) => setOnlySaved(event.target.checked)} /> Saqlanganlar
            </label>
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => { setOnlySaved(false); setFilters(false); }}>Tozalash</button>
              <button type="submit" className="go">Ko‘rish</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
