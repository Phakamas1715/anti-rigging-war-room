import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// ยโสธร เขต 2 - 9 ผู้สมัคร
const YASOTHON_Z2_CANDIDATES = [
  { number: 1, name: "นายบุญแก้ว สมวงศ์", party: "เพื่อไทย" },
  { number: 2, name: "นายธนู ว่องไวตระกูล", party: "ท้องที่ไทย" },
  { number: 3, name: "นายวรายุทธ จงอักษร", party: "ภูมิใจไทย" },
  { number: 4, name: "นางสาวชริสา แพงมี", party: "ไทยก้าวใหม่" },
  { number: 5, name: "นายพงศธร สุภโกศล", party: "ประชาชน" },
  { number: 6, name: "นายอนันต์ หลอดคำ", party: "ประชาธิปไตยใหม่" },
  { number: 7, name: "นายกริชเพชร พลศรี", party: "ประชาธิปัตย์" },
  { number: 8, name: "ดาบตำรวจ สิทธิชัย ทองมูล", party: "พลังประชารัฐ" },
  { number: 9, name: "นายสิงห์มณี กุบแก้ว", party: "เศรษฐกิจ" },
];

// 5 อำเภอ ในยโสธร เขต 2
const YASOTHON_Z2_DISTRICTS = [
  { name: "คำเขื่อนแก้ว", totalStations: 75 },
  { name: "มหาชนะชัย", totalStations: 68 },
  { name: "ค้อวัง", totalStations: 62 },
  { name: "ป่าติ้ว", totalStations: 58 },
  { name: "ไทยเจริญ", totalStations: 72 },
];

interface CandidateVotes {
  number: number;
  name: string;
  party: string;
  votes: number;
  percentage: number;
}

interface DistrictStatus {
  district: string;
  reported: number;
  total: number;
  percentage: number;
  totalVotes: number;
}

export default function YasothonDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [candidateVotes, setCandidateVotes] = useState<CandidateVotes[]>([]);
  const [districtStatus, setDistrictStatus] = useState<DistrictStatus[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [reportedStations, setReportedStations] = useState(0);
  const [totalStations] = useState(335); // 75+68+62+58+72
  const [alerts, setAlerts] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch live data
  const { data: liveData, refetch } = trpc.yasothon.liveMonitor.useQuery(
    undefined,
    { refetchInterval: autoRefresh ? 15000 : false }
  );

  const { data: alertsData } = trpc.alertSystem.getUnresolved.useQuery(
    undefined,
    { refetchInterval: autoRefresh ? 30000 : false }
  );

  // Update UI when data changes
  useEffect(() => {
    if (liveData) {
      // Process candidate votes
      const votes = YASOTHON_Z2_CANDIDATES.map((cand) => {
        const voteCount = liveData.candidateVotes[cand.number] || 0;
        return {
          ...cand,
          votes: voteCount,
          percentage: totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0,
        };
      });
      setCandidateVotes(votes);

      // Process district status
      const districts = YASOTHON_Z2_DISTRICTS.map((dist) => {
        const reported = liveData.districtStatus[dist.name]?.reported || 0;
        return {
          district: dist.name,
          reported,
          total: dist.totalStations,
          percentage: (reported / dist.totalStations) * 100,
          totalVotes: liveData.districtStatus[dist.name]?.totalVotes || 0,
        };
      });
      setDistrictStatus(districts);

      setTotalVotes(liveData.totalVotes || 0);
      setReportedStations(liveData.reportedStations || 0);
      setLastUpdate(new Date());
    }
  }, [liveData]);

  useEffect(() => {
    if (alertsData) {
      setAlerts(alertsData);
    }
  }, [alertsData]);

  const handleRefresh = async () => {
    await refetch();
  };

  const chartData = candidateVotes
    .sort((a, b) => b.votes - a.votes)
    .map((c) => ({
      name: `#${c.number}`,
      votes: c.votes,
      party: c.party,
    }));

  const districtChartData = districtStatus.map((d) => ({
    name: d.district,
    reported: d.reported,
    total: d.total,
    percentage: d.percentage,
  }));

  const pieData = candidateVotes
    .filter((c) => c.votes > 0)
    .map((c) => ({
      name: `#${c.number} (${c.party})`,
      value: c.votes,
    }));

  const COLORS = [
    "#F97316",
    "#EC4899",
    "#8B5CF6",
    "#3B82F6",
    "#06B6D4",
    "#10B981",
    "#FBBF24",
    "#EF4444",
    "#6366F1",
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              ยโสธร เขต 2 - Live Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time monitoring สำหรับการนับคะแนนเลือกตั้ง 2569
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={
                autoRefresh
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "border-slate-700 text-slate-300"
              }
            >
              <Clock className="w-4 h-4 mr-2" />
              {autoRefresh ? "Live" : "Paused"}
            </Button>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-xs text-slate-400">
          อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString("th-TH")}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                คะแนนรวม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {totalVotes.toLocaleString("th-TH")}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                จากหน่วยที่รายงาน {reportedStations} / {totalStations}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                ความครอบคลุม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {((reportedStations / totalStations) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {reportedStations} / {totalStations} หน่วย
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {alerts.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ยังไม่ได้แก้ไข
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                ผู้นำคะแนน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                #{candidateVotes[0]?.number || "-"}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {candidateVotes[0]?.name || "รอข้อมูล"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <Card className="bg-slate-900 border-red-900/50">
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-red-400">
                          {alert.stationCode}
                        </p>
                        <p className="text-slate-300 text-xs mt-1">
                          {alert.summary}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          alert.severity === "critical"
                            ? "border-red-600 text-red-400"
                            : alert.severity === "high"
                            ? "border-orange-600 text-orange-400"
                            : "border-yellow-600 text-yellow-400"
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vote Distribution Bar Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">
                การกระจายคะแนน (ผู้สมัคร)
              </CardTitle>
              <CardDescription>
                เรียงลำดับจากมากไปน้อย
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#E2E8F0" }}
                  />
                  <Bar dataKey="votes" fill="#F97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vote Distribution Pie Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">
                สัดส่วนคะแนน
              </CardTitle>
              <CardDescription>
                ร้อยละของคะแนนรวม
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#E2E8F0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* District Coverage */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              ความครอบคลุมรายอำเภอ
            </CardTitle>
            <CardDescription>
              จำนวนหน่วยเลือกตั้งที่รายงานผล
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#E2E8F0" }}
                />
                <Legend />
                <Bar dataKey="reported" fill="#F97316" name="รายงาน" />
                <Bar dataKey="total" fill="#475569" name="รวม" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Candidate Details Table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              ผลการนับคะแนนรายผู้สมัคร
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">
                      เลขที่
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400">
                      ชื่อ-สกุล
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400">
                      พรรค
                    </th>
                    <th className="text-right py-3 px-4 text-slate-400">
                      คะแนน
                    </th>
                    <th className="text-right py-3 px-4 text-slate-400">
                      ร้อยละ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidateVotes
                    .sort((a, b) => b.votes - a.votes)
                    .map((cand, idx) => (
                      <tr
                        key={cand.number}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-orange-500">
                            #{cand.number}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white">
                          {cand.name}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {cand.party}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {cand.votes.toLocaleString("th-TH")}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {cand.percentage.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
