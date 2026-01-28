import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, ArrowRight, Loader2, CheckCircle, AlertCircle, Home, Copy, UserPlus } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VolunteerRegister() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Get polling stations for selection
  const stationsQuery = trpc.stations.list.useQuery();
  const registerMutation = trpc.volunteerCode.register.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    if (!phone.trim()) {
      setError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerMutation.mutateAsync({
        volunteerName: name.trim(),
        phone: phone.trim(),
        lineId: lineId.trim() || undefined,
        stationId: selectedStation ? parseInt(selectedStation) : undefined,
      });

      if (result.success && result.code) {
        setGeneratedCode(result.code);
        setRegistrationSuccess(true);
        toast.success('ลงทะเบียนสำเร็จ!');
      } else {
        setError(result.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success('คัดลอกรหัสแล้ว');
    }
  };

  const goToLogin = () => {
    setLocation('/volunteer/login');
  };

  // Success screen with generated code
  if (registrationSuccess && generatedCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">ลงทะเบียนสำเร็จ!</h1>
            <p className="text-slate-400 mt-2">บันทึกรหัสนี้ไว้เพื่อใช้เข้าสู่ระบบ</p>
          </div>

          {/* Code Display Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-white">รหัสอาสาสมัครของคุณ</CardTitle>
              <CardDescription className="text-slate-400">
                ใช้รหัสนี้ในการเข้าสู่ระบบทุกครั้ง
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Large Code Display */}
              <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-6 text-center">
                <p className="text-5xl font-mono font-bold text-green-400 tracking-[0.3em]">
                  {generatedCode}
                </p>
              </div>

              {/* Copy Button */}
              <Button
                onClick={copyCode}
                variant="outline"
                className="w-full h-12 border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <Copy className="w-4 h-4 mr-2" />
                คัดลอกรหัส
              </Button>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-400 text-center">
                  ⚠️ กรุณาบันทึกรหัสนี้ไว้ในที่ปลอดภัย<br />
                  หากลืมรหัส จะต้องลงทะเบียนใหม่
                </p>
              </div>

              {/* Go to Login Button */}
              <Button
                onClick={goToLogin}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg"
              >
                เข้าสู่ระบบด้วยรหัสนี้
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link href="/">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <Home className="w-4 h-4 mr-2" />
                กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <UserPlus className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">ลงทะเบียนอาสาสมัคร</h1>
          <p className="text-slate-400 mt-2">กรอกข้อมูลเพื่อรับรหัสเข้าสู่ระบบ</p>
        </div>

        {/* Registration Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">ข้อมูลอาสาสมัคร</CardTitle>
            <CardDescription className="text-slate-400">
              ระบบจะออกรหัส 6 หลักให้อัตโนมัติ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  ชื่อ-นามสกุล <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="กรอกชื่อ-นามสกุล"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">
                  เบอร์โทรศัพท์ <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="h-12 bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              {/* LINE ID (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="lineId" className="text-slate-300">
                  LINE ID <span className="text-slate-500">(ไม่บังคับ)</span>
                </Label>
                <Input
                  id="lineId"
                  type="text"
                  placeholder="@lineid"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  className="h-12 bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              {/* Station Selection (Optional) */}
              <div className="space-y-2">
                <Label className="text-slate-300">
                  หน่วยเลือกตั้ง <span className="text-slate-500">(ไม่บังคับ)</span>
                </Label>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="h-12 bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue placeholder="เลือกหน่วยเลือกตั้ง (ถ้าทราบ)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {stationsQuery.data?.map((station: any) => (
                      <SelectItem 
                        key={station.id} 
                        value={station.id.toString()}
                        className="text-white hover:bg-slate-700"
                      >
                        {station.name} - {station.district}, {station.province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  สามารถเลือกหน่วยเลือกตั้งภายหลังได้
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    กำลังลงทะเบียน...
                  </>
                ) : (
                  <>
                    ลงทะเบียนและรับรหัส
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Already have code */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 text-center mb-3">
                มีรหัสอยู่แล้ว?
              </p>
              <Link href="/volunteer/login">
                <Button variant="outline" className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-700">
                  เข้าสู่ระบบด้วยรหัส 6 หลัก
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">รับรหัสทันที</p>
          </div>
          <div className="p-3">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">ใช้งานง่าย</p>
          </div>
          <div className="p-3">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">ปลอดภัย</p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <Home className="w-4 h-4 mr-2" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
