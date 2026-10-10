import type { Metadata } from "next";
import { CommunityPostPage } from "@/components/community-post-page";

type Params = { id: string };

export const metadata: Metadata = {
  title: "Post — Community",
  description: "StomaHub hamjamiyatidagi post",
};

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return <CommunityPostPage id={id} />;
}
