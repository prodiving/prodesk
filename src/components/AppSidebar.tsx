import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Anchor, LayoutDashboard, BookOpen, Users, MapPin, GraduationCap, Ship, UserCheck, FileText, AlertTriangle, Home, LogOut, ShoppingCart, Calendar, DollarSign, ChevronDown, FileCheck, CreditCard, Truck, Users2, BarChart3, Briefcase, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const mainLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/dive-logs", label: "Dive Logs", icon: BookOpen },
  { to: "/divers", label: "Divers", icon: Users },
  { to: "/dive-sites", label: "Dive Sites", icon: MapPin },
  { to: "/instructors", label: "Instructors", icon: UserCheck },
  { to: "/boats", label: "Boats", icon: Ship },
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/bookings", label: "Bookings & Invoices", icon: FileText },
  { to: "/equipment", label: "Equipment", icon: ShoppingCart },
  { to: "/accommodations", label: "Accommodations", icon: Home },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/groups", label: "Groups", icon: UserCheck },
  { to: "/emergency", label: "Emergency", icon: AlertTriangle },
];

const financeLinks = [
  { to: "/finance", label: "Finance Dashboard", icon: DollarSign },
  { to: "/invoices", label: "Invoices", icon: FileCheck },
  { to: "/expenses", label: "Expenses", icon: CreditCard },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/payroll", label: "Payroll", icon: Users2 },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/agents", label: "Agents", icon: Briefcase },
  { to: "/finance-settings", label: "Settings", icon: Settings },
];

export default function AppSidebar() {
  const { signOut } = useAuth();
  const [financeOpen, setFinanceOpen] = useState(false);

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
        <Anchor className="h-7 w-7 text-sidebar-primary" />
        <span className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">DiveAdmin</span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {mainLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}

        {/* Finance Menu */}
        <div className="pt-2">
          <button
            onClick={() => setFinanceOpen(!financeOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <DollarSign className="h-4 w-4" />
            <span>Finance Menu</span>
            <ChevronDown
              className={`h-4 w-4 ml-auto transition-transform ${financeOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {financeOpen && (
            <div className="pl-6 space-y-1 mt-1">
              {financeLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/finance"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`
                  }
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/60" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />Sign Out
        </Button>
        <p className="text-xs text-sidebar-foreground/60 mt-2">DiveAdmin v2.0</p>
      </div>
    </aside>
  );
}
