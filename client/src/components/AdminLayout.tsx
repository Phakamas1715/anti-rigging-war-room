import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Key, 
  BarChart3, 
  Network, 
  FileText, 
  Upload, 
  AlertTriangle, 
  Map, 
  Camera, 
  ScanLine, 
  Activity,
  Settings,
  FileDown,
  Shield,
  Home,
  HelpCircle,
  Ban,
  Sparkles,
  Search
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

// Menu items grouped by category
const menuGroups = [
  {
    label: "ภาพรวม",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      { icon: Activity, label: "Real-time", path: "/admin/realtime" },
      { icon: AlertTriangle, label: "การแจ้งเตือน", path: "/admin/alerts" },
    ]
  },
  {
    label: "เครื่องมือวิเคราะห์",
    items: [
      { icon: BarChart3, label: "Klimek Model", path: "/admin/klimek" },
      { icon: FileText, label: "Benford's Law", path: "/admin/benford" },
      { icon: Network, label: "Network Analysis", path: "/admin/network" },
      { icon: Map, label: "Spatial Map", path: "/admin/spatial" },
      { icon: Shield, label: "GLUE-FIN Heatmap", path: "/admin/gluefin" },
      { icon: Search, label: "ค้นหาเขตเลือกตั้ง", path: "/admin/constituency" },
    ]
  },
  {
    label: "จัดการอาสาสมัคร",
    items: [
      { icon: Key, label: "รหัสอาสาสมัคร", path: "/admin/volunteer-codes" },
      { icon: Users, label: "รายชื่ออาสาสมัคร", path: "/admin/volunteers" },
    ]
  },
  {
    label: "จัดการข้อมูล",
    items: [
      { icon: Upload, label: "นำเข้าข้อมูล", path: "/admin/import" },
      { icon: ScanLine, label: "Batch OCR", path: "/admin/batch-ocr" },
      { icon: Camera, label: "PVT Comparison", path: "/admin/pvt" },
      { icon: FileDown, label: "Export รายงาน", path: "/admin/export" },
    ]
  },
  {
    label: "ตั้งค่า",
    items: [
      { icon: Settings, label: "ตั้งค่าระบบ", path: "/admin/settings" },
      { icon: HelpCircle, label: "คู่มือการใช้งาน", path: "/admin/help" },
      { icon: Sparkles, label: "Demo Dashboard", path: "/admin/demo" },
    ]
  },
];

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

// Check if user logged in via admin code
function checkAdminCodeSession(): boolean {
  try {
    const session = localStorage.getItem('adminSession');
    if (!session) return false;
    const parsed = JSON.parse(session);
    // Session expires after 24 hours
    if (Date.now() - parsed.loginTime > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('adminSession');
      return false;
    }
    return parsed.isAdmin === true;
  } catch {
    return false;
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user, logout } = useAuth();
  const [isAdminByCode, setIsAdminByCode] = useState(false);

  useEffect(() => {
    setIsAdminByCode(checkAdminCodeSession());
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  // Check if logged in via admin code
  if (isAdminByCode) {
    // Allow access via admin code
  } else if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-red-500/20 rounded-full">
              <Shield className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center text-white">
              เข้าสู่ระบบ Admin
            </h1>
            <p className="text-sm text-slate-400 text-center max-w-sm">
              กรุณาเข้าสู่ระบบเพื่อเข้าถึง Admin Dashboard
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            เข้าสู่ระบบ
          </Button>
          <Link href="/">
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <Home className="mr-2 h-4 w-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Login แล้ว แต่ไม่ใช่ Admin (และไม่ได้ login ด้วยรหัส)
  if (!isAdminByCode && user && user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-red-500/20 rounded-full">
              <Ban className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center text-white">
              ไม่มีสิทธิ์เข้าถึง
            </h1>
            <p className="text-sm text-slate-400 text-center max-w-sm">
              คุณไม่มีสิทธิ์เข้าถึงหน้า Admin Dashboard<br />
              เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงได้
            </p>
            <div className="text-xs text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg">
              เข้าสู่ระบบในฐานะ: <span className="text-slate-300">{user.name}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Link href="/volunteer/login">
              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Users className="mr-2 h-4 w-4" />
                ไปหน้าอาสาสมัคร
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                <Home className="mr-2 h-4 w-4" />
                กลับหน้าหลัก
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={logout}
              className="text-slate-400 hover:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <AdminLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}

type AdminLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function AdminLayoutContent({
  children,
  setSidebarWidth,
}: AdminLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Find active menu item
  const activeMenuItem = menuGroups.flatMap(g => g.items).find(item => location === item.path);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-slate-800 bg-slate-950"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-slate-800">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-slate-800 rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-slate-400" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="h-5 w-5 text-red-500 shrink-0" />
                  <span className="font-semibold tracking-tight truncate text-white">
                    War Room Admin
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 bg-slate-950">
            {menuGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel className="text-slate-500 text-xs uppercase tracking-wider px-4 py-2">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="px-2">
                    {group.items.map(item => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className={`h-9 transition-all font-normal ${
                              isActive 
                                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                            }`}
                          >
                            <item.icon
                              className={`h-4 w-4 ${isActive ? "text-red-500" : ""}`}
                            />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-slate-800 bg-slate-950">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-800 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border border-slate-700 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-slate-800 text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-1">
                      {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-700">
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer text-slate-300 hover:text-white">
                    <Home className="mr-2 h-4 w-4" />
                    <span>กลับหน้าหลัก</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-400 focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ออกจากระบบ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-red-500/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {isMobile && (
          <div className="flex border-b border-slate-800 h-14 items-center justify-between bg-slate-950/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-slate-900 text-slate-400" />
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-red-500" />
                <span className="tracking-tight text-white font-medium">
                  {activeMenuItem?.label ?? "Admin"}
                </span>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
