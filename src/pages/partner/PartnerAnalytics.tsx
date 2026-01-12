import { useNavigate } from "react-router-dom";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { RiskDonutChart } from "@/components/partner/RiskDonutChart";
import { ClinicalStatusChart } from "@/components/partner/ClinicalStatusChart";
import { StatusBadge } from "@/components/partner/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { mockMembers } from "@/components/partner/mockData";
import { ExternalLink } from "lucide-react";

const PartnerAnalytics = () => {
  const navigate = useNavigate();

  return (
    <PartnerLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clinical Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Deep-dive into member risk profiles and clinical status trends.
          </p>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskDonutChart />
          <ClinicalStatusChart />
        </div>

        {/* Status Definitions */}
        <div className="bg-card rounded-xl p-5 shadow-soft border border-border/50">
          <h3 className="font-semibold text-foreground mb-4">Status Definitions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <StatusBadge status="STABLE" />
              <p className="text-sm text-muted-foreground">
                No follow-up tests required
              </p>
            </div>
            <div className="flex items-start gap-3">
              <StatusBadge status="REVIEW" />
              <p className="text-sm text-muted-foreground">
                Tests due within 7 days
              </p>
            </div>
            <div className="flex items-start gap-3">
              <StatusBadge status="CRITICAL" />
              <p className="text-sm text-muted-foreground">
                &gt;15 days overdue for tests
              </p>
            </div>
            <div className="flex items-start gap-3">
              <StatusBadge status="MONITORING" />
              <p className="text-sm text-muted-foreground">
                Results awaited for tests done
              </p>
            </div>
          </div>
        </div>

        {/* Member Clinical List */}
        <div className="bg-card rounded-xl shadow-soft border border-border/50 overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Member Clinical List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Member
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Clinical Status
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Deep Analytics
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockMembers.map((member) => {
                  const initials = member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.memberId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`font-medium ${
                            member.riskLevel === "Low"
                              ? "text-emerald-600"
                              : member.riskLevel === "Medium"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {member.riskLevel}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="link"
                          className="text-primary gap-1 p-0 h-auto"
                          onClick={() => navigate(`/partner/analytics/${member.id}`)}
                        >
                          View Analytics
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerAnalytics;
