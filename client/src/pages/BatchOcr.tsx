import { useState, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ImageIcon,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface FileItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: any;
  error?: string;
  processingTime?: number;
}

export default function BatchOcr() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [provider, setProvider] = useState<'huggingface' | 'deepseek'>('huggingface');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const batchProcessMutation = trpc.ocr.batchProcessSingle.useMutation();
  const { data: demoResults } = trpc.ocr.batchDemo.useQuery({ count: 5 }, { enabled: false });

  // Calculate statistics
  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    processing: files.filter(f => f.status === 'processing').length,
    done: files.filter(f => f.status === 'done').length,
    error: files.filter(f => f.status === 'error').length,
  };

  const progress = stats.total > 0 ? ((stats.done + stats.error) / stats.total) * 100 : 0;

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileItem[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(selectedFiles).forEach((file) => {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: ไฟล์ต้องเป็น JPG, PNG หรือ WebP`);
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        toast.error(`${file.name}: ไฟล์ต้องมีขนาดไม่เกิน 10MB`);
        return;
      }

      const preview = URL.createObjectURL(file);
      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        status: 'pending',
      });
    });

    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`เพิ่ม ${newFiles.length} ไฟล์แล้ว`);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Remove file from queue
  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // Clear all files
  const clearAll = useCallback(() => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
  }, [files]);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Process all files
  const processFiles = async () => {
    if (!apiKey) {
      toast.error('กรุณาใส่ API Key ก่อนเริ่มประมวลผล');
      setShowSettings(true);
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    abortRef.current = false;

    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');

    for (const fileItem of pendingFiles) {
      if (abortRef.current) break;

      // Wait if paused
      while (isPaused && !abortRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (abortRef.current) break;

      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'processing' as const } : f
      ));

      try {
        const base64Image = await fileToBase64(fileItem.file);
        
        const result = await batchProcessMutation.mutateAsync({
          fileId: fileItem.id,
          fileName: fileItem.file.name,
          base64Image,
          provider,
          apiKey,
        });

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? {
            ...f,
            status: result.success ? 'done' as const : 'error' as const,
            result: result.data,
            error: result.error || undefined,
            processingTime: result.processingTime,
          } : f
        ));
      } catch (error: any) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? {
            ...f,
            status: 'error' as const,
            error: error.message || 'เกิดข้อผิดพลาด',
          } : f
        ));
      }
    }

    setIsProcessing(false);
    toast.success('ประมวลผลเสร็จสิ้น');
  };

  // Pause/Resume processing
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Stop processing
  const stopProcessing = () => {
    abortRef.current = true;
    setIsProcessing(false);
    setIsPaused(false);
  };

  // Retry failed files
  const retryFailed = () => {
    setFiles(prev => prev.map(f => 
      f.status === 'error' ? { ...f, status: 'pending' as const, error: undefined } : f
    ));
  };

  // Load demo data
  const loadDemoData = async () => {
    const demoFiles: FileItem[] = [];
    for (let i = 0; i < 5; i++) {
      const stationNum = String(i + 1).padStart(3, '0');
      demoFiles.push({
        id: `demo-${i}`,
        file: new File([], `station_${stationNum}.jpg`),
        preview: '',
        status: 'done',
        result: {
          success: true,
          stationCode: `DEMO-${stationNum}`,
          totalVoters: 400 + Math.floor(Math.random() * 200),
          totalBallots: 350 + Math.floor(Math.random() * 100),
          spoiledBallots: Math.floor(Math.random() * 10),
          votes: [
            { candidateNumber: 1, candidateName: 'ผู้สมัครหมายเลข 1', voteCount: 150 + Math.floor(Math.random() * 50), confidence: 90 + Math.floor(Math.random() * 10) },
            { candidateNumber: 2, candidateName: 'ผู้สมัครหมายเลข 2', voteCount: 100 + Math.floor(Math.random() * 50), confidence: 85 + Math.floor(Math.random() * 15) },
            { candidateNumber: 3, candidateName: 'ผู้สมัครหมายเลข 3', voteCount: 50 + Math.floor(Math.random() * 50), confidence: 80 + Math.floor(Math.random() * 20) },
          ],
          validation: { isValid: true, warnings: [] },
        },
        processingTime: 1500 + Math.floor(Math.random() * 1000),
      });
    }
    setFiles(demoFiles);
    toast.success('โหลดข้อมูลตัวอย่างแล้ว');
  };

  // Export to CSV
  const exportToCSV = () => {
    const completedFiles = files.filter(f => f.status === 'done' && f.result);
    if (completedFiles.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = ['รหัสหน่วย', 'ผู้มีสิทธิ์', 'บัตรทั้งหมด', 'บัตรเสีย', 'ผู้สมัคร 1', 'ผู้สมัคร 2', 'ผู้สมัคร 3'];
    const rows = completedFiles.map(f => {
      const r = f.result;
      return [
        r.stationCode,
        r.totalVoters,
        r.totalBallots,
        r.spoiledBallots,
        r.votes?.[0]?.voteCount || 0,
        r.votes?.[1]?.voteCount || 0,
        r.votes?.[2]?.voteCount || 0,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_ocr_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ส่งออก CSV สำเร็จ');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Batch OCR Scanner</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4 mr-2" />
            API Settings
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* API Settings Panel */}
        {showSettings && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                API Settings
              </CardTitle>
              <CardDescription>เลือก Provider และใส่ API Key สำหรับ OCR</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={provider} onValueChange={(v) => setProvider(v as 'huggingface' | 'deepseek')}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger value="huggingface">Hugging Face</TabsTrigger>
                  <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
                </TabsList>
                <div className="mt-4 max-w-md">
                  <Label htmlFor="apiKey">
                    {provider === 'huggingface' ? 'Hugging Face Token' : 'DeepSeek API Key'}
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={provider === 'huggingface' ? 'hf_xxxxxxxxxx' : 'sk-xxxxxxxxxx'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">ทั้งหมด</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">รอดำเนินการ</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
              <div className="text-sm text-muted-foreground">กำลังประมวลผล</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{stats.done}</div>
              <div className="text-sm text-muted-foreground">สำเร็จ</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-500">{stats.error}</div>
              <div className="text-sm text-muted-foreground">ล้มเหลว</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {files.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">ความคืบหน้า</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={processFiles}
            disabled={isProcessing || stats.pending === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังประมวลผล...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                เริ่มประมวลผล
              </>
            )}
          </Button>

          {isProcessing && (
            <>
              <Button variant="outline" onClick={togglePause}>
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    ดำเนินการต่อ
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    หยุดชั่วคราว
                  </>
                )}
              </Button>
              <Button variant="destructive" onClick={stopProcessing}>
                <XCircle className="w-4 h-4 mr-2" />
                หยุด
              </Button>
            </>
          )}

          {stats.error > 0 && !isProcessing && (
            <Button variant="outline" onClick={retryFailed}>
              <RotateCcw className="w-4 h-4 mr-2" />
              ลองใหม่ ({stats.error})
            </Button>
          )}

          {stats.done > 0 && (
            <Button variant="outline" onClick={exportToCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}

          <Button variant="outline" onClick={loadDemoData}>
            <Download className="w-4 h-4 mr-2" />
            ข้อมูลตัวอย่าง
          </Button>

          {files.length > 0 && (
            <Button variant="ghost" onClick={clearAll} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              ล้างทั้งหมด
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                อัปโหลดไฟล์
              </CardTitle>
              <CardDescription>ลากไฟล์มาวางหรือคลิกเพื่อเลือกไฟล์ (JPG, PNG, WebP สูงสุด 10MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">ลากไฟล์มาวางที่นี่</p>
                <p className="text-sm text-muted-foreground mt-1">หรือคลิกเพื่อเลือกไฟล์</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {files.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      {fileItem.preview ? (
                        <img
                          src={fileItem.preview}
                          alt={fileItem.file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                        <div className="flex items-center gap-2">
                          {fileItem.status === 'pending' && (
                            <Badge variant="outline" className="text-yellow-500">
                              <Clock className="w-3 h-3 mr-1" />
                              รอ
                            </Badge>
                          )}
                          {fileItem.status === 'processing' && (
                            <Badge variant="outline" className="text-blue-500">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              กำลังประมวลผล
                            </Badge>
                          )}
                          {fileItem.status === 'done' && (
                            <Badge variant="outline" className="text-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              สำเร็จ
                            </Badge>
                          )}
                          {fileItem.status === 'error' && (
                            <Badge variant="outline" className="text-red-500">
                              <XCircle className="w-3 h-3 mr-1" />
                              ล้มเหลว
                            </Badge>
                          )}
                          {fileItem.processingTime && (
                            <span className="text-xs text-muted-foreground">
                              {(fileItem.processingTime / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                        disabled={fileItem.status === 'processing'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                ผลการอ่าน OCR
              </CardTitle>
              <CardDescription>ผลการอ่านข้อมูลจากภาพกระดานนับคะแนน</CardDescription>
            </CardHeader>
            <CardContent>
              {files.filter(f => f.status === 'done' && f.result).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีผลการอ่าน</p>
                  <p className="text-sm">อัปโหลดไฟล์และเริ่มประมวลผลเพื่อดูผลลัพธ์</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {files.filter(f => f.status === 'done' && f.result).map((fileItem) => (
                    <div key={fileItem.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{fileItem.result.stationCode}</span>
                        {fileItem.result.validation?.isValid ? (
                          <Badge className="bg-green-500/20 text-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-500">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Warning
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">ผู้มีสิทธิ์:</span>
                          <span className="ml-1 font-medium">{fileItem.result.totalVoters}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">บัตร:</span>
                          <span className="ml-1 font-medium">{fileItem.result.totalBallots}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">บัตรเสีย:</span>
                          <span className="ml-1 font-medium">{fileItem.result.spoiledBallots}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-1">คะแนน:</div>
                        <div className="flex flex-wrap gap-2">
                          {fileItem.result.votes?.map((vote: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              #{vote.candidateNumber}: {vote.voteCount}
                              <span className="ml-1 text-muted-foreground">({vote.confidence}%)</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
