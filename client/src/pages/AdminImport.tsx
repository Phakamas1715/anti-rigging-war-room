import { useState, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileSpreadsheet, Database, CheckCircle, XCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

type DataType = "polling_stations" | "election_results" | "network_transactions";

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export default function AdminImport() {
  const [activeTab, setActiveTab] = useState<DataType>("polling_stations");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSVMutation = trpc.import.parseCSV.useMutation();
  const importStationsMutation = trpc.import.pollingStations.useMutation();
  const importResultsMutation = trpc.import.electionResults.useMutation();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setParsedData(null);
    setImportResult(null);

    try {
      let csvContent = "";

      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // Parse Excel file
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        csvContent = XLSX.utils.sheet_to_csv(firstSheet);
      } else if (file.name.endsWith(".csv")) {
        // Read CSV file
        csvContent = await file.text();
      } else {
        toast.error("รองรับเฉพาะไฟล์ CSV และ Excel (.xlsx, .xls)");
        setIsUploading(false);
        return;
      }

      const result = await parseCSVMutation.mutateAsync({
        csvContent,
        dataType: activeTab,
      });

      setParsedData(result);
      toast.success(`อ่านข้อมูลสำเร็จ: ${result.rowCount} แถว`);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setIsUploading(true);
    setImportResult(null);

    try {
      if (activeTab === "polling_stations") {
        const data = parsedData.rows.map(row => ({
          stationCode: row.stationcode || row.station_code || row.code || "",
          name: row.name || row.station_name || "",
          province: row.province || row.จังหวัด || "",
          district: row.district || row.อำเภอ || "",
          subDistrict: row.subdistrict || row.sub_district || row.ตำบล || undefined,
          registeredVoters: parseInt(row.registeredvoters || row.registered_voters || row.voters || "0") || undefined,
          latitude: row.latitude || row.lat || undefined,
          longitude: row.longitude || row.lng || row.lon || undefined,
        }));

        const result = await importStationsMutation.mutateAsync(data);
        setImportResult(result);
        
        if (result.success > 0) {
          toast.success(`นำเข้าสำเร็จ ${result.success} หน่วย`);
        }
        if (result.failed > 0) {
          toast.error(`นำเข้าล้มเหลว ${result.failed} หน่วย`);
        }
      } else if (activeTab === "election_results") {
        const data = parsedData.rows.map(row => ({
          stationCode: row.stationcode || row.station_code || row.code || "",
          totalVoters: parseInt(row.totalvoters || row.total_voters || row.voters || "0"),
          validVotes: parseInt(row.validvotes || row.valid_votes || row.valid || "0"),
          invalidVotes: parseInt(row.invalidvotes || row.invalid_votes || row.invalid || "0"),
          candidateAVotes: parseInt(row.candidateavotes || row.candidate_a_votes || row.candidate_a || row.votesa || "0"),
          candidateBVotes: parseInt(row.candidatebvotes || row.candidate_b_votes || row.candidate_b || row.votesb || "0"),
          source: (row.source || "official") as "official" | "crowdsourced" | "pvt",
        }));

        const result = await importResultsMutation.mutateAsync(data);
        setImportResult(result);
        
        if (result.success > 0) {
          toast.success(`นำเข้าสำเร็จ ${result.success} รายการ`);
        }
        if (result.failed > 0) {
          toast.error(`นำเข้าล้มเหลว ${result.failed} รายการ`);
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = (type: DataType) => {
    let csvContent = "";
    
    if (type === "polling_stations") {
      csvContent = "stationCode,name,province,district,subDistrict,registeredVoters,latitude,longitude\n";
      csvContent += "10-001,หน่วยเลือกตั้งที่ 1,กรุงเทพมหานคร,พระนคร,พระบรมมหาราชวัง,500,13.7563,100.5018\n";
    } else if (type === "election_results") {
      csvContent = "stationCode,totalVoters,validVotes,invalidVotes,candidateAVotes,candidateBVotes,source\n";
      csvContent += "10-001,500,450,10,250,200,official\n";
    } else if (type === "network_transactions") {
      csvContent = "sourceNode,targetNode,transactionType,amount\n";
      csvContent += "User_001,User_002,money_transfer,1000\n";
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `template_${type}.csv`;
    link.click();
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
            <h1 className="text-xl font-bold text-foreground">Admin: นำเข้าข้อมูล</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as DataType);
          setParsedData(null);
          setImportResult(null);
        }}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="polling_stations" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              หน่วยเลือกตั้ง
            </TabsTrigger>
            <TabsTrigger value="election_results" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              ผลการเลือกตั้ง
            </TabsTrigger>
            <TabsTrigger value="network_transactions" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              ธุรกรรมเครือข่าย
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>อัปโหลดไฟล์</CardTitle>
                <CardDescription>
                  รองรับไฟล์ CSV และ Excel (.xlsx, .xls)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  )}
                  <p className="mt-4 text-muted-foreground">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    รองรับ: CSV, XLSX, XLS
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => downloadTemplate(activeTab)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  ดาวน์โหลด Template
                </Button>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>ตัวอย่างข้อมูล</CardTitle>
                <CardDescription>
                  {parsedData ? `${parsedData.rowCount} แถว` : "ยังไม่มีข้อมูล"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parsedData ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto max-h-64 border border-border/50 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            {parsedData.headers.map((header, i) => (
                              <th key={i} className="px-3 py-2 text-left font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.rows.slice(0, 10).map((row, i) => (
                            <tr key={i} className="border-t border-border/30">
                              {parsedData.headers.map((header, j) => (
                                <td key={j} className="px-3 py-2 text-muted-foreground">
                                  {row[header] || "-"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {parsedData.rowCount > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        แสดง 10 จาก {parsedData.rowCount} แถว
                      </p>
                    )}

                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={handleImport}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4 mr-2" />
                      )}
                      นำเข้าข้อมูล ({parsedData.rowCount} แถว)
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>อัปโหลดไฟล์เพื่อดูตัวอย่างข้อมูล</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Import Result */}
          {importResult && (
            <Card className="mt-8 bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>ผลการนำเข้า</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-green-500">{importResult.success}</p>
                      <p className="text-sm text-muted-foreground">สำเร็จ</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-lg">
                    <XCircle className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold text-red-500">{importResult.failed}</p>
                      <p className="text-sm text-muted-foreground">ล้มเหลว</p>
                    </div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">รายละเอียดข้อผิดพลาด:</p>
                    <div className="max-h-40 overflow-y-auto bg-muted/30 rounded-lg p-3">
                      {importResult.errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-400 mb-1">
                          • {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Instructions */}
          <Card className="mt-8 bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>คำแนะนำการใช้งาน</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <TabsContent value="polling_stations" className="mt-0">
                <h4 className="text-foreground">รูปแบบข้อมูลหน่วยเลือกตั้ง</h4>
                <p className="text-muted-foreground">คอลัมน์ที่จำเป็น: stationCode, name, province, district</p>
                <p className="text-muted-foreground">คอลัมน์เพิ่มเติม: subDistrict, registeredVoters, latitude, longitude</p>
              </TabsContent>
              <TabsContent value="election_results" className="mt-0">
                <h4 className="text-foreground">รูปแบบข้อมูลผลการเลือกตั้ง</h4>
                <p className="text-muted-foreground">คอลัมน์ที่จำเป็น: stationCode, totalVoters, validVotes, invalidVotes, candidateAVotes, candidateBVotes</p>
                <p className="text-muted-foreground">คอลัมน์เพิ่มเติม: source (official/crowdsourced/pvt)</p>
              </TabsContent>
              <TabsContent value="network_transactions" className="mt-0">
                <h4 className="text-foreground">รูปแบบข้อมูลธุรกรรมเครือข่าย</h4>
                <p className="text-muted-foreground">คอลัมน์ที่จำเป็น: sourceNode, targetNode</p>
                <p className="text-muted-foreground">คอลัมน์เพิ่มเติม: transactionType, amount</p>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </main>
    </div>
  );
}
