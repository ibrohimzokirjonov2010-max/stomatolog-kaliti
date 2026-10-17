import { Suspense, type ReactNode } from "react";
import { DashboardHeader } from "@/components/desktop/desktop-header";
import { DesktopSidebar } from "@/components/desktop/desktop-sidebar";
import { SellerRail } from "@/components/desktop/seller-rail";
import { MobileCartBar, MobileCartPad, MobileDrawer, MobileNavProvider, MobileTabBar, MobileTopbar } from "@/components/dashboard/mobile-chrome";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <MobileNavProvider>
      <div className="shell-root bg-background">
        <div className="dh-slot">
          <Suspense fallback={<div className="dh-top" data-testid="desktop-header" />}>
            <DashboardHeader />
          </Suspense>
        </div>
        <div className="lg:hidden">
          <MobileTopbar />
        </div>
        <div className="shell-mid flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="sh dh-side-host">
            <DesktopSidebar />
          </div>
          <MobileDrawer />
          <main
            id="main"
            className="dh-main min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-8"
          >
            <div className="dh-page">
              <SellerRail />
              <div className="dh-page-body">
                {children}
                <MobileCartPad />
              </div>
            </div>
          </main>
        </div>
        <div className="mh-phone">
          <MobileCartBar />
          <MobileTabBar />
        </div>
      </div>
    </MobileNavProvider>
  );
}
