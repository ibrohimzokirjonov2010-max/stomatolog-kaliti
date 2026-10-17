"use client";
/* eslint-disable @next/next/no-img-element -- article cover is a content photo */

import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Eye } from "lucide-react";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { formatNewsViews, type MobileNews } from "@/data/mobile-news";
import "./yangiliklar-mobile.css";

export function YangiliklarMobileArticle({ item }: { item: MobileNews }) {
  return (
    <article className="nw lg:hidden" data-testid="mobile-yangilik">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/yangiliklar" className="nw-back" aria-label="Orqaga"><ArrowLeft /></Link>
      </header>
      <div className="nw-body nw-article">
        <img className="nw-cover" src={item.image} alt="" />
        <h1>{item.title}</h1>
        <div className="nw-meta">
          <span><Calendar /> {item.date}</span>
          <span><Clock /> {item.minutes} daqiqa</span>
          <span><Eye /> {formatNewsViews(item.views)}</span>
        </div>
        <p className="body">{item.body}</p>
      </div>
    </article>
  );
}
