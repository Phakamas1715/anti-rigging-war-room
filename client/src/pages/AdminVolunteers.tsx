import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, UserCheck, UserX, Clock, CheckCircle, XCircle,
  ArrowLeft, Search, MapPin, Phone, Building, Image,
  Loader2, RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminVolunteers() {
  const [selectedVolunteer, setSelectedVolunteer] = useState<number | null>(null);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  
  // Queries
  const statsQuery = trpc.volunteer.stats.useQuery();
  const volunteersQuery = trpc.adminVolunteer.list.useQuery({});
  const pendingSubmissionsQuery = trpc.adminVolunteer.pendingSubmissions.useQuery();
  const stationsQuery = trpc.volunteer.availableStations.useQuery();
  
  // Mutations
  const approveMutation = trpc.adminVolunteer.approve.useMutation();
  const deactivateMutation = trpc.adminVolunteer.deactivate.useMutation();
  const verifySubmissionMutation = trpc.adminVolunteer.verifySubmission.useMutation();
  
  const handleApprove = async () => {
    if (!selectedVolunteer || !selectedStation) {
      toast.error("กรุณาเลือกหน่วยเลือกตั้ง");
      return;
    }
    
    setIsApproving(true);
    try {
      const result = await approveMutation.mutateAsync({
        volunteerId: selectedVolunteer,
        stationId: parseInt(selectedStation),
      });
      toast.success(result.message);
      volunteersQuery.refetch();
      setSelectedVolunteer(null);
      setSelectedStation("");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleDeactivate = async (volunteerId: number) => {
    try {
      const result = await deactivateMutation.mutateAsync({ volunteerId });
      toast.success(result.message);
      volunteersQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };
  
  const handleVerifySubmission = async (submissionId: number, status: "verified" | "rejected") => {
    try {
      const result = await verifySubmissionMutation.mutateAsync({ submissionId, status });
      toast.success(result.message);
      pendingSubmissionsQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };
  
  const filteredVolunteers = volunteersQuery.data?.filter(v => 
    v.volunteerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm)
  ) || [];
  
  const pendingVolunteers = filteredVolunteers.filter(v => v.status === "pending");
  const activeVolunteers = filteredVolunteers.filter(v => v.status === "active");
  const inactiveVolunteers = filteredVolunteers.filter(v => v.status === "inactive");
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-14">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold ml-2">จัดการอาสาสมัคร</h1>
        </div>
      </header>
      
      <main className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{statsQuery.data?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">อาสาสมัครทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{statsQuery.data?.active || 0}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{statsQuery.data?.pending || 0}</p>
                  <p className="text-xs text-muted-foreground">รออนุมัติ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Image className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{statsQuery.data?.submissions || 0}</p>
                  <p className="text-xs text-muted-foreground">รายงานทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาด้วยรหัสอาสาสมัครหรือเบอร์โทร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="relative">
              รออนุมัติ
              {pendingVolunteers.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingVolunteers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="submissions" className="relative">
              รายงาน
              {pendingSubmissionsQuery.data && pendingSubmissionsQuery.data.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingSubmissionsQuery.data.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Pending Volunteers */}
          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingVolunteers.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">ไม่มีอาสาสมัครรออนุมัติ</p>
                </CardContent>
              </Card>
            ) : (
              pendingVolunteers.map((volunteer) => (
                <Card key={volunteer.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-mono font-bold text-primary">{volunteer.volunteerCode}</p>
                        {volunteer.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {volunteer.phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          ลงทะเบียน: {new Date(volunteer.createdAt).toLocaleString("th-TH")}
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setSelectedVolunteer(volunteer.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            อนุมัติ
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>อนุมัติอาสาสมัคร</DialogTitle>
                            <DialogDescription>
                              เลือกหน่วยเลือกตั้งที่จะมอบหมายให้อาสาสมัคร {volunteer.volunteerCode}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>หน่วยเลือกตั้ง</Label>
                              <Select value={selectedStation} onValueChange={setSelectedStation}>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกหน่วยเลือกตั้ง" />
                                </SelectTrigger>
                                <SelectContent>
                                  {stationsQuery.data?.map((station) => (
                                    <SelectItem key={station.id} value={station.id.toString()}>
                                      {station.stationCode} - {station.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={handleApprove}
                              disabled={isApproving || !selectedStation}
                            >
                              {isApproving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              ยืนยันการอนุมัติ
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Active Volunteers */}
          <TabsContent value="active" className="space-y-4 mt-4">
            {activeVolunteers.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">ไม่มีอาสาสมัคร Active</p>
                </CardContent>
              </Card>
            ) : (
              activeVolunteers.map((volunteer) => (
                <Card key={volunteer.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-primary">{volunteer.volunteerCode}</p>
                          <span className="bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded">
                            Active
                          </span>
                        </div>
                        {volunteer.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {volunteer.phone}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          หน่วยที่ {volunteer.stationId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          รายงาน: {volunteer.submissionCount} ครั้ง
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                        onClick={() => handleDeactivate(volunteer.id)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        ยกเลิก
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Inactive Volunteers */}
          <TabsContent value="inactive" className="space-y-4 mt-4">
            {inactiveVolunteers.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center">
                  <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">ไม่มีอาสาสมัคร Inactive</p>
                </CardContent>
              </Card>
            ) : (
              inactiveVolunteers.map((volunteer) => (
                <Card key={volunteer.id} className="bg-card/50 border-border/50 opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold">{volunteer.volunteerCode}</p>
                          <span className="bg-gray-500/20 text-gray-500 text-xs px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        </div>
                        {volunteer.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {volunteer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Pending Submissions */}
          <TabsContent value="submissions" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => pendingSubmissionsQuery.refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                รีเฟรช
              </Button>
            </div>
            
            {!pendingSubmissionsQuery.data || pendingSubmissionsQuery.data.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">ไม่มีรายงานรอตรวจสอบ</p>
                </CardContent>
              </Card>
            ) : (
              pendingSubmissionsQuery.data.map((submission) => (
                <Card key={submission.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">หน่วยที่ {submission.stationId}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.createdAt).toLocaleString("th-TH")}
                          </p>
                        </div>
                        <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded">
                          รอตรวจสอบ
                        </span>
                      </div>
                      
                      {submission.photoUrl && (
                        <img 
                          src={submission.photoUrl} 
                          alt="Evidence" 
                          className="w-full max-h-48 object-cover rounded-lg border border-border/50"
                        />
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/30 p-2 rounded">
                          <p className="text-xs text-muted-foreground">ผู้มีสิทธิ์</p>
                          <p className="font-bold">{submission.totalVoters}</p>
                        </div>
                        <div className="bg-muted/30 p-2 rounded">
                          <p className="text-xs text-muted-foreground">บัตรดี</p>
                          <p className="font-bold">{submission.validVotes}</p>
                        </div>
                        <div className="bg-blue-500/10 p-2 rounded">
                          <p className="text-xs text-muted-foreground">ผู้สมัคร A</p>
                          <p className="font-bold text-blue-500">{submission.candidateAVotes}</p>
                        </div>
                        <div className="bg-red-500/10 p-2 rounded">
                          <p className="text-xs text-muted-foreground">ผู้สมัคร B</p>
                          <p className="font-bold text-red-500">{submission.candidateBVotes}</p>
                        </div>
                      </div>
                      
                      {submission.notes && (
                        <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                          หมายเหตุ: {submission.notes}
                        </p>
                      )}
                      
                      {submission.latitude && submission.longitude && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {parseFloat(submission.latitude).toFixed(4)}, {parseFloat(submission.longitude).toFixed(4)}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerifySubmission(submission.id, "verified")}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          ยืนยัน
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 text-red-500 border-red-500/50 hover:bg-red-500/10"
                          onClick={() => handleVerifySubmission(submission.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          ปฏิเสธ
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
