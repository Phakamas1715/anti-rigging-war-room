import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle, Info, Shield, TrendingUp, Database, Loader2, RefreshCw, ChevronRight, ChevronDown, Building2, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";

// GLUE-FIN Level Colors
const GLUEFIN_COLORS = {
  normal: "#22c55e",
  review: "#eab308",
  suspicious: "#f97316",
  critical: "#ef4444",
  crisis: "#1f2937",
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
  { code: "CBI", name: "ชลบุรี", region: "east", row: 8, col: 4 },
  { code: "RYG", name: "ระยอง", region: "east", row: 8, col: 5 },
  { code: "CTI", name: "จันทบุรี", region: "east", row: 9, col: 5 },
  { code: "TRT", name: "ตราด", region: "east", row: 9, col: 6 },
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

// District Drill-down Component
function DistrictDrilldown({ provinceCode, provinceName, onClose }: { provinceCode: string; provinceName: string; onClose: () => void }) {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');

  const { data: districtData, isLoading } = trpc.glueFin.analyzeDistricts.useQuery(
    { provinceCode, provinceName },
    { refetchInterval: 30000 }
  );

  const sortedDistricts = useMemo(() => {
    if (!districtData?.districts) return [];
    const districts = [...districtData.districts];
    if (sortBy === 'score') {
      districts.sort((a, b) => b.score - a.score);
    } else {
      districts.sort((a, b) => a.districtName.localeCompare(b.districtName, 'th'));
    }
    return districts;
  }, [districtData, sortBy]);

  const selectedDistrictData = districtData?.districts.find(d => d.districtName === selectedDistrict);

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
            <p className="text-muted-foreground">กำลังวิเคราะห์อำเภอใน {provinceName}...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!districtData) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                กลับ
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-orange-500" />
                  Drill-down: {provinceName}
                </CardTitle>
                <CardDescription>
                  {districtData.summary.totalDistricts} อำเภอ | {districtData.summary.totalStations} หน่วย
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Database className="h-3 w-3" />
              {districtData.dataSource === 'real' ? (
                <span className="text-green-500">ข้อมูลจริง</span>
              ) : (
                <span className="text-yellow-500">ข้อมูลจำลอง</span>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="p-2 rounded-lg bg-green-500/10">
              <div className="text-lg font-bold text-green-500">{districtData.summary.byLevel.normal}</div>
              <div className="text-xs text-muted-foreground">🟢 ปกติ</div>
            </div>
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <div className="text-lg font-bold text-yellow-500">{districtData.summary.byLevel.review}</div>
              <div className="text-xs text-muted-foreground">🟡 ตรวจสอบ</div>
            </div>
            <div className="p-2 rounded-lg bg-orange-500/10">
              <div className="text-lg font-bold text-orange-500">{districtData.summary.byLevel.suspicious}</div>
              <div className="text-xs text-muted-foreground">🟠 น่าสงสัย</div>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10">
              <div className="text-lg font-bold text-red-500">{districtData.summary.byLevel.critical}</div>
              <div className="text-xs text-muted-foreground">🔴 วิกฤต</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold text-foreground">{districtData.summary.averageScore}</div>
              <div className="text-xs text-muted-foreground">คะแนนเฉลี่ย</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* District List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* District List */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                รายชื่ออำเภอ
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={sortBy === 'score' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSortBy('score')}
                >
                  คะแนน
                </Button>
                <Button
                  variant={sortBy === 'name' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSortBy('name')}
                >
                  ชื่อ
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {sortedDistricts.map((district) => {
                const isSelected = selectedDistrict === district.districtName;
                const color = getGlueFinColor(district.score);
                return (
                  <button
                    key={district.districtName}
                    onClick={() => setSelectedDistrict(district.districtName)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg text-left
                      transition-all duration-150 hover:bg-muted/50
                      ${isSelected ? "bg-muted/50 ring-1 ring-orange-500/50" : ""}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <p className="font-medium text-sm">{district.districtName}</p>
                        <p className="text-xs text-muted-foreground">
                          {district.stationCount} หน่วย | {district.dataPoints} records
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: color, color }}
                      >
                        {district.score}
                      </Badge>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* District Details */}
        <div className="space-y-4">
          {selectedDistrictData ? (
            <>
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-xl">{selectedDistrictData.levelEmoji}</span>
                    {selectedDistrictData.districtName}
                  </CardTitle>
                  <CardDescription>
                    {provinceName} | {selectedDistrictData.stationCount} หน่วยเลือกตั้ง
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Display */}
                  <div
                    className="text-center p-4 rounded-lg"
                    style={{ backgroundColor: `${getGlueFinColor(selectedDistrictData.score)}15` }}
                  >
                    <p className="text-sm text-muted-foreground">GLUE-FIN Score</p>
                    <p
                      className="text-4xl font-bold"
                      style={{ color: getGlueFinColor(selectedDistrictData.score) }}
                    >
                      {selectedDistrictData.score}
                    </p>
                    <Badge
                      className="mt-2"
                      style={{ backgroundColor: getGlueFinColor(selectedDistrictData.score) }}
                    >
                      {selectedDistrictData.levelDescription}
                    </Badge>
                  </div>

                  {/* Recommendation */}
                  {selectedDistrictData.recommendation && (
                    <div className="p-3 bg-muted/30 rounded-lg text-sm">
                      <p className="font-medium text-foreground mb-1">คำแนะนำ:</p>
                      <p className="text-muted-foreground">{selectedDistrictData.recommendation}</p>
                    </div>
                  )}

                  {/* Component Scores */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Component Scores:</p>
                    <div className="space-y-2">
                      {selectedDistrictData.components.map((comp: { name: string; weight: number; rawValue?: number; normalizedValue: number; contribution: number }) => (
                        <div key={comp.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{comp.name} ({(comp.weight * 100).toFixed(0)}%)</span>
                            <span className="font-medium">{typeof comp.normalizedValue === 'number' ? comp.normalizedValue.toFixed(1) : '0.0'}</span>
                          </div>
                          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(comp.normalizedValue ?? 0, 100)}%`,
                                backgroundColor: (comp.normalizedValue ?? 0) > 60 ? '#ef4444' : (comp.normalizedValue ?? 0) > 30 ? '#f97316' : '#22c55e',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formula */}
                  {selectedDistrictData.formula && (
                    <div className="p-2 bg-muted/30 rounded text-xs font-mono text-muted-foreground break-all">
                      {selectedDistrictData.formula}
                    </div>
                  )}

                  {/* Warning */}
                  {(selectedDistrictData.level === "critical" || selectedDistrictData.level === "crisis") && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        อำเภอนี้มีคะแนน GLUE-FIN สูง ต้องตรวจสอบเพิ่มเติม!
                      </p>
                    </div>
                  )}
                  {selectedDistrictData.level === "suspicious" && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <p className="text-sm text-orange-400">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        อำเภอนี้มีสัญญาณน่าสงสัย ควรตรวจสอบเพิ่มเติม
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">เลือกอำเภอเพื่อดูรายละเอียด</p>
                  <p className="text-sm mt-1">คลิกที่อำเภอในรายการด้านซ้าย</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* High Risk Districts */}
          {districtData && sortedDistricts.filter(d => d.score > 30).length > 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  อำเภอที่ต้องตรวจสอบ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sortedDistricts
                    .filter(d => d.score > 30)
                    .slice(0, 5)
                    .map(d => (
                      <div
                        key={d.districtName}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedDistrict(d.districtName)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{d.levelEmoji}</span>
                          <span className="text-sm font-medium">{d.districtName}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: getGlueFinColor(d.score) }}>
                          {d.score}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GlueFinHeatmap() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [drilldownProvince, setDrilldownProvince] = useState<{ code: string; name: string } | null>(null);

  // Fetch real data from API
  const { data: apiData, isLoading, refetch, isFetching } = trpc.glueFin.analyzeAllProvinces.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Map API data to province grid
  const provinces = useMemo(() => {
    if (!apiData) return [];
    return THAILAND_PROVINCES.map(province => {
      const apiProvince = apiData.provinces.find(p => p.provinceName === province.name);
      const score = apiProvince?.score ?? 11.9;
      const level = getGlueFinLevel(score);
      return {
        ...province,
        glueFinScore: score,
        level,
        components: apiProvince ? {
          ocr: apiProvince.components.find(c => c.name === 'OCR Confidence')?.rawValue ?? 85,
          klimek: apiProvince.components.find(c => c.name === 'Klimek Model')?.rawValue ?? 0,
          benford: apiProvince.components.find(c => c.name === "Benford's Law")?.rawValue ?? 0,
          pvt: apiProvince.components.find(c => c.name === 'PVT Gap')?.rawValue ?? 0,
          sna: apiProvince.components.find(c => c.name === 'SNA Centrality')?.rawValue ?? 0,
        } : { ocr: 85, klimek: 0, benford: 0, pvt: 0, sna: 0 },
        levelDescription: apiProvince?.levelDescription ?? '',
        recommendation: apiProvince?.recommendation ?? '',
        formula: apiProvince?.formula ?? '',
      };
    });
  }, [apiData]);

  const selectedProvinceData = provinces.find(p => p.code === selectedProvince);

  const stats = useMemo(() => {
    if (apiData?.summary) {
      return {
        total: apiData.summary.totalProvinces,
        byLevel: apiData.summary.byLevel,
        avgScore: apiData.summary.averageScore,
        highRisk: (apiData.summary.byLevel.critical || 0) + (apiData.summary.byLevel.crisis || 0),
      };
    }
    const byLevel = { normal: 0, review: 0, suspicious: 0, critical: 0, crisis: 0 };
    let totalScore = 0;
    provinces.forEach(p => { byLevel[p.level]++; totalScore += p.glueFinScore; });
    return {
      total: provinces.length,
      byLevel,
      avgScore: provinces.length > 0 ? Math.round((totalScore / provinces.length) * 10) / 10 : 0,
      highRisk: provinces.filter(p => p.level === "critical" || p.level === "crisis").length,
    };
  }, [provinces, apiData]);

  const maxRow = Math.max(...THAILAND_PROVINCES.map(p => p.row));
  const maxCol = Math.max(...THAILAND_PROVINCES.map(p => p.col));

  // Handle drill-down
  const handleDrilldown = (code: string, name: string) => {
    setDrilldownProvince({ code, name });
  };

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
                {drilldownProvince && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-sm">{drilldownProvince.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {apiData && (
                <Badge variant="outline" className="gap-1.5">
                  <Database className="h-3 w-3" />
                  {apiData.dataSource === 'real' ? (
                    <span className="text-green-500">ข้อมูลจริง ({apiData.totalDataPoints} records)</span>
                  ) : (
                    <span className="text-yellow-500">ข้อมูลจำลอง</span>
                  )}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
              <p className="text-muted-foreground">กำลังวิเคราะห์ GLUE-FIN Score...</p>
            </div>
          </div>
        ) : drilldownProvince ? (
          /* District Drill-down View */
          <main className="container py-8">
            <DistrictDrilldown
              provinceCode={drilldownProvince.code}
              provinceName={drilldownProvince.name}
              onClose={() => setDrilldownProvince(null)}
            />
          </main>
        ) : (
          /* Province Map View */
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

            {/* Data Source Banner */}
            {apiData?.dataSource === 'demo' && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
                <Info className="h-5 w-5 text-yellow-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">กำลังแสดงข้อมูลจำลอง</p>
                  <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูลการเลือกตั้งจริงใน Database เมื่อมีข้อมูลจริงระบบจะแสดงผลวิเคราะห์อัตโนมัติ</p>
                </div>
              </div>
            )}

            {apiData?.dataSource === 'real' && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
                <Database className="h-5 w-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-500">เชื่อมต่อข้อมูลจริงแล้ว</p>
                  <p className="text-xs text-muted-foreground">
                    วิเคราะห์จาก {apiData.totalDataPoints} records | แจ้งเตือน {apiData.totalAlerts} รายการ | อัพเดตล่าสุด: {new Date(apiData.lastUpdated).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            )}

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
                      คลิกที่จังหวัดเพื่อดูรายละเอียด | ดับเบิลคลิกเพื่อ Drill-down ดูระดับอำเภอ
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative bg-slate-900/50 rounded-lg p-6">
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
                                  onDoubleClick={() => handleDrilldown(province.code, province.name)}
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
                                  <p className="text-xs text-blue-400 mt-1">ดับเบิลคลิกเพื่อดูอำเภอ</p>
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

                      {/* Level Description */}
                      {selectedProvinceData.levelDescription && (
                        <div className="p-3 bg-muted/30 rounded-lg text-sm">
                          <p className="text-muted-foreground">{selectedProvinceData.levelDescription}</p>
                        </div>
                      )}

                      {/* Component Scores */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Component Scores:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between p-2 bg-muted/50 rounded">
                            <span className="text-muted-foreground">OCR</span>
                            <span>{typeof selectedProvinceData.components.ocr === 'number' ? selectedProvinceData.components.ocr.toFixed(1) : '-'}%</span>
                          </div>
                          <div className="flex justify-between p-2 bg-muted/50 rounded">
                            <span className="text-muted-foreground">Klimek α</span>
                            <span>{typeof selectedProvinceData.components.klimek === 'number' ? selectedProvinceData.components.klimek.toFixed(4) : '-'}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-muted/50 rounded">
                            <span className="text-muted-foreground">Benford χ²</span>
                            <span>{typeof selectedProvinceData.components.benford === 'number' ? selectedProvinceData.components.benford.toFixed(2) : '-'}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-muted/50 rounded">
                            <span className="text-muted-foreground">PVT Gap</span>
                            <span>{typeof selectedProvinceData.components.pvt === 'number' ? selectedProvinceData.components.pvt.toFixed(1) : '-'}%</span>
                          </div>
                          <div className="flex justify-between p-2 bg-muted/50 rounded col-span-2">
                            <span className="text-muted-foreground">SNA Centrality</span>
                            <span>{typeof selectedProvinceData.components.sna === 'number' ? selectedProvinceData.components.sna.toFixed(4) : '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Drill-down Button */}
                      <Button
                        className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
                        onClick={() => handleDrilldown(selectedProvinceData.code, selectedProvinceData.name)}
                      >
                        <ChevronDown className="h-4 w-4" />
                        Drill-down ดูระดับอำเภอ
                      </Button>

                      {/* Formula */}
                      {selectedProvinceData.formula && (
                        <div className="p-2 bg-muted/30 rounded text-xs font-mono text-muted-foreground break-all">
                          {selectedProvinceData.formula}
                        </div>
                      )}

                      {/* Warning */}
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
                              onDoubleClick={() => handleDrilldown(province.code, province.name)}
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
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs">
                        ข้อมูลวิเคราะห์จาก API แบบ Real-time | รีเฟรชทุก 30 วินาที
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        )}
      </div>
    </TooltipProvider>
  );
}
