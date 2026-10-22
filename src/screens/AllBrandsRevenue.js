// AllBrandsRevenue.js - Complete All-Brands Revenue Dashboard
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  TrendingUp, TrendingDown, Users, Store, Globe,
  Search, X, Download, RefreshCw, ArrowUpRight, ArrowLeft,
  Building, Trophy, Award, Medal, Crown, Gift, Ticket,
  ChevronDown, ChevronUp, ChevronLeft, ChevronsLeft,
  ChevronRight, ChevronsRight, Filter, Eye, Calendar,
  DollarSign, Wallet, Percent, Flame, Sparkles, Star,
  PieChart, Layers, CircleDollarSign, BadgeCheck, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AllBrandsRevenue() {
  const [brands, setBrands] = useState([]);
  const [summary, setSummary] = useState({
    totalBrands: 0,
    brandsWithRevenue: 0,
    totalRevenue: 0,
    totalBill: 0,
    totalSaved: 0,
    totalRedemptions: 0,
    uniqueStudents: 0,
    averageRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("totalRevenue");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all"); // all | withRevenue | noRevenue | approved | pending
  const [filterPlatform, setFilterPlatform] = useState("all"); // all | shopify | woocommerce | online+store
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);

  // Drill-down modal
  const [showDrilldown, setShowDrilldown] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const navigate = useNavigate();
  const tableRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPlatform, sortField, sortDirection]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://the-deft-crew-production.up.railway.app/api/offers/admin/brands-revenue`,
        // `http://localhost:5000/api/offers/admin/brands-revenue`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (data.success) {
        setBrands(Array.isArray(data.brands) ? data.brands : []);
        setSummary(data.summary || {});
      } else {
        setBrands([]);
      }
    } catch (err) {
      console.error("Error fetching brands revenue:", err);
      setBrands([]);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc"
      ? <ChevronUp size={12} />
      : <ChevronDown size={12} />;
  };

  // Filter + sort
  const filteredAndSorted = brands
    .filter(b => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        b.name?.toLowerCase().includes(term) ||
        b.category?.toLowerCase().includes(term) ||
        b.email?.toLowerCase().includes(term) ||
        b.address?.toLowerCase().includes(term);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "withRevenue" && b.totalRevenue > 0) ||
        (filterStatus === "noRevenue" && b.totalRevenue === 0) ||
        (filterStatus === "approved" && b.approvalStatus === "approved") ||
        (filterStatus === "pending" && b.approvalStatus === "pending");

      const matchesPlatform =
        filterPlatform === "all" ||
        (filterPlatform === "shopify" && b.platform === "shopify") ||
        (filterPlatform === "woocommerce" && b.platform === "woocommerce") ||
        (filterPlatform === "both" && b.isOnline && b.isInStore) ||
        (filterPlatform === "onlineOnly" && b.isOnline && !b.isInStore) ||
        (filterPlatform === "storeOnly" && !b.isOnline && b.isInStore);

      return matchesSearch && matchesStatus && matchesPlatform;
    })
    .sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.toLowerCase().localeCompare(bVal.toLowerCase())
          : bVal.toLowerCase().localeCompare(aVal.toLowerCase());
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1;
  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const indexOfLast = indexOfFirst + itemsPerPage;
  const currentBrands = filteredAndSorted.slice(indexOfFirst, indexOfLast);

  const goToPage = (p) => {
    setCurrentPage(p);
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getPageNumbers = () => {
    const maxPages = isMobile ? 3 : 5;
    let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let end = Math.min(totalPages, start + maxPages - 1);
    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  };

  const downloadExcel = () => {
    const rows = filteredAndSorted.map(b => ({
      "Brand Name": b.name,
      "Category": b.category,
      "Platform": b.platform,
      "Approval": b.approvalStatus,
      "Total Revenue (PKR)": b.totalRevenue,
      "Total Bill (PKR)": b.totalBill,
      "Student Saved (PKR)": b.totalSaved,
      "Total Redemptions": b.totalRedemptions,
      "Unique Students": b.uniqueStudents,
      "In-Store Redemptions": b.qrCount,
      "Online Redemptions": b.promoCount,
      "Top Offer": b.topOffer,
      "Contact Email": b.email,
      "Contact Phone": b.phone,
      "Joined": new Date(b.createdAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Brands Revenue");
    XLSX.writeFile(wb, `AllBrandsRevenue_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const getRankBadge = (index) => {
    if (index === 0) return { icon: <Crown size={14} />, color: "#C77700", bg: "#FFF1CC", label: "1st" };
    if (index === 1) return { icon: <Trophy size={14} />, color: "#8E44AD", bg: "#F1E6F5", label: "2nd" };
    if (index === 2) return { icon: <Medal size={14} />, color: "#1E6B3A", bg: "#E3F3E8", label: "3rd" };
    return { icon: null, color: "#9A958B", bg: "#F0ECE2", label: `#${index + 1}` };
  };

  const getPlatformBadge = (brand) => {
    if (brand.platform === "shopify") {
      return { label: "Shopify", color: "#2e7d32", bg: "#E3F3E8", icon: <Globe size={10} /> };
    }
    if (brand.platform === "woocommerce") {
      return { label: "WooCommerce", color: "#1565c0", bg: "#e3f2fd", icon: <Globe size={10} /> };
    }
    return { label: "Custom", color: "#8E44AD", bg: "#F1E6F5", icon: <Globe size={10} /> };
  };

  const openDrilldown = (brand) => {
    setSelectedBrand(brand);
    setShowDrilldown(true);
  };

  const closeDrilldown = () => {
    setShowDrilldown(false);
    setSelectedBrand(null);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div
          style={styles.spinner}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p style={styles.loadingText}>Loading brands revenue...</p>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.bgDeco1}></div>
      <div style={styles.bgDeco2}></div>
      <div style={styles.bgDeco3}></div>

      <div style={styles.container}>
        {/* Header */}
        <motion.div
          style={{
            ...styles.header,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "flex-start",
            gap: isMobile ? "12px" : "16px",
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 style={{
              ...styles.title,
              fontSize: isMobile ? "22px" : isTablet ? "26px" : "30px",
            }}>
              brands revenue<span className="dot" aria-hidden="true">.</span>
            </h1>
            <p style={{
              ...styles.subtitle,
              fontSize: isMobile ? "12px" : "14px",
            }}>
              what tdc users spend at partner brands, in-store and online.
            </p>
          </div>
          <div style={{
            ...styles.headerActions,
            flexDirection: isMobile ? "column" : "row",
            width: isMobile ? "100%" : "auto",
          }}>
            <motion.button
              onClick={refreshData}
              disabled={refreshing}
              style={{
                ...styles.refreshBtn,
                width: isMobile ? "100%" : "auto",
                justifyContent: "center",
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <RefreshCw size={16} className={refreshing ? "spinning" : ""} />
              {!isMobile && "Refresh"}
            </motion.button>
            <motion.button
              onClick={downloadExcel}
              disabled={brands.length === 0}
              style={{
                ...styles.downloadBtn,
                width: isMobile ? "100%" : "auto",
                justifyContent: "center",
                opacity: brands.length === 0 ? 0.5 : 1,
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Download size={16} />
              {!isMobile && "Export"}
            </motion.button>
          </div>
        </motion.div>

        {/* Global Summary Cards */}
        <motion.div
          style={{
            ...styles.summaryGrid,
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : isTablet
              ? "repeat(3, 1fr)"
              : "repeat(auto-fit, minmax(180px, 1fr))",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <SummaryCard
            icon={<CircleDollarSign size={20} />}
            label="Total Revenue"
            value={`₨ ${(summary.totalRevenue || 0).toLocaleString()}`}
            sub={`${summary.brandsWithRevenue || 0} brands`}
            color="#1E6B3A"
            bg="#E3F3E8"
            isMobile={isMobile}
          />
          <SummaryCard
            icon={<Wallet size={20} />}
            label="Total Bills"
            value={`₨ ${(summary.totalBill || 0).toLocaleString()}`}
            sub="Across all brands"
            color="#2B7FC0"
            bg="#E1F1FA"
            isMobile={isMobile}
          />
          <SummaryCard
            icon={<Gift size={20} />}
            label="Student Saved"
            value={`₨ ${(summary.totalSaved || 0).toLocaleString()}`}
            sub="Total discounts"
            color="#C77700"
            bg="#FFF1CC"
            isMobile={isMobile}
          />
          <SummaryCard
            icon={<Ticket size={20} />}
            label="Redemptions"
            value={`${(summary.totalRedemptions || 0).toLocaleString()}`}
            sub="QR + Promo"
            color="#8E44AD"
            bg="#F1E6F5"
            isMobile={isMobile}
          />
          <SummaryCard
            icon={<Users size={20} />}
            label="Unique Students"
            value={`${(summary.uniqueStudents || 0).toLocaleString()}`}
            sub="Across all brands"
            color="#C2185B"
            bg="#FCE4EC"
            isMobile={isMobile}
          />
          <SummaryCard
            icon={<Store size={20} />}
            label="Total Brands"
            value={`${summary.totalBrands || 0}`}
            sub={`${summary.brandsWithRevenue || 0} with revenue`}
            color="#2B7FC0"
            bg="#E1F1FA"
            isMobile={isMobile}
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          style={{
            ...styles.filterBar,
            flexDirection: isMobile ? "column" : "row",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div style={styles.searchWrapper}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search brands by name, category, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={styles.clearSearch}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div style={styles.filterGroupWrapper}>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Status:</span>
              {[
                { key: "all", label: "All" },
                { key: "withRevenue", label: "With Revenue" },
                { key: "noRevenue", label: "No Revenue" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  style={{
                    ...styles.filterBtn,
                    ...(filterStatus === f.key ? styles.filterBtnActive : {}),
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Platform:</span>
              {[
                { key: "all", label: "All" },
                { key: "shopify", label: "Shopify" },
                { key: "woocommerce", label: "WooCommerce" },
                { key: "both", label: "Online+Store" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterPlatform(f.key)}
                  style={{
                    ...styles.filterBtn,
                    ...(filterPlatform === f.key ? styles.filterBtnActive : {}),
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          ref={tableRef}
          style={styles.tableWrapper}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={{ ...styles.th, width: "60px" }}>RANK</th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("name")}
                    className="sortable"
                  >
                    <span style={styles.thContent}>
                      BRAND {getSortIcon("name")}
                    </span>
                  </th>
                  <th style={styles.th}>PLATFORM</th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("totalRevenue")}
                    className="sortable"
                  >
                    <span style={styles.thContent}>
                      REVENUE {getSortIcon("totalRevenue")}
                    </span>
                  </th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("totalBill")}
                    className="sortable"
                  >
                    <span style={styles.thContent}>
                      BILLS {getSortIcon("totalBill")}
                    </span>
                  </th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("totalSaved")}
                    className="sortable"
                  >
                    <span style={styles.thContent}>
                      SAVED {getSortIcon("totalSaved")}
                    </span>
                  </th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("totalRedemptions")}
                    className="sortable"
                  >
                    <span style={styles.thContent}>
                      REDEEM {getSortIcon("totalRedemptions")}
                    </span>
                  </th>
                  <th
                    style={styles.th}
                    onClick={() => handleSort("uniqueStudents")}
                    className="sortable"
                  >
                    <span style={styles.thContent}>
                      STUDENTS {getSortIcon("uniqueStudents")}
                    </span>
                  </th>
                  <th style={styles.th}>BREAKDOWN</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {currentBrands.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={styles.emptyCell}>
                      <div style={styles.emptyIcon}>💰</div>
                      <p style={styles.emptyText}>No brands found</p>
                      <span style={styles.emptySubtext}>
                        {searchTerm
                          ? "Try adjusting your search"
                          : "No brands registered yet"}
                      </span>
                    </td>
                  </tr>
                ) : (
                  currentBrands.map((b, i) => {
                    const rank = getRankBadge(indexOfFirst + i);
                    const plat = getPlatformBadge(b);
                    const hasRevenue = b.totalRevenue > 0;

                    return (
                      <motion.tr
                        key={b._id}
                        style={{
                          ...styles.tr,
                          ...(indexOfFirst + i < 3 && hasRevenue
                            ? styles.topBrandRow
                            : {}),
                        }}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                        whileHover={{ backgroundColor: "#FAF8F3" }}
                        onClick={() => openDrilldown(b)}
                      >
                        {/* Rank */}
                        <td style={styles.td}>
                          <div style={{
                            ...styles.rankBadge,
                            background: rank.bg,
                            color: rank.color,
                          }}>
                            {rank.icon}
                            <span>{rank.label}</span>
                          </div>
                        </td>

                        {/* Brand */}
                        <td style={styles.td}>
                          <div style={styles.brandCell}>
                            <div style={styles.brandLogo}>
                              {b.logo ? (
                                <img
                                  src={b.logo}
                                  alt={b.name}
                                  style={styles.brandLogoImg}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.textContent =
                                      b.name?.charAt(0).toUpperCase() || "?";
                                  }}
                                />
                              ) : (
                                b.name?.charAt(0).toUpperCase() || "?"
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={styles.brandName}>{b.name}</div>
                              <div style={styles.brandMeta}>
                                {b.category}
                                {b.approvalStatus !== "approved" && (
                                  <span style={styles.pendingTag}>
                                    • {b.approvalStatus}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Platform */}
                        <td style={styles.td}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{
                              ...styles.platformBadge,
                              background: plat.bg,
                              color: plat.color,
                            }}>
                              {plat.icon}
                              {plat.label}
                            </div>
                            <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                              {b.isOnline && (
                                <span style={styles.microBadgeBlue}>Online</span>
                              )}
                              {b.isInStore && (
                                <span style={styles.microBadgeOrange}>Store</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Revenue */}
                        <td style={styles.td}>
                          <div style={styles.revenueValue}>
                            ₨ {b.totalRevenue.toLocaleString()}
                          </div>
                          {hasRevenue && (
                            <div style={styles.revenueSub}>
                              avg ₨{" "}
                              {Math.round(
                                b.totalRevenue / Math.max(b.totalRedemptions, 1)
                              ).toLocaleString()}
                              /redeem
                            </div>
                          )}
                        </td>

                        {/* Bills */}
                        <td style={styles.td}>
                          <div style={styles.billValue}>
                            ₨ {b.totalBill.toLocaleString()}
                          </div>
                        </td>

                        {/* Saved */}
                        <td style={styles.td}>
                          <div style={styles.savedValue}>
                            ₨ {b.totalSaved.toLocaleString()}
                          </div>
                        </td>

                        {/* Redemptions */}
                        <td style={styles.td}>
                          <div style={styles.redeemValue}>
                            {b.totalRedemptions.toLocaleString()}
                          </div>
                        </td>

                        {/* Students */}
                        <td style={styles.td}>
                          <div style={styles.studentValue}>
                            {b.uniqueStudents.toLocaleString()}
                          </div>
                        </td>

                        {/* Breakdown */}
                        <td style={styles.td}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            {b.qrCount > 0 && (
                              <div style={styles.breakdownRow}>
                                <Store size={10} color="#8A5A00" />
                                <span>{b.qrCount} store</span>
                              </div>
                            )}
                            {b.promoCount > 0 && (
                              <div style={styles.breakdownRow}>
                                <Globe size={10} color="#1565c0" />
                                <span>{b.promoCount} online</span>
                              </div>
                            )}
                            {b.qrCount === 0 && b.promoCount === 0 && (
                              <span style={{ color: "#9A958B", fontSize: "11px" }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDrilldown(b);
                            }}
                            style={styles.viewBtn}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="View details"
                          >
                            <Eye size={14} />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAndSorted.length > itemsPerPage && (
            <div style={{
              ...styles.paginationWrapper,
              flexDirection: isMobile ? "column" : "row",
            }}>
              <div style={styles.paginationInfo}>
                Showing {indexOfFirst + 1} –{" "}
                {Math.min(indexOfLast, filteredAndSorted.length)} of{" "}
                {filteredAndSorted.length}
              </div>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.paginationBtn,
                    ...(currentPage === 1 ? styles.paginationDisabled : {}),
                  }}
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.paginationBtn,
                    ...(currentPage === 1 ? styles.paginationDisabled : {}),
                  }}
                >
                  <ChevronLeft size={14} />
                </button>

                {getPageNumbers().map(p => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    style={{
                      ...styles.paginationBtn,
                      ...(p === currentPage ? styles.paginationActive : {}),
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.paginationBtn,
                    ...(currentPage === totalPages ? styles.paginationDisabled : {}),
                  }}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.paginationBtn,
                    ...(currentPage === totalPages ? styles.paginationDisabled : {}),
                  }}
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
              {!isMobile && (
                <div style={styles.paginationPageSize}>
                  {itemsPerPage} per page
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Brand Drill-Down Modal */}
      <AnimatePresence>
        {showDrilldown && selectedBrand && (
          <motion.div
            style={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrilldown}
          >
            <motion.div
              style={{
                ...styles.modalContent,
                maxWidth: isMobile ? "98%" : "680px",
                maxHeight: isMobile ? "95vh" : "90vh",
              }}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={styles.modalHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={styles.modalLogo}>
                    {selectedBrand.logo ? (
                      <img
                        src={selectedBrand.logo}
                        alt={selectedBrand.name}
                        style={styles.modalLogoImg}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.textContent =
                            selectedBrand.name?.charAt(0).toUpperCase() || "?";
                        }}
                      />
                    ) : (
                      selectedBrand.name?.charAt(0).toUpperCase() || "?"
                    )}
                  </div>
                  <div>
                    <h3 style={styles.modalTitle}>{selectedBrand.name}</h3>
                    <p style={styles.modalSubtitle}>
                      {selectedBrand.category} • {selectedBrand.platform}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={closeDrilldown}
                  style={styles.modalCloseBtn}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Stats Grid */}
              <div style={styles.modalBody}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                  gap: "10px",
                }}>
                  <MiniStat
                    icon={<CircleDollarSign size={16} color="#1E6B3A" />}
                    label="Total Revenue"
                    value={`₨ ${selectedBrand.totalRevenue.toLocaleString()}`}
                    bg="#E3F3E8"
                    color="#1E6B3A"
                  />
                  <MiniStat
                    icon={<Wallet size={16} color="#2B7FC0" />}
                    label="Total Bills"
                    value={`₨ ${selectedBrand.totalBill.toLocaleString()}`}
                    bg="#E1F1FA"
                    color="#2B7FC0"
                  />
                  <MiniStat
                    icon={<Gift size={16} color="#C77700" />}
                    label="Student Saved"
                    value={`₨ ${selectedBrand.totalSaved.toLocaleString()}`}
                    bg="#FFF1CC"
                    color="#8A5A00"
                  />
                  <MiniStat
                    icon={<Ticket size={16} color="#8E44AD" />}
                    label="Redemptions"
                    value={selectedBrand.totalRedemptions}
                    bg="#F1E6F5"
                    color="#8E44AD"
                  />
                  <MiniStat
                    icon={<Users size={16} color="#C2185B" />}
                    label="Unique Students"
                    value={selectedBrand.uniqueStudents}
                    bg="#FCE4EC"
                    color="#831843"
                  />
                  <MiniStat
                    icon={<Store size={16} color="#2B7FC0" />}
                    label="Offers"
                    value={selectedBrand.offersCount}
                    bg="#E1F1FA"
                    color="#2B7FC0"
                  />
                </div>

                {/* Split Breakdown */}
                <div style={styles.sectionBlock}>
                  <h4 style={styles.sectionTitle}>
                    <Layers size={14} /> Redemption Breakdown
                  </h4>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "10px",
                    marginTop: "8px",
                  }}>
                    <div style={styles.breakdownCard}>
                      <div style={styles.breakdownHeader}>
                        <div style={{
                          ...styles.breakdownIcon,
                          background: "#FFF1CC",
                          color: "#8A5A00",
                        }}>
                          <Store size={16} />
                        </div>
                        <div>
                          <div style={styles.breakdownTitle}>In-Store (QR)</div>
                          <div style={styles.breakdownSub}>
                            {selectedBrand.qrCount} redemptions
                          </div>
                        </div>
                      </div>
                      <div style={styles.breakdownDetails}>
                        <div>
                          <span style={styles.breakdownLabel}>Revenue</span>
                          <span style={styles.breakdownValue}>
                            ₨ {selectedBrand.qrRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span style={styles.breakdownLabel}>Saved</span>
                          <span style={{
                            ...styles.breakdownValue,
                            color: "#8A5A00",
                          }}>
                            ₨ {selectedBrand.qrSaved.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.breakdownCard}>
                      <div style={styles.breakdownHeader}>
                        <div style={{
                          ...styles.breakdownIcon,
                          background: "#e3f2fd",
                          color: "#1565c0",
                        }}>
                          <Globe size={16} />
                        </div>
                        <div>
                          <div style={styles.breakdownTitle}>Online (Promo)</div>
                          <div style={styles.breakdownSub}>
                            {selectedBrand.promoCount} redemptions
                          </div>
                        </div>
                      </div>
                      <div style={styles.breakdownDetails}>
                        <div>
                          <span style={styles.breakdownLabel}>Revenue</span>
                          <span style={styles.breakdownValue}>
                            ₨ {selectedBrand.promoRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span style={styles.breakdownLabel}>Bills</span>
                          <span style={styles.breakdownValue}>
                            ₨ {selectedBrand.promoBill.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Offer */}
                {selectedBrand.topOffer !== "—" && (
                  <div style={styles.sectionBlock}>
                    <h4 style={styles.sectionTitle}>
                      <Trophy size={14} /> Top Performing Offer
                    </h4>
                    <div style={styles.topOfferCard}>
                      <div style={styles.topOfferIcon}>
                        <Flame size={18} color="#C77700" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.topOfferTitle}>
                          {selectedBrand.topOffer}
                        </div>
                        <div style={styles.topOfferSub}>
                          {selectedBrand.topOfferCount} redemptions
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div style={styles.sectionBlock}>
                  <h4 style={styles.sectionTitle}>
                    <Building size={14} /> Contact & Info
                  </h4>
                  <div style={styles.infoGrid}>
                    {selectedBrand.email && (
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Email</span>
                        <span style={styles.infoValue}>{selectedBrand.email}</span>
                      </div>
                    )}
                    {selectedBrand.phone && (
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Phone</span>
                        <span style={styles.infoValue}>{selectedBrand.phone}</span>
                      </div>
                    )}
                    {selectedBrand.address && (
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Address</span>
                        <span style={styles.infoValue}>{selectedBrand.address}</span>
                      </div>
                    )}
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Joined</span>
                      <span style={styles.infoValue}>
                        {new Date(selectedBrand.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={styles.modalFooter}>
                <button
                  onClick={closeDrilldown}
                  style={styles.modalCloseBtnBottom}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; }
        .sortable { cursor: pointer; user-select: none; transition: background 0.2s; }
        .sortable:hover { background: #F0ECE2; }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ==========================================================
// Reusable: Summary Card
// ==========================================================
function SummaryCard({ icon, label, value, sub, color, bg, isMobile }) {
  return (
    <motion.div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: isMobile ? "12px 14px" : "16px 20px",
        border: "1px solid #F0ECE2",
        boxShadow: "0 1px 2px rgba(17, 17, 17, 0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: "110px",
      }}
      whileHover={{ y: -3, boxShadow: "0 1px 2px rgba(17, 17, 17, 0.04)" }}
      transition={{ duration: 0.2 }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{
          width: isMobile ? "34px" : "40px",
          height: isMobile ? "34px" : "40px",
          borderRadius: "10px",
          background: bg,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{
          fontSize: isMobile ? "9px" : "11px",
          color: "#6B675E",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}>
          {label}
        </div>
        <div style={{
          fontSize: isMobile ? "16px" : "20px",
          fontWeight: 800,
          color: "#111111",
          marginTop: "2px",
          lineHeight: 1.2,
          wordBreak: "break-word",
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            fontSize: isMobile ? "9px" : "11px",
            color: "#9A958B",
            marginTop: "2px",
            fontWeight: 500,
          }}>
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ==========================================================
// Reusable: Mini Stat
// ==========================================================
function MiniStat({ icon, label, value, bg, color }) {
  return (
    <div style={{
      background: bg,
      borderRadius: "12px",
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon}
        <span style={{
          fontSize: "10px",
          fontWeight: 700,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.3px",
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: "16px",
        fontWeight: 800,
        color: "#111111",
        wordBreak: "break-word",
      }}>
        {value}
      </div>
    </div>
  );
}

// ==========================================================
// Styles
// ==========================================================
const styles = {
  pageWrapper: {
    minHeight: "auto",
    background: "transparent",
    position: "relative",
    width: "100%",
    padding: "0",
    boxShadow: "none",
    border: "none",
    margin: "0",
    borderRadius: "0",
  },
  bgDeco1: {
    position: "absolute",
    top: "-100px",
    right: "-60px",
    width: "340px",
    height: "340px",
    background: "transparent",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  bgDeco2: {
    position: "absolute",
    bottom: "-80px",
    left: "-60px",
    width: "280px",
    height: "280px",
    background: "transparent",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  bgDeco3: {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "700px",
    height: "700px",
    background: "transparent",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  container: {
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "clamp(12px, 2vw, 24px)",
    boxShadow: "0 1px 2px rgba(17, 17, 17, 0.04)",
    border: "1px solid rgba(255,255,255,0.5)",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
    maxWidth: "1600px",
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#FFF1CC",
    padding: "5px 14px",
    borderRadius: "40px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#C77700",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    color: "#111111",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#6B675E",
    fontWeight: 400,
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  refreshBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#F0ECE2",
    color: "#6B675E",
    border: "1px solid #ECE7DB",
    padding: "10px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
  downloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#111111",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
  summaryGrid: {
    display: "grid",
    gap: "clamp(8px, 1.2vw, 14px)",
    marginBottom: "20px",
  },
  filterBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "18px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchWrapper: {
    position: "relative",
    flex: 1,
    minWidth: "200px",
    maxWidth: "420px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9A958B",
  },
  searchInput: {
    width: "100%",
    padding: "10px 36px 10px 36px",
    borderRadius: "12px",
    border: "2px solid #ECE7DB",
    fontSize: "13px",
    outline: "none",
    background: "#fff",
    transition: "all 0.2s",
  },
  clearSearch: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "#F0ECE2",
    border: "none",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#6B675E",
  },
  filterGroupWrapper: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    gap: "3px",
    background: "#F0ECE2",
    padding: "4px",
    borderRadius: "26px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#6B675E",
    padding: "0 6px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  filterBtn: {
    padding: "5px 10px",
    borderRadius: "20px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600,
    color: "#6B675E",
    transition: "all 0.2s",
  },
  filterBtnActive: {
    background: "#fff",
    color: "#C77700",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  tableWrapper: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #F0ECE2",
    boxShadow: "0 1px 2px rgba(17, 17, 17, 0.04)",
    overflow: "hidden",
  },
  tableScroll: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px",
  },
  theadRow: {
    background: "#FAF8F3",
  },
  th: {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 700,
    color: "#6B675E",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #ECE7DB",
    whiteSpace: "nowrap",
  },
  thContent: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  tr: {
    borderBottom: "1px solid #F0ECE2",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  topBrandRow: {
    background: "#FFF1CC",
  },
  td: {
    padding: "12px 14px",
    fontSize: "13px",
    color: "#111111",
    verticalAlign: "middle",
  },
  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "10px",
    fontWeight: 700,
  },
  brandCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  brandLogo: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#111111",
    color: "#C77700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "15px",
    flexShrink: 0,
    overflow: "hidden",
  },
  brandLogoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  brandName: {
    fontWeight: 700,
    color: "#111111",
    fontSize: "13px",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "180px",
  },
  brandMeta: {
    fontSize: "10px",
    color: "#9A958B",
    marginTop: "2px",
  },
  pendingTag: {
    color: "#C77700",
    fontWeight: 600,
  },
  platformBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  microBadgeBlue: {
    fontSize: "9px",
    background: "#E1F1FA",
    color: "#2B7FC0",
    padding: "2px 6px",
    borderRadius: "6px",
    fontWeight: 600,
  },
  microBadgeOrange: {
    fontSize: "9px",
    background: "#FFF1CC",
    color: "#8A5A00",
    padding: "2px 6px",
    borderRadius: "6px",
    fontWeight: 600,
  },
  revenueValue: {
    fontWeight: 800,
    color: "#1E6B3A",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  revenueSub: {
    fontSize: "10px",
    color: "#9A958B",
    marginTop: "2px",
    fontWeight: 500,
  },
  billValue: {
    fontWeight: 700,
    color: "#2B7FC0",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  savedValue: {
    fontWeight: 700,
    color: "#8A5A00",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  redeemValue: {
    fontWeight: 700,
    color: "#8E44AD",
    fontSize: "13px",
  },
  studentValue: {
    fontWeight: 700,
    color: "#C2185B",
    fontSize: "13px",
  },
  breakdownRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    color: "#6B675E",
    fontWeight: 600,
  },
  viewBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    border: "1px solid #ECE7DB",
    background: "#fff",
    color: "#6B675E",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  emptyCell: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#9A958B",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#111111",
    margin: 0,
  },
  emptySubtext: {
    fontSize: "12px",
    color: "#9A958B",
    marginTop: "4px",
    display: "block",
  },
  paginationWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    borderTop: "1px solid #F0ECE2",
    flexWrap: "wrap",
    gap: "10px",
    background: "rgba(255,255,255,0.5)",
  },
  paginationInfo: {
    fontSize: "12px",
    color: "#6B675E",
    fontWeight: 500,
  },
  paginationControls: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  paginationBtn: {
    minWidth: "32px",
    height: "32px",
    padding: "0 8px",
    borderRadius: "8px",
    border: "1px solid #ECE7DB",
    background: "#fff",
    color: "#6B675E",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  paginationActive: {
    background: "#111111",
    color: "#fff",
    borderColor: "#111111",
  },
  paginationDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  paginationPageSize: {
    fontSize: "11px",
    color: "#9A958B",
    fontWeight: 600,
  },
  loadingContainer: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    color: "#6B675E",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #ECE7DB",
    borderTopColor: "#111111",
    borderRadius: "50%",
  },
  loadingText: {
    fontSize: "13px",
    fontWeight: 500,
  },
  // ========== MODAL ==========
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "16px",
  },
  modalContent: {
    background: "#fff",
    borderRadius: "20px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(17, 17, 17, 0.16)",
  },
  modalHeader: {
    padding: "18px 22px",
    borderBottom: "1px solid #F0ECE2",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#FAF8F3",
  },
  modalLogo: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#F9C349",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "18px",
    flexShrink: 0,
    overflow: "hidden",
  },
  modalLogoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  modalTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 800,
    color: "#111111",
  },
  modalSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#6B675E",
    fontWeight: 500,
  },
  modalCloseBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    color: "#6B675E",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: "18px 22px",
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  sectionBlock: {
    background: "#FAF8F3",
    borderRadius: "12px",
    padding: "14px 16px",
    border: "1px solid #F0ECE2",
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    fontSize: "12px",
    fontWeight: 700,
    color: "#111111",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  breakdownCard: {
    background: "#fff",
    borderRadius: "10px",
    padding: "12px",
    border: "1px solid #ECE7DB",
  },
  breakdownHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  breakdownIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownTitle: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#111111",
  },
  breakdownSub: {
    fontSize: "10px",
    color: "#9A958B",
    fontWeight: 500,
    marginTop: "1px",
  },
  breakdownDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingTop: "8px",
    borderTop: "1px dashed #ECE7DB",
  },
  breakdownLabel: {
    fontSize: "11px",
    color: "#6B675E",
    fontWeight: 500,
  },
  breakdownValue: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#111111",
    display: "block",
    marginTop: "2px",
  },
  topOfferCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#fff",
    borderRadius: "10px",
    padding: "12px",
    border: "1px solid #FFF1CC",
  },
  topOfferIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#FFF1CC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  topOfferTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#111111",
  },
  topOfferSub: {
    fontSize: "11px",
    color: "#9A958B",
    marginTop: "2px",
    fontWeight: 500,
  },
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    gap: "10px",
    paddingBottom: "6px",
    borderBottom: "1px dashed #F0ECE2",
  },
  infoLabel: {
    color: "#6B675E",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  infoValue: {
    color: "#111111",
    fontWeight: 600,
    textAlign: "right",
    wordBreak: "break-word",
  },
  modalFooter: {
    padding: "14px 22px",
    borderTop: "1px solid #F0ECE2",
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    background: "#fafbfc",
  },
  modalCloseBtnBottom: {
    padding: "9px 22px",
    background: "#111111",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
};