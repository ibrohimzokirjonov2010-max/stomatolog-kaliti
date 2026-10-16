import type { Metadata } from "next";
import { ElonlarPage } from "@/components/crm/elonlar";

export const metadata: Metadata = { title: "E’lonlar", description: "Stomatologiya sohasidagi e’lonlar" };

export default function Page() {
  return <ElonlarPage />;
}
