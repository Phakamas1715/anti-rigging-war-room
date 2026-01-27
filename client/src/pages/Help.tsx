import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, CheckCircle, AlertTriangle, HelpCircle, Phone, Mail } from "lucide-react";
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
            คำแนะนำสำหรับอาสาสมัครในการส่งข้อมูลผลการนับคะแนนเลือกตั้ง
          </p>
        </div>

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
                  ใช้รหัสอาสาสมัคร 6 หลักที่ได้รับจากผู้ประสานงาน
                </p>
              </div>
              <div className="text-center space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold">ถ่ายรูปกระดาน</h3>
                <p className="text-sm text-muted-foreground">
                  ถ่ายภาพกระดานนับคะแนนให้ชัดเจน ระบบจะอ่านตัวเลขให้อัตโนมัติ
                </p>
              </div>
              <div className="text-center space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold">ยืนยันและส่ง</h3>
                <p className="text-sm text-muted-foreground">
                  ตรวจสอบความถูกต้องของข้อมูล แล้วกดส่ง
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
                วิธีใช้ระบบ OCR
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
                  <span>รอระบบประมวลผลภาพ (ประมาณ 5-10 วินาที)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">3</span>
                  <span>ตรวจสอบตัวเลขที่ระบบอ่านได้</span>
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
                  รหัสอาสาสมัครคือรหัส 6 หลักที่ผู้ประสานงานสร้างให้คุณ ใช้สำหรับเข้าสู่ระบบโดยไม่ต้องสมัครสมาชิก 
                  รหัสนี้จะผูกกับหน่วยเลือกตั้งที่คุณรับผิดชอบ
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>ถ้าไม่มีสัญญาณอินเทอร์เน็ตจะทำอย่างไร?</AccordionTrigger>
                <AccordionContent>
                  ระบบรองรับ Offline Mode คุณสามารถกรอกข้อมูลและถ่ายรูปได้แม้ไม่มีสัญญาณ 
                  ข้อมูลจะถูกเก็บไว้ในเครื่องและส่งอัตโนมัติเมื่อมีสัญญาณกลับมา
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>ระบบ OCR อ่านตัวเลขผิด ทำอย่างไร?</AccordionTrigger>
                <AccordionContent>
                  คุณสามารถแก้ไขตัวเลขได้ก่อนกดส่ง หากภาพไม่ชัด ลองถ่ายใหม่ให้ชัดขึ้น 
                  หรือกรอกตัวเลขด้วยตนเองแทนการใช้ OCR
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
                  ข้อมูลจะถูกนำไปเปรียบเทียบกับผลการนับคะแนนอย่างเป็นทางการ (Parallel Vote Tabulation) 
                  เพื่อตรวจสอบความโปร่งใสของการเลือกตั้ง หากพบความแตกต่างมาก ระบบจะแจ้งเตือนทีมงานทันที
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger>ใครเห็นข้อมูลที่ฉันส่ง?</AccordionTrigger>
                <AccordionContent>
                  ข้อมูลจะถูกเก็บอย่างปลอดภัยและเข้าถึงได้เฉพาะทีมผู้ดูแลระบบเท่านั้น 
                  ข้อมูลส่วนตัวของคุณจะไม่ถูกเปิดเผยต่อสาธารณะ
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

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
