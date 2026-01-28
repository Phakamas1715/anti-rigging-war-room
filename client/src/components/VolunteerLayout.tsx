import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  History, 
  HelpCircle, 
  Shield, 
  LogOut,
  User
} from "lucide-react";

interface VolunteerSession {
  code: string;
  stationId?: number;
  volunteerName?: string;
  stationCode?: string;
}

interface VolunteerLayoutProps {
  children: React.ReactNode;
}

export default function VolunteerLayout({ children }: VolunteerLayoutProps) {
  const [location, setLocation] = useLocation();
  const [session, setSession] = useState<VolunteerSession | null>(null);
  
  // Get volunteer session from localStorage
  useEffect(() => {
    const sessionStr = localStorage.getItem('volunteerSession');
    if (sessionStr) {
      try {
        setSession(JSON.parse(sessionStr));
      } catch (e) {
        console.error('Invalid session');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('volunteerCode');
    localStorage.removeItem('volunteerSession');
    setLocation('/volunteer/login');
  };

  const tabs = [
    { icon: Camera, label: "ส่งผลคะแนน", path: "/volunteer/submit" },
    { icon: History, label: "ประวัติ", path: "/volunteer/history" },
    { icon: HelpCircle, label: "วิธีใช้", path: "/volunteer/help" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500" />
            <span className="font-bold text-white text-sm">War Room</span>
          </div>
          
          <div className="flex items-center gap-3">
            {session && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {session.volunteerName || `รหัส: ${session.code}`}
                </span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm z-50">
        <div className="container flex justify-around py-2 px-4">
          {tabs.map((tab) => {
            const isActive = location === tab.path || 
              (tab.path === "/volunteer/submit" && location === "/volunteer/app");
            return (
              <Link key={tab.path} href={tab.path}>
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? "text-red-500" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <tab.icon className={`h-5 w-5 ${isActive ? "text-red-500" : ""}`} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
