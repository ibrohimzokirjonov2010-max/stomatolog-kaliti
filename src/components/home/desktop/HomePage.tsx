"use client";
import Topbar from "./Topbar"; import Sidebar from "./Sidebar"; import Hero from "./Hero";
import Seminars from "./Seminars"; import Categories from "./Categories"; import Products from "./Products"; import RightRail from "./RightRail";
export default function HomePage() {
  return (
      <div className="sh dh">
        <Topbar />
        <div className="sh-body">
          <Sidebar />
          <main className="sh-main">
            <Hero />
            <div className="sh-cols">
              <div className="sh-left"><Seminars /><Categories /><Products /></div>
              <RightRail />
            </div>
          </main>
        </div>
      </div>
  );
}
