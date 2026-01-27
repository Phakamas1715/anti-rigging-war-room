// Discord Webhook Integration for Anti-Rigging War Room
import axios from 'axios';

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
  thumbnail?: { url: string };
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

// Discord color codes
const SEVERITY_COLORS = {
  low: 0x22c55e,      // Green
  medium: 0xeab308,   // Yellow
  high: 0xf97316,     // Orange
  critical: 0xef4444, // Red
};

const TYPE_EMOJI = {
  klimek: '📊',
  pvt_gap: '⚠️',
  network_hub: '🕸️',
  benford: '🔢',
  spatial: '🗺️',
};

const TYPE_NAME = {
  klimek: 'Klimek Model Analysis',
  pvt_gap: 'PVT Gap Detection',
  network_hub: 'Network Hub Detection',
  benford: "Benford's Law Analysis",
  spatial: 'Spatial Anomaly Detection',
};

// Send message to Discord webhook
export async function sendDiscordWebhook(webhookUrl: string, content: string, embeds?: DiscordEmbed[]): Promise<boolean> {
  try {
    const response = await axios.post(webhookUrl, {
      content,
      embeds,
      username: 'Anti-Rigging War Room',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/2621/2621303.png',
    });

    return response.status === 204 || response.status === 200;
  } catch (error) {
    console.error('[Discord] Failed to send webhook:', error);
    return false;
  }
}

// Create embed for alert
export function createAlertEmbed(alert: AlertData): DiscordEmbed {
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  if (alert.location) {
    fields.push({ name: '📍 สถานที่', value: alert.location, inline: true });
  }

  if (alert.value !== undefined) {
    fields.push({ name: '📈 ค่าที่ตรวจพบ', value: alert.value.toFixed(4), inline: true });
  }

  if (alert.threshold !== undefined) {
    fields.push({ name: '⚡ เกณฑ์', value: alert.threshold.toFixed(4), inline: true });
  }

  return {
    title: `${TYPE_EMOJI[alert.type]} ${TYPE_NAME[alert.type]}`,
    description: `**${alert.title}**\n\n${alert.description}`,
    color: SEVERITY_COLORS[alert.severity],
    fields,
    footer: { text: 'Anti-Rigging War Room • Election Forensics System' },
    timestamp: new Date().toISOString(),
  };
}

// Send Klimek alert
export async function sendKlimekAlert(webhookUrl: string, alpha: number, beta: number, province?: string): Promise<boolean> {
  const severity = alpha > 0.1 ? 'critical' : alpha > 0.05 ? 'high' : 'medium';
  
  const embed = createAlertEmbed({
    type: 'klimek',
    severity,
    title: '🚨 พบสัญญาณการยัดบัตร (Ballot Stuffing)',
    description: `**Alpha (Vote Stuffing):** ${(alpha * 100).toFixed(2)}%\n**Beta (Vote Stealing):** ${(beta * 100).toFixed(2)}%\n\nหน่วยเลือกตั้งที่มี Turnout > 85% และ Vote Share > 85% สูงกว่าเกณฑ์ปกติ`,
    location: province,
    value: alpha,
    threshold: 0.05,
  });

  const content = severity === 'critical' 
    ? '🔴 **CRITICAL ALERT** - พบความผิดปกติรุนแรง! @everyone'
    : severity === 'high'
    ? '🟠 **HIGH ALERT** - พบความผิดปกติ!'
    : '🟡 **MEDIUM ALERT** - พบสัญญาณที่ต้องตรวจสอบ';

  return sendDiscordWebhook(webhookUrl, content, [embed]);
}

// Send PVT Gap alert
export async function sendPVTGapAlert(
  webhookUrl: string, 
  gap: number, 
  stationCode: string, 
  ourSum: number, 
  theirSum: number
): Promise<boolean> {
  const severity = gap > 0.1 ? 'critical' : gap > 0.05 ? 'high' : 'medium';
  
  const embed = createAlertEmbed({
    type: 'pvt_gap',
    severity,
    title: '⚠️ พบความแตกต่างระหว่างผลนับคู่ขนาน',
    description: `**Our Sum (ผลจากอาสาสมัคร):** ${ourSum.toLocaleString()} คะแนน\n**Their Sum (ผลทางการ):** ${theirSum.toLocaleString()} คะแนน\n**Gap:** ${(gap * 100).toFixed(2)}%`,
    location: `หน่วยเลือกตั้ง ${stationCode}`,
    value: gap,
    threshold: 0.05,
  });

  const content = severity === 'critical' 
    ? '🔴 **CRITICAL ALERT** - พบ Gap รุนแรง! @everyone'
    : '🟠 **PVT ALERT** - พบความแตกต่างในผลนับคะแนน';

  return sendDiscordWebhook(webhookUrl, content, [embed]);
}

// Send Network Hub alert
export async function sendNetworkHubAlert(
  webhookUrl: string, 
  hubId: string, 
  connections: number, 
  totalAmount: number
): Promise<boolean> {
  const severity = connections > 100 ? 'critical' : connections > 50 ? 'high' : 'medium';
  
  const embed = createAlertEmbed({
    type: 'network_hub',
    severity,
    title: '🕸️ พบ Hub ที่น่าสงสัยในเครือข่าย',
    description: `**Hub ID:** ${hubId}\n**จำนวนการเชื่อมต่อ:** ${connections} คน\n**ยอดรวมธุรกรรม:** ${totalAmount.toLocaleString()} บาท\n\nอาจเป็นหัวคะแนนที่กำลังจ่ายเงินซื้อเสียง`,
    value: connections,
    threshold: 50,
  });

  const content = severity === 'critical' 
    ? '🔴 **CRITICAL ALERT** - พบหัวคะแนนรายใหญ่! @everyone'
    : '🟠 **NETWORK ALERT** - พบ Hub ที่น่าสงสัย';

  return sendDiscordWebhook(webhookUrl, content, [embed]);
}

// Send Benford alert
export async function sendBenfordAlert(
  webhookUrl: string, 
  chiSquare: number, 
  pValue: number, 
  location?: string
): Promise<boolean> {
  const severity = pValue < 0.001 ? 'critical' : pValue < 0.01 ? 'high' : 'medium';
  
  const embed = createAlertEmbed({
    type: 'benford',
    severity,
    title: '🔢 พบความผิดปกติตามกฎของ Benford',
    description: `**Chi-Square:** ${chiSquare.toFixed(2)}\n**P-Value:** ${pValue.toFixed(6)}\n\nการกระจายตัวของตัวเลขไม่เป็นไปตามธรรมชาติ อาจมีการแต่งตัวเลข`,
    location,
    value: pValue,
    threshold: 0.05,
  });

  const content = severity === 'critical' 
    ? '🔴 **CRITICAL ALERT** - พบการแต่งตัวเลข! @everyone'
    : '🟠 **BENFORD ALERT** - พบความผิดปกติในตัวเลข';

  return sendDiscordWebhook(webhookUrl, content, [embed]);
}

// Send Spatial anomaly alert
export async function sendSpatialAlert(
  webhookUrl: string, 
  zScore: number, 
  province: string, 
  neighborAvg: number, 
  provinceValue: number
): Promise<boolean> {
  const severity = Math.abs(zScore) > 3 ? 'critical' : Math.abs(zScore) > 2.5 ? 'high' : 'medium';
  
  const embed = createAlertEmbed({
    type: 'spatial',
    severity,
    title: '🗺️ พบความผิดปกติเชิงพื้นที่',
    description: `**Z-Score:** ${zScore.toFixed(2)}\n**ค่าจังหวัด:** ${(provinceValue * 100).toFixed(2)}%\n**ค่าเฉลี่ยเพื่อนบ้าน:** ${(neighborAvg * 100).toFixed(2)}%\n\nจังหวัดนี้มีค่าผิดปกติเมื่อเทียบกับจังหวัดข้างเคียง`,
    location: province,
    value: Math.abs(zScore),
    threshold: 2.5,
  });

  const content = severity === 'critical' 
    ? '🔴 **CRITICAL ALERT** - พบความผิดปกติเชิงพื้นที่รุนแรง! @everyone'
    : '🟠 **SPATIAL ALERT** - พบความผิดปกติเชิงพื้นที่';

  return sendDiscordWebhook(webhookUrl, content, [embed]);
}

// Test Discord webhook connection
export async function testDiscordWebhook(webhookUrl: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '🔔 ทดสอบการเชื่อมต่อ Discord Webhook',
    description: '✅ **การเชื่อมต่อสำเร็จ!**\n\nระบบ Anti-Rigging War Room พร้อมส่งการแจ้งเตือนผ่าน Discord แล้ว',
    color: 0x22c55e,
    fields: [
      { name: '📱 ระบบ', value: 'Anti-Rigging War Room', inline: true },
      { name: '🔧 สถานะ', value: 'พร้อมใช้งาน', inline: true },
    ],
    footer: { text: 'Election Forensics System' },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook(webhookUrl, '🔔 **ทดสอบการเชื่อมต่อ**', [embed]);
}

// Send daily summary
export async function sendDailySummary(
  webhookUrl: string,
  stats: {
    totalStations: number;
    analyzedStations: number;
    alertsToday: number;
    criticalAlerts: number;
    klimekAlpha: number;
    pvtGap: number;
  }
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '📊 รายงานสรุปประจำวัน',
    description: `สรุปผลการตรวจสอบการเลือกตั้งประจำวันที่ ${new Date().toLocaleDateString('th-TH')}`,
    color: stats.criticalAlerts > 0 ? 0xef4444 : 0x22c55e,
    fields: [
      { name: '🏢 หน่วยเลือกตั้งทั้งหมด', value: stats.totalStations.toLocaleString(), inline: true },
      { name: '✅ วิเคราะห์แล้ว', value: stats.analyzedStations.toLocaleString(), inline: true },
      { name: '⚠️ การแจ้งเตือนวันนี้', value: stats.alertsToday.toString(), inline: true },
      { name: '🔴 Critical Alerts', value: stats.criticalAlerts.toString(), inline: true },
      { name: '📈 Klimek Alpha', value: `${(stats.klimekAlpha * 100).toFixed(2)}%`, inline: true },
      { name: '📊 PVT Gap', value: `${(stats.pvtGap * 100).toFixed(2)}%`, inline: true },
    ],
    footer: { text: 'Anti-Rigging War Room • Daily Report' },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook(webhookUrl, '📊 **รายงานสรุปประจำวัน**', [embed]);
}
