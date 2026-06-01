import React, { useState } from "react";
import axios from "axios";
import { 
  FaCloudUploadAlt, FaTag, FaMapMarkerAlt, FaLayerGroup, 
  FaAlignLeft, FaGlobe, FaStore, FaPercent, FaArrowRight,
  FaCheckCircle, FaImage, FaInfoCircle, FaStar
} from "react-icons/fa";

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
      const token = localStorage.getItem("token");
      
      await axios.post(API_BASE_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("🎉 Offer Created! Your students have been notified via the app.");
      
      setForm({
        title: "", description: "", discountPercentage: "", category: "",
        redeemInstructions: "", location: "", isOnline: false, isInStore: false
      });
      setPreview(null);
      setImage(null);
      
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

  return (
    <div style={styles.container}>
      {/* Decorative Elements */}
      <div style={styles.decorCircle1}></div>
      <div style={styles.decorCircle2}></div>
      
      <div style={styles.header}>
        <div style={styles.headerBadge}>
          <FaStar style={styles.headerIcon} />
          <span>New Offer</span>
        </div>
        <h2 style={styles.mainTitle}>Create <span style={{color: '#ff961a'}}>Student Offer</span></h2>
        <p style={styles.subTitle}>Launch your discount and connect with thousands of students instantly</p>
      </div>

      <div style={styles.formGrid}>
        <div style={styles.inputSection}>
          {/* Title */}
          <div className="animate-field" style={styles.inputGroup}>
            <label style={{...styles.label, color: focusedField === 'title' ? '#ff961a' : '#64748b'}}>
              Offer Title <span style={styles.required}>*</span>
            </label>
            <div style={{...styles.inputWrapper, borderColor: focusedField === 'title' ? '#ff961a' : '#e2e8f0'}}>
              <FaTag style={styles.fieldIcon} />
              <input
                style={styles.input}
                placeholder="e.g., 50% Off Summer Collection"
                value={form.title}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="animate-field" style={styles.inputGroup}>
            <label style={{...styles.label, color: focusedField === 'description' ? '#ff961a' : '#64748b'}}>
              Description <span style={styles.required}>*</span>
            </label>
            <div style={{...styles.inputWrapper, borderColor: focusedField === 'description' ? '#ff961a' : '#e2e8f0'}}>
              <FaAlignLeft style={styles.fieldIcon} />
              <input
                style={styles.input}
                placeholder="Briefly describe the deal..."
                value={form.description}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.row}>
            {/* Category */}
            <div className="animate-field" style={{...styles.inputGroup, flex: 2}}>
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
            </div>

            {/* Discount */}
            <div className="animate-field" style={{...styles.inputGroup, flex: 1}}>
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
            </div>
          </div>

          {/* Availability Toggles */}
          <div className="animate-field" style={styles.inputGroup}>
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
          </div>

          {/* Location */}
          <div className="animate-field" style={styles.inputGroup}>
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
          </div>
        </div>

        {/* Right Side: Upload & Redemption */}
        <div style={styles.uploadSection}>
          {/* Image Upload */}
          <div className="animate-field" style={styles.imageCard}>
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
                  Change
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
          </div>

          {/* Redemption Instructions */}
          <div className="animate-field" style={styles.inputGroup}>
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
          </div>

          {/* Preview Card */}
          <div className="animate-field" style={styles.previewCard}>
            <p style={styles.previewTitle}>Live Preview</p>
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
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <button 
          style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}} 
          onClick={createOffer} 
          disabled={loading}
          className="submit-btn"
        >
          {loading ? (
            <>
              <div style={styles.spinner}></div>
              Publishing...
            </>
          ) : (
            <>
              Publish & Notify Students
              <FaArrowRight style={{marginLeft: '10px', fontSize: '14px'}} />
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        .animate-field {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
        }
        .animate-field:nth-child(1) { animation-delay: 0.05s; }
        .animate-field:nth-child(2) { animation-delay: 0.1s; }
        .animate-field:nth-child(3) { animation-delay: 0.15s; }
        .animate-field:nth-child(4) { animation-delay: 0.2s; }
        .animate-field:nth-child(5) { animation-delay: 0.25s; }
        .animate-field:nth-child(6) { animation-delay: 0.3s; }
        
        .submit-btn {
          transition: all 0.3s ease;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -12px rgba(255, 150, 26, 0.4);
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
      `}</style>
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
    overflow: "hidden"
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
    marginBottom: "24px" 
  },
  inputWrapper: { 
    display: "flex", 
    alignItems: "center", 
    backgroundColor: "#f8fafc", 
    border: "2px solid #e2e8f0", 
    borderRadius: "16px", 
    padding: "0 16px",
    transition: "all 0.2s ease"
  },
  fieldIcon: { 
    color: "#94a3b8", 
    marginRight: "12px",
    fontSize: "16px"
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
    borderRadius: "16px", 
    border: "2px solid #e2e8f0", 
    backgroundColor: "#f8fafc", 
    outline: "none", 
    fontSize: "14px", 
    fontFamily: "inherit",
    resize: "vertical",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box"
  },
  checkboxContainer: { 
    display: "flex", 
    gap: "16px" 
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
    borderRadius: "24px", 
    backgroundColor: "#f8fafc",
    border: "2px dashed #e2e8f0",
    overflow: "hidden",
    marginBottom: "24px"
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
    height: "180px", 
    objectFit: "cover"
  },
  changeImageBtn: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    cursor: "pointer"
  },
  previewCard: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: "20px",
    padding: "16px",
    marginTop: "8px"
  },
  previewTitle: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "12px"
  },
  previewContent: {
    position: "relative"
  },
  previewDiscountBadge: {
    display: "inline-block",
    background: "#ff961a",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "800",
    marginBottom: "10px"
  },
  previewOfferTitle: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 6px 0"
  },
  previewCategory: {
    color: "#94a3b8",
    fontSize: "12px",
    margin: 0
  },
  footer: { 
    marginTop: "40px", 
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
    boxShadow: "0 10px 20px -8px rgba(255, 150, 26, 0.4)"
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "pulse 0.8s linear infinite",
    marginRight: "8px"
  }
};