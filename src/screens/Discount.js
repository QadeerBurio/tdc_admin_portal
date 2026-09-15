// Discount.jsx — Brand auto-fetch (hidden) + Auto-add to DB + Hidden redemption steps
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaCloudUploadAlt,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaAlignLeft,
  FaGlobe,
  FaStore,
  FaPercent,
  FaArrowRight,
  FaCheckCircle,
  FaImage,
  FaTimes,
  FaRocket,
  FaSpinner,
  FaShieldAlt,
  FaExclamationTriangle,
  FaSignOutAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";

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
  const [focusedField, setFocusedField] = useState(null);
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
      alert(error.response?.data?.message || "Error creating Discount. Please try again.");
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

  const isFocused = (field) => focusedField === field;
  const totalErrors = Object.keys(errors).length;

  return (
    <div style={styles.page}>
      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.successOverlay}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={styles.successModal}
            >
              <div style={styles.successIconWrapper}>
                <FaCheckCircle size={44} color="#059669" />
              </div>
              <h3 style={styles.successTitle}>Discount Published!</h3>
              <p style={styles.successDesc}>
                Your discount offer is now live and visible to students.
              </p>
              <div style={styles.successBadge}>✓ Ready to go</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <FaRocket size={16} />
            </div>
            <div>
              <h1 style={styles.mainTitle}>Create Discount</h1>
              <p style={styles.subTitle}>Launch a student offer in minutes</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerBadge}>
              <FaShieldAlt size={12} />
              <span>Secure</span>
            </div>
            <button className="logout-btn" style={styles.logoutBtn} onClick={handleLogout}>
              <FaSignOutAlt size={13} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {showErrorSummary && totalErrors > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={styles.errorBanner}
            >
              <div style={styles.errorBannerContent}>
                <FaExclamationTriangle size={18} color="#dc2626" />
                <div style={styles.errorBannerText}>
                  <strong>Please complete all required fields</strong>
                  <span>
                    {totalErrors} error{totalErrors > 1 ? "s" : ""} found.
                  </span>
                </div>
                <button
                  style={styles.errorBannerClose}
                  onClick={() => setShowErrorSummary(false)}
                >
                  <FaTimes size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={styles.progressContainer}
          >
            <div style={styles.progressBar}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                style={{ ...styles.progressFill, width: `${uploadProgress}%` }}
              />
            </div>
            <div style={styles.progressInfo}>
              <span>{uploadProgress}% uploaded</span>
              <span>Please wait...</span>
            </div>
          </motion.div>
        )}

        {/* Form body */}
        <div style={styles.formWrapper}>
          <div style={styles.formMain}>
            {/* Upload */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <FaImage size={11} style={styles.labelIcon} />
                Brand Logo <span style={styles.required}>*</span>
              </label>
              {preview ? (
                <div
                  style={{
                    ...styles.imagePreviewWrapper,
                    borderColor: errors.image ? "#ef4444" : "#e2e8f0",
                  }}
                >
                  <img src={preview} alt="Preview" style={styles.imagePreview} />
                  <button
                    style={styles.removeImageBtn}
                    onClick={() => {
                      setPreview(null);
                      setImage(null);
                    }}
                  >
                    <FaTimes size={13} />
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    ...styles.uploadBox,
                    borderColor: errors.image ? "#ef4444" : "#e2e8f0",
                  }}
                >
                  <input
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => handleImageChange(e.target.files[0])}
                  />
                  <div style={styles.uploadIconWrap}>
                    <FaCloudUploadAlt
                      size={24}
                      color={errors.image ? "#ef4444" : "#f59e0b"}
                    />
                  </div>
                  <p style={styles.uploadText}>Click to upload brand image</p>
                  <p style={styles.uploadHint}>PNG or JPG · up to 5MB</p>
                </label>
              )}
              {errors.image && <p style={styles.errorText}>{errors.image}</p>}
            </div>

            {/* ⛔ Brand Name field is NOT shown — auto-fetched and auto-sent to DB */}

            {/* Description */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <FaAlignLeft size={11} style={styles.labelIcon} />
                Description <span style={styles.required}>*</span>
              </label>
              <textarea
                style={{
                  ...styles.textarea,
                  borderColor: errors.description
                    ? "#ef4444"
                    : isFocused("description")
                    ? "#f59e0b"
                    : "#e2e8f0",
                }}
                placeholder="Describe your discount in detail..."
                rows={3}
                value={form.description}
                onFocus={() => setFocusedField("description")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
              {errors.description && <p style={styles.errorText}>{errors.description}</p>}
            </div>

            {/* Category + Discount */}
            <div style={styles.row}>
              <div style={{ ...styles.fieldGroup, flex: 2 }}>
                <label style={styles.label}>
                  <FaLayerGroup size={11} style={styles.labelIcon} />
                  Category <span style={styles.required}>*</span>
                </label>
                <select
                  style={{
                    ...styles.select,
                    borderColor: errors.category
                      ? "#ef4444"
                      : isFocused("category")
                      ? "#f59e0b"
                      : "#e2e8f0",
                  }}
                  value={form.category}
                  onFocus={() => setFocusedField("category")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p style={styles.errorText}>{errors.category}</p>}
              </div>

              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.label}>
                  <FaPercent size={11} style={styles.labelIcon} />
                  Discount <span style={styles.required}>*</span>
                </label>
                <select
                  style={{
                    ...styles.select,
                    borderColor: errors.discountPercentage
                      ? "#ef4444"
                      : isFocused("discount")
                      ? "#f59e0b"
                      : "#e2e8f0",
                  }}
                  value={form.discountPercentage}
                  onFocus={() => setFocusedField("discount")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleInputChange("discountPercentage", e.target.value)
                  }
                >
                  <option value="">Select %</option>
                  {DISCOUNT_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}%
                    </option>
                  ))}
                </select>
                {errors.discountPercentage && (
                  <p style={styles.errorText}>{errors.discountPercentage}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <FaMapMarkerAlt size={11} style={styles.labelIcon} />
                Store Location <span style={styles.required}>*</span>
              </label>
              <input
                style={{
                  ...styles.input,
                  borderColor: errors.location
                    ? "#ef4444"
                    : isFocused("location")
                    ? "#f59e0b"
                    : "#e2e8f0",
                }}
                placeholder="City, address, or area"
                value={form.location}
                onFocus={() => setFocusedField("location")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
              {errors.location && <p style={styles.errorText}>{errors.location}</p>}
            </div>

            {/* Availability */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                <FaGlobe size={11} style={styles.labelIcon} />
                Availability <span style={styles.required}>*</span>
              </label>
              <div
                style={{
                  ...styles.checkboxGroup,
                  borderColor: errors.availability ? "#ef4444" : "transparent",
                  border: errors.availability ? "1.5px solid #ef4444" : "none",
                  borderRadius: "10px",
                  padding: errors.availability ? "10px" : "0",
                }}
              >
                <label
                  style={{
                    ...styles.checkboxLabel,
                    background: form.isOnline ? "#fef3c7" : "#f8fafc",
                    borderColor: form.isOnline ? "#f59e0b" : "#e2e8f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.isOnline}
                    onChange={(e) => handleCheckboxChange("isOnline", e.target.checked)}
                  />
                  <FaGlobe size={12} color={form.isOnline ? "#b45309" : "#94a3b8"} />
                  Online
                </label>
                <label
                  style={{
                    ...styles.checkboxLabel,
                    background: form.isInStore ? "#fef3c7" : "#f8fafc",
                    borderColor: form.isInStore ? "#f59e0b" : "#e2e8f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.isInStore}
                    onChange={(e) => handleCheckboxChange("isInStore", e.target.checked)}
                  />
                  <FaStore size={12} color={form.isInStore ? "#b45309" : "#94a3b8"} />
                  In-Store
                </label>
              </div>
              {errors.availability && (
                <p style={styles.errorText}>{errors.availability}</p>
              )}
            </div>

            {/* Hidden: title (brand name) & redeemInstructions stay in state and are auto-sent */}

            <button
              style={{ ...styles.submitBtn, opacity: loading ? 0.65 : 1 }}
              onClick={createOffer}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner style={styles.spinnerIcon} className="spin" />
                  Publishing...
                </>
              ) : (
                <>
                  Publish Discount
                  <FaArrowRight style={styles.btnArrow} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          .spin { animation: spin 0.8s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          input:focus, select:focus, textarea:focus { outline: none; }
          input[type="checkbox"] {
            width: 15px; height: 15px;
            accent-color: #f59e0b; cursor: pointer;
          }
          button { cursor: pointer; font-family: inherit; }
          .error-text { animation: shake 0.3s ease; }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .logout-btn { transition: all 0.2s ease !important; }
          .logout-btn:hover {
            background-color: #dc2626 !important;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3) !important;
          }
          @media (max-width: 640px) {
            .logout-text { display: none; }
          }
        `}
      </style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STYLES
   ───────────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    padding: "20px 14px 40px",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    justifyContent: "center",
  },
  container: {
    maxWidth: "720px",
    width: "100%",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow:
      "0 1px 3px rgba(15,23,42,0.04), 0 12px 32px rgba(15,23,42,0.06)",
    overflow: "hidden",
    border: "1px solid #eef2f7",
    alignSelf: "flex-start",
  },

  /* Success overlay */
  successOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  },
  successModal: {
    background: "#ffffff",
    padding: "32px 28px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
    maxWidth: "360px",
    width: "100%",
  },
  successIconWrapper: {
    width: "68px",
    height: "68px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
  },
  successTitle: {
    fontSize: "19px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 6px",
    letterSpacing: "-0.2px",
  },
  successDesc: {
    fontSize: "13.5px",
    color: "#64748b",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  successBadge: {
    display: "inline-block",
    background: "#ecfdf5",
    color: "#059669",
    padding: "5px 16px",
    borderRadius: "100px",
    fontSize: "12.5px",
    fontWeight: 600,
  },

  /* Header */
  header: {
    padding: "18px 24px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    background: "#ffffff",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerRight: { display: "flex", alignItems: "center", gap: "10px" },
  headerIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#b45309",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(245,158,11,0.18)",
  },
  mainTitle: {
    fontSize: "16.5px",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.2px",
  },
  subTitle: {
    fontSize: "12.5px",
    color: "#94a3b8",
    margin: "1px 0 0",
    fontWeight: 500,
  },
  headerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11.5px",
    color: "#059669",
    background: "#ecfdf5",
    padding: "5px 11px",
    borderRadius: "100px",
    fontWeight: 600,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    background: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "9px",
    fontSize: "12.5px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(239,68,68,0.22)",
  },

  /* Error banner */
  errorBanner: {
    margin: "14px 24px 0",
    padding: "12px 14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderLeft: "3px solid #ef4444",
    borderRadius: "10px",
  },
  errorBannerContent: { display: "flex", alignItems: "center", gap: "10px" },
  errorBannerText: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    fontSize: "12.5px",
    color: "#991b1b",
    lineHeight: 1.4,
  },
  errorBannerClose: {
    background: "transparent",
    border: "none",
    color: "#991b1b",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
  },

  /* Progress */
  progressContainer: {
    padding: "12px 24px",
    background: "#fafbfc",
    borderBottom: "1px solid #f1f5f9",
  },
  progressBar: {
    height: "4px",
    background: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "6px",
    fontSize: "11.5px",
    color: "#94a3b8",
    fontWeight: 500,
  },

  /* Form */
  formWrapper: { padding: "24px" },
  formMain: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "#334155",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    letterSpacing: "0.1px",
  },
  labelIcon: { color: "#94a3b8" },
  required: { color: "#ef4444", fontSize: "13px", marginLeft: "1px" },

  input: {
    padding: "10px 12px",
    fontSize: "13.5px",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "9px",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    fontWeight: 500,
  },
  textarea: {
    padding: "10px 12px",
    fontSize: "13.5px",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "9px",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    resize: "vertical",
    width: "100%",
    boxSizing: "border-box",
    lineHeight: 1.55,
    minHeight: "80px",
    fontWeight: 500,
  },
  select: {
    padding: "10px 12px",
    fontSize: "13.5px",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "9px",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    appearance: "auto",
    fontWeight: 500,
  },
  errorText: {
    fontSize: "11.5px",
    color: "#ef4444",
    margin: "2px 0 0",
    fontWeight: 600,
  },
  row: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" },

  checkboxGroup: { display: "flex", gap: "8px" },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "8px 14px",
    borderRadius: "9px",
    fontSize: "12.5px",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
    border: "1.5px solid #e2e8f0",
    transition: "all 0.2s ease",
    background: "#f8fafc",
  },

  uploadBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "22px 16px",
    border: "2px dashed #e2e8f0",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "#fafbfc",
    gap: "4px",
  },
  uploadIconWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "4px",
  },
  uploadText: { fontSize: "13px", color: "#475569", margin: 0, fontWeight: 600 },
  uploadHint: { fontSize: "11.5px", color: "#94a3b8", margin: 0, fontWeight: 500 },

  imagePreviewWrapper: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1.5px solid #e2e8f0",
  },
  imagePreview: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    display: "block",
  },
  removeImageBtn: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "rgba(15,23,42,0.65)",
    color: "#ffffff",
    border: "none",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  },

  submitBtn: {
    padding: "12px 22px",
    background: "linear-gradient(135deg, #f59e0b 0%, #e6b800 100%)",
    color: "#0a0e1a",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
    marginTop: "6px",
    width: "100%",
    letterSpacing: "0.2px",
    boxShadow:
      "0 8px 22px rgba(245,158,11,0.35), inset 0 -2px 0 rgba(0,0,0,0.08)",
  },
  btnArrow: { fontSize: "13px" },
  spinnerIcon: { fontSize: "15px" },
};