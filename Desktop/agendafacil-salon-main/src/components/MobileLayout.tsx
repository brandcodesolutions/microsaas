import { ReactNode } from "react";
import BottomNavigation from "./BottomNavigation";

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

const MobileLayout = ({ children, showBottomNav = true }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content with bottom padding for mobile navigation */}
      <div className={showBottomNav ? "pb-16 md:pb-0" : ""}>
        {children}
      </div>
      
      {/* Bottom Navigation - only on mobile */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export default MobileLayout;