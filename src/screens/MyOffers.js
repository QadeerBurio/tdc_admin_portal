import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FaEdit, FaMapMarkerAlt, FaCloudUploadAlt, 
  FaTimes, FaCalendarAlt, FaTicketAlt, FaCheckCircle,
  FaTrashAlt, FaEye, FaChartBar, FaStore, FaGift,
  FaArrowRight, FaPercent, FaSpinner
} from "react-icons/fa";

const BASE_URL = "https://the-deft-crew-production.up.railway.app"; 
const API_URL = `${BASE_URL}/api/offers`;

export default function MyOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [viewingOffer, setViewingOffer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

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
    return imagePath.startsWith("http") ? imagePath : `${BASE_URL}/uploads/offers/${imagePath}`;
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

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner" style={styles.spinner}></div>
        <p style={styles.loaderText}>Loading your campaigns...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div>
            <div style={styles.heroBadge}>
              <FaStore />
              <span>Store Management</span>
            </div>
            <h1 style={styles.mainTitle}>My Offers</h1>
            <p style={styles.mainSubtitle}>Review, optimize, and manage your active brand promotions</p>
          </div>
          <div style={styles.quickStats}>
            <div className="stat-box" style={styles.statBox}>
              <div style={styles.statIcon}>📦</div>
              <div>
                <span style={styles.statNumber}>{offers.length}</span>
                <span style={styles.statLabel}>Active Offers</span>
              </div>
            </div>
            <div className="stat-box" style={styles.statBox}>
              <div style={styles.statIcon}>👥</div>
              <div>
                <span style={styles.statNumber}>
                  {offers.reduce((acc, curr) => acc + (curr.claimedBy?.length || 0), 0)}
                </span>
                <span style={styles.statLabel}>Total Claims</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="offers-list" style={styles.listWrapper}>
        <div style={styles.listHeader}>
          <span style={{ flex: 2.5 }}>Offer Details</span>
          <span style={{ flex: 1 }}>Performance</span>
          <span style={{ flex: 1 }}>Info</span>
          <span style={{ flex: 1, textAlign: 'right' }}>Actions</span>
        </div>

        {offers.length > 0 ? (
          offers.map((offer, index) => (
            <div key={offer._id} className="offer-card" style={styles.wideCard}>
              <div style={{ flex: 2.5, display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={styles.thumbnailWrapper}>
                  <img src={getImageUrl(offer.image)} style={styles.thumbnail} alt="offer" />
                  <div style={styles.tinyBadge}>{offer.discountPercentage}%</div>
                </div>
                <div>
                  <h3 style={styles.offerTitleText}>{offer.title}</h3>
                  <div style={styles.statusIndicator}>
                    <FaCheckCircle size={10} color="#10b981" />
                    <span>Active</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={styles.performanceMetric}>
                  <div style={styles.metricIcon}>
                    <FaTicketAlt />
                  </div>
                  <div>
                    <div style={styles.metricValue}>{offer.claimedBy?.length || 0}</div>
                    <div style={styles.metricLabel}>Claims</div>
                  </div>
                  <div style={styles.claimRate}>
                    <div style={{...styles.rateBar, width: `${getClaimRate(offer)}%`}}></div>
                    <span>{getClaimRate(offer)}%</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={styles.metaGroup}>
                  <div style={styles.metaPill}>
                    <FaMapMarkerAlt size={10} />
                    {offer.location || "Online Only"}
                  </div>
                  <div style={styles.metaPill}>
                    <FaCalendarAlt size={10} />
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="action-btn" style={styles.actionBtnEdit} onClick={() => openEditModal(offer)}>
                  <FaEdit /> Edit
                </button>
                <button className="action-btn" style={styles.actionBtnDelete} onClick={() => setDeleteConfirm(offer._id)}>
                  <FaTrashAlt />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎯</div>
            <h3>No active campaigns</h3>
            <p>Create your first offer to start engaging with students</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.deleteIcon}>⚠️</div>
            <h3 style={styles.deleteTitle}>Delete Offer?</h3>
            <p style={styles.deleteText}>This action cannot be undone. All claims data will be lost.</p>
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
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Edit Campaign</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Update your offer details</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsEditing(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.inputGroupRow}>
                <div style={{ flex: 2 }}>
                  <label style={styles.label}>Offer Title</label>
                  <input 
                    style={styles.input} 
                    value={currentOffer.title} 
                    onChange={(e) => setCurrentOffer({...currentOffer, title: e.target.value})} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Discount %</label>
                  <div style={styles.discountInput}>
                    <FaPercent size={14} color="#ff961a" />
                    <input 
                      type="number" 
                      style={{...styles.input, paddingLeft: '30px'}} 
                      value={currentOffer.discountPercentage} 
                      onChange={(e) => setCurrentOffer({...currentOffer, discountPercentage: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <label style={styles.label}>Description</label>
              <textarea 
                style={styles.textarea} 
                value={currentOffer.description} 
                onChange={(e) => setCurrentOffer({...currentOffer, description: e.target.value})} 
                rows={3}
              />

              <label style={styles.label}>Redeem Instructions</label>
              <textarea 
                style={styles.textarea} 
                value={currentOffer.redeemInstructions || ""} 
                onChange={(e) => setCurrentOffer({...currentOffer, redeemInstructions: e.target.value})} 
                rows={2}
              />

              <div style={styles.uploadSection}>
                <label style={styles.label}>Offer Banner</label>
                <div style={styles.imagePreviewContainer}>
                  <img src={preview} style={styles.imagePreview} alt="preview" />
                  <label style={styles.uploadOverlay}>
                    <FaCloudUploadAlt /> Change Image
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
        
        .stat-box {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
        }
        .stat-box:nth-child(1) { animation-delay: 0.1s; }
        .stat-box:nth-child(2) { animation-delay: 0.2s; }
        
        .offer-card {
          transition: all 0.3s ease;
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .offer-card:nth-child(1) { animation-delay: 0.05s; }
        .offer-card:nth-child(2) { animation-delay: 0.1s; }
        .offer-card:nth-child(3) { animation-delay: 0.15s; }
        .offer-card:nth-child(4) { animation-delay: 0.2s; }
        .offer-card:nth-child(5) { animation-delay: 0.25s; }
        
        .offer-card:hover {
          background: #f8fafc;
          transform: translateX(5px);
        }
        
        .action-btn {
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          transform: translateY(-2px);
        }
        
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .spinner {
          width: 40px;
          height: 40px;
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
    padding: "30px 35px", 
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    minHeight: "85vh", 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    borderRadius: "32px",
    overflow: "hidden"
  },
  bgDecoration1: {
    position: "absolute",
    top: "-100px",
    right: "-50px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(255,150,26,0.06) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration2: {
    position: "absolute",
    bottom: "-80px",
    left: "-60px",
    width: "250px",
    height: "250px",
    background: "radial-gradient(circle, rgba(255,150,26,0.04) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  heroSection: { 
    marginBottom: "32px", 
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: "28px", 
    padding: "32px 40px", 
    color: "#fff", 
    boxShadow: "0 20px 35px -12px rgba(0,0,0,0.15)",
    position: "relative",
    zIndex: 1,
    overflow: "hidden"
  },
  heroContent: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px"
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.1)",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px"
  },
  mainTitle: { 
    margin: 0, 
    fontSize: "32px", 
    fontWeight: "800",
    letterSpacing: "-0.5px"
  },
  mainSubtitle: { 
    margin: "8px 0 0", 
    fontSize: "14px", 
    opacity: 0.8
  },
  quickStats: { 
    display: "flex", 
    gap: "15px" 
  },
  statBox: { 
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.08)", 
    padding: "12px 24px", 
    borderRadius: "20px", 
    border: "1px solid rgba(255,255,255,0.1)"
  },
  statIcon: {
    fontSize: "24px"
  },
  statNumber: { 
    display: "block", 
    fontSize: "24px", 
    fontWeight: "800",
    lineHeight: "1.2"
  },
  statLabel: { 
    fontSize: "11px", 
    opacity: 0.7, 
    textTransform: "uppercase", 
    fontWeight: "600",
    display: "block"
  },
  listWrapper: { 
    backgroundColor: "#fff", 
    borderRadius: "24px", 
    border: "1px solid #e2e8f0", 
    overflow: "hidden",
    position: "relative",
    zIndex: 1
  },
  listHeader: { 
    display: "flex", 
    padding: "18px 24px", 
    backgroundColor: "#f8fafc", 
    color: "#64748b", 
    fontSize: "11px", 
    fontWeight: "700", 
    textTransform: "uppercase", 
    letterSpacing: "1px", 
    borderBottom: "2px solid #e2e8f0" 
  },
  wideCard: { 
    display: "flex", 
    alignItems: "center", 
    padding: "20px 24px", 
    borderBottom: "1px solid #f1f5f9", 
    transition: "all 0.2s ease" 
  },
  thumbnailWrapper: { 
    position: "relative" 
  },
  thumbnail: { 
    width: "80px", 
    height: "60px", 
    borderRadius: "12px", 
    objectFit: "cover", 
    backgroundColor: "#f1f5f9" 
  },
  tinyBadge: { 
    position: "absolute", 
    top: "-8px", 
    left: "-8px", 
    background: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)", 
    color: "#fff", 
    fontSize: "10px", 
    padding: "3px 8px", 
    borderRadius: "8px", 
    fontWeight: "800" 
  },
  offerTitleText: { 
    margin: "0 0 4px 0", 
    fontSize: "16px", 
    color: "#1e293b", 
    fontWeight: "700" 
  },
  statusIndicator: { 
    display: "flex", 
    alignItems: "center", 
    gap: "6px", 
    color: "#10b981", 
    fontSize: "11px", 
    fontWeight: "700", 
    textTransform: "uppercase" 
  },
  performanceMetric: { 
    display: "flex", 
    alignItems: "center", 
    gap: "12px" 
  },
  metricIcon: {
    width: "36px",
    height: "36px",
    background: "#fff7ed",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ff961a"
  },
  metricValue: { 
    fontSize: "16px", 
    fontWeight: "800", 
    color: "#1e293b" 
  },
  metricLabel: { 
    fontSize: "10px", 
    color: "#94a3b8" 
  },
  claimRate: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "8px"
  },
  rateBar: {
    width: "40px",
    height: "4px",
    background: "#10b981",
    borderRadius: "2px"
  },
  metaGroup: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "6px" 
  },
  metaPill: { 
    fontSize: "12px", 
    color: "#64748b", 
    display: "flex", 
    alignItems: "center", 
    gap: "6px" 
  },
  actionBtnEdit: { 
    padding: "8px 16px", 
    borderRadius: "10px", 
    border: "1px solid #e2e8f0", 
    background: "#fff", 
    cursor: "pointer", 
    fontWeight: "600", 
    color: "#1e293b", 
    display: "flex", 
    alignItems: "center", 
    gap: "8px",
    fontSize: "13px"
  },
  actionBtnDelete: { 
    padding: "8px 12px", 
    borderRadius: "10px", 
    border: "1px solid #fee2e2", 
    background: "#fff", 
    cursor: "pointer", 
    color: "#ef4444", 
    display: "flex", 
    alignItems: "center", 
    gap: "8px"
  },
  modalOverlay: { 
    position: "fixed", 
    inset: 0, 
    backgroundColor: "rgba(15, 23, 42, 0.7)", 
    backdropFilter: "blur(8px)", 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 1000 
  },
  modalContent: { 
    backgroundColor: "#fff", 
    width: "580px", 
    maxHeight: "85vh", 
    borderRadius: "28px", 
    display: "flex", 
    flexDirection: "column", 
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", 
    overflow: "hidden",
    animation: "modalFadeIn 0.3s ease"
  },
  modalHeader: { 
    padding: "24px 28px", 
    borderBottom: "2px solid #f1f5f9", 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  closeBtn: { 
    background: "#f8fafc", 
    border: "1px solid #e2e8f0", 
    width: "36px", 
    height: "36px", 
    borderRadius: "50%", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    transition: "all 0.2s"
  },
  modalBody: { 
    padding: "28px", 
    overflowY: "auto", 
    flex: 1 
  },
  inputGroupRow: { 
    display: "flex", 
    gap: "20px", 
    marginBottom: "20px" 
  },
  label: { 
    display: "block", 
    fontSize: "11px", 
    fontWeight: "700", 
    color: "#475569", 
    textTransform: "uppercase", 
    marginBottom: "8px", 
    letterSpacing: "0.5px" 
  },
  input: { 
    width: "100%", 
    padding: "12px 16px", 
    borderRadius: "14px", 
    border: "2px solid #e2e8f0", 
    fontSize: "14px", 
    color: "#1e293b", 
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box"
  },
  discountInput: {
    position: "relative"
  },
  textarea: { 
    width: "100%", 
    padding: "12px 16px", 
    borderRadius: "14px", 
    border: "2px solid #e2e8f0", 
    fontSize: "14px", 
    fontFamily: "inherit", 
    marginBottom: "20px", 
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box"
  },
  uploadSection: {
    marginTop: "8px"
  },
  imagePreviewContainer: { 
    position: "relative", 
    borderRadius: "16px", 
    overflow: "hidden", 
    border: "2px solid #e2e8f0" 
  },
  imagePreview: { 
    width: "100%", 
    height: "160px", 
    objectFit: "cover" 
  },
  uploadOverlay: { 
    position: "absolute", 
    inset: 0, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    color: "#fff", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: "8px", 
    cursor: "pointer", 
    opacity: 0, 
    transition: "opacity 0.3s",
    fontWeight: "500",
    "&:hover": { opacity: 1 }
  },
  modalFooter: { 
    padding: "20px 28px", 
    borderTop: "2px solid #f1f5f9", 
    display: "flex", 
    justifyContent: "flex-end", 
    gap: "12px", 
    backgroundColor: "#f8fafc" 
  },
  cancelBtn: { 
    padding: "12px 24px", 
    borderRadius: "14px", 
    border: "2px solid #e2e8f0", 
    background: "#fff", 
    fontWeight: "700", 
    cursor: "pointer", 
    color: "#475569",
    transition: "all 0.2s"
  },
  saveBtn: { 
    padding: "12px 28px", 
    borderRadius: "14px", 
    border: "none", 
    background: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)", 
    color: "#fff", 
    fontWeight: "700", 
    cursor: "pointer", 
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s"
  },
  deleteModal: {
    background: "#fff",
    padding: "32px",
    borderRadius: "28px",
    textAlign: "center",
    width: "380px",
    animation: "modalFadeIn 0.3s ease"
  },
  deleteIcon: {
    fontSize: "48px",
    marginBottom: "16px"
  },
  deleteTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0"
  },
  deleteText: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 24px 0"
  },
  deleteActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },
  cancelDeleteBtn: {
    padding: "10px 24px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    background: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    color: "#64748b"
  },
  confirmDeleteBtn: {
    padding: "10px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer"
  },
  emptyState: {
    padding: "60px",
    textAlign: "center"
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.5
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "85vh",
    gap: "16px"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #ff961a",
    borderRadius: "50%"
  },
  loaderText: {
    color: "#64748b",
    fontSize: "14px"
  }
};