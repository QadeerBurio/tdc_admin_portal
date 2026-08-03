import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { 
  FaMoneyBillWave, 
  FaTag, 
  FaDownload, 
  FaWallet,
  FaCalendarAlt,
  FaArrowDown,
  FaTrophy,
  FaShoppingBag,
  FaTimes,
  FaPercent,
  FaCoins,
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const SavingsHistory = () => {
  const { token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [brandStats, setBrandStats] = useState({
    totalRevenue: 0,
    totalSavings: 0,
    totalTransactions: 0,
    averageDiscount: 0,
    topPerformingOffer: "",
  });

  useEffect(() => {
    fetchHistory();
  }, [token]);

  useEffect(() => {
    let results = [...history];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(item =>
        item.name?.toLowerCase().includes(term) ||
        item.brand?.toLowerCase().includes(term) ||
        item.rollNo?.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }
    
    if (dateRange.start) {
      results = results.filter(item => new Date(item.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      results = results.filter(item => new Date(item.date) <= new Date(dateRange.end));
    }
    
    results.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    setFilteredHistory(results);
    calculateBrandStats(results);
  }, [searchTerm, dateRange, sortField, sortDirection, history]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/offers/savings-report", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
      setFilteredHistory(res.data);
      calculateBrandStats(res.data);
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const calculateBrandStats = (data) => {
    if (!data || data.length === 0) {
      setBrandStats({
        totalRevenue: 0,
        totalSavings: 0,
        totalTransactions: 0,
        averageDiscount: 0,
        topPerformingOffer: "No data",
      });
      return;
    }

    const totalRevenue = data.reduce((acc, curr) => acc + (curr.bill - curr.saved), 0);
    const totalSavings = data.reduce((acc, curr) => acc + curr.saved, 0);
    const totalTransactions = data.length;
    const averageDiscount = totalTransactions > 0 ? (totalSavings / totalTransactions) : 0;

    const offerCounts = {};
    data.forEach(item => {
      offerCounts[item.brand] = (offerCounts[item.brand] || 0) + 1;
    });
    let topOffer = "N/A";
    let topCount = 0;
    Object.entries(offerCounts).forEach(([offer, count]) => {
      if (count > topCount) {
        topCount = count;
        topOffer = offer;
      }
    });

    setBrandStats({
      totalRevenue,
      totalSavings,
      totalTransactions,
      averageDiscount,
      topPerformingOffer: topOffer,
    });
  };

  const downloadCSV = () => {
    const headers = ["Student Name", "Brand/Offer", "Bill Amount (PKR)", "Saved Amount (PKR)", "Date"];
    const rows = filteredHistory.map(item => [
      item.rollNo,
      item.brand,
      item.bill.toFixed(2),
      item.saved.toFixed(2),
      new Date(item.date).toLocaleDateString()
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Savings_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({ start: "", end: "" });
    setShowFilters(false);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />;
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgDecoration}></div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerBadge}>
            <FaMoneyBillWave />
            <span>Financial Report</span>
          </div>
          <h2 style={styles.title}>Savings Impact Dashboard</h2>
          <p style={styles.subtitle}>Track student redemptions and total savings generated through your offers</p>
        </div>
        <button 
          className="download-btn" 
          style={styles.downloadBtn} 
          onClick={downloadCSV} 
          disabled={filteredHistory.length === 0}
        >
          <FaDownload /> <span style={styles.btnText}>Export Report</span>
        </button>
      </div>

      {/* Stats Overview Section - Responsive Grid */}
      <div style={styles.statsRow}>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#f0fdf4'}}>
            <FaCoins color="#10b981" size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Total Revenue</span>
            <h3 style={{...styles.statValue, color: '#10b981'}}>₨ {brandStats.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fef3c7'}}>
            <FaWallet color="#f59e0b" size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Total Savings</span>
            <h3 style={{...styles.statValue, color: '#f59e0b'}}>₨ {brandStats.totalSavings.toLocaleString()}</h3>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#eff6ff'}}>
            <FaShoppingBag color="#3b82f6" size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Redemptions</span>
            <h3 style={{...styles.statValue, color: '#3b82f6'}}>{brandStats.totalTransactions}</h3>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#f3e8ff'}}>
            <FaPercent color="#8b5cf6" size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Avg Discount</span>
            <h3 style={{...styles.statValue, color: '#8b5cf6'}}>₨ {brandStats.averageDiscount.toFixed(0)}</h3>
          </div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{...styles.statIcon, background: '#fce4ec'}}>
            <FaTrophy color="#e11d48" size={24} />
          </div>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Top Offer</span>
            <h3 style={{...styles.statValue, color: '#e11d48', fontSize: 'clamp(14px, 1.5vw, 18px)'}}>{brandStats.topPerformingOffer}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar - Responsive */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <div style={styles.searchInputWrapper}>
            <FaSearch style={styles.searchIcon} />
            <input 
              style={styles.searchInput}
              placeholder="Search by name or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            style={styles.filterToggleBtn}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> <span style={styles.btnText}>Filters</span>
          </button>
          {(searchTerm || dateRange.start || dateRange.end) && (
            <button style={styles.clearBtn} onClick={clearFilters}>
              <FaTimes /> <span style={styles.btnText}>Clear</span>
            </button>
          )}
        </div>
        
        {showFilters && (
          <div style={styles.dateFilters}>
            <input 
              type="date" 
              style={styles.dateInput}
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span style={styles.dateSeparator}>to</span>
            <input 
              type="date" 
              style={styles.dateInput}
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        )}
      </div>

      {/* Transactions Table - Responsive */}
      <div className="table-container" style={styles.tableWrapper}>
        <div style={styles.tableScrollContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th} onClick={() => handleSort("rollNo")}>
                  <span style={styles.thContent}>
                    Name {getSortIcon("rollNo")}
                  </span>
                </th>
                <th style={styles.th} onClick={() => handleSort("brand")}>
                  <span style={styles.thContent}>
                    Offer {getSortIcon("brand")}
                  </span>
                </th>
                <th style={styles.th} onClick={() => handleSort("bill")}>
                  <span style={styles.thContent}>
                    Bill {getSortIcon("bill")}
                  </span>
                </th>
                <th style={styles.th} onClick={() => handleSort("saved")}>
                  <span style={styles.thContent}>
                    Saved {getSortIcon("saved")}
                  </span>
                </th>
                <th style={styles.th} onClick={() => handleSort("date")}>
                  <span style={styles.thContent}>
                    Date {getSortIcon("date")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={styles.loadingCell}>
                    <div className="loader" style={styles.loader}></div>
                    <span>Loading transaction records...</span>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.emptyCell}>
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>💰</div>
                      <p style={styles.emptyText}>No transactions found</p>
                      <span style={styles.emptySubtext}>Try adjusting your search or date filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, index) => (
                  <tr key={index} className="table-row" style={styles.tr}>
                    <td style={styles.td} data-label="Name">
                      <div style={styles.studentCell}>
                        <div>
                          <div style={styles.studentName}>{item.rollNo}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td} data-label="Offer">
                      <div style={styles.offerCell}>
                        <FaTag size={12} color="#ff961a" />
                        <span style={styles.offerName}>{item.brand}</span>
                      </div>
                    </td>
                    <td style={styles.td} data-label="Bill">
                      <span style={styles.billAmount}>₨ {item.bill.toLocaleString()}</span>
                    </td>
                    <td style={styles.td} data-label="Saved">
                      <div style={styles.savedBadge}>
                        <FaArrowDown size={10} />
                        ₨ {item.saved.toLocaleString()}
                      </div>
                    </td>
                    <td style={styles.td} data-label="Date">
                      <div style={styles.dateCell}>
                        <FaCalendarAlt size={12} color="#94a3b8" />
                        <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      {filteredHistory.length > 0 && (
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <FaTrophy style={{color: '#ff961a'}} />
            <span>Showing {filteredHistory.length} of {history.length} transactions</span>
          </div>
          <div style={styles.footerRight}>
            <span>Revenue: <strong style={{color: '#10b981'}}>₨ {filteredHistory.reduce((acc, curr) => acc + (curr.bill - curr.saved), 0).toLocaleString()}</strong></span>
            <span style={styles.footerDivider}>|</span>
            <span>Savings: <strong style={{color: '#f59e0b'}}>₨ {filteredHistory.reduce((acc, curr) => acc + curr.saved, 0).toLocaleString()}</strong></span>
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
        
        .stat-card {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
        }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.2s; }
        .stat-card:nth-child(5) { animation-delay: 0.25s; }
        
        .table-row {
          transition: all 0.2s ease;
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .table-row:nth-child(1) { animation-delay: 0.05s; }
        .table-row:nth-child(2) { animation-delay: 0.1s; }
        .table-row:nth-child(3) { animation-delay: 0.15s; }
        .table-row:nth-child(4) { animation-delay: 0.2s; }
        .table-row:nth-child(5) { animation-delay: 0.25s; }
        
        .table-row:hover {
          background: #f8fafc;
          transform: translateX(4px);
        }
        
        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 150, 26, 0.2);
        }
        
        th {
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
        }
        th:hover {
          background: #e8edf2;
        }
        
        .table-container {
          animation: fadeInScale 0.5s ease forwards;
        }
        
        .loader {
          width: 24px;
          height: 24px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #ff961a;
          border-radius: 50%;
          margin: 0 auto 12px;
          animation: pulse 0.8s linear infinite;
        }
        
        input:focus {
          outline: none;
          border-color: #ff961a !important;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
        }
        
        .download-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile First Responsive Styles */
        * {
          box-sizing: border-box;
        }

        /* Small screens - Stack everything */
        @media (max-width: 768px) {
          /* Stats become 2 columns */
          .stat-card {
            padding: 12px 14px !important;
          }
          
          .statIcon {
            width: 36px !important;
            height: 36px !important;
          }
          
          .statIcon svg {
            width: 18px !important;
            height: 18px !important;
          }
          
          .statValue {
            font-size: 16px !important;
          }
          
          .statLabel {
            font-size: 9px !important;
          }

          /* Table becomes card view */
          table, thead, tbody, th, td, tr {
            display: block;
          }
          
          thead tr {
            display: none;
          }
          
          .table-row {
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            background: white;
            animation: slideUp 0.4s ease forwards;
            opacity: 0;
          }
          
          td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 4px !important;
            border: none !important;
            border-bottom: 1px solid #f1f5f9 !important;
            width: 100% !important;
          }
          
          td:last-child {
            border-bottom: none !important;
          }
          
          td:before {
            content: attr(data-label);
            font-weight: 600;
            color: #475569;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            flex-shrink: 0;
            margin-right: 12px;
          }
          
          td > div, td > span {
            flex-shrink: 0;
          }
          
          td > div {
            justify-content: flex-end !important;
          }
          
          .studentCell, .offerCell, .dateCell {
            justify-content: flex-end !important;
          }
          
          .savedBadge {
            justify-content: flex-end !important;
          }

          /* Filter bar mobile */
          .searchWrapper {
            flex-wrap: wrap;
          }
          
          .searchInputWrapper {
            min-width: 100% !important;
          }
          
          .filterToggleBtn, .clearBtn {
            flex: 1;
            justify-content: center;
          }
          
          .dateFilters {
            flex-direction: column;
            align-items: stretch;
          }
          
          .dateInput {
            min-width: 100% !important;
          }
          
          .dateSeparator {
            text-align: center;
          }

          /* Footer mobile */
          .footer {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .footerRight {
            flex-wrap: wrap;
          }
        }

        /* Extra small screens */
        @media (max-width: 480px) {
          .container {
            padding: 12px !important;
            border-radius: 16px !important;
          }
          
          .header {
            flex-direction: column;
          }
          
          .downloadBtn {
            width: 100%;
            justify-content: center;
          }
          
          .statsRow {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          
          .statCard {
            padding: 10px !important;
            gap: 8px !important;
          }
          
          .statIcon {
            width: 30px !important;
            height: 30px !important;
          }
          
          .statIcon svg {
            width: 14px !important;
            height: 14px !important;
          }
          
          .statValue {
            font-size: 14px !important;
          }
          
          .statLabel {
            font-size: 8px !important;
          }
          
          .statContent {
            min-width: 0;
          }
          
          .title {
            font-size: 20px !important;
          }
          
          .table-row {
            padding: 10px !important;
          }
          
          td {
            font-size: 12px !important;
            padding: 6px 2px !important;
          }
          
          td:before {
            font-size: 10px !important;
          }
          
          .studentName {
            font-size: 12px !important;
          }
          
          .offerName {
            font-size: 12px !important;
          }
          
          .billAmount {
            font-size: 12px !important;
          }
          
          .savedBadge {
            font-size: 11px !important;
            padding: 2px 8px !important;
          }
          
          .dateCell {
            font-size: 11px !important;
          }
          
          .footer {
            padding: 12px !important;
          }
          
          .footerLeft, .footerRight {
            font-size: 11px !important;
          }
        }

        /* Medium screens - keep table but make it scrollable */
        @media (min-width: 769px) and (max-width: 1024px) {
          .tableScrollContainer {
            overflow-x: auto;
          }
          
          .table {
            min-width: 600px;
          }
          
          th, td {
            padding: 10px 12px !important;
            font-size: 12px !important;
          }
        }

        /* Fix for very small phones */
        @media (max-width: 360px) {
          .statsRow {
            grid-template-columns: 1fr 1fr !important;
          }
          
          .statCard {
            padding: 8px !important;
          }
          
          .statValue {
            font-size: 12px !important;
          }
          
          .statLabel {
            font-size: 7px !important;
          }
          
          .statIcon {
            width: 24px !important;
            height: 24px !important;
          }
          
          .statIcon svg {
            width: 12px !important;
            height: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: { 
    padding: "clamp(12px, 3vw, 35px)", 
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    minHeight: "85vh", 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    borderRadius: "clamp(16px, 3vw, 32px)",
    overflow: "hidden",
    maxWidth: "100%",
    width: "100%"
  },
  bgDecoration: {
    position: "absolute",
    top: "-100px",
    right: "-50px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(255,150,26,0.06) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    display: "none"
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: "clamp(16px, 3vw, 28px)", 
    flexWrap: "wrap", 
    gap: "12px",
    position: "relative",
    zIndex: 1
  },
  headerLeft: {
    flex: 1,
    minWidth: "150px"
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#fff7ed",
    padding: "4px 12px",
    borderRadius: "40px",
    fontSize: "clamp(10px, 1vw, 13px)",
    fontWeight: "600",
    color: "#ff961a",
    marginBottom: "8px"
  },
  title: { 
    margin: 0, 
    color: "#1e293b", 
    fontSize: "clamp(18px, 3vw, 28px)", 
    fontWeight: "800",
    letterSpacing: "-0.5px",
    wordBreak: "break-word"
  },
  subtitle: { 
    margin: "4px 0 0 0", 
    color: "#64748b", 
    fontSize: "clamp(11px, 1vw, 14px)" 
  },
  downloadBtn: { 
    display: "flex", 
    alignItems: "center", 
    gap: "6px", 
    padding: "clamp(8px, 1.2vw, 12px) clamp(14px, 2vw, 24px)", 
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    border: "none", 
    borderRadius: "clamp(10px, 1.5vw, 16px)", 
    cursor: "pointer", 
    fontWeight: "600", 
    transition: "all 0.3s ease", 
    color: "#fff", 
    fontSize: "clamp(11px, 1vw, 14px)",
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  statsRow: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", 
    gap: "clamp(8px, 1.5vw, 16px)", 
    marginBottom: "clamp(16px, 2.5vw, 24px)",
    position: "relative",
    zIndex: 1
  },
  statCard: { 
    background: "#fff", 
    padding: "clamp(10px, 1.8vw, 18px) clamp(10px, 1.8vw, 20px)", 
    borderRadius: "clamp(12px, 2vw, 20px)", 
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    display: "flex", 
    alignItems: "center", 
    gap: "clamp(8px, 1.2vw, 14px)",
    border: "1px solid rgba(255,150,26,0.08)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    minWidth: "0",
    overflow: "hidden"
  },
  statIcon: {
    width: "clamp(30px, 4.5vw, 46px)",
    height: "clamp(30px, 4.5vw, 46px)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  statContent: {
    minWidth: "0",
    flex: 1,
    overflow: "hidden"
  },
  statLabel: { 
    display: "block", 
    color: "#64748b", 
    fontSize: "clamp(7px, 1vw, 11px)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    whiteSpace: "nowrap"
  },
  statValue: { 
    margin: "2px 0 0", 
    fontSize: "clamp(12px, 2.2vw, 22px)", 
    color: "#1e293b",
    fontWeight: "800",
    lineHeight: 1.2,
    wordBreak: "break-word",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  filterBar: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "clamp(14px, 2vw, 20px)",
    position: "relative",
    zIndex: 1
  },
  searchWrapper: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    width: "100%"
  },
  searchInputWrapper: {
    flex: 1,
    position: "relative",
    minWidth: "120px"
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "13px"
  },
  searchInput: {
    width: "100%",
    padding: "clamp(8px, 1.2vw, 12px) 14px clamp(8px, 1.2vw, 12px) 34px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "clamp(12px, 1vw, 14px)",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
    fontFamily: "inherit"
  },
  filterToggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "clamp(8px, 1.2vw, 12px) 12px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "clamp(11px, 1vw, 13px)",
    fontWeight: "500",
    color: "#64748b",
    transition: "all 0.2s",
    whiteSpace: "nowrap"
  },
  clearBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "clamp(8px, 1.2vw, 12px) 12px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "clamp(11px, 1vw, 13px)",
    fontWeight: "500",
    color: "#64748b",
    transition: "all 0.2s",
    whiteSpace: "nowrap"
  },
  dateFilters: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    padding: "10px 14px",
    background: "#fff",
    borderRadius: "12px",
    border: "2px solid #e2e8f0"
  },
  dateInput: {
    padding: "clamp(6px, 1vw, 10px) clamp(10px, 1.2vw, 14px)",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    fontSize: "clamp(11px, 1vw, 13px)",
    backgroundColor: "#fff",
    fontFamily: "inherit",
    cursor: "pointer",
    flex: 1,
    minWidth: "100px"
  },
  dateSeparator: {
    color: "#94a3b8",
    fontSize: "clamp(11px, 1vw, 13px)"
  },
  tableWrapper: { 
    background: "#fff", 
    borderRadius: "16px", 
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)", 
    overflow: "hidden",
    border: "1px solid #f1f5f9",
    position: "relative",
    zIndex: 1
  },
  tableScrollContainer: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    width: "100%"
  },
  table: { 
    width: "100%", 
    borderCollapse: "collapse", 
    textAlign: "left",
    minWidth: "300px",
    maxWidth: "100%"
  },
  theadRow: {
    background: "#f8fafc"
  },
  th: { 
    padding: "clamp(8px, 1.2vw, 14px) clamp(8px, 1.5vw, 18px)", 
    color: "#475569", 
    fontSize: "clamp(9px, 0.8vw, 11px)", 
    textTransform: "uppercase", 
    fontWeight: "700", 
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e2e8f0",
    transition: "background 0.2s",
    whiteSpace: "nowrap"
  },
  thContent: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  td: { 
    padding: "clamp(8px, 1.2vw, 14px) clamp(8px, 1.5vw, 18px)", 
    borderBottom: "1px solid #f1f5f9", 
    fontSize: "clamp(12px, 1vw, 14px)", 
    color: "#334155",
    wordBreak: "break-word",
    maxWidth: "200px"
  },
  tr: { 
    transition: "all 0.2s ease", 
    cursor: "pointer" 
  },
  loadingCell: {
    padding: "clamp(30px, 8vw, 60px)",
    textAlign: "center",
    color: "#64748b"
  },
  loader: {
    width: "20px",
    height: "20px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #ff961a",
    borderRadius: "50%",
    margin: "0 auto 10px"
  },
  emptyCell: {
    padding: "clamp(30px, 8vw, 60px)",
    textAlign: "center"
  },
  emptyState: {
    textAlign: "center"
  },
  emptyIcon: {
    fontSize: "clamp(30px, 6vw, 48px)",
    marginBottom: "10px",
    opacity: 0.5
  },
  emptyText: {
    margin: "0 0 4px 0",
    fontSize: "clamp(14px, 1.5vw, 18px)",
    fontWeight: "600",
    color: "#1e293b"
  },
  emptySubtext: {
    fontSize: "clamp(12px, 1vw, 14px)",
    color: "#64748b"
  },
  studentCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  studentName: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: "clamp(12px, 1vw, 14px)",
    wordBreak: "break-word"
  },
  offerCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  offerName: {
    fontWeight: "500",
    color: "#1e293b",
    wordBreak: "break-word"
  },
  billAmount: {
    fontWeight: "600",
    color: "#1e293b",
    whiteSpace: "nowrap"
  },
  savedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "#f0fdf4",
    color: "#10b981",
    padding: "2px 10px",
    borderRadius: "6px",
    fontSize: "clamp(11px, 0.9vw, 13px)",
    fontWeight: "700",
    whiteSpace: "nowrap"
  },
  dateCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "clamp(11px, 0.9vw, 13px)",
    color: "#64748b",
    whiteSpace: "nowrap"
  },
  footer: {
    marginTop: "clamp(10px, 1.5vw, 16px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "clamp(10px, 1.5vw, 14px) clamp(12px, 2vw, 20px)",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #f1f5f9",
    position: "relative",
    zIndex: 1,
    flexWrap: "wrap",
    gap: "clamp(6px, 1vw, 12px)"
  },
  footerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "clamp(11px, 0.9vw, 13px)",
    color: "#64748b"
  },
  footerRight: {
    display: "flex",
    alignItems: "center",
    gap: "clamp(6px, 1vw, 12px)",
    fontSize: "clamp(11px, 0.9vw, 14px)",
    color: "#1e293b",
    flexWrap: "wrap"
  },
  footerDivider: {
    color: "#e2e8f0",
    fontSize: "clamp(14px, 1.5vw, 18px)"
  },
  btnText: {
    display: "inline"
  }
};

export default SavingsHistory;