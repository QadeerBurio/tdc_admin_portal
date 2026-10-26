// src/screens/CreateOffer.js
// New discount (design/portal/BrCreate): one flat offer for tdc verified users.
import React, { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import axios from "axios";
import Ico from "../portal/Ico";
import { Button, Field, Input, Textarea, Select, DateInput, Pill, Progress, toast } from "../portal/kit";
import dotSorted from "./dots/sorted.png";
import "./styles/BrandPortal.css";

const API_BASE_URL = "https://the-deft-crew-production.up.railway.app/api/offers";
const CATEGORIES = [
  "Restaurant",
  "Cafe & Coffee",
  "Food & Drinks",
  "Salon",
  "Spa & Wellness",
  "Health & Beauty",
  "Perfumes & Fragrances",
  "Fashion & Clothing",
  "Shoes & Footwear",
  "Bags & Accessories",
  "Electronics & Gadgets",
  "Mobile & Accessories",
  "Education & Institutes",
  "Travel & Tourism",
  "Hotels & Resorts",
  "Gym & Fitness",
  "Sports",
  "Entertainment",
  "Photography",
  "Services",
  "Others"
];

const DEFAULT_REDEMPTION_INSTRUCTIONS = `1. Open the TDC App and navigate to the Offers section.
2. Browse Brand and select the offer you want.
3. Save the discount offer in the app.
4. Visit the participating brand/store offering the discount.
5. Show your TDC Card or Student ID Card to the staff before making the payment.
6. The store staff will verify your eligibility for the offer.
7. Once verified, the discount will be applied, and you can redeem the offer successfully.`;

const PERCENTS = [15, 20, 25, 30, 35, 40, 45, 50, 60];

export default function CreateOffer() {
  // the brand shell passes its offers; the "no discount live yet" pill shows only when none is live
  const outlet = useOutletContext();
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountPercentage: "",
    category: "",
    redeemInstructions: DEFAULT_REDEMPTION_INSTRUCTIONS,
    location: "",
    isOnline: false,
    isInStore: false,
    validUntil: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [discountError, setDiscountError] = useState("");

  const validateDiscount = (value) => {
    const num = parseInt(value);
    if (!value) {
      setDiscountError("Discount percentage is required");
      return false;
    }
    if (isNaN(num) || num < 15) {
      setDiscountError("Discount must be at least 15%");
      return false;
    }
    if (num > 60) {
      setDiscountError("Discount cannot exceed 60%");
      return false;
    }
    setDiscountError("");
    return true;
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, discountPercentage: value });
    if (value) {
      validateDiscount(value);
    } else {
      setDiscountError("");
    }
  };

  const createOffer = async () => {
    // Validate all required fields
    if (!form.title) {
      return toast("Please enter the brand name");
    }
    if (!form.description) {
      return toast("Please enter a description");
    }
    if (!form.category) {
      return toast("Please select a category");
    }
    if (!form.discountPercentage) {
      return toast("Please enter the discount percentage");
    }
    
    // Validate discount range
    const discountNum = parseInt(form.discountPercentage);
    if (isNaN(discountNum) || discountNum < 15 || discountNum > 60) {
      return toast("Discount must be between 15% and 60%");
    }
    
    if (!image) {
      return toast("Please upload an offer image");
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("discountPercentage", form.discountPercentage);
    formData.append("category", form.category);
    formData.append("redeemInstructions", form.redeemInstructions);
    formData.append("location", form.location);
    formData.append("isOnline", String(form.isOnline));
    formData.append("isInStore", String(form.isInStore));
    formData.append("validUntil", form.validUntil);
    formData.append("image", image);

    try {
      setLoading(true);
      setUploadProgress(0);
      const token = localStorage.getItem("token");
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const response = await axios.post(API_BASE_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Offer created:", response.data);

      clearInterval(interval);
      setUploadProgress(100);
      setShowSuccess(true);
      
      setTimeout(() => {
        setForm({
          title: "", description: "", discountPercentage: "", category: "",
          redeemInstructions: DEFAULT_REDEMPTION_INSTRUCTIONS,
          location: "", isOnline: false, isInStore: false, validUntil: ""
        });
        setPreview(null);
        setImage(null);
        setShowSuccess(false);
        setUploadProgress(0);
        setDiscountError("");
      }, 3000);
      
    } catch (error) {
      console.error("❌ Upload Error:", error.response?.data || error.message);
      toast(error.response?.data?.message || "❌ Error creating offer. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (file) => {
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const toggle = (key, label) => (
    <label className={`br-where${form[key] ? " on" : ""}`}>
      <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
      {label}
    </label>
  );

  const hasLive = (outlet?.offers || []).some((o) => o.status !== "expired");

  return (
    <div className="tdcp k-page" data-screen="brand-create">
      <div className="k-card br-create">
        <div className="br-create-head">
          <div>
            {outlet && !hasLive && <Pill tone="yellow"><img src={dotSorted} alt="" className="br-pop-dot" />no discount live yet</Pill>}
            <h1>create offer<span className="dot" aria-hidden="true">.</span></h1>
            <p>one flat offer for tdc verified users. you can edit it any time.</p>
          </div>
          <Link to="/discount" className="k-icon-btn" aria-label="close" title="close"><Ico kind="close" tone="plain" size={16} /></Link>
        </div>
        <div className="br-create-body">
          {showSuccess && (
            <div className="k-note ok k-row" role="status">
              <Ico kind="checkCircle" tone="plain" size={18} />
              <span><b>Offer Created Successfully! 🎉</b> Your students have been notified via the app</span>
            </div>
          )}
          {loading && <Progress value={uploadProgress} label={`${uploadProgress}% uploading your offer`} />}

          <Field label={<>offer image <span className="k-error">*</span></>}>
            <label className="k-drop br-logo-drop">
              {preview ? (
                <img src={preview} alt="Offer preview" className="br-drop-preview" />
              ) : (
                <span className="br-up-ico"><Ico kind="upload" tone="plain" size={22} /></span>
              )}
              <span>
                <b>{preview ? "change image" : "upload a banner"}</b>
                <span className="k-hint" style={{ display: "block" }}>PNG or JPG, up to 5MB</span>
              </span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageChange(e.target.files[0])} />
            </label>
          </Field>

          <Field label={<>brand name <span className="k-error">*</span></>} htmlFor="co-title">
            <Input id="co-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter brand name..." />
          </Field>

          <Field label={<>what do students get? <span className="k-error">*</span></>} htmlFor="co-desc">
            <Textarea id="co-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. 20% off everything on the menu, dine-in and takeaway." />
          </Field>

          <div className="br-two">
            <Field label={<>category <span className="k-error">*</span></>} htmlFor="co-cat">
              <Select id="co-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select Category</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </Select>
            </Field>
            <Field label="valid until" htmlFor="co-until">
              <DateInput id="co-until" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </Field>
          </div>

          <Field label={<>discount <span className="k-error">*</span></>} error={discountError}>
            <div className="br-pcts" role="group" aria-label="discount percent">
              {PERCENTS.map((p) => (
                <button key={p} type="button" aria-pressed={String(form.discountPercentage) === String(p)} onClick={() => handleDiscountChange({ target: { value: String(p) } })}>
                  {p}%
                </button>
              ))}
            </div>
          </Field>

          <Field label="store location" htmlFor="co-loc">
            <Input id="co-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="area, city (e.g. DHA Phase 6, Karachi)" />
          </Field>

          <fieldset className="br-fieldset">
            <legend className="k-label">where can they use it?</legend>
            <div className="k-row">
              {toggle("isInStore", "in-store")}
              {toggle("isOnline", "online")}
            </div>
          </fieldset>

          <Field label="redemption instructions" htmlFor="co-redeem" hint="what students see when they open the offer in the app">
            <Textarea id="co-redeem" rows={6} value={form.redeemInstructions} onChange={(e) => setForm({ ...form, redeemInstructions: e.target.value })} placeholder="How can students claim this?" />
          </Field>
        </div>

        <div className="br-create-foot">
          <span className="k-hint">free for your first year. no commission.</span>
          <Button size="lg" onClick={createOffer} loading={loading}>{loading ? "publishing..." : "publish discount"}</Button>
        </div>
      </div>
    </div>
  );
}
