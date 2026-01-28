import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { 
  MapPin, 
  AlertTriangle, 
  Activity,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: stats, isLoading, refetch } = trpc.dashboard.stats.useQuery();
  const { data: alerts } = trpc.dashboard.alerts.useQuery();
  const { data: pvtStats } = trpc.pvt.compare.useQuery();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              ยินดีต้อนรับ, {user?.name}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-xs text-slate-500 mt-1">หน่วยทั้งหมดในระบบ</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                การแจ้งเตือน
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : stats?.totalAlerts || 0}
              </div>
              <p className="text-xs text-red-400 mt-1">
                {stats?.unresolvedAlerts || 0} รอตรวจสอบ
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                ข้อมูลที่รายงาน
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : (pvtStats?.crowdsourcedCount || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">จำนวนข้อมูลจากอาสาสมัคร</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                ข้อมูลทางการ
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : (pvtStats?.officialCount || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">จำนวนข้อมูลทางการ</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                ดำเนินการด่วน
              </CardTitle>
              <CardDescription className="text-slate-400">
                เข้าถึงฟีเจอร์ที่ใช้บ่อย
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/realtime">
                <Button className="w-full justify-between bg-slate-800 hover:bg-slate-700 text-white">
                  <span className="flex items-center">
                    <Activity className="mr-2 h-4 w-4 text-green-500" />
                    Real-time Dashboard
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin/batch-ocr">
                <Button className="w-full justify-between bg-slate-800 hover:bg-slate-700 text-white">
                  <span className="flex items-center">
                    <Activity className="mr-2 h-4 w-4 text-purple-500" />
                    Batch OCR
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin/volunteer-codes">
                <Button className="w-full justify-between bg-slate-800 hover:bg-slate-700 text-white">
                  <span className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-blue-500" />
                    จัดการรหัสอาสาสมัคร
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin/import">
                <Button className="w-full justify-between bg-slate-800 hover:bg-slate-700 text-white">
                  <span className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-orange-500" />
                    นำเข้าข้อมูล
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
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
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.createdAt).toLocaleString('th-TH')}
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
              <Link href="/admin/alerts">
                <Button variant="outline" className="w-full mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
                  ดูทั้งหมด
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* PVT Summary */}
        {pvtStats && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">สรุป PVT (Parallel Vote Tabulation)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {pvtStats.crowdsourcedTotal?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">คะแนนที่เรานับ</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">
                    {pvtStats.officialTotal?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">คะแนนทางการ</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className={`text-2xl font-bold ${
                    (pvtStats.gap || 0) > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {pvtStats.gap?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">ส่วนต่าง</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-500">
                    {pvtStats.gapPercent?.toFixed(1) || 0}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">ส่วนต่าง (%)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
