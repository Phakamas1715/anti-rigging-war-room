import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { ArrowLeft, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BenfordAnalysis() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [inputData, setInputData] = useState("");
  const [result, setResult] = useState<{
    expectedFreq: number[];
    observedFreq: number[];
    chiSquare: number;
    isSuspicious: boolean;
    deviations: { digit: number; expected: number; observed: number; deviation: number }[];
  } | null>(null);

  const analyzeMutation = trpc.benford.analyze.useMutation({
    onSuccess: (data) => {
      setResult(data);
      if (data.isSuspicious) {
        toast.error("ตรวจพบความผิดปกติ! Chi-square = " + data.chiSquare.toFixed(2));
      } else {
        toast.success("ข้อมูลผ่านการตรวจสอบ Benford's Law");
      }
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  const handleAnalyze = () => {
    const numbers = inputData
      .split(/[\n,\s]+/)
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 10);
    
    if (numbers.length < 50) {
      toast.error("ต้องการข้อมูลอย่างน้อย 50 ตัวเลข (ที่มีอย่างน้อย 2 หลัก)");
      return;
    }
    
    analyzeMutation.mutate(numbers);
  };

  const loadDemoData = () => {
    // Generate demo vote counts
    const demoData: number[] = [];
    for (let i = 0; i < 200; i++) {
      demoData.push(Math.floor(Math.random() * 9000) + 100);
    }
    setInputData(demoData.join("\n"));
    toast.info("โหลดข้อมูลตัวอย่างแล้ว");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Activity className="h-6 w-6 text-orange-500" />
          <span className="text-xl font-bold text-white">Benford's Law Analysis</span>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">ข้อมูลคะแนนเสียง</CardTitle>
              <CardDescription className="text-slate-400">
                ใส่ตัวเลขคะแนนเสียง (แยกด้วย Enter หรือ comma)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="543&#10;1234&#10;789&#10;2567&#10;..."
                className="h-64 bg-slate-800 border-slate-700 text-white font-mono"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {analyzeMutation.isPending ? "กำลังวิเคราะห์..." : "วิเคราะห์"}
                </Button>
                <Button 
                  onClick={loadDemoData}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  โหลดข้อมูลตัวอย่าง
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">ผลการวิเคราะห์</CardTitle>
              <CardDescription className="text-slate-400">
                Second Digit Benford's Law (2BL)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Status */}
                  <div className={`p-4 rounded-lg ${result.isSuspicious ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                    <div className="flex items-center gap-2">
                      {result.isSuspicious ? (
                        <>
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                          <span className="text-red-400 font-bold">ตรวจพบความผิดปกติ!</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-6 w-6 text-green-500" />
                          <span className="text-green-400 font-bold">ผ่านการตรวจสอบ</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-slate-400">
                      Chi-square: <span className="font-mono text-white">{result.chiSquare.toFixed(4)}</span>
                      <span className="ml-2">(Critical: 16.92)</span>
                    </div>
                  </div>

                  {/* Frequency Chart */}
                  <div>
                    <div className="text-sm text-slate-400 mb-3">การกระจายตัวของเลขหลักที่ 2</div>
                    <div className="space-y-2">
                      {result.deviations.map((d) => (
                        <div key={d.digit} className="flex items-center gap-2">
                          <div className="w-8 text-slate-400 text-sm font-mono">{d.digit}</div>
                          <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden relative">
                            {/* Expected */}
                            <div 
                              className="absolute h-full bg-blue-500/30 border-r-2 border-blue-500"
                              style={{ width: `${d.expected * 100 * 8}%` }}
                            />
                            {/* Observed */}
                            <div 
                              className={`absolute h-full ${
                                Math.abs(d.deviation) > 0.03 ? 'bg-red-500/50' : 'bg-green-500/50'
                              }`}
                              style={{ width: `${d.observed * 100 * 8}%` }}
                            />
                          </div>
                          <div className="w-20 text-xs text-slate-400">
                            {(d.observed * 100).toFixed(1)}% / {(d.expected * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500/30 border border-blue-500 rounded" />
                        <span>Expected</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500/50 rounded" />
                        <span>Observed (Normal)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500/50 rounded" />
                        <span>Observed (Anomaly)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  ใส่ข้อมูลและกดวิเคราะห์
                </div>
              )}
            </CardContent>
          </Card>
        </div>

{/* Formula Explanation - Admin Only */}
        {isAdmin && (
        <Card className="bg-slate-900/50 border-slate-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">สูตร Second Digit Benford's Law (2BL)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-800/50 p-4 rounded-lg font-mono text-orange-400 text-center text-lg">
              P(d₂) = Σ log₁₀(1 + 1/(10k + d₂)) for k = 1 to 9
            </div>
            <div className="mt-4 text-slate-400 text-sm">
              <p className="mb-2">
                <strong className="text-white">หลักการ:</strong> ตัวเลขที่เกิดขึ้นตามธรรมชาติจะมีการกระจายตัวของเลขหลักที่ 2 
                ตามสูตร Logarithm นี้ ถ้าตัวเลขถูกแต่งขึ้นโดยมนุษย์ การกระจายตัวจะผิดเพี้ยนไป
              </p>
              <p>
                <strong className="text-white">การตัดสิน:</strong> ใช้ Chi-square test เปรียบเทียบความถี่ที่สังเกตได้กับความถี่ที่คาดหวัง
                ถ้า Chi-square {">"} 16.92 (df=9, α=0.05) แสดงว่าข้อมูลน่าสงสัย
              </p>
            </div>
          </CardContent>
        </Card>
        )}
      </main>
    </div>
  );
}
