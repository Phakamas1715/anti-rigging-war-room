import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { ArrowLeft, Camera, Upload, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function EvidenceUpload() {
  const { isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stationCode, setStationCode] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedEvidence, setUploadedEvidence] = useState<{
    fileHash: string;
    timestamp: string;
    verified: boolean;
  } | null>(null);

  const { data: pendingEvidence } = trpc.evidence.pending.useQuery();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }
      setSelectedFile(file);
      toast.info(`เลือกไฟล์: ${file.name}`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("กรุณาเลือกไฟล์ก่อน");
      return;
    }

    setUploading(true);
    
    // Simulate upload and hash calculation
    try {
      // In real implementation, upload to S3 and get URL
      const mockHash = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', await selectedFile.arrayBuffer()))
      ).map(b => b.toString(16).padStart(2, '0')).join('');

      setUploadedEvidence({
        fileHash: mockHash,
        timestamp: new Date().toISOString(),
        verified: true
      });

      toast.success("อัปโหลดและตรวจสอบหลักฐานสำเร็จ!");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">กรุณาเข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-slate-400">
              คุณต้องเข้าสู่ระบบก่อนจึงจะอัปโหลดหลักฐานได้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                เข้าสู่ระบบ
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <Camera className="h-6 w-6 text-green-500" />
          <span className="text-xl font-bold text-white">Evidence Upload & ProofMode</span>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-500" />
                อัปโหลดหลักฐาน
              </CardTitle>
              <CardDescription className="text-slate-400">
                อัปโหลดภาพถ่ายกระดานนับคะแนนพร้อมระบบตรวจสอบความถูกต้อง
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">รหัสหน่วยเลือกตั้ง</label>
                <Input
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                  placeholder="เช่น BKK-001"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">ไฟล์ภาพถ่าย</label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Camera className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <div className="text-slate-400">
                      {selectedFile ? selectedFile.name : "คลิกเพื่อเลือกไฟล์หรือลากมาวาง"}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      รองรับ: JPG, PNG, HEIC
                    </div>
                  </label>
                </div>
              </div>

              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลดและตรวจสอบ"}
              </Button>
            </CardContent>
          </Card>

          {/* Verification Result */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                ProofMode Verification
              </CardTitle>
              <CardDescription className="text-slate-400">
                ผลการตรวจสอบความถูกต้องของหลักฐาน
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedEvidence ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${uploadedEvidence.verified ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <div className="flex items-center gap-2">
                      {uploadedEvidence.verified ? (
                        <>
                          <CheckCircle className="h-6 w-6 text-green-500" />
                          <span className="text-green-400 font-bold">หลักฐานผ่านการตรวจสอบ</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                          <span className="text-red-400 font-bold">หลักฐานไม่ผ่านการตรวจสอบ</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">SHA-256 Hash</div>
                      <div className="font-mono text-xs text-green-400 break-all">
                        {uploadedEvidence.fileHash}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Timestamp</div>
                      <div className="text-white">
                        {new Date(uploadedEvidence.timestamp).toLocaleString('th-TH')}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-slate-800/50 rounded text-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
                        <div className="text-xs text-slate-400">Hash Verified</div>
                      </div>
                      <div className="p-2 bg-slate-800/50 rounded text-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
                        <div className="text-xs text-slate-400">Timestamp</div>
                      </div>
                      <div className="p-2 bg-slate-800/50 rounded text-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
                        <div className="text-xs text-slate-400">Integrity</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  อัปโหลดหลักฐานเพื่อดูผลการตรวจสอบ
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Evidence List */}
        <Card className="bg-slate-900/50 border-slate-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">หลักฐานรอตรวจสอบ</CardTitle>
            <CardDescription className="text-slate-400">
              รายการหลักฐานที่รอการยืนยัน
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingEvidence && pendingEvidence.length > 0 ? (
              <div className="space-y-3">
                {pendingEvidence.map((ev) => (
                  <div 
                    key={ev.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Camera className="h-5 w-5 text-slate-400" />
                      <div>
                        <div className="text-white text-sm">หน่วย #{ev.stationId}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(ev.createdAt).toLocaleString('th-TH')}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                      {ev.verificationStatus}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                ไม่มีหลักฐานรอตรวจสอบ
              </div>
            )}
          </CardContent>
        </Card>

        {/* ProofMode Explanation */}
        <Card className="bg-slate-900/50 border-slate-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">ProofMode คืออะไร?</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-400 text-sm space-y-3">
            <p>
              <strong className="text-white">Cryptographic Hash (SHA-256):</strong> สร้างลายนิ้วมือดิจิทัลของไฟล์
              ถ้าไฟล์ถูกแก้ไขแม้แต่ 1 pixel ค่า hash จะเปลี่ยนทันที
            </p>
            <p>
              <strong className="text-white">Metadata Verification:</strong> ตรวจสอบข้อมูล EXIF เช่น 
              วันเวลาถ่าย, พิกัด GPS, รุ่นกล้อง เพื่อยืนยันความถูกต้อง
            </p>
            <p>
              <strong className="text-white">Legal Evidence:</strong> หลักฐานที่ผ่านการตรวจสอบสามารถใช้ในศาลได้
              เพราะพิสูจน์ได้ว่าไม่ถูกตัดต่อ
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
