import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Copy, Trash2, QrCode, Users, Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VolunteerCodes() {
  const [bulkCount, setBulkCount] = useState(10);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [newCode, setNewCode] = useState({ volunteerName: '', phone: '', stationId: '' });

  const utils = trpc.useUtils();
  const { data: codes, isLoading } = trpc.volunteerCode.list.useQuery({});
  const { data: stats } = trpc.volunteerCode.stats.useQuery();
  const { data: stations } = trpc.stations.list.useQuery();

  const createMutation = trpc.volunteerCode.create.useMutation({
    onSuccess: (data) => {
      toast.success(`สร้างรหัส ${data.code} สำเร็จ`);
      utils.volunteerCode.list.invalidate();
      utils.volunteerCode.stats.invalidate();
      setShowCreateDialog(false);
      setNewCode({ volunteerName: '', phone: '', stationId: '' });
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const bulkCreateMutation = trpc.volunteerCode.bulkCreate.useMutation({
    onSuccess: (data) => {
      toast.success(`สร้างรหัส ${data.count} รหัสสำเร็จ`);
      utils.volunteerCode.list.invalidate();
      utils.volunteerCode.stats.invalidate();
      setShowBulkDialog(false);
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const deactivateMutation = trpc.volunteerCode.deactivate.useMutation({
    onSuccess: () => {
      toast.success('ยกเลิกรหัสสำเร็จ');
      utils.volunteerCode.list.invalidate();
      utils.volunteerCode.stats.invalidate();
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      volunteerName: newCode.volunteerName || undefined,
      phone: newCode.phone || undefined,
      stationId: newCode.stationId && newCode.stationId !== 'none' ? parseInt(newCode.stationId) : undefined,
    });
  };

  const handleBulkCreate = () => {
    bulkCreateMutation.mutate({ count: bulkCount });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`คัดลอกรหัส ${code} แล้ว`);
  };

  const copyLoginUrl = (code: string) => {
    const url = `${window.location.origin}/volunteer/login?code=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('คัดลอกลิงก์เข้าสู่ระบบแล้ว');
  };

  const exportCSV = () => {
    if (!codes) return;
    
    const csv = [
      ['รหัส', 'ชื่อ', 'เบอร์โทร', 'หน่วยเลือกตั้ง', 'สถานะ', 'ใช้งานแล้ว', 'วันที่สร้าง'].join(','),
      ...codes.map(c => [
        c.code,
        c.volunteerName || '',
        c.phone || '',
        c.stationId || '',
        c.isActive ? 'ใช้งานได้' : 'ยกเลิก',
        c.isUsed ? 'ใช้แล้ว' : 'ยังไม่ใช้',
        new Date(c.createdAt).toLocaleDateString('th-TH'),
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volunteer-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ดาวน์โหลด CSV สำเร็จ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">จัดการรหัสอาสาสมัคร</h1>
            <p className="text-slate-400 mt-1">สร้างและจัดการรหัส 6 หลักสำหรับอาสาสมัคร</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} disabled={!codes?.length}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  สร้างหลายรหัส
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>สร้างรหัสหลายรหัส</DialogTitle>
                  <DialogDescription>
                    ระบุจำนวนรหัสที่ต้องการสร้าง (สูงสุด 1,000 รหัส)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>จำนวนรหัส</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={bulkCount}
                      onChange={(e) => setBulkCount(parseInt(e.target.value) || 10)}
                    />
                  </div>
                  <Button 
                    onClick={handleBulkCreate} 
                    className="w-full"
                    disabled={bulkCreateMutation.isPending}
                  >
                    {bulkCreateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        กำลังสร้าง...
                      </>
                    ) : (
                      <>สร้าง {bulkCount} รหัส</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  สร้างรหัส
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>สร้างรหัสอาสาสมัครใหม่</DialogTitle>
                  <DialogDescription>
                    กรอกข้อมูลเบื้องต้น (ไม่บังคับ) หรือปล่อยว่างเพื่อสร้างรหัสเปล่า
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>ชื่ออาสาสมัคร (ไม่บังคับ)</Label>
                    <Input
                      placeholder="ชื่อ-นามสกุล"
                      value={newCode.volunteerName}
                      onChange={(e) => setNewCode({ ...newCode, volunteerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>เบอร์โทร (ไม่บังคับ)</Label>
                    <Input
                      placeholder="08x-xxx-xxxx"
                      value={newCode.phone}
                      onChange={(e) => setNewCode({ ...newCode, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>หน่วยเลือกตั้ง (ไม่บังคับ)</Label>
                    <Select
                      value={newCode.stationId}
                      onValueChange={(value) => setNewCode({ ...newCode, stationId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหน่วยเลือกตั้ง" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ไม่ระบุ</SelectItem>
                        {stations?.map((station) => (
                          <SelectItem key={station.id} value={station.id.toString()}>
                            {station.stationCode} - {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreate} 
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        กำลังสร้าง...
                      </>
                    ) : (
                      <>สร้างรหัส</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Key className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
                  <p className="text-xs text-slate-400">รหัสทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.used || 0}</p>
                  <p className="text-xs text-slate-400">ใช้งานแล้ว</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Users className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.unused || 0}</p>
                  <p className="text-xs text-slate-400">ยังไม่ใช้</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <QrCode className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.active || 0}</p>
                  <p className="text-xs text-slate-400">ใช้งานได้</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Codes Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">รายการรหัสอาสาสมัคร</CardTitle>
            <CardDescription>คลิกที่รหัสเพื่อคัดลอก</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : codes?.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มีรหัสอาสาสมัคร</p>
                <p className="text-sm mt-2">กดปุ่ม "สร้างรหัส" เพื่อเริ่มต้น</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">รหัส</TableHead>
                      <TableHead className="text-slate-400">ชื่อ</TableHead>
                      <TableHead className="text-slate-400">เบอร์โทร</TableHead>
                      <TableHead className="text-slate-400">หน่วย</TableHead>
                      <TableHead className="text-slate-400">สถานะ</TableHead>
                      <TableHead className="text-slate-400">ใช้งาน</TableHead>
                      <TableHead className="text-slate-400 text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes?.map((code) => (
                      <TableRow key={code.id} className="border-slate-700">
                        <TableCell>
                          <button
                            onClick={() => copyCode(code.code)}
                            className="font-mono text-lg font-bold text-white hover:text-red-400 transition-colors"
                          >
                            {code.code}
                          </button>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {code.volunteerName || '-'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {code.phone || '-'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {code.stationId || '-'}
                        </TableCell>
                        <TableCell>
                          {code.isActive ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              ใช้งานได้
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              ยกเลิก
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.isUsed ? (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              ใช้แล้ว
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400 border-slate-600">
                              ยังไม่ใช้
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyLoginUrl(code.code)}
                              title="คัดลอกลิงก์"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            {code.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deactivateMutation.mutate({ code: code.code })}
                                className="text-red-400 hover:text-red-300"
                                title="ยกเลิกรหัส"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">วิธีใช้งาน</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-2">1. สร้างรหัส</h4>
                <p className="text-sm text-slate-400">
                  กดปุ่ม "สร้างรหัส" หรือ "สร้างหลายรหัส" เพื่อสร้างรหัส 6 หลักสำหรับอาสาสมัคร
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">2. แจกจ่ายรหัส</h4>
                <p className="text-sm text-slate-400">
                  ส่งรหัสให้อาสาสมัครทาง LINE, SMS หรือพิมพ์ออกมาแจก
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">3. อาสาเข้าใช้งาน</h4>
                <p className="text-sm text-slate-400">
                  อาสาสมัครไปที่ <code className="bg-slate-700 px-1 rounded">/volunteer/login</code> แล้วกรอกรหัส 6 หลัก
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
