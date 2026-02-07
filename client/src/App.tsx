import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public Pages
import Home from "./pages/Home";
import VolunteerLogin from "./pages/VolunteerLogin";
import VolunteerRegister from "./pages/VolunteerRegister";
import Help from "./pages/Help";
import HowItWorks from "./pages/HowItWorks";
import AdminCodeLogin from "./pages/AdminCodeLogin";

// Admin Pages (with AdminLayout)
import AdminDashboard from "./pages/AdminDashboard";
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
import AdminVolunteers from "./pages/AdminVolunteers";
import Settings from "./pages/Settings";
import OcrScanner from "./pages/OcrScanner";
import BatchOcr from "./pages/BatchOcr";
import VolunteerCodes from "./pages/VolunteerCodes";
import RealTimeDashboard from "./pages/RealTimeDashboard";
import DemoDashboard from "./pages/DemoDashboard";
import PublicDemo from "./pages/PublicDemo";
import GlueFinHeatmap from "./pages/GlueFinHeatmap";
import ConstituencySearch from "./pages/ConstituencySearch";

// Volunteer Pages
import VolunteerApp from "./pages/VolunteerApp";
import VolunteerMobileApp from "./pages/VolunteerMobileApp";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path={"/"} component={Home} />
      <Route path={"/volunteer/login"} component={VolunteerLogin} />
      <Route path={"/volunteer/register"} component={VolunteerRegister} />
      <Route path={"/help"} component={Help} />
      <Route path={"/demo"} component={PublicDemo} />
      <Route path={"/how-it-works"} component={HowItWorks} />
      <Route path={"/admin/login"} component={AdminCodeLogin} />
      
      {/* Admin Routes - New Structure */}
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/realtime"} component={RealTimeDashboard} />
      <Route path={"/admin/alerts"} component={Alerts} />
      <Route path={"/admin/klimek"} component={KlimekAnalysis} />
      <Route path={"/admin/benford"} component={BenfordAnalysis} />
      <Route path={"/admin/network"} component={NetworkAnalysis} />
      <Route path={"/admin/spatial"} component={SpatialMap} />
      <Route path={"/admin/volunteer-codes"} component={VolunteerCodes} />
      <Route path={"/admin/volunteers"} component={AdminVolunteers} />
      <Route path={"/admin/import"} component={AdminImport} />
      <Route path={"/admin/batch-ocr"} component={BatchOcr} />
      <Route path={"/admin/pvt"} component={PVTComparison} />
      <Route path={"/admin/export"} component={ExportReport} />
      <Route path={"/admin/settings"} component={Settings} />
      <Route path={"/admin/help"} component={Help} />
      <Route path={"/admin/demo"} component={DemoDashboard} />
      <Route path={"/admin/gluefin"} component={GlueFinHeatmap} />
      <Route path={"/admin/constituency"} component={ConstituencySearch} />
      <Route path={"/admin/evidence"} component={EvidenceUpload} />
      
      {/* Legacy Routes - Redirect to Admin */}
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/klimek"} component={KlimekAnalysis} />
      <Route path={"/benford"} component={BenfordAnalysis} />
      <Route path={"/network"} component={NetworkAnalysis} />
      <Route path={"/evidence"} component={EvidenceUpload} />
      <Route path={"/alerts"} component={Alerts} />
      <Route path={"/pvt"} component={PVTComparison} />
      <Route path={"/spatial"} component={SpatialMap} />
      <Route path={"/export"} component={ExportReport} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/ocr"} component={OcrScanner} />
      <Route path={"/batch-ocr"} component={BatchOcr} />
      <Route path={"/realtime"} component={RealTimeDashboard} />
      
      {/* Volunteer Routes */}
      <Route path={"/volunteer"} component={VolunteerMobileApp} />
      <Route path={"/volunteer/app"} component={VolunteerMobileApp} />
      <Route path={"/volunteer/submit"} component={VolunteerMobileApp} />
      <Route path={"/volunteer/history"} component={VolunteerMobileApp} />
      <Route path={"/volunteer/help"} component={Help} />
      <Route path={"/volunteer/legacy"} component={VolunteerApp} />
      
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
