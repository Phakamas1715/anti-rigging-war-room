import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import AnimatedNumber from "@/components/AnimatedNumber";
import AnimatedBar from "@/components/AnimatedBar";
import AnimatedPieChart from "@/components/AnimatedPieChart";
import { 
  Shield,
  BarChart3,
  Activity,
  FileText,
  Network,
  Map,
  AlertTriangle,
  ArrowRight,
  Play,
  CheckCircle2,
  Users,
  Eye,
  Zap,
  TrendingUp,
  Home
} from "lucide-react";
import { DEMO_FEATURES, DEMO_CANDIDATES } from "@/lib/mockData";

// Demo data for each feature
const FEATURE_DEMOS = {
  pvt: {
    candidates: [
      { name: "ผู้สมัคร A", crowdsourced: 45230, official: 47500, color: "#ef4444" },
      { name: "ผู้สมัคร B", crowdsourced: 38450, official: 37200, color: "#3b82f6" },
      { name: "ผู้สมัคร C", crowdsourced: 28320, official: 28100, color: "#22c55e" },
    ],
  },
  klimek: {
    alpha: 0.08,
    beta: 0.03,
    zones: [
      { name: "โซนปกติ", value: 75, color: "#22c55e" },
      { name: "โซนน่าสงสัย", value: 20, color: "#f59e0b" },
      { name: "โซนผิดปกติ", value: 5, color: "#ef4444" },
    ],
  },
  benford: {
    digits: [
      { digit: 1, expected: 30.1, observed: 29.5 },
      { digit: 2, expected: 17.6, observed: 18.2 },
      { digit: 3, expected: 12.5, observed: 11.8 },
      { digit: 4, expected: 9.7, observed: 10.5 },
      { digit: 5, expected: 7.9, observed: 7.2 },
    ],
    chiSquare: 15.2,
    pValue: 0.055,
  },
  network: {
    nodes: 150,
    edges: 420,
    clusters: 5,
    hubs: [
      { name: "Hub A", centrality: 0.85 },
      { name: "Hub B", centrality: 0.72 },
      { name: "Hub C", centrality: 0.68 },
    ],
  },
  spatial: {
    hotspots: 5,
    provinces: [
      { name: "กรุงเทพฯ", zScore: 2.1, status: "warning" },
      { name: "เชียงใหม่", zScore: 0.5, status: "normal" },
      { name: "ขอนแก่น", zScore: 3.2, status: "critical" },
    ],
  },
  alerts: {
    total: 12,
    critical: 2,
    high: 4,
    medium: 6,
    resolved: 8,
  },
};

const FeatureIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    BarChart3: <BarChart3 className={className} />,
    Activity: <Activity className={className} />,
    FileText: <FileText className={className} />,
    Network: <Network className={className} />,
    Map: <Map className={className} />,
    AlertTriangle: <AlertTriangle className={className} />,
  };
  return icons[icon] || <Shield className={className} />;
};

export default function PublicDemo() {
  const [activeFeature, setActiveFeature] = useState("pvt");
  const [animationKey, setAnimationKey] = useState(0);

  const handleReplay = () => {
    setAnimationKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-500" />
              <div>
                <h1 className="text-xl font-bold text-white">Anti-Rigging War Room</h1>
                <p className="text-xs text-slate-400">ระบบตรวจจับการทุจริตการเลือกตั้ง</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  <Home className="h-4 w-4 mr-2" />
                  หน้าหลัก
                </Button>
              </Link>
              <Link href="/volunteer/register">
                <Button className="bg-green-600 hover:bg-green-700">
                  สมัครอาสาสมัคร
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-purple-600/20 text-purple-300 border-purple-500/30">
            <Eye className="h-3 w-3 mr-1" />
            โหมดสาธิต
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            ดูตัวอย่างการทำงาน<br />
            <span className="text-red-500">ก่อนตัดสินใจ</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            สำรวจฟีเจอร์ทั้งหมดของระบบตรวจจับการทุจริตการเลือกตั้ง 
            พร้อมข้อมูลจำลองแบบ Interactive
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={handleReplay}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className="h-4 w-4 mr-2" />
              เล่น Animation ใหม่
            </Button>
            <Link href="/admin/demo">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                <TrendingUp className="h-4 w-4 mr-2" />
                ดู Dashboard เต็มรูปแบบ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Tabs */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <Tabs value={activeFeature} onValueChange={setActiveFeature} className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 bg-transparent h-auto mb-8">
              {DEMO_FEATURES.map((feature) => (
                <TabsTrigger
                  key={feature.id}
                  value={feature.id}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                    activeFeature === feature.id
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <FeatureIcon icon={feature.icon} className={`h-6 w-6 ${
                    feature.color === 'blue' ? 'text-blue-500' :
                    feature.color === 'red' ? 'text-red-500' :
                    feature.color === 'purple' ? 'text-purple-500' :
                    feature.color === 'green' ? 'text-green-500' :
                    feature.color === 'orange' ? 'text-orange-500' :
                    'text-yellow-500'
                  }`} />
                  <span className="text-xs font-medium text-center">{feature.title.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* PVT Demo */}
            <TabsContent value="pvt" className="mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Parallel Vote Tabulation (PVT)
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    เปรียบเทียบผลคะแนนจากอาสาสมัครกับผลทางการแบบ Real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bar Chart */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">เปรียบเทียบคะแนน</h4>
                      {FEATURE_DEMOS.pvt.candidates.map((candidate, index) => {
                        const maxVotes = Math.max(candidate.crowdsourced, candidate.official);
                        const gap = candidate.official - candidate.crowdsourced;
                        return (
                          <div key={candidate.name} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-white">{candidate.name}</span>
                              <span className={`text-xs ${gap > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {gap > 0 ? '+' : ''}{gap.toLocaleString()}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 w-12">เรา:</span>
                                <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                                  <AnimatedBar 
                                    key={`pvt-crowd-${index}-${animationKey}`}
                                    percentage={(candidate.crowdsourced / maxVotes) * 100}
                                    color={candidate.color}
                                    delay={index * 200}
                                  />
                                </div>
                                <span className="text-xs text-white w-14 text-right">
                                  {candidate.crowdsourced.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 w-12">ทางการ:</span>
                                <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                                  <AnimatedBar 
                                    key={`pvt-official-${index}-${animationKey}`}
                                    percentage={(candidate.official / maxVotes) * 100}
                                    color={candidate.color}
                                    delay={index * 200 + 100}
                                    opacity={0.6}
                                  />
                                </div>
                                <span className="text-xs text-slate-400 w-14 text-right">
                                  {candidate.official.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Stats */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">สรุปผล</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-white">
                            <AnimatedNumber key={`pvt-total-${animationKey}`} value={112000} />
                          </div>
                          <div className="text-xs text-slate-400">คะแนนที่เรานับ</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-white">
                            <AnimatedNumber key={`pvt-official-${animationKey}`} value={112800} />
                          </div>
                          <div className="text-xs text-slate-400">คะแนนทางการ</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center col-span-2">
                          <div className="text-3xl font-bold text-yellow-500">
                            <AnimatedNumber key={`pvt-gap-${animationKey}`} value={0.7} decimals={1} suffix="%" />
                          </div>
                          <div className="text-xs text-slate-400">ส่วนต่างรวม</div>
                        </div>
                      </div>
                      <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-400">ส่วนต่างอยู่ในเกณฑ์ปกติ (&lt; 2%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Klimek Demo */}
            <TabsContent value="klimek" className="mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" />
                    Klimek Model Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    ตรวจจับการยัดบัตร (Vote Stuffing) และการขโมยคะแนน (Vote Stealing)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Alpha/Beta Values */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">ค่าพารามิเตอร์</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                          <div className="text-4xl font-bold text-yellow-500">
                            <AnimatedNumber key={`klimek-alpha-${animationKey}`} value={0.08} decimals={2} />
                          </div>
                          <div className="text-sm text-slate-400 mt-2">Alpha</div>
                          <div className="text-xs text-slate-500">Vote Stuffing</div>
                        </div>
                        <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                          <div className="text-4xl font-bold text-green-500">
                            <AnimatedNumber key={`klimek-beta-${animationKey}`} value={0.03} decimals={2} />
                          </div>
                          <div className="text-sm text-slate-400 mt-2">Beta</div>
                          <div className="text-xs text-slate-500">Vote Stealing</div>
                        </div>
                      </div>
                      <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm text-yellow-400">พบความผิดปกติระดับปานกลาง</span>
                        </div>
                      </div>
                    </div>

                    {/* Zone Distribution */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">การกระจายตัวของหน่วยเลือกตั้ง</h4>
                      <div className="flex justify-center">
                        <AnimatedPieChart
                          key={`klimek-pie-${animationKey}`}
                          data={FEATURE_DEMOS.klimek.zones.map(z => ({
                            id: z.name,
                            value: z.value,
                            color: z.color,
                            label: z.name,
                          }))}
                          size={180}
                          delay={300}
                        />
                      </div>
                      <div className="space-y-2">
                        {FEATURE_DEMOS.klimek.zones.map((zone) => (
                          <div key={zone.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                              <span className="text-sm text-slate-300">{zone.name}</span>
                            </div>
                            <span className="text-sm text-white font-medium">{zone.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Benford Demo */}
            <TabsContent value="benford" className="mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Benford's Law Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    ตรวจสอบรูปแบบตัวเลขตามกฎทางสถิติของ Benford
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Digit Distribution */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">การกระจายตัวของหลักแรก</h4>
                      {FEATURE_DEMOS.benford.digits.map((d, index) => (
                        <div key={d.digit} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">หลัก {d.digit}</span>
                            <span className="text-slate-500">คาดหวัง: {d.expected}% | จริง: {d.observed}%</span>
                          </div>
                          <div className="flex gap-1 h-4">
                            <div className="flex-1 bg-slate-800 rounded overflow-hidden">
                              <AnimatedBar
                                key={`benford-expected-${index}-${animationKey}`}
                                percentage={d.expected}
                                color="#8b5cf6"
                                delay={index * 100}
                                opacity={0.5}
                              />
                            </div>
                            <div className="flex-1 bg-slate-800 rounded overflow-hidden">
                              <AnimatedBar
                                key={`benford-observed-${index}-${animationKey}`}
                                percentage={d.observed}
                                color="#8b5cf6"
                                delay={index * 100 + 50}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Statistical Summary */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">ผลการทดสอบทางสถิติ</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                          <div className="text-3xl font-bold text-white">
                            <AnimatedNumber key={`benford-chi-${animationKey}`} value={15.2} decimals={1} />
                          </div>
                          <div className="text-sm text-slate-400 mt-2">Chi-Square</div>
                        </div>
                        <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                          <div className="text-3xl font-bold text-green-500">
                            <AnimatedNumber key={`benford-p-${animationKey}`} value={0.055} decimals={3} />
                          </div>
                          <div className="text-sm text-slate-400 mt-2">P-Value</div>
                        </div>
                      </div>
                      <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-400">ไม่พบความผิดปกติทางสถิติ (p &gt; 0.05)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Network Demo */}
            <TabsContent value="network" className="mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Network className="h-5 w-5 text-green-500" />
                    Social Network Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    วิเคราะห์เครือข่ายความสัมพันธ์และตรวจจับ Hub ที่ผิดปกติ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Network Stats */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">สถิติเครือข่าย</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-white">
                            <AnimatedNumber key={`network-nodes-${animationKey}`} value={150} />
                          </div>
                          <div className="text-xs text-slate-400">Nodes</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-white">
                            <AnimatedNumber key={`network-edges-${animationKey}`} value={420} />
                          </div>
                          <div className="text-xs text-slate-400">Edges</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-white">
                            <AnimatedNumber key={`network-clusters-${animationKey}`} value={5} />
                          </div>
                          <div className="text-xs text-slate-400">Clusters</div>
                        </div>
                      </div>
                      
                      {/* Network Visualization Placeholder */}
                      <div className="p-8 bg-slate-800/30 rounded-lg border border-slate-700 flex items-center justify-center">
                        <div className="text-center">
                          <Network className="h-16 w-16 text-green-500/50 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">Network Visualization</p>
                          <p className="text-xs text-slate-500">แสดงกราฟเครือข่ายแบบ Interactive</p>
                        </div>
                      </div>
                    </div>

                    {/* Detected Hubs */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">Hub ที่ตรวจพบ</h4>
                      <div className="space-y-3">
                        {FEATURE_DEMOS.network.hubs.map((hub, index) => (
                          <div key={hub.name} className="p-4 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{hub.name}</span>
                              <Badge variant={hub.centrality > 0.8 ? "destructive" : "secondary"}>
                                Centrality: {hub.centrality}
                              </Badge>
                            </div>
                            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                              <AnimatedBar
                                key={`network-hub-${index}-${animationKey}`}
                                percentage={hub.centrality * 100}
                                color={hub.centrality > 0.8 ? "#ef4444" : "#f59e0b"}
                                delay={index * 200}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm text-yellow-400">พบ Hub ที่มีอิทธิพลสูง 3 ราย</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spatial Demo */}
            <TabsContent value="spatial" className="mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Map className="h-5 w-5 text-orange-500" />
                    Spatial Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    วิเคราะห์ความผิดปกติเชิงพื้นที่และแสดงบนแผนที่
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Map Placeholder */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">แผนที่ความผิดปกติ</h4>
                      <div className="p-8 bg-slate-800/30 rounded-lg border border-slate-700 aspect-video flex items-center justify-center">
                        <div className="text-center">
                          <Map className="h-16 w-16 text-orange-500/50 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">Heatmap Visualization</p>
                          <p className="text-xs text-slate-500">แสดง Hotspots บนแผนที่ประเทศไทย</p>
                        </div>
                      </div>
                    </div>

                    {/* Province Stats */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">จังหวัดที่ตรวจพบความผิดปกติ</h4>
                      <div className="space-y-3">
                        {FEATURE_DEMOS.spatial.provinces.map((prov, index) => (
                          <div key={prov.name} className={`p-4 rounded-lg border ${
                            prov.status === 'critical' ? 'bg-red-900/20 border-red-800' :
                            prov.status === 'warning' ? 'bg-yellow-900/20 border-yellow-800' :
                            'bg-slate-800/50 border-slate-700'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">{prov.name}</span>
                              <Badge variant={
                                prov.status === 'critical' ? "destructive" :
                                prov.status === 'warning' ? "secondary" : "outline"
                              }>
                                Z-Score: {prov.zScore}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-red-500" />
                          <span className="text-sm text-red-400">พบ Hotspot 5 จุด ที่ต้องตรวจสอบ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alerts Demo */}
            <TabsContent value="alerts" className="mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Real-time Alerts
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    ระบบแจ้งเตือนอัตโนมัติเมื่อพบความผิดปกติ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Alert Stats */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">สรุปการแจ้งเตือน</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-center">
                          <div className="text-3xl font-bold text-red-500">
                            <AnimatedNumber key={`alerts-critical-${animationKey}`} value={2} />
                          </div>
                          <div className="text-xs text-red-400">Critical</div>
                        </div>
                        <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg text-center">
                          <div className="text-3xl font-bold text-yellow-500">
                            <AnimatedNumber key={`alerts-high-${animationKey}`} value={4} />
                          </div>
                          <div className="text-xs text-yellow-400">High</div>
                        </div>
                        <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg text-center">
                          <div className="text-3xl font-bold text-blue-500">
                            <AnimatedNumber key={`alerts-medium-${animationKey}`} value={6} />
                          </div>
                          <div className="text-xs text-blue-400">Medium</div>
                        </div>
                        <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg text-center">
                          <div className="text-3xl font-bold text-green-500">
                            <AnimatedNumber key={`alerts-resolved-${animationKey}`} value={8} />
                          </div>
                          <div className="text-xs text-green-400">Resolved</div>
                        </div>
                      </div>
                    </div>

                    {/* Sample Alerts */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300">ตัวอย่างการแจ้งเตือน</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-red-900/20 border-l-4 border-red-500 rounded">
                          <div className="text-sm text-white">พบค่า Alpha สูงผิดปกติ (0.12)</div>
                          <div className="text-xs text-slate-400">หน่วย ST0012 • 2 นาทีที่แล้ว</div>
                        </div>
                        <div className="p-3 bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
                          <div className="text-sm text-white">ส่วนต่างคะแนน 2,500 คะแนน</div>
                          <div className="text-xs text-slate-400">หน่วย ST0025 • 15 นาทีที่แล้ว</div>
                        </div>
                        <div className="p-3 bg-blue-900/20 border-l-4 border-blue-500 rounded">
                          <div className="text-sm text-white">รูปแบบตัวเลขผิดปกติตาม Benford</div>
                          <div className="text-xs text-slate-400">เขต 7 • 1 ชั่วโมงที่แล้ว</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 border-t border-slate-800">
        <div className="container mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-4">พร้อมเริ่มต้นใช้งาน?</h3>
          <p className="text-slate-400 mb-8">
            ร่วมเป็นส่วนหนึ่งในการปกป้องประชาธิปไตย
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/volunteer/register">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Users className="h-5 w-5 mr-2" />
                สมัครเป็นอาสาสมัคร
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                <ArrowRight className="h-5 w-5 mr-2" />
                กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800 bg-slate-950">
        <div className="container mx-auto text-center text-sm text-slate-500">
          <p>Anti-Rigging War Room - ระบบตรวจจับการทุจริตการเลือกตั้ง</p>
          <p className="mt-1">⚠️ ข้อมูลในหน้านี้เป็นข้อมูลจำลองเพื่อการสาธิตเท่านั้น</p>
        </div>
      </footer>
    </div>
  );
}
