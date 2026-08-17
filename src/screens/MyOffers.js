import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaEdit, FaMapMarkerAlt, FaCloudUploadAlt, 
  FaTimes, FaCalendarAlt, FaTicketAlt, FaCheckCircle,
  FaStore, FaPlus,
  FaArrowRight, FaPercent, FaSpinner, FaEye,
  FaSearch, FaGlobe, FaInfoCircle, FaThList, FaThLarge,
  FaChartLine, FaUsers, FaClock, FaGift, FaStar, FaTag,
  FaArrowUp, FaFilter, FaChevronDown, FaCrown, FaDownload
} from "react-icons/fa";
import { MdVerified, MdOutlineDashboard } from "react-icons/md";
import { HiOutlineTrendingUp, HiOutlineSparkles } from "react-icons/hi";

const BASE_URL = "https://the-deft-crew-production.up.railway.app"; 
const API_URL = `${BASE_URL}/api/offers`;
const CLOUDINARY_NAME = "decaxpera";

export default function MyOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [discountError, setDiscountError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [downloading, setDownloading] = useState(null);

  // Discount options for dropdown
  const discountOptions = [15, 20, 25, 30, 35, 40, 45, 50, 60];

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) setViewMode("list");
      else if (width >= 768 && viewMode === "list") setViewMode("grid");
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${API_URL}/my-offers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setOffers(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/400x200?text=No+Image";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
    if (imagePath.includes("TDC_") || imagePath.includes("/")) {
      return `https://res.cloudinary.com/${CLOUDINARY_NAME}/image/upload/${imagePath}`;
    }
    return `${BASE_URL}/uploads/offers/${imagePath}`;
  };

  const downloadImage = async (offerId, imageUrl, title) => {
    setDownloading(offerId);
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Create filename from offer title
      const sanitizedTitle = title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'offer';
      link.download = `${sanitizedTitle}_${offerId}.jpg`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(link.href), 100);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download image. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const openEditModal = (offer) => {
    setCurrentOffer({ ...offer, isOnline: offer.isOnline || false, isInStore: offer.isInStore || false });
    setPreview(getImageUrl(offer.image));
    setIsEditing(true);
    setDiscountError("");
  };

  const validateDiscount = (value) => {
    const num = parseInt(value);
    if (!value || value === "") { setDiscountError("Please select a discount percentage"); return false; }
    if (isNaN(num)) { setDiscountError("Please select a valid discount"); return false; }
    if (num < 15) { setDiscountError("Discount must be at least 15%"); return false; }
    if (num > 60) { setDiscountError("Discount cannot exceed 60%"); return false; }
    setDiscountError("");
    return true;
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    setCurrentOffer({ ...currentOffer, discountPercentage: value });
    if (value && value !== "") validateDiscount(value);
    else setDiscountError("Please select a discount percentage");
  };

  const handleUpdate = async () => {
    const discountValue = currentOffer.discountPercentage;
    if (!discountValue || discountValue === "") {
      alert("Please select a discount percentage");
      return;
    }
    const isValid = validateDiscount(discountValue);
    if (!isValid) {
      alert("Please select a valid discount percentage (15% - 60%)");
      return;
    }

    const formData = new FormData();
    Object.keys(currentOffer).forEach((key) => {
      const forbiddenKeys = ["image", "brand", "claimedBy", "redemptions", "__v", "createdAt", "updatedAt"];
      if (!forbiddenKeys.includes(key) && currentOffer[key] !== undefined && currentOffer[key] !== null) {
        if (key === "isOnline" || key === "isInStore") {
          formData.append(key, currentOffer[key] ? "true" : "false");
        } else {
          formData.append(key, currentOffer[key]);
        }
      }
    });
    if (imageFile) formData.append("image", imageFile);

    setUpdating(true);
    try {
      await axios.put(`${API_URL}/${currentOffer._id}`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      });
      alert("✅ Campaign Updated Successfully!");
      setIsEditing(false);
      setImageFile(null);
      fetchOffers();
    } catch (err) {
      console.error("Update failed", err);
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const getClaimRate = (offer) => {
    if (!offer.claimedBy || offer.claimedBy.length === 0) return 0;
    const views = offer.views || 100;
    return Math.min(Math.round((offer.claimedBy.length / views) * 100), 100);
  };

  const handleCreateOffer = () => navigate("/create-offer");

  const filteredAndSortedOffers = () => {
    let filtered = offers;
    if (searchTerm) {
      filtered = filtered.filter(offer => 
        offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus === "active") {
      filtered = filtered.filter(offer => offer.status !== "expired");
    } else if (filterStatus === "expired") {
      filtered = filtered.filter(offer => offer.status === "expired");
    }
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "popular") {
      filtered.sort((a, b) => (b.claimedBy?.length || 0) - (a.claimedBy?.length || 0));
    } else if (sortBy === "discount") {
      filtered.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    }
    return filtered;
  };

  const displayedOffers = filteredAndSortedOffers();

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loaderWrapper}>
          <div style={styles.loaderLogo}>📦</div>
          <div className="loader" style={styles.loader}></div>
          <p style={styles.loaderText}>Loading your campaigns...</p>
          <span style={styles.loaderSubtext}>We're getting your offers ready</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Background Decorations */}
      <div style={styles.gradientBg}></div>
      <div style={styles.glowOrb1}></div>
      <div style={styles.glowOrb2}></div>
      <div style={styles.glowOrb3}></div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.brandBadge}>
            <MdVerified size={14} color="#f9c349" />
            <span>Brand Dashboard</span>
          </div>
          <h1 style={styles.mainTitle}>
            <HiOutlineSparkles style={styles.titleIcon} />
            Discount
          </h1>
          <p style={styles.subTitle}>Manage and optimize your promotional offers</p>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon1}>
            <FaGift size={18} />
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statValue}>{offers.length}</span>
            <span style={styles.statLabel}>Total Offers</span>
          </div>
          <div style={styles.statTrend}>
            <FaArrowUp size={10} />
            <span>12%</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon2}>
            <FaUsers size={18} />
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statValue}>
              {offers.reduce((acc, curr) => acc + (curr.claimedBy?.length || 0), 0)}
            </span>
            <span style={styles.statLabel}>Total Claims</span>
          </div>
          <div style={styles.statTrend}>
            <FaArrowUp size={10} />
            <span>8%</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon3}>
            <FaClock size={18} />
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statValue}>
              {offers.filter(o => o.status !== "expired").length}
            </span>
            <span style={styles.statLabel}>Active Now</span>
          </div>
          <div style={styles.statTrend}>
            <FaArrowUp size={10} />
            <span>5%</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon4}>
            <HiOutlineTrendingUp size={18} />
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statValue}>
              {offers.length > 0 ? Math.round(offers.reduce((acc, curr) => acc + (curr.discountPercentage || 0), 0) / offers.length) : 0}%
            </span>
            <span style={styles.statLabel}>Avg Discount</span>
          </div>
          <div style={styles.statTrend}>
            <FaArrowUp size={10} />
            <span>3%</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controlsContainer}>
        <div style={styles.searchBox}>
          <FaSearch style={styles.searchIcon} />
          <input
            style={styles.searchInput}
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button style={styles.clearBtn} onClick={() => setSearchTerm("")}>
              <FaTimes size={12} />
            </button>
          )}
        </div>
        <div style={styles.controlsRight}>
          <button style={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            <FaFilter size={13} />
            <span>Filter</span>
            <FaChevronDown size={10} style={{...styles.chevron, transform: showFilters ? 'rotate(180deg)' : 'rotate(0)'}} />
          </button>
          <div style={styles.viewToggle}>
            <button style={{...styles.viewBtn, ...(viewMode === "list" ? styles.viewBtnActive : {})}} 
              onClick={() => setViewMode("list")}>
              <FaThList size={14} />
            </button>
            <button style={{...styles.viewBtn, ...(viewMode === "grid" ? styles.viewBtnActive : {})}} 
              onClick={() => setViewMode("grid")}>
              <FaThLarge size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Dropdown */}
      {showFilters && (
        <div style={styles.filtersDropdown}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select style={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Sort By</label>
            <select style={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="discount">Highest Discount</option>
            </select>
          </div>
        </div>
      )}

      {/* Offer Cards */}
      {displayedOffers.length > 0 ? (
        <div style={viewMode === "grid" ? styles.gridContainer : styles.listContainer}>
          {displayedOffers.map((offer) => (
            <div key={offer._id} style={viewMode === "grid" ? styles.offerCard : styles.offerCardList}>
              <div style={styles.cardImageWrapper}>
                <img src={getImageUrl(offer.image)} style={styles.cardImage} alt={offer.title || "Offer"} 
                  onError={(e) => e.target.src = "https://via.placeholder.com/400x200?text=Image+Error"} />
                <div style={styles.discountPill}>
                  <FaPercent size={10} />
                  <span>{offer.discountPercentage}% OFF</span>
                </div>
                <div style={styles.statusPill}>
                  <span style={styles.statusDot}></span>
                  <span>Active</span>
                </div>
                {/* Download Button */}
                <button 
                  style={styles.downloadBtn}
                  onClick={() => downloadImage(offer._id, getImageUrl(offer.image), offer.title)}
                  disabled={downloading === offer._id}
                  title="Download image"
                >
                  {downloading === offer._id ? (
                    <FaSpinner size={14} style={{animation: 'spin 1s linear infinite'}} />
                  ) : (
                    <FaDownload size={14} />
                  )}
                </button>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{offer.title}</h3>
                    <p style={styles.cardDesc}>{offer.description?.substring(0, 80)}...</p>
                  </div>
                  <button style={styles.editBtn} onClick={() => openEditModal(offer)}>
                    <FaEdit size={12} />
                    Edit
                  </button>
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.metaItem}>
                    <FaMapMarkerAlt size={12} />
                    {offer.location || "Online"}
                  </span>
                  <span style={styles.metaItem}>
                    <FaCalendarAlt size={12} />
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </span>
                  <span style={styles.metaItem}>
                    <FaTicketAlt size={12} />
                    {offer.claimedBy?.length || 0} claims
                  </span>
                  <span style={styles.metaItem}>
                    <FaEye size={12} />
                    {offer.views || 0} views
                  </span>
                </div>
                <div style={styles.cardBottom}>
                  <div style={styles.rateBar}>
                    <span style={styles.rateLabel}>Conversion</span>
                    <div style={styles.rateTrack}>
                      <div style={{...styles.rateFill, width: `${getClaimRate(offer)}%`}}></div>
                    </div>
                    <span style={styles.rateValue}>{getClaimRate(offer)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🚀</div>
          <h3 style={styles.emptyTitle}>Launch Your First Campaign</h3>
          <p style={styles.emptyText}>Create an offer and start connecting with customers today</p>
          <button style={styles.emptyBtn} onClick={handleCreateOffer}>
            <FaPlus size={14} />
            Get Started
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && currentOffer && (
        <div style={styles.modalOverlay} onClick={() => setIsEditing(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleGroup}>
                <div style={styles.modalIconBox}>
                  <FaEdit size={16} color="#6366f1" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Edit Campaign</h3>
                  <p style={styles.modalSub}>Update your offer details</p>
                </div>
              </div>
              <button style={styles.modalClose} onClick={() => setIsEditing(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Campaign Title</label>
                  <input style={styles.formInput} value={currentOffer.title} 
                    onChange={(e) => setCurrentOffer({...currentOffer, title: e.target.value})} 
                    placeholder="Enter title" />
                </div>
                <div style={styles.formGroup}>
                  <label style={{...styles.formLabel, color: discountError ? '#ef4444' : '#64748b'}}>
                    Discount %
                    <span style={styles.discountHint}>(15-60%)</span>
                  </label>
                  <select 
                    style={{
                      ...styles.discountSelect,
                      borderColor: discountError ? '#ef4444' : '#e2e8f0',
                      background: discountError ? '#fef2f2' : '#fafafa'
                    }}
                    value={currentOffer.discountPercentage || ""}
                    onChange={handleDiscountChange}
                  >
                    <option value="">Select discount</option>
                    {discountOptions.map((value) => (
                      <option key={value} value={value}>{value}%</option>
                    ))}
                  </select>
                  {discountError && (
                    <div style={styles.errorMsg}>
                      <FaInfoCircle size={11} />
                      <span>{discountError}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <textarea style={styles.formTextarea} value={currentOffer.description} 
                  onChange={(e) => setCurrentOffer({...currentOffer, description: e.target.value})} 
                  rows={2} placeholder="Describe your offer..." />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Redeem Instructions</label>
                <textarea style={styles.formTextarea} value={currentOffer.redeemInstructions || ""} 
                  onChange={(e) => setCurrentOffer({...currentOffer, redeemInstructions: e.target.value})} 
                  rows={2} placeholder="How to redeem..." />
              </div>

              <div style={styles.modalGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Location</label>
                  <input style={styles.formInput} value={currentOffer.location || ""} 
                    onChange={(e) => setCurrentOffer({...currentOffer, location: e.target.value})} 
                    placeholder="Store location" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Availability</label>
                  <div style={styles.checkboxGroup}>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" checked={currentOffer.isOnline || false} 
                        onChange={(e) => setCurrentOffer({...currentOffer, isOnline: e.target.checked})} />
                      <FaGlobe size={13} />
                      Online
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" checked={currentOffer.isInStore || false} 
                        onChange={(e) => setCurrentOffer({...currentOffer, isInStore: e.target.checked})} />
                      <FaStore size={13} />
                      In-Store
                    </label>
                  </div>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Banner Image</label>
                <div style={styles.imageUpload}>
                  <img src={preview} style={styles.imagePreview} alt="preview" 
                    onError={(e) => e.target.src = "https://via.placeholder.com/400x200?text=No+Image"} />
                  <label style={styles.uploadBtn}>
                    <FaCloudUploadAlt size={16} />
                    <span>Change Image</span>
                    <input type="file" hidden accept="image/*" onChange={(e) => {
                      if(e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }} />
                  </label>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
              <button style={{...styles.updateBtn, opacity: discountError ? 0.5 : 1,
                cursor: discountError ? 'not-allowed' : 'pointer'}} 
                onClick={handleUpdate} disabled={updating || !!discountError}>
                {updating ? (
                  <><FaSpinner style={{animation: 'spin 1s linear infinite'}} /> Updating...</>
                ) : (
                  <>Update Campaign <FaArrowRight size={12} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes modalFade {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .loader {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        .stat-card {
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.2s; }
        
        .offer-card {
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .offer-card:nth-child(1) { animation-delay: 0.05s; }
        .offer-card:nth-child(2) { animation-delay: 0.1s; }
        .offer-card:nth-child(3) { animation-delay: 0.15s; }
        .offer-card:nth-child(4) { animation-delay: 0.2s; }
        .offer-card:nth-child(5) { animation-delay: 0.25s; }
        .offer-card:nth-child(6) { animation-delay: 0.3s; }
        
        .offer-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.1);
          border-color: #6366f1;
        }
        
        input[type="checkbox"] {
          accent-color: #6366f1;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        @media (max-width: 480px) {
          .offer-card { animation-delay: 0s !important; }
          .stat-card { animation-delay: 0s !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    padding: "15px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: "relative",
    overflowX: "hidden",
    maxWidth: "100%",
    boxSizing: "border-box"
  },
  gradientBg: {
    position: "fixed",
    top: "-50%",
    right: "-30%",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0
  },
  glowOrb1: {
    position: "fixed",
    bottom: "-20%",
    left: "-10%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0
  },
  glowOrb2: {
    position: "fixed",
    top: "30%",
    right: "-10%",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0
  },
  glowOrb3: {
    position: "fixed",
    bottom: "40%",
    left: "50%",
    width: "200px",
    height: "200px",
    background: "radial-gradient(circle, rgba(52,211,153,0.03) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "15px",
    position: "relative",
    zIndex: 1,
    flexWrap: "wrap",
    gap: "12px"
  },
  headerLeft: {
    flex: 1
  },
  brandBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(99,102,241,0.1)",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: "8px"
  },
  mainTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.5px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  titleIcon: {
    color: "#f9c349",
    fontSize: "24px"
  },
  subTitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "400"
  },
  createBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 22px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(15,23,42,0.2)",
    whiteSpace: "nowrap"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
    position: "relative",
    zIndex: 1
  },
  statCard: {
    background: "#ffffff",
    padding: "16px 18px",
    borderRadius: "14px",
    border: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    transition: "all 0.3s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
  },
  statIcon1: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6366f1",
    flexShrink: 0
  },
  statIcon2: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#10b981",
    flexShrink: 0
  },
  statIcon3: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#d97706",
    flexShrink: 0
  },
  statIcon4: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ec4899",
    flexShrink: 0
  },
  statInfo: {
    flex: 1,
    minWidth: 0
  },
  statValue: {
    display: "block",
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: "1.2"
  },
  statLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500"
  },
  statTrend: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#10b981",
    background: "#ecfdf5",
    padding: "2px 10px",
    borderRadius: "12px"
  },
  controlsContainer: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    position: "relative",
    zIndex: 1,
    flexWrap: "wrap"
  },
  searchBox: {
    flex: 1,
    position: "relative",
    minWidth: "200px"
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "14px"
  },
  searchInput: {
    width: "100%",
    padding: "10px 14px 10px 42px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "13px",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box"
  },
  clearBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748b"
  },
  controlsRight: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  filterToggle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  chevron: {
    transition: "transform 0.3s ease"
  },
  viewToggle: {
    display: "flex",
    gap: "4px",
    background: "#f1f5f9",
    padding: "3px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0"
  },
  viewBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  viewBtnActive: {
    background: "#ffffff",
    color: "#0f172a",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  },
  filtersDropdown: {
    display: "flex",
    gap: "16px",
    padding: "16px",
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    marginBottom: "16px",
    position: "relative",
    zIndex: 1,
    flexWrap: "wrap",
    animation: "fadeIn 0.2s ease"
  },
  filterGroup: {
    flex: 1,
    minWidth: "120px"
  },
  filterLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px"
  },
  filterSelect: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fafafa",
    fontSize: "13px",
    color: "#1e293b",
    outline: "none",
    cursor: "pointer"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "18px",
    position: "relative",
    zIndex: 1
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    position: "relative",
    zIndex: 1
  },
  offerCard: {
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #f1f5f9",
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
  },
  offerCardList: {
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #f1f5f9",
    overflow: "hidden",
    display: "flex",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
  },
  cardImageWrapper: {
    position: "relative",
    height: "180px",
    overflow: "hidden",
    flexShrink: 0
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  discountPill: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#fff",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
  },
  statusPill: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "rgba(16, 185, 129, 0.95)",
    color: "#fff",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backdropFilter: "blur(8px)"
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#fff",
    animation: "pulse 2s ease-in-out infinite"
  },
  downloadBtn: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    background: "rgba(15, 23, 42, 0.85)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    backdropFilter: "blur(8px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: 2,
    border: "1px solid rgba(255,255,255,0.1)"
  },
  cardBody: {
    padding: "16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "10px"
  },
  cardHeader: {
    flex: 1,
    minWidth: 0
  },
  cardTitle: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a"
  },
  cardDesc: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.4"
  },
  editBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 14px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#475569",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
    height: "fit-content"
  },
  cardMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "12px"
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#64748b"
  },
  cardBottom: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px"
  },
  rateBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  rateLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569"
  },
  rateTrack: {
    flex: 1,
    height: "4px",
    background: "#f1f5f9",
    borderRadius: "2px",
    overflow: "hidden",
    minWidth: "60px"
  },
  rateFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
    borderRadius: "2px",
    transition: "width 0.8s ease"
  },
  rateValue: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#6366f1",
    minWidth: "36px",
    textAlign: "right"
  },
  emptyState: {
    padding: "48px 20px",
    textAlign: "center",
    background: "#ffffff",
    borderRadius: "16px",
    border: "2px dashed #e2e8f0",
    position: "relative",
    zIndex: 1
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px"
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 8px 0"
  },
  emptyText: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 24px 0"
  },
  emptyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 28px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(12px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "16px"
  },
  modal: {
    background: "#ffffff",
    width: "100%",
    maxWidth: "560px",
    maxHeight: "95vh",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 32px 64px rgba(0,0,0,0.2)",
    overflow: "hidden",
    animation: "modalFade 0.3s ease"
  },
  modalHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  modalIconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  modalTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a"
  },
  modalSub: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#64748b"
  },
  modalClose: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    flexShrink: 0
  },
  modalBody: {
    padding: "20px",
    overflowY: "auto",
    flex: 1
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px"
  },
  formGroup: {
    marginBottom: "14px"
  },
  formLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    marginBottom: "4px"
  },
  discountHint: {
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: "400",
    marginLeft: "4px",
    textTransform: "none"
  },
  formInput: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    background: "#fafafa"
  },
  discountSelect: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    background: "#fafafa",
    cursor: "pointer",
    appearance: "auto"
  },
  errorMsg: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
    fontSize: "11px",
    color: "#ef4444",
    fontWeight: "500"
  },
  formTextarea: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    minHeight: "60px",
    background: "#fafafa"
  },
  checkboxGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "2px",
    flexWrap: "wrap"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    padding: "4px 12px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    background: "#fafafa"
  },
  imageUpload: {
    position: "relative",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e2e8f0"
  },
  imagePreview: {
    width: "100%",
    height: "120px",
    objectFit: "cover"
  },
  uploadBtn: {
    position: "absolute",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    cursor: "pointer",
    opacity: 0,
    transition: "opacity 0.3s ease",
    fontWeight: "500",
    fontSize: "12px"
  },
  modalFooter: {
    padding: "14px 20px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "row",
    gap: "10px",
    backgroundColor: "#f8fafc"
  },
  cancelBtn: {
    flex: 1,
    padding: "9px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    color: "#475569",
    fontSize: "12px",
    transition: "all 0.3s ease"
  },
  updateBtn: {
    flex: 1,
    padding: "9px 16px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "12px",
    transition: "all 0.3s ease"
  },
  loaderContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px"
  },
  loaderWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px"
  },
  loaderLogo: {
    fontSize: "32px"
  },
  loader: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%"
  },
  loaderText: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "600",
    margin: 0
  },
  loaderSubtext: {
    color: "#94a3b8",
    fontSize: "12px",
    margin: 0
  }
};