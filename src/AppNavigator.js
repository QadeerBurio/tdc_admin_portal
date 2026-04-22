import React, { useContext } from "react";
import { Routes,Route,Navigate } from "react-router-dom";
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
import AdminCoursePortal from "./screens/AdminCourse";

export default function AppNavigator(){

  const { user } = useContext(AuthContext);

  // ---------------- NOT LOGGED IN ----------------
  if(!user){

    return(
      <Routes>

        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    );
  }

  // ---------------- ADMIN ROUTES ----------------
  if(user.role === "admin"){

    return(
      <Routes>

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/createofferadmin" element={<CreateOfferAdmin />} />
        <Route path="/adminoffers" element={<AdminOffers />} />
        <Route path="/adminjobsmanager" element={<AdminJobsManager />} />
        <Route path="/adminexchangemanage" element={<ManageExchange />} />
        <Route path="/program" element={<ProgramApplication />} />
        <Route path="/dossier/:id" element={<StudentDossier />} />
        <Route path="/package" element={<AdminPackageScreen />} />
        <Route path="/cardmanager" element={<CardManager />} />
        <Route path="/booking" element={<AdminPackage />} />
        <Route path="/admincourse" element={<AdminCoursePortal />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />

      </Routes>
    );
  }

  // ---------------- BRAND ROUTES ----------------
  return(

    <Routes>

      <Route path="/home" element={<Home />} />
      <Route path="/claimedUsers" element={<ClaimedUsers />} />
      <Route path="/verifyclaim" element={<VerifyClaim />} />
      <Route path="/savinghistory" element={<SavingsHistory />} />

      <Route path="*" element={<Navigate to="/home" replace />} />

    </Routes>

  );

}