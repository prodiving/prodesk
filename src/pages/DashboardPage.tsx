import { BookOpen, Users, MapPin, TrendingDown } from "lucide-react";
import type { DiveLog, Diver, DiveSite } from "@/hooks/useDiveData";

interface Props {
  diveLogs: DiveLog[];
  divers: Diver[];
  diveSites: DiveSite[];
}

export default function DashboardPage({ diveLogs, divers, diveSites }: Props) {
  const avgDepth = diveLogs.length
    ? Math.round(diveLogs.reduce((s, l) => s + l.depth, 0) / diveLogs.length)
    : 0;

  const stats = [
    { label: "Total Dives", value: diveLogs.length, icon: BookOpen, color: "text-primary" },
    { label: "Registered Divers", value: divers.length, icon: Users, color: "text-accent" },
    { label: "Dive Sites", value: diveSites.length, icon: MapPin, color: "text-info" },
    { label: "Avg Depth", value: `${avgDepth}m`, icon: TrendingDown, color: "text-warning" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your diving operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-5">
          <h2 className="text-lg font-semibold mb-4">Recent Dive Logs</h2>
          {diveLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No dive logs yet.</p>
          ) : (
            <div className="space-y-3">
              {diveLogs.slice(-5).reverse().map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{log.site}</p>
                    <p className="text-xs text-muted-foreground">{log.diver} · {log.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">{log.depth}m</p>
                    <p className="text-xs text-muted-foreground">{log.duration} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h2 className="text-lg font-semibold mb-4">Dive Sites by Difficulty</h2>
          <div className="space-y-3">
            {(["easy", "moderate", "challenging", "expert"] as const).map((diff) => {
              const count = diveSites.filter((s) => s.difficulty === diff).length;
              const colors: Record<string, string> = {
                easy: "bg-success",
                moderate: "bg-info",
                challenging: "bg-warning",
                expert: "bg-destructive",
              };
              return (
                <div key={diff} className="flex items-center gap-3">
                  <span className="text-sm capitalize w-24 text-muted-foreground">{diff}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[diff]} transition-all`}
                      style={{ width: `${diveSites.length ? (count / diveSites.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
