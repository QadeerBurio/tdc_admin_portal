// Travel partner settings: read-only details from GET /api/auth/me, the profile image and a change-password
// form, like the employer settings. The writes are POST /api/profile/update-profile { profileImage } and
// POST /api/auth/change-password { currentPassword, newPassword }.
import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import Ico from "../../portal/Ico";
import { Button, Field, Input, Facts, Pill, PageLoading, toast } from "../../portal/kit";
import "../styles/TravelPortal.css";

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

export default function TravelSettings() {
  const { token, user } = useOutletContext() || {};
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setMe(res.data))
      .catch((err) => { console.error("Error fetching profile", err); setMe({ name: user?.name, email: user?.email }); })
      .finally(() => setLoading(false));
  }, [token, user]);

  const name = me?.name || user?.name || "travel partner";
  const shown = image || me?.profileImage || me?.logo || "";
  const since = me?.createdAt ? new Date(me.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

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

  if (loading) return <div className="tdcp k-page"><PageLoading label="Loading settings..." /></div>;

  return (
    <div className="tdcp k-page" data-screen="travel-settings">
      <div className="k-head">
        <div className="tr-title">
          <Ico kind="settings" tone="sand" size={56} />
          <div>
            <h1>settings<span className="dot" aria-hidden="true">.</span></h1>
            <p>your partner profile, photo and password.</p>
          </div>
        </div>
      </div>

      <div className="tr-set-grid">
        <section className="k-card tr-set-card tr-set-who">
          <div className="tr-set-avatar">
            {shown ? <img src={shown} alt="" /> : <span>{String(name).charAt(0)}</span>}
          </div>
          <h2 className="tr-h2">{name}</h2>
          {since && <p className="k-hint">travel partner since {since}</p>}
          <Pill tone="sky" dot>travel partner</Pill>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePick} />
          <Button variant="secondary" icon="upload" loading={saving} disabled={saving} onClick={() => fileRef.current && fileRef.current.click()}>
            {saving ? "uploading..." : "change photo"}
          </Button>
        </section>

        <div className="tr-set-side">
          <section className="k-card tr-set-card">
            <h2 className="tr-h2">partner details</h2>
            <Facts rows={[
              ["name", name],
              ["email", me?.email],
              ["phone", me?.phone],
              ["city", me?.city],
              ["address", me?.address],
            ]} />
            <div className="k-note">
              to change your partner details, email <a href="mailto:hello@gettdc.pk">hello@gettdc.pk</a>
            </div>
          </section>

          <form className="k-card tr-set-card" onSubmit={changePassword} noValidate>
            <h2 className="tr-h2">change password</h2>
            <div className="tr-set-form">
              <Field label="current password" htmlFor="ts-current">
                <Input id="ts-current" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
              </Field>
              <Field label="new password" htmlFor="ts-new" hint="at least 8 characters, with a lowercase and an uppercase letter, a number and a special character">
                <Input id="ts-new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </Field>
              <Field label="confirm new password" htmlFor="ts-confirm">
                <Input id="ts-confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
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
