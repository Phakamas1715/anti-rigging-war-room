/**
 * Test OCR with real Thai election board image
 */
import fs from 'fs';
import path from 'path';

// Read the base64 image
const base64Data = fs.readFileSync('/tmp/test_image_base64.txt', 'utf-8');
const imageBase64 = `data:image/jpeg;base64,${base64Data}`;

// Import the OCR function dynamically
const { analyzeWithGemini, validateOcrResult } = await import('./server/geminiOcr.ts');

console.log('='.repeat(60));
console.log('ทดสอบ OCR กับรูปป้ายประกาศผลเลือกตั้งจริง');
console.log('='.repeat(60));
console.log('');

try {
  console.log('กำลังวิเคราะห์รูปภาพ...');
  const startTime = Date.now();
  
  const result = await analyzeWithGemini(imageBase64);
  
  const endTime = Date.now();
  console.log(`เวลาที่ใช้: ${endTime - startTime} ms`);
  console.log('');
  
  if (result.success) {
    console.log('✅ OCR สำเร็จ!');
    console.log('');
    console.log('ข้อมูลที่อ่านได้:');
    console.log('-'.repeat(40));
    console.log(`รหัสหน่วย: ${result.stationCode || 'ไม่พบ'}`);
    console.log(`จำนวนผู้มีสิทธิ์: ${result.totalVoters || 'ไม่พบ'}`);
    console.log(`จำนวนบัตรที่ใช้: ${result.totalBallots || 'ไม่พบ'}`);
    console.log(`บัตรเสีย: ${result.spoiledBallots || 'ไม่พบ'}`);
    console.log('');
    console.log('คะแนนผู้สมัคร:');
    if (result.votes && result.votes.length > 0) {
      result.votes.forEach((v, i) => {
        console.log(`  ${i+1}. ${v.candidateName} (หมายเลข ${v.candidateNumber}): ${v.voteCount} คะแนน (confidence: ${v.confidence}%)`);
      });
    } else {
      console.log('  ไม่พบข้อมูลคะแนน');
    }
    console.log('');
    console.log('ข้อความดิบ:');
    console.log(result.rawText || 'ไม่มี');
    
    // Validate
    console.log('');
    console.log('='.repeat(40));
    console.log('ผลการตรวจสอบความถูกต้อง:');
    const validation = validateOcrResult(result);
    console.log(`สถานะ: ${validation.isValid ? '✅ ถูกต้อง' : '⚠️ มีคำเตือน'}`);
    if (validation.warnings.length > 0) {
      console.log('คำเตือน:');
      validation.warnings.forEach(w => console.log(`  - ${w}`));
    }
  } else {
    console.log('❌ OCR ล้มเหลว');
    console.log(`Error: ${result.error}`);
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('ข้อมูลจริงจากรูป (สำหรับเปรียบเทียบ):');
  console.log('-'.repeat(40));
  console.log('ผู้สมัคร: นายไพโรจน์ รัตนกร (หมายเลข 1)');
  console.log('คะแนนแต่ละหน่วย: 45, 302, 325, 197, 98, 383');
  console.log('รวม: 1,350 คะแนน');
  console.log('ผู้มีสิทธิ์: 2,024 คน');
  console.log('ผู้มาใช้สิทธิ์: 1,481 คน (94.07%)');
  console.log('บัตรดี: 1,350 บัตร (91.15%)');
  console.log('บัตรเสีย: 87 บัตร (5.87%)');
  console.log('='.repeat(60));
  
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
