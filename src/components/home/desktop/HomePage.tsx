"use client";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { DashboardHome } from "./DashboardHome";

/** Logged-in desktop home matches 05-bosh-sahifa: greeting, stats, quick actions, three columns. */
export default function HomePage() {
  return (
      <div className="sh dh">
        <Topbar />
        <div className="sh-body">
          <Sidebar />
          <main className="sh-main">
            <DashboardHome />
          </main>
        </div>
      </div>
  );
}
