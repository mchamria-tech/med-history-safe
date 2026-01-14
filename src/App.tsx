import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Profiles_Main from "./pages/Profiles_Main";
import NewProfile from "./pages/NewProfile";
import ProfileView from "./pages/ProfileView";
import ViewDocuments from "./pages/ViewDocuments";
import DocumentSearch from "./pages/DocumentSearch";
import Feedback from "./pages/Feedback";
import MyFeedback from "./pages/MyFeedback";
import FeedbackHub from "./pages/FeedbackHub";
import AdminFeedback from "./pages/AdminFeedback";
import NotFound from "./pages/NotFound";

// Super Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartners from "./pages/admin/AdminPartners";
import AdminPartnerForm from "./pages/admin/AdminPartnerForm";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserAnalytics from "./pages/admin/AdminUserAnalytics";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminProfile from "./pages/admin/AdminProfile";

// Partner Pages
import PartnerLogin from "./pages/partner/PartnerLogin";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerUserSearch from "./pages/partner/PartnerUserSearch";
import PartnerDocumentUpload from "./pages/partner/PartnerDocumentUpload";
import PartnerNewUser from "./pages/partner/PartnerNewUser";

// Doctor Pages
import DoctorLogin from "./pages/doctor/DoctorLogin";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Profiles_Main />} />
              <Route path="/new-profile" element={<NewProfile />} />
              <Route path="/profile/:profileId" element={<ProfileView />} />
              <Route path="/view-documents/:profileId" element={<ViewDocuments />} />
              <Route path="/document-search" element={<DocumentSearch />} />
              <Route path="/feedback-hub" element={<FeedbackHub />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/my-feedback" element={<MyFeedback />} />
              
              {/* Super Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/partners" element={<AdminPartners />} />
              <Route path="/admin/partners/new" element={<AdminPartnerForm />} />
              <Route path="/admin/partners/:id" element={<AdminPartnerForm />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/:userId/analytics" element={<AdminUserAnalytics />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/feedback" element={<AdminFeedback />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              
              {/* Partner Routes */}
              <Route path="/partner/login" element={<PartnerLogin />} />
              <Route path="/partner/dashboard" element={<PartnerDashboard />} />
              <Route path="/partner/users" element={<PartnerUserSearch />} />
              <Route path="/partner/upload" element={<PartnerDocumentUpload />} />
              <Route path="/partner/upload/:profileId" element={<PartnerDocumentUpload />} />
              <Route path="/partner/new-user" element={<PartnerNewUser />} />
              
              {/* Doctor Routes */}
              <Route path="/doctor/login" element={<DoctorLogin />} />
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
