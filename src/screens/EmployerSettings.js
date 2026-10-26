// Employer settings (design/portal/EmpSettings): read-only company details from auth/me (with what the old
// My Profile modal showed), the profile image, and a change-password form.
// Company details change through the tdc team; the writes here are POST /api/profile/update-profile
// { profileImage } and POST /api/auth/change-password { currentPassword, newPassword }.
import React, { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import Ico from "../portal/Ico";
import { Button, Field, Input, Facts, Pill, toast } from "../portal/kit";
import "./styles/EmployerPortal.css";

const API = "https://the-deft-crew-production.up.railway.app/api";
const MAX_SIDE = 512;

// shrink the picked image to a small JPEG data URL so it fits the JSON body
const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("could not read the image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("could not read the image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

// the same rule as the reset-password screen
const validatePassword = (pass) => {
  const errors = [];
  if (pass.length < 8) errors.push("at least 8 characters");
  if (!/[a-z]/.test(pass)) errors.push("a lowercase letter");
  if (!/[A-Z]/.test(pass)) errors.push("an uppercase letter");
  if (!/[0-9]/.test(pass)) errors.push("a number");
  if (!/[^a-zA-Z0-9]/.test(pass)) errors.push("a special character");
  return errors;
};

export default function EmployerSettings() {
  const { token, employeeData, companyName, displayName, logoUrl, stats } = useOutletContext() || {};
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const shown = image || employeeData?.profileImage || logoUrl || "";
  const since = employeeData?.createdAt ? new Date(employeeData.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  const handlePick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file");
      return;
    }
    setSaving(true);
    try {
      const profileImage = await toDataUrl(file);
      const res = await axios.post(`${API}/profile/update-profile`, { profileImage }, config);
      setImage(res.data?.user?.profileImage || profileImage);
      toast("Profile image updated", "ok");
    } catch (err) {
      console.error("Profile image update failed", err);
      toast(err.response?.data?.error || err.message || "Failed to update profile image", "bad");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (!pw.current) return setPwError("please enter your current password.");
    if (!pw.next || pw.next.trim() === "") return setPwError("please enter a new password.");
    if (!pw.confirm || pw.confirm.trim() === "") return setPwError("please confirm your password.");
    if (pw.next !== pw.confirm) return setPwError("passwords don't match.");
    const errors = validatePassword(pw.next);
    if (errors.length > 0) return setPwError(`your password needs ${errors.join(", ")}.`);
    setPwSaving(true);
    try {
      await axios.post(`${API}/auth/change-password`, { currentPassword: pw.current, newPassword: pw.next }, config);
      setPw({ current: "", next: "", confirm: "" });
      toast("Password changed", "ok");
    } catch (err) {
      console.error("Change password failed", err);
      setPwError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="tdcp k-page" data-screen="employer-settings">
      <div className="k-head">
        <div className="emp-title">
          <Ico kind="settings" tone="sand" size={56} />
          <div>
            <h1>settings<span className="dot" aria-hidden="true">.</span></h1>
            <p>your company profile, logo and password.</p>
          </div>
        </div>
      </div>

      <div className="es-grid">
        <section className="k-card es-card es-who">
          <div className="es-avatar">
            {shown ? <img src={shown} alt="" /> : <span>{String(companyName || "e").charAt(0)}</span>}
          </div>
          <h2 className="es-h2">{companyName}</h2>
          {since && <p className="k-hint">employer since {since}</p>}
          <Pill tone="green" dot>hiring on tdc</Pill>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePick} />
          <Button variant="secondary" icon="upload" loading={saving} disabled={saving} onClick={() => fileRef.current && fileRef.current.click()}>
            {saving ? "uploading..." : "change logo"}
          </Button>
        </section>

        <div className="es-side">
          <section className="k-card es-card">
            <h2 className="es-h2">company details</h2>
            <Facts rows={[
              ["company name", companyName],
              ["hiring contact", displayName],
              ["email", employeeData?.email],
              ["phone", employeeData?.phone],
              ["city", employeeData?.city],
              ["website", employeeData?.websiteUrl ? <a href={employeeData.websiteUrl} target="_blank" rel="noopener noreferrer">{employeeData.websiteUrl}</a> : null],
              ["jobs posted", stats?.totalJobs ?? 0],
              ["hires", stats?.hiredCandidates ?? 0],
            ]} />
            <div className="k-note">
              to change your company details, email <a href="mailto:hello@gettdc.pk">hello@gettdc.pk</a>
            </div>
          </section>

          <form className="k-card es-card" onSubmit={changePassword} noValidate>
            <h2 className="es-h2">change password</h2>
            <div className="emp-form">
              <Field label="current password" htmlFor="es-current">
                <Input id="es-current" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
              </Field>
              <Field label="new password" htmlFor="es-new" hint="at least 8 characters, with a lowercase and an uppercase letter, a number and a special character">
                <Input id="es-new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </Field>
              <Field label="confirm new password" htmlFor="es-confirm">
                <Input id="es-confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </Field>
              {pwError && <div className="k-note bad" role="alert">{pwError}</div>}
              <div>
                <Button type="submit" icon="lock" loading={pwSaving} disabled={pwSaving}>change password</Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
