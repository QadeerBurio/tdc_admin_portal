import React, { useState, useEffect } from "react";
import { 
  FaImage, FaTag, FaEye, FaEyeSlash, FaTrashAlt, 
  FaCheckCircle, FaClock, FaSpinner, FaArrowUp,
  FaChartLine, FaCalendarAlt, FaSearch
} from "react-icons/fa";

export default function AdminOffers() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("slider");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/all?type=${filter}`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      await fetch(`http://localhost:5000/api/admin/toggle/${id}`, { method: "PATCH" });
      await fetchItems();
    } catch (error) {
      alert("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Permanent delete? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`http://localhost:5000/api/admin/delete/${id}`, { method: "DELETE" });
      await fetchItems();
    } catch (error) {
      alert("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = items.filter(item => item.active).length;
  const draftCount = items.filter(item => !item.active).length;

  return (
    <div style={styles.container}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

      {/* Header Section */}
      <div className="animate-header" style={styles.header}>
        <div>
          <div style={styles.headerBadge}>
            <FaImage />
            <span>Content Library</span>
          </div>
          <h1 style={styles.mainTitle}>Asset Management</h1>
          <p style={styles.subtitle}>Curate and control your storefront's visual identity</p>
        </div>

        <div style={styles.rightHeader}>
          <div style={styles.statsGroup}>
            <div style={styles.statBadge}>
              <FaCheckCircle color="#10b981" size={14} />
              <span style={styles.statNumber}>{activeCount}</span>
              <span style={styles.statLabel}>Live</span>
            </div>
            <div style={styles.statBadge}>
              <FaClock color="#94a3b8" size={14} />
              <span style={styles.statNumber}>{draftCount}</span>
              <span style={styles.statLabel}>Draft</span>
            </div>
            <div style={styles.statBadge}>
              <FaChartLine color="#3b82f6" size={14} />
              <span style={styles.statNumber}>{items.length}</span>
              <span style={styles.statLabel}>Total</span>
            </div>
          </div>

          <div className="filter-group" style={styles.filterGroup}>
            <button 
              className={`filter-btn ${filter === 'slider' ? 'active' : ''}`}
              style={{...styles.filterBtn, ...(filter === 'slider' ? styles.activeFilter : {})}} 
              onClick={() => setFilter('slider')}
            >
              <FaImage style={{marginRight: '6px'}} />
              Sliders
            </button>
            <button 
              className={`filter-btn ${filter === 'offer' ? 'active' : ''}`}
              style={{...styles.filterBtn, ...(filter === 'offer' ? styles.activeFilter : {})}} 
              onClick={() => setFilter('offer')}
            >
              <FaTag style={{marginRight: '6px'}} />
              Banners
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="animate-search" style={styles.searchWrapper}>
        <FaSearch style={styles.searchIcon} />
        <input
          type="text"
          placeholder={`Search ${filter}s by title or ID...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        {searchTerm && (
          <button style={styles.clearSearch} onClick={() => setSearchTerm("")}>
            ✕
          </button>
        )}
      </div>

      {/* Main Content */}
      <main>
        {loading ? (
          <div className="loader-container" style={styles.loader}>
            <div className="spinner" style={styles.spinner}></div>
            <p>Loading assets from database...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state" style={styles.emptyState}>
            <div style={styles.emptyIcon}>📦</div>
            <p>No {filter} assets found</p>
            <span>{searchTerm ? "Try a different search term" : "Create your first asset using the admin panel"}</span>
          </div>
        ) : (
          <div className="items-grid" style={styles.grid}>
            {filteredItems.map((item, index) => (
              <div 
                key={item._id} 
                className="asset-card"
                style={styles.card}
              >
                {/* Left Side: Content & Controls */}
                <div style={styles.cardBody}>
                  <div style={styles.metaRow}>
                    <div style={{
                      ...styles.statusDot, 
                      backgroundColor: item.active ? "#10b981" : "#cbd5e1",
                    }}>
                      {item.active && <div style={styles.statusPulse}></div>}
                    </div>
                    <span style={styles.statusText}>
                      {item.active ? "Live on Site" : "Draft Mode"}
                    </span>
                    <span style={styles.idBadge}>
                      ID: {item._id.slice(-8).toUpperCase()}
                    </span>
                    <span style={styles.typeBadge}>
                      {item.type === "slider" ? "Slider" : "Offer"}
                    </span>
                  </div>

                  <h3 style={styles.itemTitle}>
                    {item.title || "Untitled Campaign"}
                  </h3>
                  
                  {item.type === "offer" && item.description && (
                    <p style={styles.itemDescription}>
                      {item.description.length > 80 
                        ? item.description.substring(0, 80) + "..." 
                        : item.description}
                    </p>
                  )}

                  <div style={styles.dateInfo}>
                    <FaCalendarAlt size={10} color="#94a3b8" />
                    <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div style={styles.actions}>
                    <button 
                      className="action-btn toggle-btn"
                      onClick={() => handleToggle(item._id)}
                      disabled={togglingId === item._id}
                      style={{
                        ...styles.primaryBtn,
                        background: item.active 
                          ? "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)" 
                          : "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
                        color: item.active ? "#475569" : "#fff",
                      }}
                    >
                      {togglingId === item._id ? (
                        <FaSpinner style={{animation: 'spin 1s linear infinite'}} />
                      ) : (
                        item.active ? (
                          <> <FaEyeSlash /> Move to Draft</>
                        ) : (
                          <> <FaEye /> Publish Now</>
                        )
                      )}
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      style={styles.ghostDeleteBtn}
                    >
                      {deletingId === item._id ? (
                        <FaSpinner style={{animation: 'spin 1s linear infinite'}} />
                      ) : (
                        <> <FaTrashAlt /> Delete</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Side: Image Preview */}
                <div style={styles.imageWrapper}>
                  <img 
                    src={item.image} 
                    alt={item.title || "Preview"} 
                    style={styles.thumbnail} 
                    onError={(e) => { 
                      e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found'; 
                    }} 
                  />
                  {!item.active && <div style={styles.draftOverlay}>DRAFT</div>}
                  {item.active && (
                    <div style={styles.liveBadge}>
                      <FaCheckCircle size={10} />
                      LIVE
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .animate-header {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.1s;
        }
        
        .animate-search {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.15s;
        }
        
        .filter-group {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.05s;
        }
        
        .filter-btn {
          transition: all 0.3s ease;
        }
        .filter-btn:hover {
          transform: translateY(-2px);
        }
        .filter-btn.active {
          background: #fff;
          color: #ff961a;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .asset-card {
          transition: all 0.3s ease;
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .asset-card:nth-child(1) { animation-delay: 0.05s; }
        .asset-card:nth-child(2) { animation-delay: 0.1s; }
        .asset-card:nth-child(3) { animation-delay: 0.15s; }
        .asset-card:nth-child(4) { animation-delay: 0.2s; }
        
        .asset-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 35px -12px rgba(0,0,0,0.15);
          border-color: rgba(255,150,26,0.2);
        }
        
        .action-btn {
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          transform: translateY(-2px);
        }
        
        .toggle-btn:active, .delete-btn:active {
          transform: translateY(0);
        }
        
        .loader-container {
          animation: fadeInScale 0.4s ease;
        }
        
        .empty-state {
          animation: fadeInScale 0.4s ease;
        }
        
        @keyframes statusPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        
        .status-pulse {
          animation: statusPulse 1.5s ease infinite;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { 
    padding: "30px 35px", 
    maxWidth: "1200px", 
    margin: "0 auto", 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#1e293b",
    minHeight: "85vh",
    position: "relative",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
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
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "20px",
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
  rightHeader: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap"
  },
  statsGroup: {
    display: "flex",
    gap: "16px",
    background: "#fff",
    padding: "8px 20px",
    borderRadius: "60px",
    border: "1px solid #e2e8f0"
  },
  statBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px"
  },
  statNumber: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: "14px"
  },
  statLabel: {
    color: "#64748b",
    fontSize: "12px"
  },
  mainTitle: { 
    fontSize: "32px", 
    fontWeight: "800", 
    margin: 0, 
    color: "#1e293b", 
    letterSpacing: "-0.5px" 
  },
  subtitle: { 
    color: "#64748b", 
    fontSize: "14px", 
    margin: "8px 0 0 0" 
  },
  filterGroup: { 
    display: "flex", 
    gap: "6px", 
    backgroundColor: "#f1f5f9", 
    padding: "6px", 
    borderRadius: "60px" 
  },
  filterBtn: { 
    padding: "10px 24px", 
    border: "none", 
    borderRadius: "40px", 
    cursor: "pointer", 
    fontWeight: "600", 
    fontSize: "14px",
    background: "transparent",
    color: "#64748b",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center"
  },
  activeFilter: { 
    background: "#fff", 
    color: "#ff961a", 
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)" 
  },
  searchWrapper: {
    position: "relative",
    marginBottom: "28px",
    maxWidth: "400px",
    position: "relative",
    zIndex: 1
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "14px"
  },
  searchInput: {
    width: "100%",
    padding: "12px 40px 12px 44px",
    borderRadius: "16px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    outline: "none"
  },
  clearSearch: {
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "14px"
  },
  grid: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "20px",
    position: "relative",
    zIndex: 1
  },
  card: { 
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    padding: "24px",
    borderRadius: "24px",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
    transition: "all 0.3s ease",
    gap: "32px"
  },
  cardBody: { 
    flex: 1, 
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "center" 
  },
  metaRow: { 
    display: "flex", 
    alignItems: "center", 
    gap: "10px", 
    marginBottom: "14px",
    flexWrap: "wrap"
  },
  statusDot: { 
    width: "10px", 
    height: "10px", 
    borderRadius: "50%",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statusPulse: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    opacity: 0.4,
    position: "absolute",
    animation: "statusPulse 1.5s ease infinite"
  },
  statusText: { 
    fontSize: "12px", 
    fontWeight: "700", 
    color: "#475569", 
    textTransform: "uppercase", 
    letterSpacing: "0.5px" 
  },
  idBadge: { 
    fontSize: "10px", 
    color: "#94a3b8", 
    fontFamily: "monospace", 
    padding: "4px 8px", 
    background: "#f8fafc", 
    borderRadius: "6px" 
  },
  typeBadge: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "20px",
    background: "#fff7ed",
    color: "#ff961a"
  },
  itemTitle: { 
    fontSize: "20px", 
    fontWeight: "700", 
    margin: "0 0 6px 0", 
    color: "#1e293b" 
  },
  itemDescription: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 10px 0",
    lineHeight: "1.5"
  },
  dateInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#94a3b8",
    marginBottom: "20px"
  },
  actions: { 
    display: "flex", 
    gap: "12px" 
  },
  primaryBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  ghostDeleteBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    border: "1px solid #fee2e2",
    backgroundColor: "#fff",
    color: "#ef4444",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  imageWrapper: {
    width: "260px",
    height: "150px",
    borderRadius: "16px",
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
    boxShadow: "0 8px 20px -8px rgba(0,0,0,0.1)",
    border: "1px solid #f1f5f9"
  },
  thumbnail: { 
    width: "100%", 
    height: "100%", 
    objectFit: "cover" 
  },
  draftOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(4px)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "2px"
  },
  liveBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "#10b981",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  loader: { 
    textAlign: "center", 
    padding: "80px", 
    color: "#64748b",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #ff961a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  emptyState: { 
    textAlign: "center", 
    padding: "80px", 
    border: "2px dashed #e2e8f0", 
    borderRadius: "28px",
    backgroundColor: "#fff",
    color: "#94a3b8"
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.5
  }
};