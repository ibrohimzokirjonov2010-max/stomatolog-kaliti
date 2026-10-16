import type { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/ui";
import { YangiliklarMobileList } from "@/components/news/mobile/YangiliklarMobileList";

export const metadata: Metadata = {
  title: "Yangiliklar",
  description: "Stomatologiya sohasidagi eng so‘nggi yangiliklar va maqolalar.",
};

export default function Page() {
  return (
    <>
      <YangiliklarMobileList />
      <div className="hidden lg:block">
        <ComingSoon
          title="Yangiliklar"
          description="Soha yangiliklari tez orada shu yerda bo‘ladi."
        />
      </div>
    </>
  );
}
