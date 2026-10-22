import React, { useState, useRef, useEffect } from "react";
import { 
  FaImage, FaTag, FaArrowRight, FaCheckCircle, 
  FaMobileAlt, FaUpload, FaTimes, FaEye,
  FaSlidersH, FaGift, FaInfoCircle, FaSpinner,
  FaStar, FaClock, FaBell, FaUser, FaCog,
  FaShieldAlt, FaGlobe, FaHeart, FaShare,
  FaDownload, FaEdit, FaTrash, FaPlus,
  FaRocket, FaMagic, FaPalette
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateOfferAdmin() {
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      
      const response = await fetch("https://the-deft-crew-production.up.railway.app/api/admin/add",
         {
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
    <div style={{
      ...styles.dashboardWrapper,
      padding: 0,
      margin: 0,
      borderRadius: 0,
    }}>
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
          style={{
            ...styles.mainTitle,
            fontSize: isMobile ? "22px" : isTablet ? "28px" : "32px",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span>create offer<span className="dot" aria-hidden="true">.</span></span>
        </motion.h1>
        <motion.p 
          style={{
            ...styles.subTitle,
            fontSize: isMobile ? "12px" : isTablet ? "13px" : "14px",
            maxWidth: isMobile ? "100%" : "450px",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          add a home slider image or an exclusive offer to the app.
        </motion.p>
      </motion.div>

      {/* Navigation Tabs - Responsive */}
      <motion.div 
        className="tab-container" 
        style={{
          ...styles.tabContainer,
          flexDirection: isMobile ? "column" : "row",
          width: isMobile ? "100%" : "fit-content",
          borderRadius: isMobile ? "16px" : "60px",
          padding: isMobile ? "4px" : "6px",
          gap: isMobile ? "4px" : "12px",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.button 
          className={`tab-btn ${view === "slider" ? "active" : ""}`}
          style={{ 
            ...styles.tabBtn, 
            ...(view === "slider" ? styles.activeTab : {}),
            padding: isMobile ? "10px 16px" : isTablet ? "12px 24px" : "12px 28px",
            fontSize: isMobile ? "13px" : isTablet ? "13px" : "14px",
            justifyContent: isMobile ? "center" : "center",
            width: isMobile ? "100%" : "auto",
          }}
          onClick={() => { setView("slider"); clearForm(); }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaSlidersH style={{marginRight: '8px'}} />
          {isMobile ? "Slider" : "Home Slider"}
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
          style={{ 
            ...styles.tabBtn, 
            ...(view === "offer" ? styles.activeTab : {}),
            padding: isMobile ? "10px 16px" : isTablet ? "12px 24px" : "12px 28px",
            fontSize: isMobile ? "13px" : isTablet ? "13px" : "14px",
            justifyContent: isMobile ? "center" : "center",
            width: isMobile ? "100%" : "auto",
          }}
          onClick={() => { setView("offer"); clearForm(); }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaGift style={{marginRight: '8px'}} />
          {isMobile ? "Offer" : "Exclusive Offer"}
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

      <div style={{
        ...styles.offerContainer,
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 320px" : "1fr 380px",
        gap: isMobile ? "20px" : isTablet ? "24px" : "32px",
      }}>
        {/* Form Side */}
        <motion.div 
          className="form-section" 
          style={{
            ...styles.glassSection,
            padding: isMobile ? "20px" : isTablet ? "24px" : "32px",
            borderRadius: isMobile ? "20px" : isTablet ? "24px" : "28px",
          }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <motion.h2 
            style={{
              ...styles.sectionTitle,
              fontSize: isMobile ? "17px" : isTablet ? "19px" : "20px",
              marginBottom: isMobile ? "20px" : isTablet ? "24px" : "28px",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {view === "slider" ? (
              <><FaPalette style={{color: '#C77700'}} /> {isMobile ? "Upload Slider" : "Upload Slider Image"}</>
            ) : (
              <><FaMagic style={{color: '#C77700'}} /> {isMobile ? "Create Offer" : "Create Exclusive Offer"}</>
            )}
          </motion.h2>
          
          <div style={styles.formGroup}>
            <motion.div 
              style={styles.formGroup}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <label style={{
                ...styles.label,
                fontSize: isMobile ? "11px" : isTablet ? "12px" : "13px",
              }}>
                {view === "slider" ? "Slider Caption" : "Offer Title"}
                <span style={styles.optional}>(Optional)</span>
              </label>
              <motion.input
                className="form-input"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder={view === "slider" ? "e.g., Summer Sale 2024" : "e.g., 50% Off on All Items"}
                style={{
                  ...styles.input,
                  padding: isMobile ? "10px 14px" : isTablet ? "12px 16px" : "14px 16px",
                  fontSize: isMobile ? "13px" : isTablet ? "13px" : "14px",
                  marginBottom: isMobile ? "14px" : isTablet ? "16px" : "20px",
                }}
                whileFocus={{ 
                  borderColor: "#111111", 
                  boxShadow: "0 0 0 4px rgba(249, 195, 73,0.15)",
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
              <label style={{
                ...styles.label,
                fontSize: isMobile ? "11px" : isTablet ? "12px" : "13px",
              }}>
                <FaImage style={{marginRight: '6px'}} />
                Banner Image <span style={styles.required}>*</span>
              </label>
              <motion.div 
                className="upload-area"
                style={{
                  ...styles.fileUploadContainer,
                  padding: isMobile ? "16px" : isTablet ? "20px" : "24px",
                  marginBottom: isMobile ? "14px" : isTablet ? "16px" : "20px",
                  borderColor: dragActive ? '#111111' : '#ECE7DB',
                  background: dragActive ? '#FFF1CC' : '#FAF8F3',
                  borderStyle: dragActive ? 'solid' : 'dashed',
                }}
                onClick={() => fileInputRef.current.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                whileHover={{ 
                  borderColor: '#111111',
                  background: '#FFF1CC',
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
                      <FaCheckCircle color="#1E6B3A" size={isMobile ? 20 : 24} />
                    </motion.div>
                    <span style={{
                      ...styles.successText,
                      fontSize: isMobile ? "12px" : isTablet ? "13px" : "14px",
                    }}>Image loaded</span>
                    <motion.button 
                      style={{
                        ...styles.removeImageBtn,
                        width: isMobile ? "24px" : "28px",
                        height: isMobile ? "24px" : "28px",
                      }}
                      onClick={(e) => { e.stopPropagation(); clearForm(); }}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTimes size={isMobile ? 12 : 14} />
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
                      <FaUpload size={isMobile ? 28 : 40} color="#9A958B" />
                    </motion.div>
                    <p style={{
                      ...styles.uploadText,
                      fontSize: isMobile ? "12px" : isTablet ? "13px" : "14px",
                    }}>{isMobile ? "Tap to upload" : "Click or drag to upload"}</p>
                    <span style={{
                      ...styles.uploadHint,
                      fontSize: isMobile ? "10px" : isTablet ? "11px" : "12px",
                    }}>PNG, JPG up to 5MB</span>
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
                <label style={{
                  ...styles.label,
                  fontSize: isMobile ? "11px" : isTablet ? "12px" : "13px",
                }}>
                  <FaInfoCircle style={{marginRight: '6px'}} />
                  Description
                </label>
                <motion.textarea
                  className="form-textarea"
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  placeholder="Enter offer details, terms, and conditions..."
                  style={{
                    ...styles.textarea,
                    padding: isMobile ? "10px 14px" : isTablet ? "12px 16px" : "14px 16px",
                    fontSize: isMobile ? "13px" : isTablet ? "13px" : "14px",
                    marginBottom: isMobile ? "14px" : isTablet ? "16px" : "20px",
                    minHeight: isMobile ? "80px" : "100px",
                  }}
                  rows={isMobile ? 3 : 4}
                  whileFocus={{ 
                    borderColor: "#111111", 
                    boxShadow: "0 0 0 4px rgba(249, 195, 73,0.15)"
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
                    style={{
                      ...styles.progressText,
                      fontSize: isMobile ? "11px" : "12px",
                    }}
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
              style={{
                ...styles.primaryBtn,
                padding: isMobile ? "12px 20px" : isTablet ? "13px 22px" : "14px 24px",
                fontSize: isMobile ? "13px" : isTablet ? "14px" : "15px",
                opacity: loading ? 0.7 : 1,
                borderRadius: isMobile ? "12px" : isTablet ? "14px" : "16px",
              }} 
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
                  style={{
                    ...styles.successToast,
                    padding: isMobile ? "10px 14px" : "12px 16px",
                    fontSize: isMobile ? "12px" : isTablet ? "12px" : "13px",
                  }}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 0.5 }}
                  >
                    <FaCheckCircle size={isMobile ? 16 : 20} />
                  </motion.div>
                  <span>{view === "slider" ? "Slider image" : "Offer"} published successfully!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Mobile Preview Side - Responsive */}
        <motion.div 
          className="preview-section" 
          style={{
            ...styles.previewContainer,
            order: isMobile ? -1 : 0,
          }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          <div style={styles.previewHeader}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FaEye style={{color: '#9A958B'}} />
            </motion.div>
            <h3 style={{
              ...styles.previewTitle,
              fontSize: isMobile ? "11px" : isTablet ? "12px" : "13px",
            }}>Live Preview</h3>
          </div>
          <motion.div 
            style={{
              ...styles.mobileFrame,
              padding: isMobile ? "8px" : isTablet ? "10px" : "12px",
              maxWidth: isMobile ? "200px" : isTablet ? "220px" : "280px",
              borderRadius: isMobile ? "24px" : isTablet ? "28px" : "36px",
            }}
            whileHover={{ 
              y: -8, 
              boxShadow: "0 1px 2px rgba(17, 17, 17, 0.04)",
              scale: 1.02
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            <div style={{
              ...styles.statusBar,
              fontSize: isMobile ? "9px" : isTablet ? "10px" : "12px",
              padding: isMobile ? "4px 8px 2px" : isTablet ? "6px 10px 3px" : "8px 12px 4px",
            }}>
              <span>9:41</span>
              <div style={styles.statusIcons}>
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>
            <motion.div 
              style={{
                ...styles.appCard,
                height: isMobile ? "140px" : isTablet ? "160px" : "200px",
                borderRadius: isMobile ? "16px" : isTablet ? "20px" : "24px",
              }}
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
                    <FaImage size={isMobile ? 24 : 40} color="#9A958B" />
                  </motion.div>
                  <span style={{
                    ...styles.placeholderText,
                    fontSize: isMobile ? "9px" : isTablet ? "10px" : "12px",
                  }}>No image</span>
                </div>
              )}
              
              <motion.div 
                style={view === "offer" ? {
                  ...styles.appOverlayOffer,
                  padding: isMobile ? "10px" : isTablet ? "12px" : "16px",
                } : {
                  ...styles.appOverlaySlider,
                  padding: isMobile ? "8px" : isTablet ? "10px" : "12px",
                }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <motion.p 
                  style={{
                    ...styles.appTitle,
                    fontSize: isMobile ? "11px" : isTablet ? "12px" : "14px",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {data.title || (view === "slider" ? "Summer Collection" : "Special Offer")}
                </motion.p>
                {view === "offer" && (
                  <motion.p 
                    style={{
                      ...styles.appDesc,
                      fontSize: isMobile ? "9px" : isTablet ? "10px" : "11px",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {data.description || "Tap to view details and claim discount"}
                  </motion.p>
                )}
                {view === "slider" && (
                  <div style={{
                    ...styles.sliderIndicator,
                    marginTop: isMobile ? "4px" : isTablet ? "6px" : "8px",
                  }}>
                    <motion.div 
                      style={{
                        ...styles.activeDot,
                        width: isMobile ? "14px" : isTablet ? "16px" : "20px",
                        height: isMobile ? "3px" : isTablet ? "3px" : "4px",
                      }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div style={{
                      ...styles.inactiveDot,
                      width: isMobile ? "4px" : isTablet ? "5px" : "6px",
                      height: isMobile ? "3px" : isTablet ? "3px" : "4px",
                    }}></div>
                    <div style={{
                      ...styles.inactiveDot,
                      width: isMobile ? "4px" : isTablet ? "5px" : "6px",
                      height: isMobile ? "3px" : isTablet ? "3px" : "4px",
                    }}></div>
                  </div>
                )}
              </motion.div>
            </motion.div>
            <div style={{
              ...styles.homeIndicator,
              width: isMobile ? "30%" : isTablet ? "35%" : "40%",
              height: isMobile ? "3px" : isTablet ? "3px" : "4px",
              margin: isMobile ? "8px auto 4px" : isTablet ? "10px auto 6px" : "12px auto 8px",
            }}></div>
          </motion.div>
          <motion.p 
            style={{
              ...styles.previewHint,
              fontSize: isMobile ? "9px" : isTablet ? "10px" : "11px",
              maxWidth: isMobile ? "200px" : isTablet ? "220px" : "280px",
              marginTop: isMobile ? "12px" : isTablet ? "14px" : "16px",
            }}
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
          0% { box-shadow: 0 0 5px rgba(249, 195, 73,0.2); }
          50% { box-shadow: 0 0 20px rgba(249, 195, 73,0.4); }
          100% { box-shadow: 0 0 5px rgba(249, 195, 73,0.2); }
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
          color: #C77700;
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
          border-color: #C77700;
          box-shadow: 0 0 0 3px rgba(249, 195, 73,0.1);
        }
        
        .upload-area {
          transition: all 0.2s ease;
        }
        .upload-area:hover {
          border-color: #C77700;
          background: #FFF1CC;
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
          background: linear-gradient(135deg, #f9c349 0%, #111111 100%);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #111111;
        }

        @media (max-width: 768px) {
          .offerContainer {
            grid-template-columns: 1fr !important;
          }
          .previewContainer {
            order: -1 !important;
          }
          .mobileFrame {
            max-width: 200px !important;
          }
          .tabContainer {
            width: 100% !important;
            flex-direction: column !important;
            border-radius: 16px !important;
            padding: 4px !important;
          }
          .tabBtn {
            padding: 10px 16px !important;
            font-size: 13px !important;
            justify-content: center !important;
            width: 100% !important;
          }
        }

        @media (max-width: 480px) {
          .dashboardWrapper {
            padding: 10px 12px 20px !important;
            margin: 8px !important;
            border-radius: 16px !important;
          }
          .mainTitle {
            font-size: 18px !important;
          }
          .subTitle {
            font-size: 11px !important;
          }
          .sectionTitle {
            font-size: 15px !important;
          }
          .glassSection {
            padding: 16px !important;
            border-radius: 16px !important;
          }
          .input, .textarea {
            font-size: 12px !important;
            padding: 8px 12px !important;
          }
          .mobileFrame {
            max-width: 160px !important;
            padding: 6px !important;
            border-radius: 20px !important;
          }
          .appCard {
            height: 120px !important;
          }
          .appTitle {
            font-size: 10px !important;
          }
          .statusBar {
            font-size: 8px !important;
            padding: 2px 6px !important;
          }
          .primaryBtn {
            font-size: 12px !important;
            padding: 10px 16px !important;
          }
          .tabBtn {
            font-size: 12px !important;
            padding: 8px 12px !important;
          }
          .fileUploadContainer {
            padding: 12px !important;
          }
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
    position: "relative",
    background: "transparent",
    borderRadius: "0",
    overflow: "hidden",
    boxShadow: "none"
  },
  bgDecoration1: {
    position: "absolute",
    top: "-100px",
    right: "-80px",
    width: "300px",
    height: "300px",
    background: "transparent",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration2: {
    position: "absolute",
    bottom: "-60px",
    left: "-60px",
    width: "250px",
    height: "250px",
    background: "transparent",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration3: {
    position: "absolute",
    top: "50%",
    right: "10%",
    width: "150px",
    height: "150px",
    background: "transparent",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration4: {
    position: "absolute",
    bottom: "30%",
    left: "5%",
    width: "100px",
    height: "100px",
    background: "transparent",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  header: {
    textAlign: "left",
    marginBottom: "32px",
    position: "relative",
    zIndex: 1
  },
  mainTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#111111",
    fontWeight: "800",
    letterSpacing: "-0.8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "8px"
  },
  titleEmoji: {
    fontSize: "28px",
    display: "inline-block"
  },
  subTitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#6B675E",
    maxWidth: "560px",
  },
  tabContainer: { 
    display: "flex", 
    gap: "12px", 
    marginBottom: "32px", 
    background: "#F0ECE2", 
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
    color: "#6B675E", 
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
    background: "#111111",
    borderRadius: "4px"
  },
  activeTab: { 
    background: "#fff", 
    color: "#C77700", 
    boxShadow: "0 1px 2px rgba(17, 17, 17, 0.04)" 
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
    border: "1px solid #F0ECE2", 
    boxShadow: "0 1px 2px rgba(17, 17, 17, 0.04)"
  },
  sectionTitle: { 
    fontSize: "20px", 
    fontWeight: "700", 
    marginBottom: "28px", 
    color: "#111111",
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
    color: "#6B675E", 
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center"
  },
  optional: {
    fontSize: "10px",
    fontWeight: "400",
    color: "#9A958B",
    marginLeft: "8px"
  },
  required: {
    color: "#B42318",
    fontSize: "12px",
    marginLeft: "4px"
  },
  input: { 
    padding: "14px 16px", 
    marginBottom: "20px", 
    borderRadius: "14px", 
    border: "2px solid #ECE7DB", 
    fontSize: "14px", 
    outline: "none",
    transition: "all 0.2s",
    color: "#111111",
    backgroundColor: "#fff"
  },
  fileUploadContainer: { 
    padding: "24px", 
    marginBottom: "20px", 
    borderRadius: "16px", 
    border: "2px dashed #ECE7DB", 
    textAlign: "center", 
    cursor: "pointer", 
    background: "#FAF8F3",
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
    color: "#6B675E",
    margin: 0
  },
  uploadHint: {
    fontSize: "12px",
    color: "#9A958B"
  },
  uploadSuccess: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: "#1E6B3A",
    fontSize: "14px",
    fontWeight: "500"
  },
  successIcon: {
    display: "flex"
  },
  successText: {
    color: "#1E6B3A"
  },
  removeImageBtn: {
    background: "#F0ECE2",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#6B675E",
    marginLeft: "8px",
    transition: "all 0.2s ease"
  },
  textarea: { 
    padding: "14px 16px", 
    marginBottom: "20px", 
    borderRadius: "14px", 
    border: "2px solid #ECE7DB", 
    fontSize: "14px", 
    resize: "vertical",
    outline: "none",
    color: "#111111",
    backgroundColor: "#fff",
    minHeight: "100px"
  },
  progressContainer: {
    marginBottom: "16px",
    padding: "12px",
    background: "#FAF8F3",
    borderRadius: "12px"
  },
  progressBar: {
    height: "6px",
    background: "#ECE7DB",
    borderRadius: "3px",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    background: "#F9C349",
    borderRadius: "3px",
    transition: "width 0.5s ease"
  },
  progressText: {
    fontSize: "12px",
    color: "#6B675E",
    marginTop: "6px",
    textAlign: "center"
  },
  primaryBtn: { 
    padding: "14px 24px", 
    background: "#111111", 
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
    background: "#E3F3E8",
    color: "#1E6B3A",
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
    color: "#9A958B", 
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  mobileFrame: { 
    background: "#111111", 
    padding: "12px", 
    borderRadius: "36px", 
    boxShadow: "0 1px 2px rgba(17, 17, 17, 0.04)",
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
    backgroundColor: "#F0ECE2",
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
    color: "#9A958B",
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
    color: "#111111"
  },
  appDesc: { 
    color: "#6B675E", 
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
    backgroundColor: "#111111"
  },
  inactiveDot: {
    width: "6px",
    height: "4px",
    borderRadius: "2px",
    backgroundColor: "#ECE7DB"
  },
  homeIndicator: {
    width: "40%",
    height: "4px",
    background: "#D9D2C2",
    borderRadius: "2px",
    margin: "12px auto 8px"
  },
  previewHint: {
    fontSize: "11px",
    color: "#9A958B",
    marginTop: "16px",
    maxWidth: "280px"
  }
};