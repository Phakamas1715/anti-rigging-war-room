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
  Scan
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: alerts } = trpc.dashboard.alerts.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Shield className="h-8 w-8 text-red-500" />
            <span className="text-xl font-bold text-white">War Room Dashboard</span>
          </div>
          {user && (
            <div className="text-slate-400 text-sm">
              {user.name || user.email}
            </div>
          )}
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                หน่วยเลือกตั้ง
              </CardTitle>
              <MapPin className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : stats?.totalStations || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                การแจ้งเตือนทั้งหมด
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : stats?.totalAlerts || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                รอตรวจสอบ
              </CardTitle>
              <Activity className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {isLoading ? "..." : stats?.unresolvedAlerts || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                หลักฐานภาพถ่าย
              </CardTitle>
              <Camera className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : stats?.totalEvidence || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-red-500" />
                การวิเคราะห์ทางสถิติ
              </CardTitle>
              <CardDescription className="text-slate-400">
                เครื่องมือตรวจจับการทุจริตด้วยคณิตศาสตร์
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/klimek">
                <Button className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white">
                  <BarChart3 className="mr-2 h-4 w-4 text-red-500" />
                  Klimek Model (Election Fingerprint)
                </Button>
              </Link>
              <Link href="/benford">
                <Button className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white">
                  <Activity className="mr-2 h-4 w-4 text-orange-500" />
                  Benford's Law Analysis
                </Button>
              </Link>
              <Link href="/network">
                <Button className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white">
                  <Network className="mr-2 h-4 w-4 text-blue-500" />
                  Social Network Analysis
                </Button>
              </Link>
              <Link href="/spatial">
                <Button className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white">
                  <Map className="mr-2 h-4 w-4 text-green-500" />
                  Z-Score Spatial Map
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
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
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'high' ? 'bg-orange-500' :
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
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
                      <span className={`text-xs px-2 py-1 rounded ${
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
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
                <Button variant="outline" className="w-full mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
                  ดูทั้งหมด
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Volunteer Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/ocr">
            <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Scan className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">OCR Scanner</h3>
                    <p className="text-sm text-slate-400">อ่านตัวเลขจากกระดานนับคะแนนด้วย AI</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/volunteer">
            <Card className="bg-slate-900/50 border-slate-800 hover:border-green-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Smartphone className="h-8 w-8 text-green-500" />
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
            <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="h-8 w-8 text-blue-500" />
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
            <Card className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 rounded-lg">
                    <Upload className="h-8 w-8 text-cyan-500" />
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
            <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <FileText className="h-8 w-8 text-purple-500" />
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
            <Card className="bg-slate-900/50 border-slate-800 hover:border-yellow-500/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Activity className="h-8 w-8 text-yellow-500" />
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
            <Card className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-lg">
                    <Settings className="h-8 w-8 text-indigo-500" />
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

        {/* Analysis Summary */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">สูตรการวิเคราะห์ที่ใช้</CardTitle>
            <CardDescription className="text-slate-400">
              Forensic Mathematics for Election Fraud Detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-red-500 font-mono text-lg mb-2">α (Alpha)</div>
                <div className="text-slate-400 text-sm">
                  Vote Stuffing Coefficient - ตรวจจับการยัดบัตร
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  ถ้า α {">"} 0.05 = ทุจริต
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-orange-500 font-mono text-lg mb-2">β (Beta)</div>
                <div className="text-slate-400 text-sm">
                  Vote Stealing Coefficient - ตรวจจับการขโมยคะแนน
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  ถ้า β {">"} 0.2 = ทุจริต
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-blue-500 font-mono text-lg mb-2">2BL</div>
                <div className="text-slate-400 text-sm">
                  Second Digit Benford's Law - ตรวจจับตัวเลขปลอม
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Chi-square {">"} 16.92 = ทุจริต
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-green-500 font-mono text-lg mb-2">Z-Score</div>
                <div className="text-slate-400 text-sm">
                  Spatial Correlation - ตรวจจับความผิดปกติเชิงพื้นที่
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  |Z| {">"} 2.5 = ทุจริต
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
