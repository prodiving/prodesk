import { NavLink } from "react-router-dom";
import { Anchor, LayoutDashboard, BookOpen, Users, MapPin, Timer } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dive-logs", label: "Dive Logs", icon: BookOpen },
  { to: "/divers", label: "Divers", icon: Users },
  { to: "/dive-sites", label: "Dive Sites", icon: MapPin },
  { to: "/dive-timer", label: "Dive Timer", icon: Timer },
];

export default function AppSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
        <Anchor className="h-7 w-7 text-sidebar-primary" />
        <span className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">DiveAdmin</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
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
        <p className="text-xs text-sidebar-foreground/60">DiveAdmin v1.0</p>
      </div>
    </aside>
  );
}
