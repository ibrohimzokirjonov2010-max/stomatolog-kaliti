"use client";
/* eslint-disable @next/next/no-img-element -- book covers are sized by the fluid unit */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Heart, LayoutGrid, Search, ShoppingCart, SlidersHorizontal, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { bookSorts, bookTopics, type BookFormat, type BookSort, type BookTopic, type MobileBook } from "@/data/mobile-books";
import { fetchBooks, toMobileBook } from "@/lib/live-content";
import { formatMoney } from "@/lib/format";
import "./books-mobile.css";

function Tooth() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
    </svg>
  );
}

export function KitoblarMobile() {
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<"all" | BookTopic>("all");
  const [format, setFormat] = useState<BookFormat | "">("");
  const [sort, setSort] = useState<BookSort>("mashhur");
  const [saved, setSaved] = useState<string[]>([]);
  const [filters, setFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [mobileBooks, setMobileBooks] = useState<MobileBook[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stop = false;
    void fetchBooks().then((rows) => {
      if (stop) return;
      setMobileBooks(rows.map(toMobileBook));
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cap = Number(maxPrice.replace(/\s/g, ""));
    const rows = mobileBooks.filter((book) => {
      if (topic !== "all" && book.topic !== topic) return false;
      if (format && book.format !== format) return false;
      if (cap > 0 && book.price > cap) return false;
      if (!q) return true;
      return `${book.title} ${book.author} ${book.topic}`.toLowerCase().includes(q);
    });
    if (sort === "mashhur") rows.sort((a, b) => b.reviews - a.reviews);
    if (sort === "narx") rows.sort((a, b) => a.price - b.price);
    if (sort === "yangi") rows.sort((a, b) => Number(b.fresh) - Number(a.fresh));
    return rows;
  }, [format, maxPrice, mobileBooks, query, sort, topic]);

  return (
    <div className="kb lg:hidden" data-testid="mobile-kitoblar">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-book-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? <span className="mh-badge" data-testid="kb-cart-badge">{count > 9 ? "9+" : count}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="kb-body">
        <h1 className="kb-title">Kitoblar</h1>
        <p className="kb-sub">Stomatologiya bo‘yicha eng yaxshi adabiyotlar</p>
        <form className="kb-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input data-book-search data-section-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kitob nomi, muallif yoki mavzu bo‘yicha qidiring..." aria-label="Qidiruv" />
          <button type="button" className="kb-filter" aria-label="Filtr" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
          </button>
        </form>
        <div className="kb-cats" aria-label="Mavzular">
          {bookTopics.map((item) => (
            <button key={item.id} type="button" className={topic === item.id ? "on" : undefined} onClick={() => setTopic(item.id)}>
              {item.id === "all" ? <LayoutGrid /> : <Tooth />}
              {item.label}
            </button>
          ))}
        </div>
        <div className="kb-tools">
          <button type="button" className={format === "bosma" ? "fmt on" : "fmt"} onClick={() => setFormat((value) => (value === "bosma" ? "" : "bosma"))}>
            <BookOpen /> Bosma kitoblar
          </button>
          <button type="button" className={format === "pdf" ? "fmt on" : "fmt"} onClick={() => setFormat((value) => (value === "pdf" ? "" : "pdf"))}>
            <FileText /> PDF kitoblar
          </button>
          <label className="kb-sort">
            Saralash:
            <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as BookSort)}>
              {bookSorts.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
        {list.length === 0 ? <p className="kb-note">{!ready ? "Yuklanmoqda..." : mobileBooks.length === 0 ? "Hozircha kitob yo‘q" : "Mos kitob topilmadi"}</p> : null}
        <div className="kb-grid">
          {list.map((book) => (
            <article key={book.id} className="kb-card">
              <div className="kb-cover">
                <img src={book.image} alt="" />
                {book.fresh ? <span className="kb-new">Yangi</span> : null}
                <button type="button" className={saved.includes(book.id) ? "kb-heart on" : "kb-heart"} aria-label="Sevimlilar" aria-pressed={saved.includes(book.id)} onClick={() => setSaved((current) => (current.includes(book.id) ? current.filter((id) => id !== book.id) : [...current, book.id]))}>
                  <Heart fill={saved.includes(book.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <h3>{book.title}</h3>
              <p className="by">{book.author}</p>
              <p className="kb-rate">
                <Star /> {book.rating} ({book.reviews} ta baho)
              </p>
              <span className="kb-chip">{book.format === "bosma" ? "Bosma kitob" : "PDF kitob"}</span>
              <p className="kb-price">{formatMoney(book.price, "UZS")}</p>
              <Link href={`/kitoblar/${book.id}/oqish`} className="kb-cart">
                <BookOpen /> O‘qish
              </Link>
            </article>
          ))}
        </div>
      </div>
      {filters ? (
        <div className="kb-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form className="kb-box" onSubmit={(event) => { event.preventDefault(); setFilters(false); }}>
            <h3>Filtr</h3>
            <input aria-label="Eng yuqori narx" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Eng yuqori narx" />
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => { setMaxPrice(""); setFilters(false); }}>Tozalash</button>
              <button type="submit" className="go">Ko‘rish</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
