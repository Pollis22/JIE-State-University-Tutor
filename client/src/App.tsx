/**
 * State University AI Tutor
 * Powered by JIE Mastery AI, Inc.
 */

import { lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, PublicOrAuthRoute, LazyRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";

const NotFound = lazy(() => import("@/pages/not-found"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));
const AdminPageEnhanced = lazy(() => import("@/pages/admin-page-enhanced"));
const TutorPage = lazy(() => import("@/pages/tutor-page"));
const AdminUsers = lazy(() => import("@/pages/admin-users"));
const AdminDocuments = lazy(() => import("@/pages/admin-documents"));
const AdminAnalytics = lazy(() => import("@/pages/admin-analytics"));
const AdminLogs = lazy(() => import("@/pages/admin-logs"));
const AdminUserDetail = lazy(() => import("@/pages/admin-user-detail"));
const AdminContacts = lazy(() => import("@/pages/admin/admin-contacts-page"));
const TermsPage = lazy(() => import("@/pages/terms-page"));
const PrivacyPage = lazy(() => import("@/pages/privacy-page"));
const AdminSetupPage = lazy(() => import("@/pages/admin-setup-page"));
const SessionDetailsPage = lazy(() => import("@/pages/session-details"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email-page"));
const RegistrationSuccessPage = lazy(() => import("@/pages/registration-success-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const PracticeLessonsPage = lazy(() => import("@/pages/practice-lessons-page"));
const FeaturesAndBenefits = lazy(() => import("@/pages/features-benefits"));
const TestPrepPage = lazy(() => import("@/pages/test-prep-page"));
const BestPractices = lazy(() => import("@/pages/best-practices"));
const LiveSupport = lazy(() => import("@/pages/live-support"));
const ContactPage = lazy(() => import("@/pages/contact"));
const AcademicDashboard = lazy(() => import("@/pages/academic-dashboard"));
const StudentNotificationSettingsPage = lazy(() => import("@/pages/student-notification-settings"));
const AdminAcademicTracker = lazy(() => import("@/pages/admin/admin-academic-tracker"));
const SRMPage = lazy(() => import("@/pages/srm-page"));
const TestSTTPage = lazy(() => import("@/pages/test-stt-page"));
const AboutLSISPage = lazy(() => import("@/pages/about-lsis"));

function Router() {
  return (
    <Switch>
        <PublicOrAuthRoute path="/" publicComponent={AuthPage} authComponent={TutorPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/login" component={AuthPage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/sessions/:id" component={SessionDetailsPage} />
        <ProtectedRoute path="/tutor" component={TutorPage} />
        <ProtectedRoute path="/practice-lessons" component={PracticeLessonsPage} />
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/admin" component={AdminPageEnhanced} />
        <ProtectedRoute path="/admin/users" component={AdminUsers} />
        <ProtectedRoute path="/admin/users/:userId" component={AdminUserDetail} />
        <ProtectedRoute path="/admin/documents" component={AdminDocuments} />
        <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} />
        <ProtectedRoute path="/admin/contacts" component={AdminContacts} />
        <ProtectedRoute path="/admin/logs" component={AdminLogs} />
        <ProtectedRoute path="/admin/academic-tracker" component={AdminAcademicTracker} />
        <ProtectedRoute path="/academic-dashboard" component={AcademicDashboard} />
        <ProtectedRoute path="/academic-dashboard/notifications" component={StudentNotificationSettingsPage} />
        <LazyRoute path="/about-lsis" component={AboutLSISPage} />
        <LazyRoute path="/auth/registration-success" component={RegistrationSuccessPage} />
        <LazyRoute path="/forgot-password" component={ForgotPasswordPage} />
        <LazyRoute path="/reset-password" component={ResetPasswordPage} />
        <LazyRoute path="/verify-email" component={VerifyEmailPage} />
        <LazyRoute path="/admin-setup" component={AdminSetupPage} />
        <LazyRoute path="/terms" component={TermsPage} />
        <LazyRoute path="/privacy" component={PrivacyPage} />
        <LazyRoute path="/features" component={FeaturesAndBenefits} />
        <LazyRoute path="/srm" component={SRMPage} />
        <LazyRoute path="/test-stt" component={TestSTTPage} />
        <LazyRoute path="/test-prep" component={TestPrepPage} />
        <LazyRoute path="/best-practices" component={BestPractices} />
        <LazyRoute path="/support" component={LiveSupport} />
        <LazyRoute path="/contact" component={ContactPage} />
        <LazyRoute component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
