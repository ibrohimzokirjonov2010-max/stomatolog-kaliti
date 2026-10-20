"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, Check, ImageIcon, Star, X } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { bookCategories, type Book, type BookFormat, type BookLang } from "@/data/desktop-hub";
import { fetchBooks, toHubBook } from "@/lib/live-content";
import "./hub.css";

const sorts = [
  { id: "pop", label: "Eng ommabop" },
  { id: "rate", label: "Reyting" },
  { id: "cheap", label: "Arzon" },
  { id: "rich", label: "Qimmat" },
  { id: "new", label: "Yangi" },
];

export function KitoblarDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const paramQ = params.get("q") ?? "";
  const [q, setQ] = useState(paramQ);
  const [catalog, setCatalog] = useState<Book[]>([]);
  const [library, setLibrary] = useState<{ id: string; title: string; author: string; meta: string; image: string }[]>([]);
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState("Barchasi");
  const [formats, setFormats] = useState<BookFormat[]>([]);
  const [bothOnly, setBothOnly] = useState(false);
  const [langs, setLangs] = useState<BookLang[]>([]);
  const [year, setYear] = useState<[number, number]>([2020, 2026]);
  const [yearOn, setYearOn] = useState(false);
  const [price, setPrice] = useState<[number, number]>([0, 5_000_000]);
  const [priceOn, setPriceOn] = useState(false);
  const [stock, setStock] = useState<Array<"ombor" | "preorder">>([]);
  const [pubs, setPubs] = useState<string[]>([]);
  const [sort, setSort] = useState("pop");
  const [sortOpen, setSortOpen] = useState(false);
  const [sample, setSample] = useState<Book | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [asked, setAsked] = useState("");
  const [libOpen, setLibOpen] = useState(false);

  useEffect(() => {
    setQ(paramQ);
  }, [paramQ]);

  useEffect(() => {
    let stop = false;
    void fetchBooks().then((rows) => {
      if (stop) return;
      setCatalog(rows.map(toHubBook));
      setLibrary(rows.filter((item) => item.progress).map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        image: item.cover,
        meta: `${item.progress?.percent ?? 0}% o‘qilgan`,
      })));
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);

  const filtering = category !== "Barchasi" || formats.length > 0 || bothOnly || langs.length > 0 || yearOn || priceOn || stock.length > 0 || pubs.length > 0 || q.trim().length > 0;

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = catalog.filter((book) => {
      if (category !== "Barchasi" && book.category !== category && !(category === "Atlaslar" && book.category === "Atlaslar")) return false;
      if (bothOnly && !(book.formats.includes("bosma") && book.formats.includes("pdf"))) return false;
      if (!bothOnly && formats.length && !book.formats.some((item) => formats.includes(item))) return false;
      if (langs.length && !langs.includes(book.lang)) return false;
      if (yearOn && (book.year < year[0] || book.year > year[1])) return false;
      if (priceOn && (book.price < price[0] || book.price > price[1])) return false;
      if (stock.length && !stock.includes(book.stock)) return false;
      if (pubs.length && !pubs.includes(book.publisher)) return false;
      if (!query) return true;
      return `${book.title} ${book.authors}`.toLowerCase().includes(query);
    });
    list = [...list].sort((a, b) => {
      if (sort === "rate") return b.rating - a.rating;
      if (sort === "cheap") return a.price - b.price;
      if (sort === "rich") return b.price - a.price;
      if (sort === "new") return b.year - a.year;
      return b.popularity - a.popularity;
    });
    return list;
  }, [catalog, category, formats, bothOnly, langs, year, yearOn, price, priceOn, stock, pubs, q, sort]);

  function toggle<T>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function reset() {
    setCategory("Barchasi");
    setFormats([]);
    setBothOnly(false);
    setLangs([]);
    setYear([2020, 2026]);
    setYearOn(false);
    setPrice([0, 5_000_000]);
    setPriceOn(false);
    setStock([]);
    setPubs([]);
    setQ("");
  }

  const sortLabel = sorts.find((item) => item.id === sort)?.label ?? "Eng ommabop";
  const countLabel = !ready ? "Yuklanmoqda..." : filtering ? `${shown.length} ta kitob topildi` : `${catalog.length} ta kitob`;
  const featuredBook = catalog[0];
  const publishers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const book of catalog) counts.set(book.publisher, (counts.get(book.publisher) ?? 0) + 1);
    return [...counts].map(([id, count]) => ({ id, count }));
  }, [catalog]);

  return (
    <ShopShell searchPath="/kitoblar" cartCount={cartCount} placeholder="Kitob, muallif yoki ISBN bo‘yicha qidiring..." showCamera={false}>
      <div className="hub-page">
        <div className="hub-head">
          <div>
            <h1>Kitoblar</h1>
            <p className="hub-sub">Stomatologik kitoblar, atlaslar va qo‘llanmalar. Bosma yoki elektron formatda.</p>
          </div>
        </div>
        <div className="hub-frow">
          {bookCategories.map((item) => (
            <button key={item} type="button" className={category === item ? "hub-chip on" : "hub-chip"} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="hub-3">
          <aside className="hub-side">
            <h3>
              Filtrlar
              <button type="button" className="hub-more" onClick={reset}>
                Tozalash
              </button>
            </h3>
            <h4>Format</h4>
            {(
              [
                ["bosma", "Bosma kitob", catalog.filter((book) => book.formats.includes("bosma")).length],
                ["pdf", "Elektron (PDF)", catalog.filter((book) => book.formats.includes("pdf")).length],
              ] as const
            ).map(([id, label, count]) => (
              <button key={id} type="button" className={formats.includes(id) ? "hub-check on" : "hub-check"} onClick={() => { setBothOnly(false); toggle(formats, id, setFormats); }}>
                <span className="hub-boxi">{formats.includes(id) ? <Check className="i" /> : null}</span>
                {label}
                <em>({count})</em>
              </button>
            ))}
            <button type="button" className={bothOnly ? "hub-check on" : "hub-check"} onClick={() => { setBothOnly((on) => !on); setFormats([]); }}>
              <span className="hub-boxi">{bothOnly ? <Check className="i" /> : null}</span>
              Ikkalasi
              <em>({catalog.filter((book) => book.formats.includes("bosma") && book.formats.includes("pdf")).length})</em>
            </button>
            <h4>Til</h4>
            {(
              [
                ["O‘zbek", catalog.filter((book) => book.lang === "O‘zbek").length],
                ["Rus", catalog.filter((book) => book.lang === "Rus").length],
                ["Ingliz", catalog.filter((book) => book.lang === "Ingliz").length],
              ] as const
            ).map(([id, count]) => (
              <button key={id} type="button" className={langs.includes(id) ? "hub-check on" : "hub-check"} onClick={() => toggle(langs, id, setLangs)}>
                <span className="hub-boxi">{langs.includes(id) ? <Check className="i" /> : null}</span>
                {id}
                <em>({count})</em>
              </button>
            ))}
            <h4>Nashr yili</h4>
            <div className="dk-range">
              <div className="rail" />
              <div className="fill" style={{ left: `${((year[0] - 2000) / 26) * 100}%`, right: `${100 - ((year[1] - 2000) / 26) * 100}%` }} />
              <input
                type="range"
                min={2000}
                max={2026}
                value={year[0]}
                aria-label="Nashr yili dan"
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setYear([Math.min(next, year[1]), year[1]]);
                  setYearOn(true);
                }}
              />
              <input
                type="range"
                min={2000}
                max={2026}
                value={year[1]}
                aria-label="Nashr yili gacha"
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setYear([year[0], Math.max(next, year[0])]);
                  setYearOn(true);
                }}
              />
            </div>
            <div className="hub-labs">
              <span>{yearOn ? year[0] : 2020}</span>
              <span>{yearOn ? year[1] : 2026}</span>
            </div>
            <h4>Narx oralig‘i (so‘m)</h4>
            <div className="dk-range">
              <div className="rail" />
              <div className="fill" style={{ left: `${(price[0] / 5_000_000) * 100}%`, right: `${100 - (price[1] / 5_000_000) * 100}%` }} />
              <input
                type="range"
                min={0}
                max={5_000_000}
                step={50000}
                value={price[0]}
                aria-label="Narx dan"
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setPrice([Math.min(next, price[1]), price[1]]);
                  setPriceOn(true);
                }}
              />
              <input
                type="range"
                min={0}
                max={5_000_000}
                step={50000}
                value={price[1]}
                aria-label="Narx gacha"
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setPrice([price[0], Math.max(next, price[0])]);
                  setPriceOn(true);
                }}
              />
            </div>
            <div className="hub-labs">
              <span>{(priceOn ? price[0] : 0).toLocaleString("ru-RU")}</span>
              <span>{(priceOn ? price[1] : 5_000_000).toLocaleString("ru-RU")}</span>
            </div>
            <h4>Mavjudligi</h4>
            <button type="button" className={stock.length === 0 ? "hub-check on" : "hub-check"} onClick={() => setStock([])}>
              <span className="hub-boxi">{stock.length === 0 ? <Check className="i" /> : null}</span>
              Barchasi
              <em>({catalog.length})</em>
            </button>
            {(
              [
                ["ombor", "Omborda", catalog.filter((book) => book.stock === "ombor").length],
                ["preorder", "Oldindan buyurtma", catalog.filter((book) => book.stock === "preorder").length],
              ] as const
            ).map(([id, label, count]) => (
              <button key={id} type="button" className={stock.includes(id) ? "hub-check on" : "hub-check"} onClick={() => toggle(stock, id, setStock)}>
                <span className="hub-boxi">{stock.includes(id) ? <Check className="i" /> : null}</span>
                {label}
                <em>({count})</em>
              </button>
            ))}
            <h4>Nashriyot</h4>
            {publishers.map((item) => (
              <button key={item.id} type="button" className={pubs.includes(item.id) ? "hub-check on" : "hub-check"} onClick={() => toggle(pubs, item.id, setPubs)}>
                <span className="hub-boxi">{pubs.includes(item.id) ? <Check className="i" /> : null}</span>
                {item.id}
                <em>({item.count})</em>
              </button>
            ))}
          </aside>

          <div>
            <div className="hub-sec-h" style={{ marginBottom: "calc(.45 * var(--u))" }}>
              <span className="hub-count">{countLabel}</span>
              <div className={sortOpen ? "dk-drop on" : "dk-drop"}>
                <button type="button" onClick={() => setSortOpen((open) => !open)}>
                  Saralash: {sortLabel}
                </button>
                {sortOpen ? (
                  <div className="dk-pop">
                    {sorts.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="hub-check"
                        onClick={() => {
                          setSort(item.id);
                          setSortOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {shown.length === 0 ? (
              <div className="hub-empty">{!ready ? "Yuklanmoqda..." : catalog.length === 0 ? "Hozircha kitob yo‘q" : "Filtr bo‘yicha kitob topilmadi."}</div>
            ) : (
              <div className="hub-grid">
                {shown.map((book) => {
                  return (
                    <article className="hub-card hub-book" key={book.id}>
                      <div className="ph">
                        <img src={book.image} alt="" />
                        {book.badge === "best" ? <span className="hub-badge amber">Bestseller</span> : null}
                        {book.badge === "off" ? <span className="hub-badge red">{book.offLabel}</span> : null}
                        {book.badge === "yangi" ? <span className="hub-badge green">Yangi</span> : null}
                        <span className="hub-fmts">
                          {book.formats.includes("bosma") ? <i>Bosma</i> : null}
                          {book.formats.includes("pdf") ? <i>PDF</i> : null}
                        </span>
                      </div>
                      <h3><Link href={`/kitoblar/${book.id}`}>{book.title}</Link></h3>
                      <p className="by">{book.authors}</p>
                      <p className="by">
                        {book.year} · {book.pages} · {book.lang}
                      </p>
                      <div className="hub-meta">
                        <Star className="i" /> {book.rating.toFixed(1)} ({book.reviews} ta sharh)
                      </div>
                      <div className="hub-price">
                        <strong>{som(book.price)}</strong>
                        {book.oldPrice ? <s>{som(book.oldPrice)}</s> : null}
                      </div>
                      <Link href={`/kitoblar/${book.id}/oqish`} className="hub-btn">
                        <BookOpen className="i" /> O‘qish
                      </Link>
                      <button type="button" className="hub-btn ghost" onClick={() => setSample(book)}>
                        <BookOpen className="i" /> Namuna o‘qish
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="hub-rail">
            <section className="hub-box hub-feat">
              <h3>Haftaning tanlovi</h3>
              {featuredBook ? (<>
              <div className="cover">
                <img src={featuredBook.image} alt="" />
              </div>
              <h3>{featuredBook.title}</h3>
              <p className="by">{featuredBook.authors}</p>
              <p className="by">
                {featuredBook.year} · {featuredBook.pages} · {featuredBook.lang}
              </p>
              <div className="hub-price">
                <strong>{som(featuredBook.price)}</strong>
              </div>
              <Link href={`/kitoblar/${featuredBook.id}/oqish`} className="hub-btn block">
                <BookOpen className="i" /> O‘qish
              </Link>
              <button type="button" className="hub-btn ghost block" onClick={() => setSample(featuredBook)}>
                Namuna o‘qish
              </button>
              <div className="hub-perks">
                <div>
                  <ImageIcon className="i" /> Yuqori sifatli rasmlar
                </div>
                <div>
                  <BookOpen className="i" /> Klinik holatlar
                </div>
                <div>
                  <Check className="i" /> Bosqichma-bosqich protokollar
                </div>
              </div>
              </>) : <p className="by">Hozircha kitob yo‘q</p>}
            </section>
            <section className="hub-box">
              <h3>
                Mening kutubxonam
                <button type="button" onClick={() => setLibOpen((open) => !open)}>
                  {libOpen ? "Yig‘ish" : "Barchasini ko‘rish"}
                </button>
              </h3>
              {library.length === 0 ? <p className="by">Hozircha o‘qilayotgan kitob yo‘q</p> : null}
              {(libOpen ? library : library.slice(0, 3)).map((item) => (
                <div className="hub-lib" key={item.id}>
                  <img src={item.image} alt="" />
                  <div>
                    <b>{item.title}</b>
                    <small>
                      {item.author}
                      {libOpen ? ` · ${item.meta}` : ""}
                    </small>
                  </div>
                  <Link href={`/kitoblar/${item.id}/oqish`}>
                    O‘qish
                  </Link>
                </div>
              ))}
              <div className="hub-ask">
                <b>Kitob topa olmadingizmi?</b>
                <p>Sizga kerakli kitobni topishda yordam beramiz.</p>
                {asked ? <div className="hub-note">{asked}</div> : null}
                <button type="button" className="hub-btn" onClick={() => setAskOpen(true)}>
                  So‘rov yuborish
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {sample ? (
        <div className="hub-modal" onClick={() => setSample(null)}>
          <div className="hub-dialog" role="dialog" onClick={(event) => event.stopPropagation()}>
            <div className="hub-head">
              <h3>{sample.title}</h3>
              <button type="button" onClick={() => setSample(null)} aria-label="Yopish">
                <X className="i" />
              </button>
            </div>
            <p>{sample.authors}</p>
            <p>{sample.sample}</p>
            <div className="hub-actions">
              <Link href={`/kitoblar/${sample.id}/oqish`} className="hub-btn">
                O‘qish
              </Link>
              <button type="button" className="hub-btn ghost" onClick={() => setSample(null)}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {askOpen ? (
        <div className="hub-modal" onClick={() => setAskOpen(false)}>
          <form
            className="hub-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setAsked(`So‘rov qabul qilindi: ${String(data.get("title") || "kitob")}.`);
              setAskOpen(false);
            }}
          >
            <h3>Kitob so‘rovi</h3>
            <label>Kitob nomi</label>
            <input name="title" required placeholder="Masalan, Atlas of ..." />
            <div className="hub-actions">
              <button type="submit" className="hub-btn">
                Yuborish
              </button>
              <button type="button" className="hub-btn ghost" onClick={() => setAskOpen(false)}>
                Bekor
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </ShopShell>
  );
}
