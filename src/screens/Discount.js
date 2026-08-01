import React, { useState } from "react";
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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

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

// Discount policy constants
const MIN_DISCOUNT = 15;
const MAX_DISCOUNT = 50;

const DEFAULT_REDEMPTION_INSTRUCTIONS = `1. Open the TDC App and navigate to the Offers section.
2. Browse Brand and select the offer you want.
3. Save the discount offer in the app.
4. Visit the participating brand/store offering the discount.
5. Show your TDC Card or Student ID Card to the staff before making the payment.
6. The store staff will verify your eligibility for the offer.
7. Once verified, the discount will be applied, and you can redeem the offer successfully.`;

export default function Discount({ onOfferCreated }) {
  const navigate = useNavigate();
  
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

  const validateForm = () => {
    const newErrors = {};
    let hasError = false;

    // Brand Name validation
    if (!form.title.trim()) {
      newErrors.title = "Brand name is required";
      hasError = true;
    }

    // Description validation
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
      hasError = true;
    }

    // Discount Percentage validation
    if (!form.discountPercentage) {
      newErrors.discountPercentage = "Discount percentage is required";
      hasError = true;
    } else {
      const discount = parseInt(form.discountPercentage);
      if (isNaN(discount)) {
        newErrors.discountPercentage = "Please enter a valid number";
        hasError = true;
      } else if (discount < MIN_DISCOUNT) {
        newErrors.discountPercentage = `Discount must be at least ${MIN_DISCOUNT}% (Current: ${discount}%)`;
        hasError = true;
      } else if (discount > MAX_DISCOUNT) {
        newErrors.discountPercentage = `Discount cannot exceed ${MAX_DISCOUNT}% (Current: ${discount}%)`;
        hasError = true;
      }
    }

    // Category validation
    if (!form.category) {
      newErrors.category = "Category is required";
      hasError = true;
    }

    // Image validation
    if (!image) {
      newErrors.image = "Offer image is required";
      hasError = true;
    }

    // Location validation
    if (!form.location.trim()) {
      newErrors.location = "Store location is required";
      hasError = true;
    }

    // Availability validation - at least one must be selected
    if (!form.isOnline && !form.isInStore) {
      newErrors.availability = "Please select at least one availability option (Online or In-Store)";
      hasError = true;
    }

    // Redemption Instructions validation
    if (!form.redeemInstructions.trim()) {
      newErrors.redeemInstructions = "Redemption instructions are required";
      hasError = true;
    }

    setErrors(newErrors);
    setShowErrorSummary(hasError);
    
    if (hasError) {
      // Scroll to first error
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

      // Call the callback prop if provided (for modal usage)
      if (onOfferCreated) {
        setTimeout(() => {
          onOfferCreated();
        }, 500);
      } else {
        // If not in modal, navigate to home after success
        setTimeout(() => {
          navigate("/home");
        }, 1500);
      }

      // Reset form after success
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
      alert(error.response?.data?.message || "Error creating offer. Please try again.");
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
    // Clear error summary when user starts fixing errors
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

  // Count total errors
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
              <h3 style={styles.successTitle}>Offer Published!</h3>
              <p style={styles.successDesc}>Your discount offer is now live and visible to students.</p>
              <div style={styles.successBadge}>✓ Ready to go</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Summary Banner */}
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

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaRocket size={18} />
          </div>
          <div>
            <h1 style={styles.mainTitle}>New Offer</h1>
            <p style={styles.subTitle}>Launch a student discount in minutes</p>
          </div>
        </div>
        <div style={styles.headerBadge}>
          <FaShieldAlt size={14} />
          <span>Secure</span>
        </div>
      </div>

      {/* Progress Bar */}
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

      {/* Main Form */}
      <div style={styles.formGrid}>
        <div style={styles.formMain}>
          {/* Image Upload */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Offer Image <span style={styles.required}>*</span>
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
                <p style={styles.uploadText}>Upload offer image</p>
                <p style={styles.uploadHint}>PNG, JPG up to 5MB</p>
              </label>
            )}
            {errors.image && <p style={styles.errorText}>{errors.image}</p>}
          </div>

          {/* Brand Name */}
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

          {/* Description */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Description <span style={styles.required}>*</span>
            </label>
            <textarea
              style={{
                ...styles.textarea,
                borderColor: errors.description ? '#ef4444' : isFocused('description') ? '#f59e0b' : '#e2e8f0',
              }}
              placeholder="Describe your offer in detail..."
              rows={3}
              value={form.description}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
            {errors.description && <p style={styles.errorText}>{errors.description}</p>}
          </div>

          {/* Category & Discount */}
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
              <div style={styles.discountWrapper}>
                <input
                  type="number"
                  style={{
                    ...styles.input,
                    borderColor: errors.discountPercentage ? '#ef4444' : isFocused('discount') ? '#f59e0b' : '#e2e8f0',
                  }}
                  placeholder={`${MIN_DISCOUNT}-${MAX_DISCOUNT}`}
                  value={form.discountPercentage}
                  min={MIN_DISCOUNT}
                  max={MAX_DISCOUNT}
                  onFocus={() => setFocusedField('discount')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => handleInputChange("discountPercentage", e.target.value)}
                />
                <span style={styles.discountSuffix}>%</span>
              </div>
              <div style={styles.discountPolicy}>
                <span style={styles.policyIcon}>ℹ️</span>
                <span style={styles.policyText}>
                  Must be between <strong>{MIN_DISCOUNT}%</strong> and <strong>{MAX_DISCOUNT}%</strong>
                </span>
              </div>
              {errors.discountPercentage && <p style={styles.errorText}>{errors.discountPercentage}</p>}
            </div>
          </div>

          {/* Location */}
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

          {/* Availability */}
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

          {/* Redemption Instructions */}
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
              placeholder="How can students redeem this offer?"
              rows={4}
              value={form.redeemInstructions}
              onFocus={() => setFocusedField('instructions')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => handleInputChange("redeemInstructions", e.target.value)}
            />
            {errors.redeemInstructions && <p style={styles.errorText}>{errors.redeemInstructions}</p>}
          </div>

          {/* Submit */}
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
                Publish Offer
                <FaArrowRight style={styles.btnArrow} />
              </>
            )}
          </button>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Preview Card */}
          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <span>Preview</span>
            </div>
            <div style={styles.previewBody}>
              <div style={styles.previewBadge}>
                {form.discountPercentage || '0'}% OFF
              </div>
              <p style={styles.previewTitle}>
                {form.title || 'Brand Name'}
              </p>
              <p style={styles.previewCategory}>
                {form.category || 'Category'}
              </p>
              <div style={styles.previewTags}>
                {form.isOnline && <span style={styles.previewTag}>🌐 Online</span>}
                {form.isInStore && <span style={styles.previewTag}>🏪 In-Store</span>}
              </div>
              {!form.isOnline && !form.isInStore && (
                <p style={styles.previewEmpty}>Select availability</p>
              )}
            </div>
          </div>

          {/* Policy Card */}
          <div style={styles.policyCard}>
            <div style={styles.policyCardHeader}>
              <FaShieldAlt size={16} color="#f59e0b" />
              <span style={styles.policyCardTitle}>Discount Policy</span>
            </div>
            <ul style={styles.policyCardList}>
              <li>Minimum discount: <strong>{MIN_DISCOUNT}%</strong></li>
              <li>Maximum discount: <strong>{MAX_DISCOUNT}%</strong></li>
              <li>Offers must provide meaningful student savings</li>
              <li>All discounts are verified before publishing</li>
            </ul>
          </div>

          {/* Tips */}
          <div style={styles.tipsCard}>
            <p style={styles.tipsTitle}>💡 Tips</p>
            <ul style={styles.tipsList}>
              <li>Use a clear brand name</li>
              <li>Add a compelling description</li>
              <li>Upload a quality image</li>
              <li>Choose the right category</li>
              <li>Provide clear redemption instructions</li>
            </ul>
          </div>

          {/* Info */}
          <div style={styles.infoCard}>
            <FaShieldAlt size={16} color="#f59e0b" />
            <p style={styles.infoText}>Visible to all students instantly</p>
          </div>
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
        `}
      </style>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "980px",
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
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
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
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.6fr",
    gap: "28px",
    padding: "28px",
    background: "#ffffff",
  },
  formMain: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
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
  discountWrapper: {
    position: "relative",
  },
  discountSuffix: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    color: "#94a3b8",
    fontWeight: "500",
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
    fontSize: "12px",
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
  previewCard: {
    background: "#ffffff",
    border: "1px solid #f1f5f9",
    borderRadius: "8px",
    overflow: "hidden",
  },
  previewHeader: {
    padding: "10px 14px",
    background: "#fafbfc",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "12px",
    fontWeight: "500",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  previewBody: {
    padding: "14px",
  },
  previewBadge: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#d97706",
    padding: "2px 10px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "6px",
  },
  previewTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 2px 0",
  },
  previewCategory: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
  },
  previewTags: {
    display: "flex",
    gap: "6px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  previewTag: {
    fontSize: "11px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 10px",
    borderRadius: "4px",
  },
  previewEmpty: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "8px 0 0 0",
    fontStyle: "italic",
  },
  policyCard: {
    background: "#fef3c7",
    padding: "14px 16px",
    borderRadius: "8px",
    border: "1px solid #fde68a",
  },
  policyCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  policyCardTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#92400e",
  },
  policyCardList: {
    margin: 0,
    paddingLeft: "18px",
    fontSize: "12px",
    color: "#78350f",
    lineHeight: "1.8",
  },
  tipsCard: {
    background: "#fafbfc",
    padding: "14px 16px",
    borderRadius: "8px",
    border: "1px solid #f1f5f9",
  },
  tipsTitle: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#334155",
    margin: "0 0 6px 0",
  },
  tipsList: {
    margin: 0,
    paddingLeft: "18px",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.8",
  },
  infoCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    background: "#fef3c7",
    borderRadius: "8px",
    border: "1px solid #fde68a",
  },
  infoText: {
    fontSize: "13px",
    color: "#92400e",
    margin: 0,
  },
};

// Media query styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @media (max-width: 768px) {
    .formGrid {
      grid-template-columns: 1fr !important;
      padding: 16px !important;
    }
    .row {
      grid-template-columns: 1fr 1fr !important;
    }
    .header {
      padding: 16px 20px !important;
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
      margin: 0 16px !important;
    }
  }
  @media (max-width: 480px) {
    .row {
      grid-template-columns: 1fr !important;
    }
    .formGrid {
      padding: 12px !important;
      gap: 16px !important;
    }
    .formMain {
      gap: 12px !important;
    }
    .header {
      padding: 12px 16px !important;
    }
    .sidebar {
      gap: 10px !important;
    }
    .successModal {
      padding: 24px !important;
    }
    .successTitle {
      font-size: 18px !important;
    }
    .checkboxGroup {
      flex-direction: column !important;
    }
    .errorBanner {
      margin: 0 12px !important;
    }
    .errorBannerContent {
      flex-wrap: wrap !important;
    }
  }
`;
document.head.appendChild(styleSheet);