import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Bell, 
  QrCode, 
  Shield, 
  Send,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";

export default function Settings() {
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [lineToken, setLineToken] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeLink, setQrCodeLink] = useState("");

  // Discord test mutation
  const testDiscord = trpc.discord.test.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("ส่งข้อความทดสอบไปยัง Discord สำเร็จ!");
      } else {
        toast.error("ไม่สามารถส่งข้อความได้ กรุณาตรวจสอบ Webhook URL");
      }
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  });

  // LINE Notify test mutation
  const testLine = trpc.lineNotify.test.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("ส่งข้อความทดสอบไปยัง LINE สำเร็จ!");
      } else {
        toast.error("ไม่สามารถส่งข้อความได้ กรุณาตรวจสอบ Token");
      }
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  });

  // QR Code generation mutation
  const generateQR = trpc.qrCode.volunteerRegistration.useMutation({
    onSuccess: (data) => {
      setQrCodeUrl(data.qrDataUrl);
      setQrCodeLink(data.url);
      toast.success("สร้าง QR Code สำเร็จ!");
    },
    onError: () => {
      toast.error("ไม่สามารถสร้าง QR Code ได้");
    }
  });

  const handleTestDiscord = () => {
    if (!discordWebhook) {
      toast.error("กรุณากรอก Discord Webhook URL");
      return;
    }
    testDiscord.mutate({ webhookUrl: discordWebhook });
  };

  const handleTestLine = () => {
    if (!lineToken) {
      toast.error("กรุณากรอก LINE Notify Token");
      return;
    }
    testLine.mutate({ token: lineToken });
  };

  const handleGenerateQR = () => {
    const baseUrl = window.location.origin;
    generateQR.mutate({ baseUrl });
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'volunteer-registration-qr.png';
    link.click();
    toast.success("ดาวน์โหลด QR Code สำเร็จ!");
  };

  const handleCopyLink = () => {
    if (!qrCodeLink) return;
    navigator.clipboard.writeText(qrCodeLink);
    toast.success("คัดลอกลิงก์สำเร็จ!");
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="font-bold text-lg">ตั้งค่าระบบ</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="notifications" className="data-[state=active]:bg-red-500">
              <Bell className="h-4 w-4 mr-2" />
              การแจ้งเตือน
            </TabsTrigger>
            <TabsTrigger value="qrcode" className="data-[state=active]:bg-red-500">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Discord Webhook */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  Discord Webhook
                </CardTitle>
                <CardDescription>
                  รับการแจ้งเตือนผ่าน Discord เมื่อพบความผิดปกติในระบบ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Webhook URL</label>
                  <Input
                    placeholder="https://discord.com/api/webhooks/..."
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                  <p className="text-xs text-slate-500">
                    สร้าง Webhook ได้ที่: Server Settings → Integrations → Webhooks → New Webhook
                  </p>
                </div>
                <Button 
                  onClick={handleTestDiscord} 
                  disabled={testDiscord.isPending}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  {testDiscord.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  ทดสอบการเชื่อมต่อ
                </Button>
              </CardContent>
            </Card>

            {/* LINE Notify */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                  </div>
                  LINE Notify
                </CardTitle>
                <CardDescription>
                  รับการแจ้งเตือนผ่าน LINE เมื่อพบความผิดปกติในระบบ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Access Token</label>
                  <Input
                    placeholder="LINE Notify Access Token"
                    value={lineToken}
                    onChange={(e) => setLineToken(e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    type="password"
                  />
                  <p className="text-xs text-slate-500">
                    สร้าง Token ได้ที่: <a href="https://notify-bot.line.me/my/" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">notify-bot.line.me/my</a>
                  </p>
                </div>
                <Button 
                  onClick={handleTestLine} 
                  disabled={testLine.isPending}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {testLine.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  ทดสอบการเชื่อมต่อ
                </Button>
              </CardContent>
            </Card>

            {/* Alert Types */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ประเภทการแจ้งเตือน
                </CardTitle>
                <CardDescription>
                  ระบบจะส่งการแจ้งเตือนอัตโนมัติเมื่อตรวจพบความผิดปกติต่อไปนี้
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Klimek Model Alert</p>
                      <p className="text-sm text-slate-400">เมื่อ Alpha &gt; 5% (พบการยัดบัตร)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">PVT Gap Alert</p>
                      <p className="text-sm text-slate-400">เมื่อ Gap &gt; 5% (ผลนับไม่ตรง)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Network Hub Alert</p>
                      <p className="text-sm text-slate-400">เมื่อพบ Hub &gt; 50 connections</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Spatial Anomaly Alert</p>
                      <p className="text-sm text-slate-400">เมื่อ Z-Score &gt; 2.5</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qrcode" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-red-500" />
                  QR Code ลงทะเบียนอาสาสมัคร
                </CardTitle>
                <CardDescription>
                  สร้าง QR Code สำหรับแชร์ลิงก์ลงทะเบียนอาสาสมัครให้ง่ายขึ้น
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button 
                  onClick={handleGenerateQR} 
                  disabled={generateQR.isPending}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {generateQR.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-2" />
                  )}
                  สร้าง QR Code
                </Button>

                {qrCodeUrl && (
                  <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                    <p className="text-slate-900 text-sm font-medium">
                      สแกนเพื่อลงทะเบียนเป็นอาสาสมัคร
                    </p>
                  </div>
                )}

                {qrCodeLink && (
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">ลิงก์ลงทะเบียน</label>
                    <div className="flex gap-2">
                      <Input
                        value={qrCodeLink}
                        readOnly
                        className="bg-slate-800 border-slate-700"
                      />
                      <Button variant="outline" onClick={handleCopyLink}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {qrCodeUrl && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadQR}>
                      <Download className="h-4 w-4 mr-2" />
                      ดาวน์โหลด QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Station QR Codes */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>QR Code สำหรับหน่วยเลือกตั้ง</CardTitle>
                <CardDescription>
                  สร้าง QR Code เฉพาะสำหรับแต่ละหน่วยเลือกตั้ง เพื่อให้อาสาสมัครลงทะเบียนพร้อมระบุหน่วยที่รับผิดชอบ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  ไปที่หน้า <Link href="/admin/volunteers" className="text-red-400 hover:underline">จัดการอาสาสมัคร</Link> เพื่อสร้าง QR Code สำหรับแต่ละหน่วยเลือกตั้ง
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
