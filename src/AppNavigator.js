// src/AppNavigator.jsx
import React, { useContext, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { PortalShell } from "./PortalFallback";

// ── Auth ────────────────────────────────────────────────────────────────
import SignIn from "./screens/SignIn";
import SignupScreen from "./screens/SignUp";
import ForgotPassword from "./screens/ForgotPassword";
import VerifyOTP from "./screens/VerifyOTP";
import ResetPassword from "./screens/ResetPassword";

// ── Public / Landing ────────────────────────────────────────────────────
import Landing from "./screens/Landing";
import Ambassador from "./screens/Ambassador";
import BrandsProfile from "./screens/roles/BrandsProfile";
import CompanyProfile from "./screens/roles/CompanyProfile";
import OfferImagesGallery from "./screens/OfferImagesGallery";
import AppStoreReviews from "./screens/roles/AppStoreReviews";
import UniversitiesSection from "./screens/roles/UniversitiesSection";

// ── Portal screens: loaded on demand, so the public pages ship without portal code ──
// Their CSS stays in the main stylesheet, in the same order as before (it includes the global reset).
import "./screens/styles/AdminDashboard.css";
import "./screens/styles/EventManagement.css";
import "./screens/styles/Brands.css";

// ── Brand / Student ─────────────────────────────────────────────────────
const Home = lazy(() => import("./screens/Home"));
const ClaimedUsers = lazy(() => import("./screens/ClaimedUsers"));
const VerifyClaim = lazy(() => import("./screens/VerifyClaim"));
const SavingsHistory = lazy(() => import("./screens/SavingsHistory"));
const CreateOffer = lazy(() => import("./screens/CreateOffer"));
const Discount = lazy(() => import("./screens/Discount"));
const BrandVerifyScreen = lazy(() => import("./screens/BrandVerifyScreen"));
const Branches = lazy(() => import("./screens/Branches"));

// ── Admin ───────────────────────────────────────────────────────────────
const AdminDashboard = lazy(() => import("./screens/AdminDashboard"));
const CreateOfferAdmin = lazy(() => import("./screens/CreateOfferAdmin"));
const AdminOffers = lazy(() => import("./screens/AdminOffers"));
const AdminJobsManager = lazy(() => import("./screens/AdminJobsManager"));
const ManageExchange = lazy(() => import("./screens/ManageExchange"));
const ProgramApplication = lazy(() => import("./screens/ProgramApplication"));
const StudentDossier = lazy(() => import("./screens/StudentDossier"));
const AdminPackageScreen = lazy(() => import("./screens/Traveling"));
const CardManager = lazy(() => import("./screens/CardManager"));
const AdminPackage = lazy(() => import("./screens/AdminPackage"));
const TravelDashboard = lazy(() => import("./screens/TravelDashboard"));
const CompanyDashboard = lazy(() => import("./screens/CompanyDashboard"));
const CandidatesManager = lazy(() => import("./screens/CandidateManager"));
const InterviewsManager = lazy(() => import("./screens/InterviewsManager"));
const ReportsManager = lazy(() => import("./screens/ReportsManager"));
const EventManagement = lazy(() => import("./screens/EventManagement"));
const BrandApprovalScreen = lazy(() => import("./screens/BrandApprovalScreen"));
const AllBrandsRevenue = lazy(() => import("./screens/AllBrandsRevenue"));

// ── 🆕 Crew (Admin) ─────────────────────────────────────────────────────
const CrewInbox = lazy(() => import("./screens/CrewInbox"));
const CrewPartners = lazy(() => import("./screens/CrewPartners"));
const CrewCampaigns = lazy(() => import("./screens/CrewCampaigns"));
const CrewCredentials = lazy(() => import("./screens/CrewCredentials"));

// ── 🆕 Engagement (Admin) ───────────────────────────────────────────────
const DropsSchedule = lazy(() => import("./screens/DropsSchedule"));
const EngagementMetrics = lazy(() => import("./screens/EngagementMetrics"));
const RewardsAdmin = lazy(() => import("./screens/RewardsAdmin"));
const TestPush = lazy(() => import("./screens/TestPush"));

// ── 🆕 Brand Campaigns ──────────────────────────────────────────────────
const BrandCampaigns = lazy(() => import("./screens/BrandCampaigns"));
const VerifyReward = lazy(() => import("./screens/VerifyReward"));

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  // ────────────────────────────────────────────────────────────────────────
  // NOT LOGGED IN
  // ────────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/ambassador" element={<Ambassador />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/brands" element={<BrandsProfile />} />
        <Route path="/company_profile" element={<CompanyProfile />} />
        <Route path="/OfferImagesGallery" element={<OfferImagesGallery />} />
        <Route path="/AppStoreReviews" element={<AppStoreReviews />} />
        <Route path="/universities" element={<UniversitiesSection />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // ADMIN
  // ────────────────────────────────────────────────────────────────────────
  if (user.role === "admin") {
    return (
      <PortalShell>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users/:role/:id" element={<AdminDashboard />} />
        <Route path="/createofferadmin" element={<CreateOfferAdmin />} />
        <Route path="/adminoffers" element={<AdminOffers />} />
        <Route path="/adminjobsmanager" element={<AdminJobsManager />} />
        <Route path="/adminexchangemanage" element={<ManageExchange />} />
        <Route path="/program" element={<ProgramApplication />} />
        <Route path="/dossier" element={<StudentDossier />} />
        <Route path="/package" element={<AdminPackageScreen />} />
        <Route path="/cardmanager" element={<CardManager />} />
        <Route path="/booking" element={<AdminPackage />} />
        <Route path="/BrandApprovalScreen" element={<BrandApprovalScreen />} />
        <Route path="/admin/brands-revenue" element={<AllBrandsRevenue />} />
        <Route path="/eventmanagement" element={<EventManagement />} />

        {/* 🆕 Crew — standalone routes */}
        <Route path="/crew/inbox" element={<CrewInbox />} />
        <Route path="/crew/partners" element={<CrewPartners />} />
        <Route path="/crew/campaigns" element={<CrewCampaigns />} />
        <Route path="/crew/credentials" element={<CrewCredentials />} />

        {/* 🆕 Engagement — standalone routes */}
        <Route path="/engagement/drops" element={<DropsSchedule />} />
        <Route path="/engagement/metrics" element={<EngagementMetrics />} />
        <Route path="/engagement/rewards" element={<RewardsAdmin />} />
        <Route path="/engagement/test-push" element={<TestPush />} />

        {/* 🆕 Brand Campaigns — read-only admin view */}
        <Route path="/brand-campaigns" element={<BrandCampaigns />} />

        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      </PortalShell>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // TRAVELER
  // ────────────────────────────────────────────────────────────────────────
  if (user.role === "traveler") {
    return (
      <PortalShell>
      <Routes>
        <Route path="/traveler-dashboard" element={<TravelDashboard />} />
        <Route path="/" element={<Navigate to="/traveler-dashboard" replace />} />
        <Route path="*" element={<Navigate to="/traveler-dashboard" replace />} />
      </Routes>
      </PortalShell>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // EMPLOYEE
  // ────────────────────────────────────────────────────────────────────────
  if (user.role === "employee") {
    return (
      <PortalShell>
      <Routes>
        <Route path="/employee-dashboard" element={<CompanyDashboard />} />
        <Route path="/candidate" element={<CandidatesManager />} />
        <Route path="/interviews" element={<InterviewsManager />} />
        <Route path="/reports" element={<ReportsManager />} />
        <Route path="/" element={<Navigate to="/employee-dashboard" replace />} />
        <Route path="*" element={<Navigate to="/employee-dashboard" replace />} />
      </Routes>
      </PortalShell>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // BRAND / STUDENT (default)
  // ────────────────────────────────────────────────────────────────────────
  return (
    <PortalShell>
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/create-offer" element={<CreateOffer />} />
      <Route path="/discount" element={<Discount />} />
      <Route path="/claimedUsers" element={<ClaimedUsers />} />
      <Route path="/verifyclaim" element={<VerifyClaim />} />
      <Route path="/savinghistory" element={<SavingsHistory />} />
      <Route path="/BrandVerifyScreen" element={<BrandVerifyScreen />} />
      <Route path="/Branches" element={<Branches />} />

      {/* 🆕 Brand Campaigns */}
      <Route path="/brand-campaigns" element={<BrandCampaigns />} />
      <Route path="/verifyrward" element={<VerifyReward />} />

      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
    </PortalShell>
  );
}