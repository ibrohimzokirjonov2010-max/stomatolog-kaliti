import { Suspense, type ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { MobileCartBar, MobileCartPad, MobileDrawer, MobileNavProvider, MobileTabBar, MobileTopbar } from "@/components/dashboard/mobile-chrome";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <MobileNavProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className="hidden lg:flex" />
        <MobileDrawer />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="hidden lg:block">
            <Suspense fallback={<div className="h-[64px] border-b border-border bg-white" />}>
              <Topbar />
            </Suspense>
          </div>
          <MobileTopbar />
          <main
            id="main"
            className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(80px+env(safe-area-inset-bottom))] lg:p-5 lg:pb-8"
          >
            {children}
            <MobileCartPad />
          </main>
          <MobileCartBar />
          <MobileTabBar />
        </div>
      </div>
    </MobileNavProvider>
  );
}
