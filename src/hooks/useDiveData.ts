import { useState } from "react";

export type DiveLog = {
  id: string;
  date: string;
  site: string;
  depth: number;
  duration: number;
  diver: string;
  notes: string;
};

export type Diver = {
  id: string;
  name: string;
  email: string;
  certification: string;
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert";
  totalDives: number;
};

export type DiveSite = {
  id: string;
  name: string;
  location: string;
  maxDepth: number;
  difficulty: "easy" | "moderate" | "challenging" | "expert";
  description: string;
};

const initialDiveLogs: DiveLog[] = [
  { id: "1", date: "2026-02-10", site: "Blue Hole", depth: 30, duration: 45, diver: "Alex Morgan", notes: "Great visibility" },
  { id: "2", date: "2026-02-08", site: "Coral Garden", depth: 18, duration: 55, diver: "Sam Rivera", notes: "Saw manta ray" },
  { id: "3", date: "2026-02-05", site: "The Wall", depth: 40, duration: 35, diver: "Alex Morgan", notes: "Strong current" },
];

const initialDivers: Diver[] = [
  { id: "1", name: "Alex Morgan", email: "alex@dive.com", certification: "PADI Advanced Open Water", skillLevel: "advanced", totalDives: 120 },
  { id: "2", name: "Sam Rivera", email: "sam@dive.com", certification: "SSI Open Water", skillLevel: "intermediate", totalDives: 45 },
  { id: "3", name: "Jordan Lee", email: "jordan@dive.com", certification: "PADI Divemaster", skillLevel: "expert", totalDives: 500 },
];

const initialSites: DiveSite[] = [
  { id: "1", name: "Blue Hole", location: "Belize", maxDepth: 40, difficulty: "challenging", description: "Famous sinkhole with deep walls" },
  { id: "2", name: "Coral Garden", location: "Red Sea, Egypt", maxDepth: 20, difficulty: "easy", description: "Colorful shallow reef" },
  { id: "3", name: "The Wall", location: "Grand Cayman", maxDepth: 60, difficulty: "expert", description: "Dramatic vertical drop-off" },
];

export function useDiveData() {
  const [diveLogs, setDiveLogs] = useState<DiveLog[]>(initialDiveLogs);
  const [divers, setDivers] = useState<Diver[]>(initialDivers);
  const [diveSites, setDiveSites] = useState<DiveSite[]>(initialSites);

  const addDiveLog = (log: Omit<DiveLog, "id">) => {
    setDiveLogs((prev) => [...prev, { ...log, id: crypto.randomUUID() }]);
  };

  const addDiver = (diver: Omit<Diver, "id">) => {
    setDivers((prev) => [...prev, { ...diver, id: crypto.randomUUID() }]);
  };

  const addDiveSite = (site: Omit<DiveSite, "id">) => {
    setDiveSites((prev) => [...prev, { ...site, id: crypto.randomUUID() }]);
  };

  const deleteDiveLog = (id: string) => setDiveLogs((prev) => prev.filter((l) => l.id !== id));
  const deleteDiver = (id: string) => setDivers((prev) => prev.filter((d) => d.id !== id));
  const deleteDiveSite = (id: string) => setDiveSites((prev) => prev.filter((s) => s.id !== id));

  return { diveLogs, divers, diveSites, addDiveLog, addDiver, addDiveSite, deleteDiveLog, deleteDiver, deleteDiveSite };
}
