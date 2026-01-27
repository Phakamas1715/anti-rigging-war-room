import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { useMemo } from "react";

export default function KlimekAnalysis() {
  const { data: analysis, isLoading } = trpc.klimek.analyze.useQuery();

  // Generate heatmap colors
  const heatmapColors = useMemo(() => {
    if (!analysis?.heatmapData) return [];
    
    const maxVal = Math.max(...analysis.heatmapData.flat());
    return analysis.heatmapData.map(row => 
      row.map(val => {
        const intensity = maxVal > 0 ? val / maxVal : 0;
        if (intensity === 0) return 'bg-slate-900';
        if (intensity < 0.2) return 'bg-blue-900';
        if (intensity < 0.4) return 'bg-cyan-800';
        if (intensity < 0.6) return 'bg-green-700';
        if (intensity < 0.8) return 'bg-yellow-600';
        return 'bg-red-500';
      })
    );
  }, [analysis?.heatmapData]);

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
          <BarChart3 className="h-6 w-6 text-red-500" />
          <span className="text-xl font-bold text-white">Klimek Model Analysis</span>
        </div>
      </header>

      <main className="container py-8">
        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Alpha (α) - Vote Stuffing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                (analysis?.alpha || 0) > 0.05 ? 'text-red-500' : 'text-green-500'
              }`}>
                {isLoading ? "..." : (analysis?.alpha || 0).toFixed(4)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {(analysis?.alpha || 0) > 0.05 ? 'ตรวจพบความผิดปกติ!' : 'ปกติ'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Beta (β) - Vote Stealing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                (analysis?.beta || 0) > 0.2 ? 'text-red-500' : 'text-green-500'
              }`}>
                {isLoading ? "..." : (analysis?.beta || 0).toFixed(4)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {(analysis?.beta || 0) > 0.2 ? 'ตรวจพบความผิดปกติ!' : 'ปกติ'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Fraud Zone Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {isLoading ? "..." : analysis?.fraudZoneCount || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                จาก {analysis?.totalUnits || 0} หน่วย
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">สถานะ</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis?.isSuspicious ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-6 w-6" />
                  <span className="text-xl font-bold">ต้องสอบสวน</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-xl font-bold">ปกติ</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Visualization */}
        <Card className="bg-slate-900/50 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Election Fingerprint Heatmap</CardTitle>
            <CardDescription className="text-slate-400">
              แกน X = Voter Turnout (0-100%), แกน Y = Winner Vote Share (0-100%)
              <br />
              <span className="text-red-400">จุดสีแดงที่มุมขวาบน = Fraud Zone (ทุจริต)</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-96 flex items-center justify-center text-slate-500">
                กำลังโหลด...
              </div>
            ) : (
              <div className="relative">
                {/* Y-axis label */}
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-slate-400 text-sm whitespace-nowrap">
                  Winner Vote Share (%)
                </div>
                
                {/* Heatmap Grid */}
                <div className="ml-8">
                  <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(20, 1fr)` }}>
                    {heatmapColors.map((row, y) => 
                      row.map((color, x) => (
                        <div
                          key={`${x}-${y}`}
                          className={`aspect-square ${color} rounded-sm transition-all hover:scale-110 hover:z-10`}
                          title={`Turnout: ${(x * 5)}%-${(x + 1) * 5}%, Vote Share: ${(19 - y) * 5}%-${(20 - y) * 5}%`}
                        />
                      ))
                    ).reverse()}
                  </div>
                  
                  {/* X-axis label */}
                  <div className="text-center text-slate-400 text-sm mt-4">
                    Voter Turnout (%)
                  </div>
                  
                  {/* X-axis ticks */}
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Fraud Zone Indicator */}
                <div className="absolute top-0 right-0 w-1/5 h-1/5 border-2 border-dashed border-red-500 rounded pointer-events-none">
                  <div className="absolute -top-6 right-0 text-red-500 text-xs font-bold">
                    FRAUD ZONE
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend & Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Color Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-900 rounded" />
                  <span className="text-slate-400 text-sm">0 units</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-900 rounded" />
                  <span className="text-slate-400 text-sm">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-800 rounded" />
                  <span className="text-slate-400 text-sm">Medium-Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-700 rounded" />
                  <span className="text-slate-400 text-sm">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-600 rounded" />
                  <span className="text-slate-400 text-sm">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span className="text-slate-400 text-sm">Very High</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">สูตรการคำนวณ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-400 text-sm">
              <div>
                <div className="font-mono text-red-400">P(x,y) = (1-α)·N(x,y) + α·δ(x=1,y=1)</div>
                <div className="text-xs mt-1">Vote Stuffing Model</div>
              </div>
              <div>
                <div className="font-mono text-orange-400">W_rigged = W_clean + (1-W_clean)·β</div>
                <div className="text-xs mt-1">Vote Stealing Model</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
