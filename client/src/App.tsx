import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public Pages
import Home from "./pages/Home-improved";
import Help from "./pages/Help";
import YasothonDashboard from "./pages/YasothonDashboard";
import AlertCenter from "./pages/AlertCenter";

// Volunteer Pages
import VolunteerMobileApp from "./pages/VolunteerMobileApp";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path={"/"} component={Home} />
      <Route path={"/help"} component={Help} />
      <Route path={"/dashboard"} component={YasothonDashboard} />
      <Route path={"/alerts"} component={AlertCenter} />
      
      {/* Volunteer Routes */}
      <Route path={"/volunteer"} component={VolunteerMobileApp} />
      <Route path={"/volunteer/app"} component={VolunteerMobileApp} />
      <Route path={"/volunteer/submit"} component={VolunteerMobileApp} />
      <Route path={"/volunteer/history"} component={VolunteerMobileApp} />
      <Route path={"/volunteer/help"} component={Help} />
      
      {/* 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
