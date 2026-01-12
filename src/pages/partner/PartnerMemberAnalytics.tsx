import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, AlertTriangle, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { StatCard } from "@/components/partner/StatCard";
import { StatusBadge } from "@/components/partner/StatusBadge";
import {
  mockMembers,
  mockBiochemicalParameters,
  mockMemberAnalyticsStats,
} from "@/components/partner/mockData";
import { cn } from "@/lib/utils";

const PartnerMemberAnalytics = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();

  // Find member (in production, fetch from API)
  const member = mockMembers.find((m) => m.id === memberId) || mockMembers[0];

  return (
    <PartnerLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Button & Header */}
        <div>
          <Button
            variant="ghost"
            className="gap-2 mb-4 -ml-2"
            onClick={() => navigate("/partner/analytics")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Button>
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {member.name} - Clinical Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Historical diagnostic parameter analysis.
              </p>
            </div>
            <StatusBadge status={member.status} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            label="Overall Trend"
            value={mockMemberAnalyticsStats.overallTrend.value}
            trendLabel={`Score: ${mockMemberAnalyticsStats.overallTrend.score}/100`}
            iconBgColor="bg-emerald-100"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            label="High Risk Markers"
            value={`${mockMemberAnalyticsStats.highRiskMarkers.count}/${mockMemberAnalyticsStats.highRiskMarkers.total}`}
            trendLabel="Parameters flagged"
            iconBgColor="bg-amber-100"
          />
          <StatCard
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
            label="Last Update"
            value={mockMemberAnalyticsStats.lastUpdate}
            trendLabel="Most recent test"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-primary" />}
            label="Compliance Score"
            value={`${mockMemberAnalyticsStats.complianceScore.value}%`}
            trend={mockMemberAnalyticsStats.complianceScore.trend}
            iconBgColor="bg-primary/10"
          />
        </div>

        {/* Biochemical Parameters Table */}
        <div className="bg-card rounded-xl shadow-soft border border-border/50 overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Biochemical Parameters</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed analysis of diagnostic markers
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Parameter
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Range
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Current
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Historical
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    % Change
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockBiochemicalParameters.map((param, index) => (
                  <tr
                    key={index}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <p className="font-medium text-foreground">{param.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-muted-foreground">{param.range}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-foreground">
                        {param.current} {param.unit}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-muted-foreground">
                        {param.historical} {param.unit}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "font-medium",
                          param.percentChange < 0
                            ? "text-emerald-600"
                            : param.percentChange > 0
                            ? "text-red-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {param.percentChange > 0 ? "+" : ""}
                        {param.percentChange}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          param.status === "Improving" &&
                            "bg-emerald-100 text-emerald-700",
                          param.status === "Stable" &&
                            "bg-blue-100 text-blue-700",
                          param.status === "Declining" && "bg-red-100 text-red-700"
                        )}
                      >
                        {param.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/partner/upload/${memberId}`)}>
            Upload New Report
          </Button>
          <Button variant="outline">Download Summary</Button>
          <Button variant="outline">Schedule Follow-up</Button>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerMemberAnalytics;
