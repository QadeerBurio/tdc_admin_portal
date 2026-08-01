import React, { useState } from "react";
import axios from "axios";
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
  FaBullhorn,
  FaClock,
  FaCalendarAlt,
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaTwitter,
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

const DEFAULT_REDEMPTION_INSTRUCTIONS = `1. Open the TDC App and navigate to the Offers section.
2. Browse Brand and select the offer you want.
3. Save the discount offer in the app.
4. Visit the participating brand/store offering the discount.
5. Show your TDC Card or Student ID Card to the staff before making the payment.
6. The store staff will verify your eligibility for the offer.
7. Once verified, the discount will be applied, and you can redeem the offer successfully.`;

export default function CreateOffer() {
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
  const [focusedField, setFocusedField] = useState(null);
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
    if (num > 50) {
      setDiscountError("Discount cannot exceed 50%");
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
      return alert("Please enter the brand name");
    }
    if (!form.description) {
      return alert("Please enter a description");
    }
    if (!form.category) {
      return alert("Please select a category");
    }
    if (!form.discountPercentage) {
      return alert("Please enter the discount percentage");
    }
    
    // Validate discount range
    const discountNum = parseInt(form.discountPercentage);
    if (isNaN(discountNum) || discountNum < 15 || discountNum > 50) {
      return alert("Discount must be between 15% and 50%");
    }
    
    if (!image) {
      return alert("Please upload an offer image");
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
      alert(error.response?.data?.message || "❌ Error creating offer. Check console for details.");
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

  const renderField = (id, label, icon, type = "text", required = false, extraProps = {}) => {
    const isFocused = focusedField === id;
    return (
      <motion.div 
        className="animate-field"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={styles.inputGroup}
      >
        <label style={{...styles.label, color: isFocused ? '#f9c349' : '#64748b'}}>
          {label} {required && <span style={styles.required}>*</span>}
        </label>
        <div style={{...styles.inputWrapper, borderColor: isFocused ? '#f9c349' : '#e2e8f0', boxShadow: isFocused ? '0 0 0 3px rgba(249, 195, 73, 0.1)' : 'none'}}>
          {icon && <span style={styles.fieldIcon}>{icon}</span>}
          <input
            style={styles.input}
            placeholder={`Enter ${label.toLowerCase()}...`}
            value={form[id]}
            type={type}
            onFocus={() => setFocusedField(id)}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => setForm({ ...form, [id]: e.target.value })}
            {...extraProps}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.decorCircle1}></div>
      <div style={styles.decorCircle2}></div>
      <div style={styles.decorCircle3}></div>
      
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={styles.successOverlay}
          >
            <div style={styles.successContent}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <FaCheckCircle size={64} color="#10b981" />
              </motion.div>
              <h3 style={styles.successTitle}>Offer Created Successfully! 🎉</h3>
              <p style={styles.successText}>Your students have been notified via the app</p>
              <div style={styles.successStats}>
                <div style={styles.successStat}>
                  <span style={styles.successStatValue}>1K+</span>
                  <span style={styles.successStatLabel}>Students Reached</span>
                </div>
                <div style={styles.successStatDivider} />
                <div style={styles.successStat}>
                  <span style={styles.successStatValue}>24hrs</span>
                  <span style={styles.successStatLabel}>Avg Response</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      

      {loading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={styles.progressContainer}
        >
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>Uploading your offer</span>
            <span style={styles.progressPercent}>{uploadProgress}%</span>
          </div>
          <div style={styles.progressBar}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.5 }}
              style={{...styles.progressFill, width: `${uploadProgress}%`}}
            />
          </div>
          <p style={styles.progressText}>Please wait while we publish your offer...</p>
        </motion.div>
      )}

      <div style={styles.formGrid}>
        <div style={styles.inputSection}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNumber}>01</span>
            <h4 style={styles.sectionTitle}>Offer Details</h4>
          </div>

          {renderField("title", "Brand Name", <FaTag />, "text", true)}
          {renderField("description", "Description", <FaAlignLeft />, "text", true)}

          <div style={styles.row}>
            <motion.div 
              className="animate-field"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{...styles.inputGroup, flex: 2}}
            >
              <label style={styles.label}>Category <span style={styles.required}>*</span></label>
              <div style={styles.inputWrapper}>
                <FaLayerGroup style={styles.fieldIcon} />
                <select
                  style={styles.input}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </motion.div>

            <motion.div 
              className="animate-field"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{...styles.inputGroup, flex: 1}}
            >
              <label style={{...styles.label, color: discountError ? '#ef4444' : '#64748b'}}>
                Discount % <span style={styles.required}>*</span>
                <span style={styles.discountRange}>(15% - 50%)</span>
              </label>
              <div style={{
                ...styles.inputWrapper, 
                background: discountError ? '#fef2f2' : 'linear-gradient(135deg, #fef9ef 0%, #fff 100%)',
                borderColor: discountError ? '#ef4444' : '#e2e8f0',
              }}>
                <FaPercent style={{...styles.fieldIcon, color: discountError ? '#ef4444' : '#f9c349'}} />
                <input
                  type="number"
                  style={styles.input}
                  placeholder="25"
                  value={form.discountPercentage}
                  onChange={handleDiscountChange}
                  min="15"
                  max="50"
                  step="1"
                />
                <span style={styles.discountBadge}>%</span>
              </div>
              {discountError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.errorMessage}
                >
                  <FaExclamationTriangle size={12} />
                  <span>{discountError}</span>
                </motion.div>
              )}
              {!discountError && form.discountPercentage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.successMessage}
                >
                  <FaCheckCircle size={12} />
                  <span>Valid discount percentage</span>
                </motion.div>
              )}
            </motion.div>
          </div>

          <div style={styles.sectionHeader}>
            <span style={styles.sectionNumber}>02</span>
            <h4 style={styles.sectionTitle}>Availability & Location</h4>
          </div>

          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={styles.inputGroup}
          >
            <label style={styles.label}>Valid Until</label>
            <div style={styles.inputWrapper}>
              <FaCalendarAlt style={styles.fieldIcon} />
              <input
                type="date"
                style={styles.input}
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </div>
          </motion.div>

          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={styles.inputGroup}
          >
            <label style={styles.label}>Store Location</label>
            <div style={styles.inputWrapper}>
              <FaMapMarkerAlt style={styles.fieldIcon} />
              <input
                style={styles.input}
                placeholder="City or Street Address"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </motion.div>

          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            style={styles.inputGroup}
          >
            <label style={styles.label}>Availability</label>
            <div style={styles.checkboxContainer}>
              <motion.label 
                style={{...styles.checkboxLabel, background: form.isOnline ? '#fef9ef' : '#f8fafc', borderColor: form.isOnline ? '#f9c349' : '#e2e8f0'}}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input type="checkbox" checked={form.isOnline} onChange={(e) => setForm({...form, isOnline: e.target.checked})} />
                <FaGlobe style={{color: form.isOnline ? '#f9c349' : '#94a3b8'}} />
                Online
              </motion.label>
              <motion.label 
                style={{...styles.checkboxLabel, background: form.isInStore ? '#fef9ef' : '#f8fafc', borderColor: form.isInStore ? '#f9c349' : '#e2e8f0'}}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input type="checkbox" checked={form.isInStore} onChange={(e) => setForm({...form, isInStore: e.target.checked})} />
                <FaStore style={{color: form.isInStore ? '#f9c349' : '#94a3b8'}} />
                In-Store
              </motion.label>
            </div>
          </motion.div>

          <div style={styles.sectionHeader}>
            <span style={styles.sectionNumber}>03</span>
            <h4 style={styles.sectionTitle}>Redemption Instructions</h4>
          </div>

          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={styles.inputGroup}
          >
            <label style={{...styles.label, display: 'flex', alignItems: 'center'}}>
              <FaInfoCircle style={{marginRight: '6px', fontSize: '14px'}} />
              Instructions
            </label>
            <div style={{...styles.textareaWrapper, borderColor: focusedField === 'redeemInstructions' ? '#f9c349' : '#e2e8f0'}}>
              <textarea
                style={styles.textarea}
                placeholder="How can students claim this?"
                value={form.redeemInstructions}
                onChange={(e) => setForm({ ...form, redeemInstructions: e.target.value })}
                onFocus={() => setFocusedField('redeemInstructions')}
                onBlur={() => setFocusedField(null)}
                rows={7}
              />
            </div>
          </motion.div>
        </div>

        <div style={styles.uploadSection}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionNumber}>04</span>
            <h4 style={styles.sectionTitle}>Media & Preview</h4>
          </div>

          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={styles.imageCard}
          >
            <div style={styles.imageHeader}>
              <FaImage style={{color: '#f9c349'}} />
              <span style={styles.imageLabel}>Offer Image <span style={styles.required}>*</span></span>
            </div>
            {preview ? (
              <motion.div 
                style={styles.previewContainer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <img src={preview} alt="Preview" style={styles.previewImage} />
                <motion.button 
                  style={styles.changeImageBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setPreview(null);
                    setImage(null);
                  }}
                >
                  <FaTimes /> Change
                </motion.button>
              </motion.div>
            ) : (
              <motion.label 
                style={styles.uploadArea}
                whileHover={{ backgroundColor: '#fef9ef' }}
                whileTap={{ scale: 0.98 }}
              >
                <input type="file" style={{ display: "none" }} onChange={(e) => handleImageChange(e.target.files[0])} />
                <FaCloudUploadAlt size={48} color="#f9c349" />
                <p style={styles.uploadText}>Click to upload banner</p>
                <p style={styles.uploadHint}>PNG, JPG up to 5MB (16:9 recommended)</p>
              </motion.label>
            )}
          </motion.div>

          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={styles.previewCard}
          >
            <p style={styles.previewTitle}>
              <FaRocket style={{marginRight: '6px'}} /> Live Preview
            </p>
            <div style={styles.previewContent}>
              <div style={styles.previewDiscountBadge}>
                {form.discountPercentage ? `${form.discountPercentage}% OFF` : '0% OFF'}
              </div>
              <p style={styles.previewOfferTitle}>
                {form.title || 'Your Offer Title'}
              </p>
              <p style={styles.previewCategory}>
                {form.category || 'Select Category'}
              </p>
              <div style={styles.previewTags}>
                {form.isOnline && <span style={styles.previewTag}><FaGlobe size={10} /> Online</span>}
                {form.isInStore && <span style={styles.previewTag}><FaStore size={10} /> In-Store</span>}
                {form.validUntil && <span style={styles.previewTag}><FaClock size={10} /> Valid until {new Date(form.validUntil).toLocaleDateString()}</span>}
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={styles.tipsCard}
          >
            <p style={styles.tipsTitle}>💡 Pro Tips</p>
            <ul style={styles.tipsList}>
              <li style={styles.tipItem}>Use eye-catching titles with discounts</li>
              <li style={styles.tipItem}>High-quality images attract more students</li>
              <li style={styles.tipItem}>Clear instructions increase redemption rate</li>
            </ul>
            <div style={styles.tipsSocial}>
              <span style={styles.tipsSocialLabel}>Share with:</span>
              <FaWhatsapp style={styles.tipsSocialIcon} />
              <FaInstagram style={styles.tipsSocialIcon} />
              <FaFacebook style={styles.tipsSocialIcon} />
              <FaTwitter style={styles.tipsSocialIcon} />
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={styles.footer}
      >
        <motion.button 
          style={{
            ...styles.submitBtn, 
            opacity: loading ? 0.7 : 1,
            background: discountError ? '#94a3b8' : 'linear-gradient(135deg, #f9c349 0%, #f5a623 100%)',
            cursor: discountError ? 'not-allowed' : 'pointer',
          }} 
          onClick={createOffer} 
          disabled={loading || !!discountError}
          className="submit-btn"
          whileHover={{ scale: discountError ? 1 : 1.02 }}
          whileTap={{ scale: discountError ? 1 : 0.98 }}
        >
          {loading ? (
            <>
              <FaSpinner style={styles.spinnerIcon} className="spinner" />
              Publishing...
            </>
          ) : (
            <>
              Publish & Notify Students
              <FaArrowRight style={{marginLeft: '10px', fontSize: '14px'}} />
            </>
          )}
        </motion.button>
        {discountError && (
          <p style={styles.discountFooterError}>
            <FaExclamationTriangle size={12} />
            Please fix the discount percentage before publishing
          </p>
        )}
        <p style={styles.footerNote}>
          <FaShieldAlt size={12} style={{marginRight: '4px'}} />
          Your offer will be visible to all students instantly
        </p>
      </motion.div>

      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .spinner {
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }
          
          .animate-field {
            animation: slideUp 0.5s ease forwards;
            opacity: 0;
          }
          
          .submit-btn {
            transition: all 0.3s ease;
          }
          .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -12px rgba(249, 195, 73, 0.4);
          }
          .submit-btn:disabled {
            cursor: not-allowed;
          }
          
          input:focus, select:focus, textarea:focus {
            outline: none;
          }
          
          input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #f9c349;
          }
          
          input[type="number"]::-webkit-inner-spin-button {
            opacity: 0.5;
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  container: { 
    maxWidth: "1100px", 
    margin: "20px auto", 
    padding: "24px 32px 40px", 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    background: "#ffffff",
    borderRadius: "28px",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
    border: "1px solid #f1f5f9",
  },
  decorCircle1: {
    position: "absolute",
    top: "-120px",
    right: "-120px",
    width: "350px",
    height: "350px",
    background: "radial-gradient(circle, rgba(249, 195, 73, 0.06) 0%, rgba(249, 195, 73, 0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  decorCircle2: {
    position: "absolute",
    bottom: "-100px",
    left: "-100px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(249, 195, 73, 0.04) 0%, rgba(249, 195, 73, 0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  decorCircle3: {
    position: "absolute",
    top: "50%",
    right: "-60px",
    width: "180px",
    height: "180px",
    background: "radial-gradient(circle, rgba(249, 195, 73, 0.03) 0%, rgba(249, 195, 73, 0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  successOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  successContent: {
    background: "#fff",
    padding: "48px 60px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
    maxWidth: "440px",
  },
  successTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "16px 0 8px",
  },
  successText: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 20px 0",
  },
  successStats: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  successStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  successStatValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },
  successStatLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  successStatDivider: {
    width: "1px",
    height: "30px",
    background: "#e5e7eb",
  },
  progressContainer: {
    marginBottom: "24px",
    padding: "20px 24px",
    background: "#f8fafc",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  progressLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  progressPercent: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#f9c349",
  },
  progressBar: {
    height: "6px",
    background: "#e5e7eb",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #f9c349 0%, #f5a623 100%)",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  progressText: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "8px",
    textAlign: "center",
  },
  header: { 
    marginBottom: "36px", 
    textAlign: "center",
    position: "relative",
    zIndex: 1
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#fef9ef",
    color: "#f9c349",
    padding: "4px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "12px",
  },
  mainTitle: { 
    margin: 0, 
    fontSize: "32px", 
    color: "#0f172a", 
    fontWeight: "800",
    letterSpacing: "-0.5px"
  },
  subTitle: { 
    margin: "10px 0 0", 
    fontSize: "15px", 
    color: "#64748b",
    maxWidth: "450px",
    marginLeft: "auto",
    marginRight: "auto"
  },
  formGrid: { 
    display: "grid", 
    gridTemplateColumns: "1.2fr 1fr", 
    gap: "40px",
    position: "relative",
    zIndex: 1
  },
  inputSection: {
    display: "flex",
    flexDirection: "column",
  },
  uploadSection: {
    display: "flex",
    flexDirection: "column",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    marginTop: "8px",
  },
  sectionNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#fef9ef",
    color: "#f9c349",
    fontSize: "12px",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  row: { 
    display: "flex", 
    gap: "16px" 
  },
  label: { 
    display: "block", 
    fontSize: "13px", 
    fontWeight: "600", 
    color: "#64748b", 
    marginBottom: "8px",
    transition: "color 0.2s ease"
  },
  required: {
    color: "#f9c349",
    fontSize: "14px"
  },
  discountRange: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "400",
    marginLeft: "6px"
  },
  inputGroup: { 
    marginBottom: "18px" 
  },
  inputWrapper: { 
    display: "flex", 
    alignItems: "center", 
    backgroundColor: "#f8fafc", 
    border: "2px solid #e2e8f0", 
    borderRadius: "12px", 
    padding: "0 16px",
    transition: "all 0.2s ease"
  },
  fieldIcon: { 
    color: "#94a3b8", 
    marginRight: "12px",
    fontSize: "16px",
    display: "flex",
    alignItems: "center"
  },
  input: { 
    width: "100%", 
    padding: "13px 0", 
    border: "none", 
    backgroundColor: "transparent", 
    outline: "none", 
    fontSize: "14px", 
    color: "#0f172a",
    fontWeight: "500"
  },
  discountBadge: {
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: "600",
    paddingLeft: "4px"
  },
  errorMessage: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "6px",
    fontSize: "12px",
    color: "#ef4444",
    fontWeight: "500",
  },
  successMessage: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "6px",
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "500",
  },
  textareaWrapper: {
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease",
    overflow: "hidden"
  },
  textarea: { 
    width: "100%", 
    padding: "13px 16px", 
    border: "none", 
    backgroundColor: "transparent", 
    outline: "none", 
    fontSize: "14px", 
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "160px",
    maxHeight: "350px",
    color: "#0f172a",
    boxSizing: "border-box",
    lineHeight: "1.8",
    whiteSpace: "pre-wrap"
  },
  checkboxContainer: { 
    display: "flex", 
    gap: "12px" 
  },
  checkboxLabel: { 
    display: "flex", 
    alignItems: "center", 
    gap: "10px", 
    fontSize: "14px", 
    fontWeight: "500", 
    color: "#475569", 
    cursor: "pointer",
    padding: "10px 20px",
    borderRadius: "40px",
    border: "2px solid #e2e8f0",
    transition: "all 0.2s ease"
  },
  imageCard: { 
    borderRadius: "16px", 
    backgroundColor: "#f8fafc",
    border: "2px dashed #e2e8f0",
    overflow: "hidden",
    marginBottom: "18px"
  },
  imageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 20px 0",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569"
  },
  imageLabel: {
    fontSize: "13px",
    fontWeight: "600"
  },
  uploadArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "36px 20px",
    cursor: "pointer",
    transition: "background 0.2s ease",
    borderRadius: "16px",
  },
  uploadText: {
    marginTop: "12px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#f9c349"
  },
  uploadHint: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px"
  },
  previewContainer: {
    position: "relative"
  },
  previewImage: { 
    width: "100%", 
    height: "180px", 
    objectFit: "cover"
  },
  changeImageBtn: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    background: "rgba(0,0,0,0.75)",
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  previewCard: {
    background: "linear-gradient(135deg, #0f172a 0%, #1a2332 100%)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  previewTitle: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "14px",
    display: "flex",
    alignItems: "center",
  },
  previewContent: {
    position: "relative"
  },
  previewDiscountBadge: {
    display: "inline-block",
    background: "#f9c349",
    color: "#0f172a",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "800",
    marginBottom: "10px"
  },
  previewOfferTitle: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 4px 0"
  },
  previewCategory: {
    color: "#94a3b8",
    fontSize: "13px",
    margin: 0
  },
  previewTags: {
    display: "flex",
    gap: "8px",
    marginTop: "10px",
    flexWrap: "wrap"
  },
  previewTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(255,255,255,0.08)",
    color: "#cbd5e1",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px"
  },
  tipsCard: {
    background: "#fef9ef",
    borderRadius: "14px",
    padding: "16px 20px",
    border: "1px solid #fde68a",
  },
  tipsTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#d97706",
    margin: "0 0 8px 0"
  },
  tipsList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#92400e",
    fontSize: "13px",
  },
  tipItem: {
    marginBottom: "4px"
  },
  tipsSocial: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #fde68a",
  },
  tipsSocialLabel: {
    fontSize: "12px",
    color: "#92400e",
    fontWeight: "500",
  },
  tipsSocialIcon: {
    fontSize: "18px",
    color: "#92400e",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  footer: { 
    marginTop: "32px", 
    paddingTop: "24px", 
    borderTop: "2px solid #f1f5f9", 
    textAlign: "center",
    position: "relative",
    zIndex: 1
  },
  submitBtn: { 
    padding: "16px 44px", 
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    color: "#0f172a", 
    border: "none", 
    borderRadius: "40px", 
    fontSize: "16px", 
    fontWeight: "600", 
    cursor: "pointer", 
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 10px 20px -8px rgba(249, 195, 73, 0.4)",
    transition: "all 0.3s ease"
  },
  spinnerIcon: {
    marginRight: "8px",
  },
  footerNote: {
    marginTop: "12px",
    fontSize: "12px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  discountFooterError: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#ef4444",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  }
};