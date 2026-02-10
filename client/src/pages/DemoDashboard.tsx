import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AdminLayout from "@/components/AdminLayout";
import AnimatedNumber from "@/components/AnimatedNumber";
import AnimatedBar from "@/components/AnimatedBar";
import AnimatedPieChart from "@/components/AnimatedPieChart";
import { 
  MapPin, 
  AlertTriangle, 
  Activity,
  Users,
  TrendingUp,
  RefreshCw,
  BarChart3,
  PieChart,
  CheckCircle2,
  XCircle,
  Sparkles,
  Play,
  Download,
  Settings2,
  FileText,
  Shield,
  Zap
} from "lucide-react";
import {
  DEMO_CANDIDATES,
  SCENARIOS,
  generateMockVoteResults,
  generateMockTimeline,
  generateMockStats,
  generateMockPvtStats,
  generateMockKlimekData,
  generateMockBenfordData,
  generateMockAlerts,
  DEMO_PROVINCE_COVERAGE,
  type ScenarioType,
} from "@/lib/mockData";

export default function DemoDashboard() {
  const [scenario, setScenario] = useState<ScenarioType>('mild_fraud');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Generate mock data based on scenario
  const voteResults = useMemo(() => generateMockVoteResults(scenario), [scenario, animationKey]);
  const stats = useMemo(() => generateMockStats(scenario), [scenario, animationKey]);
  const pvtStats = useMemo(() => generateMockPvtStats(scenario), [scenario, animationKey]);
  const klimekData = useMemo(() => generateMockKlimekData(scenario), [scenario, animationKey]);
  const benfordData = useMemo(() => generateMockBenfordData(scenario), [scenario, animationKey]);
  const alerts = useMemo(() => generateMockAlerts(scenario), [scenario, animationKey]);
  const timeline = useMemo(() => generateMockTimeline(), [animationKey]);
  
  // Calculate totals
  const totalCrowdsourced = Object.values(voteResults).reduce((sum, v) => sum + v.crowdsourced, 0);
  const totalOfficial = Object.values(voteResults).reduce((sum, v) => sum + v.official, 0);

  const handleSimulate = () => {
    setIsAnimating(true);
    setAnimationKey(prev => prev + 1);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  const handleScenarioChange = (newScenario: ScenarioType) => {
    setScenario(newScenario);
    setAnimationKey(prev => prev + 1);
  };

  const handleExportPDF = async () => {
    // Create printable content
    const printContent = `
      <html>
        <head>
          <title>Demo Report - Anti-Rigging War Room</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; }
            h1 { color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
            .stat-label { color: #64748b; font-size: 14px; }
            .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
            .alert-critical { background: #fef2f2; border-left: 4px solid #dc2626; }
            .alert-high { background: #fffbeb; border-left: 4px solid #f59e0b; }
            .alert-medium { background: #f0fdf4; border-left: 4px solid #22c55e; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; border: 1px solid #e2e8f0; text-align: left; }
            th { background: #f1f5f9; }
            .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>🛡️ รายงานการตรวจสอบการเลือกตั้ง (Demo)</h1>
          <p><strong>สถานการณ์จำลอง:</strong> ${SCENARIOS[scenario].name}</p>
          <p><strong>วันที่:</strong> ${new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })}</p>
          
          <h2>📊 สรุปภาพรวม</h2>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${stats.submittedStations}/${stats.totalStations}</div>
              <div class="stat-label">หน่วยเลือกตั้งที่ส่งข้อมูล</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.totalAlerts}</div>
              <div class="stat-label">การแจ้งเตือนทั้งหมด</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.activeVolunteers}/${stats.totalVolunteers}</div>
              <div class="stat-label">อาสาสมัครที่กำลังทำงาน</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${pvtStats.gapPercent}%</div>
              <div class="stat-label">ส่วนต่าง PVT</div>
            </div>
          </div>
          
          <h2>📈 ผลคะแนนเปรียบเทียบ</h2>
          <table>
            <tr><th>ผู้สมัคร</th><th>คะแนนจากเรา</th><th>คะแนนทางการ</th><th>ส่วนต่าง</th></tr>
            ${DEMO_CANDIDATES.map(c => {
              const r = voteResults[c.id];
              const gap = r.official - r.crowdsourced;
              return `<tr>
                <td>${c.name}</td>
                <td>${r.crowdsourced.toLocaleString()}</td>
                <td>${r.official.toLocaleString()}</td>
                <td style="color: ${gap > 0 ? '#dc2626' : gap < 0 ? '#16a34a' : '#64748b'}">${gap > 0 ? '+' : ''}${gap.toLocaleString()}</td>
              </tr>`;
            }).join('')}
          </table>
          
          <h2>🔬 ผลการวิเคราะห์ Klimek Model</h2>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${klimekData.alpha.toFixed(2)}</div>
              <div class="stat-label">Alpha (Vote Stuffing)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${klimekData.beta.toFixed(2)}</div>
              <div class="stat-label">Beta (Vote Stealing)</div>
            </div>
          </div>
          <p><strong>สถานะ:</strong> ${klimekData.fraudZone === 'clean' ? '✅ ปกติ' : klimekData.fraudZone === 'moderate' ? '⚠️ น่าสงสัย' : '🚨 ผิดปกติรุนแรง'}</p>
          
          <h2>📐 ผลการวิเคราะห์ Benford's Law</h2>
          <p><strong>Chi-Square:</strong> ${benfordData.chiSquare.toFixed(2)}</p>
          <p><strong>P-Value:</strong> ${benfordData.pValue.toFixed(4)}</p>
          <p><strong>สถานะ:</strong> ${benfordData.isSignificant ? '🚨 พบความผิดปกติทางสถิติ' : '✅ ไม่พบความผิดปกติ'}</p>
          
          <h2>⚠️ การแจ้งเตือน</h2>
          ${alerts.map(a => `
            <div class="alert alert-${a.severity}">
              <strong>${a.alertType}</strong>: ${a.message}
              ${a.resolved ? ' ✅ แก้ไขแล้ว' : ''}
            </div>
          `).join('')}
          
          <div class="footer">
            <p>รายงานนี้สร้างโดย Anti-Rigging War Room - ระบบตรวจจับการทุจริตการเลือกตั้ง</p>
            <p>⚠️ นี่เป็นข้อมูลจำลองเพื่อการสาธิตเท่านั้น</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved);

  return (
    <AdminLayout>
      <div className="space-y-6" ref={reportRef}>
        {/* Demo Mode Banner with Scenario Selection */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
              <div>
                <h2 className="text-lg font-bold text-white">โหมดสาธิต (Demo Mode)</h2>
                <p className="text-sm text-purple-300">
                  เลือกสถานการณ์จำลองเพื่อดูการทำงานของระบบ
                </p>
              </div>
            </div>
            
            {/* Scenario Selection */}
            <div className="flex flex-wrap gap-2">
              {Object.values(SCENARIOS).map((s) => (
                <Button
                  key={s.id}
                  variant={scenario === s.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleScenarioChange(s.id as ScenarioType)}
                  className={scenario === s.id 
                    ? s.color === 'green' ? 'bg-green-600 hover:bg-green-700' 
                      : s.color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-red-600 hover:bg-red-700'
                    : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  }
                >
                  <span className="mr-1">{s.icon}</span>
                  {s.name}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSimulate}
                disabled={isAnimating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnimating ? 'animate-spin' : ''}`} />
                สุ่มข้อมูลใหม่
              </Button>
              <Button 
                onClick={handleExportPDF}
                variant="outline"
                className="border-purple-500 text-purple-300 hover:bg-purple-900/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
          
          {/* Scenario Description */}
          <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-white">{SCENARIOS[scenario].icon} {SCENARIOS[scenario].name}:</span>{' '}
              {SCENARIOS[scenario].description}
            </p>
          </div>
        </div>

        {/* Stats Grid with Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '0ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                หน่วยเลือกตั้ง
              </CardTitle>
              <MapPin className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                <AnimatedNumber value={stats.submittedStations} key={`stations-${animationKey}`} />
                <span className="text-slate-500">/{stats.totalStations}</span>
              </div>
              <Progress 
                value={stats.coveragePercent} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                ครอบคลุม {stats.coveragePercent}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                การแจ้งเตือน
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${criticalAlerts.length > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                <AnimatedNumber value={stats.totalAlerts} key={`alerts-${animationKey}`} />
              </div>
              <p className={`text-xs mt-1 ${stats.unresolvedAlerts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {stats.unresolvedAlerts > 0 ? `${stats.unresolvedAlerts} รอตรวจสอบ` : 'ไม่มีรายการค้าง'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                อาสาสมัคร
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                <AnimatedNumber value={stats.activeVolunteers} key={`volunteers-${animationKey}`} />
                <span className="text-slate-500">/{stats.totalVolunteers}</span>
              </div>
              <p className="text-xs text-green-400 mt-1">
                กำลังทำงาน {Math.round(stats.activeVolunteers / stats.totalVolunteers * 100)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                ส่วนต่าง PVT
              </CardTitle>
              <TrendingUp className={`h-4 w-4 ${pvtStats.gapPercent > 5 ? 'text-red-500' : pvtStats.gapPercent > 2 ? 'text-yellow-500' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${pvtStats.gapPercent > 5 ? 'text-red-500' : pvtStats.gapPercent > 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                <AnimatedNumber value={pvtStats.gapPercent} decimals={1} suffix="%" key={`pvt-${animationKey}`} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                <AnimatedNumber value={pvtStats.gap} key={`gap-${animationKey}`} /> คะแนน
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Vote Results Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Vote Comparison */}
          <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '400ms' }}>
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
                {DEMO_CANDIDATES.map((candidate, index) => {
                  const result = voteResults[candidate.id];
                  const maxVotes = Math.max(result.crowdsourced, result.official);
                  const gap = result.official - result.crowdsourced;
                  const gapPercent = ((gap / result.crowdsourced) * 100).toFixed(1);
                  
                  return (
                    <div key={candidate.id} className="space-y-2 animate-fade-in" style={{ animationDelay: `${500 + index * 100}ms` }}>
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
                            <AnimatedBar 
                              percentage={(result.crowdsourced / maxVotes) * 100}
                              color={candidate.color}
                              delay={600 + index * 100}
                              duration={1000}
                              key={`bar-crowd-${candidate.id}-${animationKey}`}
                            />
                          </div>
                          <span className="text-xs text-white w-16 text-right">
                            {result.crowdsourced.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-12">ทางการ:</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                            <AnimatedBar 
                              percentage={(result.official / maxVotes) * 100}
                              color={candidate.color}
                              delay={700 + index * 100}
                              duration={1000}
                              opacity={0.6}
                              key={`bar-official-${candidate.id}-${animationKey}`}
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
                  <span className="text-white font-bold">
                    <AnimatedNumber value={totalCrowdsourced} key={`total-crowd-${animationKey}`} />
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-400">รวมคะแนนทางการ:</span>
                  <span className="text-white font-bold">
                    <AnimatedNumber value={totalOfficial} key={`total-official-${animationKey}`} />
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-400">ส่วนต่างรวม:</span>
                  <span className={`font-bold ${totalOfficial - totalCrowdsourced > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {totalOfficial - totalCrowdsourced > 0 ? '+' : ''}
                    <AnimatedNumber value={totalOfficial - totalCrowdsourced} key={`total-gap-${animationKey}`} />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart - Vote Distribution */}
          <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                สัดส่วนคะแนน (ข้อมูลจากเรา)
              </CardTitle>
              <CardDescription className="text-slate-400">
                สัดส่วนคะแนนของแต่ละผู้สมัครจากข้อมูลที่อาสาสมัครนับ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <AnimatedPieChart
                  key={`pie-${animationKey}`}
                  data={DEMO_CANDIDATES.map(c => ({
                    id: String(c.id),
                    value: voteResults[c.id].crowdsourced,
                    color: c.color,
                    label: c.name,
                  }))}
                  size={200}
                  delay={600}
                  duration={1500}
                  centerContent={
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        <AnimatedNumber value={totalCrowdsourced} key={`pie-total-${animationKey}`} />
                      </div>
                      <div className="text-xs text-slate-400">คะแนนรวม</div>
                    </div>
                  }
                />
              </div>
              
              {/* Legend */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {DEMO_CANDIDATES.map((candidate, index) => {
                  const result = voteResults[candidate.id];
                  const percent = ((result.crowdsourced / totalCrowdsourced) * 100).toFixed(1);
                  return (
                    <div key={candidate.id} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${800 + index * 50}ms` }}>
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: candidate.color }}
                      />
                      <span className="text-xs text-slate-300 truncate">
                        {candidate.name}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${criticalAlerts.length > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
              การแจ้งเตือน ({alerts.length})
            </CardTitle>
            <CardDescription className="text-slate-400">
              รายการแจ้งเตือนความผิดปกติที่ตรวจพบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.map((alert, index) => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-lg border animate-fade-in ${
                    alert.severity === 'critical' ? 'bg-red-900/20 border-red-800' :
                    alert.severity === 'high' ? 'bg-yellow-900/20 border-yellow-800' :
                    'bg-slate-800/50 border-slate-700'
                  }`}
                  style={{ animationDelay: `${700 + index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {alert.severity === 'critical' ? (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : alert.severity === 'high' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Activity className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {alert.stationCode && `หน่วย: ${alert.stationCode} • `}
                          {new Date(alert.createdAt).toLocaleTimeString('th-TH')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.resolved ? "outline" : "destructive"} className="flex-shrink-0">
                      {alert.resolved ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> แก้ไขแล้ว</>
                      ) : (
                        'รอตรวจสอบ'
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Klimek Summary */}
          <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '700ms' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-500" />
                Klimek Model Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className={`text-3xl font-bold ${klimekData.alpha > 0.1 ? 'text-red-500' : klimekData.alpha > 0.05 ? 'text-yellow-500' : 'text-green-500'}`}>
                    <AnimatedNumber value={klimekData.alpha} decimals={2} key={`alpha-${animationKey}`} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Alpha (Vote Stuffing)</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className={`text-3xl font-bold ${klimekData.beta > 0.1 ? 'text-red-500' : klimekData.beta > 0.05 ? 'text-yellow-500' : 'text-green-500'}`}>
                    <AnimatedNumber value={klimekData.beta} decimals={2} key={`beta-${animationKey}`} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Beta (Vote Stealing)</div>
                </div>
              </div>
              <div className={`mt-4 p-3 rounded-lg text-center ${
                klimekData.fraudZone === 'clean' ? 'bg-green-900/30 text-green-400' :
                klimekData.fraudZone === 'moderate' ? 'bg-yellow-900/30 text-yellow-400' :
                'bg-red-900/30 text-red-400'
              }`}>
                <Shield className="h-5 w-5 mx-auto mb-1" />
                {klimekData.fraudZone === 'clean' ? 'ไม่พบความผิดปกติ' :
                 klimekData.fraudZone === 'moderate' ? 'พบความผิดปกติระดับปานกลาง' :
                 'พบความผิดปกติรุนแรง'}
              </div>
              {klimekData.suspiciousStations.length > 0 && (
                <div className="mt-3 text-xs text-slate-400">
                  พบหน่วยน่าสงสัย: {klimekData.suspiciousStations.length} หน่วย
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benford Summary */}
          <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '800ms' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Benford's Law Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-white">
                    <AnimatedNumber value={benfordData.chiSquare} decimals={1} key={`chi-${animationKey}`} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Chi-Square</div>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className={`text-3xl font-bold ${benfordData.pValue < 0.05 ? 'text-red-500' : 'text-green-500'}`}>
                    <AnimatedNumber value={benfordData.pValue} decimals={3} key={`pvalue-${animationKey}`} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">P-Value</div>
                </div>
              </div>
              <div className={`mt-4 p-3 rounded-lg text-center ${
                benfordData.isSignificant ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
              }`}>
                <Zap className="h-5 w-5 mx-auto mb-1" />
                {benfordData.isSignificant ? 'พบความผิดปกติทางสถิติ (p < 0.05)' : 'ไม่พบความผิดปกติทางสถิติ'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Province Coverage */}
        <Card className="bg-slate-900/50 border-slate-800 animate-fade-in" style={{ animationDelay: '900ms' }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              ความครอบคลุมรายจังหวัด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {DEMO_PROVINCE_COVERAGE.map((prov, index) => (
                <div 
                  key={prov.province} 
                  className="p-3 bg-slate-800/50 rounded-lg animate-fade-in"
                  style={{ animationDelay: `${1000 + index * 50}ms` }}
                >
                  <div className="text-sm text-white font-medium truncate">{prov.province}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {prov.submittedStations}/{prov.totalStations} หน่วย
                  </div>
                  <Progress value={prov.coverage} className="mt-2 h-1" />
                  <div className="text-xs text-slate-500 mt-1">{prov.coverage}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </AdminLayout>
  );
}
