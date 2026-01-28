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
  LogOut
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-500" />
            <span className="text-xl font-bold text-white">Anti-Rigging War Room</span>
          </div>
          <nav className="flex items-center gap-4">
            {loading ? (
              <div className="h-9 w-24 bg-slate-800 animate-pulse rounded-md" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm text-slate-300">{user?.name}</span>
                  <span className="text-xs text-slate-500">
                    {isAdmin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                  </span>
                </div>
                {isAdmin && (
                  <Link href="/admin">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      เข้า Dashboard
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={logout}
                  className="text-slate-400 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  <Lock className="mr-2 h-4 w-4" />
                  Admin Login
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ระบบตรวจจับการทุจริต
            <span className="text-red-500"> การเลือกตั้ง</span>
          </h1>
          <p className="text-lg text-slate-400">
            ร่วมเป็นส่วนหนึ่งในการปกป้องประชาธิปไตย ด้วยระบบนับคะแนนคู่ขนาน (PVT) 
            และเครื่องมือวิเคราะห์ทางสถิติระดับนิติวิทยาศาสตร์
          </p>
        </div>

        {/* Two Main Entry Points */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Volunteer Card */}
          <Card className="bg-gradient-to-br from-green-900/30 to-green-950/50 border-green-800/50 hover:border-green-600/50 transition-all group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="h-10 w-10 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-white">อาสาสมัคร</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                ส่งผลคะแนนจากหน่วยเลือกตั้งของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>ไม่ต้องสมัครสมาชิก ใช้รหัส 6 หลัก</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>ถ่ายรูปกระดานนับคะแนน ระบบอ่านตัวเลขให้</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>ส่งข้อมูลแบบ Real-time</span>
                </div>
              </div>
              <Link href="/volunteer/login">
                <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-lg mt-4">
                  เข้าด้วยรหัสอาสาสมัคร
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="bg-gradient-to-br from-red-900/30 to-red-950/50 border-red-800/50 hover:border-red-600/50 transition-all group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-10 w-10 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-white">ผู้ดูแลระบบ</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                วิเคราะห์ข้อมูลและจัดการอาสาสมัคร
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-red-500 shrink-0" />
                  <span>Dashboard แบบ Real-time</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-red-500 shrink-0" />
                  <span>Klimek Model, Benford's Law, SNA</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-red-500 shrink-0" />
                  <span>แจ้งเตือนผ่าน Discord/LINE</span>
                </div>
              </div>
              {isAdmin ? (
                <Link href="/admin">
                  <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-lg mt-4">
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
                <a href={getLoginUrl()}>
                  <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-lg mt-4">
                    เข้าสู่ระบบ Admin
                    <Lock className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          เครื่องมือวิเคราะห์ระดับนิติวิทยาศาสตร์
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card className="bg-slate-900/50 border-slate-800 text-center p-4">
            <div className="text-3xl font-bold text-red-500 mb-2">α</div>
            <div className="text-slate-400 text-xs">Vote Stuffing</div>
            <div className="text-slate-500 text-xs mt-1">Klimek Model</div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 text-center p-4">
            <div className="text-3xl font-bold text-orange-500 mb-2">2BL</div>
            <div className="text-slate-400 text-xs">Benford's Law</div>
            <div className="text-slate-500 text-xs mt-1">ตัวเลขผิดปกติ</div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 text-center p-4">
            <div className="text-3xl font-bold text-blue-500 mb-2">SNA</div>
            <div className="text-slate-400 text-xs">Network Analysis</div>
            <div className="text-slate-500 text-xs mt-1">หัวคะแนน</div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 text-center p-4">
            <div className="text-3xl font-bold text-green-500 mb-2">PVT</div>
            <div className="text-slate-400 text-xs">Parallel Vote</div>
            <div className="text-slate-500 text-xs mt-1">นับคู่ขนาน</div>
          </Card>
        </div>
      </section>

      {/* Quick Links for Volunteers */}
      <section className="container pb-20">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-green-500" />
            สำหรับอาสาสมัคร
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href="/volunteer/login">
              <Button variant="outline" className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800">
                <Smartphone className="mr-2 h-4 w-4 text-green-500" />
                เข้าระบบด้วยรหัส 6 หลัก
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800">
                <Users className="mr-2 h-4 w-4 text-blue-500" />
                คู่มือการใช้งาน
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container text-center text-slate-500 text-sm">
          <p>Anti-Rigging War Room - Election Forensics System</p>
          <p className="mt-2">Powered by Klimek Model, Benford's Law & Social Network Analysis</p>
        </div>
      </footer>
    </div>
  );
}
