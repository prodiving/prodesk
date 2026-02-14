import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import DiveLogsPage from "@/pages/DiveLogsPage";
import DiversPage from "@/pages/DiversPage";
import DiveSitesPage from "@/pages/DiveSitesPage";
import DiveTimerPage from "@/pages/DiveTimerPage";
import NotFound from "./pages/NotFound";
import { useDiveData } from "@/hooks/useDiveData";

const queryClient = new QueryClient();

function AppRoutes() {
  const { diveLogs, divers, diveSites, addDiveLog, addDiver, addDiveSite, deleteDiveLog, deleteDiver, deleteDiveSite } = useDiveData();

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage diveLogs={diveLogs} divers={divers} diveSites={diveSites} />} />
        <Route path="/dive-logs" element={<DiveLogsPage diveLogs={diveLogs} divers={divers} diveSites={diveSites} onAdd={addDiveLog} onDelete={deleteDiveLog} />} />
        <Route path="/divers" element={<DiversPage divers={divers} onAdd={addDiver} onDelete={deleteDiver} />} />
        <Route path="/dive-sites" element={<DiveSitesPage diveSites={diveSites} onAdd={addDiveSite} onDelete={deleteDiveSite} />} />
        <Route path="/dive-timer" element={<DiveTimerPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
