import type { Metadata } from "next";
import { JobDetail } from "@/components/job-detail";

type Params = { id: string };

export const metadata: Metadata = { title: "Vakansiya" };

export default async function JobDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return <JobDetail id={id} />;
}
