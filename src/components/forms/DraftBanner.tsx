"use client";

export function DraftBanner<T>({
  draft,
  onRestore,
}: {
  draft: { status: "idle" | "saving" | "saved"; savedAt: string; pending: T | null; discard: () => void; clearPending: () => void };
  onRestore: (value: T) => void;
}) {
  if (!draft.pending && draft.status === "idle") return null;
  return (
    <div className="af-note" data-testid="draft-banner">
      {draft.pending ? (
        <p>
          Saqlangan qoralama bor.{" "}
          <button type="button" className="af-add" onClick={() => { onRestore(draft.pending as T); draft.clearPending(); }}>Tiklash</button>
          {" "}
          <button type="button" className="af-add" onClick={draft.discard}>O‘chirish</button>
        </p>
      ) : (
        <p>{draft.status === "saving" ? "Qoralama saqlanmoqda…" : `Qoralama ${draft.savedAt} da saqlandi.`}</p>
      )}
    </div>
  );
}
