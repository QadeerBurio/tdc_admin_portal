import React, { useState, useEffect } from "react";
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
  FaStar,
  FaTimes,
  FaPlus,
  FaMinus,
  FaClock,
  FaBuilding,
  FaUsers,
  FaRocket,
  FaSpinner,
  FaShieldAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "http://localhost:5000/api/offers";
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

export default function CreateOffer() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountPercentage: "",
    category: "",
    redeemInstructions: "",
    location: "",
    isOnline: false,
    isInStore: false,
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createOffer = async () => {
    if (!form.title || !form.discountPercentage || !form.category || !image || !form.description) {
      return alert("Please fill Title, Description, Discount, Category, and Image!");
    }

    const confirmUpload = window.confirm(
      "Creating this offer will remove your previous one. Do you want to proceed?"
    );
    if (!confirmUpload) return;

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("discountPercentage", form.discountPercentage);
    formData.append("category", form.category);
    formData.append("redeemInstructions", form.redeemInstructions);
    formData.append("location", form.location);
    formData.append("isOnline", String(form.isOnline));
    formData.append("isInStore", String(form.isInStore));
    formData.append("image", image);

    try {
      setLoading(true);
      setUploadProgress(0);
      const token = localStorage.getItem("token");
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
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
      
      setTimeout(() => {
        setForm({
          title: "", description: "", discountPercentage: "", category: "",
          redeemInstructions: "", location: "", isOnline: false, isInStore: false
        });
        setPreview(null);
        setImage(null);
        setShowSuccess(false);
        setUploadProgress(0);
      }, 3000);
      
    } catch (error) {
      console.error("Upload Error:", error.response?.data);
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
        <label style={{...styles.label, color: isFocused ? '#ff961a' : '#64748b'}}>
          {label} {required && <span style={styles.required}>*</span>}
        </label>
        <div style={{...styles.inputWrapper, borderColor: isFocused ? '#ff961a' : '#e2e8f0', boxShadow: isFocused ? '0 0 0 3px rgba(255,150,26,0.1)' : 'none'}}>
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
      {/* Decorative Elements */}
      <div style={styles.decorCircle1}></div>
      <div style={styles.decorCircle2}></div>
      <div style={styles.decorCircle3}></div>
      
      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={styles.successOverlay}
          >
            <div style={styles.successContent}>
              <FaCheckCircle size={60} color="#10b981" />
              <h3 style={styles.successTitle}>Offer Created Successfully! 🎉</h3>
              <p style={styles.successText}>Your students have been notified via the app</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={styles.header}
      >
        
        <h2 style={styles.mainTitle}>Create <span style={{color: '#ff961a'}}>Student Offer</span></h2>
        <p style={styles.subTitle}>Launch your discount and connect with thousands of students instantly</p>
      </motion.div>

      {/* Progress Bar */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={styles.progressContainer}
        >
          <div style={styles.progressBar}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.5 }}
              style={{...styles.progressFill, width: `${uploadProgress}%`}}
            />
          </div>
          <p style={styles.progressText}>{uploadProgress}% Uploading...</p>
        </motion.div>
      )}

      <div style={styles.formGrid}>
        {/* Left Column */}
        <div style={styles.inputSection}>
          {/* Title */}
          {renderField("title", "Offer Title", <FaTag />, "text", true)}
          
          {/* Description */}
          {renderField("description", "Description", <FaAlignLeft />, "text", true)}

          <div style={styles.row}>
            {/* Category */}
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

            {/* Discount */}
            <motion.div 
              className="animate-field"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{...styles.inputGroup, flex: 1}}
            >
              <label style={styles.label}>Discount % <span style={styles.required}>*</span></label>
              <div style={{...styles.inputWrapper, background: 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)'}}>
                <FaPercent style={{...styles.fieldIcon, color: '#ff961a'}} />
                <input
                  type="number"
                  style={styles.input}
                  placeholder="0"
                  value={form.discountPercentage}
                  onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                />
              </div>
            </motion.div>
          </div>

          {/* Availability Toggles */}
          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={styles.inputGroup}
          >
            <label style={styles.label}>Availability</label>
            <div style={styles.checkboxContainer}>
              <label style={{...styles.checkboxLabel, background: form.isOnline ? '#fff7ed' : '#f8fafc', borderColor: form.isOnline ? '#ff961a' : '#e2e8f0'}}>
                <input type="checkbox" checked={form.isOnline} onChange={(e) => setForm({...form, isOnline: e.target.checked})} />
                <FaGlobe style={{color: form.isOnline ? '#ff961a' : '#94a3b8'}} />
                Online
              </label>
              <label style={{...styles.checkboxLabel, background: form.isInStore ? '#fff7ed' : '#f8fafc', borderColor: form.isInStore ? '#ff961a' : '#e2e8f0'}}>
                <input type="checkbox" checked={form.isInStore} onChange={(e) => setForm({...form, isInStore: e.target.checked})} />
                <FaStore style={{color: form.isInStore ? '#ff961a' : '#94a3b8'}} />
                In-Store
              </label>
            </div>
          </motion.div>

          {/* Location */}
          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
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

          {/* Redemption Instructions */}
          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={styles.inputGroup}
          >
            <label style={styles.label}>
              <FaInfoCircle style={{marginRight: '6px', fontSize: '12px'}} />
              Redemption Instructions
            </label>
            <textarea
              style={styles.textarea}
              placeholder="How can students claim this? (e.g., Show student ID at counter, use code STUDENT20)"
              value={form.redeemInstructions}
              onChange={(e) => setForm({ ...form, redeemInstructions: e.target.value })}
              rows={4}
            />
          </motion.div>
        </div>

        {/* Right Column */}
        <div style={styles.uploadSection}>
          {/* Image Upload */}
          <motion.div 
            className="animate-field"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={styles.imageCard}
          >
            <div style={styles.imageHeader}>
              <FaImage style={{color: '#ff961a'}} />
              <span style={styles.imageLabel}>Offer Banner <span style={styles.required}>*</span></span>
            </div>
            {preview ? (
              <div style={styles.previewContainer}>
                <img src={preview} alt="Preview" style={styles.previewImage} />
                <button 
                  style={styles.changeImageBtn}
                  onClick={() => {
                    setPreview(null);
                    setImage(null);
                  }}
                >
                  <FaTimes /> Change
                </button>
              </div>
            ) : (
              <label style={styles.uploadArea}>
                <input type="file" style={{ display: "none" }} onChange={(e) => handleImageChange(e.target.files[0])} />
                <FaCloudUploadAlt size={48} color="#ff961a" />
                <p style={styles.uploadText}>Click to upload banner</p>
                <p style={styles.uploadHint}>PNG, JPG up to 5MB (16:9 recommended)</p>
              </label>
            )}
          </motion.div>

          {/* Preview Card */}
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
                {form.discountPercentage || '0'}% OFF
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
              </div>
            </div>
          </motion.div>

          {/* Quick Tips */}
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
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={styles.footer}
      >
        <button 
          style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}} 
          onClick={createOffer} 
          disabled={loading}
          className="submit-btn"
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
        </button>
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
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
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
            box-shadow: 0 20px 25px -12px rgba(255, 150, 26, 0.4);
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
            accent-color: #ff961a;
          }
          
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #f9c349 0%, #ff961a 100%);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #ff961a;
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
    padding: "20px 30px 40px", 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    background: "#fff",
    borderRadius: "40px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  },
  decorCircle1: {
    position: "absolute",
    top: "-100px",
    right: "-100px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(255,150,26,0.08) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  decorCircle2: {
    position: "absolute",
    bottom: "-80px",
    left: "-80px",
    width: "250px",
    height: "250px",
    background: "radial-gradient(circle, rgba(255,150,26,0.05) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  decorCircle3: {
    position: "absolute",
    top: "50%",
    right: "-50px",
    width: "150px",
    height: "150px",
    background: "radial-gradient(circle, rgba(255,150,26,0.03) 0%, rgba(255,150,26,0) 70%)",
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
    padding: "40px 60px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
  },
  successTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "16px 0 8px",
  },
  successText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  progressContainer: {
    marginBottom: "24px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
  },
  progressBar: {
    height: "6px",
    background: "#e5e7eb",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #f9c349 0%, #ff961a 100%)",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  progressText: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "8px",
    textAlign: "center",
  },
  header: { 
    marginBottom: "40px", 
    textAlign: "center",
    position: "relative",
    zIndex: 1
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff7ed",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ff961a",
    marginBottom: "16px"
  },
  headerIcon: {
    fontSize: "12px"
  },
  mainTitle: { 
    margin: 0, 
    fontSize: "32px", 
    color: "#1e293b", 
    fontWeight: "800",
    letterSpacing: "-0.5px"
  },
  subTitle: { 
    margin: "12px 0 0", 
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
  row: { 
    display: "flex", 
    gap: "20px" 
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
    color: "#ff961a",
    fontSize: "14px"
  },
  inputGroup: { 
    marginBottom: "20px" 
  },
  inputWrapper: { 
    display: "flex", 
    alignItems: "center", 
    backgroundColor: "#f8fafc", 
    border: "2px solid #e2e8f0", 
    borderRadius: "14px", 
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
    padding: "14px 0", 
    border: "none", 
    backgroundColor: "transparent", 
    outline: "none", 
    fontSize: "14px", 
    color: "#1e293b",
    fontWeight: "500"
  },
  textarea: { 
    width: "100%", 
    padding: "14px 16px", 
    borderRadius: "14px", 
    border: "2px solid #e2e8f0", 
    backgroundColor: "#f8fafc", 
    outline: "none", 
    fontSize: "14px", 
    fontFamily: "inherit",
    resize: "vertical",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box",
    minHeight: "100px",
    color: "#1e293b"
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
    borderRadius: "20px", 
    backgroundColor: "#f8fafc",
    border: "2px dashed #e2e8f0",
    overflow: "hidden",
    marginBottom: "20px"
  },
  imageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "16px 20px 0",
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
    padding: "40px 20px",
    cursor: "pointer",
    transition: "background 0.2s ease"
  },
  uploadText: {
    marginTop: "12px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#ff961a"
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
    height: "200px", 
    objectFit: "cover"
  },
  changeImageBtn: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    background: "rgba(0,0,0,0.75)",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  previewCard: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "16px"
  },
  previewTitle: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
  },
  previewContent: {
    position: "relative"
  },
  previewDiscountBadge: {
    display: "inline-block",
    background: "#ff961a",
    color: "#fff",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "800",
    marginBottom: "12px"
  },
  previewOfferTitle: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 6px 0"
  },
  previewCategory: {
    color: "#94a3b8",
    fontSize: "13px",
    margin: 0
  },
  previewTags: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
    flexWrap: "wrap"
  },
  previewTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(255,255,255,0.1)",
    color: "#94a3b8",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px"
  },
  tipsCard: {
    background: "#fff7ed",
    borderRadius: "16px",
    padding: "16px 20px",
    border: "1px solid #fef3c7",
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
  footer: { 
    marginTop: "32px", 
    paddingTop: "24px", 
    borderTop: "2px solid #f1f5f9", 
    textAlign: "center",
    position: "relative",
    zIndex: 1
  },
  submitBtn: { 
    padding: "16px 40px", 
    background: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
    color: "#fff", 
    border: "none", 
    borderRadius: "40px", 
    fontSize: "16px", 
    fontWeight: "600", 
    cursor: "pointer", 
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 10px 20px -8px rgba(255, 150, 26, 0.4)",
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
  }
};