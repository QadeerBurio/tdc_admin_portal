import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaEdit, FaMapMarkerAlt, FaCloudUploadAlt, 
  FaTimes, FaCalendarAlt, FaTicketAlt, FaCheckCircle,
  FaTrashAlt, FaStore, FaPlus,
  FaArrowRight, FaPercent, FaSpinner, FaEye,
  FaChartLine, FaTag, FaClock, FaUserCheck,
  FaExternalLinkAlt, FaFilter, FaSearch
} from "react-icons/fa";
import { MdVerified, MdOutlineAnalytics, MdOutlineStorefront } from "react-icons/md";
import { BiTrendingUp, BiTimeFive } from "react-icons/bi";
import { HiOutlineDotsVertical } from "react-icons/hi";

const BASE_URL = "https://the-deft-crew-production.up.railway.app"; 
const API_URL = `${BASE_URL}/api/offers`;

// Cloudinary configuration
const CLOUDINARY_NAME = "decaxpera";

export default function MyOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${API_URL}/my-offers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      console.log("📦 Fetched offers:", res.data);
      setOffers(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "https://via.placeholder.com/400x200?text=No+Image";
    }
    
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    
    if (imagePath.includes("TDC_") || imagePath.includes("/")) {
      return `https://res.cloudinary.com/${CLOUDINARY_NAME}/image/upload/${imagePath}`;
    }
    
    return `${BASE_URL}/uploads/offers/${imagePath}`;
  };

  const openEditModal = (offer) => {
    setCurrentOffer({ ...offer });
    setPreview(getImageUrl(offer.image));
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    const formData = new FormData();
    
    Object.keys(currentOffer).forEach((key) => {
      const forbiddenKeys = ["image", "brand", "claimedBy", "redemptions", "__v", "createdAt", "updatedAt"];
      if (!forbiddenKeys.includes(key) && currentOffer[key] !== undefined && currentOffer[key] !== null) {
        formData.append(key, currentOffer[key]);
      }
    });

    if (imageFile) {
      formData.append("image", imageFile);
    }

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

  const handleDelete = async (offerId) => {
    try {
      await axios.delete(`${API_URL}/${offerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      alert("🗑️ Offer deleted successfully");
      setDeleteConfirm(null);
      fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const getClaimRate = (offer) => {
    if (!offer.claimedBy || offer.claimedBy.length === 0) return 0;
    const views = offer.views || 100;
    return Math.min(Math.round((offer.claimedBy.length / views) * 100), 100);
  };

  const handleCreateOffer = () => {
    navigate("/create-offer");
  };

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
          <div className="loader" style={styles.loader}></div>
          <p style={styles.loaderText}>Loading your campaigns...</p>
          <span style={styles.loaderSubtext}>Please wait while we fetch your offers</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Background Decorations */}
      <div style={styles.bgCircle1}></div>
      <div style={styles.bgCircle2}></div>
      <div style={styles.bgCircle3}></div>

      {/* Dashboard Header */}
      <div style={styles.dashboardHeader}>
        <div style={styles.headerLeft}>
          
         
        </div>
       
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div className="stat-card" style={styles.statCard}>
          <div style={styles.statIconWrapper1}>
            <FaTicketAlt size={20} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>{offers.length}</span>
            <span style={styles.statLabel}>Total Offers</span>
          </div>
          <div style={styles.statTrend}>
            <BiTrendingUp size={16} color="#10b981" />
            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '600' }}>+12%</span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={styles.statIconWrapper2}>
            <FaUserCheck size={20} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>
              {offers.reduce((acc, curr) => acc + (curr.claimedBy?.length || 0), 0)}
            </span>
            <span style={styles.statLabel}>Total Claims</span>
          </div>
          <div style={styles.statTrend}>
            <BiTrendingUp size={16} color="#10b981" />
            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '600' }}>+8%</span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={styles.statIconWrapper3}>
            <BiTimeFive size={20} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>
              {offers.filter(o => o.status !== "expired").length}
            </span>
            <span style={styles.statLabel}>Active Offers</span>
          </div>
          <div style={styles.statTrend}>
            <BiTimeFive size={16} color="#f59e0b" />
            <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>Active</span>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={styles.statIconWrapper4}>
            <FaPercent size={20} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statNumber}>
              {offers.length > 0 ? Math.round(offers.reduce((acc, curr) => acc + (curr.discountPercentage || 0), 0) / offers.length) : 0}%
            </span>
            <span style={styles.statLabel}>Avg Discount</span>
          </div>
          <div style={styles.statTrend}>
            <FaPercent size={16} color="#8b5cf6" />
            <span style={{ color: '#8b5cf6', fontSize: '12px', fontWeight: '600' }}>Average</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div style={styles.controlsSection}>
        <div style={styles.searchWrapper}>
          <FaSearch style={styles.searchIcon} />
          <input
            style={styles.searchInput}
            placeholder="Search offers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={styles.filterWrapper}>
          <select 
            style={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          <select 
            style={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="discount">Highest Discount</option>
          </select>
        </div>
      </div>

      {/* Offer Cards - Full Width */}
      {displayedOffers.length > 0 ? (
        <div style={styles.listContainer}>
          {displayedOffers.map((offer) => (
            <div key={offer._id} className="offer-card-modern" style={styles.offerCard}>
              <div style={styles.cardImageWrapper}>
                <img 
                  src={getImageUrl(offer.image)} 
                  style={styles.cardImage} 
                  alt={offer.title || "Offer"} 
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x200?text=Image+Error";
                  }}
                />
                <div style={styles.discountBadge}>
                  <span style={styles.discountNumber}>{offer.discountPercentage}%</span>
                  <span style={styles.discountLabel}>OFF</span>
                </div>
                <div style={styles.statusBadge}>
                  <FaCheckCircle size={10} color="#10b981" />
                  <span>Active</span>
                </div>
              </div>
              <div style={styles.cardContent}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleSection}>
                    <h3 style={styles.cardTitle}>{offer.title}</h3>
                    <p style={styles.cardDescription}>{offer.description?.substring(0, 120)}...</p>
                  </div>
                  <div style={styles.cardActionButtons}>
                    <button style={styles.cardActionBtn} onClick={() => openEditModal(offer)}>
                      <FaEdit size={14} />
                      Edit
                    </button>
                    <button style={styles.cardActionBtnDanger} onClick={() => setDeleteConfirm(offer._id)}>
                      <FaTrashAlt size={14} />
                      Delete
                    </button>
                  </div>
                </div>
                <div style={styles.cardMeta}>
                  <div style={styles.metaItem}>
                    <FaMapMarkerAlt size={14} color="#64748b" />
                    <span>{offer.location || "Online Only"}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <FaCalendarAlt size={14} color="#64748b" />
                    <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <FaTicketAlt size={14} color="#ff961a" />
                    <span>{offer.claimedBy?.length || 0} claims</span>
                  </div>
                  <div style={styles.metaItem}>
                    <FaEye size={14} color="#64748b" />
                    <span>{offer.views || 0} views</span>
                  </div>
                </div>
                <div style={styles.cardFooter}>
                  <div style={styles.claimRateWrapper}>
                    <span style={styles.claimRateLabel}>Claim Rate</span>
                    <div style={styles.claimRateBar}>
                      <div style={{...styles.claimRateFill, width: `${getClaimRate(offer)}%`}}></div>
                    </div>
                    <span style={styles.claimRateText}>{getClaimRate(offer)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🎯</div>
          <h3 style={styles.emptyTitle}>No active campaigns</h3>
          <p style={styles.emptyText}>Create your first offer to start engaging with students</p>
          <button 
            style={styles.emptyCreateBtn}
            onClick={handleCreateOffer}
            className="empty-btn"
          >
            <FaPlus /> Create New Offer
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.deleteIconWrapper}>
              <FaTrashAlt size={32} color="#ef4444" />
            </div>
            <h3 style={styles.deleteTitle}>Delete Offer?</h3>
            <p style={styles.deleteText}>This action cannot be undone. All claims data and analytics will be permanently removed.</p>
            <div style={styles.deleteActions}>
              <button style={styles.cancelDeleteBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={styles.confirmDeleteBtn} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && currentOffer && (
        <div style={styles.modalOverlay} onClick={() => setIsEditing(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <div style={styles.modalIcon}>
                  <FaEdit size={18} color="#ff961a" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Edit Campaign</h3>
                  <p style={styles.modalSubtitle}>Update your offer details and settings</p>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsEditing(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Offer Title</label>
                  <input 
                    style={styles.input} 
                    value={currentOffer.title} 
                    onChange={(e) => setCurrentOffer({...currentOffer, title: e.target.value})} 
                    placeholder="Enter offer title"
                  />
                </div>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Discount Percentage</label>
                  <div style={styles.discountInput}>
                    <FaPercent size={14} color="#ff961a" style={styles.inputIcon} />
                    <input 
                      type="number" 
                      style={{...styles.input, paddingLeft: '40px'}} 
                      value={currentOffer.discountPercentage} 
                      onChange={(e) => setCurrentOffer({...currentOffer, discountPercentage: e.target.value})} 
                      placeholder="e.g. 20"
                    />
                  </div>
                </div>
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Description</label>
                <textarea 
                  style={styles.textarea} 
                  value={currentOffer.description} 
                  onChange={(e) => setCurrentOffer({...currentOffer, description: e.target.value})} 
                  rows={3}
                  placeholder="Describe your offer..."
                />
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Redeem Instructions</label>
                <textarea 
                  style={styles.textarea} 
                  value={currentOffer.redeemInstructions || ""} 
                  onChange={(e) => setCurrentOffer({...currentOffer, redeemInstructions: e.target.value})} 
                  rows={2}
                  placeholder="How to redeem this offer..."
                />
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Location</label>
                <input 
                  style={styles.input} 
                  value={currentOffer.location || ""} 
                  onChange={(e) => setCurrentOffer({...currentOffer, location: e.target.value})} 
                  placeholder="Online or physical location"
                />
              </div>

              <div style={styles.uploadSection}>
                <label style={styles.label}>Offer Banner</label>
                <div style={styles.imagePreviewContainer}>
                  <img 
                    src={preview} 
                    style={styles.imagePreview} 
                    alt="preview" 
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
                    }}
                  />
                  <label style={styles.uploadOverlay}>
                    <FaCloudUploadAlt size={20} />
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
              <button style={styles.saveBtn} onClick={handleUpdate} disabled={updating}>
                {updating ? (
                  <>
                    <FaSpinner style={{animation: 'spin 1s linear infinite'}} />
                    Updating...
                  </>
                ) : (
                  <>
                    Update Offer <FaArrowRight />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .stat-card {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
        }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.2s; }
        
        .offer-card-modern {
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
          transition: all 0.3s ease;
        }
        .offer-card-modern:nth-child(1) { animation-delay: 0.05s; }
        .offer-card-modern:nth-child(2) { animation-delay: 0.1s; }
        .offer-card-modern:nth-child(3) { animation-delay: 0.15s; }
        .offer-card-modern:nth-child(4) { animation-delay: 0.2s; }
        .offer-card-modern:nth-child(5) { animation-delay: 0.25s; }
        .offer-card-modern:nth-child(6) { animation-delay: 0.3s; }
        
        .offer-card-modern:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }
        
        .create-btn {
          transition: all 0.3s ease;
        }
        .create-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 30px rgba(249, 195, 73, 0.4);
        }
        
        .empty-btn {
          transition: all 0.3s ease;
        }
        .empty-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 30px rgba(249, 195, 73, 0.4);
        }
        
        .loader {
          width: 50px;
          height: 50px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #ff961a;
          border-radius: 50%;
          animation: pulse 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { 
    padding: "24px 32px", 
    background: "#f8fafc",
    minHeight: "100vh", 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: "relative",
    overflowX: "hidden",
    maxWidth: "100%",
    boxSizing: "border-box"
  },
  bgCircle1: {
    position: "absolute",
    top: "-150px",
    right: "-100px",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(255,150,26,0.05) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgCircle2: {
    position: "absolute",
    bottom: "-100px",
    left: "-80px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, rgba(139,92,246,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgCircle3: {
    position: "absolute",
    top: "50%",
    right: "30%",
    width: "200px",
    height: "200px",
    background: "radial-gradient(circle, rgba(16,185,129,0.03) 0%, rgba(16,185,129,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    position: "relative",
    zIndex: 1,
    flexWrap: "wrap",
    gap: "16px"
  },
  headerLeft: {
    flex: 1
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,150,26,0.1)",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#ff961a",
    marginBottom: "12px"
  },
  mainTitle: { 
    margin: 0, 
    fontSize: "28px", 
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.5px"
  },
  mainSubtitle: { 
    margin: "6px 0 0", 
    fontSize: "14px", 
    color: "#64748b"
  },
  createOfferBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 24px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(249, 195, 73, 0.3)",
    whiteSpace: "nowrap",
    marginTop: "4px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
    position: "relative",
    zIndex: 1
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    padding: "16px 20px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    transition: "all 0.3s ease",
    gap: "16px"
  },
  statIconWrapper1: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#fff7ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ff961a"
  },
  statIconWrapper2: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#ecfdf5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#10b981"
  },
  statIconWrapper3: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f59e0b"
  },
  statIconWrapper4: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#f3e8ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8b5cf6"
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    display: "block",
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: "1.2"
  },
  statLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500"
  },
  statTrend: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  controlsSection: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    position: "relative",
    zIndex: 1,
    flexWrap: "wrap"
  },
  searchWrapper: {
    flex: 1,
    position: "relative",
    minWidth: "200px",
    maxWidth: "400px"
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
    padding: "10px 16px 10px 42px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box"
  },
  filterWrapper: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },
  filterSelect: {
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "13px",
    color: "#1e293b",
    outline: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    minWidth: "130px"
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "relative",
    zIndex: 1,
    width: "100%"
  },
  offerCard: {
    display: "flex",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    transition: "all 0.3s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    width: "100%"
  },
  cardImageWrapper: {
    position: "relative",
    width: "220px",
    minWidth: "220px",
    height: "180px",
    overflow: "hidden",
    flexShrink: 0
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  discountBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: "linear-gradient(135deg, #ff961a 0%, #f9c349 100%)",
    color: "#fff",
    borderRadius: "10px",
    padding: "6px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    lineHeight: "1.2",
    boxShadow: "0 4px 12px rgba(255,150,26,0.3)"
  },
  discountNumber: {
    fontSize: "20px",
    fontWeight: "800"
  },
  discountLabel: {
    fontSize: "8px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  statusBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "rgba(16, 185, 129, 0.95)",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "600",
    backdropFilter: "blur(4px)"
  },
  cardContent: {
    flex: 1,
    padding: "18px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minWidth: 0
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "12px"
  },
  cardTitleSection: {
    flex: 1,
    minWidth: 0
  },
  cardTitle: {
    margin: "0 0 6px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a"
  },
  cardDescription: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.4",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical"
  },
  cardActionButtons: {
    display: "flex",
    gap: "8px",
    flexShrink: 0
  },
  cardActionBtn: {
    padding: "8px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#1e293b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    fontSize: "12px",
    fontWeight: "600"
  },
  cardActionBtnDanger: {
    padding: "8px 16px",
    borderRadius: "10px",
    border: "1px solid #fee2e2",
    background: "#ffffff",
    color: "#ef4444",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    fontSize: "12px",
    fontWeight: "600"
  },
  cardMeta: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "12px"
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#64748b"
  },
  cardFooter: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px"
  },
  claimRateWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  claimRateLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569"
  },
  claimRateBar: {
    flex: 1,
    height: "6px",
    background: "#f1f5f9",
    borderRadius: "3px",
    overflow: "hidden",
    minWidth: "100px"
  },
  claimRateFill: {
    height: "100%",
    background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
    borderRadius: "3px",
    transition: "width 0.6s ease"
  },
  claimRateText: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#10b981",
    minWidth: "40px",
    textAlign: "right"
  },
  emptyState: {
    padding: "60px 20px",
    textAlign: "center",
    background: "#ffffff",
    borderRadius: "16px",
    border: "2px dashed #e2e8f0",
    position: "relative",
    zIndex: 1,
    width: "100%"
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.6
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
    margin: "0 0 20px 0"
  },
  emptyCreateBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 28px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(249, 195, 73, 0.3)"
  },
  modalOverlay: { 
    position: "fixed", 
    inset: 0, 
    backgroundColor: "rgba(15, 23, 42, 0.6)", 
    backdropFilter: "blur(8px)", 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 1000,
    padding: "16px"
  },
  modalContent: { 
    backgroundColor: "#fff", 
    width: "560px", 
    maxHeight: "90vh", 
    borderRadius: "20px", 
    display: "flex", 
    flexDirection: "column", 
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", 
    overflow: "hidden",
    animation: "modalFadeIn 0.3s ease"
  },
  modalHeader: { 
    padding: "20px 24px", 
    borderBottom: "1px solid #f1f5f9", 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  modalHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  modalIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#fff7ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  modalTitle: { 
    margin: 0, 
    fontSize: "18px", 
    fontWeight: "600", 
    color: "#0f172a"
  },
  modalSubtitle: {
    margin: "2px 0 0",
    fontSize: "13px",
    color: "#64748b"
  },
  closeBtn: { 
    width: "36px", 
    height: "36px", 
    borderRadius: "50%", 
    border: "1px solid #e2e8f0", 
    background: "#f8fafc", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    transition: "all 0.2s"
  },
  modalBody: { 
    padding: "24px", 
    overflowY: "auto", 
    flex: 1 
  },
  inputGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px"
  },
  inputWrapper: {
    marginBottom: "16px"
  },
  label: { 
    display: "block", 
    fontSize: "12px", 
    fontWeight: "600", 
    color: "#475569", 
    textTransform: "uppercase", 
    marginBottom: "6px", 
    letterSpacing: "0.3px" 
  },
  input: { 
    width: "100%", 
    padding: "10px 14px", 
    borderRadius: "10px", 
    border: "1px solid #e2e8f0", 
    fontSize: "14px", 
    color: "#1e293b", 
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    background: "#ffffff"
  },
  discountInput: {
    position: "relative"
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)"
  },
  textarea: { 
    width: "100%", 
    padding: "10px 14px", 
    borderRadius: "10px", 
    border: "1px solid #e2e8f0", 
    fontSize: "14px", 
    fontFamily: "inherit", 
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    minHeight: "80px"
  },
  uploadSection: {
    marginTop: "8px"
  },
  imagePreviewContainer: { 
    position: "relative", 
    borderRadius: "12px", 
    overflow: "hidden", 
    border: "1px solid #e2e8f0" 
  },
  imagePreview: { 
    width: "100%", 
    height: "140px", 
    objectFit: "cover" 
  },
  uploadOverlay: { 
    position: "absolute", 
    inset: 0, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    color: "#fff", 
    display: "flex", 
    flexDirection: "column",
    alignItems: "center", 
    justifyContent: "center", 
    gap: "6px", 
    cursor: "pointer", 
    opacity: 0, 
    transition: "opacity 0.3s",
    fontWeight: "500",
    fontSize: "13px"
  },
  modalFooter: { 
    padding: "16px 24px", 
    borderTop: "1px solid #f1f5f9", 
    display: "flex", 
    justifyContent: "flex-end", 
    gap: "12px", 
    backgroundColor: "#f8fafc" 
  },
  cancelBtn: { 
    padding: "10px 20px", 
    borderRadius: "10px", 
    border: "1px solid #e2e8f0", 
    background: "#fff", 
    fontWeight: "600", 
    cursor: "pointer", 
    color: "#475569",
    transition: "all 0.2s",
    fontSize: "13px"
  },
  saveBtn: { 
    padding: "10px 24px", 
    borderRadius: "10px", 
    border: "none", 
    background: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)", 
    color: "#fff", 
    fontWeight: "600", 
    cursor: "pointer", 
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    fontSize: "13px"
  },
  deleteModal: {
    background: "#fff",
    padding: "36px 40px",
    borderRadius: "20px",
    textAlign: "center",
    width: "400px",
    maxWidth: "90%",
    animation: "modalFadeIn 0.3s ease"
  },
  deleteIconWrapper: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#fef2f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px"
  },
  deleteTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0"
  },
  deleteText: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 24px 0",
    lineHeight: "1.5"
  },
  deleteActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },
  cancelDeleteBtn: {
    padding: "10px 24px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    color: "#64748b",
    fontSize: "13px"
  },
  confirmDeleteBtn: {
    padding: "10px 24px",
    borderRadius: "10px",
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px"
  },
  loaderContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh"
  },
  loaderWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px"
  },
  loader: {
    width: "44px",
    height: "44px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #ff961a",
    borderRadius: "50%"
  },
  loaderText: {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "600",
    margin: 0
  },
  loaderSubtext: {
    color: "#94a3b8",
    fontSize: "13px",
    margin: 0
  }
};