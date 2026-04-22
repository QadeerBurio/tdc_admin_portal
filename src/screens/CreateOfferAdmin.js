import React, { useState, useRef } from "react";
import { 
  FaImage, FaTag, FaArrowRight, FaCheckCircle, 
  FaMobileAlt, FaUpload, FaTimes, FaEye,
  FaSlidersH, FaGift, FaInfoCircle
} from "react-icons/fa";

export default function AdminPanel() {
  const [view, setView] = useState("slider");
  const [data, setData] = useState({
    title: "",
    description: "",
    image: null,
    previewUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setData({ ...data, image: file, previewUrl: localUrl });
    }
  };

  const clearForm = () => {
    setData({ title: "", description: "", image: null, previewUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePublish = async () => {
    if (!data.image) return alert("Please select an image first!");

    const formData = new FormData();
    formData.append("type", view);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("image", data.image);

    setLoading(true);
    try {
      const response = await fetch("https://the-deft-crew-production.up.railway.app/api/admin/add", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        clearForm();
      } else {
        alert("Server Error: " + result.message);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.dashboardWrapper}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

      <div style={styles.header}>
        <div style={styles.headerBadge}>
          <FaMobileAlt />
          <span>Admin Control</span>
        </div>
        <h1 style={styles.mainTitle}>Content Manager</h1>
        <p style={styles.subTitle}>Manage slider images and exclusive offers for the mobile app</p>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-container" style={styles.tabContainer}>
        <button 
          className={`tab-btn ${view === "slider" ? "active" : ""}`}
          style={{ ...styles.tabBtn, ...(view === "slider" ? styles.activeTab : {}) }}
          onClick={() => { setView("slider"); clearForm(); }}
        >
          <FaSlidersH style={{marginRight: '8px'}} />
          Home Slider
        </button>
        <button 
          className={`tab-btn ${view === "offer" ? "active" : ""}`}
          style={{ ...styles.tabBtn, ...(view === "offer" ? styles.activeTab : {}) }}
          onClick={() => { setView("offer"); clearForm(); }}
        >
          <FaGift style={{marginRight: '8px'}} />
          Exclusive Offer
        </button>
      </div>

      <div style={styles.offerContainer}>
        {/* Form Side */}
        <div className="form-section" style={styles.glassSection}>
          <h2 style={styles.sectionTitle}>
            {view === "slider" ? (
              <>📤 Upload Slider Image</>
            ) : (
              <>🎁 Create Exclusive Offer</>
            )}
          </h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>
              {view === "slider" ? "Slider Caption" : "Offer Title"}
              <span style={styles.optional}>(Optional)</span>
            </label>
            <input
              className="form-input"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder={view === "slider" ? "e.g., Summer Sale 2024" : "e.g., 50% Off on All Items"}
              style={styles.input}
            />

            <label style={styles.label}>
              <FaImage style={{marginRight: '6px'}} />
              Banner Image <span style={styles.required}>*</span>
            </label>
            <div 
              className="upload-area"
              style={styles.fileUploadContainer} 
              onClick={() => fileInputRef.current.click()}
            >
              {data.previewUrl ? (
                <div style={styles.uploadSuccess}>
                  <FaCheckCircle color="#10b981" size={24} />
                  <span>Image loaded successfully</span>
                  <button 
                    style={styles.removeImageBtn}
                    onClick={(e) => { e.stopPropagation(); clearForm(); }}
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <div style={styles.uploadPlaceholder}>
                  <FaUpload size={32} color="#cbd5e1" />
                  <p>Click or drag to upload image</p>
                  <span>PNG, JPG up to 5MB</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                style={{ display: "none" }} 
              />
            </div>

            {view === "offer" && (
              <div className="animate-field">
                <label style={styles.label}>
                  <FaInfoCircle style={{marginRight: '6px'}} />
                  Description
                </label>
                <textarea
                  className="form-textarea"
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  placeholder="Enter offer details, terms, and conditions..."
                  style={styles.textarea}
                  rows={4}
                />
              </div>
            )}

            <button 
              className="publish-btn"
              style={{...styles.primaryBtn, opacity: loading ? 0.7 : 1}} 
              onClick={handlePublish} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div style={styles.spinner}></div>
                  Publishing...
                </>
              ) : (
                <>
                  {view === "slider" ? "Add to Slider" : "Publish Offer"}
                  <FaArrowRight style={{marginLeft: '8px'}} />
                </>
              )}
            </button>

            {success && (
              <div className="success-toast" style={styles.successToast}>
                <FaCheckCircle />
                <span>{view === "slider" ? "Slider image" : "Offer"} published successfully!</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Preview Side */}
        <div className="preview-section" style={styles.previewContainer}>
          <div style={styles.previewHeader}>
            <FaEye style={{color: '#94a3b8'}} />
            <h3 style={styles.previewTitle}>Live Preview</h3>
          </div>
          <div style={styles.mobileFrame}>
            <div style={styles.statusBar}>
              <span>9:41</span>
              <div style={styles.statusIcons}>
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>
            <div style={styles.appCard}>
              {data.previewUrl ? (
                <img src={data.previewUrl} alt="preview" style={styles.appImage} />
              ) : (
                <div style={styles.imagePlaceholder}>
                  <FaImage size={40} color="#cbd5e1" />
                  <span>No image selected</span>
                </div>
              )}
              
              <div style={view === "offer" ? styles.appOverlayOffer : styles.appOverlaySlider}>
                <p style={styles.appTitle}>
                  {data.title || (view === "slider" ? "Summer Collection" : "Special Offer")}
                </p>
                {view === "offer" && (
                  <p style={styles.appDesc}>
                    {data.description || "Tap to view details and claim discount"}
                  </p>
                )}
                {view === "slider" && (
                  <div style={styles.sliderIndicator}>
                    <div style={styles.activeDot}></div>
                    <div style={styles.inactiveDot}></div>
                    <div style={styles.inactiveDot}></div>
                  </div>
                )}
              </div>
            </div>
            <div style={styles.homeIndicator}></div>
          </div>
          <p style={styles.previewHint}>
            {view === "slider" 
              ? "Slider images appear in carousel on home screen" 
              : "Offer appears on the exclusive deals section"}
          </p>
        </div>
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .tab-container {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.1s;
        }
        
        .tab-btn {
          transition: all 0.3s ease;
        }
        .tab-btn:hover {
          transform: translateY(-2px);
        }
        .tab-btn.active {
          background: #fff;
          color: #ff961a;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .form-section {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.2s;
        }
        
        .preview-section {
          animation: slideInRight 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.25s;
        }
        
        .form-input, .form-textarea {
          transition: all 0.2s ease;
        }
        .form-input:focus, .form-textarea:focus {
          border-color: #ff961a;
          box-shadow: 0 0 0 3px rgba(255,150,26,0.1);
        }
        
        .upload-area {
          transition: all 0.2s ease;
        }
        .upload-area:hover {
          border-color: #ff961a;
          background: #fff7ed;
        }
        
        .publish-btn {
          transition: all 0.3s ease;
        }
        .publish-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -8px rgba(0,0,0,0.2);
        }
        
        .animate-field {
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
          animation-delay: 0.3s;
        }
        
        .success-toast {
          animation: slideUp 0.3s ease forwards;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  dashboardWrapper: { 
    maxWidth: "1100px", 
    margin: "30px auto", 
    padding: "20px 30px 40px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    background: "#fff",
    borderRadius: "40px",
    overflow: "hidden"
  },
  bgDecoration1: {
    position: "absolute",
    top: "-100px",
    right: "-80px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(255,150,26,0.06) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration2: {
    position: "absolute",
    bottom: "-60px",
    left: "-60px",
    width: "250px",
    height: "250px",
    background: "radial-gradient(circle, rgba(255,150,26,0.04) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
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
  mainTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#1e293b",
    fontWeight: "800",
    letterSpacing: "-0.5px"
  },
  subTitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#64748b"
  },
  tabContainer: { 
    display: "flex", 
    gap: "12px", 
    marginBottom: "32px", 
    background: "#f1f5f9", 
    padding: "6px", 
    borderRadius: "60px", 
    width: "fit-content",
    position: "relative",
    zIndex: 1
  },
  tabBtn: { 
    padding: "12px 28px", 
    border: "none", 
    borderRadius: "40px", 
    cursor: "pointer", 
    background: "transparent", 
    fontWeight: "600", 
    color: "#64748b", 
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    fontSize: "14px"
  },
  activeTab: { 
    background: "#fff", 
    color: "#ff961a", 
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
  },
  offerContainer: { 
    display: "grid", 
    gridTemplateColumns: "1fr 380px", 
    gap: "32px",
    position: "relative",
    zIndex: 1
  },
  glassSection: { 
    background: "#fff", 
    borderRadius: "28px", 
    padding: "32px", 
    border: "1px solid #f1f5f9", 
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)"
  },
  sectionTitle: { 
    fontSize: "20px", 
    fontWeight: "700", 
    marginBottom: "28px", 
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  formGroup: { 
    display: "flex", 
    flexDirection: "column" 
  },
  label: { 
    fontSize: "13px", 
    fontWeight: "600", 
    marginBottom: "8px", 
    color: "#475569", 
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center"
  },
  optional: {
    fontSize: "10px",
    fontWeight: "400",
    color: "#94a3b8",
    marginLeft: "8px"
  },
  required: {
    color: "#ef4444",
    fontSize: "12px",
    marginLeft: "4px"
  },
  input: { 
    padding: "14px 16px", 
    marginBottom: "24px", 
    borderRadius: "14px", 
    border: "2px solid #e2e8f0", 
    fontSize: "14px", 
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit"
  },
  fileUploadContainer: { 
    padding: "24px", 
    marginBottom: "24px", 
    borderRadius: "16px", 
    border: "2px dashed #e2e8f0", 
    textAlign: "center", 
    cursor: "pointer", 
    background: "#f8fafc",
    transition: "all 0.2s"
  },
  uploadPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px"
  },
  uploadSuccess: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: "#10b981"
  },
  removeImageBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748b",
    marginLeft: "8px"
  },
  textarea: { 
    padding: "14px 16px", 
    marginBottom: "24px", 
    borderRadius: "14px", 
    border: "2px solid #e2e8f0", 
    fontSize: "14px", 
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit"
  },
  primaryBtn: { 
    padding: "14px 24px", 
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", 
    color: "#fff", 
    border: "none", 
    borderRadius: "16px", 
    fontWeight: "700", 
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px"
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginRight: "8px"
  },
  successToast: {
    marginTop: "16px",
    padding: "12px 16px",
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    fontWeight: "500"
  },
  previewContainer: { 
    textAlign: "center" 
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "16px"
  },
  previewTitle: { 
    margin: 0, 
    fontSize: "13px", 
    fontWeight: "700", 
    color: "#94a3b8", 
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  mobileFrame: { 
    background: "#1e293b", 
    padding: "12px", 
    borderRadius: "36px", 
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" 
  },
  statusBar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 12px 4px",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "600"
  },
  statusIcons: {
    display: "flex",
    gap: "4px"
  },
  appCard: { 
    width: "100%", 
    height: "200px", 
    borderRadius: "24px", 
    overflow: "hidden", 
    position: "relative", 
    backgroundColor: "#f1f5f9" 
  },
  appImage: { 
    width: "100%", 
    height: "100%", 
    objectFit: "cover" 
  },
  imagePlaceholder: { 
    height: "100%", 
    display: "flex", 
    flexDirection: "column",
    alignItems: "center", 
    justifyContent: "center", 
    color: "#cbd5e1",
    gap: "8px"
  },
  appOverlayOffer: { 
    position: "absolute", 
    inset: 0, 
    padding: "16px", 
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "flex-end", 
    background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%)" 
  },
  appOverlaySlider: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: "12px", 
    background: "rgba(255,255,255,0.95)", 
    textAlign: "center",
    backdropFilter: "blur(8px)"
  },
  appTitle: { 
    color: "inherit", 
    fontSize: "14px", 
    fontWeight: "800", 
    margin: 0,
    color: "#1e293b"
  },
  appDesc: { 
    color: "#64748b", 
    fontSize: "11px", 
    marginTop: "4px" 
  },
  sliderIndicator: {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    marginTop: "8px"
  },
  activeDot: {
    width: "20px",
    height: "4px",
    borderRadius: "2px",
    backgroundColor: "#ff961a"
  },
  inactiveDot: {
    width: "6px",
    height: "4px",
    borderRadius: "2px",
    backgroundColor: "#cbd5e1"
  },
  homeIndicator: {
    width: "40%",
    height: "4px",
    background: "#475569",
    borderRadius: "2px",
    margin: "12px auto 8px"
  },
  previewHint: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "16px"
  }
};