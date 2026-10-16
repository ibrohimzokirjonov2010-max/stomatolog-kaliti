"use client";

import { useParams } from "next/navigation";
import { VideoLesson } from "@/components/education/mobile/VideoLesson";

export default function VideoLessonPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  return <VideoLesson id={id || "kanal-davolash"} />;
}
