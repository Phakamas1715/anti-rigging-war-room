import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Shield,
  AlertTriangle,
  Camera,
  CheckCircle,
  Network,
  Map,
  FileText,
  Bell,
} from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
          <h1 className="text-xl font-bold">วิธีการทำงานของระบบ</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            ระบบตรวจจับ<span className="text-red-500">การทุจริต</span>การเลือกตั้ง
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            ใช้หลักการทางสถิติและนิติวิทยาศาสตร์ระดับสากล วิเคราะห์ข้อมูลแบบ Real-time
            เพื่อตรวจจับความผิดปกติในการเลือกตั้ง
          </p>
        </section>

        {/* How Data Flows */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            วิธีเพิ่มข้อมูลเข้าระบบ
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                  <Camera className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="text-white">1. อาสาสมัครภาคสนาม</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400 space-y-2">
                <p>วิธีหลักในการรวบรวมข้อมูล</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>ลงทะเบียนรับรหัส 6 หลัก</li>
                  <li>ถ่ายรูปกระดานนับคะแนน</li>
                  <li>ระบบ OCR อ่านตัวเลขอัตโนมัติ</li>
                  <li>ส่งข้อมูลแบบ Real-time</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-white">2. Admin Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400 space-y-2">
                <p>สำหรับนำเข้าข้อมูลจำนวนมาก</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Import CSV/Excel</li>
                  <li>Batch OCR หลายรูปพร้อมกัน</li>
                  <li>เพิ่มข้อมูลด้วยตนเอง</li>
                  <li>จัดการหน่วยเลือกตั้ง</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                  <Network className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-white">3. API Integration</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400 space-y-2">
                <p>สำหรับ Developer</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>tRPC endpoints</li>
                  <li>ส่งข้อมูลอัตโนมัติ</li>
                  <li>เชื่อมต่อระบบอื่น</li>
                  <li>Webhook callbacks</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Analysis Tools */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-yellow-500" />
            เครื่องมือวิเคราะห์ทางสถิติ
          </h2>

          <div className="space-y-6">
            {/* Klimek Model */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  Klimek Model - ตรวจจับการยัดบัตร/ขโมยคะแนน
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                <p className="mb-4">
                  วิเคราะห์ความสัมพันธ์ระหว่าง <strong className="text-white">อัตราการออกมาใช้สิทธิ์ (Turnout)</strong> กับ{" "}
                  <strong className="text-white">สัดส่วนคะแนนของผู้ชนะ (Vote Share)</strong>
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Alpha (α) - Vote Stuffing</h4>
                    <p className="text-sm">การยัดบัตรลงหีบ</p>
                    <p className="text-sm mt-2">
                      เกณฑ์ปกติ: <span className="text-green-400">&lt; 0.05</span>
                    </p>
                    <p className="text-sm">
                      สัญญาณผิดปกติ: <span className="text-red-400">&gt; 0.05</span>
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Beta (β) - Vote Stealing</h4>
                    <p className="text-sm">การขโมยคะแนนจากคู่แข่ง</p>
                    <p className="text-sm mt-2">
                      เกณฑ์ปกติ: <span className="text-green-400">&lt; 0.03</span>
                    </p>
                    <p className="text-sm">
                      สัญญาณผิดปกติ: <span className="text-red-400">&gt; 0.03</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benford's Law */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                  </div>
                  Benford's Law - วิเคราะห์รูปแบบตัวเลข
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                <p className="mb-4">
                  ในชุดข้อมูลตัวเลขที่เกิดขึ้นตามธรรมชาติ ตัวเลขหลักแรกจะไม่กระจายตัวเท่ากัน 
                  การปลอมแปลงตัวเลขด้วยมือมักสร้างรูปแบบที่ผิดปกติ
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Chi-Square</h4>
                    <p className="text-sm">ค่าความแตกต่างจากการกระจายตัวตามทฤษฎี</p>
                    <p className="text-sm mt-2">
                      เกณฑ์ปกติ: <span className="text-green-400">&lt; 15.51</span>
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">P-Value</h4>
                    <p className="text-sm">ความน่าจะเป็นที่ข้อมูลเป็นไปตามธรรมชาติ</p>
                    <p className="text-sm mt-2">
                      เกณฑ์ปกติ: <span className="text-green-400">&gt; 0.05</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PVT */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-500" />
                  </div>
                  PVT - การนับคะแนนคู่ขนาน
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                <p className="mb-4">
                  วิธีการมาตรฐานสากลที่องค์กรสังเกตการณ์การเลือกตั้งใช้ทั่วโลก 
                  ส่งอาสาสมัครไปประจำหน่วยเลือกตั้ง บันทึกผลคะแนนจริง แล้วนำมาเปรียบเทียบกับผลทางการ
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Gap</h4>
                    <p className="text-sm">ส่วนต่างระหว่างคะแนนที่เรานับ vs ทางการ</p>
                    <p className="text-sm mt-2">
                      เกณฑ์ปกติ: <span className="text-green-400">&lt; 1%</span>
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Coverage</h4>
                    <p className="text-sm">สัดส่วนหน่วยที่มีอาสาสมัครครอบคลุม</p>
                    <p className="text-sm mt-2">
                      เป้าหมาย: <span className="text-green-400">&gt; 80%</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SNA */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center">
                    <Network className="h-4 w-4 text-purple-500" />
                  </div>
                  Network Analysis - วิเคราะห์เครือข่าย
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                <p className="mb-4">
                  ใช้ทฤษฎีกราฟวิเคราะห์ความสัมพันธ์ระหว่างบุคคลหรือหน่วยงานที่เกี่ยวข้องกับการเลือกตั้ง 
                  เพื่อค้นหา "Hub" หรือจุดศูนย์กลางที่อาจเป็นผู้ประสานงานการทุจริต
                </p>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Centrality Score</h4>
                  <p className="text-sm">ความเป็นศูนย์กลางของโหนด</p>
                  <p className="text-sm mt-2">
                    สัญญาณผิดปกติ: <span className="text-red-400">&gt; 0.7</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Spatial */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center">
                    <Map className="h-4 w-4 text-orange-500" />
                  </div>
                  Spatial Analysis - วิเคราะห์เชิงพื้นที่
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                <p className="mb-4">
                  หน่วยเลือกตั้งที่อยู่ใกล้กันควรมีพฤติกรรมการลงคะแนนคล้ายกัน 
                  หากพบหน่วยที่มีผลลัพธ์แตกต่างจากเพื่อนบ้านอย่างมาก อาจบ่งชี้ความผิดปกติ
                </p>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Z-Score</h4>
                  <p className="text-sm">ค่าเบี่ยงเบนมาตรฐานจากค่าเฉลี่ยเพื่อนบ้าน</p>
                  <p className="text-sm mt-2">
                    เกณฑ์ปกติ: <span className="text-green-400">-2 ถึง +2</span>
                  </p>
                  <p className="text-sm">
                    สัญญาณผิดปกติ: <span className="text-red-400">&gt; 2 หรือ &lt; -2</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Alert System */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Bell className="h-6 w-6 text-red-500" />
            ระบบแจ้งเตือน
          </h2>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <p className="text-gray-400 mb-4">
                ระบบส่งการแจ้งเตือนอัตโนมัติเมื่อตรวจพบความผิดปกติ ผ่าน 2 ช่องทาง
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#5865F2]/20 p-4 rounded-lg border border-[#5865F2]/30">
                  <h4 className="font-semibold text-white mb-2">Discord Webhook</h4>
                  <p className="text-sm text-gray-400">Rich Embed พร้อมสีตามระดับความรุนแรง</p>
                </div>
                <div className="bg-[#00B900]/20 p-4 rounded-lg border border-[#00B900]/30">
                  <h4 className="font-semibold text-white mb-2">LINE Notify</h4>
                  <p className="text-sm text-gray-400">ข้อความพร้อมรายละเอียดหน่วยที่พบปัญหา</p>
                </div>
              </div>

              <h4 className="font-semibold text-white mb-3">ประเภทการแจ้งเตือน:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-400">Klimek Alert - เมื่อพบ Alpha &gt; 0.05 หรือ Beta &gt; 0.03</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-gray-400">PVT Gap Alert - เมื่อพบส่วนต่างคะแนนเกินเกณฑ์</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-gray-400">Benford Alert - เมื่อ P-Value &lt; 0.05</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-gray-400">Network Hub Alert - เมื่อพบบุคคลที่มี Centrality Score &gt; 0.7</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-400">Spatial Alert - เมื่อพบหน่วยที่มี Z-Score &gt; 2</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">พร้อมเริ่มต้นใช้งาน?</h2>
          <p className="text-gray-400 mb-6">
            ลองใช้งานระบบได้ทันที หรือดูตัวอย่างการทำงานในโหมดสาธิต
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/volunteer/register">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Users className="mr-2 h-5 w-5" />
                ลงทะเบียนอาสาสมัคร
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                <Shield className="mr-2 h-5 w-5" />
                ดูโหมดสาธิต
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Anti-Rigging War Room - ระบบตรวจจับการทุจริตการเลือกตั้ง</p>
          <p className="mt-2">
            อ้างอิง: Klimek et al. (2012), Mebane (2008), NDI Quick Count Guidelines
          </p>
        </div>
      </footer>
    </div>
  );
}
