// Mock Data for Demo Dashboard
// ข้อมูลจำลองสำหรับแสดงตัวอย่างการทำงานของระบบ

export type ScenarioType = 'normal' | 'mild_fraud' | 'severe_fraud';

export const SCENARIOS = {
  normal: {
    id: 'normal',
    name: 'การเลือกตั้งปกติ',
    description: 'ไม่พบความผิดปกติ ผลคะแนนตรงกัน',
    icon: '✅',
    color: 'green',
  },
  mild_fraud: {
    id: 'mild_fraud',
    name: 'มีการโกง 5%',
    description: 'พบความผิดปกติเล็กน้อย ส่วนต่างประมาณ 5%',
    icon: '⚠️',
    color: 'yellow',
  },
  severe_fraud: {
    id: 'severe_fraud',
    name: 'มีการโกงรุนแรง',
    description: 'พบความผิดปกติรุนแรง ส่วนต่างมากกว่า 15%',
    icon: '🚨',
    color: 'red',
  },
};

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

// สร้างผลคะแนนจำลองตาม Scenario
export const generateMockVoteResults = (scenario: ScenarioType = 'normal') => {
  const results: Record<number, { crowdsourced: number; official: number }> = {};
  
  const fraudMultiplier = scenario === 'normal' ? 0 : scenario === 'mild_fraud' ? 0.05 : 0.20;
  
  DEMO_CANDIDATES.forEach((candidate, index) => {
    const baseVotes = Math.floor(Math.random() * 50000) + 10000;
    
    let gap = 0;
    if (scenario !== 'normal') {
      // ผู้สมัครคนแรกได้คะแนนเพิ่ม (ถูกโกงให้)
      if (index === 0) {
        gap = Math.floor(baseVotes * fraudMultiplier);
      } else if (index === 1) {
        // ผู้สมัครคนที่สองถูกขโมยคะแนน
        gap = -Math.floor(baseVotes * fraudMultiplier * 0.5);
      }
    }
    
    results[candidate.id] = {
      crowdsourced: baseVotes,
      official: baseVotes + gap,
    };
  });
  
  return results;
};

// สร้างการแจ้งเตือนจำลองตาม Scenario
export const generateMockAlerts = (scenario: ScenarioType = 'normal') => {
  const baseAlerts = [
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
  
  if (scenario === 'normal') {
    return baseAlerts.slice(0, 2).map(a => ({ ...a, resolved: true, severity: 'low' as const }));
  } else if (scenario === 'mild_fraud') {
    return baseAlerts.slice(0, 4);
  }
  
  // severe_fraud - add more critical alerts
  return [
    ...baseAlerts,
    {
      id: 7,
      alertType: "mass_fraud",
      severity: "critical" as const,
      message: "พบรูปแบบการโกงเป็นระบบใน 15 หน่วยเลือกตั้ง",
      stationCode: null,
      createdAt: new Date(Date.now() - 900000).toISOString(),
      resolved: false,
    },
    {
      id: 8,
      alertType: "ballot_stuffing",
      severity: "critical" as const,
      message: "ตรวจพบการยัดบัตรลงคะแนน - คะแนนเกินจำนวนผู้มีสิทธิ์",
      stationCode: "ST0008",
      createdAt: new Date(Date.now() - 600000).toISOString(),
      resolved: false,
    },
  ];
};

// Legacy export for backward compatibility
export const DEMO_ALERTS = generateMockAlerts('mild_fraud');

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

// สถิติรวมจำลองตาม Scenario
export const generateMockStats = (scenario: ScenarioType = 'normal') => {
  const base = {
    totalStations: 50,
    submittedStations: 35,
    totalVolunteers: 120,
    activeVolunteers: 85,
    coveragePercent: 70,
  };
  
  if (scenario === 'normal') {
    return { ...base, totalAlerts: 2, unresolvedAlerts: 0 };
  } else if (scenario === 'mild_fraud') {
    return { ...base, totalAlerts: 6, unresolvedAlerts: 4 };
  }
  return { ...base, totalAlerts: 12, unresolvedAlerts: 10 };
};

// Legacy export
export const DEMO_STATS = generateMockStats('mild_fraud');

// PVT Summary จำลองตาม Scenario
export const generateMockPvtStats = (scenario: ScenarioType = 'normal') => {
  const base = {
    crowdsourcedCount: 35,
    officialCount: 42,
    crowdsourcedTotal: 125430,
    matchedStations: 30,
  };
  
  if (scenario === 'normal') {
    return {
      ...base,
      officialTotal: 125680,
      gap: 250,
      gapPercent: 0.2,
      gapStations: 2,
    };
  } else if (scenario === 'mild_fraud') {
    return {
      ...base,
      officialTotal: 131702,
      gap: 6272,
      gapPercent: 5.0,
      gapStations: 8,
    };
  }
  return {
    ...base,
    officialTotal: 144245,
    gap: 18815,
    gapPercent: 15.0,
    gapStations: 20,
  };
};

// Legacy export
export const DEMO_PVT_STATS = generateMockPvtStats('mild_fraud');

// ข้อมูล Klimek Analysis จำลองตาม Scenario
export const generateMockKlimekData = (scenario: ScenarioType = 'normal') => {
  if (scenario === 'normal') {
    return {
      alpha: 0.02,
      beta: 0.01,
      fraudZone: "clean",
      suspiciousStations: [],
    };
  } else if (scenario === 'mild_fraud') {
    return {
      alpha: 0.08,
      beta: 0.03,
      fraudZone: "moderate",
      suspiciousStations: [
        { code: "ST0012", alpha: 0.12, beta: 0.05 },
        { code: "ST0025", alpha: 0.09, beta: 0.04 },
        { code: "ST0033", alpha: 0.11, beta: 0.02 },
      ],
    };
  }
  return {
    alpha: 0.22,
    beta: 0.15,
    fraudZone: "severe",
    suspiciousStations: [
      { code: "ST0012", alpha: 0.35, beta: 0.18 },
      { code: "ST0025", alpha: 0.28, beta: 0.22 },
      { code: "ST0033", alpha: 0.31, beta: 0.16 },
      { code: "ST0008", alpha: 0.42, beta: 0.25 },
      { code: "ST0041", alpha: 0.38, beta: 0.20 },
      { code: "ST0015", alpha: 0.29, beta: 0.19 },
    ],
  };
};

// Legacy export
export const DEMO_KLIMEK_DATA = generateMockKlimekData('mild_fraud');

// ข้อมูล Benford Analysis จำลองตาม Scenario
export const generateMockBenfordData = (scenario: ScenarioType = 'normal') => {
  const baseDistribution = [
    { digit: 0, expected: 11.97 },
    { digit: 1, expected: 11.39 },
    { digit: 2, expected: 10.88 },
    { digit: 3, expected: 10.43 },
    { digit: 4, expected: 10.03 },
    { digit: 5, expected: 9.67 },
    { digit: 6, expected: 9.34 },
    { digit: 7, expected: 9.04 },
    { digit: 8, expected: 8.76 },
    { digit: 9, expected: 8.50 },
  ];
  
  if (scenario === 'normal') {
    return {
      chiSquare: 5.2,
      pValue: 0.82,
      isSignificant: false,
      digitDistribution: baseDistribution.map(d => ({
        ...d,
        observed: d.expected + (Math.random() - 0.5) * 1,
      })),
    };
  } else if (scenario === 'mild_fraud') {
    return {
      chiSquare: 15.2,
      pValue: 0.055,
      isSignificant: false,
      digitDistribution: baseDistribution.map(d => ({
        ...d,
        observed: d.expected + (Math.random() - 0.5) * 3,
      })),
    };
  }
  return {
    chiSquare: 42.8,
    pValue: 0.0001,
    isSignificant: true,
    digitDistribution: baseDistribution.map((d, i) => ({
      ...d,
      observed: i === 1 ? d.expected + 8 : d.expected + (Math.random() - 0.5) * 5,
    })),
  };
};

// Legacy export
export const DEMO_BENFORD_DATA = generateMockBenfordData('mild_fraud');

// Province coverage จำลอง
export const DEMO_PROVINCE_COVERAGE = DEMO_PROVINCES.map(province => ({
  province,
  totalStations: Math.floor(Math.random() * 10) + 3,
  submittedStations: Math.floor(Math.random() * 8) + 1,
  coverage: Math.floor(Math.random() * 40) + 50,
  avgGap: (Math.random() * 5 - 2.5).toFixed(2),
}));

// Feature demos for public page
export const DEMO_FEATURES = [
  {
    id: 'pvt',
    title: 'Parallel Vote Tabulation (PVT)',
    description: 'เปรียบเทียบผลคะแนนจากอาสาสมัครกับผลทางการแบบ Real-time',
    icon: 'BarChart3',
    color: 'blue',
    demoData: {
      crowdsourced: 125430,
      official: 128750,
      gap: 3320,
      gapPercent: 2.58,
    },
  },
  {
    id: 'klimek',
    title: 'Klimek Model Analysis',
    description: 'ตรวจจับการยัดบัตร (Vote Stuffing) และการขโมยคะแนน (Vote Stealing)',
    icon: 'Activity',
    color: 'red',
    demoData: {
      alpha: 0.08,
      beta: 0.03,
      suspiciousCount: 3,
    },
  },
  {
    id: 'benford',
    title: "Benford's Law Analysis",
    description: 'ตรวจสอบรูปแบบตัวเลขตามกฎทางสถิติของ Benford',
    icon: 'FileText',
    color: 'purple',
    demoData: {
      chiSquare: 15.2,
      pValue: 0.055,
      isSignificant: false,
    },
  },
  {
    id: 'network',
    title: 'Social Network Analysis',
    description: 'วิเคราะห์เครือข่ายความสัมพันธ์และตรวจจับ Hub ที่ผิดปกติ',
    icon: 'Network',
    color: 'green',
    demoData: {
      nodes: 150,
      edges: 420,
      hubsDetected: 3,
    },
  },
  {
    id: 'spatial',
    title: 'Spatial Analysis',
    description: 'วิเคราะห์ความผิดปกติเชิงพื้นที่และแสดงบนแผนที่',
    icon: 'Map',
    color: 'orange',
    demoData: {
      hotspots: 5,
      avgZScore: 2.1,
    },
  },
  {
    id: 'alerts',
    title: 'Real-time Alerts',
    description: 'ระบบแจ้งเตือนอัตโนมัติเมื่อพบความผิดปกติ',
    icon: 'AlertTriangle',
    color: 'yellow',
    demoData: {
      totalAlerts: 6,
      critical: 2,
      resolved: 2,
    },
  },
];
