import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, AlertTriangle, BarChart3, CheckCircle2, Clock, 
  FileText, MapPin, RefreshCw, Shield, TrendingUp, Users, Zap
} from 'lucide-react';

export default function RealtimeDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: liveStatus, isLoading, refetch } = trpc.realtimeDashboard.getLiveStatus.useQuery(
    undefined,
    { refetchInterval: autoRefresh ? 15000 : false }
  );

  const { data: districtBreakdown } = trpc.realtimeDashboard.getDistrictBreakdown.useQuery(
    undefined,
    { refetchInterval: autoRefresh ? 30000 : false }
  );

  const { data: activityFeed } = trpc.realtimeDashboard.getActivityFeed.useQuery(
    { limit: 15 },
    { refetchInterval: autoRefresh ? 10000 : false }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500" />
            Real-time Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            ยโสธร เขต 2 — คำเขื่อนแก้ว, มหาชนะชัย, ค้อวัง, ป่าติ้ว, ไทยเจริญ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </Button>
          {liveStatus && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(liveStatus.lastUpdated).toLocaleTimeString('th-TH')}
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-orange-500" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : liveStatus ? (
        <>
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ความคืบหน้า</p>
                    <p className="text-3xl font-bold text-orange-500">{liveStatus.progressPercent}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500/50" />
                </div>
                <Progress value={liveStatus.progressPercent} className="mt-3 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {liveStatus.stationsReported} / {liveStatus.totalExpectedStations} หน่วย
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ผล OCR ทั้งหมด</p>
                    <p className="text-3xl font-bold">{liveStatus.ocrStats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500/50" />
                </div>
                <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                  <span>ส.ส.5/11: {liveStatus.ocrStats.ss511}</span>
                  <span>ส.ส.5/18: {liveStatus.ocrStats.ss518}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cross-validation</p>
                    <p className="text-3xl font-bold">{liveStatus.crossValidationStats.total}</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500/50" />
                </div>
                <div className="flex gap-3 mt-3 text-xs">
                  <span className="text-green-500">✓ ตรง {liveStatus.crossValidationStats.matched}</span>
                  <span className="text-red-500">✗ ไม่ตรง {liveStatus.crossValidationStats.mismatched}</span>
                </div>
              </CardContent>
            </Card>

            <Card className={liveStatus.unresolvedAlerts > 0 ? 'border-red-500/50 bg-red-500/5' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">แจ้งเตือนรอดำเนินการ</p>
                    <p className={`text-3xl font-bold ${liveStatus.unresolvedAlerts > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {liveStatus.unresolvedAlerts}
                    </p>
                  </div>
                  <AlertTriangle className={`h-8 w-8 ${liveStatus.unresolvedAlerts > 0 ? 'text-red-500/50' : 'text-green-500/50'}`} />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  ทั้งหมด {liveStatus.totalAlerts} รายการ
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Candidate Vote Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                คะแนนรวมผู้สมัคร — ยโสธร เขต 2
              </CardTitle>
              <CardDescription>
                คะแนนรวมจากหน่วยเลือกตั้งที่รายงานแล้ว (ข้อมูล real-time จาก OCR)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liveStatus.candidateVoteTotals.length > 0 ? (
                <div className="space-y-3">
                  {liveStatus.candidateVoteTotals.map((candidate: any, idx: number) => {
                    const maxVotes = liveStatus.candidateVoteTotals[0]?.totalVotes || 1;
                    const percentage = Math.round((candidate.totalVotes / maxVotes) * 100);
                    return (
                      <div key={candidate.number} className="flex items-center gap-4">
                        <div className="w-8 text-center">
                          <Badge variant={idx === 0 ? "default" : "outline"} className="text-xs">
                            {candidate.number}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{candidate.name}</span>
                            <span className="text-sm font-bold ml-2">
                              {candidate.totalVotes.toLocaleString()} คะแนน
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-blue-500' : 'bg-muted-foreground/30'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            จาก {candidate.stationCount} หน่วย
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>ยังไม่มีข้อมูลคะแนน</p>
                  <p className="text-sm">รอผล OCR จากอาสาสมัคร</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* District Breakdown + Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* District Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  สถานะรายอำเภอ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {districtBreakdown ? (
                  <div className="space-y-4">
                    {districtBreakdown.map((d: any) => (
                      <div key={d.district} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="font-medium">{d.district}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <span>{d.stationsReported} หน่วย</span>
                            <span>ส.ส.5/11: {d.ss511Count}</span>
                            <span>ส.ส.5/18: {d.ss518Count}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{d.totalVotes.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">คะแนนรวม</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>กำลังโหลด...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  กิจกรรมล่าสุด
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityFeed && activityFeed.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {activityFeed.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        {item.type === 'ocr' ? (
                          <FileText className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                        ) : (
                          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                            item.data.severity === 'critical' ? 'text-red-500' :
                            item.data.severity === 'high' ? 'text-orange-500' :
                            'text-yellow-500'
                          }`} />
                        )}
                        <div className="flex-1 min-w-0">
                          {item.type === 'ocr' ? (
                            <>
                              <p className="text-sm">
                                <span className="font-medium">OCR</span> หน่วย {item.data.stationCode}
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {item.data.documentType === 'ss5_11' ? 'ส.ส.5/11' : 'ส.ส.5/18'}
                                </Badge>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ความมั่นใจ {item.data.confidence}% • {item.data.provider}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm">
                                <span className="font-medium">แจ้งเตือน</span> หน่วย {item.data.stationCode}
                                <Badge variant={item.data.isMatch ? "default" : "destructive"} className="ml-2 text-xs">
                                  {item.data.severity}
                                </Badge>
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {item.data.summary}
                              </p>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>ยังไม่มีกิจกรรม</p>
                    <p className="text-sm">รอข้อมูลจากอาสาสมัคร</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Station Status Grid */}
          {liveStatus.stations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  สถานะหน่วยเลือกตั้ง ({liveStatus.stations.length} หน่วย)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {liveStatus.stations.map((station: any) => (
                    <div
                      key={station.stationCode}
                      className={`p-2 rounded-lg border text-center text-xs ${
                        station.crossValidated
                          ? station.isMatch
                            ? 'border-green-500/50 bg-green-500/10'
                            : 'border-red-500/50 bg-red-500/10'
                          : station.ss511 || station.ss518
                            ? 'border-yellow-500/50 bg-yellow-500/10'
                            : 'border-muted'
                      }`}
                    >
                      <p className="font-mono font-bold">{station.stationCode}</p>
                      <p className="text-muted-foreground truncate">{station.district}</p>
                      <div className="flex justify-center gap-1 mt-1">
                        {station.ss511 && <Badge variant="outline" className="text-[10px] px-1">5/11</Badge>}
                        {station.ss518 && <Badge variant="outline" className="text-[10px] px-1">5/18</Badge>}
                        {station.crossValidated && (
                          <CheckCircle2 className={`h-3 w-3 ${station.isMatch ? 'text-green-500' : 'text-red-500'}`} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Shield className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">ไม่สามารถโหลดข้อมูลได้</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">ลองใหม่</Button>
        </div>
      )}
    </div>
  );
}
