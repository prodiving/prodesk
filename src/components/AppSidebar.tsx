import { NavLink } from "react-router-dom";
import { Anchor, LayoutDashboard, BookOpen, Users, MapPin, Timer, GraduationCap, Ship, UserCheck, FileText, AlertTriangle, Home, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dive-logs", label: "Dive Logs", icon: BookOpen },
  { to: "/divers", label: "Divers", icon: Users },
  { to: "/dive-sites", label: "Dive Sites", icon: MapPin },
  { to: "/dive-timer", label: "Dive Timer", icon: Timer },
  { to: "/instructors", label: "Instructors", icon: UserCheck },
  { to: "/boats", label: "Boats", icon: Ship },
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/bookings", label: "Bookings & Invoices", icon: FileText },
  { to: "/accommodations", label: "Accommodations", icon: Home },
  { to: "/emergency", label: "Emergency", icon: AlertTriangle },
];

export default function AppSidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
        <Anchor className="h-7 w-7 text-sidebar-primary" />
        <span className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">DiveAdmin</span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {links.map(({ to, label, icon: Icon }) => (
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
