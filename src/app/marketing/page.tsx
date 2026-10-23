import type { Metadata } from "next";
import { PageTitle } from "@/components/dashboard/ui";
import { MarketingForm } from "@/components/marketing-form";
import { MarketingMobile } from "@/components/marketing/MarketingMobile";

export const metadata: Metadata = {
  title: "Marketing",
};

export default function MarketingPage() {
  return (
    <>
    <MarketingMobile />
    <div className="mx-auto hidden max-w-[1100px] items-start gap-5 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border bg-white p-5">
        <PageTitle
          title="Marketing va dizayn"
          description="Klinika uchun logo, sayt, reklama va Instagram."
          className="mb-4"
        />
        <ul className="space-y-2 text-sm text-slate-600">
          <li>01 · Logo va brend</li>
          <li>02 · Sayt shabloni</li>
          <li>03 · Reklama materiallari</li>
          <li>04 · Instagram postlar</li>
        </ul>
        <p className="mt-4 text-[12px] text-muted-foreground">
          Narx suhbatdan keyin. Onlayn to‘lov yo‘q.
        </p>
      </aside>
      <MarketingForm />
    </div>
    </>
  );
}
