import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  TrendingUp, 
  MapPin, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Eye,
  Download,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

// Auto-refresh interval in milliseconds
const REFRESH_INTERVAL = 30000;

export default function RealTimeDashboard() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const utils = trpc.useUtils();

  // Queries
  const { data: overviewStats, isLoading: statsLoading, refetch: refetchStats } = 
    trpc.realtime.overview.useQuery(undefined, {
      refetchInterval: autoRefresh ? REFRESH_INTERVAL : false,
    });

  const { data: recentSubmissions, refetch: refetchSubmissions } = 
    trpc.realtime.recentSubmissions.useQuery({ limit: 10 }, {
      refetchInterval: autoRefresh ? REFRESH_INTERVAL : false,
    });

  const { data: gapAlerts, refetch: refetchGaps } = 
    trpc.realtime.gapAlerts.useQuery({ limit: 5 }, {
      refetchInterval: autoRefresh ? REFRESH_INTERVAL : false,
    });

  const { data: candidateVotes } = 
    trpc.realtime.candidateVotes.useQuery(undefined, {
      refetchInterval: autoRefresh ? REFRESH_INTERVAL : false,
    });

  const { data: provinceStats } = 
    trpc.realtime.provinceStats.useQuery(undefined, {
      refetchInterval: autoRefresh ? REFRESH_INTERVAL : false,
    });

  // Manual refresh
  const handleRefresh = async () => {
    setLastUpdate(new Date());
    await Promise.all([
      refetchStats(),
      refetchSubmissions(),
      refetchGaps(),
    ]);
    toast.success('อัปเดตข้อมูลแล้ว');
  };

  // Update last update time when data changes
  useEffect(() => {
    if (overviewStats) {
      setLastUpdate(new Date());
    }
  }, [overviewStats]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('th-TH', { 
      day: '2-digit',
      month: 'short',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const coveragePercent = overviewStats 
    ? Math.round((overviewStats.stationsReported / Math.max(overviewStats.totalStations, 1)) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-red-500" />
              Real-time Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              อัปเดตล่าสุด: {formatTime(lastUpdate)}
              {autoRefresh && <span className="text-green-400 ml-2">(Auto-refresh ทุก 30 วินาที)</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Zap className="w-4 h-4 mr-2" />
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Votes (Our Data) */}
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-300 uppercase tracking-wide">คะแนนที่เรานับได้</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? '...' : formatNumber(overviewStats?.ourTotalVotes || 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Official Votes */}
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-300 uppercase tracking-wide">คะแนนทางการ</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? '...' : formatNumber(overviewStats?.officialTotalVotes || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stations Reported */}
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-300 uppercase tracking-wide">หน่วยที่รายงาน</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? '...' : `${overviewStats?.stationsReported || 0}/${overviewStats?.totalStations || 0}`}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <MapPin className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gaps Detected */}
          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-300 uppercase tracking-wide">พบ Gap</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {statsLoading ? '...' : overviewStats?.gapsDetected || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coverage Progress */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              ความครอบคลุมการรายงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {overviewStats?.stationsReported || 0} จาก {overviewStats?.totalStations || 0} หน่วย
                </span>
                <span className="text-white font-bold">{coveragePercent}%</span>
              </div>
              <Progress value={coveragePercent} className="h-3" />
              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">{overviewStats?.stationsReported || 0}</p>
                  <p className="text-xs text-slate-400">รายงานแล้ว</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-400">
                    {(overviewStats?.totalStations || 0) - (overviewStats?.stationsReported || 0)}
                  </p>
                  <p className="text-xs text-slate-400">รอรายงาน</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">{overviewStats?.gapsDetected || 0}</p>
                  <p className="text-xs text-slate-400">พบความแตกต่าง</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                รายงานล่าสุด
              </CardTitle>
              <CardDescription>10 รายการล่าสุดที่ส่งเข้ามา</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSubmissions && recentSubmissions.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentSubmissions.map((sub, idx) => (
                    <div 
                      key={sub.id || idx}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          sub.hasGap ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-white">{sub.stationCode}</p>
                          <p className="text-xs text-slate-400">{sub.province}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white font-mono">{formatNumber(sub.totalVotes)}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(sub.submittedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีรายงาน</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gap Alerts */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Gap Alerts
              </CardTitle>
              <CardDescription>หน่วยที่พบความแตกต่างระหว่างข้อมูล</CardDescription>
            </CardHeader>
            <CardContent>
              {gapAlerts && gapAlerts.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {gapAlerts.map((gap, idx) => (
                    <div 
                      key={gap.stationId || idx}
                      className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{gap.stationCode}</span>
                        <Badge className={`${
                          Math.abs(gap.gapAmount) > 100 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}>
                          Gap: {gap.gapAmount > 0 ? '+' : ''}{formatNumber(gap.gapAmount)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">เรานับได้:</span>
                          <span className="text-white ml-2">{formatNumber(gap.ourSum)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">ทางการ:</span>
                          <span className="text-white ml-2">{formatNumber(gap.theirSum)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p>ไม่พบความแตกต่าง</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Candidate Votes Summary */}
        {candidateVotes && candidateVotes.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                สรุปคะแนนรายผู้สมัคร
              </CardTitle>
              <CardDescription>ข้อมูลจากการนับคู่ขนาน (PVT)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {candidateVotes.map((candidate, idx) => {
                  const colors = [
                    'from-blue-600 to-blue-800',
                    'from-red-600 to-red-800',
                    'from-orange-600 to-orange-800',
                    'from-green-600 to-green-800',
                    'from-purple-600 to-purple-800',
                  ];
                  const totalVotes = candidateVotes.reduce((sum, c) => sum + c.votes, 0);
                  const percent = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : '0';
                  
                  return (
                    <div 
                      key={candidate.candidateId || idx}
                      className={`p-4 rounded-lg bg-gradient-to-br ${colors[idx % colors.length]}`}
                    >
                      <p className="text-white/80 text-sm truncate">{candidate.candidateName}</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(candidate.votes)}</p>
                      <p className="text-white/60 text-sm">{percent}%</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Province Stats */}
        {provinceStats && provinceStats.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-500" />
                ความครอบคลุมรายจังหวัด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {provinceStats.slice(0, 12).map((prov, idx) => {
                  const coverage = prov.totalStations > 0 
                    ? Math.round((prov.reportedStations / prov.totalStations) * 100)
                    : 0;
                  
                  return (
                    <div 
                      key={prov.province || idx}
                      className="p-3 bg-slate-700/50 rounded-lg"
                    >
                      <p className="text-sm font-medium text-white truncate">{prov.province}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-400">
                          {prov.reportedStations}/{prov.totalStations}
                        </span>
                        <span className={`text-xs font-bold ${
                          coverage >= 80 ? 'text-green-400' :
                          coverage >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {coverage}%
                        </span>
                      </div>
                      <Progress value={coverage} className="h-1 mt-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Eye className="w-5 h-5" />
                <span>ดูหน่วยที่ Gap มากสุด</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Users className="w-5 h-5" />
                <span>รายงานที่รอตรวจสอบ</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Download className="w-5 h-5" />
                <span>Export Snapshot</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Bell className="w-5 h-5" />
                <span>ส่ง Alert ทั้งหมด</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
