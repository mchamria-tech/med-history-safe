// Mock data for Partner Portal - Health Intelligence

export interface MockMember {
  id: string;
  name: string;
  age: number;
  memberId: string;
  avatar: string;
  status: "STABLE" | "MONITORING" | "CRITICAL" | "REVIEW";
  heartRate: number;
  riskLevel: "Low" | "Medium" | "High";
  riskPercentage: number;
  email?: string;
  phone?: string;
  lastVisit?: string;
}

export interface UrgentAlert {
  id: string;
  memberName: string;
  memberId: string;
  type: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
}

export interface DashboardStats {
  activeMembers: { value: number; trend: number };
  vitalsScore: { value: number; trend: number };
  criticalAlerts: { value: number; trend: number };
  avgResponse: { value: string; trend: number };
}

export interface BiochemicalParameter {
  name: string;
  range: string;
  current: number;
  historical: number;
  unit: string;
  percentChange: number;
  status: "Improving" | "Stable" | "Declining";
}

// Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  activeMembers: { value: 1284, trend: 12.5 },
  vitalsScore: { value: 94.2, trend: 4.1 },
  criticalAlerts: { value: 2, trend: -8.2 },
  avgResponse: { value: "14m", trend: 2.3 },
};

// Members List
export const mockMembers: MockMember[] = [
  {
    id: "1",
    name: "Rajesh Kumar",
    age: 45,
    memberId: "CB-2024-001",
    avatar: "",
    status: "STABLE",
    heartRate: 72,
    riskLevel: "Low",
    riskPercentage: 15,
    email: "rajesh.kumar@email.com",
    phone: "+91 98765 43210",
    lastVisit: "2024-01-10",
  },
  {
    id: "2",
    name: "Priya Sharma",
    age: 38,
    memberId: "CB-2024-002",
    avatar: "",
    status: "MONITORING",
    heartRate: 78,
    riskLevel: "Medium",
    riskPercentage: 45,
    email: "priya.sharma@email.com",
    phone: "+91 98765 43211",
    lastVisit: "2024-01-09",
  },
  {
    id: "3",
    name: "Arun Patel",
    age: 62,
    memberId: "CB-2024-003",
    avatar: "",
    status: "CRITICAL",
    heartRate: 92,
    riskLevel: "High",
    riskPercentage: 78,
    email: "arun.patel@email.com",
    phone: "+91 98765 43212",
    lastVisit: "2024-01-08",
  },
  {
    id: "4",
    name: "Sunita Devi",
    age: 55,
    memberId: "CB-2024-004",
    avatar: "",
    status: "REVIEW",
    heartRate: 68,
    riskLevel: "Medium",
    riskPercentage: 52,
    email: "sunita.devi@email.com",
    phone: "+91 98765 43213",
    lastVisit: "2024-01-07",
  },
  {
    id: "5",
    name: "Vikram Singh",
    age: 48,
    memberId: "CB-2024-005",
    avatar: "",
    status: "STABLE",
    heartRate: 70,
    riskLevel: "Low",
    riskPercentage: 12,
    email: "vikram.singh@email.com",
    phone: "+91 98765 43214",
    lastVisit: "2024-01-06",
  },
  {
    id: "6",
    name: "Meera Reddy",
    age: 42,
    memberId: "CB-2024-006",
    avatar: "",
    status: "STABLE",
    heartRate: 74,
    riskLevel: "Low",
    riskPercentage: 18,
    email: "meera.reddy@email.com",
    phone: "+91 98765 43215",
    lastVisit: "2024-01-05",
  },
  {
    id: "7",
    name: "Amit Gupta",
    age: 58,
    memberId: "CB-2024-007",
    avatar: "",
    status: "MONITORING",
    heartRate: 82,
    riskLevel: "Medium",
    riskPercentage: 48,
    email: "amit.gupta@email.com",
    phone: "+91 98765 43216",
    lastVisit: "2024-01-04",
  },
  {
    id: "8",
    name: "Kavitha Nair",
    age: 35,
    memberId: "CB-2024-008",
    avatar: "",
    status: "STABLE",
    heartRate: 68,
    riskLevel: "Low",
    riskPercentage: 8,
    email: "kavitha.nair@email.com",
    phone: "+91 98765 43217",
    lastVisit: "2024-01-03",
  },
];

// Urgent Alerts
export const mockUrgentAlerts: UrgentAlert[] = [
  {
    id: "1",
    memberName: "Arun Patel",
    memberId: "CB-2024-003",
    type: "critical",
    message: "Blood pressure reading critically high (180/110)",
    timestamp: "10 mins ago",
  },
  {
    id: "2",
    memberName: "Priya Sharma",
    memberId: "CB-2024-002",
    type: "warning",
    message: "Glucose levels require monitoring",
    timestamp: "25 mins ago",
  },
  {
    id: "3",
    memberName: "Sunita Devi",
    memberId: "CB-2024-004",
    type: "info",
    message: "Follow-up tests due in 2 days",
    timestamp: "1 hour ago",
  },
  {
    id: "4",
    memberName: "Amit Gupta",
    memberId: "CB-2024-007",
    type: "warning",
    message: "Cholesterol report pending review",
    timestamp: "2 hours ago",
  },
];

// Member Trends Data (for charts)
export const mockMemberTrends = {
  weekly: [
    { day: "Mon", members: 1245, newMembers: 12 },
    { day: "Tue", members: 1252, newMembers: 8 },
    { day: "Wed", members: 1260, newMembers: 15 },
    { day: "Thu", members: 1268, newMembers: 10 },
    { day: "Fri", members: 1275, newMembers: 7 },
    { day: "Sat", members: 1280, newMembers: 5 },
    { day: "Sun", members: 1284, newMembers: 4 },
  ],
  monthly: [
    { week: "Week 1", members: 1180, newMembers: 45 },
    { week: "Week 2", members: 1210, newMembers: 38 },
    { week: "Week 3", members: 1250, newMembers: 52 },
    { week: "Week 4", members: 1284, newMembers: 34 },
  ],
};

// Risk Stratification Data
export const mockRiskData = {
  high: { count: 156, percentage: 12 },
  medium: { count: 385, percentage: 30 },
  low: { count: 743, percentage: 58 },
};

// Clinical Status Distribution
export const mockClinicalStatus = {
  stable: { count: 820, percentage: 64 },
  review: { count: 180, percentage: 14 },
  monitoring: { count: 220, percentage: 17 },
  critical: { count: 64, percentage: 5 },
};

// Age Demographics
export const mockAgeDemographics = [
  { ageGroup: "18-30", count: 180, percentage: 14 },
  { ageGroup: "31-45", count: 420, percentage: 33 },
  { ageGroup: "46-60", count: 480, percentage: 37 },
  { ageGroup: "61-75", count: 170, percentage: 13 },
  { ageGroup: "75+", count: 34, percentage: 3 },
];

// Financial Metrics (for Insights)
export const mockFinancialMetrics = {
  grossRevenue: { value: 2450000, trend: 18.5, currency: "₹" },
  operatingCosts: { value: 890000, trend: -5.2, currency: "₹" },
  netProfitMargin: { value: 63.7, trend: 4.8 },
};

// Biochemical Parameters (for Member Analytics)
export const mockBiochemicalParameters: BiochemicalParameter[] = [
  {
    name: "LDL Cholesterol",
    range: "<100 mg/dL",
    current: 115,
    historical: 130,
    unit: "mg/dL",
    percentChange: -11.5,
    status: "Improving",
  },
  {
    name: "HDL Cholesterol",
    range: ">40 mg/dL",
    current: 52,
    historical: 48,
    unit: "mg/dL",
    percentChange: 8.3,
    status: "Improving",
  },
  {
    name: "Triglycerides",
    range: "<150 mg/dL",
    current: 142,
    historical: 145,
    unit: "mg/dL",
    percentChange: -2.1,
    status: "Stable",
  },
  {
    name: "Fasting Glucose",
    range: "70-100 mg/dL",
    current: 108,
    historical: 98,
    unit: "mg/dL",
    percentChange: 10.2,
    status: "Declining",
  },
  {
    name: "HbA1c",
    range: "<5.7%",
    current: 6.2,
    historical: 6.5,
    unit: "%",
    percentChange: -4.6,
    status: "Improving",
  },
  {
    name: "Creatinine",
    range: "0.7-1.3 mg/dL",
    current: 1.1,
    historical: 1.1,
    unit: "mg/dL",
    percentChange: 0,
    status: "Stable",
  },
];

// Member Analytics Stats
export const mockMemberAnalyticsStats = {
  overallTrend: { value: "Improving", score: 78 },
  highRiskMarkers: { count: 2, total: 12 },
  lastUpdate: "Jan 10, 2024",
  complianceScore: { value: 85, trend: 5.2 },
};
