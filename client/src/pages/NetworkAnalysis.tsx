import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Network, Users, AlertTriangle } from "lucide-react";
import { useMemo } from "react";

export default function NetworkAnalysis() {
  const { data: analysis, isLoading } = trpc.network.analyze.useQuery();

  // Generate simple network visualization positions
  const nodePositions = useMemo(() => {
    if (!analysis?.centrality) return new Map();
    
    const positions = new Map<string, { x: number; y: number; isHub: boolean }>();
    const hubs = new Set(analysis.hubs.map(h => h.node));
    
    analysis.centrality.forEach((node, index) => {
      const angle = (index / analysis.centrality.length) * 2 * Math.PI;
      const radius = hubs.has(node.node) ? 100 : 200 + Math.random() * 50;
      positions.set(node.node, {
        x: 250 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
        isHub: hubs.has(node.node)
      });
    });
    
    return positions;
  }, [analysis]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Network className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold text-white">Social Network Analysis</span>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : analysis?.totalNodes || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total Edges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {isLoading ? "..." : analysis?.totalEdges || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Detected Hubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {isLoading ? "..." : analysis?.hubs.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">สถานะ</CardTitle>
            </CardHeader>
            <CardContent>
              {(analysis?.hubs.length || 0) > 0 ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-bold">พบหัวคะแนน</span>
                </div>
              ) : (
                <div className="text-green-500 font-bold">ปกติ</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Network Graph */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Network Graph</CardTitle>
              <CardDescription className="text-slate-400">
                แสดงความสัมพันธ์ระหว่าง nodes (จุดสีแดง = Hub/หัวคะแนน)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-96 flex items-center justify-center text-slate-500">
                  กำลังโหลด...
                </div>
              ) : (
                <div className="relative h-96 bg-slate-800/50 rounded-lg overflow-hidden">
                  <svg width="100%" height="100%" viewBox="0 0 500 500">
                    {/* Edges - simplified visualization */}
                    {analysis?.centrality.slice(0, 20).map((node, i) => {
                      const pos = nodePositions.get(node.node);
                      if (!pos) return null;
                      
                      // Draw lines to center for hubs
                      if (pos.isHub) {
                        return (
                          <line
                            key={`edge-${i}`}
                            x1={pos.x}
                            y1={pos.y}
                            x2={250}
                            y2={250}
                            stroke="#3b82f6"
                            strokeWidth="1"
                            opacity="0.3"
                          />
                        );
                      }
                      return null;
                    })}
                    
                    {/* Nodes */}
                    {analysis?.centrality.slice(0, 50).map((node, i) => {
                      const pos = nodePositions.get(node.node);
                      if (!pos) return null;
                      
                      return (
                        <g key={`node-${i}`}>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={pos.isHub ? 12 : 6}
                            fill={pos.isHub ? "#ef4444" : "#3b82f6"}
                            opacity={pos.isHub ? 1 : 0.6}
                          />
                          {pos.isHub && (
                            <text
                              x={pos.x}
                              y={pos.y + 25}
                              textAnchor="middle"
                              fill="#ef4444"
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {node.node}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hub List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-red-500" />
                หัวคะแนนที่ตรวจพบ (Hubs)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Nodes ที่มี Centrality Score สูง (Top 5%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis?.hubs && analysis.hubs.length > 0 ? (
                <div className="space-y-3">
                  {analysis.hubs.map((hub, index) => (
                    <div 
                      key={hub.node}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">{hub.node}</div>
                          <div className="text-xs text-slate-400">
                            Out: {hub.outDegree} | In: {hub.inDegree}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-500 font-bold">
                          {(hub.centralityScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-500">Centrality</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  ไม่พบ Hub ที่น่าสงสัย
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Explanation */}
        <Card className="bg-slate-900/50 border-slate-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">วิธีการวิเคราะห์</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-400 text-sm space-y-3">
            <p>
              <strong className="text-white">Degree Centrality:</strong> วัดจำนวนการเชื่อมต่อของแต่ละ node 
              ถ้า node ใดมีการเชื่อมต่อกับ nodes อื่นมากผิดปกติ แสดงว่าอาจเป็น "หัวคะแนน" ที่กำลังกระจายเงินหรือข้อมูล
            </p>
            <p>
              <strong className="text-white">Star Topology:</strong> รูปแบบที่ node เดียวเชื่อมต่อกับ nodes จำนวนมาก
              เป็นลักษณะเฉพาะของเครือข่ายซื้อเสียง
            </p>
            <p>
              <strong className="text-white">Action:</strong> ส่งพิกัด Hub ให้ตำรวจจับ "ตัวแม่" คนเดียว ล้มทั้งกระดาน
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
