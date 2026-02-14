import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import DiveLogsPage from "@/pages/DiveLogsPage";
import DiversPage from "@/pages/DiversPage";
import DiveSitesPage from "@/pages/DiveSitesPage";
import DiveTimerPage from "@/pages/DiveTimerPage";
import InstructorsPage from "@/pages/InstructorsPage";
import BoatsPage from "@/pages/BoatsPage";
import CoursesPage from "@/pages/CoursesPage";
import BookingsPage from "@/pages/BookingsPage";
import EmergencyPage from "@/pages/EmergencyPage";
import AccommodationsPage from "@/pages/AccommodationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dive-logs" element={<DiveLogsPage />} />
        <Route path="/divers" element={<DiversPage />} />
        <Route path="/dive-sites" element={<DiveSitesPage />} />
        <Route path="/dive-timer" element={<DiveTimerPage />} />
        <Route path="/instructors" element={<InstructorsPage />} />
        <Route path="/boats" element={<BoatsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/accommodations" element={<AccommodationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
