import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  TrendingUp,
  MapPin,
  RefreshCw,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

type SortBy = "date" | "severity" | "station";
type FilterSeverity = "all" | "critical" | "high" | "medium" | "low";

export default function AlertCenter() {
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  // Fetch alerts from both sources
  const { data: fraudAlerts = [], isLoading: fraudLoading, refetch: refetchFraud } = 
    trpc.alerts.list.useQuery();
  
  const { data: crossValidationAlerts = [], isLoading: cvLoading, refetch: refetchCV } = 
    trpc.alertSystem.getUnresolved.useQuery();

  const { data: alertStats } = trpc.alertSystem.getStats.useQuery();

  const utils = trpc.useUtils();

  // Resolve alert mutation
  const resolveMutation = trpc.alerts.resolve.useMutation({
    onSuccess: () => {
      toast.success("แก้ไขการแจ้งเตือนสำเร็จ");
      utils.alerts.list.invalidate();
      utils.alertSystem.getUnresolved.invalidate();
      utils.alertSystem.getStats.invalidate();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  // Resolve cross-validation alert
  const resolveCVMutation = trpc.alertSystem.resolve.useMutation({
    onSuccess: () => {
      toast.success("แก้ไขการแจ้งเตือนสำเร็จ");
      utils.alertSystem.getUnresolved.invalidate();
      utils.alertSystem.getStats.invalidate();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  });

  // Combine and filter alerts
  const allAlerts = useMemo(() => {
    const combined = [
      ...fraudAlerts.map(a => ({
        ...a,
        type: 'fraud' as const,
        timestamp: a.createdAt,
      })),
      ...crossValidationAlerts.map(a => ({
        ...a,
        type: 'cross_validation' as const,
        timestamp: a.createdAt,
        severity: a.severity || 'medium',
      })),
    ];

    return combined
      .filter(a => {
        if (!showResolved && a.isResolved) return false;
        if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
        const stationCode = a.type === 'cross_validation' ? (a as any).stationCode : '';
        if (searchTerm && !stationCode?.includes(searchTerm)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else if (sortBy === 'severity') {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return (severityOrder[a.severity as keyof typeof severityOrder] || 3) - 
                 (severityOrder[b.severity as keyof typeof severityOrder] || 3);
        } else if (sortBy === 'station') {
          const aCode = a.type === 'cross_validation' ? (a as any).stationCode || '' : '';
          const bCode = b.type === 'cross_validation' ? (b as any).stationCode || '' : '';
          return aCode.localeCompare(bCode);
        }
        return 0;
      });
  }, [fraudAlerts, crossValidationAlerts, filterSeverity, searchTerm, showResolved, sortBy]);

  const handleResolveFraud = (id: number) => {
    resolveMutation.mutate({ id });
  };

  const handleResolveCV = (id: number) => {
    resolveCVMutation.mutate({ alertId: id });
  };

  const handleRefresh = async () => {
    await Promise.all([refetchFraud(), refetchCV()]);
    toast.success("รีเฟรชข้อมูลสำเร็จ");
  };

  const getSeverityColor = (severity: string | null | undefined) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getSeverityBadgeColor = (severity: string | null | undefined) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/30 text-red-300';
      case 'high': return 'bg-orange-500/30 text-orange-300';
      case 'medium': return 'bg-yellow-500/30 text-yellow-300';
      default: return 'bg-blue-500/30 text-blue-300';
    }
  };

  const isLoading = fraudLoading || cvLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Bell className="w-8 h-8 text-orange-500" />
              Alert Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              ศูนย์กลางการแจ้งเตือนสำหรับความผิดปกติที่ตรวจพบ
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                Total Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {allAlerts.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {allAlerts.filter(a => a.severity === 'critical').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                High
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {allAlerts.filter(a => a.severity === 'high').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                Unresolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">
                {allAlerts.filter(a => !a.isResolved).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {allAlerts.filter(a => a.isResolved).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Search Station
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="ค้นหารหัสหน่วย..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Severity
                </label>
                <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v as FilterSeverity)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Newest First</SelectItem>
                    <SelectItem value="severity">Severity</SelectItem>
                    <SelectItem value="station">Station Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant={showResolved ? "default" : "outline"}
                  onClick={() => setShowResolved(!showResolved)}
                  className={showResolved ? "bg-orange-600 hover:bg-orange-700 w-full" : "border-slate-700 text-slate-300 w-full"}
                >
                  {showResolved ? "Showing Resolved" : "Hide Resolved"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              Alerts ({allAlerts.length})
            </CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `Showing ${allAlerts.length} alerts`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-slate-500">
                <Clock className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <p>กำลังโหลดข้อมูล...</p>
              </div>
            ) : allAlerts.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {allAlerts.map((alert) => (
                  <div
                    key={`${alert.type}-${alert.id}`}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${
                      alert.isResolved ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-bold text-white">
                            {alert.type === 'cross_validation' 
                              ? `Cross-validation Alert - ${(alert as any).stationCode}`
                              : alert.description?.split(' - ')[0] || 'Fraud Alert'}
                          </span>
                          <Badge className={`text-xs ${getSeverityBadgeColor(alert.severity)}`}>
                            {alert.severity?.toUpperCase() || 'MEDIUM'}
                          </Badge>
                          {alert.isResolved && (
                            <Badge className="text-xs bg-green-500/30 text-green-300">
                              RESOLVED
                            </Badge>
                          )}
                        </div>

                        <p className="text-slate-300 text-sm mb-2">
                          {alert.type === 'cross_validation'
                            ? alert.summary || "Cross-validation discrepancy detected"
                            : alert.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          {(alert as any).stationCode && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {(alert as any).stationCode}
                            </span>
                          )}
                          {alert.type === 'fraud' && alert.alphaScore && (
                            <span>Alpha: {parseFloat(alert.alphaScore).toFixed(4)}</span>
                          )}
                          {alert.type === 'cross_validation' && alert.overallConfidence && (
                            <span>Confidence: {alert.overallConfidence}%</span>
                          )}
                          <span>
                            {new Date(alert.timestamp).toLocaleString("th-TH")}
                          </span>
                        </div>
                      </div>

                      {!alert.isResolved && (
                        <Button
                          onClick={() => {
                            if (alert.type === 'cross_validation') {
                              handleResolveCV(alert.id);
                            } else {
                              handleResolveFraud(alert.id);
                            }
                          }}
                          disabled={resolveMutation.isPending || resolveCVMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="border-green-500/50 text-green-400 hover:bg-green-500/20 whitespace-nowrap"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มีการแจ้งเตือน</p>
                <p className="text-sm mt-2">ระบบจะแจ้งเตือนเมื่อตรวจพบความผิดปกติ</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
