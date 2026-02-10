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
  TrendingUp,
  FileSearch,
  AlertCircle
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Shield className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            <span className="text-base md:text-xl font-bold text-white">Anti-Rigging War Room</span>
          </div>
          <nav className="flex items-center gap-2 md:gap-4">
            {loading ? (
              <div className="h-9 w-20 md:w-24 bg-slate-800 animate-pulse rounded-md" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm text-slate-300">{user?.name}</span>
                  <span className="text-xs text-slate-500">
                    {isAdmin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                  </span>
                </div>
                {isAdmin && (
                  <Link href="/admin">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      Dashboard
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
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  <Lock className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Admin </span>Login
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16 px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="text-xs md:text-sm font-medium text-red-400">ระบบป้องกันการทุจริตการเลือกตั้ง</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            ปกป้องเสียงของคุณ
            <br />
            <span className="text-red-500">ด้วยพลังข้อมูล</span>
          </h1>
          <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            ระบบนับคะแนนคู่ขนาน (PVT) ผสานเครื่องมือวิเคราะห์นิติวิทยาศาสตร์ 
            <span className="hidden md:inline"><br /></span>
            Klimek Model, Benford's Law และ Social Network Analysis 
            เพื่อตรวจจับความผิดปกติแบบ Real-time
          </p>
        </div>

        {/* Two Main Entry Points */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto px-4">
          {/* Volunteer Card */}
          <Card className="bg-gradient-to-br from-green-900/30 to-green-950/50 border-green-800/50 hover:border-green-600/50 transition-all group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="h-8 w-8 md:h-10 md:w-10 text-green-500" />
              </div>
              <CardTitle className="text-xl md:text-2xl text-white">อาสาสมัคร</CardTitle>
              <CardDescription className="text-slate-400 text-sm md:text-base">
                ส่งผลคะแนนจากหน่วยเลือกตั้งของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-xs md:text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>ไม่ต้องสมัครสมาชิก ใช้รหัส 6 หลัก</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>ถ่ายรูปกระดานนับคะแนน ระบบอ่านให้</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>ส่งข้อมูลแบบ Real-time</span>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <Link href="/volunteer/register">
                  <Button className="w-full h-11 md:h-12 bg-green-600 hover:bg-green-700 text-white text-base md:text-lg">
                    ลงทะเบียนรับรหัสทันที
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </Link>
                <Link href="/volunteer/login">
                  <Button variant="outline" className="w-full h-10 border-green-600/50 text-green-400 hover:bg-green-600/10 text-sm md:text-base">
                    มีรหัสแล้ว? เข้าสู่ระบบ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="bg-gradient-to-br from-red-900/30 to-red-950/50 border-red-800/50 hover:border-red-600/50 transition-all group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 md:h-10 md:w-10 text-red-500" />
              </div>
              <CardTitle className="text-xl md:text-2xl text-white">ผู้ดูแลระบบ</CardTitle>
              <CardDescription className="text-slate-400 text-sm md:text-base">
                วิเคราะห์ข้อมูลและจัดการอาสาสมัคร
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-xs md:text-sm text-slate-300">
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
                  <Button className="w-full h-11 md:h-12 bg-red-600 hover:bg-red-700 text-white text-base md:text-lg mt-4">
                    เข้าสู่ Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
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
                  <Button className="w-full h-11 md:h-12 bg-red-600 hover:bg-red-700 text-white text-base md:text-lg mt-4">
                    เข้าสู่ระบบ Admin
                    <Lock className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container pb-16 md:pb-20 px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            เครื่องมือวิเคราะห์ระดับนิติวิทยาศาสตร์
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            เทคโนโลยีตรวจจับการทุจริตที่ได้รับการยอมรับในระดับสากล
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-red-900/20 to-red-950/30 border-red-800/30 hover:border-red-600/50 transition-all text-center p-4 md:p-6 group cursor-default">
            <div className="text-3xl md:text-4xl font-bold text-red-500 mb-2 group-hover:scale-110 transition-transform">α</div>
            <div className="text-slate-300 text-sm md:text-base font-medium">Klimek Model</div>
            <div className="text-slate-500 text-xs mt-2">ตรวจจับ Vote Stuffing</div>
          </Card>
          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-950/30 border-orange-800/30 hover:border-orange-600/50 transition-all text-center p-4 md:p-6 group cursor-default">
            <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2 group-hover:scale-110 transition-transform">2BL</div>
            <div className="text-slate-300 text-sm md:text-base font-medium">Benford's Law</div>
            <div className="text-slate-500 text-xs mt-2">วิเคราะห์ตัวเลขผิดปกติ</div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/30 border-blue-800/30 hover:border-blue-600/50 transition-all text-center p-4 md:p-6 group cursor-default">
            <div className="text-3xl md:text-4xl font-bold text-blue-500 mb-2 group-hover:scale-110 transition-transform">SNA</div>
            <div className="text-slate-300 text-sm md:text-base font-medium">Network Analysis</div>
            <div className="text-slate-500 text-xs mt-2">ค้นหาหัวคะแนน</div>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/20 to-green-950/30 border-green-800/30 hover:border-green-600/50 transition-all text-center p-4 md:p-6 group cursor-default">
            <div className="text-3xl md:text-4xl font-bold text-green-500 mb-2 group-hover:scale-110 transition-transform">PVT</div>
            <div className="text-slate-300 text-sm md:text-base font-medium">Parallel Vote</div>
            <div className="text-slate-500 text-xs mt-2">นับคะแนนคู่ขนาน</div>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container pb-16 md:pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              วิธีการทำงาน
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              ระบบแบ่งออกเป็น 3 ขั้นตอนหลัก
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <Card className="bg-slate-900/50 border-slate-800 p-6 relative overflow-hidden hover:border-green-600/50 transition-all">
              <div className="absolute top-4 right-4 text-6xl font-bold text-slate-800/50">1</div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">รวบรวมข้อมูล</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  อาสาสมัครถ่ายภาพกระดานนับคะแนน AI อ่านตัวเลขอัตโนมัติ ส่งข้อมูลแบบ Real-time
                </p>
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="bg-slate-900/50 border-slate-800 p-6 relative overflow-hidden hover:border-red-600/50 transition-all">
              <div className="absolute top-4 right-4 text-6xl font-bold text-slate-800/50">2</div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">วิเคราะห์</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  ระบบประมวลผลด้วย Klimek Model, Benford's Law และ Network Analysis หาความผิดปกติ
                </p>
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="bg-slate-900/50 border-slate-800 p-6 relative overflow-hidden hover:border-yellow-600/50 transition-all">
              <div className="absolute top-4 right-4 text-6xl font-bold text-slate-800/50">3</div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">แจ้งเตือน</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  ส่งการแจ้งเตือนทันทีผ่าน Discord/LINE เมื่อพบความผิดปกติ พร้อมหลักฐานรายงาน
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Links CTA */}
      <section className="container pb-16 md:pb-20 px-4">
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Camera className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              เริ่มต้นใช้งานเลย
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
            <Link href="/volunteer/register">
              <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white justify-start">
                <Smartphone className="mr-2 h-5 w-5" />
                ลงทะเบียนอาสาสมัครใหม่
              </Button>
            </Link>
            <Link href="/volunteer/login">
              <Button variant="outline" className="w-full h-12 border-green-600/50 text-green-400 hover:bg-green-600/10 justify-start">
                <Lock className="mr-2 h-5 w-5" />
                เข้าสู่ระบบด้วยรหัส
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="w-full h-12 border-slate-700 text-slate-300 hover:bg-slate-800 justify-start">
                <FileSearch className="mr-2 h-5 w-5 text-blue-500" />
                คู่มือการใช้งาน
              </Button>
            </Link>
            <a href={getLoginUrl()}>
              <Button variant="outline" className="w-full h-12 border-slate-700 text-slate-300 hover:bg-slate-800 justify-start">
                <Shield className="mr-2 h-5 w-5 text-red-500" />
                Admin Dashboard
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50">
        <div className="container py-8 md:py-12 px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                <Shield className="h-5 w-5 text-red-500" />
                <span className="font-semibold text-white">Anti-Rigging War Room</span>
              </div>
              <p className="text-sm text-slate-400">
                ระบบตรวจจับการทุจริตการเลือกตั้ง<br />ด้วยวิทยาศาสตร์ข้อมูล
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">เครื่องมือ</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Klimek Model</li>
                <li>Benford's Law</li>
                <li>Network Analysis</li>
                <li>Parallel Vote Tabulation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">สำหรับผู้ใช้งาน</h4>
              <ul className="space-y-2 text-sm">
                <Link href="/volunteer/register">
                  <li className="text-green-400 hover:text-green-300 cursor-pointer">ลงทะเบียนอาสาสมัคร</li>
                </Link>
                <Link href="/help">
                  <li className="text-slate-400 hover:text-slate-300 cursor-pointer">คู่มือการใช้งาน</li>
                </Link>
                <a href={getLoginUrl()}>
                  <li className="text-red-400 hover:text-red-300 cursor-pointer">Admin Login</li>
                </a>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © 2026 Anti-Rigging War Room. ระบบปกป้องประชาธิปไตยด้วยข้อมูล
          </div>
        </div>
      </footer>
    </div>
  );
}
