// AppNavigator.jsx
import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

import SignIn from "./screens/SignIn";
import SignupScreen from "./screens/SignUp";
import ForgotPassword from "./screens/ForgotPassword";
import VerifyOTP from "./screens/VerifyOTP";
import ResetPassword from "./screens/ResetPassword";

// Brand Screens
import Home from "./screens/Home";
import ClaimedUsers from "./screens/ClaimedUsers";
import VerifyClaim from "./screens/VerifyClaim";
import SavingsHistory from "./screens/SavingsHistory";

// Admin Screen
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
// import AdminCoursePortal from "./screens/AdminCourse";
import TravelDashboard from "./screens/TravelDashboard";
import CompanyDashboard from "./screens/CompanyDashboard";
import CandidatesManager from "./screens/CandidateManager";
import InterviewsManager from "./screens/InterviewsManager";
import ReportsManager from "./screens/ReportsManager";
import Landing from "./screens/Landing";
import CompanyProfile from "./screens/roles/CompanyProfile";
import BrandsProfile from "./screens/roles/BrandsProfile";
import CreateOffer from "./screens/CreateOffer";
import OfferImagesGallery from "./screens/OfferImagesGallery";
import AppStoreReviews from "./screens/roles/AppStoreReviews";
import EventManagement from "./screens/EventManagement";
import Discount from "./screens/Discount";
import UniversitiesSection from "./screens/roles/UniversitiesSection";
import BrandApprovalScreen from "./screens/BrandApprovalScreen";
import BrandVerifyScreen from "./screens/BrandVerifyScreen";

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  // ---------------- NOT LOGGED IN ----------------
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

  // ---------------- ADMIN ROUTES ----------------
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
        <Route path="/eventmanagement" element={<EventManagement />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // ---------------- TRAVELER ROUTES ----------------
  if (user.role === "traveler") {
    return (
      <Routes>
        <Route path="/traveler-dashboard" element={<TravelDashboard />} />
        <Route path="/" element={<Navigate to="/traveler-dashboard" replace />} />
        <Route path="*" element={<Navigate to="/traveler-dashboard" replace />} />
      </Routes>
    );
  }

  // ---------------- EMPLOYEE ROUTES ----------------
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

  // ---------------- STUDENT/BRAND ROUTES ----------------
  return (
    <Routes>
      
      <Route path="/home" element={<Home />} />
      <Route path="/create-offer" element={<CreateOffer />} />
      <Route path="/discount" element={<Discount />} />
      <Route path="/claimedUsers" element={<ClaimedUsers />} />
      <Route path="/verifyclaim" element={<VerifyClaim />} />
      <Route path="/savinghistory" element={<SavingsHistory />} />
      <Route path="/BrandVerifyScreen" element={<BrandVerifyScreen/>} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}