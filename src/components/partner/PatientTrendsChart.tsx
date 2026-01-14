import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface PatientTrendsChartProps {
  linkedUsers: number;
}

// Generate mock trend data based on current user count
const generateTrendData = (currentCount: number) => {
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const baseValue = Math.max(currentCount - 15, 10);
  
  return weeks.map((week, index) => ({
    week,
    users: Math.round(baseValue + (currentCount - baseValue) * ((index + 1) / 4)),
  }));
};

const generateMonthlyData = (currentCount: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const baseValue = Math.max(currentCount - 30, 5);
  
  return months.map((month, index) => ({
    week: month,
    users: Math.round(baseValue + (currentCount - baseValue) * ((index + 1) / 6)),
  }));
};

const chartConfig = {
  users: {
    label: "Users",
    color: "hsl(15 75% 60%)",
  },
};

export const PatientTrendsChart = ({ linkedUsers }: PatientTrendsChartProps) => {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  
  const data = period === "weekly" 
    ? generateTrendData(linkedUsers)
    : generateMonthlyData(linkedUsers);

  return (
    <Card className="shadow-soft border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Patient Trends</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Growth of linked patient profiles
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={period === "weekly" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={period === "monthly" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(15 75% 60%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(15 75% 60%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="week" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(220 10% 50%)' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(220 10% 50%)' }}
              width={30}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="users"
              stroke="hsl(15 75% 60%)"
              strokeWidth={2}
              fill="url(#colorUsers)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
