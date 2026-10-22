// src/screens/Discount.js
// First discount (design/portal/BrCreate): the popup the brand shell opens until the brand has an offer.
// The brand name and the redemption steps are filled in for the brand and sent with the offer.
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Ico from "../portal/Ico";
import { Button, Field, Input, Textarea, Select, Pill, Progress, toast } from "../portal/kit";
import dotSorted from "./dots/sorted.png";
import "./styles/BrandPortal.css";

const API_BASE_URL = "https://the-deft-crew-production.up.railway.app/api/offers";

const CATEGORIES = [
  "Restaurant", "Cafe & Coffee", "Food & Drinks", "Salon", "Spa & Wellness",
  "Health & Beauty", "Perfumes & Fragrances", "Fashion & Clothing",
  "Shoes & Footwear", "Bags & Accessories", "Electronics & Gadgets",
  "Mobile & Accessories", "Education & Institutes", "Travel & Tourism",
  "Hotels & Resorts", "Gym & Fitness", "Sports", "Entertainment",
  "Photography", "Services", "Others",
];

const MIN_DISCOUNT = 15;
const MAX_DISCOUNT = 60;
const DISCOUNT_OPTIONS = [15, 20, 25, 30, 35, 40, 45, 50, 60];

const DEFAULT_REDEMPTION_INSTRUCTIONS = `1. Open the TDC App and navigate to the Offers section.
2. Browse Brand and select the Discount you want.
3. Save the discount offer in the app.
4. Visit the participating brand/store offering the discount.
5. Ask the staff to scan your TDC QR code to verify your discount.
6. Staff will verify your eligibility
7. Discount will be applied to your purchase`;

export default function Discount({ onOfferCreated }) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  // ── Brand name fetched from logged-in user (hidden from UI, but always sent to DB) ──
  const brandName =
    user?.brandName ||
    user?.businessName ||
    user?.companyName ||
    user?.name ||
    "";

  const [form, setForm] = useState({
    title: brandName, // hidden from UI but included in submit
    description: "",
    discountPercentage: "",
    category: "",
    redeemInstructions: DEFAULT_REDEMPTION_INSTRUCTIONS, // hidden from UI
    location: "",
    isOnline: false,
    isInStore: false,
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);

  // Sync brand name whenever the user becomes available (hidden from UI)
  useEffect(() => {
    if (brandName && form.title !== brandName) {
      setForm((prev) => ({ ...prev, title: brandName }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandName]);

  // Ensure redemption instructions always present (hidden from UI)
  useEffect(() => {
    if (!form.redeemInstructions || !form.redeemInstructions.trim()) {
      setForm((prev) => ({
        ...prev,
        redeemInstructions: DEFAULT_REDEMPTION_INSTRUCTIONS,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => logout();

  const validateForm = () => {
    const newErrors = {};
    let hasError = false;

    if (!form.title.trim()) {
      // Brand name is auto-filled, but warn if somehow missing
      newErrors.title = "Brand name could not be loaded. Please re-login.";
      hasError = true;
    }
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
      hasError = true;
    }
    if (!form.discountPercentage) {
      newErrors.discountPercentage = "Discount percentage is required";
      hasError = true;
    } else {
      const discount = parseInt(form.discountPercentage);
      if (isNaN(discount)) {
        newErrors.discountPercentage = "Please select a valid discount percentage";
        hasError = true;
      } else if (discount < MIN_DISCOUNT) {
        newErrors.discountPercentage = `Discount must be at least ${MIN_DISCOUNT}%`;
        hasError = true;
      } else if (discount > MAX_DISCOUNT) {
        newErrors.discountPercentage = `Discount cannot exceed ${MAX_DISCOUNT}%`;
        hasError = true;
      }
    }
    if (!form.category) {
      newErrors.category = "Category is required";
      hasError = true;
    }
    if (!image) {
      newErrors.image = "Brand Logo is required";
      hasError = true;
    }
    if (!form.location.trim()) {
      newErrors.location = "Store location is required";
      hasError = true;
    }
    if (!form.isOnline && !form.isInStore) {
      newErrors.availability = "Please select at least one availability option";
      hasError = true;
    }

    setErrors(newErrors);
    setShowErrorSummary(hasError);

    if (hasError) {
      const firstErrorField = document.querySelector(".error-text");
      if (firstErrorField) {
        setTimeout(() => {
          firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
    return newErrors;
  };

  const createOffer = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) return;

    const formData = new FormData();
    // Brand name auto-fetched and always sent to DB (hidden from UI)
    formData.append("title", (form.title || brandName).trim());
    formData.append("description", form.description.trim());
    formData.append("discountPercentage", form.discountPercentage);
    formData.append("category", form.category);
    // Redemption instructions auto-added and always sent (hidden from UI)
    formData.append(
      "redeemInstructions",
      form.redeemInstructions?.trim() || DEFAULT_REDEMPTION_INSTRUCTIONS
    );
    formData.append("location", form.location.trim());
    formData.append("isOnline", String(form.isOnline));
    formData.append("isInStore", String(form.isInStore));
    formData.append("image", image);

    try {
      setLoading(true);
      setUploadProgress(0);
      const token = localStorage.getItem("token");

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await axios.post(API_BASE_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(interval);
      setUploadProgress(100);
      setShowSuccess(true);

      if (onOfferCreated) {
        setTimeout(() => onOfferCreated(), 500);
      } else {
        setTimeout(() => navigate("/home"), 1500);
      }

      setTimeout(() => {
        setForm({
          title: brandName || "",
          description: "",
          discountPercentage: "",
          category: "",
          redeemInstructions: DEFAULT_REDEMPTION_INSTRUCTIONS,
          location: "",
          isOnline: false,
          isInStore: false,
        });
        setPreview(null);
        setImage(null);
        setShowSuccess(false);
        setUploadProgress(0);
        setErrors({});
        setShowErrorSummary(false);
      }, 3000);
    } catch (error) {
      console.error("Upload Error:", error.response?.data || error.message);
      toast(error.response?.data?.message || "Error creating Discount. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (file) => {
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setErrors({ ...errors, image: undefined });
    }
  };

  const handleInputChange = (id, value) => {
    setForm({ ...form, [id]: value });
    if (errors[id]) setErrors({ ...errors, [id]: undefined });
    if (showErrorSummary) {
      const remainingErrors = { ...errors };
      delete remainingErrors[id];
      if (Object.keys(remainingErrors).length === 0) setShowErrorSummary(false);
    }
  };

  const handleCheckboxChange = (id, value) => {
    setForm({ ...form, [id]: value });
    if (errors.availability) setErrors({ ...errors, availability: undefined });
    if (showErrorSummary) {
      const remainingErrors = { ...errors };
      delete remainingErrors.availability;
      if (Object.keys(remainingErrors).length === 0) setShowErrorSummary(false);
    }
  };

  const totalErrors = Object.keys(errors).length;

  const toggle = (key, label) => (
    <label className={`br-where${form[key] ? " on" : ""}`}>
      <input type="checkbox" checked={form[key]} onChange={(e) => handleCheckboxChange(key, e.target.checked)} />
      {label}
    </label>
  );

  return (
    <div className="br-pop" data-screen="first-discount">
      <div className="br-pop-body">
        <Pill tone="yellow"><img src={dotSorted} alt="" className="br-pop-dot" />no discount live yet</Pill>

        {showSuccess && (
          <div className="k-note ok k-row" role="status">
            <Ico kind="checkCircle" tone="plain" size={18} />
            <span><b>Discount Published!</b> Your discount offer is now live and visible to students.</span>
          </div>
        )}
        {showErrorSummary && totalErrors > 0 && (
          <div className="k-note bad k-row" role="alert">
            <Ico kind="alert" tone="plain" size={18} />
            <span style={{ flex: 1 }}><b>Please complete all required fields</b> {totalErrors} error{totalErrors > 1 ? "s" : ""} found.</span>
            <button type="button" className="k-icon-btn ghost sm" aria-label="hide" onClick={() => setShowErrorSummary(false)}><Ico kind="close" tone="plain" size={14} /></button>
          </div>
        )}
        {loading && <Progress value={uploadProgress} label={`${uploadProgress}% uploaded. Please wait...`} />}

        <Field label="brand logo" error={errors.image}>
          <label className={`k-drop br-logo-drop${errors.image ? " invalid" : ""}`}>
            {preview ? (
              <img src={preview} alt="Preview" className="br-drop-preview" />
            ) : (
              <span className="br-up-ico"><Ico kind="upload" tone="plain" size={22} /></span>
            )}
            <span>
              <b>{preview ? "change your logo" : "upload your logo"}</b>
              <span className="k-hint" style={{ display: "block" }}>PNG or JPG, up to 5MB</span>
            </span>
            <input type="file" style={{ display: "none" }} onChange={(e) => handleImageChange(e.target.files[0])} />
          </label>
          {preview && (
            <Button size="sm" variant="ghost" icon="close" onClick={() => { setPreview(null); setImage(null); }} style={{ alignSelf: "flex-start" }}>remove logo</Button>
          )}
        </Field>

        {errors.title && <div className="k-note bad">{errors.title}</div>}

        <Field label="what do students get?" htmlFor="fd-desc" error={errors.description}>
          <Textarea id="fd-desc" rows={3} invalid={!!errors.description} placeholder="e.g. 20% off everything on the menu, dine-in and takeaway." value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} />
        </Field>

        <div className="br-two">
          <Field label="category" htmlFor="fd-cat" error={errors.category}>
            <Select id="fd-cat" invalid={!!errors.category} value={form.category} onChange={(e) => handleInputChange("category", e.target.value)}>
              <option value="">select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
          </Field>
          <Field label="discount" error={errors.discountPercentage}>
            <div className="br-pcts" role="group" aria-label="discount percent">
              {DISCOUNT_OPTIONS.map((value) => (
                <button key={value} type="button" aria-pressed={String(form.discountPercentage) === String(value)} onClick={() => handleInputChange("discountPercentage", String(value))}>
                  {value}%
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="store location" htmlFor="fd-loc" error={errors.location}>
          <Input id="fd-loc" invalid={!!errors.location} placeholder="area, city (e.g. DHA Phase 6, Karachi)" value={form.location} onChange={(e) => handleInputChange("location", e.target.value)} />
        </Field>

        <fieldset className="br-fieldset">
          <legend className="k-label">where can they use it?</legend>
          <div className="k-row">
            {toggle("isInStore", "in-store")}
            {toggle("isOnline", "online")}
          </div>
          {errors.availability && <span className="k-error">{errors.availability}</span>}
        </fieldset>
      </div>

      <div className="br-pop-foot">
        <span className="k-hint">free for your first year. no commission.</span>
        <div className="k-row">
          <Button variant="ghost" icon="logout" onClick={handleLogout}>log out</Button>
          <Button size="lg" onClick={createOffer} loading={loading}>{loading ? "publishing..." : "publish discount"}</Button>
        </div>
      </div>
    </div>
  );
}
