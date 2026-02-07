import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Users,
  BarChart3,
  Shield,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info,
  Vote,
  Building2,
  TrendingUp,
  Loader2,
} from "lucide-react";

// Party colors
const PARTY_COLORS: Record<string, string> = {
  "เพื่อไทย": "#e53e3e",
  "ประชาชน": "#f97316",
  "ภูมิใจไทย": "#3b82f6",
  "ประชาธิปัตย์": "#2563eb",
  "พลังประชารัฐ": "#1d4ed8",
  "ไทยสร้างไทย": "#8b5cf6",
  "ก้าวไกล": "#f97316",
  "ท้องที่ไทย": "#84cc16",
  "ไทยก้าวใหม่": "#06b6d4",
  "ประชาธิปไตยใหม่": "#a855f7",
  "กล้าธรรม": "#14b8a6",
  "เศรษฐกิจ": "#eab308",
};

// GLUE-FIN level colors
const LEVEL_COLORS: Record<string, string> = {
  normal: "text-green-400",
  review: "text-yellow-400",
  suspicious: "text-orange-400",
  critical: "text-red-400",
  crisis: "text-gray-400",
};

const LEVEL_BG: Record<string, string> = {
  normal: "bg-green-500/10 border-green-500/30",
  review: "bg-yellow-500/10 border-yellow-500/30",
  suspicious: "bg-orange-500/10 border-orange-500/30",
  critical: "bg-red-500/10 border-red-500/30",
  crisis: "bg-gray-500/10 border-gray-500/30",
};

export default function ConstituencySearch() {
  const [selectedProvince, setSelectedProvince] = useState<string>("ยโสธร");
  const [selectedZone, setSelectedZone] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch provinces list
  const { data: provinces, isLoading: loadingProvinces } = trpc.constituency.provinces.useQuery();

  // Fetch province zone count
  const { data: provinceInfo } = trpc.constituency.provinceZones.useQuery(
    { province: selectedProvince },
    { enabled: !!selectedProvince }
  );

  // Fetch constituency detail
  const { data: detail, isLoading: loadingDetail } = trpc.constituency.detail.useQuery(
    { province: selectedProvince, zone: selectedZone },
    { enabled: !!selectedProvince && selectedZone > 0 }
  );

  // Zone options based on selected province
  const zoneOptions = useMemo(() => {
    if (!provinceInfo) return [];
    return Array.from({ length: provinceInfo.totalZones }, (_, i) => i + 1);
  }, [provinceInfo]);

  // Handle province change
  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedZone(1);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Search className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ค้นหาเขตเลือกตั้ง</h1>
            <p className="text-sm text-slate-400">
              ค้นหาข้อมูลผู้สมัคร สส. แบบแบ่งเขต ปี 2569 พร้อม GLUE-FIN Score
            </p>
          </div>
        </div>

        {/* Search Controls */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Province Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">จังหวัด</label>
                <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="เลือกจังหวัด" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                    {provinces?.map((p) => (
                      <SelectItem key={p.province} value={p.province} className="text-white">
                        <span className="flex items-center gap-2">
                          {p.province}
                          <span className="text-xs text-slate-400">({p.totalZones} เขต)</span>
                          {p.hasDetailedData && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-green-500/50 text-green-400">
                              มีข้อมูล
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zone Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">เขตเลือกตั้ง</label>
                <Select
                  value={selectedZone.toString()}
                  onValueChange={(v) => setSelectedZone(parseInt(v))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="เลือกเขต" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {zoneOptions.map((z) => (
                      <SelectItem key={z} value={z.toString()} className="text-white">
                        เขต {z}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Province Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">สถานะข้อมูล</label>
                <div className="flex items-center gap-2 h-10 px-3 bg-slate-800 border border-slate-700 rounded-md">
                  {provinceInfo?.hasDetailedData ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-400">มีข้อมูลผู้สมัครครบถ้วน</span>
                    </>
                  ) : (
                    <>
                      <Info className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-yellow-400">ข้อมูลเบื้องต้น (กำลังรวบรวม)</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loadingDetail && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            <span className="ml-3 text-slate-400">กำลังโหลดข้อมูล...</span>
          </div>
        )}

        {/* Result */}
        {detail && !loadingDetail && (
          <>
            {detail.found ? (
              <div className="space-y-6">
                {/* Constituency Header */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-400" />
                          {detail.constituency.province} เขตเลือกตั้งที่ {detail.constituency.zone}
                        </CardTitle>
                        <CardDescription className="mt-2 text-slate-400">
                          จาก {detail.totalZones} เขตเลือกตั้ง | ผู้สมัคร {detail.constituency.candidates.length} คน | เลือกตั้ง 8 ก.พ. 2569
                        </CardDescription>
                      </div>
                      {/* GLUE-FIN Badge */}
                      <div className={`px-4 py-2 rounded-lg border ${LEVEL_BG[detail.glueFin.level]}`}>
                        <div className="text-center">
                          <div className="text-xs text-slate-400">GLUE-FIN</div>
                          <div className={`text-2xl font-bold ${LEVEL_COLORS[detail.glueFin.level]}`}>
                            {detail.glueFin.score}
                          </div>
                          <div className={`text-xs ${LEVEL_COLORS[detail.glueFin.level]}`}>
                            {detail.glueFin.levelEmoji} {detail.glueFin.levelDescription}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Coverage */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        พื้นที่ครอบคลุม
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {detail.constituency.coverage.map((area, i) => (
                          <Badge key={i} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Stats 2566 */}
                    {detail.constituency.stats2566 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-400">ผู้มีสิทธิ (2566)</div>
                          <div className="text-lg font-bold text-white">
                            {detail.constituency.stats2566.registeredVoters.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-400">ผู้มาใช้สิทธิ</div>
                          <div className="text-lg font-bold text-white">
                            {detail.constituency.stats2566.turnout.toLocaleString()}
                            <span className="text-sm text-slate-400 ml-1">
                              ({detail.constituency.stats2566.turnoutPercent}%)
                            </span>
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-400">บัตรดี</div>
                          <div className="text-lg font-bold text-green-400">
                            {detail.constituency.stats2566.validVotes.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-400">บัตรเสีย</div>
                          <div className="text-lg font-bold text-red-400">
                            {detail.constituency.stats2566.invalidVotes.toLocaleString()}
                            <span className="text-sm text-slate-400 ml-1">
                              ({detail.constituency.stats2566.invalidPercent}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Candidates Table */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-400" />
                      รายชื่อผู้สมัคร สส. ปี 2569
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      ข้อมูลจาก กกต. ประกาศอย่างเป็นทางการ
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">หมายเลข</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">ชื่อผู้สมัคร</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">พรรค</th>
                            {detail.constituency.candidates.some(c => c.votes2566) && (
                              <>
                                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">คะแนน 2566</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase">%</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {detail.constituency.candidates.map((candidate, idx) => (
                            <tr
                              key={candidate.number}
                              className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                                idx === 0 ? "bg-slate-800/20" : ""
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-sm">
                                  {candidate.number}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-white font-medium">{candidate.name}</span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  className="text-xs"
                                  style={{
                                    backgroundColor: `${PARTY_COLORS[candidate.party] || "#6b7280"}20`,
                                    color: PARTY_COLORS[candidate.party] || "#9ca3af",
                                    borderColor: `${PARTY_COLORS[candidate.party] || "#6b7280"}50`,
                                  }}
                                  variant="outline"
                                >
                                  {candidate.party}
                                </Badge>
                              </td>
                              {detail.constituency.candidates.some(c => c.votes2566) && (
                                <>
                                  <td className="py-3 px-4 text-right">
                                    {candidate.votes2566 ? (
                                      <span className="text-white font-mono">
                                        {candidate.votes2566.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">-</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {candidate.votePercent2566 ? (
                                      <span className="text-slate-300 font-mono">
                                        {candidate.votePercent2566}%
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">-</span>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      ที่มา: สำนักงานคณะกรรมการการเลือกตั้ง (กกต.), Thethaiger
                    </div>
                  </CardContent>
                </Card>

                {/* GLUE-FIN Analysis */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-400" />
                      GLUE-FIN Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      ดัชนีรวมวัดความน่าเชื่อถือของผลการเลือกตั้ง
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Score Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">คะแนนรวม</span>
                          <span className={`font-bold ${LEVEL_COLORS[detail.glueFin.level]}`}>
                            {detail.glueFin.score}/100
                          </span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${detail.glueFin.score}%`,
                              backgroundColor:
                                detail.glueFin.level === "normal" ? "#22c55e" :
                                detail.glueFin.level === "review" ? "#eab308" :
                                detail.glueFin.level === "suspicious" ? "#f97316" :
                                detail.glueFin.level === "critical" ? "#ef4444" : "#6b7280",
                            }}
                          />
                        </div>
                      </div>

                      {/* Components */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {detail.glueFin.components.map((comp) => (
                          <div key={comp.name} className="bg-slate-800/50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-slate-400">{comp.name}</span>
                              <span className="text-xs text-slate-500">
                                w={comp.weight}
                              </span>
                            </div>
                            <div className="text-sm font-mono text-white">
                              {comp.normalizedValue.toFixed(3)}
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${comp.normalizedValue * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recommendation */}
                      <div className={`p-3 rounded-lg border ${LEVEL_BG[detail.glueFin.level]}`}>
                        <div className="flex items-center gap-2">
                          {detail.glueFin.level === "normal" ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          )}
                          <span className="text-sm text-slate-300">
                            คำแนะนำ: {detail.glueFin.recommendation}
                          </span>
                        </div>
                      </div>

                      {/* Formula */}
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">สูตรคำนวณ</div>
                        <code className="text-xs text-slate-400 font-mono break-all">
                          {detail.glueFin.formula}
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* No Data */
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-yellow-500/10 rounded-full inline-block">
                      <Info className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white">
                      ยังไม่มีข้อมูลผู้สมัครสำหรับ {selectedProvince} เขต {selectedZone}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      ข้อมูลผู้สมัครกำลังถูกรวบรวมจาก กกต. ขณะนี้มีข้อมูลครบถ้วนสำหรับ
                      จังหวัดยโสธร (3 เขต) คุณสามารถเลือกจังหวัดยโสธรเพื่อดูข้อมูลตัวอย่าง
                    </p>
                    <Button
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                      onClick={() => {
                        setSelectedProvince("ยโสธร");
                        setSelectedZone(2);
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      ดูข้อมูลยโสธร เขต 2
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Quick Navigation - Other Zones */}
        {detail?.found && detail.totalZones > 1 && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">เขตเลือกตั้งอื่นใน{selectedProvince}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: detail.totalZones }, (_, i) => i + 1).map((z) => (
                  <Button
                    key={z}
                    variant={z === selectedZone ? "default" : "outline"}
                    size="sm"
                    className={
                      z === selectedZone
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "border-slate-600 text-slate-300 hover:bg-slate-800"
                    }
                    onClick={() => setSelectedZone(z)}
                  >
                    เขต {z}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
