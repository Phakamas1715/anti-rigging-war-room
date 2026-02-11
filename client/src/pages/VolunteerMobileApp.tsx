import { useState, useRef, useEffect, useCallback, TouchEvent } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Camera, MapPin, CheckCircle, Clock, AlertTriangle, 
  User, Building, Send, Shield, Image,
  History, Loader2, HelpCircle, LogOut, Home,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { addTimestampToImage, getCurrentTimestamp } from "@/lib/imageTimestamp";

type TabId = "submit" | "history" | "help";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Camera;
}

const tabs: Tab[] = [
  { id: "submit", label: "ส่งผล", icon: Camera },
  { id: "history", label: "ประวัติ", icon: History },
  { id: "help", label: "คู่มือ", icon: HelpCircle },
];

export default function VolunteerMobileApp() {
  const [, setLocationPath] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("submit");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Volunteer session from localStorage
  const [volunteerSession, setVolunteerSession] = useState<{
    code: string;
    volunteerId: number;
    stationId: number;
    stationName: string;
    province: string;
    district: string;
  } | null>(null);
  
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
  
  // Load session from localStorage or create default
  useEffect(() => {
    const sessionStr = localStorage.getItem("volunteer_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setVolunteerSession(session);
      } catch {
        const defaultSession = {
          code: "VOLUNTEER-" + Date.now(),
          volunteerId: Math.floor(Math.random() * 10000),
          stationId: 1,
          stationName: "Station 1",
          province: "Yasothon",
          district: "Zone 2"
        };
        localStorage.setItem("volunteer_session", JSON.stringify(defaultSession));
        setVolunteerSession(defaultSession);
      }
    } else {
      const defaultSession = {
        code: "VOLUNTEER-" + Date.now(),
        volunteerId: Math.floor(Math.random() * 10000),
        stationId: 1,
        stationName: "Station 1",
        province: "Yasothon",
        district: "Zone 2"
      };
      localStorage.setItem("volunteer_session", JSON.stringify(defaultSession));
      setVolunteerSession(defaultSession);
    }
  }, [setLocationPath]);
  
  // Queries - use volunteerCode router for submissions
  const submissionsQuery = trpc.volunteerCode.mySubmissions.useQuery(
    { code: volunteerSession?.code || "" },
    { enabled: !!volunteerSession?.code }
  );
  
  // Mutations - use volunteerCode router for submit
  const submitMutation = trpc.volunteerCode.submit.useMutation();
  
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
  
  // Swipe handling
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    
    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
    if (isRightSwipe && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };
  
  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const result = reader.result as string;
        
        // Add timestamp to image
        const timestampedImage = await addTimestampToImage(result, {
          fontSize: 20,
          fontColor: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 8,
          position: 'bottom-right',
          format: 'full'
        });
        
        setPhotoPreview(timestampedImage);
        const base64 = timestampedImage.split(",")[1];
        setPhotoBase64(base64);
        setPhotoMimeType('image/jpeg');
        
        toast.success(`ภาพถูกประทับเวลา: ${getCurrentTimestamp('full')}`);
      } catch (error) {
        console.error('Failed to add timestamp:', error);
        toast.error('ไม่สามารถประทับเวลาบนภาพได้');
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async () => {
    if (!volunteerSession) {
      toast.error("ไม่พบข้อมูล session");
      return;
    }
    
    if (!totalVoters || !validVotes || !candidateAVotes || !candidateBVotes) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await submitMutation.mutateAsync({
        code: volunteerSession.code,
        stationId: volunteerSession.stationId,
        totalVoters: parseInt(totalVoters),
        validVotes: parseInt(validVotes),
        invalidVotes: parseInt(invalidVotes || "0"),
        candidateAVotes: parseInt(candidateAVotes),
        candidateBVotes: parseInt(candidateBVotes),
        photoBase64: photoBase64 || undefined,
        photoMimeType: photoMimeType || undefined,
        latitude: location?.lat,
        longitude: location?.lng,
        notes: notes || undefined,
      });
      
      toast.success(result.message || "ส่งผลคะแนนสำเร็จ");
      
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
      
      // Refresh submissions and switch to history
      submissionsQuery.refetch();
      setActiveTab("history");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("volunteer_session");
    setLocationPath("/volunteer/login");
    toast.success("ออกจากระบบสำเร็จ");
  };
  
  // Loading state
  if (!volunteerSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-slate-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50 safe-area-top">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-green-500/20 rounded-lg">
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">
                {volunteerSession.stationName}
              </h1>
              <p className="text-xs text-slate-500">
                {volunteerSession.district}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
              <CheckCircle className="h-3 w-3" />
              <span>Active</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Tab Indicator */}
      <div className="flex items-center justify-center gap-2 py-2 bg-slate-900/50">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`h-1.5 rounded-full transition-all ${
              activeTab === tab.id 
                ? "w-6 bg-green-500" 
                : "w-1.5 bg-slate-700"
            }`}
          />
        ))}
        <span className="text-xs text-slate-500 ml-2">
          ปัดซ้าย-ขวาเพื่อเปลี่ยนหน้า
        </span>
      </div>
      
      {/* Content Area with Swipe */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto pb-24"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Submit Tab */}
        {activeTab === "submit" && (
          <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Station Info Card */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Building className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{volunteerSession.stationName}</p>
                    <p className="text-sm text-slate-400">
                      {volunteerSession.district}, {volunteerSession.province}
                    </p>
                    {location && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                        <MapPin className="h-3 w-3" />
                        <span>ตำแหน่งถูกบันทึก</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Photo Capture */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Camera className="h-4 w-4 text-green-500" />
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
                      className="w-full rounded-lg border border-slate-700"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-slate-900/80 border-slate-700 text-white"
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
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-24 flex-col gap-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="h-8 w-8 text-green-500" />
                      <span className="text-sm">ถ่ายรูป</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 flex-col gap-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image className="h-8 w-8 text-blue-500" />
                      <span className="text-sm">เลือกรูป</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Vote Entry Form */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white">กรอกผลคะแนน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-400">ผู้มีสิทธิ์ทั้งหมด</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={totalVoters}
                      onChange={(e) => setTotalVoters(e.target.value)}
                      className="h-12 text-lg bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">บัตรดี</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={validVotes}
                      onChange={(e) => setValidVotes(e.target.value)}
                      className="h-12 text-lg bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-slate-400">บัตรเสีย</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={invalidVotes}
                    onChange={(e) => setInvalidVotes(e.target.value)}
                    className="h-12 text-lg bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-3">คะแนนผู้สมัคร</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-blue-400">ผู้สมัคร A</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={candidateAVotes}
                        onChange={(e) => setCandidateAVotes(e.target.value)}
                        className="h-12 text-lg bg-blue-500/10 border-blue-500/30 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-red-400">ผู้สมัคร B</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={candidateBVotes}
                        onChange={(e) => setCandidateBVotes(e.target.value)}
                        className="h-12 text-lg bg-red-500/10 border-red-500/30 text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-slate-400">หมายเหตุ (ถ้ามี)</Label>
                  <Textarea
                    placeholder="บันทึกเพิ่มเติม..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                  />
                </div>
                
                <Button
                  className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      ส่งผลคะแนน
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* History Tab */}
        {activeTab === "history" && (
          <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-green-500" />
                ประวัติการส่ง
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => submissionsQuery.refetch()}
                className="text-slate-400"
              >
                <Loader2 className={`h-4 w-4 mr-1 ${submissionsQuery.isFetching ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
            </div>
            
            {submissionsQuery.isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-2" />
                <p className="text-slate-400">กำลังโหลด...</p>
              </div>
            ) : submissionsQuery.data?.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-8 text-center">
                  <History className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">ยังไม่มีประวัติการส่ง</p>
                  <p className="text-sm text-slate-500 mt-1">
                    ส่งผลคะแนนครั้งแรกของคุณได้เลย
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {submissionsQuery.data?.map((submission: any, index: number) => (
                  <Card key={submission.id || index} className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${
                            submission.isVerified 
                              ? "bg-green-500/20" 
                              : "bg-yellow-500/20"
                          }`}>
                            {submission.isVerified ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              ส่งครั้งที่ {(submissionsQuery.data?.length || 0) - index}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(submission.createdAt).toLocaleString('th-TH')}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          submission.isVerified 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {submission.isVerified ? "ยืนยันแล้ว" : "รอตรวจสอบ"}
                        </span>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-800/50 rounded p-2">
                          <p className="text-slate-500 text-xs">บัตรดี</p>
                          <p className="text-white font-medium">{submission.validVotes?.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded p-2">
                          <p className="text-slate-500 text-xs">บัตรเสีย</p>
                          <p className="text-white font-medium">{submission.invalidVotes?.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-500/10 rounded p-2">
                          <p className="text-blue-400 text-xs">ผู้สมัคร A</p>
                          <p className="text-white font-medium">{submission.candidateAVotes?.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-500/10 rounded p-2">
                          <p className="text-red-400 text-xs">ผู้สมัคร B</p>
                          <p className="text-white font-medium">{submission.candidateBVotes?.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Help Tab */}
        {activeTab === "help" && (
          <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-green-500" />
              คู่มือการใช้งาน
            </h2>
            
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-white">วิธีส่งผลคะแนน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-white">ถ่ายรูปกระดานนับคะแนน</p>
                    <p className="text-sm text-slate-400">ถ่ายรูปกระดานให้ชัดเจน เห็นตัวเลขครบถ้วน</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-white">กรอกผลคะแนน</p>
                    <p className="text-sm text-slate-400">กรอกจำนวนผู้มีสิทธิ์ บัตรดี บัตรเสีย และคะแนนผู้สมัคร</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-white">กดส่งผลคะแนน</p>
                    <p className="text-sm text-slate-400">ตรวจสอบความถูกต้องแล้วกดปุ่มส่ง</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-white">ข้อควรระวัง</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">
                    ตรวจสอบตัวเลขให้ถูกต้องก่อนส่ง เพราะข้อมูลจะถูกใช้ในการวิเคราะห์
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">
                    ถ่ายรูปในที่แสงสว่างเพียงพอ เพื่อให้ระบบอ่านตัวเลขได้ง่าย
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">
                    หากพบความผิดปกติ ให้บันทึกในช่องหมายเหตุ
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ออกจากระบบ
                </Button>
              </CardContent>
            </Card>
            
            <div className="text-center pt-4">
              <Link href="/">
                <Button variant="ghost" className="text-slate-400">
                  <Home className="h-4 w-4 mr-2" />
                  กลับหน้าหลัก
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800 safe-area-bottom z-50">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                  isActive 
                    ? "text-green-500" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className={`text-xs mt-1 ${isActive ? "font-medium" : ""}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-8 h-1 bg-green-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
