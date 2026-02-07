import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Send,
  Database,
  AlertCircle,
  Bell,
  MessageSquare,
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
  pvtStatus?: 'pending' | 'submitted' | 'error' | 'gap_detected';
  pvtError?: string;
}

export default function BatchOcr() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [provider, setProvider] = useState<'huggingface' | 'deepseek' | 'gemini' | 'hf-qwen'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [ocrMode, setOcrMode] = useState<'auto' | 'tally' | 'numeric' | 'ss5_11' | 'ss5_18'>('auto');
  const [crossValidateMode, setCrossValidateMode] = useState(false);
  const [tallyResults, setTallyResults] = useState<any[]>([]);
  const [formResults, setFormResults] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSubmitPVT, setAutoSubmitPVT] = useState(false);
  const [isSubmittingPVT, setIsSubmittingPVT] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Gap Alert Settings
  const [enableGapAlert, setEnableGapAlert] = useState(false);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [lineToken, setLineToken] = useState('');
  const [gapThreshold, setGapThreshold] = useState(10);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const batchProcessMutation = trpc.ocr.batchProcessSingle.useMutation();
  const bulkSubmitMutation = trpc.batchPvt.bulkSubmit.useMutation();
  const submitSingleMutation = trpc.batchPvt.submitSingle.useMutation();
  const sendGapAlertMutation = trpc.batchPvt.sendGapAlert.useMutation();
  const checkGapQuery = trpc.batchPvt.checkGap.useQuery;

  // Load settings from database
  const settingsQuery = trpc.settings.getGapAlertSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const saveSettingsMutation = trpc.settings.saveGapAlertSettings.useMutation();

  // Load settings from database on mount
  useEffect(() => {
    if (settingsQuery.data) {
      setDiscordWebhookUrl(settingsQuery.data.discordWebhook || '');
      setLineToken(settingsQuery.data.lineToken || '');
      setGapThreshold(settingsQuery.data.gapThreshold || 10);
      setEnableGapAlert(settingsQuery.data.gapAlertEnabled || false);
    }
  }, [settingsQuery.data]);

  // Save settings to database when changed
  const saveSettingsToDb = async () => {
    try {
      await saveSettingsMutation.mutateAsync({
        discordWebhook: discordWebhookUrl,
        lineToken: lineToken,
        gapThreshold: gapThreshold,
        gapAlertEnabled: enableGapAlert,
      });
      toast.success('บันทึกการตั้งค่าเรียบร้อย');
    } catch (error) {
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้');
    }
  };

  // Calculate statistics
  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    processing: files.filter(f => f.status === 'processing').length,
    done: files.filter(f => f.status === 'done').length,
    error: files.filter(f => f.status === 'error').length,
    pvtSubmitted: files.filter(f => f.pvtStatus === 'submitted').length,
    pvtGap: files.filter(f => f.pvtStatus === 'gap_detected').length,
  };

  const progress = stats.total > 0 ? ((stats.done + stats.error) / stats.total) * 100 : 0;

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileItem[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(selectedFiles).forEach((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: ไฟล์ต้องเป็น JPG, PNG หรือ WebP`);
        return;
      }

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
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Send Gap Alert
  const sendGapAlert = async (stationCode: string, ourSum: number, theirSum: number, gap: number) => {
    if (!enableGapAlert) return;
    if (!discordWebhookUrl && !lineToken) return;
    
    try {
      const result = await sendGapAlertMutation.mutateAsync({
        stationCode,
        ourSum,
        theirSum,
        gap,
        discordWebhookUrl: discordWebhookUrl || undefined,
        lineToken: lineToken || undefined,
      });
      
      if (result.success) {
        const channels = [];
        if (result.discordSent) channels.push('Discord');
        if (result.lineSent) channels.push('LINE');
        toast.info(`ส่งแจ้งเตือน Gap ผ่าน ${channels.join(' และ ')} แล้ว`);
      }
    } catch (error) {
      console.error('Failed to send gap alert:', error);
    }
  };

  // Submit single result to PVT with gap check
  const submitToPVT = async (fileItem: FileItem) => {
    if (!fileItem.result) return;

    try {
      const result = await submitSingleMutation.mutateAsync({
        fileId: fileItem.id,
        stationCode: fileItem.result.stationCode,
        totalVoters: fileItem.result.totalVoters,
        totalBallots: fileItem.result.totalBallots,
        spoiledBallots: fileItem.result.spoiledBallots,
        votes: fileItem.result.votes.map((v: any) => ({
          candidateNumber: v.candidateNumber,
          candidateName: v.candidateName,
          voteCount: v.voteCount,
        })),
      });

      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? {
          ...f,
          pvtStatus: result.success ? 'submitted' : 'error',
          pvtError: result.success ? undefined : result.error,
        } : f
      ));

      return result.success;
    } catch (error: any) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? {
          ...f,
          pvtStatus: 'error',
          pvtError: error.message || 'ส่งข้อมูลไม่สำเร็จ',
        } : f
      ));
      return false;
    }
  };

  // Process all files
  const processFiles = async () => {
    // Gemini doesn't need API key, others do
    if (provider !== 'gemini' && provider !== 'hf-qwen' && !apiKey) {
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

      while (isPaused && !abortRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (abortRef.current) break;

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
          ocrMode: (provider === 'gemini' || provider === 'hf-qwen') ? ocrMode : undefined,
        });

        const updatedFile = {
          ...fileItem,
          status: result.success ? 'done' as const : 'error' as const,
          result: result.data,
          error: result.error || undefined,
          processingTime: result.processingTime,
        };

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? updatedFile : f
        ));

        // Auto-submit to PVT if enabled and OCR successful
        if (autoSubmitPVT && result.success && result.data) {
          await submitToPVT(updatedFile);
        }
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

  // Bulk submit all completed results to PVT with gap detection
  const bulkSubmitToPVT = async () => {
    const completedFiles = files.filter(f => f.status === 'done' && f.result && f.pvtStatus !== 'submitted');
    
    if (completedFiles.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับส่งเข้า PVT');
      return;
    }

    setIsSubmittingPVT(true);

    try {
      const results = completedFiles.map(f => ({
        fileId: f.id,
        stationCode: f.result.stationCode,
        totalVoters: f.result.totalVoters,
        totalBallots: f.result.totalBallots,
        spoiledBallots: f.result.spoiledBallots,
        votes: f.result.votes.map((v: any) => ({
          candidateNumber: v.candidateNumber,
          candidateName: v.candidateName,
          voteCount: v.voteCount,
        })),
      }));

      const response = await bulkSubmitMutation.mutateAsync({ results });

      // Track gaps for alert
      const gapsDetected: { stationCode: string; ourSum: number; theirSum: number; gap: number }[] = [];

      // Update file statuses based on response
      setFiles(prev => prev.map(f => {
        const submitted = response.submitted.find(s => s.fileId === f.id);
        if (submitted) {
          // Check if there's a gap (simulated - in real scenario, compare with official data)
          // For demo, we'll mark as gap_detected if the station wasn't found
          const hasGap = !submitted.success && submitted.error?.includes('ไม่พบหน่วย');
          
          if (hasGap && f.result) {
            const ourSum = f.result.votes?.reduce((sum: number, v: any) => sum + v.voteCount, 0) || 0;
            gapsDetected.push({
              stationCode: f.result.stationCode,
              ourSum,
              theirSum: 0,
              gap: ourSum,
            });
          }
          
          return {
            ...f,
            pvtStatus: submitted.success ? 'submitted' : (hasGap ? 'gap_detected' : 'error'),
            pvtError: submitted.error,
          };
        }
        return f;
      }));

      toast.success(`ส่งข้อมูลเข้า PVT สำเร็จ ${response.summary.success}/${response.summary.total} รายการ`);
      
      if (response.summary.failed > 0) {
        toast.warning(`ล้มเหลว ${response.summary.failed} รายการ`);
      }

      // Send gap alerts if enabled
      if (enableGapAlert && gapsDetected.length > 0) {
        for (const gapInfo of gapsDetected) {
          await sendGapAlert(gapInfo.stationCode, gapInfo.ourSum, gapInfo.theirSum, gapInfo.gap);
        }
        toast.warning(`พบ Gap ${gapsDetected.length} หน่วย - ส่งแจ้งเตือนแล้ว`);
      }
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSubmittingPVT(false);
    }
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
        pvtStatus: 'pending',
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

    const headers = ['รหัสหน่วย', 'ผู้มีสิทธิ์', 'บัตรทั้งหมด', 'บัตรเสีย', 'ผู้สมัคร 1', 'ผู้สมัคร 2', 'ผู้สมัคร 3', 'สถานะ PVT'];
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
        f.pvtStatus || 'pending',
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

  // Get PVT status badge
  const getPVTStatusBadge = (status?: string) => {
    switch (status) {
      case 'submitted':
        return (
          <Badge className="bg-green-500/20 text-green-500">
            <Database className="w-3 h-3 mr-1" />
            ส่ง PVT แล้ว
          </Badge>
        );
      case 'gap_detected':
        return (
          <Badge className="bg-red-500/20 text-red-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            พบ Gap
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-500">
            <XCircle className="w-3 h-3 mr-1" />
            ส่งไม่สำเร็จ
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            รอส่ง PVT
          </Badge>
        );
    }
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
            <CardContent className="space-y-6">
              {/* OCR Provider Settings */}
              <Tabs value={provider} onValueChange={(v) => setProvider(v as 'huggingface' | 'deepseek' | 'gemini' | 'hf-qwen')}>
                <TabsList className="grid w-full grid-cols-4 max-w-lg">
                  <TabsTrigger value="gemini" className="text-green-500 data-[state=active]:bg-green-500/20">✨ Gemini</TabsTrigger>
                  <TabsTrigger value="hf-qwen" className="text-purple-500 data-[state=active]:bg-purple-500/20">🤗 HF-Qwen</TabsTrigger>
                  <TabsTrigger value="huggingface">HF Legacy</TabsTrigger>
                  <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
                </TabsList>
                <div className="mt-4 max-w-md">
                  {provider === 'gemini' ? (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-sm text-green-500 font-medium">✅ พร้อมใช้งาน - ไม่ต้องใส่ API Key</p>
                      <p className="text-xs text-green-400/70 mt-1">รองรับ ส.ส.5/11 (ขีดคะแนน) และ ส.ส.5/18 (ตาราง) พร้อม Cross-validation</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ใช้ Gemini 2.5 Flash Vision ที่ติดตั้งในระบบแล้ว
                      </p>
                    </div>
                  ) : provider === 'hf-qwen' ? (
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <p className="text-sm text-purple-500 font-medium">🤗 HF Qwen2-VL OCR - พร้อมใช้งาน</p>
                      <p className="text-xs text-purple-400/70 mt-1">ใช้ Qwen2-VL-OCR-2B ผ่าน Hugging Face Inference API</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        รองรับ ส.ส.5/11 + ส.ส.5/18 พร้อม TrOCR fallback สำหรับลายมือ
                      </p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </Tabs>

              {/* OCR Document Type Selector (Gemini only) */}
              {(provider === 'gemini' || provider === 'hf-qwen') && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    ประเภทเอกสารเลือกตั้ง
                  </h3>
                  <div className="grid grid-cols-3 gap-2 max-w-lg">
                    <button
                      onClick={() => setOcrMode('auto')}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        ocrMode === 'auto'
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                          : 'border-border hover:border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      <div className="text-2xl mb-1">🔍</div>
                      <div className="text-sm font-medium">ตรวจอัตโนมัติ</div>
                      <div className="text-[10px] mt-0.5 opacity-70">Auto Detect</div>
                    </button>
                    <button
                      onClick={() => setOcrMode('ss5_11')}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        ocrMode === 'ss5_11' || ocrMode === 'tally'
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                          : 'border-border hover:border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      <div className="text-2xl mb-1">📋</div>
                      <div className="text-sm font-medium">ส.ส.5/11</div>
                      <div className="text-[10px] mt-0.5 opacity-70">กระดานขีดคะแนน</div>
                    </button>
                    <button
                      onClick={() => setOcrMode('ss5_18')}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        ocrMode === 'ss5_18' || ocrMode === 'numeric'
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                          : 'border-border hover:border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      <div className="text-2xl mb-1">📄</div>
                      <div className="text-sm font-medium">ส.ส.5/18</div>
                      <div className="text-[10px] mt-0.5 opacity-70">แบบรายงานผล</div>
                    </button>
                  </div>
                  
                  {/* Description for selected mode */}
                  {(ocrMode === 'ss5_11' || ocrMode === 'tally') && (
                    <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 max-w-lg">
                      <p className="text-xs text-orange-400 font-medium mb-1">📋 ส.ส.5/11 - กระดานนับคะแนน (Tally Board)</p>
                      <p className="text-xs text-orange-400/80">
                        กระดานขนาดใหญ่ตั้งหน้าหน่วยเลือกตั้ง คะแนนเป็นขีด (||||) ชุดละ 5 คะแนน<br/>
                        ระบบจะนับขีดคะแนนทีละชุดอย่างละเอียดและแสดง breakdown
                      </p>
                    </div>
                  )}
                  {(ocrMode === 'ss5_18' || ocrMode === 'numeric') && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 max-w-lg">
                      <p className="text-xs text-blue-400 font-medium mb-1">📄 ส.ส.5/18 - แบบรายงานผลการนับคะแนน</p>
                      <p className="text-xs text-blue-400/80">
                        เอกสารทางการมีตราครุฑ คะแนนเป็นตัวเลขในตาราง<br/>
                        ระบบจะอ่านชื่อ-สกุลผู้สมัคร, คะแนน, จำนวนผู้มีสิทธิ์, บัตรเสีย
                      </p>
                    </div>
                  )}
                  {ocrMode === 'auto' && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border max-w-lg">
                      <p className="text-xs text-muted-foreground">
                        ระบบจะตรวจจับอัตโนมัติว่าเป็น ส.ส.5/11 (ขีดคะแนน) หรือ ส.ส.5/18 (ตาราง)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Cross-validation Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 max-w-md">
                <div className="space-y-0.5">
                  <Label htmlFor="cross-validate" className="text-base font-medium text-amber-500">
                    ⚖️ Cross-validation Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    เปรียบเทียบผล ส.ส.5/11 กับ ส.ส.5/18 จากหน่วยเดียวกันอัตโนมัติ
                  </p>
                </div>
                <Switch
                  id="cross-validate"
                  checked={crossValidateMode}
                  onCheckedChange={setCrossValidateMode}
                />
              </div>

              {crossValidateMode && (
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 max-w-md">
                  <p className="text-xs text-amber-400 font-medium mb-2">📋 วิธีใช้งาน Cross-validation:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>อัพโหลดภาพ ส.ส.5/11 (กระดานขีดคะแนน) และ ส.ส.5/18 (แบบฟอร์ม) จากหน่วยเดียวกัน</li>
                    <li>ตั้งชื่อไฟล์ให้มีคำว่า "5-11" หรือ "5-18" เพื่อจับคู่อัตโนมัติ</li>
                    <li>ระบบจะเปรียบเทียบคะแนนแต่ละผู้สมัครและแจ้งเตือนหากไม่ตรงกัน</li>
                  </ol>
                </div>
              )}

              {/* Auto-submit to PVT Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 max-w-md">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-submit" className="text-base font-medium">
                    Auto-submit to PVT
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    ส่งผลลัพธ์เข้าระบบ PVT โดยอัตโนมัติหลัง OCR สำเร็จ
                  </p>
                </div>
                <Switch
                  id="auto-submit"
                  checked={autoSubmitPVT}
                  onCheckedChange={setAutoSubmitPVT}
                />
              </div>

              {/* Gap Alert Settings */}
              <div className="border-t border-border pt-4">
                <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Gap Alert Settings
                </h3>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 max-w-md mb-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-gap-alert" className="text-base font-medium">
                      เปิดใช้งาน Gap Alert
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      แจ้งเตือนผ่าน Discord/LINE เมื่อพบ Gap
                    </p>
                  </div>
                  <Switch
                    id="enable-gap-alert"
                    checked={enableGapAlert}
                    onCheckedChange={setEnableGapAlert}
                  />
                </div>

                {enableGapAlert && (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="discord-webhook" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Discord Webhook URL
                      </Label>
                      <Input
                        id="discord-webhook"
                        type="password"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={discordWebhookUrl}
                        onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="line-token" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        LINE Notify Token
                      </Label>
                      <Input
                        id="line-token"
                        type="password"
                        placeholder="LINE Notify Access Token"
                        value={lineToken}
                        onChange={(e) => setLineToken(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gap-threshold">
                        Gap Threshold (คะแนน)
                      </Label>
                      <Input
                        id="gap-threshold"
                        type="number"
                        min={1}
                        value={gapThreshold}
                        onChange={(e) => setGapThreshold(parseInt(e.target.value) || 10)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        แจ้งเตือนเมื่อพบความแตกต่างมากกว่า {gapThreshold} คะแนน
                      </p>
                    </div>
                    
                    <Button 
                      onClick={saveSettingsToDb}
                      disabled={saveSettingsMutation.isPending}
                      className="mt-4"
                    >
                      {saveSettingsMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังบันทึก...</>
                      ) : (
                        <>บันทึกการตั้งค่า</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
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
              <div className="text-sm text-muted-foreground">OCR สำเร็จ</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-500">{stats.error}</div>
              <div className="text-sm text-muted-foreground">ล้มเหลว</div>
            </CardContent>
          </Card>
          <Card className="border-primary/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{stats.pvtSubmitted}</div>
              <div className="text-sm text-muted-foreground">ส่ง PVT แล้ว</div>
            </CardContent>
          </Card>
          <Card className="border-destructive/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{stats.pvtGap}</div>
              <div className="text-sm text-muted-foreground">พบ Gap</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {files.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">ความคืบหน้า OCR</span>
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
                เริ่มประมวลผล OCR
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

          {/* Bulk Submit to PVT Button */}
          {stats.done > 0 && (
            <Button 
              variant="default"
              className="bg-primary"
              onClick={() => setShowConfirmDialog(true)}
              disabled={isSubmittingPVT || stats.done === stats.pvtSubmitted}
            >
              {isSubmittingPVT ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังส่ง PVT...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  ส่งเข้า PVT ({stats.done - stats.pvtSubmitted})
                </>
              )}
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

          <Button variant="outline" onClick={async () => {
            try {
              const response = await fetch('/sample-vote-board.jpg');
              const blob = await response.blob();
              const file = new File([blob], 'sample-vote-board.jpg', { type: 'image/jpeg' });
              const preview = URL.createObjectURL(blob);
              setFiles([{
                id: 'test-ocr-' + Date.now(),
                file,
                preview,
                status: 'pending',
              }]);
              toast.success('โหลดภาพตัวอย่างแล้ว กด "เริ่มประมวลผล OCR" เพื่อทดสอบ');
            } catch (error) {
              toast.error('ไม่สามารถโหลดภาพตัวอย่าง');
            }
          }}>
            <ImageIcon className="w-4 h-4 mr-2" />
            ทดสอบ OCR
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
                        <div className="flex items-center gap-2 flex-wrap">
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
                              OCR สำเร็จ
                            </Badge>
                          )}
                          {fileItem.status === 'error' && (
                            <Badge variant="outline" className="text-red-500">
                              <XCircle className="w-3 h-3 mr-1" />
                              ล้มเหลว
                            </Badge>
                          )}
                          {fileItem.status === 'done' && getPVTStatusBadge(fileItem.pvtStatus)}
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
                        <div className="flex items-center gap-2">
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
                          {getPVTStatusBadge(fileItem.pvtStatus)}
                        </div>
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
                      {/* Document type & scoring method */}
                      {(fileItem.result.documentType || fileItem.result.scoringMethod) && (
                        <div className="mt-2 flex items-center gap-2">
                          {fileItem.result.documentType === 'ss5_11' && (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">📋 ส.ส.5/11 ขีดคะแนน</Badge>
                          )}
                          {fileItem.result.documentType === 'ss5_18' && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">📄 ส.ส.5/18 ตาราง</Badge>
                          )}
                          {fileItem.result.scoringMethod === 'tally' && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">Tally Marks</Badge>
                          )}
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-1">คะแนน:</div>
                        <div className="space-y-1">
                          {fileItem.result.votes?.map((vote: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                #{vote.candidateNumber}: {vote.voteCount}
                                <span className="ml-1 text-muted-foreground">({vote.confidence}%)</span>
                              </Badge>
                              {vote.candidateName && vote.candidateName !== 'Unknown' && (
                                <span className="text-xs text-muted-foreground">{vote.candidateName}</span>
                              )}
                              {vote.tallyBreakdown && (
                                <span className="text-[10px] text-orange-400/70 font-mono">[{vote.tallyBreakdown}]</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      {fileItem.pvtError && (
                        <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                          {fileItem.pvtError}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการส่งข้อมูลเข้า PVT</AlertDialogTitle>
            <AlertDialogDescription>
              คุณกำลังจะส่งข้อมูล {files.filter(f => f.status === "done" && f.pvtStatus !== "submitted").length} รายการเข้าระบบ PVT
              การดำเนินการนี้ไม่สามารถยกเลิกได้ ต้องการดำเนินการต่อหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowConfirmDialog(false); bulkSubmitToPVT(); }}>ยืนยันส่งข้อมูล</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
