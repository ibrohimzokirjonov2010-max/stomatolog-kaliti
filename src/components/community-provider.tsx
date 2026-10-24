"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Check, Users, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import {
  deriveTopDoctors,
  deriveTrends,
  postFromApi,
  type ApiPost,
  type PublishPostInput,
} from "@/lib/community-work";
import type { CommunityPost } from "@/data/community";

export type ActionResult<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; error: string; unauthorized?: boolean };

type Toast = { text: string; href?: string; hrefLabel?: string; tone?: "ok" | "error" };

type Ctx = {
  ready: boolean;
  loading: boolean;
  error: string;
  viewerId: string | null;
  feed: CommunityPost[];
  trends: { tag: string; posts: number }[];
  doctors: ReturnType<typeof deriveTopDoctors>;
  reload: () => Promise<void>;
  getById: (id: string) => CommunityPost | undefined;
  fetchPost: (id: string) => Promise<CommunityPost | null>;
  isLiked: (id: string) => boolean;
  publish: (input: PublishPostInput) => Promise<ActionResult<CommunityPost>>;
  toggleLike: (id: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  deletePost: (id: string) => Promise<boolean>;
  share: (id: string) => Promise<void>;
};

const CommunityCtx = createContext<Ctx | null>(null);

async function api<T>(url: string, init?: RequestInit): Promise<ActionResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as (T & { ok?: boolean; error?: string }) | null;
    if (!response.ok || !data?.ok) {
      return {
        ok: false,
        error: data?.error ?? "Xatolik yuz berdi. Qayta urinib ko‘ring.",
        unauthorized: response.status === 401,
      };
    }
    return { ok: true, value: data };
  } catch {
    return { ok: false, error: "Tarmoq xatosi. Internetni tekshiring." };
  }
}

export function CommunityWorkProvider({ children }: { children: ReactNode }) {
  const { profile, ready: authReady } = useDoctorProfile();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const postsRef = useRef(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await api<{ posts: ApiPost[]; viewerId: string | null }>("/api/community");
    if (result.ok) {
      setPosts(result.value.posts.map(postFromApi));
      setViewerId(result.value.viewerId);
      setError("");
    } else {
      setError(result.error);
    }
    setLoading(false);
    setReady(true);
  }, []);

  // Load once auth state is known, and again whenever the signed-in user changes.
  const profileId = profile?.id ?? null;
  useEffect(() => {
    if (!authReady) return;
    void reload();
  }, [authReady, profileId, reload]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const replacePost = useCallback((raw: ApiPost | null | undefined) => {
    if (!raw) return;
    const next = postFromApi(raw);
    setPosts((current) =>
      current.some((p) => p.id === next.id)
        ? current.map((p) => (p.id === next.id ? next : p))
        : [next, ...current],
    );
  }, []);

  const trends = useMemo(() => deriveTrends(posts), [posts]);
  const doctors = useMemo(() => deriveTopDoctors(posts), [posts]);

  const getById = useCallback((id: string) => posts.find((post) => post.id === id), [posts]);
  const isLiked = useCallback(
    (id: string) => Boolean(posts.find((post) => post.id === id)?.likedByMe),
    [posts],
  );

  const fetchPost = useCallback(
    async (id: string) => {
      const result = await api<{ post: ApiPost | null }>(`/api/community/${encodeURIComponent(id)}`);
      if (!result.ok || !result.value.post) return null;
      replacePost(result.value.post);
      return postFromApi(result.value.post);
    },
    [replacePost],
  );

  const authFail = useCallback((result: { error: string; unauthorized?: boolean }) => {
    setToast(
      result.unauthorized
        ? { text: result.error, href: "/kirish", hrefLabel: "Tizimga kirish", tone: "error" }
        : { text: result.error, tone: "error" },
    );
  }, []);

  const publish = useCallback(
    async (input: PublishPostInput): Promise<ActionResult<CommunityPost>> => {
      if (!input.text.trim()) return { ok: false, error: "Post matnini yozing." };
      const result = await api<{ post: ApiPost }>("/api/community", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!result.ok) return result;
      const post = postFromApi(result.value.post);
      setPosts((current) => [post, ...current.filter((p) => p.id !== post.id)]);
      setToast({ text: "Post joylandi.", href: `/community/${post.id}`, hrefLabel: "Postni ochish" });
      return { ok: true, value: post };
    },
    [],
  );

  const toggleLike = useCallback(
    async (id: string) => {
      const before = postsRef.current.find((p) => p.id === id);
      if (!before) return;
      // optimistic
      setPosts((current) =>
        current.map((p) =>
          p.id === id ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p,
        ),
      );
      const result = await api<{ post: ApiPost }>(`/api/community/${id}/like`, { method: "POST" });
      if (result.ok) replacePost(result.value.post);
      else {
        setPosts((current) => current.map((p) => (p.id === id ? before : p)));
        authFail(result);
      }
    },
    [authFail, replacePost],
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      const result = await api<{ post: ApiPost }>(`/api/community/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: trimmed }),
      });
      if (!result.ok) {
        authFail(result);
        return false;
      }
      replacePost(result.value.post);
      return true;
    },
    [authFail, replacePost],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      const result = await api<{ post: ApiPost }>(`/api/community/comments/${commentId}`, { method: "DELETE" });
      if (!result.ok) {
        authFail(result);
        return false;
      }
      replacePost(result.value.post);
      return true;
    },
    [authFail, replacePost],
  );

  const deletePost = useCallback(
    async (id: string) => {
      const result = await api(`/api/community/${id}`, { method: "DELETE" });
      if (!result.ok) {
        authFail(result);
        return false;
      }
      setPosts((current) => current.filter((p) => p.id !== id));
      setToast({ text: "Post o‘chirildi." });
      return true;
    },
    [authFail],
  );

  const share = useCallback(async (id: string) => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/community/${id}` : `/community/${id}`;
    try {
      if (typeof navigator !== "undefined" && "share" in navigator && window.innerWidth < 1024) {
        await navigator.share({ url, title: "StomaHub Community" });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      /* toast still confirms */
    }
    setToast({ text: "Havola nusxalandi", href: `/community/${id}`, hrefLabel: "Postni ochish" });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      loading,
      error,
      viewerId,
      feed: posts,
      trends,
      doctors,
      reload,
      getById,
      fetchPost,
      isLiked,
      publish,
      toggleLike,
      addComment,
      deleteComment,
      deletePost,
      share,
    }),
    [
      ready, loading, error, viewerId, posts, trends, doctors, reload, getById, fetchPost, isLiked,
      publish, toggleLike, addComment, deleteComment, deletePost, share,
    ],
  );

  return (
    <CommunityCtx.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-[min(100%-2rem,380px)]">
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-[#CCFBF1] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.16)] lg:mx-0">
            <div className="flex items-start gap-3">
              <span
                className={
                  toast.tone === "error"
                    ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fff1f0] text-[#d92d20]"
                    : "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a]"
                }
              >
                {toast.tone === "error" ? <X className="size-4" strokeWidth={2.5} /> : <Check className="size-4" strokeWidth={2.5} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1a1d26]">{toast.text}</p>
                {toast.href ? (
                  <Link
                    href={toast.href}
                    className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0F766E] hover:underline"
                  >
                    <Users className="size-3.5" />
                    {toast.hrefLabel}
                  </Link>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-[#8b93a7] hover:text-[#1a1d26]"
                aria-label="Yopish"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </CommunityCtx.Provider>
  );
}

export function useCommunityWork() {
  const ctx = useContext(CommunityCtx);
  if (!ctx) throw new Error("useCommunityWork must be used within CommunityWorkProvider");
  return ctx;
}
