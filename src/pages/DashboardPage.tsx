import { useState, useEffect } from "react";
import { BookOpen, Users, MapPin, TrendingDown, GraduationCap, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardPage() {
  const [stats, setStats] = useState({ logs: 0, divers: 0, sites: 0, courses: 0, avgDepth: 0, revenue: 0 });

  useEffect(() => {
    const load = async () => {
      const [logs, divers, sites, courses, bookings] = await Promise.all([
        supabase.from("dive_logs").select("depth"),
        supabase.from("divers").select("id", { count: "exact", head: true }),
        supabase.from("dive_sites").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("total_amount, payment_status"),
      ]);
      const depths = logs.data || [];
      const avg = depths.length ? Math.round(depths.reduce((s, l) => s + Number(l.depth), 0) / depths.length) : 0;
      const rev = (bookings.data || []).filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.total_amount), 0);
      setStats({
        logs: depths.length,
        divers: divers.count || 0,
        sites: sites.count || 0,
        courses: courses.count || 0,
        avgDepth: avg,
        revenue: rev,
      });
    };
    load();
  }, []);

  const cards = [
    { label: "Total Dives", value: stats.logs, icon: BookOpen, color: "text-primary" },
    { label: "Registered Divers", value: stats.divers, icon: Users, color: "text-accent" },
    { label: "Dive Sites", value: stats.sites, icon: MapPin, color: "text-info" },
    { label: "Active Courses", value: stats.courses, icon: GraduationCap, color: "text-success" },
    { label: "Avg Depth", value: `${stats.avgDepth}m`, icon: TrendingDown, color: "text-warning" },
    { label: "Revenue (Paid)", value: `$${stats.revenue}`, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your diving operations</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
