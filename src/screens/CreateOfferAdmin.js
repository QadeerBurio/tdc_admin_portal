import React, { useState, useRef } from "react";
import { 
  FaImage, FaTag, FaArrowRight, FaCheckCircle, 
  FaMobileAlt, FaUpload, FaTimes, FaEye,
  FaSlidersH, FaGift, FaInfoCircle, FaSpinner,
  FaStar, FaClock, FaBell, FaUser, FaCog,
  FaShieldAlt, FaGlobe, FaHeart, FaShare,
  FaDownload, FaEdit, FaTrash, FaPlus,
  FaRocket, FaSparkles, FaMagic, FaPalette
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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

  const token = localStorage.getItem('token');
  if (!token) {
    alert("You must be logged in as admin!");
    return;
  }

  const formData = new FormData();
  formData.append("type", view);
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("image", data.image);

  setLoading(true);
  setUploadProgress(0);
  
  try {
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    const response = await fetch("https://the-deft-crew-production.up.railway.app/api/admin/add", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    clearInterval(interval);
    setUploadProgress(100);
    
    const result = await response.json();
    console.log("Server response:", result);

    if (response.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      clearForm();
      setTimeout(() => setUploadProgress(0), 500);
    } else {
      // Show detailed error
      const errorMsg = result.errors ? result.errors.join(', ') : result.message || "Unknown error";
      alert(`Server Error: ${errorMsg}`);
    }
  } catch (error) {
    console.error("Upload failed:", error);
    alert("Failed to connect to server. Check your network connection.");
  } finally {
    setLoading(false);
  }
};

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const localUrl = URL.createObjectURL(file);
      setData({ ...data, image: file, previewUrl: localUrl });
    }
  };

  return (
    <div style={styles.dashboardWrapper}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>
      <div style={styles.bgDecoration3}></div>
      <div style={styles.bgDecoration4}></div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={styles.header}
      >
        
        <motion.h1 
          style={styles.mainTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Content Manager
          <motion.span 
            style={styles.titleEmoji}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            
          </motion.span>
        </motion.h1>
        <motion.p 
          style={styles.subTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Manage slider images and exclusive offers for the mobile app
        </motion.p>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="tab-container" 
        style={styles.tabContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.button 
          className={`tab-btn ${view === "slider" ? "active" : ""}`}
          style={{ ...styles.tabBtn, ...(view === "slider" ? styles.activeTab : {}) }}
          onClick={() => { setView("slider"); clearForm(); }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaSlidersH style={{marginRight: '8px'}} />
          Home Slider
          {view === "slider" && (
            <motion.span 
              style={styles.tabIndicator}
              layoutId="tabIndicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </motion.button>
        <motion.button 
          className={`tab-btn ${view === "offer" ? "active" : ""}`}
          style={{ ...styles.tabBtn, ...(view === "offer" ? styles.activeTab : {}) }}
          onClick={() => { setView("offer"); clearForm(); }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaGift style={{marginRight: '8px'}} />
          Exclusive Offer
          {view === "offer" && (
            <motion.span 
              style={styles.tabIndicator}
              layoutId="tabIndicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </motion.button>
      </motion.div>

      <div style={styles.offerContainer}>
        {/* Form Side */}
        <motion.div 
          className="form-section" 
          style={styles.glassSection}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <motion.h2 
            style={styles.sectionTitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {view === "slider" ? (
              <><FaPalette style={{color: '#ff961a'}} /> Upload Slider Image</>
            ) : (
              <><FaMagic style={{color: '#ff961a'}} /> Create Exclusive Offer</>
            )}
          </motion.h2>
          
          <div style={styles.formGroup}>
            <motion.div 
              style={styles.formGroup}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <label style={styles.label}>
                {view === "slider" ? "Slider Caption" : "Offer Title"}
                <span style={styles.optional}>(Optional)</span>
              </label>
              <motion.input
                className="form-input"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder={view === "slider" ? "e.g., Summer Sale 2024" : "e.g., 50% Off on All Items"}
                style={styles.input}
                whileFocus={{ 
                  borderColor: "#ff961a", 
                  boxShadow: "0 0 0 4px rgba(255,150,26,0.15)",
                  scale: 1.01
                }}
              />
            </motion.div>

            <motion.div 
              style={styles.formGroup}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <label style={styles.label}>
                <FaImage style={{marginRight: '6px'}} />
                Banner Image <span style={styles.required}>*</span>
              </label>
              <motion.div 
                className="upload-area"
                style={{
                  ...styles.fileUploadContainer,
                  borderColor: dragActive ? '#ff961a' : '#e2e8f0',
                  background: dragActive ? '#fff7ed' : '#f8fafc',
                  borderStyle: dragActive ? 'solid' : 'dashed',
                }}
                onClick={() => fileInputRef.current.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                whileHover={{ 
                  borderColor: '#ff961a',
                  background: '#fff7ed',
                  scale: 1.01
                }}
              >
                {data.previewUrl ? (
                  <motion.div 
                    style={styles.uploadSuccess}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <motion.div 
                      style={styles.successIcon}
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 1, delay: 0.5 }}
                    >
                      <FaCheckCircle color="#10b981" size={24} />
                    </motion.div>
                    <span style={styles.successText}>Image loaded successfully</span>
                    <motion.button 
                      style={styles.removeImageBtn}
                      onClick={(e) => { e.stopPropagation(); clearForm(); }}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTimes />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div 
                    style={styles.uploadPlaceholder}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, type: "spring" }}
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -8, 0],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <FaUpload size={40} color="#cbd5e1" />
                    </motion.div>
                    <p style={styles.uploadText}>Click or drag to upload image</p>
                    <span style={styles.uploadHint}>PNG, JPG up to 5MB</span>
                  </motion.div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  style={{ display: "none" }} 
                />
              </motion.div>
            </motion.div>

            {view === "offer" && (
              <motion.div 
                className="animate-field"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <label style={styles.label}>
                  <FaInfoCircle style={{marginRight: '6px'}} />
                  Description
                </label>
                <motion.textarea
                  className="form-textarea"
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  placeholder="Enter offer details, terms, and conditions..."
                  style={styles.textarea}
                  rows={4}
                  whileFocus={{ 
                    borderColor: "#ff961a", 
                    boxShadow: "0 0 0 4px rgba(255,150,26,0.15)"
                  }}
                />
              </motion.div>
            )}

            {/* Upload Progress */}
            <AnimatePresence>
              {loading && uploadProgress > 0 && (
                <motion.div 
                  style={styles.progressContainer}
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                >
                  <div style={styles.progressBar}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.5 }}
                      style={{...styles.progressFill, width: `${uploadProgress}%`}}
                    />
                  </div>
                  <motion.p 
                    style={styles.progressText}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {uploadProgress}% Uploading...
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              className="publish-btn"
              style={{...styles.primaryBtn, opacity: loading ? 0.7 : 1}} 
              onClick={handlePublish} 
              disabled={loading}
              whileHover={{ 
                y: -3, 
                boxShadow: "0 12px 30px -8px rgba(0,0,0,0.3)",
                scale: 1.01
              }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? (
                <>
                  <FaSpinner style={styles.spinner} className="spinner" />
                  Publishing...
                </>
              ) : (
                <>
                  {view === "slider" ? "Add to Slider" : "Publish Offer"}
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <FaArrowRight style={{marginLeft: '8px'}} />
                  </motion.span>
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {success && (
                <motion.div 
                  className="success-toast" 
                  style={styles.successToast}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 0.5 }}
                  >
                    <FaCheckCircle size={20} />
                  </motion.div>
                  <span>{view === "slider" ? "Slider image" : "Offer"} published successfully!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Mobile Preview Side */}
        <motion.div 
          className="preview-section" 
          style={styles.previewContainer}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          <div style={styles.previewHeader}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FaEye style={{color: '#94a3b8'}} />
            </motion.div>
            <h3 style={styles.previewTitle}>Live Preview</h3>
          </div>
          <motion.div 
            style={styles.mobileFrame}
            whileHover={{ 
              y: -8, 
              boxShadow: "0 35px 70px -12px rgba(0,0,0,0.35)",
              scale: 1.02
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            <div style={styles.statusBar}>
              <span>9:41</span>
              <div style={styles.statusIcons}>
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>
            <motion.div 
              style={styles.appCard}
              whileHover={{ scale: 1.01 }}
            >
              {data.previewUrl ? (
                <motion.img 
                  src={data.previewUrl} 
                  alt="preview" 
                  style={styles.appImage}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              ) : (
                <div style={styles.imagePlaceholder}>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FaImage size={40} color="#cbd5e1" />
                  </motion.div>
                  <span style={styles.placeholderText}>No image selected</span>
                </div>
              )}
              
              <motion.div 
                style={view === "offer" ? styles.appOverlayOffer : styles.appOverlaySlider}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <motion.p 
                  style={styles.appTitle}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {data.title || (view === "slider" ? "Summer Collection" : "Special Offer")}
                </motion.p>
                {view === "offer" && (
                  <motion.p 
                    style={styles.appDesc}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {data.description || "Tap to view details and claim discount"}
                  </motion.p>
                )}
                {view === "slider" && (
                  <div style={styles.sliderIndicator}>
                    <motion.div 
                      style={styles.activeDot}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div style={styles.inactiveDot}></div>
                    <div style={styles.inactiveDot}></div>
                  </div>
                )}
              </motion.div>
            </motion.div>
            <div style={styles.homeIndicator}></div>
          </motion.div>
          <motion.p 
            style={styles.previewHint}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {view === "slider" 
              ? "Slider images appear in carousel on home screen" 
              : "Offer appears on the exclusive deals section"}
          </motion.p>
        </motion.div>
      </div>

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
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(255,150,26,0.2); }
            50% { box-shadow: 0 0 20px rgba(255,150,26,0.4); }
            100% { box-shadow: 0 0 5px rgba(255,150,26,0.2); }
          }
          
          .tab-container {
            animation: slideUp 0.5s ease forwards;
            opacity: 0;
            animation-delay: 0.1s;
          }
          
          .tab-btn {
            transition: all 0.3s ease;
            position: relative;
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
          .publish-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -8px rgba(0,0,0,0.2);
          }
          .publish-btn:disabled {
            cursor: not-allowed;
          }
          
          .animate-field {
            animation: slideUp 0.4s ease forwards;
            opacity: 0;
            animation-delay: 0.3s;
          }
          
          .success-toast {
            animation: slideUp 0.3s ease forwards;
          }
          
          .spinner {
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
          }

          .float-animation {
            animation: float 3s ease-in-out infinite;
          }

          .glow-animation {
            animation: glow 2s ease-in-out infinite;
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

          @media (max-width: 768px) {
            .offerContainer {
              grid-template-columns: 1fr !important;
            }
            .previewContainer {
              order: -1;
            }
            .mobileFrame {
              max-width: 100% !important;
            }
            .tabContainer {
              width: 100% !important;
              flex-direction: column !important;
              border-radius: 16px !important;
            }
            .tabBtn {
              justify-content: center !important;
            }
          }
        `}
      </style>
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
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
  },
  bgDecoration1: {
    position: "absolute",
    top: "-100px",
    right: "-80px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(255,150,26,0.08) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration2: {
    position: "absolute",
    bottom: "-60px",
    left: "-60px",
    width: "250px",
    height: "250px",
    background: "radial-gradient(circle, rgba(255,150,26,0.05) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration3: {
    position: "absolute",
    top: "50%",
    right: "10%",
    width: "150px",
    height: "150px",
    background: "radial-gradient(circle, rgba(255,150,26,0.04) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration4: {
    position: "absolute",
    bottom: "30%",
    left: "5%",
    width: "100px",
    height: "100px",
    background: "radial-gradient(circle, rgba(255,150,26,0.03) 0%, rgba(255,150,26,0) 70%)",
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
    background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ff961a",
    marginBottom: "16px",
    border: "1px solid rgba(255,150,26,0.1)"
  },
  mainTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#1e293b",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  titleEmoji: {
    fontSize: "28px",
    display: "inline-block"
  },
  subTitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#64748b",
    maxWidth: "450px",
    marginLeft: "auto",
    marginRight: "auto"
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
    zIndex: 1,
    marginLeft: "auto",
    marginRight: "auto"
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
    fontSize: "14px",
    position: "relative"
  },
  tabIndicator: {
    position: "absolute",
    bottom: "-4px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "20px",
    height: "3px",
    background: "#ff961a",
    borderRadius: "4px"
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
    gap: "10px"
  },
  formGroup: { 
    display: "flex", 
    flexDirection: "column",
    gap: "4px"
  },
  label: { 
    fontSize: "13px", 
    fontWeight: "600", 
    marginBottom: "4px", 
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
    marginBottom: "20px", 
    borderRadius: "14px", 
    border: "2px solid #e2e8f0", 
    fontSize: "14px", 
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
    color: "#1e293b",
    backgroundColor: "#fff"
  },
  fileUploadContainer: { 
    padding: "24px", 
    marginBottom: "20px", 
    borderRadius: "16px", 
    border: "2px dashed #e2e8f0", 
    textAlign: "center", 
    cursor: "pointer", 
    background: "#f8fafc",
    transition: "all 0.2s",
    position: "relative"
  },
  uploadPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px"
  },
  uploadText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    margin: 0
  },
  uploadHint: {
    fontSize: "12px",
    color: "#94a3b8"
  },
  uploadSuccess: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: "#10b981",
    fontSize: "14px",
    fontWeight: "500"
  },
  successIcon: {
    display: "flex"
  },
  successText: {
    color: "#065f46"
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
    marginLeft: "8px",
    transition: "all 0.2s ease"
  },
  textarea: { 
    padding: "14px 16px", 
    marginBottom: "20px", 
    borderRadius: "14px", 
    border: "2px solid #e2e8f0", 
    fontSize: "14px", 
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    color: "#1e293b",
    backgroundColor: "#fff",
    minHeight: "100px"
  },
  progressContainer: {
    marginBottom: "16px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "12px"
  },
  progressBar: {
    height: "6px",
    background: "#e5e7eb",
    borderRadius: "3px",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #f9c349 0%, #ff961a 100%)",
    borderRadius: "3px",
    transition: "width 0.5s ease"
  },
  progressText: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "6px",
    textAlign: "center"
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
    fontSize: "15px",
    transition: "all 0.3s ease"
  },
  spinner: {
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
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
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
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
    width: "100%",
    maxWidth: "280px",
    transition: "all 0.3s ease"
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
    backgroundColor: "#f1f5f9",
    transition: "all 0.3s ease"
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
  placeholderText: {
    fontSize: "12px"
  },
  appOverlayOffer: { 
    position: "absolute", 
    inset: 0, 
    padding: "16px", 
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "flex-end", 
    background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%)",
    color: "#fff"
  },
  appOverlaySlider: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: "12px", 
    background: "rgba(255,255,255,0.95)", 
    textAlign: "center",
    backdropFilter: "blur(8px)",
    borderTop: "1px solid rgba(0,0,0,0.05)"
  },
  appTitle: { 
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
    marginTop: "16px",
    maxWidth: "280px"
  }
};