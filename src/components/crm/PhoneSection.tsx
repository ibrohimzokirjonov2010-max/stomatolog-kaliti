export function PhoneSection({ title, text, lines }: { title: string; text: string; lines: string[] }) {
  return (
    <section className="space-y-2 px-1 py-2 lg:hidden" data-testid="phone-fallback">
      <h1 className="text-[22px] font-extrabold text-[#111827]">{title}</h1>
      <p className="text-[13px] text-[#6a7c93]">{text}</p>
      <ul className="space-y-2">
        {lines.map((line) => (
          <li key={line} className="rounded-xl border border-[#e6edf5] bg-white px-3 py-2 text-[14px] text-[#111827]">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
