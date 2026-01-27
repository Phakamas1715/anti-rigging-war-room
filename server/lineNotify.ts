// LINE Notify Integration for Anti-Rigging War Room
import axios from 'axios';

const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify';

interface NotifyOptions {
  message: string;
  imageUrl?: string;
  stickerPackageId?: number;
  stickerId?: number;
}

interface AlertData {
  type: 'klimek' | 'pvt_gap' | 'network_hub' | 'benford' | 'spatial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: string;
  value?: number;
  threshold?: number;
}

// Send notification via LINE Notify
export async function sendLineNotify(token: string, options: NotifyOptions): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.append('message', options.message);
    
    if (options.imageUrl) {
      params.append('imageThumbnail', options.imageUrl);
      params.append('imageFullsize', options.imageUrl);
    }
    
    if (options.stickerPackageId && options.stickerId) {
      params.append('stickerPackageId', options.stickerPackageId.toString());
      params.append('stickerId', options.stickerId.toString());
    }

    const response = await axios.post(LINE_NOTIFY_API, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.status === 200;
  } catch (error) {
    console.error('[LINE Notify] Failed to send notification:', error);
    return false;
  }
}

// Format alert message for LINE Notify
export function formatAlertMessage(alert: AlertData): string {
  const severityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  };

  const typeEmoji = {
    klimek: '📊',
    pvt_gap: '⚠️',
    network_hub: '🕸️',
    benford: '🔢',
    spatial: '🗺️'
  };

  const typeName = {
    klimek: 'Klimek Model',
    pvt_gap: 'PVT Gap',
    network_hub: 'Network Hub',
    benford: "Benford's Law",
    spatial: 'Spatial Anomaly'
  };

  let message = `\n${severityEmoji[alert.severity]} ${typeEmoji[alert.type]} ${typeName[alert.type]}\n`;
  message += `━━━━━━━━━━━━━━━\n`;
  message += `📌 ${alert.title}\n`;
  message += `📝 ${alert.description}\n`;
  
  if (alert.location) {
    message += `📍 ${alert.location}\n`;
  }
  
  if (alert.value !== undefined && alert.threshold !== undefined) {
    message += `📈 ค่าที่ตรวจพบ: ${alert.value.toFixed(4)}\n`;
    message += `⚡ เกณฑ์: ${alert.threshold.toFixed(4)}\n`;
  }
  
  message += `━━━━━━━━━━━━━━━\n`;
  message += `🕐 ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`;

  return message;
}

// Send Klimek alert
export async function sendKlimekAlert(token: string, alpha: number, beta: number, province?: string): Promise<boolean> {
  const alert: AlertData = {
    type: 'klimek',
    severity: alpha > 0.1 ? 'critical' : alpha > 0.05 ? 'high' : 'medium',
    title: 'พบสัญญาณการยัดบัตร (Ballot Stuffing)',
    description: `Alpha = ${(alpha * 100).toFixed(2)}% (เกณฑ์ 5%)\nBeta = ${(beta * 100).toFixed(2)}%`,
    location: province,
    value: alpha,
    threshold: 0.05
  };

  return sendLineNotify(token, { message: formatAlertMessage(alert) });
}

// Send PVT Gap alert
export async function sendPVTGapAlert(token: string, gap: number, stationCode: string, ourSum: number, theirSum: number): Promise<boolean> {
  const alert: AlertData = {
    type: 'pvt_gap',
    severity: gap > 0.1 ? 'critical' : gap > 0.05 ? 'high' : 'medium',
    title: 'พบความแตกต่างระหว่างผลนับคู่ขนาน',
    description: `Our Sum: ${ourSum.toLocaleString()}\nTheir Sum: ${theirSum.toLocaleString()}\nGap: ${(gap * 100).toFixed(2)}%`,
    location: `หน่วย ${stationCode}`,
    value: gap,
    threshold: 0.05
  };

  return sendLineNotify(token, { message: formatAlertMessage(alert) });
}

// Send Network Hub alert
export async function sendNetworkHubAlert(token: string, hubId: string, connections: number, totalAmount: number): Promise<boolean> {
  const alert: AlertData = {
    type: 'network_hub',
    severity: connections > 100 ? 'critical' : connections > 50 ? 'high' : 'medium',
    title: 'พบ Hub ที่น่าสงสัยในเครือข่าย',
    description: `จำนวนการเชื่อมต่อ: ${connections} คน\nยอดรวม: ${totalAmount.toLocaleString()} บาท`,
    value: connections,
    threshold: 50
  };

  return sendLineNotify(token, { message: formatAlertMessage(alert) });
}

// Send Benford alert
export async function sendBenfordAlert(token: string, chiSquare: number, pValue: number, location?: string): Promise<boolean> {
  const alert: AlertData = {
    type: 'benford',
    severity: pValue < 0.001 ? 'critical' : pValue < 0.01 ? 'high' : 'medium',
    title: 'พบความผิดปกติตามกฎของ Benford',
    description: `Chi-Square: ${chiSquare.toFixed(2)}\nP-Value: ${pValue.toFixed(6)}`,
    location: location,
    value: pValue,
    threshold: 0.05
  };

  return sendLineNotify(token, { message: formatAlertMessage(alert) });
}

// Send Spatial anomaly alert
export async function sendSpatialAlert(token: string, zScore: number, province: string, neighborAvg: number, provinceValue: number): Promise<boolean> {
  const alert: AlertData = {
    type: 'spatial',
    severity: Math.abs(zScore) > 3 ? 'critical' : Math.abs(zScore) > 2.5 ? 'high' : 'medium',
    title: 'พบความผิดปกติเชิงพื้นที่',
    description: `Z-Score: ${zScore.toFixed(2)}\nค่าจังหวัด: ${(provinceValue * 100).toFixed(2)}%\nค่าเฉลี่ยเพื่อนบ้าน: ${(neighborAvg * 100).toFixed(2)}%`,
    location: province,
    value: Math.abs(zScore),
    threshold: 2.5
  };

  return sendLineNotify(token, { message: formatAlertMessage(alert) });
}

// Test LINE Notify connection
export async function testLineNotify(token: string): Promise<boolean> {
  const message = `\n🔔 ทดสอบการเชื่อมต่อ LINE Notify\n━━━━━━━━━━━━━━━\n✅ การเชื่อมต่อสำเร็จ!\n📱 Anti-Rigging War Room\n🕐 ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`;
  
  return sendLineNotify(token, { message });
}
