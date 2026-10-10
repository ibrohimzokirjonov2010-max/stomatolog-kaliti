import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-border bg-white px-8 py-16 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Bu sahifa yo‘q</h1>
      <p className="mt-2 text-muted-foreground">Bosh sahifa, marketplace yoki seminarlarni oching.</p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        Bosh sahifa
      </Link>
    </div>
  );
}
