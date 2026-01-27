import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, GitCompare, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";

export default function PVTComparison() {
  const { data: pvtData, isLoading } = trpc.pvt.compare.useQuery();
  const { data: jumpData } = trpc.pvt.detectJump.useQuery({ source: "official" });

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
          <GitCompare className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold text-white">Parallel Vote Tabulation (PVT)</span>
        </div>
      </header>

      <main className="container py-8">
        {/* Comparison Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">ผลทางการ (Official)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {isLoading ? "..." : (pvtData?.officialTotal || 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                จาก {pvtData?.officialCount || 0} หน่วย
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">ผลนับคู่ขนาน (PVT)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {isLoading ? "..." : (pvtData?.crowdsourcedTotal || 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                จาก {pvtData?.crowdsourcedCount || 0} หน่วย
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">ความแตกต่าง (Gap)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                (pvtData?.gapPercent || 0) > 5 ? 'text-red-500' : 'text-green-500'
              }`}>
                {isLoading ? "..." : (pvtData?.gapPercent || 0).toFixed(2)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {(pvtData?.gap || 0).toLocaleString()} คะแนน
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Card */}
        <Card className={`mb-8 ${
          pvtData?.isSuspicious 
            ? 'bg-red-500/10 border-red-500/50' 
            : 'bg-green-500/10 border-green-500/50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {pvtData?.isSuspicious ? (
                  <>
                    <AlertTriangle className="h-12 w-12 text-red-500" />
                    <div>
                      <div className="text-2xl font-bold text-red-400">ตรวจพบความผิดปกติ!</div>
                      <div className="text-slate-400">
                        ความแตกต่างระหว่างผลทางการและผลนับคู่ขนานเกิน 5%
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-green-400">ผลตรงกัน</div>
                      <div className="text-slate-400">
                        ความแตกต่างอยู่ในเกณฑ์ที่ยอมรับได้
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Comparison */}
        <Card className="bg-slate-900/50 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">การเปรียบเทียบแบบภาพ</CardTitle>
            <CardDescription className="text-slate-400">
              Our Sum vs Their Sum
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Official Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-400">ผลทางการ (Official)</span>
                  <span className="text-white">{(pvtData?.officialTotal || 0).toLocaleString()}</span>
                </div>
                <div className="h-8 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, ((pvtData?.officialTotal || 0) / Math.max(pvtData?.officialTotal || 1, pvtData?.crowdsourcedTotal || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              {/* PVT Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400">ผลนับคู่ขนาน (PVT)</span>
                  <span className="text-white">{(pvtData?.crowdsourcedTotal || 0).toLocaleString()}</span>
                </div>
                <div className="h-8 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, ((pvtData?.crowdsourcedTotal || 0) / Math.max(pvtData?.officialTotal || 1, pvtData?.crowdsourcedTotal || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              {/* Gap Indicator */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-800">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${
                    (pvtData?.gapPercent || 0) > 5 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {(pvtData?.gap || 0) > 0 ? (
                      <TrendingUp className="h-8 w-8 inline mr-2" />
                    ) : (
                      <TrendingDown className="h-8 w-8 inline mr-2" />
                    )}
                    {Math.abs(pvtData?.gap || 0).toLocaleString()}
                  </div>
                  <div className="text-slate-400 text-sm">คะแนนที่แตกต่าง</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Jump Detection */}
        <Card className="bg-slate-900/50 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Time-Series Anomaly Detection</CardTitle>
            <CardDescription className="text-slate-400">
              ตรวจจับการกระโดดของข้อมูลที่ผิดปกติ (Magic Jump)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jumpData?.hasAnomaly ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/20 rounded-lg border border-red-500/50">
                  <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    ตรวจพบการกระโดดของข้อมูล!
                  </div>
                  <div className="text-slate-400 text-sm">
                    พบ {jumpData.jumps.length} ครั้งที่คะแนนเปลี่ยนแปลงผิดปกติ
                  </div>
                </div>
                
                <div className="space-y-2">
                  {jumpData.jumps.map((jump, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm">
                          {new Date(jump.time).toLocaleString('th-TH')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {jump.previousTotal.toLocaleString()} → {jump.newTotal.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-red-500 font-bold">
                        +{jump.jumpSize.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <div className="text-green-400 font-bold">ไม่พบความผิดปกติ</div>
                <div className="text-slate-500 text-sm mt-2">
                  ข้อมูลเปลี่ยนแปลงอย่างสม่ำเสมอ
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Explanation */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">PVT คืออะไร?</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-400 text-sm space-y-3">
            <p>
              <strong className="text-white">Parallel Vote Tabulation (PVT):</strong> การนับคะแนนคู่ขนาน 
              โดยใช้ข้อมูลจากภาพถ่ายกระดานนับคะแนนที่ประชาชนส่งมา เปรียบเทียบกับผลทางการ
            </p>
            <p>
              <strong className="text-white">หลักการ:</strong> ถ้า กกต. มีส่วนรู้เห็นในการโกง 
              ผลทางการจะไม่ตรงกับผลที่นับจากภาพถ่ายจริง
            </p>
            <p>
              <strong className="text-white">Time Jump Detection:</strong> ตรวจจับกรณีที่ Server ล่ม 
              แล้วกลับมาพร้อมผลที่เปลี่ยนไป (Magic Jump)
            </p>
            <div className="p-4 bg-slate-800/50 rounded-lg mt-4">
              <div className="text-white font-bold mb-2">เกณฑ์การตัดสิน:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Gap {">"} 5% = ต้องสอบสวน</li>
                <li>Jump {">"} 10% ในเวลา {"<"} 5 นาที = ผิดปกติ</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
