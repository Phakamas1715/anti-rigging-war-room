import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  RefreshCw,
  BarChart3,
  PieChart,
  CheckCircle2,
  XCircle,
  Sparkles,
  Play,
  Info
} from "lucide-react";
import {
  DEMO_CANDIDATES,
  DEMO_ALERTS,
  DEMO_STATS,
  DEMO_PVT_STATS,
  DEMO_KLIMEK_DATA,
  DEMO_BENFORD_DATA,
  DEMO_PROVINCE_COVERAGE,
  generateMockVoteResults,
  generateMockTimeline,
} from "@/lib/mockData";

export default function DemoDashboard() {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Generate mock data
  const voteResults = useMemo(() => generateMockVoteResults(), []);
  const timeline = useMemo(() => generateMockTimeline(), []);
  
  // Calculate totals
  const totalCrowdsourced = Object.values(voteResults).reduce((sum, v) => sum + v.crowdsourced, 0);
  const totalOfficial = Object.values(voteResults).reduce((sum, v) => sum + v.official, 0);

  const handleSimulate = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Demo Mode Banner */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
              <div>
                <h2 className="text-lg font-bold text-white">โหมดสาธิต (Demo Mode)</h2>
                <p className="text-sm text-purple-300">
                  ข้อมูลที่แสดงเป็นข้อมูลจำลองเพื่อสาธิตการทำงานของระบบ
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSimulate}
              disabled={isAnimating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className={`h-4 w-4 mr-2 ${isAnimating ? 'animate-spin' : ''}`} />
              จำลองข้อมูลใหม่
            </Button>
          </div>
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
                {DEMO_STATS.submittedStations}/{DEMO_STATS.totalStations}
              </div>
              <Progress 
                value={DEMO_STATS.coveragePercent} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                ครอบคลุม {DEMO_STATS.coveragePercent}%
              </p>
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
                {DEMO_STATS.totalAlerts}
              </div>
              <p className="text-xs text-red-400 mt-1">
                {DEMO_STATS.unresolvedAlerts} รอตรวจสอบ
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                อาสาสมัคร
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {DEMO_STATS.activeVolunteers}/{DEMO_STATS.totalVolunteers}
              </div>
              <p className="text-xs text-green-400 mt-1">
                กำลังทำงาน {Math.round(DEMO_STATS.activeVolunteers / DEMO_STATS.totalVolunteers * 100)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                ส่วนต่าง PVT
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${DEMO_PVT_STATS.gapPercent > 2 ? 'text-red-500' : 'text-green-500'}`}>
                {DEMO_PVT_STATS.gapPercent}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {DEMO_PVT_STATS.gap.toLocaleString()} คะแนน
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Vote Results Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Vote Comparison */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                เปรียบเทียบคะแนน (เรา vs ทางการ)
              </CardTitle>
              <CardDescription className="text-slate-400">
                คะแนนที่อาสาสมัครนับ เทียบกับผลทางการ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_CANDIDATES.map(candidate => {
                  const result = voteResults[candidate.id];
                  const maxVotes = Math.max(result.crowdsourced, result.official);
                  const gap = result.official - result.crowdsourced;
                  const gapPercent = ((gap / result.crowdsourced) * 100).toFixed(1);
                  
                  return (
                    <div key={candidate.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white font-medium">
                          {candidate.name}
                        </span>
                        <span className={`text-xs ${gap > 0 ? 'text-red-400' : gap < 0 ? 'text-green-400' : 'text-slate-400'}`}>
                          {gap > 0 ? '+' : ''}{gap.toLocaleString()} ({gapPercent}%)
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-12">เรา:</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(result.crowdsourced / maxVotes) * 100}%`,
                                backgroundColor: candidate.color 
                              }}
                            />
                          </div>
                          <span className="text-xs text-white w-16 text-right">
                            {result.crowdsourced.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-12">ทางการ:</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                            <div 
                              className="h-full rounded-full opacity-60 transition-all duration-500"
                              style={{ 
                                width: `${(result.official / maxVotes) * 100}%`,
                                backgroundColor: candidate.color 
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-16 text-right">
                            {result.official.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">รวมคะแนนที่เรานับ:</span>
                  <span className="text-white font-bold">{totalCrowdsourced.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-400">รวมคะแนนทางการ:</span>
                  <span className="text-white font-bold">{totalOfficial.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-400">ส่วนต่างรวม:</span>
                  <span className={`font-bold ${totalOfficial - totalCrowdsourced > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {(totalOfficial - totalCrowdsourced > 0 ? '+' : '')}{(totalOfficial - totalCrowdsourced).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart - Vote Distribution */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-green-500" />
                สัดส่วนคะแนน (ข้อมูลอาสาสมัคร)
              </CardTitle>
              <CardDescription className="text-slate-400">
                การกระจายคะแนนตามผู้สมัคร
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple Pie Chart Visualization */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      let currentAngle = 0;
                      return DEMO_CANDIDATES.map(candidate => {
                        const result = voteResults[candidate.id];
                        const percent = (result.crowdsourced / totalCrowdsourced) * 100;
                        const angle = (percent / 100) * 360;
                        const startAngle = currentAngle;
                        currentAngle += angle;
                        
                        const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                        const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                        const endX = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                        const endY = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
                        const largeArc = angle > 180 ? 1 : 0;
                        
                        return (
                          <path
                            key={candidate.id}
                            d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                            fill={candidate.color}
                            className="transition-all duration-500 hover:opacity-80"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {totalCrowdsourced.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">คะแนนรวม</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2">
                {DEMO_CANDIDATES.map(candidate => {
                  const result = voteResults[candidate.id];
                  const percent = ((result.crowdsourced / totalCrowdsourced) * 100).toFixed(1);
                  
                  return (
                    <div key={candidate.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: candidate.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white truncate">{candidate.name}</div>
                        <div className="text-xs text-slate-400">{percent}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Province Coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="space-y-3">
                {DEMO_ALERTS.map((alert) => (
                  <div 
                    key={alert.id} 
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                        alert.severity === 'high' ? 'bg-orange-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <div className="text-sm text-white font-medium">
                          {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-xs text-slate-400">
                          {alert.message}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.createdAt).toLocaleString('th-TH')}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`text-xs ${
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {alert.severity}
                      </Badge>
                      {alert.resolved ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Province Coverage */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                ความครอบคลุมรายจังหวัด
              </CardTitle>
              <CardDescription className="text-slate-400">
                สถานะการรายงานแยกตามจังหวัด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {DEMO_PROVINCE_COVERAGE.map((province, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-white font-medium">
                        {province.province}
                      </span>
                      <span className={`text-xs ${
                        province.coverage >= 80 ? 'text-green-400' :
                        province.coverage >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {province.coverage}%
                      </span>
                    </div>
                    <Progress 
                      value={province.coverage} 
                      className="h-2"
                    />
                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                      <span>{province.submittedStations}/{province.totalStations} หน่วย</span>
                      <span className={parseFloat(province.avgGap) > 0 ? 'text-red-400' : 'text-green-400'}>
                        Gap: {province.avgGap}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forensic Analysis Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Klimek Analysis */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-500" />
                Klimek Model Analysis
              </CardTitle>
              <CardDescription className="text-slate-400">
                ตรวจจับการยัดบัตร (Vote Stuffing) และการขโมยคะแนน (Vote Stealing)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-500">
                    {(DEMO_KLIMEK_DATA.alpha * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Alpha (Vote Stuffing)</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-orange-500">
                    {(DEMO_KLIMEK_DATA.beta * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Beta (Vote Stealing)</div>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-400">
                    พบ {DEMO_KLIMEK_DATA.suspiciousStations.length} หน่วยที่มีค่าผิดปกติ
                  </span>
                </div>
              </div>
              
              <Link href="/admin/klimek">
                <Button variant="outline" className="w-full mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
                  ดูรายละเอียด
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Benford Analysis */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Benford's Law Analysis
              </CardTitle>
              <CardDescription className="text-slate-400">
                ตรวจสอบรูปแบบตัวเลขตามกฎของ Benford
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-500">
                    {DEMO_BENFORD_DATA.chiSquare.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Chi-Square</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {DEMO_BENFORD_DATA.pValue.toFixed(3)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">P-Value</div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${
                DEMO_BENFORD_DATA.isSignificant 
                  ? 'bg-red-500/10 border border-red-500/30' 
                  : 'bg-green-500/10 border border-green-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {DEMO_BENFORD_DATA.isSignificant ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-sm ${
                    DEMO_BENFORD_DATA.isSignificant ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {DEMO_BENFORD_DATA.isSignificant 
                      ? 'พบความผิดปกติทางสถิติ' 
                      : 'ไม่พบความผิดปกติทางสถิติ'}
                  </span>
                </div>
              </div>
              
              <Link href="/admin/benford">
                <Button variant="outline" className="w-full mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
                  ดูรายละเอียด
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-400">เกี่ยวกับโหมดสาธิต</h3>
                <p className="text-sm text-blue-300/80 mt-1">
                  ข้อมูลทั้งหมดในหน้านี้เป็นข้อมูลจำลองเพื่อสาธิตการทำงานของระบบ Anti-Rigging War Room 
                  สำหรับข้อมูลจริง กรุณาไปที่ <Link href="/admin" className="underline hover:text-blue-200">Dashboard หลัก</Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
