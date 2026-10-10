import Link from "next/link";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  href,
  action = "Barchasini ko‘rish",
}: {
  title: string;
  href: string;
  action?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <Link href={href} className="text-sm font-medium text-primary hover:underline">
        {action}
      </Link>
    </div>
  );
}

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white px-8 py-16 text-center">
      <p className="text-sm font-medium text-primary">Tez orada</p>
      <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{description}</p>
      <p className="mt-6 text-sm text-muted-foreground">
        Hozir ishlaydi: bosh sahifa, marketplace, seminarlar va marketing so‘rovi.
      </p>
    </div>
  );
}

export function PageTitle({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-5", className)}>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
