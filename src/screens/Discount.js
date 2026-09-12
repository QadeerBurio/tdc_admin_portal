import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaCloudUploadAlt,
  FaTag,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaAlignLeft,
  FaGlobe,
  FaStore,
  FaPercent,
  FaArrowRight,
  FaCheckCircle,
  FaImage,
  FaInfoCircle,
  FaTimes,
  FaRocket,
  FaSpinner,
  FaShieldAlt,
  FaClock,
  FaBuilding,
  FaExclamationTriangle,
  FaSignOutAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";

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
  const { logout } = useContext(AuthContext);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountPercentage: "",
    category: "",
    redeemInstructions: DEFAULT_REDEMPTION_INSTRUCTIONS,
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

  const handleLogout = () => {
    logout();
  };

  const validateForm = () => {
    const newErrors = {};
    let hasError = false;

    if (!form.title.trim()) {
      newErrors.title = "Brand name is required";
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
        newErrors.discountPercentage = `Discount must be at least ${MIN_DISCOUNT}% (Current: ${discount}%)`;
        hasError = true;
      } else if (discount > MAX_DISCOUNT) {
        newErrors.discountPercentage = `Discount cannot exceed ${MAX_DISCOUNT}% (Current: ${discount}%)`;
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
      newErrors.availability = "Please select at least one availability option (Online or In-Store)";
      hasError = true;
    }

    if (!form.redeemInstructions.trim()) {
      newErrors.redeemInstructions = "Redemption instructions are required";
      hasError = true;
    }

    setErrors(newErrors);
    setShowErrorSummary(hasError);
    
    if (hasError) {
      const firstErrorField = document.querySelector('.error-text');
      if (firstErrorField) {
        setTimeout(() => {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
    
    return newErrors;
  };

  const createOffer = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("discountPercentage", form.discountPercentage);
    formData.append("category", form.category);
    formData.append("redeemInstructions", form.redeemInstructions.trim());
    formData.append("location", form.location.trim());
    formData.append("isOnline", String(form.isOnline));
    formData.append("isInStore", String(form.isInStore));
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

      clearInterval(interval);
      setUploadProgress(100);
      setShowSuccess(true);

      if (onOfferCreated) {
        setTimeout(() => {
          onOfferCreated();
        }, 500);
      } else {
        setTimeout(() => {
          navigate("/home");
        }, 1500);
      }

      setTimeout(() => {
        setForm({
          title: "", description: "", discountPercentage: "", category: "",
          redeemInstructions: DEFAULT_REDEMPTION_INSTRUCTIONS,
          location: "", isOnline: false, isInStore: false
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
    if (errors[id]) {
      setErrors({ ...errors, [id]: undefined });
    }
    if (showErrorSummary) {
      const remainingErrors = { ...errors };
      delete remainingErrors[id];
      if (Object.keys(remainingErrors).length === 0) {
        setShowErrorSummary(false);
      }
    }
  };

  const handleCheckboxChange = (id, value) => {
    setForm({ ...form, [id]: value });
    if (errors.availability) {
      setErrors({ ...errors, availability: undefined });
    }
    if (showErrorSummary) {
      const remainingErrors = { ...errors };
      delete remainingErrors.availability;
      if (Object.keys(remainingErrors).length === 0) {
        setShowErrorSummary(false);
      }
    }
  };

  const isFocused = (field) => focusedField === field;
  const totalErrors = Object.keys(errors).length;

  return (
    <div style={styles.container}>
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
                <FaCheckCircle size={48} color="#059669" />
              </div>
              <h3 style={styles.successTitle}>Discount Published!</h3>
              <p style={styles.successDesc}>Your discount offer is now live and visible to students.</p>
              <div style={styles.successBadge}>✓ Ready to go</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showErrorSummary && totalErrors > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={styles.errorBanner}
          >
            <div style={styles.errorBannerContent}>
              <FaExclamationTriangle size={20} color="#dc2626" />
              <div style={styles.errorBannerText}>
                <strong>Please complete all required fields</strong>
                <span>{totalErrors} error{totalErrors > 1 ? 's' : ''} found. Please fix them to continue.</span>
              </div>
              <button 
                style={styles.errorBannerClose}
                onClick={() => setShowErrorSummary(false)}
              >
                <FaTimes size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaRocket size={18} />
          </div>
          <div>
            <h1 style={styles.mainTitle}>Discount</h1>
            <p style={styles.subTitle}>Launch a student discount in minutes</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.headerBadge}>
            <FaShieldAlt size={14} />
            <span>Secure</span>
          </div>
          <button 
            style={styles.logoutBtn} 
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FaSignOutAlt size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>

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

      <div style={styles.formWrapper}>
        <div style={styles.formMain}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Brand Logo <span style={styles.required}>*</span>
            </label>
            {preview ? (
              <div style={{ ...styles.imagePreviewWrapper, borderColor: errors.image ? '#ef4444' : '#e2e8f0' }}>
                <img src={preview} alt="Preview" style={styles.imagePreview} />
                <button style={styles.removeImageBtn} onClick={() => { setPreview(null); setImage(null); }}>
                  <FaTimes size={14} />
                </button>
              </div>
            ) : (
              <label style={{ ...styles.uploadBox, borderColor: errors.image ? '#ef4444' : '#e2e8f0' }}>
                <input type="file" style={{ display: "none" }} onChange={(e) => handleImageChange(e.target.files[0])} />
                <FaCloudUploadAlt size={28} color={errors.image ? '#ef4444' : '#94a3b8'} />
                <p style={styles.uploadText}>Upload Brand image</p>
                <p style={styles.uploadHint}>PNG, JPG up to 5MB</p>
              </label>
            )}
            {errors.image && <p style={styles.errorText}>{errors.image}</p>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Brand Name <span style={styles.required}>*</span>
            </label>
            <input
              style={{
                ...styles.input,
                borderColor: errors.title ? '#ef4444' : isFocused('title') ? '#f59e0b' : '#e2e8f0',
              }}
              placeholder="Enter brand name"
              value={form.title}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />
            {errors.title && <p style={styles.errorText}>{errors.title}</p>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Description <span style={styles.required}>*</span>
            </label>
            <textarea
              style={{
                ...styles.textarea,
                borderColor: errors.description ? '#ef4444' : isFocused('description') ? '#f59e0b' : '#e2e8f0',
              }}
              placeholder="Describe your Discount in detail..."
              rows={3}
              value={form.description}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
            {errors.description && <p style={styles.errorText}>{errors.description}</p>}
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.fieldGroup, flex: 2 }}>
              <label style={styles.label}>
                Category <span style={styles.required}>*</span>
              </label>
              <select
                style={{
                  ...styles.select,
                  borderColor: errors.category ? '#ef4444' : isFocused('category') ? '#f59e0b' : '#e2e8f0',
                }}
                value={form.category}
                onFocus={() => setFocusedField('category')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => handleInputChange("category", e.target.value)}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p style={styles.errorText}>{errors.category}</p>}
            </div>

            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>
                Discount % <span style={styles.required}>*</span>
              </label>
              <select
                style={{
                  ...styles.select,
                  borderColor: errors.discountPercentage ? '#ef4444' : isFocused('discount') ? '#f59e0b' : '#e2e8f0',
                  paddingRight: "30px",
                }}
                value={form.discountPercentage}
                onFocus={() => setFocusedField('discount')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => handleInputChange("discountPercentage", e.target.value)}
              >
                <option value="">Select %</option>
                {DISCOUNT_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}%</option>
                ))}
              </select>
              {/* <div style={styles.discountPolicy}>
                <span style={styles.policyIcon}>ℹ️</span>
                <span style={styles.policyText}>
                  Must <strong>{MIN_DISCOUNT}%</strong> to <strong>{MAX_DISCOUNT}%</strong>
                </span>
              </div> */}
              {errors.discountPercentage && <p style={styles.errorText}>{errors.discountPercentage}</p>}
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Store Location <span style={styles.required}>*</span>
            </label>
            <input
              style={{
                ...styles.input,
                borderColor: errors.location ? '#ef4444' : isFocused('location') ? '#f59e0b' : '#e2e8f0',
              }}
              placeholder="City, address, or area"
              value={form.location}
              onFocus={() => setFocusedField('location')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => handleInputChange("location", e.target.value)}
            />
            {errors.location && <p style={styles.errorText}>{errors.location}</p>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Availability <span style={styles.required}>*</span>
            </label>
            <div style={{ ...styles.checkboxGroup, borderColor: errors.availability ? '#ef4444' : 'transparent', border: errors.availability ? '1.5px solid #ef4444' : 'none', borderRadius: '8px', padding: errors.availability ? '10px' : '0' }}>
              <label style={{ ...styles.checkboxLabel, background: form.isOnline ? '#fef3c7' : '#f8fafc' }}>
                <input
                  type="checkbox"
                  checked={form.isOnline}
                  onChange={(e) => handleCheckboxChange("isOnline", e.target.checked)}
                />
                <FaGlobe size={14} color={form.isOnline ? '#f59e0b' : '#94a3b8'} />
                Online
              </label>
              <label style={{ ...styles.checkboxLabel, background: form.isInStore ? '#fef3c7' : '#f8fafc' }}>
                <input
                  type="checkbox"
                  checked={form.isInStore}
                  onChange={(e) => handleCheckboxChange("isInStore", e.target.checked)}
                />
                <FaStore size={14} color={form.isInStore ? '#f59e0b' : '#94a3b8'} />
                In-Store
              </label>
            </div>
            {errors.availability && <p style={styles.errorText}>{errors.availability}</p>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Redemption Instructions <span style={styles.required}>*</span>
            </label>
            <textarea
              style={{
                ...styles.textarea,
                borderColor: errors.redeemInstructions ? '#ef4444' : isFocused('instructions') ? '#f59e0b' : '#e2e8f0',
                minHeight: '100px',
              }}
              placeholder="How can students redeem this Discount?"
              rows={4}
              value={form.redeemInstructions}
              onFocus={() => setFocusedField('instructions')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => handleInputChange("redeemInstructions", e.target.value)}
            />
            {errors.redeemInstructions && <p style={styles.errorText}>{errors.redeemInstructions}</p>}
          </div>

          <button
            style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }}
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

      <style>
        {`
          .spin {
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          input:focus, select:focus, textarea:focus {
            outline: none;
          }
          input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #f59e0b;
            cursor: pointer;
          }
          button {
            cursor: pointer;
          }
          .error-text {
            animation: shake 0.3s ease;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            75% { transform: translateX(6px); }
          }
          .logout-btn {
            transition: all 0.2s ease !important;
          }
          .logout-btn:hover {
            background-color: #dc2626 !important;
            transform: scale(1.02) !important;
          }
          
          /* Mobile responsive styles */
          @media (max-width: 768px) {
            .container {
              margin: 10px !important;
              border-radius: 8px !important;
            }
            .formWrapper {
              padding: 16px !important;
            }
            .row {
              grid-template-columns: 1fr 1fr !important;
              gap: 10px !important;
            }
            .header {
              padding: 14px 16px !important;
            }
            .headerRight {
              gap: 8px !important;
            }
            .headerBadge {
              display: none !important;
            }
            .mainTitle {
              font-size: 16px !important;
            }
            .subTitle {
              font-size: 12px !important;
            }
            .errorBanner {
              margin: 0 12px !important;
            }
            select {
              font-size: 14px !important;
            }
          }
          
          @media (max-width: 480px) {
            .container {
              margin: 0 !important;
              border-radius: 0 !important;
            }
            .formWrapper {
              padding: 12px !important;
            }
            .row {
              grid-template-columns: 1fr !important;
            }
            .formMain {
              gap: 14px !important;
            }
            .header {
              padding: 10px 12px !important;
            }
            .headerLeft {
              gap: 8px !important;
            }
            .headerIcon {
              width: 28px !important;
              height: 28px !important;
              font-size: 12px !important;
            }
            .mainTitle {
              font-size: 15px !important;
            }
            .subTitle {
              font-size: 11px !important;
            }
            .successModal {
              padding: 20px !important;
            }
            .successTitle {
              font-size: 18px !important;
            }
            .checkboxGroup {
              flex-direction: column !important;
              gap: 6px !important;
            }
            .checkboxLabel {
              padding: 8px 12px !important;
              font-size: 12px !important;
            }
            .errorBanner {
              margin: 0 8px !important;
              padding: 8px 12px !important;
            }
            .errorBannerContent {
              flex-wrap: wrap !important;
              gap: 6px !important;
            }
            .errorBannerText {
              font-size: 12px !important;
            }
            .logoutBtn {
              padding: 4px 8px !important;
              font-size: 11px !important;
            }
            .logoutBtn span {
              display: none !important;
            }
            .headerRight {
              gap: 4px !important;
            }
            select {
              font-size: 13px !important;
              padding: 8px 10px !important;
            }
            input, textarea {
              font-size: 13px !important;
              padding: 8px 10px !important;
            }
            .label {
              font-size: 12px !important;
            }
            .discountPolicy {
              font-size: 10px !important;
              padding: 3px 8px !important;
            }
            .uploadBox {
              padding: 16px !important;
            }
            .uploadText {
              font-size: 12px !important;
            }
            .uploadHint {
              font-size: 10px !important;
            }
            .imagePreview {
              height: 120px !important;
            }
            .submitBtn {
              padding: 8px 16px !important;
              font-size: 13px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    width: "100%",
    margin: "20px auto",
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
    overflow: "hidden",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  successOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  successModal: {
    background: "#ffffff",
    padding: "32px 40px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    maxWidth: "380px",
    width: "90%",
  },
  successIconWrapper: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#ecfdf5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  successTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 6px 0",
  },
  successDesc: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 16px 0",
    lineHeight: "1.5",
  },
  successBadge: {
    display: "inline-block",
    background: "#ecfdf5",
    color: "#059669",
    padding: "4px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
  },
  errorBanner: {
    margin: "0 28px",
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "8px",
    marginTop: "16px",
  },
  errorBannerContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  errorBannerText: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    fontSize: "14px",
    color: "#991b1b",
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
  },
  header: {
    padding: "20px 28px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f59e0b",
    fontSize: "16px",
    flexShrink: 0,
  },
  mainTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  subTitle: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: "1px 0 0 0",
  },
  headerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "4px 12px",
    borderRadius: "20px",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    background: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  progressContainer: {
    padding: "12px 28px",
    background: "#fafbfc",
    borderBottom: "1px solid #f1f5f9",
  },
  progressBar: {
    height: "3px",
    background: "#e2e8f0",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#f59e0b",
    borderRadius: "2px",
    transition: "width 0.5s ease",
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "6px",
    fontSize: "12px",
    color: "#94a3b8",
  },
  formWrapper: {
    padding: "28px",
    background: "#ffffff",
    maxWidth: "700px",
    margin: "0 auto",
  },
  formMain: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  required: {
    color: "#ef4444",
    fontSize: "14px",
  },
  input: {
    padding: "9px 12px",
    fontSize: "14px",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "9px 12px",
    fontSize: "14px",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    resize: "vertical",
    width: "100%",
    boxSizing: "border-box",
    lineHeight: "1.6",
    minHeight: "80px",
  },
  select: {
    padding: "9px 12px",
    fontSize: "14px",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    appearance: "auto",
  },
  errorText: {
    fontSize: "12px",
    color: "#ef4444",
    margin: "2px 0 0 0",
    fontWeight: "500",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "14px",
  },
  discountPolicy: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
    fontSize: "12px",
    color: "#64748b",
    background: "#f8fafc",
    padding: "4px 10px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  policyIcon: {
    fontSize: "12px",
  },
  policyText: {
    fontSize: "8px",
    color: "#475569",
  },
  checkboxGroup: {
    display: "flex",
    gap: "10px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
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
    padding: "24px",
    border: "2px dashed #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "#fafbfc",
    gap: "2px",
  },
  uploadText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  uploadHint: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
  },
  imagePreviewWrapper: {
    position: "relative",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1.5px solid #e2e8f0",
  },
  imagePreview: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    display: "block",
  },
  removeImageBtn: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "rgba(0,0,0,0.6)",
    color: "#ffffff",
    border: "none",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  submitBtn: {
    padding: "10px 24px",
    background: "#f59e0b",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    marginTop: "4px",
    width: "100%",
  },
  btnArrow: {
    fontSize: "14px",
  },
  spinnerIcon: {
    fontSize: "16px",
  },
};