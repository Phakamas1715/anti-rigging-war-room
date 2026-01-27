import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Download, Loader2, AlertTriangle, CheckCircle, Scale, BarChart3, Network, Map } from "lucide-react";

export default function ExportReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: report, isLoading, refetch } = trpc.export.forensicReport.useQuery();

  const handleGeneratePDF = async () => {
    if (!report) return;
    
    setIsGenerating(true);
    
    try {
      // Generate HTML content for PDF
      const htmlContent = generateReportHTML(report);
      
      // Create a blob and download
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `forensic_report_${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportHTML = (data: typeof report) => {
    if (!data) return "";
    
    return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงานนิติวิทยาศาสตร์การเลือกตั้ง</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Sarabun', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 24px; margin-bottom: 10px; color: #dc2626; }
    h2 { font-size: 18px; margin: 30px 0 15px; padding-bottom: 10px; border-bottom: 2px solid #dc2626; }
    h3 { font-size: 16px; margin: 20px 0 10px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #dc2626; }
    .meta { color: #666; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .summary-item { background: #f5f5f5; padding: 15px; border-radius: 8px; }
    .summary-item .value { font-size: 24px; font-weight: bold; color: #dc2626; }
    .summary-item .label { font-size: 12px; color: #666; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .status.suspicious { background: #fef2f2; color: #dc2626; }
    .status.normal { background: #f0fdf4; color: #16a34a; }
    .section { margin: 30px 0; padding: 20px; background: #fafafa; border-radius: 8px; border-left: 4px solid #dc2626; }
    .formula { font-family: monospace; background: #1a1a1a; color: #22c55e; padding: 10px; border-radius: 4px; margin: 10px 0; }
    .interpretation { padding: 15px; background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th { background: #f5f5f5; font-weight: bold; }
    .alert { padding: 10px; margin: 5px 0; background: #fef2f2; border-radius: 4px; border-left: 3px solid #dc2626; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e5e5; font-size: 12px; color: #666; }
    .disclaimer { background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fbbf24; margin: 20px 0; }
    @media print { body { padding: 20px; } .section { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔬 รายงานนิติวิทยาศาสตร์การเลือกตั้ง</h1>
    <p class="meta">Election Forensics Report</p>
    <p class="meta">สร้างเมื่อ: ${new Date(data.generatedAt).toLocaleString('th-TH')}</p>
  </div>

  <h2>📊 สรุปภาพรวม</h2>
  <div class="summary">
    <div class="summary-item">
      <div class="value">${data.summary.totalStations}</div>
      <div class="label">หน่วยเลือกตั้ง</div>
    </div>
    <div class="summary-item">
      <div class="value">${data.summary.totalAlerts}</div>
      <div class="label">การแจ้งเตือนทั้งหมด</div>
    </div>
    <div class="summary-item">
      <div class="value">${data.summary.pendingReview}</div>
      <div class="label">รอตรวจสอบ</div>
    </div>
    <div class="summary-item">
      <div class="value">${data.summary.totalEvidence}</div>
      <div class="label">หลักฐานภาพถ่าย</div>
    </div>
  </div>

  <h2>⚛️ Klimek Model Analysis</h2>
  <div class="section">
    <h3>ผลการวิเคราะห์</h3>
    <table>
      <tr><th>ตัวชี้วัด</th><th>ค่า</th><th>เกณฑ์</th><th>สถานะ</th></tr>
      <tr>
        <td>Alpha (α) - Vote Stuffing</td>
        <td>${(data.klimekAnalysis.alpha * 100).toFixed(2)}%</td>
        <td>&lt; 5%</td>
        <td><span class="status ${data.klimekAnalysis.alpha > 0.05 ? 'suspicious' : 'normal'}">${data.klimekAnalysis.alpha > 0.05 ? 'ผิดปกติ' : 'ปกติ'}</span></td>
      </tr>
      <tr>
        <td>Beta (β) - Vote Stealing</td>
        <td>${(data.klimekAnalysis.beta * 100).toFixed(2)}%</td>
        <td>&lt; 20%</td>
        <td><span class="status ${data.klimekAnalysis.beta > 0.2 ? 'suspicious' : 'normal'}">${data.klimekAnalysis.beta > 0.2 ? 'ผิดปกติ' : 'ปกติ'}</span></td>
      </tr>
      <tr>
        <td>Correlation</td>
        <td>${data.klimekAnalysis.correlation.toFixed(4)}</td>
        <td>&lt; 0.5</td>
        <td><span class="status ${data.klimekAnalysis.correlation > 0.5 ? 'suspicious' : 'normal'}">${data.klimekAnalysis.correlation > 0.5 ? 'สูง' : 'ปกติ'}</span></td>
      </tr>
    </table>
    
    <div class="formula">P(x,y) = (1-α)·N(x,y) + α·δ(x=1,y=1)</div>
    
    <div class="interpretation">
      <strong>การตีความ:</strong> ${data.klimekAnalysis.interpretation}
    </div>
    
    <p><strong>หน่วยใน Fraud Zone:</strong> ${data.klimekAnalysis.fraudZoneCount} จาก ${data.klimekAnalysis.totalUnits} หน่วย</p>
  </div>

  ${data.benfordAnalysis ? `
  <h2>📈 Benford's Law Analysis (2BL)</h2>
  <div class="section">
    <h3>ผลการวิเคราะห์</h3>
    <table>
      <tr><th>ตัวชี้วัด</th><th>ค่า</th><th>เกณฑ์</th><th>สถานะ</th></tr>
      <tr>
        <td>Chi-square</td>
        <td>${data.benfordAnalysis.chiSquare.toFixed(2)}</td>
        <td>&lt; ${data.benfordAnalysis.criticalValue}</td>
        <td><span class="status ${data.benfordAnalysis.isSuspicious ? 'suspicious' : 'normal'}">${data.benfordAnalysis.isSuspicious ? 'ผิดปกติ' : 'ปกติ'}</span></td>
      </tr>
    </table>
    
    <div class="formula">P(d₂) = Σ log₁₀(1 + 1/(10k + d₂)) for k = 1 to 9</div>
    
    <div class="interpretation">
      <strong>การตีความ:</strong> ${data.benfordAnalysis.interpretation}
    </div>
  </div>
  ` : ''}

  <h2>🕸️ Social Network Analysis</h2>
  <div class="section">
    <h3>ผลการวิเคราะห์</h3>
    <table>
      <tr><th>ตัวชี้วัด</th><th>ค่า</th></tr>
      <tr><td>จำนวน Nodes</td><td>${data.networkAnalysis.totalNodes}</td></tr>
      <tr><td>จำนวน Edges</td><td>${data.networkAnalysis.totalEdges}</td></tr>
      <tr><td>หัวคะแนนที่ตรวจพบ (Hubs)</td><td>${data.networkAnalysis.hubs.length}</td></tr>
    </table>
    
    ${data.networkAnalysis.hubs.length > 0 ? `
    <h3>รายชื่อหัวคะแนน (Top Hubs)</h3>
    <table>
      <tr><th>Node</th><th>Out Degree</th><th>In Degree</th><th>Centrality Score</th></tr>
      ${data.networkAnalysis.hubs.slice(0, 5).map(hub => `
        <tr>
          <td>${hub.node}</td>
          <td>${hub.outDegree}</td>
          <td>${hub.inDegree}</td>
          <td>${(hub.centralityScore * 100).toFixed(1)}%</td>
        </tr>
      `).join('')}
    </table>
    ` : ''}
    
    <div class="interpretation">
      <strong>การตีความ:</strong> ${data.networkAnalysis.interpretation}
    </div>
  </div>

  ${data.alerts.length > 0 ? `
  <h2>⚠️ การแจ้งเตือนล่าสุด</h2>
  <div class="section">
    ${data.alerts.slice(0, 10).map(alert => `
      <div class="alert">
        <strong>[${(alert.severity || 'unknown').toUpperCase()}]</strong> ${alert.type}: ${alert.description}
        <br><small>${new Date(alert.createdAt).toLocaleString('th-TH')}</small>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="disclaimer">
    <strong>⚖️ ข้อจำกัดความรับผิดชอบทางกฎหมาย</strong>
    <p>${data.legalDisclaimer}</p>
  </div>

  <div class="footer">
    <p>รายงานนี้จัดทำโดยระบบ Anti-Rigging War Room</p>
    <p>สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
  </div>
</body>
</html>
    `;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Export รายงาน</h1>
          </div>
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating || !report}
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            ดาวน์โหลดรายงาน
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Report Preview */}
        <Card className="bg-card/50 border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              ตัวอย่างรายงาน
            </CardTitle>
            <CardDescription>
              รายงานนิติวิทยาศาสตร์การเลือกตั้ง (Election Forensics Report)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{report.summary.totalStations}</p>
                    <p className="text-sm text-muted-foreground">หน่วยเลือกตั้ง</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-red-500">{report.summary.totalAlerts}</p>
                    <p className="text-sm text-muted-foreground">การแจ้งเตือน</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-500">{report.summary.pendingReview}</p>
                    <p className="text-sm text-muted-foreground">รอตรวจสอบ</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{report.summary.totalEvidence}</p>
                    <p className="text-sm text-muted-foreground">หลักฐาน</p>
                  </div>
                </div>

                {/* Klimek Analysis */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Klimek Model Analysis</h3>
                    <Badge variant={report.klimekAnalysis.isSuspicious ? "destructive" : "secondary"}>
                      {report.klimekAnalysis.isSuspicious ? "ผิดปกติ" : "ปกติ"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Alpha (α)</p>
                      <p className={`text-xl font-bold ${report.klimekAnalysis.alpha > 0.05 ? "text-red-500" : "text-green-500"}`}>
                        {(report.klimekAnalysis.alpha * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Beta (β)</p>
                      <p className={`text-xl font-bold ${report.klimekAnalysis.beta > 0.2 ? "text-red-500" : "text-green-500"}`}>
                        {(report.klimekAnalysis.beta * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fraud Zone</p>
                      <p className="text-xl font-bold text-foreground">
                        {report.klimekAnalysis.fraudZoneCount}/{report.klimekAnalysis.totalUnits}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.klimekAnalysis.interpretation}</p>
                </div>

                {/* Benford Analysis */}
                {report.benfordAnalysis && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Scale className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-foreground">Benford's Law Analysis</h3>
                      <Badge variant={report.benfordAnalysis.isSuspicious ? "destructive" : "secondary"}>
                        {report.benfordAnalysis.isSuspicious ? "ผิดปกติ" : "ปกติ"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Chi-square</p>
                        <p className={`text-xl font-bold ${report.benfordAnalysis.isSuspicious ? "text-red-500" : "text-green-500"}`}>
                          {report.benfordAnalysis.chiSquare.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Critical Value</p>
                        <p className="text-xl font-bold text-foreground">
                          {report.benfordAnalysis.criticalValue}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{report.benfordAnalysis.interpretation}</p>
                  </div>
                )}

                {/* Network Analysis */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Network className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Social Network Analysis</h3>
                    <Badge variant={report.networkAnalysis.hubs.length > 0 ? "destructive" : "secondary"}>
                      {report.networkAnalysis.hubs.length > 0 ? `พบ ${report.networkAnalysis.hubs.length} Hubs` : "ปกติ"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nodes</p>
                      <p className="text-xl font-bold text-foreground">{report.networkAnalysis.totalNodes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Edges</p>
                      <p className="text-xl font-bold text-foreground">{report.networkAnalysis.totalEdges}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hubs</p>
                      <p className="text-xl font-bold text-red-500">{report.networkAnalysis.hubs.length}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.networkAnalysis.interpretation}</p>
                </div>

                {/* Alerts */}
                {report.alerts.length > 0 && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h3 className="font-bold text-foreground">การแจ้งเตือนล่าสุด ({report.alerts.length})</h3>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {report.alerts.slice(0, 5).map((alert, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-red-500/10 rounded">
                          <Badge variant="destructive" className="text-xs">{alert.severity || 'unknown'}</Badge>
                          <span className="text-sm text-muted-foreground">{alert.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal Disclaimer */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-bold text-foreground">ข้อจำกัดความรับผิดชอบทางกฎหมาย</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.legalDisclaimer}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">HTML Report</h3>
                  <p className="text-sm text-muted-foreground">พร้อมพิมพ์เป็น PDF</p>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleGeneratePDF}
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                ดาวน์โหลด
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 opacity-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Excel Data</h3>
                  <p className="text-sm text-muted-foreground">ข้อมูลดิบสำหรับวิเคราะห์</p>
                </div>
              </div>
              <Button className="w-full" disabled>
                เร็วๆ นี้
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 opacity-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <Map className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">GeoJSON Map</h3>
                  <p className="text-sm text-muted-foreground">ข้อมูลแผนที่สำหรับ GIS</p>
                </div>
              </div>
              <Button className="w-full" disabled>
                เร็วๆ นี้
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
