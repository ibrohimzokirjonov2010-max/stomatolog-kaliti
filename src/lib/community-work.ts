import { postKindLabels, type CommunityPost, type CommunityReply, type PostKind } from "@/data/community";

export type PublishPostInput = {
  kind: PostKind;
  text: string;
  tags: string[];
  images?: string[];
};

type ApiAuthor = {
  id: string;
  fullName: string;
  specialty?: string | null;
  city?: string | null;
  avatarUrl?: string | null;
};

export type ApiPost = {
  id: string;
  kind: string;
  body: string;
  tags: string[] | null;
  images: string[] | null;
  createdAt: string;
  author: ApiAuthor;
  likeCount: number;
  likedByMe: boolean;
  comments: { id: string; body: string; createdAt: string; author: ApiAuthor }[];
};

export function postFromApi(row: ApiPost): CommunityPost {
  const kind: PostKind = row.kind === "savol" || row.kind === "yangilik" ? row.kind : "case";
  const replies: CommunityReply[] = (row.comments ?? []).map((c) => ({
    id: c.id,
    author: c.author?.fullName ?? "Foydalanuvchi",
    authorId: c.author?.id,
    avatar: c.author?.avatarUrl ?? undefined,
    text: c.body,
    createdAt: c.createdAt,
    time: timeAgo(c.createdAt),
  }));
  return {
    id: row.id,
    kind,
    author: {
      name: row.author?.fullName ?? "Foydalanuvchi",
      specialty: row.author?.specialty || "Stomatolog",
      city: row.author?.city || "",
      avatar: row.author?.avatarUrl ?? undefined,
    },
    authorId: row.author?.id,
    time: timeAgo(row.createdAt),
    createdAt: row.createdAt,
    text: row.body,
    images: row.images?.length ? row.images : undefined,
    tags: row.tags?.length ? row.tags : [postKindLabels[kind]],
    likes: Number(row.likeCount) || 0,
    likedByMe: Boolean(row.likedByMe),
    comments: replies.length,
    shares: 0,
    replies,
  };
}

export function deriveTrends(posts: CommunityPost[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, posts: count }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 6);
}

export type TopDoctorRow = { id: string; name: string; specialty: string; score: number; avatar?: string };

/** Activity score from real data: post = 10, like received = 2, comment written = 3. */
export function deriveTopDoctors(posts: CommunityPost[]): TopDoctorRow[] {
  const rows = new Map<string, TopDoctorRow>();
  const bump = (id: string | undefined, name: string, points: number, specialty?: string, avatar?: string) => {
    const key = id ?? name;
    const prev = rows.get(key) ?? { id: key, name, specialty: specialty ?? "Stomatolog", score: 0, avatar };
    prev.score += points;
    if (specialty && prev.specialty === "Stomatolog") prev.specialty = specialty;
    if (avatar && !prev.avatar) prev.avatar = avatar;
    rows.set(key, prev);
  };
  for (const post of posts) {
    bump(post.authorId, post.author.name, 10 + post.likes * 2, post.author.specialty, post.author.avatar);
    for (const reply of post.replies) bump(reply.authorId, reply.author, 3, undefined, reply.avatar);
  }
  return [...rows.values()].sort((a, b) => b.score - a.score).slice(0, 4);
}

export function parseTags(raw: string, kind: PostKind) {
  const parts = raw
    .split(/[,#]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const kindTag = postKindLabels[kind];
  const unique: string[] = [];
  for (const tag of [...parts, kindTag]) {
    if (!unique.some((item) => item.toLowerCase() === tag.toLowerCase())) unique.push(tag);
  }
  return unique.slice(0, 6);
}

/** Soft check: Case text that looks like it names a patient. */
export function looksLikePatientName(text: string) {
  const sample = text.trim();
  if (!sample) return false;
  // keyword is case-insensitive, but the following word must be Capitalised (a name)
  if (/(?:[Bb]emor(?:ning|ga|ni)?|[Pp]atient)\s+[A-ZА-ЯЁ][a-zа-яё]+/.test(sample)) return true;
  if (/\b(?:[Ii]sm[i]?|[Ff]amiliya)\s*[:–-]\s*[A-ZА-ЯЁ]/.test(sample)) return true;
  if (/\b[A-Z][a-z]{2,14}\s+[A-Z][a-z]{2,14}\b/.test(sample) && /(bemor|patient)/i.test(sample)) {
    return true;
  }
  return false;
}

export function timeAgo(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(delta / 60_000));
  if (minutes < 1) return "Hozir";
  if (minutes === 1) return "1 daqiqa oldin";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 soat oldin";
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kecha";
  return `${days} kun oldin`;
}
