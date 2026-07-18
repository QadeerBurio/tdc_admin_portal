import React, { useState, useEffect } from "react";
import { 
  FaImage, FaTag, FaEye, FaEyeSlash, FaTrashAlt, 
  FaCheckCircle, FaClock, FaSpinner, FaArrowUp,
  FaChartLine, FaCalendarAlt, FaSearch, FaPlus,
  FaFilter, FaSort, FaTh, FaBars, FaStar,
  FaFire, FaRocket, FaShieldAlt, FaAward
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminOffers() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("slider");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://the-deft-crew-production.up.railway.app/api/admin/all?type=${filter}`);
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
      await fetch(`https://the-deft-crew-production.up.railway.app/api/admin/toggle/${id}`, { method: "PATCH" });
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
    await fetch(`https://the-deft-crew-production.up.railway.app/api/admin/delete/${id}`, { 
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add this if needed
      }
    });
    await fetchItems();
  } catch (error) {
    console.error("Delete error:", error);
    alert("Failed to delete");
  } finally {
    setDeletingId(null);
  }
};

  const filteredItems = items
    .filter(item =>
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item._id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "title") return a.title?.localeCompare(b.title);
      if (sortBy === "status") return a.active === b.active ? 0 : a.active ? -1 : 1;
      return 0;
    });

  const activeCount = items.filter(item => item.active).length;
  const draftCount = items.filter(item => !item.active).length;

  return (
    <div style={styles.container}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>
      <div style={styles.bgDecoration3}></div>

      {/* Header Section */}
      <motion.div 
        className="animate-header" 
        style={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
            <motion.div 
              style={styles.statBadge}
              whileHover={{ scale: 1.05 }}
            >
              <FaCheckCircle color="#10b981" size={14} />
              <span style={styles.statNumber}>{activeCount}</span>
              <span style={styles.statLabel}>Live</span>
            </motion.div>
            <motion.div 
              style={styles.statBadge}
              whileHover={{ scale: 1.05 }}
            >
              <FaClock color="#94a3b8" size={14} />
              <span style={styles.statNumber}>{draftCount}</span>
              <span style={styles.statLabel}>Draft</span>
            </motion.div>
            <motion.div 
              style={styles.statBadge}
              whileHover={{ scale: 1.05 }}
            >
              <FaChartLine color="#3b82f6" size={14} />
              <span style={styles.statNumber}>{items.length}</span>
              <span style={styles.statLabel}>Total</span>
            </motion.div>
          </div>

          <div className="filter-group" style={styles.filterGroup}>
            <motion.button 
              className={`filter-btn ${filter === 'slider' ? 'active' : ''}`}
              style={{...styles.filterBtn, ...(filter === 'slider' ? styles.activeFilter : {})}} 
              onClick={() => setFilter('slider')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaImage style={{marginRight: '6px'}} />
              Sliders
            </motion.button>
            <motion.button 
              className={`filter-btn ${filter === 'offer' ? 'active' : ''}`}
              style={{...styles.filterBtn, ...(filter === 'offer' ? styles.activeFilter : {})}} 
              onClick={() => setFilter('offer')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaTag style={{marginRight: '6px'}} />
              Banners
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div 
        className="animate-search" 
        style={styles.searchWrapper}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div style={styles.searchContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder={`Search ${filter}s by title or ID...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <motion.button 
              style={styles.clearSearch} 
              onClick={() => setSearchTerm("")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          )}
        </div>

        <div style={styles.controlsGroup}>
          <motion.button 
            style={styles.filterToggle}
            onClick={() => setShowFilters(!showFilters)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaFilter /> Filters
          </motion.button>
          
          <div style={styles.viewToggle}>
            <motion.button
              style={{...styles.viewBtn, ...(viewMode === 'grid' ? styles.activeView : {})}}
              onClick={() => setViewMode('grid')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaTh />
            </motion.button>
            <motion.button
              style={{...styles.viewBtn, ...(viewMode === 'list' ? styles.activeView : {})}}
              onClick={() => setViewMode('list')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBars />
            </motion.button>
          </div>

          <select 
            style={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">By Title</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </motion.div>

      {/* Filters Dropdown */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            style={styles.filtersDropdown}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div style={styles.filtersContent}>
              <div style={styles.filterGroup}>
                <label>Status</label>
                <select style={styles.filterSelect}>
                  <option value="all">All</option>
                  <option value="active">Live</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label>Date Range</label>
                <select style={styles.filterSelect}>
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              <button style={styles.applyFiltersBtn}>Apply Filters</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main>
        {loading ? (
          <motion.div 
            className="loader-container" 
            style={styles.loader}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="spinner" style={styles.spinner}></div>
            <p>Loading assets from database...</p>
          </motion.div>
        ) : filteredItems.length === 0 ? (
          <motion.div 
            className="empty-state" 
            style={styles.emptyState}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={styles.emptyIcon}>📦</div>
            <p style={styles.emptyTitle}>No {filter} assets found</p>
            <span style={styles.emptySubtitle}>
              {searchTerm ? "Try a different search term" : "Create your first asset using the admin panel"}
            </span>
            <motion.button 
              style={styles.emptyBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus /> Create New
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            className="items-grid" 
            style={viewMode === 'grid' ? styles.grid : styles.listGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredItems.map((item, index) => (
              <motion.div 
                key={item._id} 
                className="asset-card"
                style={viewMode === 'grid' ? styles.card : styles.listCard}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ 
                  y: -4, 
                  boxShadow: "0 20px 35px -12px rgba(0,0,0,0.15)",
                  borderColor: "rgba(255,150,26,0.2)"
                }}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div style={styles.cardImageWrapper}>
                      <img 
                        src={item.image} 
                        alt={item.title || "Preview"} 
                        style={styles.cardImage} 
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
                    <div style={styles.cardContent}>
                      <div style={styles.cardMeta}>
                        <span style={{...styles.statusDot, backgroundColor: item.active ? "#10b981" : "#cbd5e1"}} />
                        <span style={styles.cardStatus}>{item.active ? "Live" : "Draft"}</span>
                        <span style={styles.cardType}>
                          {item.type === "slider" ? "Slider" : "Offer"}
                        </span>
                      </div>
                      <h3 style={styles.cardTitle}>{item.title || "Untitled Campaign"}</h3>
                      {item.type === "offer" && item.description && (
                        <p style={styles.cardDescription}>
                          {item.description.length > 60 
                            ? item.description.substring(0, 60) + "..." 
                            : item.description}
                        </p>
                      )}
                      <div style={styles.cardFooter}>
                        <span style={styles.cardDate}>
                          <FaCalendarAlt size={10} />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <div style={styles.cardActions}>
                          <motion.button 
                            className="action-btn toggle-btn"
                            onClick={() => handleToggle(item._id)}
                            disabled={togglingId === item._id}
                            style={{
                              ...styles.smallBtn,
                              background: item.active 
                                ? "#f1f5f9" 
                                : "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
                              color: item.active ? "#475569" : "#fff",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {togglingId === item._id ? (
                              <FaSpinner style={{animation: 'spin 1s linear infinite'}} />
                            ) : (
                              item.active ? <FaEyeSlash size={12} /> : <FaEye size={12} />
                            )}
                          </motion.button>
                          <motion.button 
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            style={styles.smallDeleteBtn}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {deletingId === item._id ? (
                              <FaSpinner style={{animation: 'spin 1s linear infinite'}} />
                            ) : (
                              <FaTrashAlt size={12} />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* List View */
                  <>
                    <div style={styles.listImageWrapper}>
                      <img 
                        src={item.image} 
                        alt={item.title || "Preview"} 
                        style={styles.listImage} 
                        onError={(e) => { 
                          e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; 
                        }} 
                      />
                    </div>
                    <div style={styles.listContent}>
                      <div style={styles.listMeta}>
                        <span style={{...styles.statusDot, backgroundColor: item.active ? "#10b981" : "#cbd5e1"}} />
                        <span style={styles.listStatus}>{item.active ? "Live" : "Draft"}</span>
                        <span style={styles.listType}>
                          {item.type === "slider" ? "Slider" : "Offer"}
                        </span>
                        <span style={styles.listId}>ID: {item._id.slice(-8).toUpperCase()}</span>
                      </div>
                      <h3 style={styles.listTitle}>{item.title || "Untitled Campaign"}</h3>
                      {item.type === "offer" && item.description && (
                        <p style={styles.listDescription}>{item.description}</p>
                      )}
                      <div style={styles.listFooter}>
                        <span style={styles.listDate}>
                          <FaCalendarAlt size={10} />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <div style={styles.listActions}>
                          <motion.button 
                            className="action-btn toggle-btn"
                            onClick={() => handleToggle(item._id)}
                            disabled={togglingId === item._id}
                            style={{
                              ...styles.smallBtn,
                              background: item.active 
                                ? "#f1f5f9" 
                                : "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
                              color: item.active ? "#475569" : "#fff",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {togglingId === item._id ? (
                              <FaSpinner style={{animation: 'spin 1s linear infinite'}} />
                            ) : (
                              item.active ? <FaEyeSlash size={12} /> : <FaEye size={12} />
                            )}
                          </motion.button>
                          <motion.button 
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            style={styles.smallDeleteBtn}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {deletingId === item._id ? (
                              <FaSpinner style={{animation: 'spin 1s linear infinite'}} />
                            ) : (
                              <FaTrashAlt size={12} />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

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
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes statusPulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
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
          }
          
          .action-btn {
            transition: all 0.2s ease;
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
          
          .status-pulse {
            animation: statusPulse 1.5s ease infinite;
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
            .header {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .rightHeader {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .statsGroup {
              flex-wrap: wrap !important;
              justify-content: center !important;
            }
            .filterGroup {
              width: 100% !important;
              justify-content: center !important;
            }
            .searchWrapper {
              flex-direction: column !important;
              gap: 12px !important;
            }
            .controlsGroup {
              flex-wrap: wrap !important;
              justify-content: center !important;
            }
          }
        `}
      </style>
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
  bgDecoration3: {
    position: "absolute",
    top: "50%",
    right: "20%",
    width: "150px",
    height: "150px",
    background: "radial-gradient(circle, rgba(255,150,26,0.03) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: "28px",
    flexWrap: "wrap",
    gap: "16px",
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
    marginBottom: "12px"
  },
  rightHeader: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap"
  },
  statsGroup: {
    display: "flex",
    gap: "12px",
    background: "#fff",
    padding: "8px 16px",
    borderRadius: "60px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  },
  statBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    cursor: "pointer"
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
    fontSize: "30px", 
    fontWeight: "800", 
    margin: 0, 
    color: "#0f172a", 
    letterSpacing: "-0.5px" 
  },
  subtitle: { 
    color: "#64748b", 
    fontSize: "14px", 
    margin: "6px 0 0 0" 
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    gap: "16px",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 1
  },
  searchContainer: {
    position: "relative",
    flex: 1,
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
    padding: "10px 40px 10px 40px",
    borderRadius: "14px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
    outline: "none"
  },
  clearSearch: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "14px",
    padding: "4px"
  },
  controlsGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  filterToggle: {
    padding: "10px 16px",
    borderRadius: "14px",
    border: "2px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    transition: "all 0.2s ease"
  },
  viewToggle: {
    display: "flex",
    gap: "4px",
    background: "#f1f5f9",
    padding: "4px",
    borderRadius: "12px"
  },
  viewBtn: {
    padding: "8px 10px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    background: "transparent",
    color: "#94a3b8",
    transition: "all 0.2s ease"
  },
  activeView: {
    background: "#fff",
    color: "#ff961a",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  sortSelect: {
    padding: "10px 14px",
    borderRadius: "14px",
    border: "2px solid #e2e8f0",
    background: "#fff",
    fontSize: "13px",
    color: "#475569",
    cursor: "pointer",
    outline: "none"
  },
  filtersDropdown: {
    background: "#fff",
    borderRadius: "16px",
    padding: "0",
    marginBottom: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
    overflow: "hidden"
  },
  filtersContent: {
    padding: "20px 24px",
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    alignItems: "flex-end"
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
    minWidth: "150px"
  },
  filterSelect: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    background: "#f8fafc"
  },
  applyFiltersBtn: {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  grid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
    gap: "20px",
    position: "relative",
    zIndex: 1
  },
  listGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    position: "relative",
    zIndex: 1
  },
  card: { 
    background: "#fff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
    transition: "all 0.3s ease",
    overflow: "hidden"
  },
  listCard: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
    transition: "all 0.3s ease",
    display: "flex",
    padding: "16px",
    gap: "16px",
    alignItems: "center"
  },
  cardImageWrapper: {
    width: "100%",
    height: "160px",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#f1f5f9"
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  cardContent: {
    padding: "16px"
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px"
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%"
  },
  cardStatus: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase"
  },
  cardType: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 10px",
    borderRadius: "12px",
    background: "#fff7ed",
    color: "#ff961a"
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 4px 0",
    color: "#0f172a"
  },
  cardDescription: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 12px 0",
    lineHeight: "1.4"
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px"
  },
  cardDate: {
    fontSize: "11px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  cardActions: {
    display: "flex",
    gap: "6px"
  },
  smallBtn: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  smallDeleteBtn: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #fee2e2",
    backgroundColor: "#fff",
    color: "#ef4444",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  draftOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
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
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  listImageWrapper: {
    width: "80px",
    height: "80px",
    borderRadius: "12px",
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#f1f5f9"
  },
  listImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  listContent: {
    flex: 1,
    minWidth: 0
  },
  listMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "4px"
  },
  listStatus: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase"
  },
  listType: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 10px",
    borderRadius: "12px",
    background: "#fff7ed",
    color: "#ff961a"
  },
  listId: {
    fontSize: "10px",
    color: "#94a3b8",
    fontFamily: "monospace"
  },
  listTitle: {
    fontSize: "15px",
    fontWeight: "700",
    margin: "0 0 2px 0",
    color: "#0f172a"
  },
  listDescription: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 8px 0",
    lineHeight: "1.4"
  },
  listFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px"
  },
  listDate: {
    fontSize: "11px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  listActions: {
    display: "flex",
    gap: "6px"
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
    padding: "60px", 
    border: "2px dashed #e2e8f0", 
    borderRadius: "28px",
    backgroundColor: "#fff",
    color: "#94a3b8"
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.5
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 8px 0"
  },
  emptySubtitle: {
    fontSize: "14px",
    color: "#94a3b8"
  },
  emptyBtn: {
    marginTop: "20px",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 15px rgba(255,150,26,0.3)"
  }
};