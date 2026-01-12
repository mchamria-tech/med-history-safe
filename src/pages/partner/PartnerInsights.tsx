import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from "lucide-react";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { DemographicsBarChart } from "@/components/partner/DemographicsBarChart";
import { RiskDonutChart } from "@/components/partner/RiskDonutChart";
import { mockFinancialMetrics } from "@/components/partner/mockData";
import { cn } from "@/lib/utils";

const PartnerInsights = () => {
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  return (
    <PartnerLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insights</h1>
          <p className="text-muted-foreground mt-1">
            Demographics, risk stratification, and financial metrics.
          </p>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DemographicsBarChart />
          <RiskDonutChart />
        </div>

        {/* Financial Metrics */}
        <div className="bg-card rounded-xl p-6 shadow-soft border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Revenue & Expenditures</h3>
              <p className="text-sm text-muted-foreground">Financial overview for current period</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gross Revenue */}
            <div className="bg-muted/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Gross Revenue</p>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    mockFinancialMetrics.grossRevenue.trend >= 0
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-red-600 bg-red-50"
                  )}
                >
                  {mockFinancialMetrics.grossRevenue.trend >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(mockFinancialMetrics.grossRevenue.trend)}% YoY
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(mockFinancialMetrics.grossRevenue.value)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total earnings this quarter
              </p>
            </div>

            {/* Operating Costs */}
            <div className="bg-muted/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Operating Costs</p>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    mockFinancialMetrics.operatingCosts.trend <= 0
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-red-600 bg-red-50"
                  )}
                >
                  {mockFinancialMetrics.operatingCosts.trend <= 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <TrendingUp className="w-3 h-3" />
                  )}
                  {Math.abs(mockFinancialMetrics.operatingCosts.trend)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(mockFinancialMetrics.operatingCosts.value)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Improved operational efficiency
              </p>
            </div>

            {/* Net Profit Margin */}
            <div className="bg-muted/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Net Profit Margin</p>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    mockFinancialMetrics.netProfitMargin.trend >= 0
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-red-600 bg-red-50"
                  )}
                >
                  {mockFinancialMetrics.netProfitMargin.trend >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(mockFinancialMetrics.netProfitMargin.trend)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {mockFinancialMetrics.netProfitMargin.value}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Above industry average (55%)
              </p>
            </div>
          </div>
        </div>

        {/* Key Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-5 shadow-soft border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground">Member Retention</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Retention Rate</span>
                <span className="font-semibold text-foreground">94.2%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "94.2%" }} />
              </div>
              <p className="text-xs text-muted-foreground">
                8.5% improvement from last quarter
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-5 shadow-soft border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground">Engagement Score</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className="font-semibold text-foreground">78/100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "78%" }} />
              </div>
              <p className="text-xs text-muted-foreground">
                Based on app usage, test compliance, and follow-ups
              </p>
            </div>
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerInsights;
