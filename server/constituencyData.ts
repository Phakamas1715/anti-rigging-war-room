/**
 * Constituency Data Module
 * ข้อมูลเขตเลือกตั้ง สส. แบบแบ่งเขต ปี 2569
 * แหล่งข้อมูล: สำนักงานคณะกรรมการการเลือกตั้ง (กกต.), Thethaiger, Wikipedia
 */

export interface Candidate {
  number: number;
  name: string;
  party: string;
  votes2566?: number;
  votePercent2566?: number;
}

export interface Constituency {
  province: string;
  provinceCode: string;
  zone: number;
  totalZones: number;
  coverage: string[];
  candidates: Candidate[];
  stats2566?: {
    registeredVoters: number;
    turnout: number;
    turnoutPercent: number;
    validVotes: number;
    invalidVotes: number;
    invalidPercent: number;
  };
}

// ============ ยโสธร (3 เขต) ============
const YASOTHON_CONSTITUENCIES: Constituency[] = [
  {
    province: "ยโสธร",
    provinceCode: "35",
    zone: 1,
    totalZones: 3,
    coverage: [
      "อ.เมืองยโสธร",
      "อ.ทรายมูล",
      "อ.ป่าติ้ว (เฉพาะ ต.ศรีฐาน และ ต.กระจาย)",
      "อ.คำเขื่อนแก้ว (เฉพาะ ต.ทุ่งมน)"
    ],
    candidates: [
      { number: 1, name: "นายเนรมิต จันทร์ทอง", party: "ประชาธิปัตย์" },
      { number: 2, name: "นางสุภาพร สลับศรี", party: "ภูมิใจไทย" },
      { number: 3, name: "นางสาววชิราภรณ์ ชายทวีป", party: "ประชาชน" },
      { number: 4, name: "นายวีระศักดิ์ โคตรสมบัติ", party: "เพื่อไทย" },
      { number: 5, name: "นายสราวุธ จะกะนอง", party: "ประชาธิปไตยใหม่" },
      { number: 6, name: "นายนิติธร จันทรบุตร", party: "ไทยก้าวใหม่" },
      { number: 7, name: "นายหวาง วงษ์ศรีแก้ว", party: "เศรษฐกิจ" },
    ],
    stats2566: {
      registeredVoters: 145320,
      turnout: 100210,
      turnoutPercent: 68.95,
      validVotes: 97180,
      invalidVotes: 2850,
      invalidPercent: 2.84,
    },
  },
  {
    province: "ยโสธร",
    provinceCode: "35",
    zone: 2,
    totalZones: 3,
    coverage: [
      "อ.คำเขื่อนแก้ว (ยกเว้น ต.ทุ่งมน)",
      "อ.มหาชนะชัย",
      "อ.ค้อวัง",
      "อ.ป่าติ้ว (ยกเว้น ต.ศรีฐาน และ ต.กระจาย)",
      "อ.ไทยเจริญ (เฉพาะ ต.น้ำคำ และ ต.คำไผ่)"
    ],
    candidates: [
      { number: 1, name: "นายบุญแก้ว สมวงศ์", party: "เพื่อไทย", votes2566: 44851, votePercent2566: 47.22 },
      { number: 2, name: "นายธนู ว่องไวตระกูล", party: "ท้องที่ไทย" },
      { number: 3, name: "นายวรายุทธ จงอักษร", party: "ภูมิใจไทย", votes2566: 34581, votePercent2566: 36.63 },
      { number: 4, name: "นางสาวชริสา แพงมี", party: "ไทยก้าวใหม่" },
      { number: 5, name: "นายพงศธร สุภโกศล", party: "ประชาชน" },
      { number: 6, name: "นายอนันต์ หลอดคำ", party: "ประชาธิปไตยใหม่" },
      { number: 7, name: "นายกริชเพชร พลศรี", party: "ประชาธิปัตย์" },
      { number: 8, name: "ดาบตำรวจ สิทธิชัย ทองมูล", party: "พลังประชารัฐ" },
      { number: 9, name: "นายสิงห์มณี กุบแก้ว", party: "เศรษฐกิจ" },
    ],
    stats2566: {
      registeredVoters: 141902,
      turnout: 98432,
      turnoutPercent: 69.37,
      validVotes: 95205,
      invalidVotes: 2823,
      invalidPercent: 2.86,
    },
  },
  {
    province: "ยโสธร",
    provinceCode: "35",
    zone: 3,
    totalZones: 3,
    coverage: [
      "อ.เลิงนกทา",
      "อ.กุดชุม",
      "อ.ไทยเจริญ (ยกเว้น ต.น้ำคำ และ ต.คำไผ่)"
    ],
    candidates: [
      { number: 1, name: "นายพิเชษฐ์ กุมารสิทธิ์", party: "เพื่อไทย" },
      { number: 2, name: "นายธนพัฒน์ ศรีชนะ", party: "ภูมิใจไทย" },
      { number: 3, name: "นายสรวิศ เดชเสน", party: "ประชาชน" },
      { number: 4, name: "นายมงคล ชื่นตา", party: "กล้าธรรม" },
      { number: 5, name: "นางกฤตลดาณัช เศิกศิริ", party: "ประชาธิปัตย์" },
      { number: 6, name: "นางวิภารัตย์ บุญกอง", party: "ประชาธิปไตยใหม่" },
      { number: 7, name: "นางสาวเสาวภาคย์ อินทนนท์", party: "เศรษฐกิจ" },
      { number: 8, name: "นายธนกร ไชยกุล", party: "พลังประชารัฐ" },
    ],
    stats2566: {
      registeredVoters: 138450,
      turnout: 95780,
      turnoutPercent: 69.18,
      validVotes: 93120,
      invalidVotes: 2480,
      invalidPercent: 2.59,
    },
  },
];

// ============ All Constituencies Registry ============
const ALL_CONSTITUENCIES: Constituency[] = [
  ...YASOTHON_CONSTITUENCIES,
];

// ============ Province Zone Count ============
export const PROVINCE_ZONE_COUNTS: Record<string, number> = {
  "กรุงเทพมหานคร": 33,
  "กระบี่": 2,
  "กาญจนบุรี": 5,
  "กาฬสินธุ์": 5,
  "กำแพงเพชร": 3,
  "ขอนแก่น": 11,
  "จันทบุรี": 2,
  "ฉะเชิงเทรา": 4,
  "ชลบุรี": 8,
  "ชัยนาท": 1,
  "ชัยภูมิ": 5,
  "ชุมพร": 2,
  "เชียงราย": 7,
  "เชียงใหม่": 9,
  "ตรัง": 3,
  "ตราด": 1,
  "ตาก": 2,
  "นครนายก": 1,
  "นครปฐม": 5,
  "นครพนม": 4,
  "นครราชสีมา": 15,
  "นครศรีธรรมราช": 9,
  "นครสวรรค์": 5,
  "นนทบุรี": 7,
  "นราธิวาส": 4,
  "น่าน": 2,
  "บึงกาฬ": 2,
  "บุรีรัมย์": 9,
  "ปทุมธานี": 7,
  "ประจวบคีรีขันธ์": 2,
  "ปราจีนบุรี": 2,
  "ปัตตานี": 4,
  "พระนครศรีอยุธยา": 4,
  "พะเยา": 2,
  "พังงา": 1,
  "พัทลุง": 2,
  "พิจิตร": 2,
  "พิษณุโลก": 4,
  "เพชรบุรี": 2,
  "เพชรบูรณ์": 4,
  "แพร่": 2,
  "ภูเก็ต": 2,
  "มหาสารคาม": 5,
  "มุกดาหาร": 2,
  "แม่ฮ่องสอน": 1,
  "ยะลา": 3,
  "ยโสธร": 3,
  "ร้อยเอ็ด": 7,
  "ระนอง": 1,
  "ระยอง": 4,
  "ราชบุรี": 5,
  "ลพบุรี": 3,
  "ลำปาง": 3,
  "ลำพูน": 2,
  "เลย": 3,
  "ศรีสะเกษ": 8,
  "สกลนคร": 7,
  "สงขลา": 8,
  "สตูล": 1,
  "สมุทรปราการ": 8,
  "สมุทรสงคราม": 1,
  "สมุทรสาคร": 3,
  "สระแก้ว": 2,
  "สระบุรี": 3,
  "สิงห์บุรี": 1,
  "สุโขทัย": 3,
  "สุพรรณบุรี": 4,
  "สุราษฎร์ธานี": 6,
  "สุรินทร์": 7,
  "หนองคาย": 2,
  "หนองบัวลำภู": 2,
  "อ่างทอง": 1,
  "อุดรธานี": 9,
  "อุตรดิตถ์": 2,
  "อุทัยธานี": 1,
  "อุบลราชธานี": 10,
  "อำนาจเจริญ": 2,
};

// ============ Query Functions ============

export function getConstituency(province: string, zone: number): Constituency | null {
  return ALL_CONSTITUENCIES.find(
    c => c.province === province && c.zone === zone
  ) || null;
}

export function getConstituenciesByProvince(province: string): Constituency[] {
  return ALL_CONSTITUENCIES.filter(c => c.province === province);
}

export function getAllConstituencies(): Constituency[] {
  return ALL_CONSTITUENCIES;
}

export function getProvinceZoneCount(province: string): number {
  return PROVINCE_ZONE_COUNTS[province] || 0;
}

export function searchConstituencies(query: string): Constituency[] {
  const q = query.toLowerCase();
  return ALL_CONSTITUENCIES.filter(c => 
    c.province.includes(q) ||
    c.candidates.some(cand => cand.name.includes(q) || cand.party.includes(q)) ||
    c.coverage.some(area => area.includes(q))
  );
}

// Get all provinces that have constituency data
export function getProvincesWithData(): string[] {
  return Array.from(new Set(ALL_CONSTITUENCIES.map(c => c.province)));
}
