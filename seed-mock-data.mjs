import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { ocrResults } from "./drizzle/schema.ts";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "anti_rigging",
});

const db = drizzle(connection);

const mockData = {
  stationCode: "YST-001",
  province: "ยโสธร",
  constituency: "2",
  documentType: "ss5_11",
  imageUrl: "/home/ubuntu/upload/IMG_6585(3).jpeg",
  rawText: "ส.ส.5/11 เขต 2 ยโสธร",
  votesData: [
    { candidateNumber: 1, candidateName: "บายบูญแก้ว สมวงศ์", voteCount: 200, confidence: 95 },
    { candidateNumber: 2, candidateName: "บายบุญ ร่องโครงฐูล", voteCount: 1, confidence: 85 },
    { candidateNumber: 3, candidateName: "บายวรายุทธ จงจิษณ์", voteCount: 65, confidence: 90 },
    { candidateNumber: 4, candidateName: "บายสวนวิสา แพงมี", voteCount: 1, confidence: 80 },
    { candidateNumber: 5, candidateName: "บายพงษ์ศรอ สุกโศกล", voteCount: 14, confidence: 88 },
    { candidateNumber: 6, candidateName: "บายอนันต์ หลออคำ", voteCount: 0, confidence: 92 },
    { candidateNumber: 7, candidateName: "บายกริชเพชร พลศรี", voteCount: 1, confidence: 85 },
    { candidateNumber: 8, candidateName: "คำศรัวง สิทธิชัย ทองบูล พลัดประวัฒร์", voteCount: 0, confidence: 90 },
    { candidateNumber: 9, candidateName: "บายสิงห์เหมิน ภูมิก้าว", voteCount: 2, confidence: 87 }
  ],
  goodBallots: 284,
  spoiledBallots: 5,
  overallConfidence: 88,
  extractedAt: new Date(),
  provider: "manual-test"
};

try {
  console.log("🔄 Inserting mock data...");
  const result = await db.insert(ocrResults).values(mockData);
  console.log("✅ Mock data inserted successfully");
  process.exit(0);
} catch (error) {
  console.error("❌ Error inserting mock data:", error);
  process.exit(1);
}
