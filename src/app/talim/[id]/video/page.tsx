"use client";

import { useParams } from "next/navigation";
import { CoursePlayer } from "@/components/library/live-pages";

export default function VideoLessonPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <CoursePlayer id={id} />;
}
