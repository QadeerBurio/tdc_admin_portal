// Brand settings (design/portal/BrSettings): read-only brand details from auth/me, and the profile image.
// Brand details change through the tdc team; the only write here is POST /api/profile/update-profile { profileImage }.
import React, { useContext, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Ico from "../portal/Ico";
import { Button, Facts, Pill, toast } from "../portal/kit";
import "./styles/BrandPortal.css";

const API_URL = "https://the-deft-crew-production.up.railway.app/api/profile/update-profile";
const MAX_SIDE = 512;

const APPROVAL = {
  approved: ["green", "approved and live"],
  pending: ["yellow", "waiting for approval"],
  rejected: ["red", "not approved"],
  draft: ["sand", "draft"],
};

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

export default function BrandSettings() {
  const { token } = useContext(AuthContext);
  const { brandData, brandName, displayName, logoUrl } = useOutletContext() || {};
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const shown = image || brandData?.profileImage || logoUrl || "";
  const since = brandData?.createdAt ? new Date(brandData.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";
  const [tone, label] = APPROVAL[brandData?.brandApprovalStatus] || [];

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
      const res = await axios.post(API_URL, { profileImage }, { headers: { Authorization: `Bearer ${token}` } });
      setImage(res.data?.user?.profileImage || profileImage);
      toast("Profile image updated", "ok");
    } catch (err) {
      console.error("Profile image update failed", err);
      toast(err.response?.data?.error || err.message || "Failed to update profile image", "bad");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tdcp k-page" data-screen="brand-settings">
      <div className="k-head">
        <div className="br-title">
          <Ico kind="settings" tone="sand" size={56} />
          <div>
            <h1>settings<span className="dot" aria-hidden="true">.</span></h1>
            <p>your brand profile and logo.</p>
          </div>
        </div>
      </div>

      <div className="bs-grid">
        <section className="k-card bs-card bs-who">
          <div className="bs-avatar">
            {shown ? <img src={shown} alt="" /> : <span>{String(brandName || "b").charAt(0)}</span>}
          </div>
          <h2 className="br-h2">{brandName}</h2>
          {since && <p className="k-hint">brand partner since {since}</p>}
          {label && <Pill tone={tone} dot>{label}</Pill>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePick} />
          <Button variant="secondary" icon="upload" loading={saving} disabled={saving} onClick={() => fileRef.current && fileRef.current.click()}>
            {saving ? "uploading..." : "change profile image"}
          </Button>
        </section>

        <section className="k-card bs-card">
          <h2 className="br-h2">profile</h2>
          <Facts rows={[
            ["brand name", brandName],
            ["contact person", displayName],
            ["email", brandData?.email],
            ["phone", brandData?.phone],
            ["city", brandData?.city],
            ["category", brandData?.category],
            ["address", brandData?.address],
            ["instagram or website", brandData?.instagram || brandData?.websiteUrl],
          ]} />
          <div className="k-note">
            to change your brand details, email <a href="mailto:hello@gettdc.pk">hello@gettdc.pk</a>
          </div>
        </section>
      </div>
    </div>
  );
}
