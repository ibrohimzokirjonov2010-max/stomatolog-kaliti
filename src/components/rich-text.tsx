import { Fragment, type ReactNode } from "react";

/**
 * Tiny, safe formatter for seller descriptions (no HTML is ever injected):
 *   **qalin**, *kursiv*, __tagiga chizilgan__, "- " list lines, [matn](https://havola)
 */
const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g;

function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={key}>{inline(part.slice(2, -2), key)}</strong>;
    if (part.startsWith("__") && part.endsWith("__") && part.length > 4) return <u key={key}>{inline(part.slice(2, -2), key)}</u>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={key}>{inline(part.slice(1, -1), key)}</em>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link)
      return (
        <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-[#0066FF] underline">
          {link[1]}
        </a>
      );
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    const items = list;
    list = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-1.5 list-disc space-y-0.5 pl-5">
        {items.map((it, i) => (
          <li key={i}>{inline(it, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
  };
  lines.forEach((line, i) => {
    const m = line.match(/^\s*[-•]\s+(.*)$/);
    if (m) return void list.push(m[1]);
    flush();
    blocks.push(line.trim() ? <p key={`p-${i}`}>{inline(line, `p-${i}`)}</p> : <div key={`s-${i}`} className="h-2" />);
  });
  flush();
  return <div className={className}>{blocks}</div>;
}

/** Plain text version (for short snippets / line-clamp). */
export function stripRich(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(https?:\/\/[^\s)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "");
}
