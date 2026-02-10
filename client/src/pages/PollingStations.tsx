import { useState, useMemo } from "react";
import { Search, MapPin, Building, Users, CheckCircle, Clock, Eye, Filter, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
// note: avoid unused imports

const ITEMS_PER_PAGE = 20;

export default function PollingStations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "reported" | "unreported">("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);

  // Queries
  const stationsQuery = trpc.stations.list.useQuery();
  const stationStatusQuery = trpc.volunteer.stationStatus.useQuery();
  
  // Get selected station details
  const selectedStationData = stationsQuery.data?.find(s => s.id === selectedStation);
  const selectedStationStatus = stationStatusQuery.data?.find(s => s.id === selectedStation);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [imageA, setImageA] = useState<string | null>(null);
  const [imageB, setImageB] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  const ocrMutation = trpc.ocr.crossValidate.useMutation();

  function toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('File read error'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  const handleFileA = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const data = await toDataUrl(f);
    setImageA(data);
  };

  const handleFileB = async (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const data = await toDataUrl(f);
    setImageB(data);
  };

  const submitOcr = async () => {
    if (!imageA || !imageB) return;
    setOcrResult(null);
    try {
      const res = await ocrMutation.mutateAsync({ imageA, imageB });
      setOcrResult(res);
    } catch (err) {
      setOcrResult({ error: (err as Error).message || String(err) });
    }
  };

  // Get unique provinces for filter
  const provinces = useMemo(() => {
    if (!stationsQuery.data) return [];
    const uniqueProvinces = Array.from(new Set(stationsQuery.data.map(s => s.province)));
    return uniqueProvinces.sort();
  }, [stationsQuery.data]);

  // Filter and search stations
  const filteredStations = useMemo(() => {
    if (!stationsQuery.data || !stationStatusQuery.data) return [];

    let filtered = stationsQuery.data;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(station =>
        station.stationCode.toLowerCase().includes(term) ||
        station.name.toLowerCase().includes(term) ||
        station.province.toLowerCase().includes(term) ||
        station.district.toLowerCase().includes(term) ||
        (station.subDistrict && station.subDistrict.toLowerCase().includes(term))
      );
    }

    // Province filter
    if (provinceFilter !== "all") {
      filtered = filtered.filter(station => station.province === provinceFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(station => {
        const status = stationStatusQuery.data.find(s => s.id === station.id);
        if (statusFilter === "reported") {
          return status?.hasSubmission;
        } else {
          return !status?.hasSubmission;
        }
      });
    }

    return filtered;
  }, [stationsQuery.data, stationStatusQuery.data, searchTerm, provinceFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStations.length / ITEMS_PER_PAGE);
  const paginatedStations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStations, currentPage]);

  // Stats
  const stats = useMemo(() => {
    if (!stationsQuery.data || !stationStatusQuery.data) {
      return { total: 0, reported: 0, unreported: 0 };
    }

    const total = stationsQuery.data.length;
    const reported = stationStatusQuery.data.filter(s => s.hasSubmission).length;
    const unreported = total - reported;

    return { total, reported, unreported };
  }, [stationsQuery.data, stationStatusQuery.data]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  if (stationsQuery.isLoading || stationStatusQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">หน่วยเลือกตั้ง</h1>
          <p className="text-muted-foreground">
            ค้นหาและจัดการข้อมูลหน่วยเลือกตั้งทั้งหมด
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">หน่วยเลือกตั้งทั้งหมด</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                หน่วยในระบบ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายงานผลแล้ว</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.reported.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.reported / stats.total) * 100).toFixed(1) : 0}% ความครบถ้วน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ยังไม่รายงาน</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unreported.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                รอการรายงาน
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>ค้นหาและกรอง</CardTitle>
            <CardDescription>
              ค้นหาด้วยรหัสหน่วย ชื่อ จังหวัด อำเภอ หรือตำบล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหารหัสหน่วย, ชื่อ, จังหวัด, อำเภอ..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange();
                  }}
                  className="pl-10"
                />
              </div>

              {/* Province Filter */}
              <Select
                value={provinceFilter}
                onValueChange={(value) => {
                  setProvinceFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="เลือกจังหวัด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกจังหวัด</SelectItem>
                  {provinces.map(province => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "reported" | "unreported") => {
                  setStatusFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="reported">รายงานแล้ว</SelectItem>
                  <SelectItem value="unreported">ยังไม่รายงาน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                พบ {filteredStations.length.toLocaleString()} หน่วยเลือกตั้ง
                {(searchTerm || provinceFilter !== "all" || statusFilter !== "all") && 
                  ` จากทั้งหมด ${stats.total.toLocaleString()} หน่วย`
                }
              </p>
              {(searchTerm || provinceFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setProvinceFilter("all");
                    setStatusFilter("all");
                    handleFilterChange();
                  }}
                >
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">รหัสหน่วย</TableHead>
                    <TableHead>ชื่อหน่วยเลือกตั้ง</TableHead>
                    <TableHead>อำเภอ</TableHead>
                    <TableHead>จังหวัด</TableHead>
                    <TableHead className="text-center">ผู้มีสิทธิ์</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-8 w-8" />
                          <p>ไม่พบหน่วยเลือกตั้งที่ตรงกับเงื่อนไขการค้นหา</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStations.map((station) => {
                      const status = stationStatusQuery.data?.find(s => s.id === station.id);
                      const hasReported = status?.hasSubmission|| false;

                      return (
                        <TableRow key={station.id}>
                          <TableCell className="font-mono font-medium">
                            {station.stationCode}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{station.name}</span>
                              {station.subDistrict && (
                                <span className="text-xs text-muted-foreground">
                                  ต.{station.subDistrict}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{station.district}</TableCell>
                          <TableCell>{station.province}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {station.registeredVoters?.toLocaleString() || "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {hasReported ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                รายงานแล้ว
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                ยังไม่รายงาน
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedStation(station.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              ดูรายละเอียด
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  หน้า {currentPage} จาก {totalPages}
                  <span className="ml-2">
                    (แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredStations.length)} จาก {filteredStations.length.toLocaleString()})
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    ก่อนหน้า
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={selectedStation !== null} onOpenChange={() => setSelectedStation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>รายละเอียดหน่วยเลือกตั้ง</DialogTitle>
              <DialogDescription>
                {selectedStationData?.stationCode}
              </DialogDescription>
            </DialogHeader>

            {selectedStationData && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ชื่อหน่วยเลือกตั้ง</label>
                    <p className="text-base font-medium">{selectedStationData.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">รหัสหน่วย</label>
                    <p className="text-base font-mono">{selectedStationData.stationCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">จังหวัด</label>
                    <p className="text-base">{selectedStationData.province}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">อำเภอ</label>
                    <p className="text-base">{selectedStationData.district}</p>
                  </div>
                  {selectedStationData.subDistrict && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ตำบล</label>
                      <p className="text-base">{selectedStationData.subDistrict}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ผู้มีสิทธิ์เลือกตั้ง</label>
                    <p className="text-base">
                      {selectedStationData.registeredVoters?.toLocaleString() || "ไม่ระบุ"}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {(selectedStationData.latitude || selectedStationData.longitude) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">พิกัด</label>
                    <p className="text-base font-mono">
                      {selectedStationData.latitude}, {selectedStationData.longitude}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">สถานะการรายงาน</label>
                  {selectedStationStatus?.hasSubmission? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        มีการรายงานผลแล้ว
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        จำนวนการรายงาน: {selectedStationStatus.submissionCount || 1} ครั้ง
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      ยังไม่มีการรายงานผล
                    </Badge>
                  )}
                </div>

                {/* OCR Cross-Validation */}
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOcrDialogOpen(true);
                      setOcrResult(null);
                    }}
                  >
                    ทดสอบ OCR (ส่งภาพ ส.ส.5/11 & ส.ส.5/18)
                  </Button>
                </div>

                {/* Timestamps */}
                <div className="grid gap-2 text-xs text-muted-foreground border-t pt-4">
                  <div className="flex justify-between">
                    <span>สร้างเมื่อ:</span>
                    <span>{new Date(selectedStationData.createdAt).toLocaleString('th-TH')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>อัพเดทล่าสุด:</span>
                    <span>{new Date(selectedStationData.updatedAt).toLocaleString('th-TH')}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* OCR Upload Dialog */}
        <Dialog open={ocrDialogOpen} onOpenChange={(open) => { if (!open) { setImageA(null); setImageB(null); setOcrResult(null); } setOcrDialogOpen(open); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>OCR Cross-Validation (ส.ส.5/11 vs ส.ส.5/18)</DialogTitle>
              <DialogDescription>อัพโหลดภาพสองรายการเพื่อทดสอบความสอดคล้องของผล OCR</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm">ภาพ ส.ส.5/11</label>
                <input type="file" accept="image/*" onChange={handleFileA} />
                {imageA && <img src={imageA} alt="A" className="mt-2 max-h-48" />}
              </div>

              <div>
                <label className="text-sm">ภาพ ส.ส.5/18</label>
                <input type="file" accept="image/*" onChange={handleFileB} />
                {imageB && <img src={imageB} alt="B" className="mt-2 max-h-48" />}
              </div>

              <div className="flex gap-2">
                <Button onClick={submitOcr} disabled={ocrMutation.isPending || !imageA || !imageB}>
                  {ocrMutation.isPending ? 'กำลังประมวลผล...' : 'รัน OCR และเปรียบเทียบ'}
                </Button>
                <Button variant="ghost" onClick={() => setOcrDialogOpen(false)}>ปิด</Button>
              </div>

              {ocrResult && (
                <div className="mt-4 overflow-auto text-sm">
                  {ocrResult.error && <div className="text-red-600">Error: {ocrResult.error}</div>}
                  {ocrResult.comparison && (
                    <div>
                      <p>Overall similarity: {(ocrResult.comparison.overallSimilarity * 100 || 0).toFixed(1)}%</p>
                      <p>Station codes: {ocrResult.comparison.stationCodes.a || '-'} / {ocrResult.comparison.stationCodes.b || '-'}</p>
                      <div className="mt-2 space-y-2">
                        {ocrResult.comparison.comparisons.map((c: any) => (
                          <div key={c.candidateNumber} className="border p-2 rounded">
                            <div className="font-mono">หมายเลข {c.candidateNumber}</div>
                            <div className="text-xs">A: {c.a ? c.a.voteCount : '-'} (conf {c.a?.confidence || '-'})</div>
                            <div className="text-xs">B: {c.b ? c.b.voteCount : '-'} (conf {c.b?.confidence || '-'})</div>
                            <div className="text-xs">diff: {c.diff === null ? 'n/a' : c.diff}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
