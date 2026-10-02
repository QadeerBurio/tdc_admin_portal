// src/AppNavigator.jsx
import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

// ── Auth ────────────────────────────────────────────────────────────────
import SignIn from "./screens/SignIn";
import SignupScreen from "./screens/SignUp";
import ForgotPassword from "./screens/ForgotPassword";
import VerifyOTP from "./screens/VerifyOTP";
import ResetPassword from "./screens/ResetPassword";

// ── Public / Landing ────────────────────────────────────────────────────
import Landing from "./screens/Landing";
import BrandsProfile from "./screens/roles/BrandsProfile";
import CompanyProfile from "./screens/roles/CompanyProfile";
import OfferImagesGallery from "./screens/OfferImagesGallery";
import AppStoreReviews from "./screens/roles/AppStoreReviews";
import UniversitiesSection from "./screens/roles/UniversitiesSection";

// ── Brand / Student ─────────────────────────────────────────────────────
import Home from "./screens/Home";
import ClaimedUsers from "./screens/ClaimedUsers";
import VerifyClaim from "./screens/VerifyClaim";
import SavingsHistory from "./screens/SavingsHistory";
import CreateOffer from "./screens/CreateOffer";
import Discount from "./screens/Discount";
import BrandVerifyScreen from "./screens/BrandVerifyScreen";
import Branches from "./screens/Branches";

// ── Admin ───────────────────────────────────────────────────────────────
import AdminDashboard from "./screens/AdminDashboard";
import CreateOfferAdmin from "./screens/CreateOfferAdmin";
import AdminOffers from "./screens/AdminOffers";
import AdminJobsManager from "./screens/AdminJobsManager";
import ManageExchange from "./screens/ManageExchange";
import ProgramApplication from "./screens/ProgramApplication";
import StudentDossier from "./screens/StudentDossier";
import AdminPackageScreen from "./screens/Traveling";
import CardManager from "./screens/CardManager";
import AdminPackage from "./screens/AdminPackage";
import TravelDashboard from "./screens/TravelDashboard";
import CompanyDashboard from "./screens/CompanyDashboard";
import CandidatesManager from "./screens/CandidateManager";
import InterviewsManager from "./screens/InterviewsManager";
import ReportsManager from "./screens/ReportsManager";
import EventManagement from "./screens/EventManagement";
import BrandApprovalScreen from "./screens/BrandApprovalScreen";
import AllBrandsRevenue from "./screens/AllBrandsRevenue";

// ── 🆕 Crew (Admin) ─────────────────────────────────────────────────────
import CrewInbox from "./screens/CrewInbox";
import CrewPartners from "./screens/CrewPartners";
import CrewCampaigns from "./screens/CrewCampaigns";
import CrewCredentials from "./screens/CrewCredentials";

// ── 🆕 Engagement (Admin) ───────────────────────────────────────────────
import DropsSchedule from "./screens/DropsSchedule";
import EngagementMetrics from "./screens/EngagementMetrics";
import RewardsAdmin from "./screens/RewardsAdmin";
import TestPush from "./screens/TestPush";

// ── 🆕 Brand Campaigns ──────────────────────────────────────────────────
import BrandCampaigns from "./screens/BrandCampaigns";
import VerifyReward from "./screens/VerifyReward";

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
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
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
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // TRAVELER
  // ────────────────────────────────────────────────────────────────────────
  if (user.role === "traveler") {
    return (
      <Routes>
        <Route path="/traveler-dashboard" element={<TravelDashboard />} />
        <Route path="/" element={<Navigate to="/traveler-dashboard" replace />} />
        <Route path="*" element={<Navigate to="/traveler-dashboard" replace />} />
      </Routes>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // EMPLOYEE
  // ────────────────────────────────────────────────────────────────────────
  if (user.role === "employee") {
    return (
      <Routes>
        <Route path="/employee-dashboard" element={<CompanyDashboard />} />
        <Route path="/candidate" element={<CandidatesManager />} />
        <Route path="/interviews" element={<InterviewsManager />} />
        <Route path="/reports" element={<ReportsManager />} />
        <Route path="/" element={<Navigate to="/employee-dashboard" replace />} />
        <Route path="*" element={<Navigate to="/employee-dashboard" replace />} />
      </Routes>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // BRAND / STUDENT (default)
  // ────────────────────────────────────────────────────────────────────────
  return (
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
  );
}