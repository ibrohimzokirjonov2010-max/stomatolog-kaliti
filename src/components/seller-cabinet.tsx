"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Eye,
  LayoutDashboard,
  Package,
  Plus,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSellerWork } from "@/components/seller-provider";
import { SellerOnboarding } from "@/components/seller-apply-form";
import { SellerOverviewAnalytics } from "@/components/seller-overview-analytics";
import { CABINET_MENU, SOON_TABS, cabinetHref, cabinetTabFromParam, type CabinetTab } from "@/components/seller-cabinet-nav";
import { SellerOverviewDesktop, SoonPanel } from "@/components/seller-overview-desktop";
import { SellerAnalyticsDesktop } from "@/components/seller-analytics-desktop";
import { SellerMessagesDesktop } from "@/components/seller-messages-desktop";
import { SellerReviewsDesktop } from "@/components/seller-reviews-desktop";
import { SellerSettingsDesktop } from "@/components/seller-settings-desktop";
import { SellerProfileDesktop } from "@/components/seller-profile-desktop";
import { SellerPaymentsDesktop } from "@/components/seller-payments-desktop";
import { SellerProductsDesktop } from "@/components/seller-products-desktop";
import { SellerOrdersDesktop } from "@/components/seller-orders-desktop";
import { SellerProductWizard } from "@/components/seller-product-wizard";
import { SellerPendingStatus, SellerRejectedStatus } from "@/components/seller-status-gate";
import { ShopAvatar, VerifiedBadge } from "@/components/seller-ui";
import {
  cardBrandLabel,
  isShopApproved,
  shopCities,
  shopHref,
  type Shop,
} from "@/data/shops";
import {
  categoryLabels,
  productHref,
  type Product,
} from "@/data/products";
import {
  formaKinds,
} from "@/data/forma";
import {
  cardStatusLabel,
  catalogHrefForCategory,
  sectionForCategory,
  type SellerSection,
} from "@/lib/seller-work";
import { prepareImage, uploadImage } from "@/lib/image-upload";
import { formatMoney } from "@/lib/format";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import { courierLocationText } from "@/lib/courier-location";
import { MARKETPLACE_COMMISSION_PERCENT } from "@/lib/commission";
import {
  advanceOrderStatus,
  buyerNotifiedText,
  isPickupOrder,
  startOrdersPolling,
  orderStatusLabel,
  paymentMethods,
  paymentStateLabel,
  sellerActionLabel,
  setOrderDeliveryTrack,
  statusBadgeClass,
  type Order,
} from "@/lib/orders";

const cardErrors = {
  holder: "Karta egasi ismini yozing.",
  expiry: "Amal qilish muddati MM/YY formatida bo‘lsin.",
  number: "Karta raqami 16–19 raqam bo‘lishi kerak.",
  brand: "Uzcard, Humo, Visa yoki Mastercard raqamini kiriting.",
  luhn: "Karta raqami noto‘g‘ri — raqamlarni tekshiring.",
  session: "Avval do‘konga kiring.",
} as const;


const tabs: { id: CabinetTab; label: string; short: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Umumiy", short: "Umumiy", icon: LayoutDashboard },
  { id: "products", label: "Mahsulotlar", short: "Mahsulot", icon: Package },
  { id: "orders", label: "Buyurtmalar", short: "Buyurtma", icon: ShoppingBag },
  { id: "profile", label: "Do‘kon profili", short: "Profil", icon: Store },
  { id: "card", label: "Karta / to‘lov", short: "Karta", icon: CreditCard },
];

type ProductFilter = "all" | SellerSection;

const productFilters: { id: ProductFilter; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "marketplace", label: "Marketplace" },
  { id: "forma", label: "Forma" },
  { id: "jihozlar", label: "Jihozlar" },
];

export function SellerCabinet() {
  const { session, ready } = useSellerWork();
  if (!ready) {
    return <p className="text-sm text-[#8b93a7]">Yuklanmoqda...</p>;
  }
  if (!session) return <SellerOnboarding />;
  if (session.verified === "rejected") return <SellerRejectedStatus shop={session} />;
  if (!isShopApproved(session)) return <SellerPendingStatus shop={session} />;
  return <Dashboard shop={session} />;
}


function Dashboard({ shop }: { shop: Shop }) {
  const { stats, logout, addProduct } = useSellerWork();
  const router = useRouter();
  const params = useSearchParams();
  const tab: CabinetTab = cabinetTabFromParam(params.get("tab"));
  const setTab = (next: CabinetTab) => router.replace(cabinetHref(next), { scroll: false });
  const [productModal, setProductModal] = useState<Product | "new" | null>(null);
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const soon = SOON_TABS.includes(tab);
  const soonMeta = CABINET_MENU.find((m) => m.id === tab);

  function duplicate(item: Product) {
    addProduct({
      name: `${item.name} (nusxa)`.slice(0, 160),
      brand: item.brand,
      category: item.category,
      subcategory: item.subcategory,
      price: item.price,
      oldPrice: item.discount ? item.oldPrice : undefined,
      discount: item.discount,
      stock: item.stockQty ?? 0,
      delivery: item.delivery,
      description: item.description ?? "",
      image: item.image,
      images: item.images,
      attrs: item.attrs,
      kind: item.kind,
      gender: item.gender,
      sizes: item.sizes,
      colors: item.colors,
    });
  }

  return (
    <>
      {/* ───── Desktop (lg+) ───── */}
      <div className="hidden lg:block lg:pb-4">
        {tab === "overview" ? <SellerOverviewDesktop shop={shop} onAdd={() => setProductModal("new")} /> : null}
        {tab === "products" ? (
          <SellerProductsDesktop onAdd={() => setProductModal("new")} onEdit={(item) => setProductModal(item)} onDuplicate={duplicate} />
        ) : null}
        {tab === "orders" ? <SellerOrdersDesktop /> : null}
        {tab === "analytics" ? <SellerAnalyticsDesktop /> : null}
        {tab === "messages" ? <SellerMessagesDesktop /> : null}
        {tab === "reviews" ? <SellerReviewsDesktop /> : null}
        {tab === "settings" ? <SellerSettingsDesktop shop={shop} /> : null}
        {tab === "card" ? <SellerPaymentsDesktop cardSettings={<CardPanel />} /> : null}
        {tab === "profile" ? <SellerProfileDesktop shop={shop} /> : null}
        {soon && soonMeta ? <SoonPanel tab={tab} label={soonMeta.label} icon={soonMeta.icon} /> : null}
      </div>

      {/* ───── Mobile / tablet ───── */}
      <div className="space-y-2 pb-20 sm:space-y-4 lg:hidden">
        <p className="text-[12px] text-[#8b93a7] sm:text-[13px]">
          <Link href="/marketplace" className="text-[#0066FF] hover:underline">
            Marketplace
          </Link>
          <span className="mx-1">/</span>
          <span>Sotuvchi kabineti</span>
        </p>

        <section className="rounded-[12px] border border-[#eceff5] bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[16px] sm:p-5">
          <div className="flex items-start gap-2 sm:gap-4">
            <ShopAvatar shop={shop} className="size-10 shrink-0 text-[14px] sm:size-16 sm:text-[22px]" />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <h1 className="min-w-0 truncate text-[17px] font-bold tracking-tight text-[#1a1d26] sm:text-[22px]">{shop.name}</h1>
                <VerifiedBadge status={shop.verified} />
              </div>
              <p className="mt-0.5 truncate text-[11.5px] text-[#6b7280] sm:mt-1 sm:text-sm">
                {shop.ownerName} · {shop.city} · {shop.phone}
                <span className="hidden sm:inline">{shop.telegram ? ` · ${shop.telegram}` : ""}</span>
              </p>
              <p className="mt-1 hidden line-clamp-2 text-[13.5px] leading-relaxed text-[#4b5568] sm:block">{shop.bio}</p>
              <div className="mt-2 flex items-center gap-1.5 sm:mt-3 sm:flex-wrap sm:gap-2">
                <Button
                  type="button"
                  className="h-9 min-w-0 flex-1 !rounded-xl text-[13px] sm:h-9 sm:flex-none sm:px-4"
                  onClick={() => {
                    setTab("products");
                    setProductModal("new");
                  }}
                >
                  <Plus className="size-3.5" />
                  <span className="truncate">Mahsulot qo‘shish</span>
                </Button>
                <Link
                  href={shopHref(shop.slug)}
                  className={cn(buttonVariants({ variant: "outline" }), "hidden h-9 !rounded-xl text-[12.5px] sm:inline-flex")}
                >
                  Ommaviy sahifa
                </Link>
                <Link
                  href={shopHref(shop.slug)}
                  className="inline-flex h-9 shrink-0 items-center rounded-xl border border-[#e6eaf2] px-2.5 text-[12px] font-semibold text-[#4b5568] sm:hidden"
                  aria-label="Ommaviy sahifa"
                >
                  Sahifa
                </Link>
                <Button type="button" variant="ghost" className="h-9 shrink-0 !rounded-xl px-2 text-[12px] text-[#8b93a7] sm:px-3 sm:text-[12.5px]" onClick={logout}>
                  Chiqish
                </Button>
              </div>
            </div>
          </div>
        </section>

        <nav className="-mx-1 flex gap-1 touch-pan-x overflow-x-auto overscroll-x-contain px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((item) => {
            const on = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold transition-colors sm:h-10 sm:gap-1.5 sm:px-3.5 sm:text-[13px]",
                  on ? "bg-[#0066FF] text-white" : "border border-[#e6eaf2] bg-white text-[#4b5568] hover:bg-[#f7f9fc]",
                )}
              >
                <Icon className="size-3.5" />
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {tab === "overview" || tab === "analytics" || tab === "messages" || tab === "reviews" || tab === "settings" || soon ? (
          <OverviewPanel
            onAdd={() => {
              setTab("products");
              setProductModal("new");
            }}
            onOpenProducts={(filter) => {
              setProductFilter(filter);
              setTab("products");
            }}
            onOpenOrders={() => setTab("orders")}
          />
        ) : null}

        {tab === "products" ? (
          <ProductsPanel
            filter={productFilter}
            onFilter={setProductFilter}
            onAdd={() => setProductModal("new")}
            onEdit={(item) => setProductModal(item)}
          />
        ) : null}

        {tab === "orders" ? <OrdersPanel /> : null}
        {tab === "profile" ? <ProfilePanel shop={shop} /> : null}
        {tab === "card" ? <CardPanel /> : null}

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-snug text-[#8b93a7] sm:text-[12px]">
          <Store className="size-3.5" />
          Faol mahsulotlar: Marketplace {stats.bySection.marketplace}, Forma {stats.bySection.forma}, Jihozlar{" "}
          {stats.bySection.jihozlar}. To‘lovlar escrow orqali: shifokor qabul qilgach pul {MARKETPLACE_COMMISSION_PERCENT}% platforma komissiyasi ushlab qolinib o‘tkaziladi.
        </p>
      </div>

      {productModal ? (
        <SellerProductWizard product={productModal === "new" ? undefined : productModal} onDone={() => setProductModal(null)} />
      ) : null}
    </>
  );
}

function OverviewPanel({
  onAdd,
  onOpenProducts,
  onOpenOrders,
}: {
  onAdd: () => void;
  onOpenProducts: (filter: ProductFilter) => void;
  onOpenOrders: () => void;
}) {
  const { stats } = useSellerWork();
  return (
    <div className="space-y-2.5 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Package className="size-3.5 sm:size-4" />}
          label="Mahsulotlar"
          value={`${stats.active} / ${stats.products}`}
          hint="Faol / jami"
        />
        <StatCard
          icon={<ShoppingBag className="size-3.5 sm:size-4" />}
          label="Buyurtmalar"
          value={String(stats.orders)}
          hint="Shu do‘kon buyurtmalari"
          onClick={onOpenOrders}
        />
        <StatCard icon={<Eye className="size-3.5 sm:size-4" />} label="Ko‘rishlar" value={String(stats.views)} hint="Do‘kon sahifasi" />
        <button
          type="button"
          onClick={onAdd}
          className="hidden flex-col items-start justify-center rounded-[16px] border border-dashed border-[#93c5fd] bg-[#f5f9ff] p-4 text-left transition hover:bg-[#eaf2ff] lg:flex"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#0066FF] text-white">
            <Plus className="size-4" />
          </span>
          <p className="mt-3 text-[15px] font-semibold text-[#1a1d26]">Mahsulot qo‘shish</p>
          <p className="mt-0.5 text-[12px] text-[#8b93a7]">Marketplace · Forma · Jihozlar</p>
        </button>
      </div>

      <section className="rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[16px] sm:p-5">
        <h2 className="text-[15px] font-semibold text-[#1a1d26] sm:text-[16px]">Bo‘limlar bo‘yicha</h2>
        <p className="mt-0.5 text-[12px] text-[#8b93a7] sm:text-[13px]">Faol e’lonlar qayerda ko‘rinadi</p>
        <div className="mt-2.5 grid gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-2.5">
          {(
            [
              {
                id: "marketplace" as const,
                title: "Marketplace",
                count: stats.bySection.marketplace,
                href: "/marketplace",
                text: "Materiallar, implantlar, asboblar",
              },
              {
                id: "forma" as const,
                title: "Forma",
                count: stats.bySection.forma,
                href: "/forma",
                text: "Scrub, xalat, qalpoq, poyabzal",
              },
              {
                id: "jihozlar" as const,
                title: "Jihozlar",
                count: stats.bySection.jihozlar,
                href: "/jihozlar",
                text: "Klinik jihoz va uskunalar",
              },
            ] as const
          ).map((item) => (
            <div key={item.id} className="rounded-[12px] border border-[#eceff5] bg-[#f7f9fc] p-2.5 sm:rounded-[14px] sm:p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold text-[#1a1d26]">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-[#8b93a7]">{item.text}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[13px] font-bold text-[#0066FF]">
                  {item.count}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenProducts(item.id)}
                  className="text-[12.5px] font-semibold text-[#0066FF] hover:underline"
                >
                  Ro‘yxat
                </button>
                <Link href={item.href} className="text-[12.5px] font-semibold text-[#6b7280] hover:underline">
                  Katalog
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SellerOverviewAnalytics />
    </div>
  );
}

function ProductsPanel({
  filter,
  onFilter,
  onAdd,
  onEdit,
}: {
  filter: ProductFilter;
  onFilter: (id: ProductFilter) => void;
  onAdd: () => void;
  onEdit: (item: Product) => void;
}) {
  const { myProducts } = useSellerWork();
  const filtered = useMemo(() => {
    if (filter === "all") return myProducts;
    return myProducts.filter((item) => sectionForCategory(item.category) === filter);
  }, [filter, myProducts]);

  return (
    <section className="rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[16px] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#1a1d26] sm:text-[16px]">Mening mahsulotlarim</h2>
          <p className="mt-0.5 text-[12px] text-[#8b93a7] sm:text-[13px]">
            Marketplace, Forma va Jihozlar kataloglarida ko‘rinadi.
          </p>
        </div>
        <Button className="hidden h-10 !rounded-xl lg:inline-flex" onClick={onAdd}>
          <Plus className="size-4" />
          Mahsulot qo‘shish
        </Button>
      </div>

      <div className="-mx-1 mt-2.5 flex gap-1.5 touch-pan-x overflow-x-auto overscroll-x-contain px-1 pb-0.5 sm:mt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {productFilters.map((item) => {
          const on = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilter(item.id)}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold sm:h-9 sm:px-3.5 sm:text-[13px]",
                on ? "bg-[#e8f1ff] text-[#0066FF]" : "bg-[#f4f6fa] text-[#4b5568]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <ProductTable items={filtered} onEdit={onEdit} emptyFilter={filter} />
    </section>
  );
}

function ProductTable({
  items,
  onEdit,
  emptyFilter,
}: {
  items: Product[];
  onEdit: (item: Product) => void;
  emptyFilter: ProductFilter;
}) {
  const { activate, deactivate, removeProduct } = useSellerWork();
  if (!items.length) {
    const hint =
      emptyFilter === "forma"
        ? "Forma (scrub, xalat…) qo‘shing — /forma katalogida chiqadi."
        : emptyFilter === "jihozlar"
          ? "Jihoz qo‘shing — /jihozlar sahifasida chiqadi."
          : emptyFilter === "marketplace"
            ? "Material, implant yoki asbob qo‘shing."
            : "Birinchi mahsulotingizni qo‘shing.";
    return (
      <div className="mt-4 rounded-xl bg-[#f7f9fc] px-4 py-10 text-center">
        <p className="font-medium text-[#1a1d26]">Hali mahsulot yo‘q</p>
        <p className="mt-1 text-sm text-[#8b93a7]">{hint}</p>
      </div>
    );
  }
  return (
    <ul className="mt-2.5 space-y-2 sm:mt-4 sm:space-y-2.5">
      {items.map((item) => {
        const inactive = item.active === false;
        const section = sectionForCategory(item.category);
        return (
          <li key={item.id} className="flex gap-2.5 rounded-[12px] border border-[#eceff5] p-2.5 sm:gap-3 sm:rounded-[14px] sm:p-3">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f7f9fc] sm:size-[80px] sm:rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="size-full object-contain p-0.5 sm:p-1" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-[#1a1d26] sm:text-[15px]">{item.name}</p>
                  <p className="truncate text-[11.5px] text-[#8b93a7] sm:text-[12.5px]">
                    {item.brand} · {categoryLabels[item.category]}
                    {item.kind ? ` · ${formaKinds.find((k) => k.id === item.kind)?.label ?? item.kind}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  <span className="inline-flex items-center rounded-full bg-[#e8f1ff] px-2 py-0.5 text-[10px] font-semibold text-[#0066FF] sm:px-2.5 sm:text-[11px]">
                    {section === "forma" ? "Forma" : section === "jihozlar" ? "Jihozlar" : "Market"}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:text-[11px]",
                      inactive ? "bg-[#f3f5f9] text-[#8b93a7]" : "bg-[#ecfdf3] text-[#15803d]",
                    )}
                  >
                    {inactive ? "Faol emas" : "Faol"}
                  </span>
                </div>
              </div>
              <p className="mt-0.5 text-[14px] font-bold text-[#0066FF] sm:mt-1 sm:text-[15px]">{formatMoney(item.price, "UZS")}</p>
              <p className="truncate text-[11px] text-[#8b93a7] sm:text-[12px]">
                {item.stockQty ?? 0} dona · {item.delivery}
                {item.sizes?.length ? ` · ${item.sizes.join(", ")}` : ""}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-2 sm:gap-2">
                <Button type="button" variant="outline" className="h-7 !rounded-lg px-2.5 text-[11.5px] sm:h-8 sm:!rounded-xl sm:text-[12.5px]" onClick={() => onEdit(item)}>
                  Tahrirlash
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-7 !rounded-lg px-2.5 text-[11.5px] sm:h-8 sm:!rounded-xl sm:text-[12.5px]"
                  onClick={() => (inactive ? activate(item.id) : deactivate(item.id))}
                >
                  {inactive ? "Ochish" : "Yopish"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-7 !rounded-lg px-2 text-[11.5px] text-[#8b93a7] sm:h-8 sm:!rounded-xl sm:text-[12.5px]"
                  onClick={() => {
                    if (window.confirm("Mahsulotni o‘chirasizmi?")) removeProduct(item.id);
                  }}
                >
                  O‘chirish
                </Button>
                <Link
                  href={productHref(item)}
                  className="inline-flex h-7 items-center text-[11.5px] font-semibold text-[#0066FF] sm:h-8 sm:text-[12.5px]"
                >
                  Ko‘rish
                </Link>
                <Link
                  href={catalogHrefForCategory(item.category)}
                  className="inline-flex h-7 items-center text-[11.5px] font-semibold text-[#6b7280] sm:h-8 sm:text-[12.5px]"
                >
                  Katalog
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function OrdersPanel() {
  const { shopOrders, session } = useSellerWork();
  const [orders, setOrders] = useState<Order[]>(shopOrders);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [trackDraft, setTrackDraft] = useState<
    Record<string, { url: string; name: string; phone: string; car: string; loc: string }>
  >({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a server-backed external cache
    setOrders(shopOrders);
  }, [shopOrders]);

  useEffect(() => startOrdersPolling(), []);


  function draftFor(order: Order) {
    return (
      trackDraft[order.id] ?? {
        url: order.yandexTrackUrl ?? "",
        name: order.courierName ?? "",
        phone: order.courierPhone ?? "",
        car: order.carInfo ?? "",
        loc: courierLocationText(order),
      }
    );
  }

  function setDraft(orderId: string, patch: Partial<{ url: string; name: string; phone: string; car: string; loc: string }>) {
    setTrackDraft((prev) => {
      const order = orders.find((o) => o.id === orderId);
      const base = prev[orderId] ?? {
        url: order?.yandexTrackUrl ?? "",
        name: order?.courierName ?? "",
        phone: order?.courierPhone ?? "",
        car: order?.carInfo ?? "",
        loc: order ? courierLocationText(order) : "",
      };
      return { ...prev, [orderId]: { ...base, ...patch } };
    });
  }

  async function onAdvance(orderId: string) {
    if (!session) return;
    setBusyId(orderId);
    const res = await advanceOrderStatus(orderId);
    setBusyId(null);
    if (!res.ok) {
      setFlash(res.reason || "Holatni yangilab bo‘lmadi.");
      window.setTimeout(() => setFlash(""), 3500);
      return;
    }
    setFlash(buyerNotifiedText(orderStatusLabel[res.order.status], res));
    setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
    window.setTimeout(() => setFlash(""), 2800);
  }

  async function onSaveTrack(order: Order, advanceToYolda: boolean) {
    if (!session) return;
    const d = draftFor(order);
    const url = d.url.trim();
    if (advanceToYolda && !url) {
      setFlash("Yandex Taxi kuzatuv linkini kiriting");
      window.setTimeout(() => setFlash(""), 2500);
      return;
    }
    setBusyId(order.id);
    const res = await setOrderDeliveryTrack(
      order.id,
      {
        yandexTrackUrl: url || undefined,
        courierName: d.name.trim() || undefined,
        courierPhone: d.phone.trim() || undefined,
        carInfo: d.car.trim() || undefined,
        location: d.loc.trim(),
      },
      { advanceToYolda },
    );
    setBusyId(null);
    if (!res.ok) {
      setFlash(res.reason || "Kuzatuv saqlanmadi.");
      window.setTimeout(() => setFlash(""), 3500);
      return;
    }
    setFlash(buyerNotifiedText(advanceToYolda ? "Yo‘lda" : "Kuzatuv ma’lumotlari yangilandi", res));
    setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order : o)));
    setTrackDraft((prev) => {
      const next = { ...prev };
      delete next[order.id];
      return next;
    });
    window.setTimeout(() => setFlash(""), 2800);
  }

  if (!orders.length) {
    return (
      <section className="rounded-[16px] border border-[#eceff5] bg-white p-4 sm:rounded-[20px] sm:p-5">
        <h2 className="text-[15px] font-semibold text-[#1a1d26] sm:text-[16px]">Buyurtmalar</h2>
        <div className="mt-4 rounded-2xl bg-[#f7f9fc] px-4 py-12 text-center">
          <p className="font-semibold text-[#1a1d26]">Hali buyurtma yo‘q</p>
          <p className="mt-1 text-sm text-[#8b93a7]">
            Shifokorlar buyurtma bersa, shu yerda ko‘rinadi.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[16px] border border-[#eceff5] bg-white p-4 sm:rounded-[20px] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-semibold text-[#1a1d26]">Buyurtmalar</h2>
          <p className="mt-0.5 text-[13px] text-[#8b93a7]">
            Holatni bosqichma-bosqich yangilang · {orders.length} ta
          </p>
        </div>
        {flash ? (
          <p className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700 ring-1 ring-emerald-200/70">
            {flash}
          </p>
        ) : null}
      </div>
      <ul className="mt-4 space-y-3">
        {orders.map((order) => {
          const pay = paymentMethods.find((item) => item.id === order.payment)?.label ?? order.payment;
          const action = sellerActionLabel(order.status);
          const showTrackForm =
            order.paymentState !== "refunded" &&
            !isPickupOrder(order) &&
            (["yigilmoqda", "yigish_tugadi", "yolda"].includes(order.status) ||
              Boolean(order.yandexTrackUrl || order.courierName || order.courierPhone));
          const d = draftFor(order);
          const isShipAction = order.status === "yigish_tugadi";

          return (
            <li
              key={order.id}
              className="rounded-[16px] border border-[#eceff5] bg-gradient-to-b from-white to-[#fafbfd] p-3.5 sm:p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-[#1a1d26]">{order.id}</p>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1",
                        statusBadgeClass(order.status),
                      )}
                    >
                      {orderStatusLabel[order.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-[#8b93a7]">
                    {order.name} · {order.phone} · {order.city}
                  </p>
                </div>
                <p className="text-[15px] font-bold text-[#0066FF]">{formatMoney(order.total, "UZS")}</p>
              </div>
              <p className="mt-2 text-[12px] text-[#6b7280]">
                {new Date(order.createdAt).toLocaleString("uz-UZ")} · {pay} · {order.items.length}{" "}
                pozitsiya
              </p>
              <ul className="mt-2 space-y-1">
                {order.items.slice(0, 4).map((item, idx) => (
                  <li key={`${order.id}-${idx}`} className="truncate text-[12.5px] text-[#4b5568]">
                    {item.qty}× {item.name}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11.5px] leading-relaxed text-[#8b93a7]">
                {paymentStateLabel[order.paymentState]}
                {order.paymentState === "escrow_held"
                  ? " — pul mijoz tasdiqlaguncha platformada"
                  : ""}
              </p>

              {showTrackForm ? (
                <div className="mt-3 space-y-2 rounded-2xl border border-[#e8ecf3] bg-white p-3">
                  <p className="text-[12px] font-semibold text-[#1a1d26]">
                    Kuryer va Yandex kuzatuv
                  </p>
                  <Input
                    value={d.url}
                    onChange={(e) => setDraft(order.id, { url: e.target.value })}
                    placeholder="https://go.yandex / taxi.yandex.ru link"
                    className="h-9 !rounded-xl border-[#e2e8f0] text-[13px]"
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Input
                      value={d.name}
                      onChange={(e) => setDraft(order.id, { name: e.target.value })}
                      placeholder="Kuryer ismi"
                      className="h-9 !rounded-xl border-[#e2e8f0] text-[13px]"
                    />
                    <Input
                      value={d.phone}
                      onChange={(e) => setDraft(order.id, { phone: e.target.value })}
                      placeholder="+998 …"
                      className="h-9 !rounded-xl border-[#e2e8f0] text-[13px]"
                    />
                    <Input
                      value={d.car}
                      onChange={(e) => setDraft(order.id, { car: e.target.value })}
                      placeholder="Mashina · raqam"
                      className="h-9 !rounded-xl border-[#e2e8f0] text-[13px]"
                    />
                  </div>
                  <Input
                    value={d.loc}
                    onChange={(e) => setDraft(order.id, { loc: e.target.value })}
                    placeholder="Kuryer joylashuvi: xarita linki yoki 41.31, 69.27"
                    className="h-9 !rounded-xl border-[#e2e8f0] text-[13px]"
                  />
                  {isShipAction ? (
                    <Button
                      type="button"
                      className="h-10 w-full !rounded-xl text-[13.5px] font-semibold sm:w-auto sm:min-w-[200px]"
                      disabled={busyId === order.id}
                      onClick={() => onSaveTrack(order, true)}
                    >
                      {busyId === order.id ? "Jo‘natilmoqda..." : "Jo‘natildi · Yo‘lda"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-full !rounded-xl border-[#e2e8f0] text-[13px] font-semibold sm:w-auto"
                      disabled={busyId === order.id}
                      onClick={() => onSaveTrack(order, false)}
                    >
                      {busyId === order.id ? "Saqlanmoqda..." : "Kuzatuvni yangilash"}
                    </Button>
                  )}
                </div>
              ) : null}

              {action && !isShipAction ? (
                <Button
                  type="button"
                  className="mt-3 h-10 w-full !rounded-xl text-[13.5px] font-semibold sm:w-auto sm:min-w-[180px]"
                  disabled={busyId === order.id}
                  onClick={() => onAdvance(order.id)}
                >
                  {busyId === order.id ? "Yangilanmoqda..." : action}
                </Button>
              ) : null}
              {!action && order.status === "yetkazildi" ? (
                <p className="mt-3 text-[12.5px] font-medium text-emerald-700">
                  Yetkazildi — mijoz tasdig‘i kutilmoqda
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ProfilePanel({ shop }: { shop: Shop }) {
  return (
    <section className="rounded-[14px] border border-[#eceff5] bg-white p-3 sm:rounded-[16px] sm:p-5">
      <h2 className="text-[15px] font-semibold text-[#1a1d26] sm:text-[16px]">Do‘kon profili</h2>
      <p className="mt-0.5 text-[13px] text-[#8b93a7]">Ommaviy sahifada ko‘rinadigan ma’lumotlar</p>
      <div className="mt-4">
        <ProfileForm shop={shop} onDone={() => undefined} embedded />
      </div>
    </section>
  );
}

function ProfileForm({
  shop,
  onDone,
  embedded,
}: {
  shop: Shop;
  onDone: () => void;
  embedded?: boolean;
}) {
  const { updateShop } = useSellerWork();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: shop.name,
    city: shop.city,
    bio: shop.bio,
    phone: shop.phone,
    telegram: shop.telegram ?? "",
    instagram: shop.instagram ?? "",
    facebook: shop.facebook ?? "",
    website: shop.website ?? "",
    address: shop.address ?? "",
    yearsInBusiness: shop.yearsInBusiness != null ? String(shop.yearsInBusiness) : "",
    logo: shop.logo ?? "",
  });
  const [logoUploading, setLogoUploading] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const years = form.yearsInBusiness.trim()
      ? Number(form.yearsInBusiness.replace(/\D/g, ""))
      : undefined;
    updateShop({
      name: form.name,
      city: form.city,
      bio: form.bio,
      phone: form.phone,
      telegram: form.telegram,
      instagram: form.instagram,
      facebook: form.facebook,
      website: form.website,
      address: form.address,
      yearsInBusiness: years != null && Number.isFinite(years) ? years : undefined,
      logo: form.logo,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
    if (!embedded) onDone();
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <Field label="Do‘kon nomi">
        <Input className="mt-1 h-9 sm:h-10" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      <Field label="Shahar">
        <select
          className="mt-1 h-9 w-full rounded-lg border border-input px-2.5 text-sm sm:h-10"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        >
          {shopCities.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <Field label="Bio">
        <Textarea className="mt-1" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Telefon">
          <Input className="mt-1 h-9 sm:h-10" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Telegram">
          <Input
            className="mt-1 h-9 sm:h-10"
            value={form.telegram}
            onChange={(e) => setForm({ ...form, telegram: e.target.value })}
            placeholder="@do‘kon"
          />
        </Field>
        <Field label="Instagram">
          <Input
            className="mt-1 h-9 sm:h-10"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            placeholder="@do‘kon"
          />
        </Field>
        <Field label="Facebook (ixtiyoriy)">
          <Input
            className="mt-1 h-9 sm:h-10"
            value={form.facebook}
            onChange={(e) => setForm({ ...form, facebook: e.target.value })}
          />
        </Field>
        <Field label="Veb-sayt (ixtiyoriy)">
          <Input
            className="mt-1 h-9 sm:h-10"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </Field>
        <Field label="Manzil (ixtiyoriy)">
          <Input
            className="mt-1 h-9 sm:h-10"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <Field label="Tajriba (yil)">
          <Input
            className="mt-1 h-9 sm:h-10"
            value={form.yearsInBusiness}
            onChange={(e) => setForm({ ...form, yearsInBusiness: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Logo (ixtiyoriy)">
        <div className="mt-1 flex gap-2">
          <Input
            className="h-9 min-w-0 flex-1 sm:h-10"
            value={form.logo}
            placeholder="https://… yoki rasm yuklang"
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
          />
          <label className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-lg border border-[#d7e4ff] px-3 text-[12.5px] font-medium text-[#0066FF] hover:bg-[#f5f9ff] sm:h-10">
            {logoUploading ? "Yuklanmoqda…" : "Yuklash"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={logoUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setLogoUploading(true);
                try {
                  const prepared = await prepareImage(file, 512, 0.85);
                  const url = await uploadImage(prepared.blob, "logo");
                  URL.revokeObjectURL(prepared.previewUrl);
                  setForm((prev) => ({ ...prev, logo: url }));
                } catch {
                  /* keep previous logo */
                } finally {
                  setLogoUploading(false);
                }
              }}
            />
          </label>
        </div>
      </Field>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {saved ? <span className="mr-auto text-[13px] font-medium text-[#16a34a]">Saqlandi</span> : null}
        {!embedded ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Bekor
          </Button>
        ) : null}
        <Button type="submit" className="h-10 !rounded-xl">
          Saqlash
        </Button>
      </div>
    </form>
  );
}

function CardPanel() {
  const { card, linkCard, unlinkCard } = useSellerWork();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ holder: site.doctor.name as string, number: "", expiry: "", bank: "" });

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = linkCard(form);
    if (!result.ok) {
      setError(cardErrors[result.reason]);
      return;
    }
    setForm({ holder: form.holder, number: "", expiry: "", bank: form.bank });
    setOpen(false);
  }

  return (
    <section className="rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[16px] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#1a1d26] sm:text-[16px]">
            <CreditCard className="size-4 text-[#0066FF]" />
            Karta / to‘lov
          </h2>
          <p className="mt-1 text-[13px] font-medium text-[#1a1d26]">{cardStatusLabel(card)}</p>
          {card ? (
            <p className="mt-0.5 text-[12.5px] text-[#8b93a7]">
              {cardBrandLabel[card.brand]} · {card.holder}
              {card.bank ? ` · ${card.bank}` : ""} · {card.expiryMasked}
            </p>
          ) : (
            <p className="mt-0.5 text-[12.5px] text-[#8b93a7]">Hisob-kitob kartasi hali ulanmagan.</p>
          )}
        </div>
        {card ? (
          <Button type="button" variant="outline" className="h-9 !rounded-xl" onClick={unlinkCard}>
            Uzish
          </Button>
        ) : (
          <Button type="button" className="h-9 !rounded-xl" disabled>
            Tez orada
          </Button>
        )}
      </div>
      <p className="mt-3 rounded-xl bg-[#eaf2ff] px-3 py-2 text-[12.5px] leading-relaxed text-[#3b82f6]">
        Hozircha faqat Naqd pul ishlaydi. Karta, Click, Payme va Uzum ulanmagan.
      </p>
      {open && !card ? (
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
          <Field label="Karta egasi">
            <Input className="mt-1 h-9 sm:h-10" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} />
          </Field>
          <Field label="Bank (ixtiyoriy)">
            <Input
              className="mt-1 h-9 sm:h-10"
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
              placeholder="Kapitalbank"
            />
          </Field>
          <Field label="Karta raqami">
            <Input
              className="mt-1 h-9 tracking-wide sm:h-10"
              inputMode="numeric"
              autoComplete="off"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: maskCardNumber(e.target.value) })}
              placeholder="4242 4242 4242 4242"
            />
          </Field>
          <Field label="Amal qilish (MM/YY)">
            <Input
              className="mt-1 h-9 sm:h-10"
              inputMode="numeric"
              value={form.expiry}
              onChange={(e) => setForm({ ...form, expiry: maskExpiry(e.target.value) })}
              placeholder="12/28"
            />
          </Field>
          {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" className="h-10 !rounded-xl">
              Ulash
            </Button>
            <Button type="button" variant="outline" className="h-10 !rounded-xl" onClick={() => setOpen(false)}>
              Bekor
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

export { ShopAvatar, VerifiedBadge } from "@/components/seller-ui";

function StatCard({
  icon,
  label,
  value,
  hint,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  onClick?: () => void;
}) {
  const className =
    "rounded-[12px] border border-[#eceff5] bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[16px] sm:p-4";
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#8b93a7] sm:gap-2 sm:text-[12px]">
        <span className="text-[#0066FF]">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-[18px] font-bold tracking-tight text-[#1a1d26] sm:mt-2 sm:text-[22px]">{value}</p>
      <p className="text-[11px] text-[#8b93a7] sm:text-[12px]">{hint}</p>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(className, "transition hover:border-[#d7e4ff]")}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function maskCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function maskExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
