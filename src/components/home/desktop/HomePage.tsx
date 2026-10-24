"use client";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import HomeBoard from "./HomeBoard";

export default function HomePage() {
  return (
    <div className="sh dh">
      <Topbar placeholder="Stomatologga nima kerak?" />
      <div className="sh-body">
        <Sidebar />
        <main className="sh-main">
          <HomeBoard />
        </main>
      </div>
    </div>
  );
}
