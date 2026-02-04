import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  Shield, 
  Users,
  BarChart3,
  ArrowRight,
  Smartphone,
  Lock,
  Camera,
  CheckCircle,
  Zap,
  LogOut,
  Play,
  Eye,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { TourButton } from "@/components/TourButton";
import { homeTourSteps } from "@/lib/tourSteps";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-orange-900/30 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="h-8 w-8 text-orange-500" />
              <Sparkles className="h-3 w-3 text-orange-400 absolute -top-1 -right-1" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Anti-Rigging War Room
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <TourButton 
              tourId="home-tour" 
              steps={homeTourSteps} 
              showOnFirstVisit={false}
              className="border-orange-800/50 text-orange-400/80 hover:text-orange-300 hover:bg-orange-900/20 hover:border-orange-700"
            />
            {loading ? (
              <div className="h-9 w-24 bg-orange-900/30 animate-pulse rounded-lg" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm text-slate-200">{user?.name}</span>
                  <span className="text-xs text-orange-400/70">
                    {isAdmin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                  </span>
                </div>
                {isAdmin && (
                  <Link href="/admin">
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25">
                      เข้า Dashboard
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={logout}
                  className="text-slate-400 hover:text-orange-400 hover:bg-orange-900/20"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline" className="border-orange-700/50 text-orange-300 hover:bg-orange-900/30 hover:border-orange-600">
                  <Lock className="mr-2 h-4 w-4" />
                  Admin Login
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-16 md:py-24 relative">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center max-w-3xl mx-auto mb-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
            <Sparkles className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-orange-300">ระบบวิเคราะห์ระดับนิติวิทยาศาสตร์</span>
          </div>
          <h1 data-tour="home-title" className="text-4xl md:text-5xl font-bold text-white mb-6">
            ระบบตรวจจับการทุจริต
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent"> การเลือกตั้ง</span>
          </h1>
          <p className="text-lg text-slate-400">
            ร่วมเป็นส่วนหนึ่งในการปกป้องประชาธิปไตย ด้วยระบบนับคะแนนคู่ขนาน (PVT) 
            และเครื่องมือวิเคราะห์ทางสถิติระดับนิติวิทยาศาสตร์
          </p>
        </div>

        {/* Two Main Entry Points */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative">
          {/* Volunteer Card */}
          <Card data-tour="volunteer-section" className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border-emerald-700/40 hover:border-emerald-500/60 transition-all duration-300 group backdrop-blur-sm hover:shadow-xl hover:shadow-emerald-500/10">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/20">
                <Smartphone className="h-10 w-10 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl text-white">อาสาสมัคร</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                ส่งผลคะแนนจากหน่วยเลือกตั้งของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>ไม่ต้องสมัครสมาชิก ใช้รหัส 6 หลัก</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>ถ่ายรูปกระดานนับคะแนน ระบบอ่านตัวเลขให้</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>ส่งข้อมูลแบบ Real-time</span>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <Link href="/volunteer/register">
                  <Button className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg shadow-lg shadow-emerald-500/25 transition-all duration-300">
                    ลงทะเบียนรับรหัสทันที
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/volunteer/login">
                  <Button variant="outline" className="w-full h-10 border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/10 hover:border-emerald-500">
                    มีรหัสแล้ว? เข้าสู่ระบบ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card data-tour="admin-section" className="bg-gradient-to-br from-orange-900/40 to-amber-950/60 border-orange-700/40 hover:border-orange-500/60 transition-all duration-300 group backdrop-blur-sm hover:shadow-xl hover:shadow-orange-500/10">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/30 to-amber-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/20">
                <BarChart3 className="h-10 w-10 text-orange-400" />
              </div>
              <CardTitle className="text-2xl text-white">ผู้ดูแลระบบ</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                วิเคราะห์ข้อมูลและจัดการอาสาสมัคร
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-orange-500/5">
                  <Zap className="h-5 w-5 text-orange-400 shrink-0" />
                  <span>Dashboard แบบ Real-time</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-orange-500/5">
                  <Zap className="h-5 w-5 text-orange-400 shrink-0" />
                  <span>Klimek Model, Benford's Law, SNA</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-orange-500/5">
                  <Zap className="h-5 w-5 text-orange-400 shrink-0" />
                  <span>แจ้งเตือนผ่าน Discord/LINE</span>
                </div>
              </div>
              {isAdmin ? (
                <Link href="/admin">
                  <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg mt-4 shadow-lg shadow-orange-500/25 transition-all duration-300">
                    เข้าสู่ Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : isAuthenticated ? (
                <div className="mt-4 text-center">
                  <p className="text-sm text-slate-400 mb-2">
                    คุณไม่มีสิทธิ์เข้าถึง Admin Dashboard
                  </p>
                  <p className="text-xs text-slate-500">
                    เฉพาะผู้ดูแลระบบเท่านั้น
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  <Link href="/admin/login">
                    <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg shadow-lg shadow-orange-500/25 transition-all duration-300">
                      เข้าสู่ระบบด้วยรหัส
                      <Lock className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a href={getLoginUrl()}>
                    <Button variant="outline" className="w-full h-10 border-orange-600/50 text-orange-400 hover:bg-orange-600/10 hover:border-orange-500">
                      เข้าสู่ระบบด้วย Manus Account
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container pb-12">
        <div className="bg-gradient-to-r from-violet-900/30 via-purple-900/30 to-fuchsia-900/30 border border-violet-600/40 rounded-2xl p-6 max-w-2xl mx-auto text-center backdrop-blur-sm hover:border-violet-500/60 transition-all duration-300">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Eye className="h-6 w-6 text-violet-400" />
            <h3 className="text-xl font-bold text-white">ดูตัวอย่างการทำงาน</h3>
          </div>
          <p className="text-slate-400 mb-4">
            สำรวจฟีเจอร์ทั้งหมดของระบบพร้อมข้อมูลจำลองแบบ Interactive ก่อนตัดสินใจใช้งาน
          </p>
          <Link href="/demo">
            <Button data-tour="demo-button" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25">
              <Play className="mr-2 h-4 w-4" />
              เข้าสู่โหมดสาธิต
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          เครื่องมือวิเคราะห์ระดับนิติวิทยาศาสตร์
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card className="bg-slate-900/60 border-orange-800/30 text-center p-4 backdrop-blur-sm hover:border-orange-600/50 transition-all duration-300 group">
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">α</div>
            <div className="text-slate-300 text-xs font-medium">Vote Stuffing</div>
            <div className="text-orange-400/60 text-xs mt-1">Klimek Model</div>
          </Card>
          <Card className="bg-slate-900/60 border-amber-800/30 text-center p-4 backdrop-blur-sm hover:border-amber-600/50 transition-all duration-300 group">
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">2BL</div>
            <div className="text-slate-300 text-xs font-medium">Benford's Law</div>
            <div className="text-amber-400/60 text-xs mt-1">ตัวเลขผิดปกติ</div>
          </Card>
          <Card className="bg-slate-900/60 border-cyan-800/30 text-center p-4 backdrop-blur-sm hover:border-cyan-600/50 transition-all duration-300 group">
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">SNA</div>
            <div className="text-slate-300 text-xs font-medium">Network Analysis</div>
            <div className="text-cyan-400/60 text-xs mt-1">หัวคะแนน</div>
          </Card>
          <Card className="bg-slate-900/60 border-emerald-800/30 text-center p-4 backdrop-blur-sm hover:border-emerald-600/50 transition-all duration-300 group">
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">PVT</div>
            <div className="text-slate-300 text-xs font-medium">Parallel Vote</div>
            <div className="text-emerald-400/60 text-xs mt-1">นับคู่ขนาน</div>
          </Card>
        </div>
      </section>

      {/* Quick Links for Volunteers */}
      <section className="container pb-20">
        <div className="bg-slate-900/60 border border-orange-800/30 rounded-2xl p-6 max-w-2xl mx-auto backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-orange-400" />
            สำหรับอาสาสมัคร
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href="/volunteer/register">
              <Button variant="outline" className="w-full justify-start border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-600">
                <Smartphone className="mr-2 h-4 w-4 text-emerald-400" />
                ลงทะเบียนอาสาสมัครใหม่
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="w-full justify-start border-cyan-700/50 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-600">
                <Users className="mr-2 h-4 w-4 text-cyan-400" />
                คู่มือการใช้งาน
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button data-tour="how-it-works" variant="outline" className="w-full justify-start border-orange-700/50 text-orange-300 hover:bg-orange-900/30 hover:border-orange-600">
                <Shield className="mr-2 h-4 w-4 text-orange-400" />
                วิธีการทำงานของระบบ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orange-900/30 py-8 bg-slate-950/50">
        <div className="container text-center">
          <p className="text-slate-400 text-sm">Anti-Rigging War Room - Election Forensics System</p>
          <p className="mt-2 text-orange-400/50 text-xs">Powered by Klimek Model, Benford's Law & Social Network Analysis</p>
        </div>
      </footer>
    </div>
  );
}
