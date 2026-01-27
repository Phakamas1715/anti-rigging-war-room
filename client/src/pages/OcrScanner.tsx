import { useState, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Camera, Upload, Scan, CheckCircle, AlertTriangle, XCircle,
  ArrowLeft, Image, Loader2, Edit, Send, RefreshCw, Eye,
  FileText, Sparkles, Zap, Settings, Key
} from "lucide-react";

interface VoteCount {
  candidateName: string;
  candidateNumber: number;
  voteCount: number;
  confidence: number;
}

interface OcrResult {
  success: boolean;
  stationCode?: string;
  totalVoters?: number;
  totalBallots?: number;
  spoiledBallots?: number;
  votes: VoteCount[];
  rawText?: string;
  error?: string;
  processingTime?: number;
  validation?: {
    isValid: boolean;
    warnings: string[];
  };
}

export default function OcrScanner() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [editedVotes, setEditedVotes] = useState<VoteCount[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // OCR mutation
  const ocrMutation = trpc.ocr.analyzeBase64.useMutation();
  const demoQuery = trpc.ocr.testDemo.useQuery(undefined, { enabled: false });

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      const base64 = result.split(",")[1];
      setPhotoBase64(base64);
      setPhotoMimeType(file.type);
      setOcrResult(null);
      setEditedVotes([]);
      setIsEditing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleOcrProcess = async () => {
    if (!photoBase64) {
      toast.error("กรุณาถ่ายรูปหรืออัปโหลดรูปภาพก่อน");
      return;
    }

    if (!apiKey) {
      setShowApiKeyInput(true);
      toast.error("กรุณาใส่ DeepSeek API Key");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await ocrMutation.mutateAsync({
        base64Image: photoBase64,
        mimeType: photoMimeType || "image/jpeg",
        apiKey,
      });

      setOcrResult(result);
      setEditedVotes(result.votes || []);
      
      if (result.success) {
        toast.success(`อ่านข้อมูลสำเร็จ (${result.processingTime}ms)`);
      } else {
        toast.error(result.error || "ไม่สามารถอ่านข้อมูลได้");
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการประมวลผล");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoOcr = async () => {
    setIsProcessing(true);
    try {
      const result = await demoQuery.refetch();
      if (result.data) {
        setOcrResult(result.data);
        setEditedVotes(result.data.votes || []);
        toast.success("โหลดข้อมูลตัวอย่างสำเร็จ");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoteEdit = (index: number, field: keyof VoteCount, value: string) => {
    const newVotes = [...editedVotes];
    if (field === "voteCount" || field === "candidateNumber" || field === "confidence") {
      newVotes[index] = { ...newVotes[index], [field]: parseInt(value) || 0 };
    } else {
      newVotes[index] = { ...newVotes[index], [field]: value };
    }
    setEditedVotes(newVotes);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-500";
    if (confidence >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-500/20 text-green-400">สูง</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-500/20 text-yellow-400">ปานกลาง</Badge>;
    return <Badge className="bg-red-500/20 text-red-400">ต่ำ</Badge>;
  };

  const totalVotes = editedVotes.reduce((sum, v) => sum + v.voteCount, 0);

  // Not logged in
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex items-center h-14">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold ml-2">OCR Scanner</h1>
          </div>
        </header>

        <main className="container py-8">
          <Card className="max-w-md mx-auto bg-card/50 border-border/50">
            <CardHeader className="text-center">
              <Scan className="h-16 w-16 mx-auto text-primary mb-4" />
              <CardTitle>เข้าสู่ระบบเพื่อใช้งาน OCR</CardTitle>
              <CardDescription>
                ระบบอ่านตัวเลขจากกระดานนับคะแนนอัตโนมัติ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>เข้าสู่ระบบ</a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold ml-2 flex items-center gap-2">
              <Scan className="h-5 w-5 text-primary" />
              OCR Scanner
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          >
            <Key className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* API Key Input */}
        {showApiKeyInput && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" />
                DeepSeek API Key
              </CardTitle>
              <CardDescription>
                ใส่ API Key จาก platform.deepseek.com เพื่อใช้งาน OCR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowApiKeyInput(false)}
                >
                  บันทึก
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                API Key จะถูกเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น
              </p>
            </CardContent>
          </Card>
        )}

        {/* Photo Capture Section */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              ถ่ายรูปกระดานนับคะแนน
            </CardTitle>
            <CardDescription>
              ถ่ายรูปหรืออัปโหลดรูปภาพกระดานนับคะแนน ระบบจะอ่านตัวเลขให้อัตโนมัติ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo Preview */}
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full rounded-lg border border-border/50"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPhotoPreview(null);
                    setPhotoBase64(null);
                    setOcrResult(null);
                    setEditedVotes([]);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  ลบ
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
                <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  ยังไม่มีรูปภาพ
                </p>
              </div>
            )}

            {/* Capture Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-5 w-5 mr-2" />
                ถ่ายรูป
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 mr-2" />
                อัปโหลด
              </Button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoCapture}
            />

            {/* OCR Button */}
            <div className="flex gap-2">
              <Button
                className="flex-1 h-12 bg-primary hover:bg-primary/90"
                onClick={handleOcrProcess}
                disabled={!photoBase64 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    กำลังประมวลผล...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    อ่านด้วย AI (DeepSeek)
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={handleDemoOcr}
                disabled={isProcessing}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* OCR Results */}
        {ocrResult && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  ผลการอ่าน OCR
                </CardTitle>
                {ocrResult.success ? (
                  <Badge className="bg-green-500/20 text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    สำเร็จ
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400">
                    <XCircle className="h-3 w-3 mr-1" />
                    ล้มเหลว
                  </Badge>
                )}
              </div>
              {ocrResult.processingTime && (
                <CardDescription>
                  ใช้เวลา {ocrResult.processingTime}ms
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {ocrResult.success ? (
                <>
                  {/* Station Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">รหัสหน่วย</Label>
                      <p className="font-mono font-bold">{ocrResult.stationCode || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">ผู้มีสิทธิ์</Label>
                      <p className="font-bold">{ocrResult.totalVoters?.toLocaleString() || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">บัตรที่ใช้</Label>
                      <p className="font-bold">{ocrResult.totalBallots?.toLocaleString() || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">บัตรเสีย</Label>
                      <p className="font-bold">{ocrResult.spoiledBallots?.toLocaleString() || "-"}</p>
                    </div>
                  </div>

                  {/* Validation Warnings */}
                  {ocrResult.validation?.warnings && ocrResult.validation.warnings.length > 0 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-500 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">คำเตือน</span>
                      </div>
                      <ul className="text-sm text-yellow-400 space-y-1">
                        {ocrResult.validation.warnings.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />

                  {/* Vote Counts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">คะแนนผู้สมัคร</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {isEditing ? "เสร็จสิ้น" : "แก้ไข"}
                      </Button>
                    </div>

                    {editedVotes.map((vote, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {vote.candidateNumber}
                        </div>
                        <div className="flex-1">
                          {isEditing ? (
                            <Input
                              value={vote.candidateName}
                              onChange={(e) => handleVoteEdit(index, "candidateName", e.target.value)}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <p className="font-medium">{vote.candidateName}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={vote.voteCount}
                              onChange={(e) => handleVoteEdit(index, "voteCount", e.target.value)}
                              className="h-8 w-20 text-right"
                            />
                          ) : (
                            <p className="text-xl font-bold">{vote.voteCount.toLocaleString()}</p>
                          )}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-xs ${getConfidenceColor(vote.confidence)}`}>
                              {vote.confidence}%
                            </span>
                            {getConfidenceBadge(vote.confidence)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/30">
                      <span className="font-medium">รวมคะแนน</span>
                      <span className="text-2xl font-bold text-primary">
                        {totalVotes.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setOcrResult(null);
                        setEditedVotes([]);
                        setPhotoPreview(null);
                        setPhotoBase64(null);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      สแกนใหม่
                    </Button>
                    <Button className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      ส่งข้อมูล
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <p className="text-red-400 mb-2">ไม่สามารถอ่านข้อมูลได้</p>
                  <p className="text-sm text-muted-foreground">{ocrResult.error}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setOcrResult(null)}
                  >
                    ลองใหม่
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">วิธีใช้งาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                1
              </div>
              <p>ถ่ายรูปกระดานนับคะแนนให้ชัดเจน ตัวเลขต้องอ่านออก</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                2
              </div>
              <p>กดปุ่ม "อ่านด้วย AI" เพื่อให้ระบบวิเคราะห์รูปภาพ</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                3
              </div>
              <p>ตรวจสอบผลลัพธ์และแก้ไขหากจำเป็น (ดูค่าความมั่นใจ)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                4
              </div>
              <p>กดส่งข้อมูลเพื่อบันทึกเข้าระบบ PVT</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
