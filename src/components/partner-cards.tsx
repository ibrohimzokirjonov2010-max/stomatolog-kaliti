import { buttonVariants } from "@/components/ui/button";
import { partners } from "@/data/partners";
import { cn } from "@/lib/utils";

export function PartnerCards() {
  return (
    <ul className="grid grid-cols-3 gap-6">
      {partners.map((partner) => (
        <li
          key={partner.id}
          className="flex flex-col rounded-lg border border-border bg-card px-7 py-8"
        >
          <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Hamkor
          </p>
          <h2 className="mt-3 font-heading text-2xl font-medium">{partner.name}</h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/85">{partner.supplies}</p>
          <p className="mt-3 text-base text-muted-foreground">{partner.delivery}</p>
          <a
            href={partner.contactHref}
            className={cn(buttonVariants({ size: "xl", variant: "outline" }), "mt-8 self-start")}
          >
            Bog‘lanish · {partner.contactLabel}
          </a>
        </li>
      ))}
    </ul>
  );
}
