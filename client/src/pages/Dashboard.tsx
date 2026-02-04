import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Shield, 
  MapPin, 
  AlertTriangle, 
  Camera, 
  BarChart3,
  Network,
  Activity,
  ArrowLeft,
  Upload,
  FileText,
  Map,
  Users,
  Smartphone,
  Settings,
  Scan,
  Layers,
  Sparkles
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: alerts } = trpc.dashboard.alerts.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-orange-900/30 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-orange-400 hover:bg-orange-900/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="relative">
              <Shield className="h-8 w-8 text-orange-500" />
              <Sparkles className="h-3 w-3 text-orange-400 absolute -top-1 -right-1" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              War Room Dashboard
            </span>
          </div>
          {user && (
            <div className="text-slate-300 text-sm px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
              {user.name || user.email}
            </div>
          )}
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/60 border-cyan-800/30 backdrop-blur-sm hover:border-cyan-600/50 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                หน่วยเลือกตั้ง
              </CardTitle>
              <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                <MapPin className="h-4 w-4 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {isLoading ? "..." : stats?.totalStations || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-amber-800/30 backdrop-blur-sm hover:border-amber-600/50 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                การแจ้งเตือนทั้งหมด
              </CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                {isLoading ? "..." : stats?.totalAlerts || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-orange-800/30 backdrop-blur-sm hover:border-orange-600/50 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                รอตรวจสอบ
              </CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <Activity className="h-4 w-4 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                {isLoading ? "..." : stats?.unresolvedAlerts || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-emerald-800/30 backdrop-blur-sm hover:border-emerald-600/50 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                หลักฐานภาพถ่าย
              </CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <Camera className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                {isLoading ? "..." : stats?.totalEvidence || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900/60 border-orange-800/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="p-1.5 bg-orange-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-400" />
                </div>
                การวิเคราะห์ทางสถิติ
              </CardTitle>
              <CardDescription className="text-slate-400">
                เครื่องมือตรวจจับการทุจริตด้วยคณิตศาสตร์
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/klimek">
                <Button className="w-full justify-start bg-slate-800/80 hover:bg-orange-900/30 hover:border-orange-600/50 text-white border border-slate-700/50 transition-all duration-300">
                  <BarChart3 className="mr-2 h-4 w-4 text-orange-400" />
                  Klimek Model (Election Fingerprint)
                </Button>
              </Link>
              <Link href="/benford">
                <Button className="w-full justify-start bg-slate-800/80 hover:bg-amber-900/30 hover:border-amber-600/50 text-white border border-slate-700/50 transition-all duration-300">
                  <Activity className="mr-2 h-4 w-4 text-amber-400" />
                  Benford's Law Analysis
                </Button>
              </Link>
              <Link href="/network">
                <Button className="w-full justify-start bg-slate-800/80 hover:bg-cyan-900/30 hover:border-cyan-600/50 text-white border border-slate-700/50 transition-all duration-300">
                  <Network className="mr-2 h-4 w-4 text-cyan-400" />
                  Social Network Analysis
                </Button>
              </Link>
              <Link href="/spatial">
                <Button className="w-full justify-start bg-slate-800/80 hover:bg-emerald-900/30 hover:border-emerald-600/50 text-white border border-slate-700/50 transition-all duration-300">
                  <Map className="mr-2 h-4 w-4 text-emerald-400" />
                  Z-Score Spatial Map
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-amber-800/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                การแจ้งเตือนล่าสุด
              </CardTitle>
              <CardDescription className="text-slate-400">
                ความผิดปกติที่ตรวจพบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts && alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-orange-600/30 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                          alert.severity === 'high' ? 'bg-orange-500 shadow-lg shadow-orange-500/50' :
                          alert.severity === 'medium' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' : 'bg-cyan-500 shadow-lg shadow-cyan-500/50'
                        }`} />
                        <div>
                          <div className="text-sm text-white font-medium">
                            {alert.alertType.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-400">
                            {alert.description?.slice(0, 50)}...
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  ยังไม่มีการแจ้งเตือน
                </div>
              )}
              <Link href="/alerts">
                <Button variant="outline" className="w-full mt-4 border-orange-700/50 text-orange-300 hover:bg-orange-900/30 hover:border-orange-600 transition-all duration-300">
                  ดูทั้งหมด
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Volunteer Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/ocr">
            <Card className="bg-slate-900/60 border-violet-800/30 hover:border-violet-500/50 transition-all duration-300 cursor-pointer h-full backdrop-blur-sm hover:shadow-xl hover:shadow-violet-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-xl">
                    <Scan className="h-8 w-8 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">OCR Scanner</h3>
                    <p className="text-sm text-slate-400">อ่านตัวเลขจากกระดานนับคะแนนด้วย AI</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/batch-ocr">
            <Card className="bg-slate-900/60 border-indigo-800/30 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer h-full backdrop-blur-sm hover:shadow-xl hover:shadow-indigo-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-xl">
                    <Layers className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Batch OCR</h3>
                    <p className="text-sm text-slate-400">สแกนหลายภาพพร้อมกัน</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/volunteer">
            <Card className="bg-slate-900/60 border-emerald-800/30 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer h-full backdrop-blur-sm hover:shadow-xl hover:shadow-emerald-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl">
                    <Smartphone className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Mobile App อาสาสมัคร</h3>
                    <p className="text-sm text-slate-400">ถ่ายรูปและส่งผลคะแนนแบบ Real-time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/volunteers">
            <Card className="bg-slate-900/60 border-cyan-800/30 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer h-full backdrop-blur-sm hover:shadow-xl hover:shadow-cyan-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl">
                    <Users className="h-8 w-8 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">จัดการอาสาสมัคร</h3>
                    <p className="text-sm text-slate-400">อนุมัติและตรวจสอบรายงาน</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Admin Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/import">
            <Card className="bg-slate-900/60 border-teal-800/30 hover:border-teal-500/50 transition-all duration-300 cursor-pointer h-full backdrop-blur-sm hover:shadow-xl hover:shadow-teal-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-teal-500/20 to-cyan-600/20 rounded-xl">
                    <Upload className="h-8 w-8 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">นำเข้าข้อมูล</h3>
                    <p className="text-sm text-slate-400">Import CSV/Excel จาก กกต.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/export">
            <Card className="bg-slate-900/60 border-purple-800/30 hover:border-purple-500/50 transition-all duration-300 cursor-pointer h-full backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-fuchsia-600/20 rounded-xl">
                    <FileText className="h-8 w-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Export รายงาน</h3>
                    <p className="text-sm text-slate-400">รายงานนิติวิทยาศาสตร์สำหรับศาล</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/pvt">
            <Card className="bg-slate-900/60 border-amber-800/30 hover:border-amber-500/50 transition-all duration-300 cursor-pointer h-full backdrop-blur-sm hover:shadow-xl hover:shadow-amber-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-xl">
                    <Activity className="h-8 w-8 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">PVT Comparison</h3>
                    <p className="text-sm text-slate-400">เปรียบเทียบผลนับคู่ขนาน</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Settings Link */}
        <div className="mb-8">
          <Link href="/settings">
            <Card className="bg-slate-900/60 border-orange-800/30 hover:border-orange-500/50 transition-all duration-300 cursor-pointer backdrop-blur-sm hover:shadow-xl hover:shadow-orange-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500/20 to-amber-600/20 rounded-xl">
                    <Settings className="h-8 w-8 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">ตั้งค่าระบบ</h3>
                    <p className="text-sm text-slate-400">Discord Webhook, LINE Notify, QR Code</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Analysis Summary - Admin Only */}
        {isAdmin && (
          <Card className="bg-slate-900/60 border-orange-800/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-400" />
                สูตรการวิเคราะห์ที่ใช้
              </CardTitle>
              <CardDescription className="text-slate-400">
                Forensic Mathematics for Election Fraud Detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-orange-900/30 to-orange-950/50 rounded-xl border border-orange-700/30">
                  <div className="text-orange-400 font-mono text-lg mb-2">α (Alpha)</div>
                  <div className="text-slate-300 text-sm">
                    Vote Stuffing Coefficient - ตรวจจับการยัดบัตร
                  </div>
                  <div className="text-xs text-orange-400/60 mt-2">
                    ถ้า α {">"} 0.05 = ทุจริต
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-900/30 to-amber-950/50 rounded-xl border border-amber-700/30">
                  <div className="text-amber-400 font-mono text-lg mb-2">β (Beta)</div>
                  <div className="text-slate-300 text-sm">
                    Vote Stealing Coefficient - ตรวจจับการขโมยคะแนน
                  </div>
                  <div className="text-xs text-amber-400/60 mt-2">
                    ถ้า β {">"} 0.2 = ทุจริต
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-cyan-900/30 to-cyan-950/50 rounded-xl border border-cyan-700/30">
                  <div className="text-cyan-400 font-mono text-lg mb-2">2BL</div>
                  <div className="text-slate-300 text-sm">
                    Second Digit Benford's Law - ตรวจจับตัวเลขปลอม
                  </div>
                  <div className="text-xs text-cyan-400/60 mt-2">
                    Chi-square {">"} 16.92 = ทุจริต
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 rounded-xl border border-emerald-700/30">
                  <div className="text-emerald-400 font-mono text-lg mb-2">Z-Score</div>
                  <div className="text-slate-300 text-sm">
                    Spatial Correlation - ตรวจจับความผิดปกติเชิงพื้นที่
                  </div>
                  <div className="text-xs text-emerald-400/60 mt-2">
                    |Z| {">"} 2.5 = ทุจริต
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
