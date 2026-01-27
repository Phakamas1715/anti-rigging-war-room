import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  Shield, 
  BarChart3, 
  Network, 
  Camera, 
  AlertTriangle, 
  GitCompare,
  LogIn,
  Activity
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  const features = [
    {
      title: "Klimek Model Analysis",
      description: "ตรวจจับการยัดบัตร (Ballot Stuffing) ด้วย Election Fingerprint Heatmap",
      icon: BarChart3,
      href: "/klimek",
      color: "text-red-500"
    },
    {
      title: "Benford's Law Analysis",
      description: "วิเคราะห์ความผิดปกติของตัวเลขด้วยกฎของเบนฟอร์ด",
      icon: Activity,
      href: "/benford",
      color: "text-orange-500"
    },
    {
      title: "Social Network Analysis",
      description: "ตรวจจับเครือข่ายซื้อเสียงและระบุหัวคะแนน (Hubs)",
      icon: Network,
      href: "/network",
      color: "text-blue-500"
    },
    {
      title: "Evidence Upload",
      description: "อัปโหลดหลักฐานภาพถ่ายพร้อมระบบ ProofMode Verification",
      icon: Camera,
      href: "/evidence",
      color: "text-green-500"
    },
    {
      title: "Fraud Alerts",
      description: "ระบบแจ้งเตือนความผิดปกติแบบเรียลไทม์",
      icon: AlertTriangle,
      href: "/alerts",
      color: "text-yellow-500"
    },
    {
      title: "PVT Comparison",
      description: "เปรียบเทียบผลนับคะแนนคู่ขนาน (Parallel Vote Tabulation)",
      icon: GitCompare,
      href: "/pvt",
      color: "text-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-500" />
            <span className="text-xl font-bold text-white">Anti-Rigging War Room</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Dashboard
              </Button>
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-sm">{user?.name || user?.email}</span>
              </div>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                  <LogIn className="mr-2 h-4 w-4" />
                  เข้าสู่ระบบ
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6">
            Election Forensics
            <span className="text-red-500"> War Room</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            ระบบตรวจจับการทุจริตการเลือกตั้งระดับนิติวิทยาศาสตร์ ด้วย Klimek Model, 
            Benford's Law และ Social Network Analysis
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                เข้าสู่ Dashboard
              </Button>
            </Link>
            <Link href="/klimek">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                เริ่มวิเคราะห์
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          เครื่องมือวิเคราะห์
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer h-full">
                <CardHeader>
                  <feature.icon className={`h-10 w-10 ${feature.color} mb-2`} />
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 text-center p-6">
            <div className="text-4xl font-bold text-red-500 mb-2">α</div>
            <div className="text-slate-400 text-sm">Vote Stuffing Detection</div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 text-center p-6">
            <div className="text-4xl font-bold text-orange-500 mb-2">β</div>
            <div className="text-slate-400 text-sm">Vote Stealing Detection</div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 text-center p-6">
            <div className="text-4xl font-bold text-blue-500 mb-2">2BL</div>
            <div className="text-slate-400 text-sm">Benford's Law Analysis</div>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800 text-center p-6">
            <div className="text-4xl font-bold text-green-500 mb-2">SNA</div>
            <div className="text-slate-400 text-sm">Network Analysis</div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container text-center text-slate-500 text-sm">
          <p>Anti-Rigging War Room - Election Forensics System</p>
          <p className="mt-2">Powered by Klimek Model, Benford's Law & Social Network Analysis</p>
        </div>
      </footer>
    </div>
  );
}
