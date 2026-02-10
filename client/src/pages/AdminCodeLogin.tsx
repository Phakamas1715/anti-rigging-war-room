import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

const ADMIN_CODE = '464646';

export default function AdminCodeLogin() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (code === ADMIN_CODE) {
      // Store admin session in localStorage
      localStorage.setItem('adminSession', JSON.stringify({
        isAdmin: true,
        loginTime: Date.now(),
        method: 'code'
      }));
      setLocation('/admin');
    } else {
      setError('รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
    setIsLoading(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-slate-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับหน้าหลัก
          </Button>
        </Link>

        <Card className="bg-slate-900/80 border-red-800/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-white">เข้าสู่ระบบ Admin</CardTitle>
            <CardDescription className="text-slate-400">
              กรอกรหัส 6 หลักเพื่อเข้าถึง Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  รหัสผู้ดูแลระบบ
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="กรอกรหัส 6 หลัก"
                    value={code}
                    onChange={handleCodeChange}
                    className="pl-10 h-14 text-2xl text-center tracking-[0.5em] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 placeholder:tracking-normal placeholder:text-base"
                    maxLength={6}
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-lg"
                disabled={code.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังตรวจสอบ...
                  </div>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-center text-sm text-slate-500">
                หากคุณไม่มีรหัส กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
