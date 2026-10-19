"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrtiqchaDesktop } from "@/components/ortiqcha-desktop";
import { ContactForm, Modal, PostForm } from "@/components/surplus-forms";
import { SurplusMobileCatalog } from "@/components/surplus/mobile/SurplusMobileCatalog";
import { useSurplusWork } from "@/components/surplus-provider";
import type { SurplusListing } from "@/data/surplus";

type ModalKind = "post" | "contact" | "edit" | null;

export function OrtiqchaBrowse() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const { feed } = useSurplusWork();
  const [modal, setModal] = useState<ModalKind>(null);
  const [active, setActive] = useState<SurplusListing | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  return (
    <div className="flex min-h-full flex-col gap-4">
      <SurplusMobileCatalog
        onPost={() => {
          setActive(null);
          setModal("post");
        }}
      />

      <div className="hidden lg:block">
        <OrtiqchaDesktop
          feed={feed}
          q={q}
          added={added}
          onPost={() => {
            setActive(null);
            setModal("post");
          }}
          onContact={(listing) => {
            setActive(listing);
            setModal("contact");
          }}
          onEdit={(listing) => {
            setActive(listing);
            setModal("edit");
          }}
          onAdded={(id) => setAdded(id)}
        />
      </div>

      {modal === "post" ? (
        <Modal title="E’lon joylash" onClose={() => setModal(null)}>
          <PostForm onCancel={() => setModal(null)} onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal === "edit" && active?.mine ? (
        <Modal title="E’lonni tahrirlash" onClose={() => setModal(null)}>
          <PostForm listing={active} onCancel={() => setModal(null)} onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal === "contact" && active && !active.mine ? (
        <Modal title="Sotuvchi bilan bog‘lanish" onClose={() => setModal(null)}>
          <ContactForm listing={active} onClose={() => setModal(null)} />
        </Modal>
      ) : null}
    </div>
  );
}
