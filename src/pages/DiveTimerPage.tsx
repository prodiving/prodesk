import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DiveTimerPage() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
  }, [running]);

  const pause = useCallback(() => {
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  const progress = Math.min((seconds / 3600) * 100, 100);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dive Timer</h1>
        <p className="page-description">Track your dive duration in real-time</p>
      </div>

      <div className="flex flex-col items-center justify-center mt-12">
        <div className="relative">
          <svg width="280" height="280" viewBox="0 0 280 280">
            <circle
              cx="140" cy="140" r="120"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="140" cy="140" r="120"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 140 140)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-5xl font-bold tracking-wider">
              {pad(hrs)}:{pad(mins)}:{pad(secs)}
            </span>
            <span className="text-sm text-muted-foreground mt-2">
              {running ? "Diving..." : seconds > 0 ? "Paused" : "Ready"}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          {!running ? (
            <Button size="lg" onClick={start}>
              <Play className="h-5 w-5 mr-2" />Start
            </Button>
          ) : (
            <Button size="lg" variant="secondary" onClick={pause}>
              <Pause className="h-5 w-5 mr-2" />Pause
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={reset}>
            <RotateCcw className="h-5 w-5 mr-2" />Reset
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-12 text-center">
          <div className="stat-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Hours</p>
            <p className="text-2xl font-mono font-bold mt-1">{pad(hrs)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Minutes</p>
            <p className="text-2xl font-mono font-bold mt-1">{pad(mins)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Seconds</p>
            <p className="text-2xl font-mono font-bold mt-1">{pad(secs)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
