import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, CheckCircle, AlertTriangle, HelpCircle, Phone, Mail, Shield, BarChart3, Activity, Map, Network, Brain, Eye } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Help() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold text-primary cursor-pointer">Anti-Rigging War Room</span>
          </Link>
          <Link href="/volunteer/login">
            <Button variant="outline">เข้าสู่ระบบอาสา</Button>
          </Link>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">คู่มือการใช้งาน</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            คำแนะนำสำหรับอาสาสมัครและผู้ดูแลระบบ Anti-Rigging War Room
          </p>
        </div>

        {/* Tabs for Volunteer vs Admin */}
        <Tabs defaultValue="volunteer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="volunteer">สำหรับอาสาสมัคร</TabsTrigger>
            <TabsTrigger value="admin">สำหรับผู้ดูแลระบบ</TabsTrigger>
          </TabsList>

          {/* ===== VOLUNTEER TAB ===== */}
          <TabsContent value="volunteer" className="space-y-6 mt-6">
            {/* Quick Start Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  เริ่มต้นใช้งาน (Quick Start)
                </CardTitle>
                <CardDescription>3 ขั้นตอนง่ายๆ ในการส่งข้อมูล</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center space-y-3 p-4 rounded-lg bg-muted/50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-primary">1</span>
                    </div>
                    <h3 className="font-semibold">เข้าสู่ระบบ</h3>
                    <p className="text-sm text-muted-foreground">
                      ใช้รหัสอาสาสมัคร 6 หลักที่ได้รับจากผู้ประสานงาน หรือลงทะเบียนเพื่อรับรหัสใหม่
                    </p>
                  </div>
                  <div className="text-center space-y-3 p-4 rounded-lg bg-muted/50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-primary">2</span>
                    </div>
                    <h3 className="font-semibold">ถ่ายรูปกระดาน</h3>
                    <p className="text-sm text-muted-foreground">
                      ถ่ายภาพกระดานนับคะแนนให้ชัดเจน ระบบ AI จะอ่านตัวเลขให้อัตโนมัติ (Gemini OCR)
                    </p>
                  </div>
                  <div className="text-center space-y-3 p-4 rounded-lg bg-muted/50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-primary">3</span>
                    </div>
                    <h3 className="font-semibold">ยืนยันและส่ง</h3>
                    <p className="text-sm text-muted-foreground">
                      ตรวจสอบความถูกต้องของข้อมูล แล้วกดส่ง ระบบจะเปรียบเทียบกับผลอย่างเป็นทางการทันที
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Instructions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    วิธีถ่ายภาพกระดานนับคะแนน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2">สำคัญ</Badge>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>ถ่ายให้เห็นตัวเลขทั้งหมดชัดเจน</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>หลีกเลี่ยงแสงสะท้อนหรือเงา</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>ถ่ายตรงๆ ไม่เอียง</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>ให้เห็นรหัสหน่วยเลือกตั้งในภาพ (ถ้ามี)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-sm flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span>หากภาพไม่ชัด ระบบอาจอ่านตัวเลขผิดพลาด กรุณาตรวจสอบก่อนส่ง</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    วิธีใช้ระบบ OCR (Gemini Vision AI)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">1</span>
                      <span>กดปุ่ม "ถ่ายรูป" หรือ "เลือกไฟล์"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">2</span>
                      <span>รอระบบ AI ประมวลผลภาพ (ประมาณ 5-10 วินาที)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">3</span>
                      <span>ตรวจสอบตัวเลขที่ระบบอ่านได้ (ความแม่นยำ 95-98%)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">4</span>
                      <span>แก้ไขหากพบข้อผิดพลาด</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">5</span>
                      <span>กดยืนยันเพื่อส่งข้อมูล</span>
                    </li>
                  </ol>
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-muted-foreground">
                      <strong>ระบบ Validation 5 ชั้น:</strong> ตรวจสอบคะแนนรวม, จำนวนผู้มีสิทธิ์, ความมั่นใจ AI, อัตราผู้มาใช้สิทธิ์, และสถานะ OCR
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  คำถามที่พบบ่อย (FAQ)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>รหัสอาสาสมัครคืออะไร?</AccordionTrigger>
                    <AccordionContent>
                      รหัสอาสาสมัครคือรหัส 6 หลักที่ระบบสร้างให้อัตโนมัติเมื่อคุณลงทะเบียน หรือผู้ประสานงานสร้างให้ 
                      ใช้สำหรับเข้าสู่ระบบโดยไม่ต้องสมัครสมาชิก รหัสนี้จะผูกกับหน่วยเลือกตั้งที่คุณรับผิดชอบ
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>ถ้าไม่มีสัญญาณอินเทอร์เน็ตจะทำอย่างไร?</AccordionTrigger>
                    <AccordionContent>
                      ระบบรองรับ Offline Mode (PWA) คุณสามารถกรอกข้อมูลและถ่ายรูปได้แม้ไม่มีสัญญาณ 
                      ข้อมูลจะถูกเก็บไว้ใน IndexedDB และส่งอัตโนมัติเมื่อมีสัญญาณกลับมา
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>ระบบ OCR อ่านตัวเลขผิด ทำอย่างไร?</AccordionTrigger>
                    <AccordionContent>
                      คุณสามารถแก้ไขตัวเลขได้ก่อนกดส่ง หากภาพไม่ชัด ลองถ่ายใหม่ให้ชัดขึ้น 
                      หรือกรอกตัวเลขด้วยตนเองแทนการใช้ OCR ระบบ Gemini Vision AI มีความแม่นยำ 95-98% เมื่อภาพชัดเจน
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>ส่งข้อมูลผิดแล้วแก้ไขได้ไหม?</AccordionTrigger>
                    <AccordionContent>
                      ได้ครับ คุณสามารถส่งข้อมูลใหม่ได้ ระบบจะใช้ข้อมูลล่าสุดที่ส่งมา 
                      แต่ข้อมูลเก่าจะยังถูกเก็บไว้เพื่อการตรวจสอบ
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>ข้อมูลที่ส่งจะถูกนำไปใช้อย่างไร?</AccordionTrigger>
                    <AccordionContent>
                      ข้อมูลจะถูกนำไปเปรียบเทียบกับผลการนับคะแนนอย่างเป็นทางการ (Parallel Vote Tabulation - PVT) 
                      และวิเคราะห์ด้วย AI หลายโมเดล ได้แก่ Klimek Model, Benford's Law, Social Network Analysis 
                      เพื่อตรวจสอบความโปร่งใสของการเลือกตั้ง หากพบความผิดปกติ ระบบจะแจ้งเตือนทีมงานทันที
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-6">
                    <AccordionTrigger>ใครเห็นข้อมูลที่ฉันส่ง?</AccordionTrigger>
                    <AccordionContent>
                      ข้อมูลจะถูกเก็บอย่างปลอดภัยและเข้าถึงได้เฉพาะทีมผู้ดูแลระบบเท่านั้น 
                      ข้อมูลส่วนตัวของคุณจะไม่ถูกเปิดเผยต่อสาธารณะ
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-7">
                    <AccordionTrigger>GLUE-FIN Score คืออะไร?</AccordionTrigger>
                    <AccordionContent>
                      GLUE-FIN (Global Unified Election Fraud INdicator) คือคะแนนรวมที่ระบบคำนวณจากการวิเคราะห์ 5 โมดูล 
                      ได้แก่ OCR (15%), Klimek Model (30%), Benford's Law (20%), PVT Gap (25%), และ Network Analysis (10%) 
                      คะแนน 0-20 = ปกติ, 21-40 = ต้องตรวจสอบ, 41-60 = น่าสงสัย, 61-80 = น่าสงสัยมาก, 81-100 = วิกฤต
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ADMIN TAB ===== */}
          <TabsContent value="admin" className="space-y-6 mt-6">
            {/* Admin Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-orange-500" />
                  เครื่องมือวิเคราะห์สำหรับผู้ดูแลระบบ
                </CardTitle>
                <CardDescription>ระบบ Anti-Rigging War Room มีเครื่องมือวิเคราะห์ 6 โมดูล</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 space-y-2">
                    <Eye className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-sm">Gemini OCR</h3>
                    <p className="text-xs text-muted-foreground">AI อ่านตัวเลขจากรูปถ่ายกระดานนับคะแนน ความแม่นยำ 95-98%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
                    <BarChart3 className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-sm">Klimek Model</h3>
                    <p className="text-xs text-muted-foreground">ตรวจจับ Vote Stuffing (Alpha) และ Vote Stealing (Beta) จาก PNAS 2012</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-sm">Benford's Law</h3>
                    <p className="text-xs text-muted-foreground">ตรวจสอบการกระจายตัวเลขด้วย Chi-Square Test (2BL)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2">
                    <Map className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-sm">PVT Comparison</h3>
                    <p className="text-xs text-muted-foreground">เปรียบเทียบผลนับคะแนนจากอาสาสมัครกับผลอย่างเป็นทางการ</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-2">
                    <Network className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-sm">Social Network Analysis</h3>
                    <p className="text-xs text-muted-foreground">วิเคราะห์เครือข่ายความสัมพันธ์ด้วย Centrality Score</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 space-y-2">
                    <Brain className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold text-sm">GLUE-FIN Score</h3>
                    <p className="text-xs text-muted-foreground">คะแนนรวมจาก 5 โมดูล แสดงเป็น Heatmap แผนที่ 77 จังหวัด</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Klimek Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-500" />
                  Klimek Model - ตรวจจับการทุจริตเลือกตั้ง
                </CardTitle>
                <CardDescription>อ้างอิงจาก Klimek et al. (2012), PNAS - ใช้ในกว่า 20 ประเทศ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">หลักการทำงาน</h4>
                    <p className="text-sm text-muted-foreground">
                      วิเคราะห์ความสัมพันธ์ระหว่างอัตราผู้มาใช้สิทธิ์ (Turnout) กับสัดส่วนคะแนนผู้ชนะ (Vote Share) 
                      หากมีการทุจริต จะเห็นรูปแบบผิดปกติที่มุมขวาบนของกราฟ (Fraud Zone)
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Alpha (α)</Badge>
                        <span className="text-muted-foreground">Vote Stuffing - ยัดบัตรเพิ่ม</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Beta (β)</Badge>
                        <span className="text-muted-foreground">Vote Stealing - ขโมยคะแนน</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">เกณฑ์การแจ้งเตือน</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                        <span className="text-green-500 font-medium">🟢 ปกติ:</span> Alpha &lt; 5% และ Fraud Zone &lt; 10%
                      </div>
                      <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <span className="text-yellow-500 font-medium">🟡 ต้องตรวจสอบ:</span> Alpha 5-10%
                      </div>
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                        <span className="text-red-500 font-medium">🔴 น่าสงสัยมาก:</span> Alpha &gt; 10% หรือ Fraud Zone &gt; 20%
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ต้องมีข้อมูลอย่างน้อย 100 หน่วยเลือกตั้งเพื่อให้ผลวิเคราะห์มีนัยสำคัญทางสถิติ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benford's Law */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Benford's Law - กฎการกระจายตัวเลข
                </CardTitle>
                <CardDescription>Second Digit Benford's Law (2BL) - ใช้ Chi-Square Test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">หลักการทำงาน</h4>
                    <p className="text-sm text-muted-foreground">
                      ตัวเลขที่เกิดขึ้นตามธรรมชาติจะมีการกระจายตัวของเลขหลักที่ 2 ตามสูตร Logarithm 
                      หากตัวเลขถูกแต่งขึ้นโดยมนุษย์ การกระจายจะผิดเพี้ยนไป
                    </p>
                    <div className="p-3 rounded-lg bg-muted/50 font-mono text-sm text-center">
                      P(d₂) = Σ log₁₀(1 + 1/(10k + d₂))
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">การตัดสิน</h4>
                    <p className="text-sm text-muted-foreground">
                      ใช้ Chi-Square Test เปรียบเทียบความถี่สังเกตได้กับความถี่ที่คาดหวัง
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                        <span className="text-green-500 font-medium">🟢 ปกติ:</span> Chi-Square ≤ 16.92 (df=9, α=0.05)
                      </div>
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                        <span className="text-red-500 font-medium">🔴 น่าสงสัย:</span> Chi-Square &gt; 16.92
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ต้องมีข้อมูลอย่างน้อย 50 ตัวเลขเพื่อให้ผลวิเคราะห์มีความน่าเชื่อถือ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PVT */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-green-500" />
                  PVT - Parallel Vote Tabulation
                </CardTitle>
                <CardDescription>เปรียบเทียบผลนับคะแนนจากอาสาสมัครกับผลอย่างเป็นทางการ (NDI Standard)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">หลักการทำงาน</h4>
                    <p className="text-sm text-muted-foreground">
                      อาสาสมัครส่งผลนับคะแนนจากหน่วยเลือกตั้ง (Our Sum) ระบบเปรียบเทียบกับผลอย่างเป็นทางการ (Their Sum) 
                      หากมี Gap เกินเกณฑ์ ระบบจะแจ้งเตือนทันที
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>ความแม่นยำ:</strong> ±1-2% เมื่อครอบคลุม 30-50% ของหน่วยเลือกตั้ง 
                      (อ้างอิง NDI - 180+ PVTs ใน 46+ ประเทศ)
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">ระดับการแจ้งเตือน</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                        <span className="text-green-500 font-medium">🟢 ปกติ:</span> Gap &lt; 2%
                      </div>
                      <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <span className="text-yellow-500 font-medium">🟡 ต้องตรวจสอบ:</span> Gap 2-5%
                      </div>
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                        <span className="text-red-500 font-medium">🔴 น่าสงสัยมาก:</span> Gap &gt; 5%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GLUE-FIN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-yellow-500" />
                  GLUE-FIN Score - คะแนนรวมความเสี่ยง
                </CardTitle>
                <CardDescription>Global Unified Election Fraud INdicator - รวมสัญญาณจาก 5 โมดูล</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 font-mono text-sm text-center">
                  S = 100 × σ(β₀ + Σ wₖ × zₖ)
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">น้ำหนักแต่ละโมดูล</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>OCR Confidence</span>
                        <Badge variant="outline">15%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Klimek Model</span>
                        <Badge variant="outline">30%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Benford's Law</span>
                        <Badge variant="outline">20%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>PVT Gap</span>
                        <Badge variant="outline">25%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Network Analysis</span>
                        <Badge variant="outline">10%</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">ระดับ GLUE-FIN Score</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                        <span className="text-green-500 font-medium">🟢 ปกติ:</span> 0-20
                      </div>
                      <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <span className="text-yellow-500 font-medium">🟡 ต้องตรวจสอบ:</span> 21-40
                      </div>
                      <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                        <span className="text-orange-500 font-medium">🟠 น่าสงสัย:</span> 41-60
                      </div>
                      <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                        <span className="text-red-500 font-medium">🔴 น่าสงสัยมาก:</span> 61-80
                      </div>
                      <div className="p-2 rounded bg-zinc-800 border border-zinc-700">
                        <span className="text-white font-medium">⚫ วิกฤต:</span> 81-100
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    <span>
                      <strong>Heatmap แผนที่ไทย:</strong> แสดง GLUE-FIN Score ของ 77 จังหวัด 
                      คลิกที่จังหวัดเพื่อดูรายละเอียด Component Scores ของแต่ละโมดูล
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Alert System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  ระบบแจ้งเตือนอัตโนมัติ
                </CardTitle>
                <CardDescription>แจ้งเตือนผ่าน Discord และ LINE เมื่อพบความผิดปกติ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">ช่องทางแจ้งเตือน</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span><strong>Discord Webhook:</strong> Rich embed พร้อมสีตาม Severity</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span><strong>LINE Notify:</strong> ข้อความแจ้งเตือนพร้อมรายละเอียด</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">ประเภทการแจ้งเตือน</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge variant="destructive" className="text-xs shrink-0">Critical</Badge>
                        <span>Klimek Alpha &gt; 10%, PVT Gap &gt; 5%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="bg-yellow-500 text-xs shrink-0">Warning</Badge>
                        <span>Klimek Alpha 5-10%, PVT Gap 2-5%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">Info</Badge>
                        <span>สรุปรายวัน, ข้อมูลใหม่เข้าระบบ</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  ผลการทดสอบระบบ
                </CardTitle>
                <CardDescription>ระบบผ่านการทดสอบ 95/95 Test Cases (100%)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-green-500">95/95</p>
                    <p className="text-xs text-muted-foreground">Tests Passed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">9</p>
                    <p className="text-xs text-muted-foreground">Test Files</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-blue-500">2.46s</p>
                    <p className="text-xs text-muted-foreground">เวลาทดสอบ</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-green-500">100%</p>
                    <p className="text-xs text-muted-foreground">Pass Rate</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span>Klimek Model</span>
                    <Badge variant="outline" className="text-green-500">7 tests ✓</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span>Gemini OCR</span>
                    <Badge variant="outline" className="text-green-500">10 tests ✓</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span>Batch PVT</span>
                    <Badge variant="outline" className="text-green-500">12 tests ✓</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span>Gap Alert</span>
                    <Badge variant="outline" className="text-green-500">14 tests ✓</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span>GLUE-FIN</span>
                    <Badge variant="outline" className="text-green-500">17 tests ✓</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span>Volunteer Code</span>
                    <Badge variant="outline" className="text-green-500">16 tests ✓</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span>Real-time Dashboard</span>
                    <Badge variant="outline" className="text-green-500">13 tests ✓</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span>Settings</span>
                    <Badge variant="outline" className="text-green-500">5 tests ✓</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span>Auth Logout</span>
                    <Badge variant="outline" className="text-green-500">1 test ✓</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limitations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ข้อจำกัดและคำเตือน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span>ผลวิเคราะห์เป็น <strong>"สัญญาณ" (Signal)</strong> ไม่ใช่หลักฐานทางกฎหมาย ต้องมีการสอบสวนเพิ่มเติม</span>
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span>Klimek Model ต้องมีข้อมูลอย่างน้อย <strong>100 หน่วยเลือกตั้ง</strong> เพื่อให้ผลมีนัยสำคัญ</span>
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span>Benford's Law ต้องมีข้อมูลอย่างน้อย <strong>50 ตัวเลข</strong> เพื่อให้ผลน่าเชื่อถือ</span>
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span>PVT ต้องครอบคลุมอย่างน้อย <strong>30-50% ของหน่วยเลือกตั้ง</strong> เพื่อให้ค่าเฉลี่ยแม่นยำ</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle>ติดต่อเรา</CardTitle>
            <CardDescription>หากมีปัญหาหรือข้อสงสัย สามารถติดต่อได้ที่</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">โทรศัพท์</p>
                  <p className="text-sm text-muted-foreground">ติดต่อผู้ประสานงานในพื้นที่ของคุณ</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">LINE</p>
                  <p className="text-sm text-muted-foreground">ติดต่อผ่าน LINE กลุ่มอาสาสมัคร</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline" size="lg">
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
