// Mock Data for Demo Dashboard
// ข้อมูลจำลองสำหรับแสดงตัวอย่างการทำงานของระบบ

export const DEMO_CANDIDATES = [
  { id: 1, name: "ผู้สมัคร A", party: "พรรค ก", color: "#ef4444" },
  { id: 2, name: "ผู้สมัคร B", party: "พรรค ข", color: "#3b82f6" },
  { id: 3, name: "ผู้สมัคร C", party: "พรรค ค", color: "#22c55e" },
  { id: 4, name: "ผู้สมัคร D", party: "พรรค ง", color: "#f59e0b" },
  { id: 5, name: "ผู้สมัคร E", party: "พรรค จ", color: "#8b5cf6" },
];

export const DEMO_PROVINCES = [
  "กรุงเทพมหานคร", "เชียงใหม่", "ขอนแก่น", "นครราชสีมา", "สงขลา",
  "ชลบุรี", "ภูเก็ต", "เชียงราย", "อุดรธานี", "นครศรีธรรมราช"
];

// สร้างหน่วยเลือกตั้งจำลอง 50 หน่วย
export const generateMockStations = () => {
  const stations = [];
  for (let i = 1; i <= 50; i++) {
    const province = DEMO_PROVINCES[Math.floor(Math.random() * DEMO_PROVINCES.length)];
    stations.push({
      id: i,
      code: `ST${String(i).padStart(4, '0')}`,
      name: `หน่วยเลือกตั้งที่ ${i}`,
      province,
      district: `เขต ${Math.ceil(i / 5)}`,
      registeredVoters: Math.floor(Math.random() * 2000) + 500,
      hasSubmitted: Math.random() > 0.3,
      submittedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 86400000).toISOString() : null,
    });
  }
  return stations;
};

// สร้างผลคะแนนจำลอง
export const generateMockVoteResults = () => {
  const results: Record<number, { crowdsourced: number; official: number }> = {};
  
  DEMO_CANDIDATES.forEach(candidate => {
    const baseVotes = Math.floor(Math.random() * 50000) + 10000;
    // บางครั้งมี gap เพื่อจำลองความผิดปกติ
    const hasGap = Math.random() > 0.7;
    const gap = hasGap ? Math.floor(Math.random() * 5000) - 2500 : 0;
    
    results[candidate.id] = {
      crowdsourced: baseVotes,
      official: baseVotes + gap,
    };
  });
  
  return results;
};

// สร้างการแจ้งเตือนจำลอง
export const DEMO_ALERTS = [
  {
    id: 1,
    alertType: "klimek_anomaly",
    severity: "critical" as const,
    message: "พบค่า Alpha สูงผิดปกติ (0.12) ที่เขต 3 กรุงเทพฯ",
    stationCode: "ST0012",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    resolved: false,
  },
  {
    id: 2,
    alertType: "pvt_gap",
    severity: "high" as const,
    message: "ส่วนต่างคะแนน 2,500 คะแนน ที่หน่วย ST0025",
    stationCode: "ST0025",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    resolved: false,
  },
  {
    id: 3,
    alertType: "benford_violation",
    severity: "medium" as const,
    message: "รูปแบบตัวเลขผิดปกติตาม Benford's Law ที่เขต 7",
    stationCode: "ST0033",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    resolved: false,
  },
  {
    id: 4,
    alertType: "network_hub",
    severity: "high" as const,
    message: "พบ Hub ที่มี Centrality Score สูง (0.85) - นาย ก",
    stationCode: null,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    resolved: true,
  },
  {
    id: 5,
    alertType: "spatial_anomaly",
    severity: "medium" as const,
    message: "Z-Score สูงผิดปกติ (3.2) ที่จังหวัดขอนแก่น",
    stationCode: null,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    resolved: false,
  },
  {
    id: 6,
    alertType: "magic_jump",
    severity: "critical" as const,
    message: "พบการกระโดดของคะแนนผิดปกติ +15,000 ใน 5 นาที",
    stationCode: "ST0041",
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    resolved: false,
  },
];

// สร้าง Timeline การส่งข้อมูลจำลอง
export const generateMockTimeline = () => {
  const timeline = [];
  const now = Date.now();
  
  for (let i = 0; i < 24; i++) {
    const hour = new Date(now - (23 - i) * 3600000);
    timeline.push({
      hour: hour.toISOString(),
      submissions: Math.floor(Math.random() * 20) + (i > 8 && i < 20 ? 30 : 5),
      crowdsourcedVotes: Math.floor(Math.random() * 5000) + 1000,
      officialVotes: Math.floor(Math.random() * 5000) + 1000,
    });
  }
  
  return timeline;
};

// สถิติรวมจำลอง
export const DEMO_STATS = {
  totalStations: 50,
  submittedStations: 35,
  totalAlerts: 6,
  unresolvedAlerts: 4,
  totalVolunteers: 120,
  activeVolunteers: 85,
  coveragePercent: 70,
};

// PVT Summary จำลอง
export const DEMO_PVT_STATS = {
  crowdsourcedCount: 35,
  officialCount: 42,
  crowdsourcedTotal: 125430,
  officialTotal: 128750,
  gap: 3320,
  gapPercent: 2.58,
  matchedStations: 30,
  gapStations: 5,
};

// ข้อมูล Klimek Analysis จำลอง
export const DEMO_KLIMEK_DATA = {
  alpha: 0.08,
  beta: 0.03,
  fraudZone: "moderate",
  suspiciousStations: [
    { code: "ST0012", alpha: 0.12, beta: 0.05 },
    { code: "ST0025", alpha: 0.09, beta: 0.04 },
    { code: "ST0033", alpha: 0.11, beta: 0.02 },
  ],
};

// ข้อมูล Benford Analysis จำลอง
export const DEMO_BENFORD_DATA = {
  chiSquare: 15.2,
  pValue: 0.055,
  isSignificant: false,
  digitDistribution: [
    { digit: 0, expected: 11.97, observed: 12.5 },
    { digit: 1, expected: 11.39, observed: 10.8 },
    { digit: 2, expected: 10.88, observed: 11.2 },
    { digit: 3, expected: 10.43, observed: 9.5 },
    { digit: 4, expected: 10.03, observed: 10.1 },
    { digit: 5, expected: 9.67, observed: 9.8 },
    { digit: 6, expected: 9.34, observed: 10.5 },
    { digit: 7, expected: 9.04, observed: 8.2 },
    { digit: 8, expected: 8.76, observed: 9.1 },
    { digit: 9, expected: 8.50, observed: 8.3 },
  ],
};

// Province coverage จำลอง
export const DEMO_PROVINCE_COVERAGE = DEMO_PROVINCES.map(province => ({
  province,
  totalStations: Math.floor(Math.random() * 10) + 3,
  submittedStations: Math.floor(Math.random() * 8) + 1,
  coverage: Math.floor(Math.random() * 40) + 50,
  avgGap: (Math.random() * 5 - 2.5).toFixed(2),
}));
