import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import DiveLogsPage from "@/pages/DiveLogsPage";
import DiversPage from "@/pages/DiversPage";
import DiveSitesPage from "@/pages/DiveSitesPage";
import InstructorsPage from "@/pages/InstructorsPage";
import BoatsPage from "@/pages/BoatsPage";
import CoursesPage from "@/pages/CoursesPage";
import BookingsPage from "@/pages/BookingsPage";
import EmergencyPage from "@/pages/EmergencyPage";
import AccommodationsPage from "@/pages/AccommodationsPage";
import EquipmentPage from "@/pages/EquipmentPage";
import NotFound from "./pages/NotFound";
import TripsPage from "@/pages/TripsPage";
import TripBooking from "@/pages/TripBooking";

import WaiverForm from "@/components/WaiverForm";
import InventoryPage from "@/pages/InventoryPage";
import MaintenancePage from "@/pages/MaintenancePage";
import HiraPage from "@/pages/HiraPage";
import IncidentsPage from "@/pages/IncidentsPage";
import DebugPage from "@/pages/DebugPage";
import GroupsPage from "@/pages/GroupsPage";
import CalendarPage from "@/pages/CalendarPage";
import FinancePage from "@/pages/FinancePage";
import CreateDiveTripPage from "@/pages/CreateDiveTripPage";
// POSPage removed

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <ErrorBoundary>
      <AppLayout>
        <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dive-logs" element={<DiveLogsPage />} />
        <Route path="/divers" element={<DiversPage />} />
        <Route path="/dive-sites" element={<DiveSitesPage />} />
        <Route path="/instructors" element={<InstructorsPage />} />
        <Route path="/boats" element={<BoatsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        {/* POS removed — inventory remains at /inventory */}
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripBooking />} />
        <Route path="/trips/:id/book" element={<TripBooking />} />
        <Route path="/waiver" element={<WaiverForm />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/hira" element={<HiraPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/create-dive-trip" element={<CreateDiveTripPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/accommodations" element={<AccommodationsPage />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </ErrorBoundary>
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
              <Route path="/debug" element={<DebugPage />} />
              <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
