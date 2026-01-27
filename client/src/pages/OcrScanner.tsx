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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Camera, Upload, Scan, CheckCircle, AlertTriangle, XCircle,
  ArrowLeft, Image, Loader2, Edit, Send, RefreshCw, Eye,
  FileText, Sparkles, Zap, Settings, Key, Cloud
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
  const [apiProvider, setApiProvider] = useState<"huggingface" | "deepseek">("huggingface");
  const [hfToken, setHfToken] = useState("");
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
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

  // OCR mutations
  const ocrDeepseekMutation = trpc.ocr.analyzeBase64.useMutation();
  const ocrHfMutation = trpc.ocr.analyzeWithHF.useMutation();
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

    // Check API key based on provider
    if (apiProvider === "huggingface" && !hfToken) {
      setShowApiKeyInput(true);
      toast.error("กรุณาใส่ Hugging Face Token");
      return;
    }

    if (apiProvider === "deepseek" && !deepseekApiKey) {
      setShowApiKeyInput(true);
      toast.error("กรุณาใส่ DeepSeek API Key");
      return;
    }

    setIsProcessing(true);
    try {
      let result: OcrResult;

      if (apiProvider === "huggingface") {
        result = await ocrHfMutation.mutateAsync({
          base64Image: photoBase64,
          hfToken,
        });
      } else {
        result = await ocrDeepseekMutation.mutateAsync({
          base64Image: photoBase64,
          mimeType: photoMimeType || "image/jpeg",
          apiKey: deepseekApiKey,
        });
      }

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
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </header>
        <div className="container py-12 text-center">
          <Scan className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">OCR Scanner</h2>
          <p className="text-muted-foreground mb-6">กรุณาเข้าสู่ระบบเพื่อใช้งาน OCR Scanner</p>
          <Button asChild>
            <a href={getLoginUrl()}>เข้าสู่ระบบ</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-primary" />
              <span className="font-semibold">OCR Scanner</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            >
              <Key className="w-4 h-4 mr-2" />
              API Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Image Capture */}
          <div className="space-y-6">
            {/* API Key Settings */}
            {showApiKeyInput && (
              <Card className="border-primary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    API Settings
                  </CardTitle>
                  <CardDescription>
                    เลือก Provider และใส่ API Key สำหรับ OCR
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={apiProvider} onValueChange={(v) => setApiProvider(v as "huggingface" | "deepseek")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="huggingface" className="flex items-center gap-2">
                        <Cloud className="w-4 h-4" />
                        Hugging Face
                      </TabsTrigger>
                      <TabsTrigger value="deepseek" className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        DeepSeek
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="huggingface" className="space-y-3 mt-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-sm text-blue-400">
                          <strong>Hugging Face DeepSeek-OCR</strong> - ใช้โมเดล deepseek-ai/DeepSeek-OCR ผ่าน Inference API
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          รับ Token ฟรีได้ที่ huggingface.co/settings/tokens
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hfToken">Hugging Face Token</Label>
                        <Input
                          id="hfToken"
                          type="password"
                          placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                          value={hfToken}
                          onChange={(e) => setHfToken(e.target.value)}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="deepseek" className="space-y-3 mt-4">
                      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <p className="text-sm text-purple-400">
                          <strong>DeepSeek Vision API</strong> - ใช้ DeepSeek Chat API พร้อม Vision
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          รับ API Key ได้ที่ platform.deepseek.com
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deepseekKey">DeepSeek API Key</Label>
                        <Input
                          id="deepseekKey"
                          type="password"
                          placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                          value={deepseekApiKey}
                          onChange={(e) => setDeepseekApiKey(e.target.value)}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowApiKeyInput(false)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    บันทึกการตั้งค่า
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Image Capture Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  ถ่ายรูปกระดานนับคะแนน
                </CardTitle>
                <CardDescription>
                  ถ่ายรูปหรืออัปโหลดรูปภาพกระดานนับคะแนนเพื่อให้ AI อ่านข้อมูลอัตโนมัติ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {/* Photo preview */}
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full rounded-lg border border-border"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoBase64(null);
                        setOcrResult(null);
                        setEditedVotes([]);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      ลบรูป
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      ยังไม่มีรูปภาพ
                    </p>
                  </div>
                )}

                {/* Capture buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    ถ่ายรูป
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    อัปโหลด
                  </Button>
                </div>

                <Separator />

                {/* OCR Process button */}
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleOcrProcess}
                    disabled={!photoBase64 || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        กำลังประมวลผล...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        วิเคราะห์ด้วย AI ({apiProvider === "huggingface" ? "HF" : "DeepSeek"})
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDemoOcr}
                    disabled={isProcessing}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    ทดสอบด้วยข้อมูลตัวอย่าง
                  </Button>
                </div>

                {/* Current API Provider indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>Provider:</span>
                  <Badge variant="outline">
                    {apiProvider === "huggingface" ? (
                      <>
                        <Cloud className="w-3 h-3 mr-1" />
                        Hugging Face
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        DeepSeek
                      </>
                    )}
                  </Badge>
                  {(apiProvider === "huggingface" ? hfToken : deepseekApiKey) ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - OCR Results */}
          <div className="space-y-6">
            {/* Results Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    ผลการอ่าน OCR
                  </span>
                  {ocrResult && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {isEditing ? "ดูผลลัพธ์" : "แก้ไข"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!ocrResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Scan className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มีผลการอ่าน</p>
                    <p className="text-sm">ถ่ายรูปและกดวิเคราะห์เพื่อเริ่มต้น</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {ocrResult.success ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          สำเร็จ
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400">
                          <XCircle className="w-3 h-3 mr-1" />
                          ล้มเหลว
                        </Badge>
                      )}
                      {ocrResult.processingTime && (
                        <span className="text-xs text-muted-foreground">
                          ({ocrResult.processingTime}ms)
                        </span>
                      )}
                    </div>

                    {/* Error message */}
                    {ocrResult.error && (
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-sm text-red-400">{ocrResult.error}</p>
                      </div>
                    )}

                    {/* Station info */}
                    {ocrResult.success && (
                      <>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">รหัสหน่วย</p>
                            <p className="font-medium">{ocrResult.stationCode || "-"}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">ผู้มีสิทธิ์</p>
                            <p className="font-medium">{ocrResult.totalVoters?.toLocaleString() || "-"}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">บัตรที่ใช้</p>
                            <p className="font-medium">{ocrResult.totalBallots?.toLocaleString() || "-"}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">บัตรเสีย</p>
                            <p className="font-medium">{ocrResult.spoiledBallots?.toLocaleString() || "-"}</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Votes */}
                        <div className="space-y-2">
                          <h4 className="font-medium">คะแนนผู้สมัคร</h4>
                          {isEditing ? (
                            <div className="space-y-2">
                              {editedVotes.map((vote, index) => (
                                <div key={index} className="grid grid-cols-4 gap-2 items-center">
                                  <Input
                                    type="number"
                                    value={vote.candidateNumber}
                                    onChange={(e) => handleVoteEdit(index, "candidateNumber", e.target.value)}
                                    className="h-8"
                                    placeholder="เบอร์"
                                  />
                                  <Input
                                    value={vote.candidateName}
                                    onChange={(e) => handleVoteEdit(index, "candidateName", e.target.value)}
                                    className="h-8 col-span-2"
                                    placeholder="ชื่อ"
                                  />
                                  <Input
                                    type="number"
                                    value={vote.voteCount}
                                    onChange={(e) => handleVoteEdit(index, "voteCount", e.target.value)}
                                    className="h-8"
                                    placeholder="คะแนน"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {editedVotes.map((vote, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                                      {vote.candidateNumber}
                                    </span>
                                    <span>{vote.candidateName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">
                                      {vote.voteCount.toLocaleString()}
                                    </span>
                                    {getConfidenceBadge(vote.confidence)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Total */}
                          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="font-medium">รวมคะแนน</span>
                            <span className="font-bold text-xl">{totalVotes.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Validation warnings */}
                        {ocrResult.validation && ocrResult.validation.warnings.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-yellow-500 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              คำเตือน
                            </h4>
                            {ocrResult.validation.warnings.map((warning, index) => (
                              <div
                                key={index}
                                className="p-2 bg-yellow-500/10 rounded border border-yellow-500/20 text-sm text-yellow-400"
                              >
                                {warning}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit button */}
            {ocrResult?.success && (
              <Card>
                <CardContent className="pt-6">
                  <Button className="w-full" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    ส่งข้อมูลเข้าระบบ PVT
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    ข้อมูลจะถูกส่งไปยังระบบ Parallel Vote Tabulation
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
