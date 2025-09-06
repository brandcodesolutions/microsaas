import { Calendar, DollarSign, Store, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "appointments",
    label: "Agendamentos",
    icon: Calendar,
    path: "/dashboard"
  },
  {
    id: "financial",
    label: "Financeiro",
    icon: DollarSign,
    path: "/financeiro"
  },
  {
    id: "salon",
    label: "Perfil",
    icon: Store,
    path: "/perfil-salao"
  },
  {
    id: "settings",
    label: "Config",
    icon: Settings,
    path: "/configuracoes"
  }
];

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === "/dashboard" && location.pathname === "/");
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-colors duration-200",
                isActive 
                  ? "text-primary bg-primary/5" 
                  : "text-gray-500 hover:text-gray-700 active:bg-gray-100"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                isActive ? "text-primary" : "text-gray-500"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-primary" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;