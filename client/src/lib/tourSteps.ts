import { TourStep } from '@/contexts/TourContext';

// Tour สำหรับหน้าหลัก
export const homeTourSteps: TourStep[] = [
  {
    id: 'home-welcome',
    target: '[data-tour="home-title"]',
    title: 'ยินดีต้อนรับ!',
    content: 'นี่คือระบบตรวจจับการทุจริตการเลือกตั้ง ใช้เครื่องมือทางสถิติระดับสากลในการวิเคราะห์ข้อมูล',
    placement: 'bottom',
  },
  {
    id: 'home-volunteer',
    target: '[data-tour="volunteer-section"]',
    title: 'สำหรับอาสาสมัคร',
    content: 'อาสาสมัครสามารถลงทะเบียนรับรหัส 6 หลัก แล้วส่งผลคะแนนจากหน่วยเลือกตั้งผ่านมือถือได้ทันที',
    placement: 'right',
  },
  {
    id: 'home-admin',
    target: '[data-tour="admin-section"]',
    title: 'สำหรับผู้ดูแลระบบ',
    content: 'Admin สามารถดู Dashboard วิเคราะห์ข้อมูล Real-time และรับการแจ้งเตือนเมื่อพบความผิดปกติ',
    placement: 'left',
  },
  {
    id: 'home-demo',
    target: '[data-tour="demo-button"]',
    title: 'ลองใช้งาน Demo',
    content: 'คลิกที่นี่เพื่อดูตัวอย่างการทำงานของระบบ โดยไม่ต้องลงทะเบียน',
    placement: 'top',
  },
  {
    id: 'home-how-it-works',
    target: '[data-tour="how-it-works"]',
    title: 'วิธีการทำงาน',
    content: 'คลิกที่นี่เพื่อเรียนรู้เกี่ยวกับเครื่องมือวิเคราะห์ทางสถิติที่ระบบใช้ เช่น Klimek Model, Benford\'s Law',
    placement: 'top',
  },
];

// Tour สำหรับ Admin Dashboard
export const adminDashboardTourSteps: TourStep[] = [
  {
    id: 'admin-sidebar',
    target: '[data-tour="admin-sidebar"]',
    title: 'เมนูหลัก',
    content: 'ใช้ Sidebar นี้ในการนำทางไปยังหน้าต่างๆ ของระบบ เมนูจัดกลุ่มตามหมวดหมู่',
    placement: 'right',
  },
  {
    id: 'admin-overview',
    target: '[data-tour="admin-overview"]',
    title: 'ภาพรวม',
    content: 'ดูสรุปข้อมูลทั้งหมดได้ที่นี่ รวมถึงจำนวนหน่วยเลือกตั้ง อาสาสมัคร และการแจ้งเตือน',
    placement: 'bottom',
  },
  {
    id: 'admin-forensics',
    target: '[data-tour="admin-forensics"]',
    title: 'เครื่องมือวิเคราะห์',
    content: 'เมนูนี้รวมเครื่องมือวิเคราะห์ทางสถิติ เช่น Klimek Model, Benford\'s Law, Network Analysis',
    placement: 'right',
  },
  {
    id: 'admin-volunteers',
    target: '[data-tour="admin-volunteers"]',
    title: 'จัดการอาสาสมัคร',
    content: 'ดูรายชื่ออาสาสมัคร สร้างรหัสใหม่ และติดตามสถานะการส่งข้อมูล',
    placement: 'right',
  },
  {
    id: 'admin-alerts',
    target: '[data-tour="admin-alerts"]',
    title: 'การแจ้งเตือน',
    content: 'ระบบจะแจ้งเตือนอัตโนมัติเมื่อพบความผิดปกติ สามารถตั้งค่าช่องทางการแจ้งเตือนได้',
    placement: 'right',
  },
];

// Tour สำหรับหน้าลงทะเบียนอาสาสมัคร
export const volunteerRegisterTourSteps: TourStep[] = [
  {
    id: 'register-form',
    target: '[data-tour="register-form"]',
    title: 'กรอกข้อมูลลงทะเบียน',
    content: 'กรอกชื่อ-นามสกุล เบอร์โทรศัพท์ และ LINE ID (ถ้ามี) เพื่อลงทะเบียนเป็นอาสาสมัคร',
    placement: 'right',
  },
  {
    id: 'register-station',
    target: '[data-tour="register-station"]',
    title: 'เลือกหน่วยเลือกตั้ง',
    content: 'เลือกหน่วยเลือกตั้งที่คุณจะไปประจำ หากยังไม่ทราบสามารถเลือกภายหลังได้',
    placement: 'bottom',
  },
  {
    id: 'register-submit',
    target: '[data-tour="register-submit"]',
    title: 'รับรหัสทันที',
    content: 'กดปุ่มนี้เพื่อรับรหัส 6 หลักสำหรับเข้าสู่ระบบ จดรหัสไว้ให้ดี!',
    placement: 'top',
  },
];

// Tour สำหรับ Volunteer Mobile App
export const volunteerAppTourSteps: TourStep[] = [
  {
    id: 'app-tabs',
    target: '[data-tour="app-tabs"]',
    title: 'เมนูด้านล่าง',
    content: 'ใช้ Tab ด้านล่างในการสลับระหว่างหน้าต่างๆ หรือปัดซ้าย-ขวาเพื่อเปลี่ยนหน้า',
    placement: 'top',
  },
  {
    id: 'app-submit',
    target: '[data-tour="app-submit"]',
    title: 'ส่งผลคะแนน',
    content: 'ถ่ายรูปกระดานนับคะแนน หรือกรอกตัวเลขด้วยตนเอง แล้วกดส่ง',
    placement: 'bottom',
  },
  {
    id: 'app-history',
    target: '[data-tour="app-history"]',
    title: 'ประวัติการส่ง',
    content: 'ดูประวัติการส่งผลคะแนนทั้งหมดของคุณได้ที่นี่',
    placement: 'bottom',
  },
  {
    id: 'app-help',
    target: '[data-tour="app-help"]',
    title: 'คู่มือการใช้งาน',
    content: 'หากมีข้อสงสัย สามารถดูคู่มือการใช้งานได้ที่นี่',
    placement: 'bottom',
  },
];

// Tour สำหรับ Demo Dashboard
export const demoDashboardTourSteps: TourStep[] = [
  {
    id: 'demo-scenario',
    target: '[data-tour="demo-scenario"]',
    title: 'เลือกสถานการณ์',
    content: 'เลือกสถานการณ์จำลองต่างๆ เพื่อดูว่าระบบตรวจจับความผิดปกติอย่างไร',
    placement: 'bottom',
  },
  {
    id: 'demo-charts',
    target: '[data-tour="demo-charts"]',
    title: 'กราฟวิเคราะห์',
    content: 'ดูกราฟเปรียบเทียบคะแนนและสัดส่วนคะแนนของแต่ละผู้สมัคร',
    placement: 'bottom',
  },
  {
    id: 'demo-alerts',
    target: '[data-tour="demo-alerts"]',
    title: 'การแจ้งเตือน',
    content: 'ระบบจะแจ้งเตือนเมื่อพบความผิดปกติ พร้อมระบุประเภทและระดับความรุนแรง',
    placement: 'left',
  },
  {
    id: 'demo-export',
    target: '[data-tour="demo-export"]',
    title: 'Export รายงาน',
    content: 'สามารถ Export รายงานเป็น PDF เพื่อนำไปใช้งานต่อได้',
    placement: 'bottom',
  },
];
