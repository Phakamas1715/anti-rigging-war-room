import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle, Info, Shield, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// GLUE-FIN Level Colors
const GLUEFIN_COLORS = {
  normal: "#22c55e",      // Green - 0-20
  review: "#eab308",      // Yellow - 21-40
  suspicious: "#f97316",  // Orange - 41-60
  critical: "#ef4444",    // Red - 61-80
  crisis: "#1f2937",      // Dark - 81-100
};

const GLUEFIN_LEVELS = {
  normal: { name: "ปกติ", range: "0-20", emoji: "🟢" },
  review: { name: "ต้องตรวจสอบ", range: "21-40", emoji: "🟡" },
  suspicious: { name: "น่าสงสัย", range: "41-60", emoji: "🟠" },
  critical: { name: "น่าสงสัยมาก", range: "61-80", emoji: "🔴" },
  crisis: { name: "วิกฤต", range: "81-100", emoji: "⚫" },
};

// Thailand provinces with region mapping
const THAILAND_PROVINCES = [
  // ภาคเหนือ (17 จังหวัด)
  { code: "CMI", name: "เชียงใหม่", region: "north", row: 0, col: 2 },
  { code: "LPN", name: "ลำพูน", region: "north", row: 1, col: 2 },
  { code: "LPG", name: "ลำปาง", region: "north", row: 1, col: 3 },
  { code: "CRI", name: "เชียงราย", region: "north", row: 0, col: 3 },
  { code: "PRE", name: "แพร่", region: "north", row: 1, col: 4 },
  { code: "NAN", name: "น่าน", region: "north", row: 0, col: 4 },
  { code: "PYO", name: "พะเยา", region: "north", row: 0, col: 5 },
  { code: "MHS", name: "แม่ฮ่องสอน", region: "north", row: 0, col: 1 },
  { code: "UTD", name: "อุตรดิตถ์", region: "north", row: 2, col: 4 },
  { code: "TAK", name: "ตาก", region: "north", row: 2, col: 1 },
  { code: "SKT", name: "สุโขทัย", region: "north", row: 2, col: 3 },
  { code: "PLK", name: "พิษณุโลก", region: "north", row: 3, col: 4 },
  { code: "PCH", name: "พิจิตร", region: "north", row: 3, col: 3 },
  { code: "KPT", name: "กำแพงเพชร", region: "north", row: 3, col: 2 },
  { code: "PHR", name: "เพชรบูรณ์", region: "north", row: 3, col: 5 },
  { code: "NSN", name: "นครสวรรค์", region: "north", row: 4, col: 3 },
  { code: "UTI", name: "อุทัยธานี", region: "north", row: 4, col: 2 },
  
  // ภาคตะวันออกเฉียงเหนือ (20 จังหวัด)
  { code: "NMA", name: "นครราชสีมา", region: "northeast", row: 5, col: 5 },
  { code: "BRM", name: "บุรีรัมย์", region: "northeast", row: 5, col: 6 },
  { code: "SRN", name: "สุรินทร์", region: "northeast", row: 5, col: 7 },
  { code: "SSK", name: "ศรีสะเกษ", region: "northeast", row: 6, col: 7 },
  { code: "UBN", name: "อุบลราชธานี", region: "northeast", row: 6, col: 8 },
  { code: "YST", name: "ยโสธร", region: "northeast", row: 5, col: 8 },
  { code: "ACR", name: "อำนาจเจริญ", region: "northeast", row: 5, col: 9 },
  { code: "MKM", name: "มุกดาหาร", region: "northeast", row: 4, col: 9 },
  { code: "NKP", name: "นครพนม", region: "northeast", row: 3, col: 9 },
  { code: "SKN", name: "สกลนคร", region: "northeast", row: 2, col: 8 },
  { code: "KKN", name: "ขอนแก่น", region: "northeast", row: 4, col: 6 },
  { code: "UDN", name: "อุดรธานี", region: "northeast", row: 2, col: 6 },
  { code: "LEI", name: "เลย", region: "northeast", row: 2, col: 5 },
  { code: "NPM", name: "หนองบัวลำภู", region: "northeast", row: 3, col: 6 },
  { code: "NKI", name: "หนองคาย", region: "northeast", row: 1, col: 6 },
  { code: "BKN", name: "บึงกาฬ", region: "northeast", row: 1, col: 7 },
  { code: "MDH", name: "มหาสารคาม", region: "northeast", row: 4, col: 7 },
  { code: "RET", name: "ร้อยเอ็ด", region: "northeast", row: 4, col: 8 },
  { code: "KSN", name: "กาฬสินธุ์", region: "northeast", row: 3, col: 7 },
  { code: "CPM", name: "ชัยภูมิ", region: "northeast", row: 4, col: 5 },
  
  // ภาคกลาง (22 จังหวัด)
  { code: "BKK", name: "กรุงเทพฯ", region: "central", row: 6, col: 3 },
  { code: "NPT", name: "นนทบุรี", region: "central", row: 5, col: 3 },
  { code: "PTM", name: "ปทุมธานี", region: "central", row: 5, col: 4 },
  { code: "AYA", name: "พระนครศรีอยุธยา", region: "central", row: 5, col: 3 },
  { code: "ATG", name: "อ่างทอง", region: "central", row: 5, col: 2 },
  { code: "LRI", name: "ลพบุรี", region: "central", row: 4, col: 4 },
  { code: "SRI", name: "สิงห์บุรี", region: "central", row: 5, col: 2 },
  { code: "CNT", name: "ชัยนาท", region: "central", row: 4, col: 2 },
  { code: "SBR", name: "สระบุรี", region: "central", row: 5, col: 4 },
  { code: "NBI", name: "นครนายก", region: "central", row: 6, col: 5 },
  { code: "PRI", name: "ปราจีนบุรี", region: "central", row: 6, col: 6 },
  { code: "SKW", name: "สระแก้ว", region: "central", row: 6, col: 7 },
  { code: "NKS", name: "นครปฐม", region: "central", row: 6, col: 2 },
  { code: "SPB", name: "สุพรรณบุรี", region: "central", row: 5, col: 1 },
  { code: "KRI", name: "กาญจนบุรี", region: "central", row: 6, col: 1 },
  { code: "RBR", name: "ราชบุรี", region: "central", row: 7, col: 1 },
  { code: "SMK", name: "สมุทรสาคร", region: "central", row: 7, col: 2 },
  { code: "SMT", name: "สมุทรสงคราม", region: "central", row: 7, col: 2 },
  { code: "PKN", name: "เพชรบุรี", region: "central", row: 8, col: 1 },
  { code: "PKK", name: "ประจวบคีรีขันธ์", region: "central", row: 9, col: 1 },
  { code: "SMP", name: "สมุทรปราการ", region: "central", row: 7, col: 3 },
  { code: "CCO", name: "ฉะเชิงเทรา", region: "central", row: 7, col: 4 },
  
  // ภาคตะวันออก (7 จังหวัด)
  { code: "CBI", name: "ชลบุรี", region: "east", row: 8, col: 4 },
  { code: "RYG", name: "ระยอง", region: "east", row: 8, col: 5 },
  { code: "CTI", name: "จันทบุรี", region: "east", row: 9, col: 5 },
  { code: "TRT", name: "ตราด", region: "east", row: 9, col: 6 },
  
  // ภาคใต้ (14 จังหวัด)
  { code: "CPN", name: "ชุมพร", region: "south", row: 10, col: 2 },
  { code: "RNG", name: "ระนอง", region: "south", row: 10, col: 1 },
  { code: "SNI", name: "สุราษฎร์ธานี", region: "south", row: 11, col: 2 },
  { code: "PKT", name: "ภูเก็ต", region: "south", row: 12, col: 1 },
  { code: "PNG", name: "พังงา", region: "south", row: 11, col: 1 },
  { code: "KBI", name: "กระบี่", region: "south", row: 12, col: 2 },
  { code: "NRT", name: "นครศรีธรรมราช", region: "south", row: 12, col: 3 },
  { code: "TSG", name: "ตรัง", region: "south", row: 13, col: 2 },
  { code: "PLG", name: "พัทลุง", region: "south", row: 13, col: 3 },
  { code: "SKA", name: "สงขลา", region: "south", row: 14, col: 3 },
  { code: "STN", name: "สตูล", region: "south", row: 14, col: 2 },
  { code: "PTN", name: "ปัตตานี", region: "south", row: 14, col: 4 },
  { code: "YLA", name: "ยะลา", region: "south", row: 15, col: 3 },
  { code: "NWT", name: "นราธิวาส", region: "south", row: 15, col: 4 },
];

// Generate mock GLUE-FIN data for each province
function generateMockGlueFinData(scenario: "normal" | "fraud5" | "fraud20") {
  return THAILAND_PROVINCES.map(province => {
    let baseScore = Math.random() * 20; // Normal: 0-20
    
    if (scenario === "fraud5") {
      // 5% fraud - some provinces have higher scores
      if (Math.random() < 0.05) {
        baseScore = 40 + Math.random() * 40; // 40-80
      }
    } else if (scenario === "fraud20") {
      // 20% fraud - more provinces have higher scores
      if (Math.random() < 0.20) {
        baseScore = 50 + Math.random() * 50; // 50-100
      }
    }
    
    // Add some regional patterns
    if (province.region === "northeast" && scenario !== "normal") {
      baseScore += Math.random() * 10;
    }
    
    const score = Math.min(100, Math.max(0, baseScore));
    const level = getGlueFinLevel(score);
    
    return {
      ...province,
      glueFinScore: Math.round(score * 10) / 10,
      level,
      components: {
        ocr: Math.random() * 100,
        klimek: Math.random() * 0.2,
        benford: Math.random() * 25,
        pvt: Math.random() * 10,
        sna: Math.random(),
      },
      stations: Math.floor(Math.random() * 500) + 100,
      coverage: Math.random() * 0.3 + 0.7,
    };
  });
}

function getGlueFinLevel(score: number): keyof typeof GLUEFIN_LEVELS {
  if (score <= 20) return "normal";
  if (score <= 40) return "review";
  if (score <= 60) return "suspicious";
  if (score <= 80) return "critical";
  return "crisis";
}

function getGlueFinColor(score: number): string {
  const level = getGlueFinLevel(score);
  return GLUEFIN_COLORS[level];
}

export default function GlueFinHeatmap() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [scenario, setScenario] = useState<"normal" | "fraud5" | "fraud20">("normal");
  
  const provinces = useMemo(() => generateMockGlueFinData(scenario), [scenario]);
  
  const selectedProvinceData = provinces.find(p => p.code === selectedProvince);
  
  // Calculate stats
  const stats = useMemo(() => {
    const byLevel = {
      normal: 0,
      review: 0,
      suspicious: 0,
      critical: 0,
      crisis: 0,
    };
    
    let totalScore = 0;
    provinces.forEach(p => {
      byLevel[p.level]++;
      totalScore += p.glueFinScore;
    });
    
    return {
      total: provinces.length,
      byLevel,
      avgScore: Math.round((totalScore / provinces.length) * 10) / 10,
      highRisk: provinces.filter(p => p.level === "critical" || p.level === "crisis").length,
    };
  }, [provinces]);

  // Group provinces by row for grid layout
  const maxRow = Math.max(...provinces.map(p => p.row));
  const maxCol = Math.max(...provinces.map(p => p.col));

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-orange-500" />
                <h1 className="text-xl font-bold text-foreground">GLUE-FIN Heatmap</h1>
              </div>
            </div>
            
            {/* Scenario Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">สถานการณ์:</span>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as typeof scenario)}
                className="bg-card border border-border rounded-md px-3 py-1.5 text-sm"
              >
                <option value="normal">การเลือกตั้งปกติ</option>
                <option value="fraud5">มีการโกง 5%</option>
                <option value="fraud20">มีการโกงรุนแรง 20%</option>
              </select>
            </div>
          </div>
        </header>

        <main className="container py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-foreground">{stats.total}</div>
                <p className="text-sm text-muted-foreground">จังหวัดทั้งหมด</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-500">{stats.avgScore}</div>
                <p className="text-sm text-muted-foreground">คะแนนเฉลี่ย</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-500">{stats.byLevel.normal}</div>
                <p className="text-sm text-muted-foreground">🟢 ปกติ</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-yellow-500">{stats.byLevel.review}</div>
                <p className="text-sm text-muted-foreground">🟡 ต้องตรวจสอบ</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-500">{stats.highRisk}</div>
                <p className="text-sm text-muted-foreground">🔴 ความเสี่ยงสูง</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map Visualization */}
            <div className="lg:col-span-2">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    แผนที่ GLUE-FIN ประเทศไทย
                  </CardTitle>
                  <CardDescription>
                    คลิกที่จังหวัดเพื่อดูรายละเอียด GLUE-FIN Score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Thailand Map Grid */}
                  <div className="relative bg-slate-900/50 rounded-lg p-6">
                    {/* Grid Layout */}
                    <div 
                      className="grid gap-1"
                      style={{ 
                        gridTemplateColumns: `repeat(${maxCol + 1}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${maxRow + 1}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: (maxRow + 1) * (maxCol + 1) }).map((_, index) => {
                        const row = Math.floor(index / (maxCol + 1));
                        const col = index % (maxCol + 1);
                        const province = provinces.find(p => p.row === row && p.col === col);
                        
                        if (!province) {
                          return <div key={index} className="aspect-square" />;
                        }
                        
                        const isSelected = selectedProvince === province.code;
                        const color = getGlueFinColor(province.glueFinScore);
                        
                        return (
                          <Tooltip key={province.code}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setSelectedProvince(province.code)}
                                className={`
                                  aspect-square rounded-md transition-all duration-200
                                  hover:scale-110 hover:z-10 relative
                                  ${isSelected ? "ring-2 ring-white scale-110 z-10" : ""}
                                `}
                                style={{ backgroundColor: color }}
                              >
                                {province.level === "critical" || province.level === "crisis" ? (
                                  <AlertTriangle className="absolute inset-0 m-auto h-4 w-4 text-white" />
                                ) : null}
                                <span className="absolute bottom-0 left-0 right-0 text-[8px] text-white/80 truncate px-0.5">
                                  {province.code}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-card border-border">
                              <div className="text-sm">
                                <p className="font-bold">{province.name}</p>
                                <p className="text-muted-foreground">
                                  GLUE-FIN: <span style={{ color }}>{province.glueFinScore}</span>
                                </p>
                                <p className="text-muted-foreground">
                                  {GLUEFIN_LEVELS[province.level].emoji} {GLUEFIN_LEVELS[province.level].name}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 bg-black/50 rounded-lg p-4">
                      <p className="text-sm font-medium text-foreground mb-3">GLUE-FIN Level Legend:</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {Object.entries(GLUEFIN_LEVELS).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: GLUEFIN_COLORS[key as keyof typeof GLUEFIN_COLORS] }}
                            />
                            <span className="text-muted-foreground">
                              {value.emoji} {value.name} ({value.range})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Province Details & High Risk List */}
            <div className="space-y-6">
              {/* Selected Province Details */}
              {selectedProvinceData && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{GLUEFIN_LEVELS[selectedProvinceData.level].emoji}</span>
                      {selectedProvinceData.name}
                    </CardTitle>
                    <CardDescription>
                      รหัส: {selectedProvinceData.code}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* GLUE-FIN Score */}
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${getGlueFinColor(selectedProvinceData.glueFinScore)}20` }}>
                      <p className="text-sm text-muted-foreground">GLUE-FIN Score</p>
                      <p 
                        className="text-4xl font-bold"
                        style={{ color: getGlueFinColor(selectedProvinceData.glueFinScore) }}
                      >
                        {selectedProvinceData.glueFinScore}
                      </p>
                      <Badge 
                        className="mt-2"
                        style={{ backgroundColor: getGlueFinColor(selectedProvinceData.glueFinScore) }}
                      >
                        {GLUEFIN_LEVELS[selectedProvinceData.level].name}
                      </Badge>
                    </div>

                    {/* Component Scores */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Component Scores:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">OCR</span>
                          <span>{selectedProvinceData.components.ocr.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Klimek α</span>
                          <span>{selectedProvinceData.components.klimek.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">Benford χ²</span>
                          <span>{selectedProvinceData.components.benford.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">PVT Gap</span>
                          <span>{selectedProvinceData.components.pvt.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded col-span-2">
                          <span className="text-muted-foreground">SNA Centrality</span>
                          <span>{selectedProvinceData.components.sna.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Station Info */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div>
                        <p className="text-sm text-muted-foreground">หน่วยเลือกตั้ง</p>
                        <p className="text-xl font-bold">{selectedProvinceData.stations}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Coverage</p>
                        <p className="text-xl font-bold">{(selectedProvinceData.coverage * 100).toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Warning for high risk */}
                    {(selectedProvinceData.level === "critical" || selectedProvinceData.level === "suspicious") && (
                      <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-sm text-orange-400">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          จังหวัดนี้มีคะแนน GLUE-FIN สูง ควรตรวจสอบเพิ่มเติม
                        </p>
                      </div>
                    )}
                    
                    {selectedProvinceData.level === "crisis" && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          จังหวัดนี้อยู่ในระดับวิกฤต ต้องดำเนินการทันที!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* High Risk Provinces List */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                    จังหวัดความเสี่ยงสูง
                  </CardTitle>
                  <CardDescription>
                    GLUE-FIN Score &gt; 40
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {provinces.filter(p => p.glueFinScore > 40).length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {provinces
                        .filter(p => p.glueFinScore > 40)
                        .sort((a, b) => b.glueFinScore - a.glueFinScore)
                        .map(province => (
                          <button
                            key={province.code}
                            onClick={() => setSelectedProvince(province.code)}
                            className={`
                              w-full flex items-center justify-between p-3 rounded-lg
                              transition-colors hover:bg-muted/50
                              ${selectedProvince === province.code ? "bg-muted/50 ring-1 ring-primary" : ""}
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <span>{GLUEFIN_LEVELS[province.level].emoji}</span>
                              <span className="font-medium">{province.name}</span>
                            </div>
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: getGlueFinColor(province.glueFinScore),
                                color: getGlueFinColor(province.glueFinScore),
                              }}
                            >
                              {province.glueFinScore}
                            </Badge>
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>ไม่พบจังหวัดที่มีความเสี่ยงสูง</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Formula Info */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    สูตร GLUE-FIN
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p className="font-mono bg-muted/50 p-2 rounded">
                    S = 100 × σ(β₀ + Σ wₖ × zₖ)
                  </p>
                  <p>โดย:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>OCR (15%) - ความมั่นใจในการอ่าน</li>
                    <li>Klimek (30%) - Vote Stuffing/Stealing</li>
                    <li>Benford (20%) - Chi-Square Test</li>
                    <li>PVT (25%) - Gap Detection</li>
                    <li>SNA (10%) - Network Centrality</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
