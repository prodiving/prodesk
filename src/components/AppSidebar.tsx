import { NavLink } from "react-router-dom";
import { Anchor, LayoutDashboard, BookOpen, Users, MapPin, GraduationCap, Ship, UserCheck, FileText, AlertTriangle, Home, LogOut, ShoppingCart, Calendar, Wrench, MessageCircle, Phone, Download, User, Settings, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/dive-logs", label: "Dive Trips", icon: BookOpen },
  { to: "/divers", label: "Divers", icon: Users },
  { to: "/dive-sites", label: "Dive Sites", icon: MapPin },
  { to: "/staff", label: "Staff", icon: UserCheck },
  { to: "/staff-calendar", label: "Staff Calendar", icon: Calendar },
  { to: "/boats", label: "Boats", icon: Ship },
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/bookings", label: "Bookings & Invoices", icon: FileText },
  { to: "/equipment-maintenance", label: "Equipment", icon: Wrench },
  { to: "/forms-elearning", label: "Forms & E-learning", icon: Download },
  { to: "/accommodations", label: "Accommodations", icon: Home },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/groups", label: "Groups", icon: UserCheck },
  { to: "/emergency", label: "Emergency", icon: AlertTriangle },
];


export default function AppSidebar() {
  const { signOut, user } = useAuth();

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

      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/60 h-auto p-3">
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-sidebar-foreground">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-xs text-sidebar-foreground/60">
                    {user?.email || 'user@example.com'}
                  </div>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center justify-between text-xs text-sidebar-foreground/60">
          <span>DiveAdmin v2.0</span>
          <Badge variant="secondary" className="text-xs">PRO</Badge>
        </div>
      </div>
    </aside>
  );
}
