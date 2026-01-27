import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import KlimekAnalysis from "./pages/KlimekAnalysis";
import BenfordAnalysis from "./pages/BenfordAnalysis";
import NetworkAnalysis from "./pages/NetworkAnalysis";
import EvidenceUpload from "./pages/EvidenceUpload";
import Alerts from "./pages/Alerts";
import PVTComparison from "./pages/PVTComparison";
import AdminImport from "./pages/AdminImport";
import SpatialMap from "./pages/SpatialMap";
import ExportReport from "./pages/ExportReport";
import VolunteerApp from "./pages/VolunteerApp";
import AdminVolunteers from "./pages/AdminVolunteers";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/klimek"} component={KlimekAnalysis} />
      <Route path={"/benford"} component={BenfordAnalysis} />
      <Route path={"/network"} component={NetworkAnalysis} />
      <Route path={"/evidence"} component={EvidenceUpload} />
      <Route path={"/alerts"} component={Alerts} />
      <Route path={"/pvt"} component={PVTComparison} />
      <Route path={"/admin/import"} component={AdminImport} />
      <Route path={"/spatial"} component={SpatialMap} />
      <Route path={"/export"} component={ExportReport} />
      <Route path={"/volunteer"} component={VolunteerApp} />
      <Route path={"/admin/volunteers"} component={AdminVolunteers} />
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
