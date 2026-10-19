"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Headset,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Thermometer,
  Truck,
  Wind,
} from "lucide-react";
import { cartLineKey, useCart } from "@/components/cart-provider";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopToggleFav, som, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { formaAdvantages, formaReviews, getDesktopForma, similarForma, type DesktopForma } from "@/data/desktop-forma";
import { Modal, ShirtSketch, SizeTable } from "./FormaCatalog";
import "./forma.css";

const tabs = [
  { id: "about", label: "Tavsif" },
  { id: "specs", label: "Xususiyatlar" },
  { id: "size", label: "O‘lcham jadvali" },
  { id: "reviews", label: "Sharhlar" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const fabricNotes = [
  { Icon: ShieldCheck, text: "Antibakterial ishlov" },
  { Icon: Wind, text: "Nafas oluvchi" },
  { Icon: Thermometer, text: "60°C gacha yuvish mumkin" },
  { Icon: Sparkles, text: "Oson dazmollanadi" },
];

const delivery = [
  { place: "Toshkent shahri", days: "1 kun", fast: true },
  { place: "Toshkent viloyati", days: "2–3 kun" },
  { place: "Boshqa viloyatlar", days: "2–3 kun" },
];

const matLabel: Record<DesktopForma["material"], string> = {
  paxta: "Paxta - poliester",
  stretch: "Stretch (cho‘ziluvchan)",
  premium: "Premium mato",
  anti: "Antibakterial",
};

const catLabel: Record<DesktopForma["cat"], string> = {
  scrub: "Skrab to‘plam",
  xalat: "Tibbiy xalat",
  qalpoq: "Tibbiy qalpoq",
  poyabzal: "Tibbiy poyabzal",
  fartuk: "Fartuk",
  aksessuar: "Aksessuar",
};

export function FormaProduct({ slug }: { slug: string }) {
  const product = getDesktopForma(slug);
  if (!product) return null;
  return <View key={product.slug} product={product} />;
}

function View({ product }: { product: DesktopForma }) {
  const router = useRouter();
  const cart = useCart();
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const gallery = product.gallery.length ? product.gallery : [product.image];
  const [photo, setPhoto] = useState(0);
  const [color, setColor] = useState(product.colors[0]?.id ?? "");
  const [size, setSize] = useState(product.sizes.includes("M") ? "M" : product.sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<TabId>("about");
  const [note, setNote] = useState("");
  const [modal, setModal] = useState<"" | "delivery" | "ask" | "guide">("");
  const swatch = product.colors.find((item) => item.id === color) ?? product.colors[0];
  const fav = favs.includes(product.slug);
  const similar = similarForma(product.slug);
  const isCloth = product.sizes.some((item) => /^[XSML]/.test(item));
  const sellerName = product.brand.toUpperCase();

  function line() {
    const variant = [swatch?.label, size ? `O‘lcham: ${size}` : ""].filter(Boolean).join(" · ");
    return {
      id: `forma-${product.slug}-${swatch?.id ?? "one"}-${size || "os"}`,
      name: product.name,
      variant: variant || undefined,
      price: product.price,
      image: product.image,
      href: `/forma/${product.slug}`,
      seller: sellerName,
    };
  }

  function add() {
    shopAdd(line(), qty);
    setNote(`Savatga qo‘shildi · ${qty} dona`);
  }

  function buyNow() {
    const next = line();
    shopAdd(next, qty);
    cart.selectOnly(cartLineKey(next.id));
    router.push("/checkout");
  }

  return (
    <ShopShell searchPath="/forma" cartCount={cartCount} placeholder="Mahsulot, brend yoki kategoriya qidiring..." showCamera={false}>
      <div className="fxp" data-testid="forma-product">
        <nav className="fxp-crumbs" aria-label="Breadcrumb">
          <Link href="/marketplace">Do‘kon</Link><ChevronRight className="i" />
          <Link href="/forma">Forma</Link><ChevronRight className="i" />
          <b>{product.name}</b>
        </nav>

        <div className="fxp-gal">
          <div className="fxp-thumbs">
            {gallery.slice(0, 5).map((src, index) => (
              <button key={src + index} type="button" className={photo === index ? "on" : ""} aria-label={`Rasm ${index + 1}`} aria-pressed={photo === index} onClick={() => setPhoto(index)}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>
          <div className="fxp-stage"><img src={gallery[photo] ?? product.image} alt={product.name} /></div>
        </div>

        <section className="fxp-buy">
          <h1>{product.name}</h1>
          <div className="fxp-rate">
            <Star className="i star" /> <b>{product.rating.toFixed(1)}</b> <span>({product.reviews} sharh)</span>
            {product.sold ? <><i className="sep" /> <span>{product.sold} ta sotilgan</span></> : null}
          </div>
          <div className="fxp-price">
            <strong>{som(product.price)}</strong>
            {product.oldPrice ? <s>{som(product.oldPrice)}</s> : null}
            {product.off ? <em>−{product.off}%</em> : null}
          </div>

          {swatch ? (
            <div className="fxp-opt">
              <p>Rang: <span>{swatch.label}</span></p>
              <div className="fxp-colors" role="radiogroup" aria-label="Rang">
                {product.colors.map((item) => (
                  <button key={item.id} type="button" role="radio" aria-checked={color === item.id} aria-label={item.label} title={item.label} className={color === item.id ? "on" : ""} onClick={() => setColor(item.id)}>
                    <i style={{ background: item.hex }} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {product.sizes.length ? (
            <div className="fxp-opt">
              <p>O‘lcham: <span>{size}</span></p>
              <div className="fxp-sizes">
                <div role="radiogroup" aria-label="O‘lcham">
                  {product.sizes.map((item) => (
                    <button key={item} type="button" role="radio" aria-checked={size === item} className={size === item ? "on" : ""} onClick={() => setSize(item)}>{item}</button>
                  ))}
                </div>
                {isCloth ? <button type="button" className="fxp-link" onClick={() => setTab("size")}>O‘lchamlar jadvali</button> : null}
              </div>
            </div>
          ) : null}

          <div className="fxp-cta">
            <div className="fxp-qty">
              <button type="button" aria-label="Kamaytirish" disabled={qty <= 1} onClick={() => setQty((value) => Math.max(1, value - 1))}><Minus className="i" /></button>
              <b aria-live="polite">{qty}</b>
              <button type="button" aria-label="Oshirish" disabled={qty >= 99} onClick={() => setQty((value) => Math.min(99, value + 1))}><Plus className="i" /></button>
            </div>
            <button type="button" className="fxp-add" data-testid="forma-add" onClick={add}><ShoppingCart className="i" /> Savatga qo‘shish</button>
            <button type="button" className={fav ? "fxp-wish on" : "fxp-wish"} aria-pressed={fav} aria-label={fav ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"} onClick={() => shopToggleFav(product.slug)}><Heart className="i" /></button>
          </div>
          <button type="button" className="fxp-now" onClick={buyNow}>Hozir sotib olish</button>

          <ul className="fxp-guar">
            <li><span className="ic"><ShieldCheck className="i" /></span><span><b>Sifat kafolati</b><small>30 kun ichida qaytarish</small></span></li>
            <li><span className="ic"><Truck className="i" /></span><span><b>Tez yetkazib berish</b><small>Toshkent 1 kun<br />Viloyatlar 2–3 kun</small></span></li>
            <li><span className="ic"><CreditCard className="i" /></span><span><b>Xavfsiz to‘lov</b><small>Click, Payme, Uzcard</small></span></li>
          </ul>
        </section>

        <aside className="fxp-rail">
          <section className="fx-box fxp-seller">
            <h3>Sotuvchi</h3>
            <div className="who">
              <span className="logo">{sellerName}</span>
              <span className="txt">
                <b>{sellerName} <BadgeCheck className="i badge" aria-label="Tasdiqlangan sotuvchi" /></b>
                <small>Tibbiy forma va aksessuarlar</small>
                <small className="r"><Star className="i star" /> <b>4.9</b> (320 sharh)</small>
                <small>2 500+ mahsulot</small>
              </span>
            </div>
            <Link href={`/forma?brand=${product.brandKey}`} className="fx-ghost wide">Barcha mahsulotlar <ArrowRight className="i" /></Link>
          </section>

          <section className="fx-box fxp-delivery">
            <h3><Truck className="i ic" /> Yetkazib berish</h3>
            {delivery.map((row) => (
              <div className="fxp-drow" key={row.place}>
                <Truck className="i" />
                <span>{row.place}</span>
                <em className={row.fast ? "fast" : undefined}>{row.days}</em>
              </div>
            ))}
            <button type="button" className="fxp-link" onClick={() => setModal("delivery")}>Yetkazib berish haqida batafsil <ArrowRight className="i" /></button>
          </section>

          <section className="fx-box fxp-ask">
            <div className="hd">
              <span className="ic"><Headset className="i" /></span>
              <span><b>Savollaringiz bormi?</b><small>Mahsulot haqida mutaxassisdan maslahat oling.</small></span>
            </div>
            <button type="button" className="fx-ghost wide" onClick={() => setModal("ask")}>Savol berish</button>
          </section>
        </aside>

        <div className="fxp-tabs" role="tablist" aria-label="Mahsulot ma’lumotlari">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "on" : ""} onClick={() => setTab(item.id)}>
              {item.id === "reviews" ? `Sharhlar (${product.reviews})` : item.label}
            </button>
          ))}
        </div>

        <section className="fxp-info">
          {tab === "about" ? (
            <div className="fxp-three">
              <div className="col">
                <h3>Mahsulot tavsifi</h3>
                <p className="fxp-text">
                  {product.slug === "premium-stretch"
                    ? "Stomatologlar uchun zamonaviy va qulay Premium Stretch forma. Elastik mato harakat erkinligini ta’minlaydi, uzoq ish kunida ham qulaylik beradi. Klinika va shifoxonalarda foydalanish uchun ideal tanlov."
                    : `${product.name} — ${product.blurb.toLowerCase()}. ${matLabel[product.material]}, klinikada kundalik foydalanish uchun.`}
                </p>
                <h4>Afzalliklari</h4>
                <ul className="fxp-pros">
                  {formaAdvantages.map((text) => <li key={text}><CheckCircle2 className="i" /> {text}</li>)}
                </ul>
              </div>
              <div className="col">
                <h3>Mato tarkibi</h3>
                <div className="fxp-fabric">
                  <img src="/img/forma/d-fabric.jpg" alt="Mato namunasi" />
                  <div>
                    <ul className="mix">
                      <li><b>72%</b> Polyester</li>
                      <li><b>21%</b> Viskoza</li>
                      <li><b>7%</b> Spandeks</li>
                    </ul>
                    <ul className="notes">
                      {fabricNotes.map(({ Icon, text }) => <li key={text}><Icon className="i" /> {text}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="fxp-col-hd">
                  <h3>O‘lchamlar jadvali (sm)</h3>
                  <button type="button" className="fxp-link" onClick={() => setModal("guide")}>Qo‘llash bo‘yicha qo‘llanma <ArrowRight className="i" /></button>
                </div>
                <div className="fxp-size">
                  <SizeTable active={size} />
                  <ShirtSketch className="fx-shirt big" labels />
                </div>
              </div>
            </div>
          ) : null}
          {tab === "specs" ? (
            <table className="fxp-specs">
              <tbody>
                <tr><td>Brend</td><td>{sellerName}</td></tr>
                <tr><td>Turi</td><td>{catLabel[product.cat]}</td></tr>
                <tr><td>Jins</td><td>{product.gender === "erkak" ? "Erkaklar" : product.gender === "ayol" ? "Ayollar" : "Uniseks"}</td></tr>
                <tr><td>Mato</td><td>{matLabel[product.material]}</td></tr>
                <tr><td>Ranglar</td><td>{product.colors.map((item) => item.label).join(", ") || "—"}</td></tr>
                <tr><td>O‘lchamlar</td><td>{product.sizes.join(", ") || "Yagona o‘lcham"}</td></tr>
                <tr><td>Parvarish</td><td>60°C gacha yuvish, o‘rtacha haroratda dazmollash</td></tr>
              </tbody>
            </table>
          ) : null}
          {tab === "size" ? (
            <div className="fxp-size wide">
              <SizeTable active={size} />
              <ShirtSketch className="fx-shirt big" labels />
              <p className="fx-muted">A — ko‘krak aylanasi, B — bel aylanasi, C — bo‘y. Ikki o‘lcham orasida bo‘lsangiz, kattasini tanlang.</p>
            </div>
          ) : null}
          {tab === "reviews" ? (
            <div className="fxp-reviews">
              {formaReviews.map((review) => (
                <div className="fxp-review" key={review.name}>
                  <b>{review.name}</b>
                  <span className="stars" aria-label={`${review.stars} yulduz`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={i < review.stars ? "i on" : "i"} />)}</span>
                  <p>{review.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {similar.length ? (
          <section className="fxp-similar">
            <h2>O‘xshash mahsulotlar</h2>
            <div className="fxp-sim-row">
              {similar.map((item) => {
                const liked = favs.includes(item.slug);
                return (
                  <article className="fxp-sim" key={item.slug}>
                    <Link href={`/forma/${item.slug}`} className="ph" aria-label={item.name}><img src={item.image} alt="" /></Link>
                    <button type="button" className={liked ? "fx-heart sm on" : "fx-heart sm"} aria-pressed={liked} aria-label={liked ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"} onClick={() => shopToggleFav(item.slug)}><Heart className="i" /></button>
                    <div className="txt">
                      <b>{item.brand.toUpperCase()}</b>
                      <Link href={`/forma/${item.slug}`}>{item.name}</Link>
                      <strong>{som(item.price)}</strong>
                      <small><Star className="i star" /> {item.rating.toFixed(1)} <em>({item.reviews})</em></small>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {modal === "delivery" ? (
          <Modal title="Yetkazib berish" onClose={() => setModal("")}>
            {delivery.map((row) => (
              <div className="fxp-drow big" key={row.place}><Truck className="i" /><span>{row.place}</span><em className={row.fast ? "fast" : undefined}>{row.days}</em></div>
            ))}
            <p className="fx-muted">Kuryer yetkazishdan oldin qo‘ng‘iroq qiladi. Yetkazish narxi buyurtmani rasmiylashtirishda ko‘rsatiladi.</p>
          </Modal>
        ) : null}
        {modal === "guide" ? (
          <Modal title="O‘lchamni qanday olish kerak" onClose={() => setModal("")}>
            <ol className="fxp-guide">
              <li><b>A — ko‘krak:</b> santimetr lentani ko‘krakning eng keng qismidan, qo‘ltiq ostidan aylantiring.</li>
              <li><b>B — bel:</b> belning eng ingichka qismidan, lentani tortmasdan o‘lchang.</li>
              <li><b>C — bo‘y:</b> devorga suyanib, tovondan boshgacha o‘lchang.</li>
              <li>Ikki o‘lcham orasida bo‘lsangiz — kattasini tanlang.</li>
            </ol>
          </Modal>
        ) : null}
        {modal === "ask" ? <AskModal product={product} onClose={() => setModal("")} onSent={setNote} /> : null}

        {note ? <p className="fx-toast" role="status" onAnimationEnd={() => setNote("")}>{note}</p> : null}
      </div>
    </ShopShell>
  );
}

/** There is no Q&A backend for forma yet, so the form validates and says plainly that it is not sent. */
function AskModal({ product, onClose, onSent }: { product: DesktopForma; onClose: () => void; onSent: (text: string) => void }) {
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal title="Savol berish" onClose={onClose}>
      <form
        className="fx-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (text.trim().length < 5 || phone.replace(/\D/g, "").length < 9) {
            setError("Savolingizni va telefon raqamingizni to‘liq yozing.");
            return;
          }
          onSent("Namuna rejimi: savollar hali mutaxassisga yuborilmaydi — bu funksiya tez orada ishga tushadi.");
          onClose();
        }}
      >
        <p className="fx-muted">{product.name}</p>
        <label className="fx-field">Savolingiz<textarea rows={3} value={text} onChange={(event) => setText(event.target.value)} placeholder="Masalan: M o‘lcham 168 sm bo‘yga mos keladimi?" /></label>
        <label className="fx-field">Telefon<input value={phone} inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="+998 90 123 45 67" /></label>
        {error ? <p className="fx-err">{error}</p> : null}
        <p className="fx-hint">Hozircha namuna rejimi: savol mutaxassisga yuborilmaydi.</p>
        <div className="fx-acts">
          <button type="button" className="fx-ghost" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="fx-add"><Check className="i" /> Yuborish</button>
        </div>
      </form>
    </Modal>
  );
}
