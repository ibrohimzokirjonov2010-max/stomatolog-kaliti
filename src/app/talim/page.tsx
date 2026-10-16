import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { videoLessons } from "@/data/education";

export const metadata: Metadata = {
  title: "Ta’lim",
  description: "Video darslar — namuna kontent. Player keyinroq.",
};

export default function TalimPage() {
  return (
    <div>
      <header className="mb-4 flex flex-wrap items-start gap-3">
        <div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#1a1d26]">Ta’lim</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">Video darslar — namuna. To‘liq player keyinroq.</p>
        </div>
        <Link
          href="/onlayn-darslar"
          className="ml-auto inline-flex h-10 items-center rounded-lg bg-[#0066FF] px-4 text-[13px] font-semibold text-white hover:bg-[#0057d9]"
        >
          Onlayn darslar
        </Link>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {videoLessons.map((video) => (
          <article
            key={video.id}
            id={video.id}
            className="scroll-mt-24 overflow-hidden rounded-[14px] border border-[#eceff5] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="relative">
              <Image
                src={video.image}
                alt=""
                width={640}
                height={360}
                className="h-40 w-full object-cover"
              />
              <span className="absolute inset-0 m-auto flex size-11 items-center justify-center rounded-full bg-black/50 text-white">
                <Play className="ml-0.5 size-5 fill-white" />
              </span>
              <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                {video.duration}
              </span>
            </div>
            <div className="p-3.5">
              <h2 className="text-[14px] font-semibold text-[#1a1d26]">{video.title}</h2>
              <p className="mt-1 text-[12px] text-[#8b93a7]">Namuna dars. Video player tez orada.</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
