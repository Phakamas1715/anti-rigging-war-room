import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, ArrowRight, Loader2, CheckCircle, AlertCircle, Home, ArrowLeft, UserPlus } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';

export default function VolunteerLogin() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.volunteerCode.login.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError('กรุณากรอกรหัส 6 หลัก');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({ code });

      if (result.success) {
        // Save session to localStorage for mobile app
        const session = {
          code: code,
          volunteerId: 0, // Will be set by backend
          stationId: result.stationId,
          stationName: result.stationName || 'หน่วยเลือกตั้ง',
          province: result.province || '',
          district: result.district || '',
          volunteerName: result.volunteerName || '',
        };
        localStorage.setItem('volunteer_session', JSON.stringify(session));
        
        toast.success('เข้าสู่ระบบสำเร็จ');
        setLocation('/volunteer/app');
      } else {
        setError(result.error || 'รหัสไม่ถูกต้อง');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Back Button - Top Left */}
      <Link href="/">
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับหน้าหลัก
        </Button>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Anti-Rigging War Room</h1>
          <p className="text-slate-400 mt-2">ระบบอาสาสมัครนับคะแนน</p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">เข้าสู่ระบบอาสาสมัคร</CardTitle>
            <CardDescription className="text-slate-400">
              กรอกรหัส 6 หลักที่ได้รับจากผู้ดูแล
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300">รหัสอาสาสมัคร</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  value={code}
                  onChange={handleCodeChange}
                  className="text-center text-3xl tracking-[0.5em] font-mono bg-slate-900/50 border-slate-600 text-white h-16"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-slate-500 text-center">
                  ตัวอย่าง: 123456
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
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 text-center mb-3">
                ยังไม่มีรหัส?
              </p>
              <Link href="/volunteer/register">
                <Button variant="outline" className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  ลงทะเบียนรับรหัสใหม่
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">ไม่ต้องสมัคร</p>
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
            <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-800">
              <Home className="w-4 h-4 mr-2" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
