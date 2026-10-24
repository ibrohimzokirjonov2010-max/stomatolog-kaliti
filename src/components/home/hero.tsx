import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeHero() {
  return (
    <section className="grid grid-cols-[1.45fr_0.9fr] gap-4">
      <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-[#0F766E] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#1d4ed8_0%,#2563eb_42%,transparent_78%)]" />
        <Image
          src="/images/hero-dentist.png"
          alt=""
          width={720}
          height={400}
          className="absolute right-0 bottom-0 h-full w-[48%] object-cover object-[center_15%]"
          priority
        />
        <div className="absolute inset-y-0 right-[20%] w-40 bg-[linear-gradient(90deg,#0F766E,transparent)]" />
        <div className="relative z-10 max-w-lg px-7 py-7">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">
            Stomatologlar uchun hamma narsa bitta platformada
          </h1>
          <p className="mt-2 text-sm text-white/85">
            Ishingiz. Bilimingiz. Rivojlanishingiz. Biz bilan oson.
          </p>
          <Link
            href="/marketplace"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-5 bg-white text-primary hover:bg-white/90"
            )}
          >
            Hozir kashf eting
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <Link
        href="/marketplace?cat=implantlar"
        className="relative min-h-[220px] overflow-hidden rounded-2xl bg-[#0b1220] text-white"
      >
        <Image
          src="/images/implant-promo.png"
          alt=""
          width={640}
          height={360}
          className="absolute right-0 bottom-0 h-full w-[62%] object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1220_35%,transparent_80%)]" />
        <div className="relative z-10 p-6">
          <p className="text-[11px] font-semibold tracking-wide text-blue-300 uppercase">
            Premium
          </p>
          <h2 className="mt-1 text-xl font-bold">Implant Tizimlari</h2>
          <p className="mt-2 max-w-[14rem] text-sm text-white/70">
            Ishonchli brendlar, rasmiy distribyutorlardan
          </p>
          <span
            className={cn(
              buttonVariants({ size: "sm" }),
              "mt-5 bg-white text-slate-900 hover:bg-white/90"
            )}
          >
            Ko‘rish
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Link>
    </section>
  );
}
