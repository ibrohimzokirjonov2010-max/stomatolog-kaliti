import { instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";

/** Source page and Instagram, shown as new-tab links on the seminar form and detail pages. */
export function SeminarPublicLinks({
  sourceUrl,
  instagram,
  testId,
}: {
  sourceUrl?: string | null;
  instagram?: string | null;
  testId: string;
}) {
  const href = sourceUrlValue(sourceUrl ?? "");
  const ig = instagramHref(instagram ?? "");
  if (!href && !ig) return null;
  return (
    <div className="mt-3 flex flex-col gap-1.5 text-[13px] font-semibold" data-testid={testId}>
      {href ? (
        <a href={href} target="_blank" rel="noopener nofollow" className="truncate text-[#0066FF] hover:underline" data-testid={`${testId}-source`}>
          {href}
        </a>
      ) : null}
      {ig ? (
        <a href={ig} target="_blank" rel="noopener nofollow" className="truncate text-[#0066FF] hover:underline" data-testid={`${testId}-instagram`}>
          Instagram · {instagramValue(instagram ?? "")}
        </a>
      ) : null}
    </div>
  );
}
