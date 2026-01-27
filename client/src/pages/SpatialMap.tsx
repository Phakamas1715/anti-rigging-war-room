import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle, Info } from "lucide-react";

// Thailand SVG map paths for each region
const REGION_COLORS = {
  north: "#3b82f6",
  northeast: "#8b5cf6",
  central: "#10b981",
  east: "#f59e0b",
  west: "#ec4899",
  south: "#06b6d4",
};

const REGION_NAMES = {
  north: "ภาคเหนือ",
  northeast: "ภาคตะวันออกเฉียงเหนือ",
  central: "ภาคกลาง",
  east: "ภาคตะวันออก",
  west: "ภาคตะวันตก",
  south: "ภาคใต้",
};

export default function SpatialMap() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [showDemoData, setShowDemoData] = useState(true);
  
  const { data: realData } = trpc.spatialMap.provinces.useQuery();
  const { data: demoData } = trpc.spatialMap.demoData.useQuery();
  
  const provinces = showDemoData ? demoData : realData;
  const suspiciousProvinces = provinces?.filter(p => p.isSuspicious) || [];
  
  const selectedProvinceData = provinces?.find(p => p.code === selectedProvince);

  // Calculate stats
  const stats = {
    totalProvinces: provinces?.length || 0,
    suspiciousCount: suspiciousProvinces.length,
    avgTurnout: (provinces?.reduce((acc, p) => acc + p.avgTurnout, 0) || 0) / (provinces?.length || 1),
    avgVoteShare: (provinces?.reduce((acc, p) => acc + p.avgVoteShare, 0) || 0) / (provinces?.length || 1),
  };

  const getZScoreColor = (zScore: number) => {
    if (Math.abs(zScore) > 3.5) return "#ef4444"; // Critical
    if (Math.abs(zScore) > 2.5) return "#f97316"; // High
    if (Math.abs(zScore) > 1.5) return "#eab308"; // Medium
    return "#22c55e"; // Normal
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Z-Score Spatial Map</h1>
          </div>
          <Button
            variant={showDemoData ? "default" : "outline"}
            onClick={() => setShowDemoData(!showDemoData)}
          >
            {showDemoData ? "ข้อมูลตัวอย่าง" : "ข้อมูลจริง"}
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{stats.totalProvinces}</div>
              <p className="text-sm text-muted-foreground">จังหวัดทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-500">{stats.suspiciousCount}</div>
              <p className="text-sm text-muted-foreground">จังหวัดที่ผิดปกติ</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{(stats.avgTurnout * 100).toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Turnout เฉลี่ย</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{(stats.avgVoteShare * 100).toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Vote Share เฉลี่ย</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Visualization */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  แผนที่ประเทศไทย
                </CardTitle>
                <CardDescription>
                  คลิกที่จังหวัดเพื่อดูรายละเอียด (สีแดง = Z-Score สูงผิดปกติ)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Thailand Map Grid Visualization */}
                <div className="relative aspect-[3/4] bg-slate-900/50 rounded-lg p-4">
                  {/* Region Labels */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-2">
                    {Object.entries(REGION_NAMES).map(([key, name]) => (
                      <Badge
                        key={key}
                        style={{ backgroundColor: REGION_COLORS[key as keyof typeof REGION_COLORS] }}
                        className="text-white text-xs"
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>

                  {/* Province Grid */}
                  <div className="grid grid-cols-8 gap-1 mt-12">
                    {provinces?.map((province) => {
                      const zScoreColor = getZScoreColor(province.zScore);
                      const isSelected = selectedProvince === province.code;
                      
                      return (
                        <button
                          key={province.code}
                          onClick={() => setSelectedProvince(province.code)}
                          className={`
                            relative aspect-square rounded-sm transition-all duration-200
                            hover:scale-110 hover:z-10
                            ${isSelected ? "ring-2 ring-white scale-110 z-10" : ""}
                          `}
                          style={{
                            backgroundColor: province.isSuspicious ? zScoreColor : REGION_COLORS[province.region as keyof typeof REGION_COLORS],
                            opacity: province.isSuspicious ? 1 : 0.7,
                          }}
                          title={`${province.name} (Z-Score: ${province.zScore.toFixed(2)})`}
                        >
                          {province.isSuspicious && (
                            <AlertTriangle className="absolute inset-0 m-auto h-3 w-3 text-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Z-Score Legend:</p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                        <span className="text-muted-foreground">ปกติ (&lt;1.5)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                        <span className="text-muted-foreground">เฝ้าระวัง (1.5-2.5)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
                        <span className="text-muted-foreground">สูง (2.5-3.5)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                        <span className="text-muted-foreground">วิกฤต (&gt;3.5)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Province Details & Suspicious List */}
          <div className="space-y-6">
            {/* Selected Province Details */}
            {selectedProvinceData && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedProvinceData.isSuspicious ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {selectedProvinceData.name}
                  </CardTitle>
                  <CardDescription>
                    {REGION_NAMES[selectedProvinceData.region as keyof typeof REGION_NAMES]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Z-Score</p>
                      <p className={`text-2xl font-bold ${selectedProvinceData.isSuspicious ? "text-red-500" : "text-green-500"}`}>
                        {selectedProvinceData.zScore.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">หน่วยเลือกตั้ง</p>
                      <p className="text-2xl font-bold text-foreground">{selectedProvinceData.stations}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Turnout</p>
                      <p className="text-xl font-bold text-foreground">{(selectedProvinceData.avgTurnout * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vote Share</p>
                      <p className="text-xl font-bold text-foreground">{(selectedProvinceData.avgVoteShare * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {selectedProvinceData.isSuspicious && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        จังหวัดนี้มี Z-Score สูงกว่าค่าเฉลี่ยของจังหวัดใกล้เคียงอย่างมีนัยสำคัญ ควรตรวจสอบเพิ่มเติม
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Suspicious Provinces List */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  จังหวัดที่ผิดปกติ
                </CardTitle>
                <CardDescription>
                  Z-Score &gt; 2.5 (เกณฑ์ทางสถิติ)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suspiciousProvinces.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {suspiciousProvinces
                      .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
                      .map((province) => (
                        <button
                          key={province.code}
                          onClick={() => setSelectedProvince(province.code)}
                          className={`
                            w-full flex items-center justify-between p-3 rounded-lg
                            bg-red-500/10 hover:bg-red-500/20 transition-colors
                            ${selectedProvince === province.code ? "ring-1 ring-red-500" : ""}
                          `}
                        >
                          <div className="text-left">
                            <p className="font-medium text-foreground">{province.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Turnout: {(province.avgTurnout * 100).toFixed(1)}%
                            </p>
                          </div>
                          <Badge variant="destructive">
                            Z: {province.zScore.toFixed(2)}
                          </Badge>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>ไม่พบจังหวัดที่ผิดปกติ</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  วิธีการวิเคราะห์
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">Z-Score Spatial Correlation</strong> คำนวณจากการเปรียบเทียบค่า Turnout ของแต่ละจังหวัดกับค่าเฉลี่ยของจังหวัดใกล้เคียง
                </p>
                <p>
                  ถ้าจังหวัดหนึ่งมี Turnout สูงกว่าจังหวัดรอบข้างอย่างมีนัยสำคัญ (Z-Score &gt; 2.5) แสดงว่าอาจมีความผิดปกติ
                </p>
                <p className="text-yellow-500">
                  หมายเหตุ: สูตรนี้เหมาะกับบริบทไทยที่ "หัวคะแนนคุมเป็นโซน"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
