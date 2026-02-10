import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Alerts() {
  const { isAuthenticated } = useAuth();
  const { data: alerts, isLoading, refetch } = trpc.alerts.list.useQuery();
  const utils = trpc.useUtils();
  
  const resolveMutation = trpc.alerts.resolve.useMutation({
    onSuccess: () => {
      toast.success("แก้ไขการแจ้งเตือนสำเร็จ");
      utils.alerts.list.invalidate();
      utils.dashboard.alerts.invalidate();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const handleResolve = (id: number) => {
    if (!isAuthenticated) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }
    resolveMutation.mutate({ id });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'ballot_stuffing': return 'การยัดบัตร (Ballot Stuffing)';
      case 'vote_stealing': return 'การขโมยคะแนน (Vote Stealing)';
      case 'benford_violation': return 'ละเมิด Benford\'s Law';
      case 'spatial_anomaly': return 'ความผิดปกติเชิงพื้นที่';
      case 'pvt_gap': return 'ความแตกต่าง PVT';
      case 'time_jump': return 'การกระโดดของข้อมูล';
      case 'cross_validation': return 'Cross-validation ไม่ตรง';
      case 'ocr_mismatch': return 'OCR คะแนนไม่ตรงกัน';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <span className="text-xl font-bold text-white">Fraud Alerts</span>
        </div>
      </header>

      <main className="container py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {alerts?.length || 0}
                  </div>
                  <div className="text-sm text-slate-400">ทั้งหมด</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-slate-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-500">
                    {alerts?.filter(a => a.severity === 'critical').length || 0}
                  </div>
                  <div className="text-sm text-slate-400">Critical</div>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-500">
                    {alerts?.filter(a => !a.isResolved).length || 0}
                  </div>
                  <div className="text-sm text-slate-400">รอดำเนินการ</div>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {alerts?.filter(a => a.isResolved).length || 0}
                  </div>
                  <div className="text-sm text-slate-400">แก้ไขแล้ว</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">รายการแจ้งเตือนทั้งหมด</CardTitle>
            <CardDescription className="text-slate-400">
              ความผิดปกติที่ตรวจพบจากการวิเคราะห์ทางสถิติ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">กำลังโหลด...</div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity || 'medium')} ${
                      alert.isResolved ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`h-5 w-5 ${
                            alert.severity === 'critical' ? 'text-red-500' :
                            alert.severity === 'high' ? 'text-orange-500' :
                            alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                          }`} />
                          <span className="font-bold text-white">
                            {getAlertTypeLabel(alert.alertType)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            alert.severity === 'critical' ? 'bg-red-500/30 text-red-300' :
                            alert.severity === 'high' ? 'bg-orange-500/30 text-orange-300' :
                            alert.severity === 'medium' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-blue-500/30 text-blue-300'
                          }`}>
                            {alert.severity?.toUpperCase()}
                          </span>
                          {alert.isResolved && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/30 text-green-300">
                              แก้ไขแล้ว
                            </span>
                          )}
                        </div>

                        <p className="text-slate-300 text-sm mb-3">
                          {alert.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          {alert.stationId && (
                            <span>หน่วย: #{alert.stationId}</span>
                          )}
                          {alert.alphaScore && (
                            <span>Alpha: {parseFloat(alert.alphaScore).toFixed(4)}</span>
                          )}
                          {alert.betaScore && (
                            <span>Beta: {parseFloat(alert.betaScore).toFixed(4)}</span>
                          )}
                          {alert.zScore && (
                            <span>Z-Score: {parseFloat(alert.zScore).toFixed(2)}</span>
                          )}
                          <span>
                            {new Date(alert.createdAt).toLocaleString('th-TH')}
                          </span>
                        </div>
                      </div>

                      {!alert.isResolved && (
                        <Button
                          onClick={() => handleResolve(alert.id)}
                          disabled={resolveMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          แก้ไขแล้ว
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มีการแจ้งเตือน</p>
                <p className="text-sm mt-2">ระบบจะแจ้งเตือนเมื่อตรวจพบความผิดปกติ</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert Types Explanation */}
        <Card className="bg-slate-900/50 border-slate-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">ประเภทการแจ้งเตือน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-red-400 font-bold mb-1">Ballot Stuffing</div>
                <div className="text-slate-400 text-sm">
                  ตรวจพบเมื่อ Alpha (α) {">"} 0.05 - มีการยัดบัตรเกิน 5%
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-orange-400 font-bold mb-1">Vote Stealing</div>
                <div className="text-slate-400 text-sm">
                  ตรวจพบเมื่อ Beta (β) {">"} 0.2 - มีการขโมยคะแนนเกิน 20%
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-yellow-400 font-bold mb-1">Benford Violation</div>
                <div className="text-slate-400 text-sm">
                  ตรวจพบเมื่อ Chi-square {">"} 16.92 - ตัวเลขผิดธรรมชาติ
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-blue-400 font-bold mb-1">Spatial Anomaly</div>
                <div className="text-slate-400 text-sm">
                  ตรวจพบเมื่อ |Z-Score| {">"} 2.5 - ผิดปกติจากเพื่อนบ้าน
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-purple-400 font-bold mb-1">PVT Gap</div>
                <div className="text-slate-400 text-sm">
                  ตรวจพบเมื่อความแตกต่าง {">"} 5% - ผลนับคู่ขนานไม่ตรง
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-cyan-400 font-bold mb-1">Time Jump</div>
                <div className="text-slate-400 text-sm">
                  ตรวจพบเมื่อคะแนนกระโดด {">"}  10% ในเวลาสั้น
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="text-pink-400 font-bold mb-1">Cross-validation</div>
                <div className="text-slate-400 text-sm">
                  ตรวจพบเมื่อ ส.ส.5/11 กับ ส.ส.5/18 จากหน่วยเดียวกันไม่ตรงกัน {">"}  5%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
