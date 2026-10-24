"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Check, Store, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/lib/use-is-client";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { catalogShop, isShopApproved, placeholderProductImage, type LinkedCard, type Shop } from "@/data/shops";
import type { Product } from "@/data/products";
import {
  catalogHrefForCategory,
  catalogLabelForCategory,
  countProductsBySection,
  loadCards,
  mergeMarketplaceCatalog,
  mergeShops,
  normalizePhone,
  productFromInput,
  saveCards,
  setDbCatalog,
  uniqueSlug,
  validateCard,
  type SellerApplicationInput,
  type SellerDoc,
  type SellerProductInput,
} from "@/lib/seller-work";
import { orderBelongsToShop } from "@/lib/order-money";
import { loadSellerOrders, syncOrders, type Order } from "@/lib/orders";

type AuthResult = { ok: true; shop: Shop } | { ok: false; reason: "invalid" | "auth" };
type ProductResult = { ok: true; product: Product } | { ok: false; reason: "invalid" | "session" };
type CardResult =
  | { ok: true; card: LinkedCard }
  | { ok: false; reason: "holder" | "expiry" | "number" | "brand" | "luhn" | "session" };

type ShopPatch = Partial<
  Pick<Shop, "name" | "city" | "bio" | "phone" | "telegram" | "instagram" | "facebook" | "website" | "address" | "yearsInBusiness" | "logo">
>;

type Ctx = {
  ready: boolean;
  /** The signed-in user's own store (any status), loaded from the DB. */
  session: Shop | null;
  application: { id: string; status: string; stir: string | null; docs: SellerDoc[] | null; createdAt: string } | null;
  shops: Shop[];
  catalog: Product[];
  myProducts: Product[];
  card: LinkedCard | null;
  stats: {
    products: number;
    active: number;
    orders: number;
    views: number;
    bySection: { marketplace: number; forma: number; jihozlar: number };
  };
  shopOrders: Order[];
  getShopBySlug: (slug: string) => Shop | undefined;
  getListedProduct: (id: string) => Product | undefined;
  productsForShop: (shopId: string, includeInactive?: boolean) => Product[];
  register: (input: SellerApplicationInput) => AuthResult;
  logout: () => void;
  updateShop: (patch: ShopPatch) => void;
  updateApplication: (input: SellerApplicationInput) => AuthResult;
  reapply: (input: SellerApplicationInput) => AuthResult;
  addProduct: (input: SellerProductInput) => ProductResult;
  updateProduct: (id: string, input: SellerProductInput) => ProductResult;
  deactivate: (id: string) => void;
  activate: (id: string) => void;
  removeProduct: (id: string) => void;
  linkCard: (input: { number: string; expiry: string; holder: string; bank?: string }) => CardResult;
  unlinkCard: () => void;
  bumpViews: (shopId: string) => void;
  reload: () => Promise<void>;
};

const SellerCtx = createContext<Ctx | null>(null);

type Mine = { shop: Shop | null; application: Ctx["application"]; products: Product[] };
type Toast = { text: string; href?: string; hrefLabel?: string; tone?: "ok" | "err" };

async function api<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = (await res.json().catch(() => null)) as ({ ok?: boolean; error?: string } & T) | null;
    if (!res.ok || !j?.ok) return { ok: false, error: j?.error ?? "Saqlab bo‘lmadi. Qayta urinib ko‘ring." };
    return { ok: true, data: j };
  } catch {
    return { ok: false, error: "Tarmoq xatosi. Qayta urinib ko‘ring." };
  }
}

function applicationPayload(input: SellerApplicationInput) {
  return {
    ownerName: input.ownerName,
    phone: input.phone,
    shopName: input.shopName,
    city: input.city,
    bio: input.bio,
    telegram: input.telegram ?? "",
    instagram: input.instagram ?? "",
    facebook: input.facebook ?? "",
    website: input.website ?? "",
    address: input.address ?? "",
    yearsInBusiness: input.yearsInBusiness ?? "",
    stir: input.stir ?? "",
    docs: input.docs ?? [],
  };
}

function validApplication(input: SellerApplicationInput) {
  return (
    Boolean(input.ownerName.trim() && input.shopName.trim()) &&
    normalizePhone(input.phone).length >= 9 &&
    input.bio.trim().length >= 20 &&
    Boolean(input.telegram?.trim() || input.instagram?.trim())
  );
}

export function SellerWorkProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const { ready: profileReady, profile } = useDoctorProfile();
  const router = useRouter();
  const [publicShops, setPublicShops] = useState<Shop[]>([]);
  const [publicProducts, setPublicProducts] = useState<Product[]>([]);
  const [mine, setMine] = useState<Mine>({ shop: null, application: null, products: [] });
  const [cards, setCards] = useState<LinkedCard[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [mineReady, setMineReady] = useState(false);
  const [ordersTick, setOrdersTick] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [cardsLoaded, setCardsLoaded] = useState(false);

  if (isClient && !cardsLoaded) {
    setCards(loadCards());
    setCardsLoaded(true);
  }

  const loadCatalog = useCallback(async () => {
    const res = await api<{ shops: Shop[]; products: Product[] }>("/api/catalog", "GET");
    if (res.ok) {
      setPublicShops(res.data.shops ?? []);
      // seller products saved without a photo must never crash the catalog (image is required by the UI)
      const products = (res.data.products ?? []).map((p) => (p.image ? p : { ...p, image: placeholderProductImage(p.category) }));
      setPublicProducts(products);
      setDbCatalog(products);
    }
    setCatalogReady(true);
  }, []);

  const loadMine = useCallback(async () => {
    const res = await api<Mine>("/api/seller/store", "GET");
    if (res.ok) setMine({ shop: res.data.shop ?? null, application: res.data.application ?? null, products: res.data.products ?? [] });
    setMineReady(true);
  }, []);

  const reload = useCallback(async () => {
    await Promise.all([loadCatalog(), loadMine(), syncOrders(true)]);
  }, [loadCatalog, loadMine]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a server-backed external cache
    void loadCatalog();
  }, [loadCatalog]);

  // Reload "my store" + orders whenever the signed-in account changes.
  const profileId = profile?.id ?? null;
  useEffect(() => {
    if (!profileReady) return;
    if (!profileId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a server-backed external cache
      setMine({ shop: null, application: null, products: [] });
      setMineReady(true);
    } else {
      void loadMine();
    }
    void syncOrders(true);
  }, [loadMine, profileId, profileReady]);

  useEffect(() => {
    const onOrders = () => setOrdersTick((n) => n + 1);
    window.addEventListener("sk-orders-changed", onOrders);
    return () => window.removeEventListener("sk-orders-changed", onOrders);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const fail = useCallback(
    (error: string) => {
      setToast({ text: error, tone: "err" });
      void loadMine();
    },
    [loadMine],
  );

  const persistCards = useCallback((next: LinkedCard[]) => {
    setCards(next);
    saveCards(next);
  }, []);

  const session = mine.shop;
  const allShops = useMemo(() => {
    const list = session ? [session, ...publicShops.filter((s) => s.id !== session.id)] : publicShops;
    return mergeShops(list);
  }, [publicShops, session]);

  const listed = useMemo(() => {
    const own = new Set(mine.products.map((p) => p.id));
    return [...mine.products, ...publicProducts.filter((p) => !own.has(p.id))];
  }, [mine.products, publicProducts]);

  const catalog = useMemo(() => mergeMarketplaceCatalog(listed, allShops), [listed, allShops]);
  const myProducts = mine.products;
  const card = useMemo(() => cards.find((item) => item.shopId === session?.id) ?? null, [cards, session?.id]);

  const shopOrders = useMemo(() => {
    void ordersTick;
    return session ? loadSellerOrders().filter((order) => orderBelongsToShop(order, session.id)) : [];
  }, [ordersTick, session]);

  const stats = useMemo(() => {
    if (!session) {
      return { products: 0, active: 0, orders: 0, views: 0, bySection: { marketplace: 0, forma: 0, jihozlar: 0 } };
    }
    return {
      products: myProducts.length,
      active: myProducts.filter((item) => item.active !== false).length,
      orders: shopOrders.length,
      views: session.views,
      bySection: countProductsBySection(myProducts),
    };
  }, [myProducts, session, shopOrders.length]);

  const getShopBySlug = useCallback((slug: string) => allShops.find((item) => item.slug === slug), [allShops]);
  const getListedProduct = useCallback((id: string) => listed.find((item) => item.id === id), [listed]);

  const productsForShop = useCallback(
    (shopId: string, includeInactive = false) => {
      if (shopId === catalogShop.id) {
        return catalog.filter((item) => item.shopId === catalogShop.id && !item.listedBySeller);
      }
      return listed.filter((item) => item.shopId === shopId && (includeInactive || item.active !== false));
    },
    [catalog, listed],
  );

  const optimisticShop = useCallback(
    (input: SellerApplicationInput, existing?: Shop | null): Shop => {
      const now = new Date().toISOString();
      return {
        ...(existing ?? {}),
        id: existing?.id ?? "pending-local",
        slug: existing?.slug ?? uniqueSlug(input.shopName, allShops, existing?.id),
        name: input.shopName.trim(),
        city: input.city?.trim() || "Toshkent",
        bio: input.bio.trim(),
        phone: input.phone.trim(),
        ownerName: input.ownerName.trim(),
        telegram: input.telegram?.trim() || undefined,
        instagram: input.instagram?.trim() || undefined,
        facebook: input.facebook?.trim() || undefined,
        website: input.website?.trim() || undefined,
        address: input.address?.trim() || undefined,
        yearsInBusiness: input.yearsInBusiness,
        verified: existing?.verified === "active" ? "active" : "pending",
        rejectReason: undefined,
        appliedAt: now,
        views: existing?.views ?? 0,
        createdAt: existing?.createdAt ?? now,
        demo: true,
      } as Shop;
    },
    [allShops],
  );

  const submitApplication = useCallback(
    (mode: "new" | "update" | "reapply", input: SellerApplicationInput): AuthResult => {
      if (!profile) {
        setToast({ text: "Ariza yuborish uchun avval tizimga kiring.", href: "/kirish?next=/marketplace/sotuvchi", hrefLabel: "Kirish", tone: "err" });
        return { ok: false, reason: "auth" };
      }
      if (!validApplication(input)) return { ok: false, reason: "invalid" };
      if (mode !== "new" && !session) return { ok: false, reason: "invalid" };
      if (mode === "new" && session && session.verified !== "rejected") {
        setToast({ text: session.verified === "active" ? "Do‘koningiz ochiq — kabinetga kirdingiz." : "Arizangiz ko‘rib chiqilmoqda." });
        return { ok: true, shop: session };
      }
      const shop = optimisticShop(input, session);
      if (mode === "update" && session?.verified === "rejected") {
        shop.verified = "rejected";
        shop.rejectReason = session.rejectReason;
      }
      setMine((m) => ({ ...m, shop }));
      const effectiveMode = mode === "new" && session?.verified === "rejected" ? "reapply" : mode;
      void api<{ shop: Shop }>("/api/seller/store", "POST", { mode: effectiveMode, payload: applicationPayload(input) }).then((res) => {
        if (!res.ok) return fail(res.error);
        setToast({
          text:
            effectiveMode === "update" ? "Ariza ma’lumotlari yangilandi." : effectiveMode === "reapply" ? "Ariza qayta yuborildi — tekshiruv kutilmoqda." : "Ariza yuborildi — tekshiruv kutilmoqda.",
        });
        void loadMine();
      });
      return { ok: true, shop };
    },
    [fail, loadMine, optimisticShop, profile, session],
  );

  const register = useCallback((input: SellerApplicationInput) => submitApplication("new", input), [submitApplication]);
  const updateApplication = useCallback(
    (input: SellerApplicationInput): AuthResult => {
      if (session?.verified === "active") return { ok: false, reason: "invalid" };
      return submitApplication("update", input);
    },
    [session?.verified, submitApplication],
  );
  const reapply = useCallback((input: SellerApplicationInput) => submitApplication("reapply", input), [submitApplication]);

  /** Seller "Chiqish" = sign out of the account (the store belongs to the account). */
  const logout = useCallback(() => {
    void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).finally(() => {
      window.location.href = "/kirish";
    });
  }, []);

  const updateShop = useCallback(
    (patch: ShopPatch) => {
      if (!session) return;
      setMine((m) => (m.shop ? { ...m, shop: { ...m.shop, ...patch, name: patch.name?.trim() || m.shop.name } } : m));
      void api("/api/seller/store", "PATCH", patch).then((res) => {
        if (!res.ok) return fail(res.error);
        setToast({ text: "Do‘kon profili yangilandi." });
        void loadMine();
        void loadCatalog();
      });
    },
    [fail, loadCatalog, loadMine, session],
  );

  const saveProduct = useCallback(
    (input: SellerProductInput, existing?: Product): ProductResult => {
      if (!session || !isShopApproved(session)) return { ok: false, reason: "session" };
      if (!input.name.trim() || !input.brand.trim() || !input.price) return { ok: false, reason: "invalid" };
      const draft = productFromInput(input, session, existing);
      const product: Product = { ...draft, id: existing?.id ?? crypto.randomUUID() };
      setMine((m) => ({
        ...m,
        products: existing ? m.products.map((p) => (p.id === product.id ? product : p)) : [product, ...m.products],
      }));
      void api<{ product: Product }>("/api/seller/products", "POST", {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        discount: product.discount ?? null,
        stockQty: product.stockQty ?? 0,
        delivery: product.delivery,
        description: product.description ?? "",
        image: product.image,
        images: product.images ?? [],
        attrs: product.attrs ?? {},
        oldPrice: product.oldPrice,
        active: product.active,
        sku: product.sku ?? "",
        subcategory: product.subcategory ?? "",
        kind: product.kind,
        gender: product.gender,
        sizes: product.sizes,
        colors: product.colors,
      }).then((res) => {
        if (!res.ok) return fail(res.error);
        void loadMine();
        void loadCatalog();
      });
      setToast(
        input.active === false
          ? { text: existing ? "Mahsulot saqlandi — katalogda ko‘rinmaydi." : "Qoralama saqlandi — katalogda ko‘rinmaydi. Mahsulotlar ro‘yxatidan yoqishingiz mumkin." }
          : existing
          ? { text: "Mahsulot yangilandi." }
          : { text: "Mahsulot katalogga qo‘shildi.", href: catalogHrefForCategory(input.category), hrefLabel: catalogLabelForCategory(input.category) },
      );
      return { ok: true, product };
    },
    [fail, loadCatalog, loadMine, session],
  );

  const addProduct = useCallback((input: SellerProductInput) => saveProduct(input), [saveProduct]);
  const updateProduct = useCallback(
    (id: string, input: SellerProductInput): ProductResult => {
      const existing = mine.products.find((item) => item.id === id);
      if (!existing) return { ok: false, reason: "invalid" };
      return saveProduct(input, existing);
    },
    [mine.products, saveProduct],
  );

  const productAction = useCallback(
    (id: string, action: "activate" | "deactivate" | "delete", text: string) => {
      setMine((m) => ({
        ...m,
        products:
          action === "delete"
            ? m.products.filter((p) => p.id !== id)
            : m.products.map((p) => (p.id === id ? { ...p, active: action === "activate", inStock: action === "activate" && (p.stockQty ?? 1) > 0 } : p)),
      }));
      setToast({ text });
      void api(`/api/seller/products/${id}`, "POST", { action }).then((res) => {
        if (!res.ok) return fail(res.error);
        void loadCatalog();
      });
    },
    [fail, loadCatalog],
  );
  const deactivate = useCallback((id: string) => productAction(id, "deactivate", "Mahsulot faolsizlantirildi."), [productAction]);
  const activate = useCallback((id: string) => productAction(id, "activate", "Mahsulot qayta ochildi."), [productAction]);
  const removeProduct = useCallback((id: string) => productAction(id, "delete", "Mahsulot o‘chirildi."), [productAction]);

  const linkCard = useCallback(
    (input: { number: string; expiry: string; holder: string; bank?: string }): CardResult => {
      if (!session) return { ok: false, reason: "session" };
      const parsed = validateCard(input);
      if (!parsed.ok) return parsed;
      const next: LinkedCard = {
        shopId: session.id,
        brand: parsed.brand,
        last4: parsed.last4,
        holder: parsed.holder,
        bank: parsed.bank,
        expiryMasked: parsed.expiryMasked,
        linkedAt: new Date().toISOString(),
      };
      persistCards([next, ...cards.filter((item) => item.shopId !== session.id)]);
      setToast({ text: "Karta saqlandi." });
      return { ok: true, card: next };
    },
    [cards, persistCards, session],
  );

  const unlinkCard = useCallback(() => {
    if (!session) return;
    persistCards(cards.filter((item) => item.shopId !== session.id));
    setToast({ text: "Karta uzildi." });
  }, [cards, persistCards, session]);

  const bumpViews = useCallback((shopId: string) => {
    if (shopId === catalogShop.id || !/^[0-9a-f-]{36}$/i.test(shopId)) return;
    try {
      const key = `sk-shop-viewed-${shopId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    void fetch(`/api/shops/${shopId}/view`, { method: "POST" }).catch(() => null);
  }, []);

  void router;
  const ready = catalogReady && mineReady;

  const value = useMemo<Ctx>(
    () => ({
      ready,
      session,
      application: mine.application,
      shops: allShops,
      catalog,
      myProducts,
      card,
      stats,
      shopOrders,
      getShopBySlug,
      getListedProduct,
      productsForShop,
      register,
      logout,
      updateShop,
      updateApplication,
      reapply,
      addProduct,
      updateProduct,
      deactivate,
      activate,
      removeProduct,
      linkCard,
      unlinkCard,
      bumpViews,
      reload,
    }),
    [
      activate, addProduct, allShops, bumpViews, card, catalog, deactivate, getListedProduct, getShopBySlug, linkCard, logout,
      mine.application, myProducts, productsForShop, ready, reapply, register, reload, removeProduct, session, shopOrders, stats,
      unlinkCard, updateApplication, updateProduct, updateShop,
    ],
  );

  return (
    <SellerCtx.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-[min(100%-2rem,380px)]">
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-[#F0FDFA] bg-white p-4 shadow-[0_12px_40px_rgba(17, 24, 39, 0.16)] lg:mx-0">
            <div className="flex items-start gap-3">
              <span className={toast.tone === "err" ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]" : "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ecfdf3] text-[#16a34a]"}>
                {toast.tone === "err" ? <X className="size-4" strokeWidth={2.5} /> : <Check className="size-4" strokeWidth={2.5} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1a1d26]">{toast.text}</p>
                {toast.href ? (
                  <Link
                    href={toast.href}
                    className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0F766E] hover:underline"
                  >
                    <Store className="size-3.5" />
                    {toast.hrefLabel}
                  </Link>
                ) : null}
              </div>
              <button type="button" onClick={() => setToast(null)} className="text-[#8b93a7] hover:text-[#1a1d26]" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SellerCtx.Provider>
  );
}

export function useSellerWork() {
  const ctx = useContext(SellerCtx);
  if (!ctx) throw new Error("useSellerWork must be used within SellerWorkProvider");
  return ctx;
}
