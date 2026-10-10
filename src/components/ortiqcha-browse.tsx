"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, FileText, Plus, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { MobileSectionHeader, mobileHeaderActionCls } from "@/components/mobile-section-header";
import { useCart } from "@/components/cart-provider";
import { OrtiqchaDesktop } from "@/components/ortiqcha-desktop";
import { OrtiqchaImageBadges, ProductCard } from "@/components/product-card";
import { ContactForm, Modal, PostForm, sellerLine } from "@/components/surplus-forms";
import { useSurplusWork } from "@/components/surplus-provider";
import {
  expiryLabel,
  listingToProduct,
  normalizeCategory,
  statusLabel,
  surplusBrandLabel,
  surplusCities,
  surplusCategories,
  surplusSellerAvatar,
  type SurplusCategory,
  type SurplusListing,
} from "@/data/surplus";
import { cn } from "@/lib/utils";

type ModalKind = "post" | "contact" | "edit" | null;

type MobileChip = "all" | SurplusCategory | "yopiq" | "ochilgan";

const mobileChips: { key: MobileChip; label: string }[] = [
  { key: "all", label: "Barchasi" },
  { key: "kompozit", label: "Kompozit" },
  { key: "bonding", label: "Bond" },
  { key: "sement", label: "Sement" },
  { key: "implantlar", label: "Implant" },
  { key: "endodontiya", label: "Endo" },
  { key: "anesteziya", label: "Anesteziya" },
  { key: "borlar", label: "Borlar" },
  { key: "instrument", label: "Instrument" },
  { key: "ortodontiya", label: "Ortodontiya" },
  { key: "yopiq", label: "Yopiq" },
  { key: "ochilgan", label: "Ochilgan" },
];

export function OrtiqchaBrowse() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const { feed } = useSurplusWork();

  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [expiry, setExpiry] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [showSafety, setShowSafety] = useState(true);
  const [modal, setModal] = useState<ModalKind>(null);
  const [active, setActive] = useState<SurplusListing | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [mobileSearch, setMobileSearch] = useState("");
  const [mobileChip, setMobileChip] = useState<MobileChip>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  function clearFilters() {
    setCategory("");
    setStatus("");
    setExpiry("");
    setCity("");
    setPrice("");
  }

  const mobileVisible = useMemo(() => {
    const minExpiry = expiry ? Number(expiry) : 0;
    const maxPrice = price ? Number(price) : 0;
    let list = feed.filter((item) => {
      const matchesCat = !category || normalizeCategory(item.category) === category;
      const matchesStatus = !status || item.status === status;
      const matchesExpiry = !minExpiry || item.expiryMonths >= minExpiry;
      const matchesCity = !city || item.city === city;
      const matchesPrice = !maxPrice || item.price <= maxPrice;
      return matchesCat && matchesStatus && matchesExpiry && matchesCity && matchesPrice;
    });
    if (mobileChip !== "all") {
      if (mobileChip === "yopiq" || mobileChip === "ochilgan") {
        list = list.filter((item) => item.status === mobileChip);
      } else {
        list = list.filter((item) => normalizeCategory(item.category) === mobileChip);
      }
    }
    const mq = (mobileSearch.trim() || q).toLowerCase();
    if (mq) {
      list = list.filter((item) => {
        const haystack = `${item.name} ${item.brand} ${item.seller} ${item.city}`.toLowerCase();
        return haystack.includes(mq);
      });
    }
    return list;
  }, [category, city, expiry, feed, mobileChip, mobileSearch, price, q, status]);

  const mobileFilterBadge =
    (category ? 1 : 0) + (status ? 1 : 0) + (expiry ? 1 : 0) + (city ? 1 : 0) + (price ? 1 : 0);

  function clearMobile() {
    setMobileChip("all");
    setMobileSearch("");
    clearFilters();
  }

  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* ════════════════════════════════════════════════
          MOBILE LAYOUT (≤768px phone / lg shell)
          ════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <MobileSectionHeader
          title="Ortiqcha material"
          subtitle="Doktordan doktorga shaxsiy ortiqcha materiallar"
          extra={
            <button
              type="button"
              aria-label="E’lon berish"
              onClick={() => {
                setActive(null);
                setModal("post");
              }}
              className={mobileHeaderActionCls}
            >
              <Plus className="size-5" strokeWidth={2.4} />
            </button>
          }
        />

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#8b93a7]" />
          <input
            data-section-search
            value={mobileSearch}
            onChange={(event) => setMobileSearch(event.target.value)}
            placeholder="Material, muddat..."
            className="h-12 w-full rounded-2xl border-0 bg-white pr-12 pl-10 text-[15px] text-[#1a1d26] shadow-[0_4px_16px_rgba(15,23,42,0.06)] outline-none placeholder:text-[#8b93a7] focus:ring-2 focus:ring-[#0066FF]/20"
          />
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-[#e8f1ff] text-[#0066FF]"
            aria-label="Filtrlar"
          >
            <SlidersHorizontal className="size-4" />
            {mobileFilterBadge > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex size-[16px] items-center justify-center rounded-full bg-[#0066FF] text-[9px] font-bold text-white">
                {mobileFilterBadge}
              </span>
            ) : null}
          </button>
        </div>

        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mobileChips.map((chip) => {
            const on = mobileChip === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setMobileChip(chip.key)}
                className={cn(
                  "h-11 shrink-0 rounded-full px-4 text-[14px] font-semibold transition-colors",
                  on
                    ? "bg-[#0066FF] text-white shadow-[0_4px_12px_rgba(0,102,255,0.28)]"
                    : "border border-[#e6eaf2] bg-white text-[#1a1d26]",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {showSafety ? (
          <div className="relative mb-4 rounded-2xl bg-[#eaf2ff] px-3.5 py-3">
            <button
              type="button"
              onClick={() => setShowSafety(false)}
              className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full text-[#8b93a7]"
              aria-label="Yopish"
            >
              <X className="size-4" />
            </button>
            <p className="pr-8 text-[13px] font-semibold text-[#0B1F4D]">Muddat va ochilgan/yopiq majburiy</p>
            <p className="mt-0.5 pr-8 text-[12px] text-[#6b7280]">Originalini tekshiring. Faqat shaxsiy ortiqcha.</p>
          </div>
        ) : null}

        <Link
          href="/ortiqcha-material/elonlarim"
          className="mb-4 flex min-h-[56px] items-center gap-3 rounded-2xl border border-[#dbe7ff] bg-[#f5f8ff] px-3.5 py-3.5"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0066FF] text-white">
            <FileText className="size-[18px]" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[14px] font-bold text-[#1a1d26]">Mening e’lonlarim</span>
            <span className="mt-0.5 block text-[12px] text-[#8b93a7]">Tahrirlash va holat</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-[#8b93a7]" />
        </Link>

        <section className="mb-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold text-[#0B1F4D]">
              E’lonlar
              <span className="ml-1.5 text-[12px] font-semibold text-[#8b93a7]">{mobileVisible.length} ta</span>
            </h2>
            {mobileChip !== "all" || mobileSearch || mobileFilterBadge > 0 ? (
              <button type="button" onClick={clearMobile} className="text-[12px] font-semibold text-[#0066FF]">
                Tozalash
              </button>
            ) : null}
          </div>

          {mobileVisible.length === 0 ? (
            <div className="rounded-2xl border border-[#eceff5] bg-white px-4 py-12 text-center">
              <p className="text-[14px] font-semibold text-[#1a1d26]">{feed.length === 0 ? "Hali e’lon yo‘q" : "Mos e’lon topilmadi"}</p>
              <p className="mt-1 text-[13px] text-[#8b93a7]">{feed.length === 0 ? "Birinchi bo‘lib klinika ortiqchasini joylang. E’lonlar admin tasdiqlagach ko‘rinadi." : "Filtrlarni o‘zgartiring yoki yangi e’lon joylang."}</p>
              <button
                type="button"
                onClick={() => {
                  setActive(null);
                  setModal("post");
                }}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white"
              >
                E’lon joylash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {mobileVisible.map((listing) => (
                <MobileListingCard
                  key={listing.id}
                  listing={listing}
                  added={added === listing.id}
                  onContact={() => {
                    setActive(listing);
                    setModal("contact");
                  }}
                  onEdit={() => {
                    setActive(listing);
                    setModal("edit");
                  }}
                  onAdded={() => setAdded(listing.id)}
                />
              ))}
            </div>
          )}
        </section>

        <p className="mb-2 flex items-start gap-2 rounded-2xl bg-[#f5f8ff] px-3.5 py-3 text-[12px] leading-snug text-[#4b5568]">
          <Users className="mt-0.5 size-4 shrink-0 text-[#0066FF]" />
          <span>Faqat shaxsiy ortiqcha — dilerlik e’lonlari qabul qilinmaydi.</span>
        </p>

        {filtersOpen ? (
          <SurplusFilterSheet
            onClose={() => setFiltersOpen(false)}
            onClear={() => {
              clearFilters();
              setFiltersOpen(false);
            }}
            category={category}
            setCategory={setCategory}
            status={status}
            setStatus={setStatus}
            expiry={expiry}
            setExpiry={setExpiry}
            city={city}
            setCity={setCity}
            price={price}
            setPrice={setPrice}
          />
        ) : null}
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP LAYOUT (lg+): hero, category row, grid + right filters
          ════════════════════════════════════════════════ */}
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

function MobileListingCard({
  listing,
  added,
  onContact,
  onEdit,
  onAdded,
}: {
  listing: SurplusListing;
  added: boolean;
  onContact: () => void;
  onEdit: () => void;
  onAdded: () => void;
}) {
  const { add } = useCart();
  return (
    <ProductCard
      product={listingToProduct(listing)}
      variant="mobile"
      ortiqcha={{
        sellerLabel: sellerLine(listing),
        sellerAvatar: surplusSellerAvatar(listing.seller, listing.mine),
        sellerCity: listing.city,
        brandLabel: surplusBrandLabel(listing),
        imageBadges: (
          <OrtiqchaImageBadges
            featured={listing.featured}
            status={listing.status}
            statusText={statusLabel[listing.status]}
            size="sm"
          />
        ),
        isMine: Boolean(listing.mine),
        added,
        onEdit,
        onContact,
        deliveryLabel: surplusDelivery(listing),
        href: `/ortiqcha-material/${listing.id}`,
        onAddSurplus: () => {
          add(listing.id, listingToProduct(listing), 1, {
            source: "ortiqcha",
            expiryMonths: listing.expiryMonths,
          });
          onAdded();
        },
      }}
    />
  );
}

function surplusDelivery(listing: SurplusListing) {
  const place = listing.district ? `${listing.city} · ${listing.district}` : listing.city;
  return `${place} · ${expiryLabel(listing.expiryMonths)}`;
}


function SurplusFilterSheet({
  onClose,
  onClear,
  category,
  setCategory,
  status,
  setStatus,
  expiry,
  setExpiry,
  city,
  setCity,
  price,
  setPrice,
}: {
  onClose: () => void;
  onClear: () => void;
  category: string;
  setCategory: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  expiry: string;
  setExpiry: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Yopish" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2]" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[16px] font-bold text-[#1a1d26]">Filtrlar</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClear} className="text-sm font-semibold text-[#8b93a7]">
              Tozalash
            </button>
            <button type="button" onClick={onClose} className="text-sm font-semibold text-[#0066FF]">
              Tayyor
            </button>
          </div>
        </div>

        <p className="mb-2 text-[12px] font-semibold text-[#8b93a7]">Kategoriya</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <OrtiqchaChip active={!category} label="Barchasi" onClick={() => setCategory("")} />
          {surplusCategories.map((item) => (
            <OrtiqchaChip
              key={item.id}
              active={category === item.id}
              label={item.label}
              onClick={() => setCategory(item.id)}
            />
          ))}
        </div>

        <p className="mb-2 text-[12px] font-semibold text-[#8b93a7]">Holat</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <OrtiqchaChip active={!status} label="Hammasi" onClick={() => setStatus("")} />
          <OrtiqchaChip active={status === "yopiq"} label="Yopiq" onClick={() => setStatus("yopiq")} />
          <OrtiqchaChip active={status === "ochilgan"} label="Ochilgan" onClick={() => setStatus("ochilgan")} />
        </div>

        <p className="mb-2 text-[12px] font-semibold text-[#8b93a7]">Muddat</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <OrtiqchaChip active={!expiry} label="Istalgan" onClick={() => setExpiry("")} />
          <OrtiqchaChip active={expiry === "3"} label="3+ oy" onClick={() => setExpiry("3")} />
          <OrtiqchaChip active={expiry === "6"} label="6+ oy" onClick={() => setExpiry("6")} />
        </div>

        <p className="mb-2 text-[12px] font-semibold text-[#8b93a7]">Shahar</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <OrtiqchaChip active={!city} label="Barchasi" onClick={() => setCity("")} />
          {surplusCities.map((item) => (
            <OrtiqchaChip key={item} active={city === item} label={item} onClick={() => setCity(item)} />
          ))}
        </div>

        <p className="mb-2 text-[12px] font-semibold text-[#8b93a7]">Narx</p>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <OrtiqchaChip active={!price} label="Istalgancha" onClick={() => setPrice("")} />
          <OrtiqchaChip active={price === "500000"} label="≤ 500 ming" onClick={() => setPrice("500000")} />
          <OrtiqchaChip active={price === "1000000"} label="≤ 1 mln" onClick={() => setPrice("1000000")} />
          <OrtiqchaChip active={price === "2000000"} label="≤ 2 mln" onClick={() => setPrice("2000000")} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 mb-2 h-12 w-full rounded-2xl bg-[#0066FF] text-[15px] font-semibold text-white"
        >
          Natijalarni ko‘rish
        </button>
      </div>
    </div>
  );
}

function OrtiqchaChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl px-3 text-[13px] font-semibold",
        active ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]",
      )}
    >
      {label}
    </button>
  );
}
