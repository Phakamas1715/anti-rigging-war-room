import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Camera, Upload, MapPin, CheckCircle, Clock, AlertTriangle, 
  User, Phone, Building, Send, ArrowLeft, Shield, Image,
  RefreshCw, History, Loader2
} from "lucide-react";

type AppState = "loading" | "not_logged_in" | "not_registered" | "pending" | "active";

export default function VolunteerApp() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [appState, setAppState] = useState<AppState>("loading");
  const [phone, setPhone] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Submission form state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null>(null);
  const [totalVoters, setTotalVoters] = useState("");
  const [validVotes, setValidVotes] = useState("");
  const [invalidVotes, setInvalidVotes] = useState("");
  const [candidateAVotes, setCandidateAVotes] = useState("");
  const [candidateBVotes, setCandidateBVotes] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Queries
  const volunteerQuery = trpc.volunteer.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const stationQuery = trpc.volunteer.myStation.useQuery(undefined, {
    enabled: isAuthenticated && volunteerQuery.data?.status === "active",
  });
  const submissionsQuery = trpc.volunteer.mySubmissions.useQuery(undefined, {
    enabled: isAuthenticated && volunteerQuery.data?.status === "active",
  });
  
  // Mutations
  const registerMutation = trpc.volunteer.register.useMutation();
  const submitMutation = trpc.volunteer.submit.useMutation();
  
  // Determine app state
  useEffect(() => {
    if (authLoading) {
      setAppState("loading");
    } else if (!isAuthenticated) {
      setAppState("not_logged_in");
    } else if (!volunteerQuery.data) {
      setAppState("not_registered");
    } else if (volunteerQuery.data.status === "pending") {
      setAppState("pending");
    } else if (volunteerQuery.data.status === "active") {
      setAppState("active");
    } else {
      setAppState("not_registered");
    }
  }, [authLoading, isAuthenticated, volunteerQuery.data]);
  
  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          });
        },
        (error) => {
          console.warn("Could not get location:", error);
        }
      );
    }
  }, []);
  
  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const result = await registerMutation.mutateAsync({ phone: phone || undefined });
      toast.success(result.message);
      volunteerQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลงทะเบียน");
    } finally {
      setIsRegistering(false);
    }
  };
  
  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = result.split(",")[1];
      setPhotoBase64(base64);
      setPhotoMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async () => {
    if (!stationQuery.data) {
      toast.error("ไม่พบข้อมูลหน่วยเลือกตั้ง");
      return;
    }
    
    if (!totalVoters || !validVotes || !candidateAVotes || !candidateBVotes) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await submitMutation.mutateAsync({
        stationId: stationQuery.data.id,
        photoBase64: photoBase64 || undefined,
        photoMimeType: photoMimeType || undefined,
        totalVoters: parseInt(totalVoters),
        validVotes: parseInt(validVotes),
        invalidVotes: parseInt(invalidVotes || "0"),
        candidateAVotes: parseInt(candidateAVotes),
        candidateBVotes: parseInt(candidateBVotes),
        latitude: location?.lat,
        longitude: location?.lng,
        notes: notes || undefined,
      });
      
      toast.success(result.message);
      
      // Reset form
      setPhotoPreview(null);
      setPhotoBase64(null);
      setPhotoMimeType(null);
      setTotalVoters("");
      setValidVotes("");
      setInvalidVotes("");
      setCandidateAVotes("");
      setCandidateBVotes("");
      setNotes("");
      
      // Refresh submissions
      submissionsQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (appState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }
  
  // Not logged in
  if (appState === "not_logged_in") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex items-center h-14">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold ml-2">อาสาสมัครนับคะแนน</h1>
          </div>
        </header>
        
        <main className="container py-8">
          <Card className="max-w-md mx-auto bg-card/50 border-border/50">
            <CardHeader className="text-center">
              <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
              <CardTitle>เข้าสู่ระบบเพื่อเริ่มต้น</CardTitle>
              <CardDescription>
                กรุณาเข้าสู่ระบบเพื่อลงทะเบียนเป็นอาสาสมัครนับคะแนน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href={getLoginUrl()}>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  เข้าสู่ระบบ
                </Button>
              </a>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  // Not registered
  if (appState === "not_registered") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex items-center h-14">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold ml-2">ลงทะเบียนอาสาสมัคร</h1>
          </div>
        </header>
        
        <main className="container py-8">
          <Card className="max-w-md mx-auto bg-card/50 border-border/50">
            <CardHeader className="text-center">
              <User className="h-16 w-16 mx-auto text-primary mb-4" />
              <CardTitle>ลงทะเบียนอาสาสมัคร</CardTitle>
              <CardDescription>
                กรอกข้อมูลเพื่อลงทะเบียนเป็นอาสาสมัครนับคะแนน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ชื่อ</Label>
                <Input value={user?.name || ""} disabled className="bg-muted/30" />
              </div>
              <div>
                <Label>เบอร์โทรศัพท์ (ไม่บังคับ)</Label>
                <Input 
                  type="tel"
                  placeholder="08X-XXX-XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                ลงทะเบียน
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  // Pending approval
  if (appState === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex items-center h-14">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold ml-2">รอการอนุมัติ</h1>
          </div>
        </header>
        
        <main className="container py-8">
          <Card className="max-w-md mx-auto bg-card/50 border-border/50">
            <CardHeader className="text-center">
              <Clock className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <CardTitle>รอการอนุมัติ</CardTitle>
              <CardDescription>
                การลงทะเบียนของคุณอยู่ระหว่างการพิจารณา กรุณารอการอนุมัติจากผู้ดูแลระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">รหัสอาสาสมัคร</p>
                <p className="font-mono text-lg font-bold text-primary">
                  {volunteerQuery.data?.volunteerCode}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => volunteerQuery.refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                ตรวจสอบสถานะ
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  // Active volunteer - main app
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold ml-2">รายงานผลคะแนน</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-500">Active</span>
          </div>
        </div>
      </header>
      
      <main className="container py-4 space-y-4">
        {/* Station Info */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{stationQuery.data?.name || "ไม่ระบุหน่วย"}</p>
                <p className="text-sm text-muted-foreground">
                  {stationQuery.data?.district}, {stationQuery.data?.province}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  รหัส: {stationQuery.data?.stationCode}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Photo Capture */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              ถ่ายรูปกระดานนับคะแนน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            
            {photoPreview ? (
              <div className="relative">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full rounded-lg border border-border/50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPhotoPreview(null);
                    setPhotoBase64(null);
                    setPhotoMimeType(null);
                  }}
                >
                  ลบรูป
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">ถ่ายรูป</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-6 w-6" />
                  <span className="text-xs">เลือกรูป</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Vote Entry Form */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">กรอกผลคะแนน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ผู้มีสิทธิ์ทั้งหมด</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={totalVoters}
                  onChange={(e) => setTotalVoters(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">บัตรดี</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={validVotes}
                  onChange={(e) => setValidVotes(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs">บัตรเสีย</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={invalidVotes}
                onChange={(e) => setInvalidVotes(e.target.value)}
              />
            </div>
            
            <div className="border-t border-border/50 pt-4">
              <p className="text-sm font-medium mb-3">คะแนนแต่ละผู้สมัคร</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">ผู้สมัคร A</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={candidateAVotes}
                    onChange={(e) => setCandidateAVotes(e.target.value)}
                    className="text-lg font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs">ผู้สมัคร B</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={candidateBVotes}
                    onChange={(e) => setCandidateBVotes(e.target.value)}
                    className="text-lg font-bold"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-xs">หมายเหตุ (ถ้ามี)</Label>
              <Textarea
                placeholder="เช่น พบความผิดปกติ, มีการประท้วง ฯลฯ"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            
            {location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>ตำแหน่ง: {parseFloat(location.lat).toFixed(4)}, {parseFloat(location.lng).toFixed(4)}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Submit Button */}
        <Button
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
          onClick={handleSubmit}
          disabled={isSubmitting || !totalVoters || !validVotes || !candidateAVotes || !candidateBVotes}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Send className="h-5 w-5 mr-2" />
          )}
          ส่งข้อมูล
        </Button>
        
        {/* Submission History */}
        {submissionsQuery.data && submissionsQuery.data.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                ประวัติการส่ง ({submissionsQuery.data.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {submissionsQuery.data.slice(0, 5).map((sub) => (
                  <div 
                    key={sub.id} 
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {sub.status === "verified" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : sub.status === "rejected" ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <div>
                        <p className="text-sm">
                          A: {sub.candidateAVotes} | B: {sub.candidateBVotes}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      sub.status === "verified" ? "bg-green-500/20 text-green-500" :
                      sub.status === "rejected" ? "bg-red-500/20 text-red-500" :
                      "bg-yellow-500/20 text-yellow-500"
                    }`}>
                      {sub.status === "verified" ? "ยืนยันแล้ว" :
                       sub.status === "rejected" ? "ปฏิเสธ" : "รอตรวจสอบ"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
