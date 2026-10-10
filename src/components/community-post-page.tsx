"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FeedPost, PostMedia } from "@/components/community-card";
import { useCommunityWork } from "@/components/community-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CommunityPostPage({ id }: { id: string }) {
  const router = useRouter();
  const { getById, fetchPost, toggleLike, addComment, deleteComment, deletePost, share, ready, viewerId } =
    useCommunityWork();
  const { profile } = useDoctorProfile();
  const cached = getById(id);
  const [status, setStatus] = useState<"loading" | "done">("loading");
  const [replyDraft, setReplyDraft] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    void fetchPost(id).finally(() => {
      if (alive) setStatus("done");
    });
    return () => {
      alive = false;
    };
  }, [id, ready, fetchPost]);

  const post = cached;

  if (!post && status === "done") {
    return (
      <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1a1d26]">Post topilmadi</p>
        <p className="mt-1 text-sm text-[#8b93a7]">E’lon o‘chirilgan yoki havola eskirgan bo‘lishi mumkin.</p>
        <Link href="/community" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
          Community
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-12 text-center text-sm text-[#8b93a7]">
        Yuklanmoqda…
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/community"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Barcha postlar
      </Link>
      <FeedPost
        post={post}
        liked={Boolean(post.likedByMe)}
        commentsOpen={commentsOpen}
        replyDraft={replyDraft}
        likes={post.likes}
        onLike={() => void toggleLike(post.id)}
        onShare={() => {
          void share(post.id);
        }}
        onToggleComments={() => setCommentsOpen((value) => !value)}
        onReplyChange={setReplyDraft}
        onReply={() => {
          void addComment(post.id, replyDraft).then((ok) => {
            if (ok) setReplyDraft("");
          });
        }}
        onOpenImage={setLightbox}
        onTag={() => {
          router.push("/community");
        }}
        viewerId={viewerId}
        canDelete={Boolean(viewerId && (post.authorId === viewerId || profile?.role === "admin"))}
        onDelete={() => {
          void deletePost(post.id).then((ok) => {
            if (ok) router.push("/community");
          });
        }}
        onDeleteReply={(commentId) => {
          void deleteComment(commentId);
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
