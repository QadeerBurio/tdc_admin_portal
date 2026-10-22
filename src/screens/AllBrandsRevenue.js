// AllBrandsRevenue.js: what tdc users spend at partner brands (design/portal/AdRevenue).
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, IconButton, SearchInput, Segmented, StatCard, Modal, EmptyState, Pill, Card, Facts } from "../portal/kit";
import "./styles/AllBrandsRevenue.css";

// the server sends this placeholder when a brand has no top offer
const NO_TOP_OFFER = "\u2014";

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

  // Drill-down modal
  const [showDrilldown, setShowDrilldown] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const navigate = useNavigate();
  const tableRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 768);
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
    return <Ico kind={sortDirection === "asc" ? "chevronUp" : "chevronDown"} tone="plain" size={12} />;
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
    if (index === 0) return { icon: "trophy", tone: "yellow", label: "1st" };
    if (index === 1) return { icon: "award", tone: "purple", label: "2nd" };
    if (index === 2) return { icon: "award", tone: "green", label: "3rd" };
    return { icon: null, tone: "sand", label: `#${index + 1}` };
  };

  const getPlatformBadge = (brand) => {
    if (brand.platform === "shopify") return { label: "Shopify", tone: "green" };
    if (brand.platform === "woocommerce") return { label: "WooCommerce", tone: "blue" };
    return { label: "Custom", tone: "purple" };
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
    return <div className="tdcp k-page"><PageLoading label="Loading brands revenue..." /></div>;
  }

  const rs = (n) => `₨ ${(n || 0).toLocaleString()}`;

  return (
    <div className="tdcp k-page br" data-screen="brands-revenue">
      <PageHeader
        title="brands revenue"
        sub="what tdc users spend at partner brands, in-store and online."
        actions={<>
          <Button variant="secondary" icon="refresh" onClick={refreshData} loading={refreshing}>Refresh</Button>
          <Button icon="download" onClick={downloadExcel} disabled={brands.length === 0}>Export</Button>
        </>}
      />

      <div className="k-stats">
        <StatCard label="Total Revenue" value={rs(summary.totalRevenue)} sub={`${summary.brandsWithRevenue || 0} brands`} icon="coin" tone="green" />
        <StatCard label="Total Bills" value={rs(summary.totalBill)} sub="Across all brands" icon="wallet" tone="blue" />
        <StatCard label="Student Saved" value={rs(summary.totalSaved)} sub="Total discounts" icon="gift" tone="yellow" />
        <StatCard label="Redemptions" value={`${(summary.totalRedemptions || 0).toLocaleString()}`} sub="QR + Promo" icon="ticket" tone="purple" />
        <StatCard label="Unique Students" value={`${(summary.uniqueStudents || 0).toLocaleString()}`} sub="Across all brands" icon="users" tone="pink" />
        <StatCard label="Total Brands" value={`${summary.totalBrands || 0}`} sub={`${summary.brandsWithRevenue || 0} with revenue`} icon="store" tone="blue" />
      </div>

      <div className="k-toolbar">
        <SearchInput
          className="k-grow"
          placeholder="Search brands by name, category, email..."
          aria-label="search brands"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="br-label">Status</span>
        <Segmented
          label="status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[{ value: "all", label: "All" }, { value: "withRevenue", label: "With Revenue" }, { value: "noRevenue", label: "No Revenue" }]}
        />
        <span className="br-label">Platform</span>
        <Segmented
          label="platform"
          value={filterPlatform}
          onChange={setFilterPlatform}
          options={[{ value: "all", label: "All" }, { value: "shopify", label: "Shopify" }, { value: "woocommerce", label: "WooCommerce" }, { value: "both", label: "Online+Store" }]}
        />
      </div>

      <div className="k-table-card" ref={tableRef}>
        <div className="k-table-scroll">
          <table className="k-table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={{ width: 70 }}>rank</th>
                <th><button type="button" className="k-th-sort" onClick={() => handleSort("name")}>brand {getSortIcon("name")}</button></th>
                <th>platform</th>
                <th><button type="button" className="k-th-sort" onClick={() => handleSort("totalRevenue")}>revenue {getSortIcon("totalRevenue")}</button></th>
                <th><button type="button" className="k-th-sort" onClick={() => handleSort("totalBill")}>bills {getSortIcon("totalBill")}</button></th>
                <th><button type="button" className="k-th-sort" onClick={() => handleSort("totalSaved")}>saved {getSortIcon("totalSaved")}</button></th>
                <th><button type="button" className="k-th-sort" onClick={() => handleSort("totalRedemptions")}>redeem {getSortIcon("totalRedemptions")}</button></th>
                <th><button type="button" className="k-th-sort" onClick={() => handleSort("uniqueStudents")}>students {getSortIcon("uniqueStudents")}</button></th>
                <th>breakdown</th>
                <th style={{ textAlign: "center" }}>action</th>
              </tr>
            </thead>
            {currentBrands.length > 0 && (
              <tbody>
                {currentBrands.map((b, i) => {
                  const rank = getRankBadge(indexOfFirst + i);
                  const plat = getPlatformBadge(b);
                  const hasRevenue = b.totalRevenue > 0;
                  return (
                    <tr key={b._id} className={`clickable${indexOfFirst + i < 3 && hasRevenue ? " br-top" : ""}`} onClick={() => openDrilldown(b)}>
                      <td><Pill tone={rank.tone}>{rank.icon && <Ico kind={rank.icon} tone="plain" size={12} />}{rank.label}</Pill></td>
                      <td>
                        <div className="k-row" style={{ flexWrap: "nowrap" }}>
                          <span className="br-logo">
                            {b.logo ? (
                              <img
                                src={b.logo}
                                alt={b.name}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.parentElement.textContent = b.name?.charAt(0).toUpperCase() || "?";
                                }}
                              />
                            ) : (
                              b.name?.charAt(0).toUpperCase() || "?"
                            )}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <b>{b.name}</b>
                            <div className="k-hint">
                              {b.category}
                              {b.approvalStatus !== "approved" && <span className="br-pending"> • {b.approvalStatus}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                          <Pill tone={plat.tone}><Ico kind="globe" tone="plain" size={11} />{plat.label}</Pill>
                          <span className="k-row" style={{ gap: 4 }}>
                            {b.isOnline && <Pill tone="sky">Online</Pill>}
                            {b.isInStore && <Pill tone="orange">Store</Pill>}
                          </span>
                        </div>
                      </td>
                      <td>
                        <b className="br-ok">₨ {b.totalRevenue.toLocaleString()}</b>
                        {hasRevenue && (
                          <div className="k-hint">
                            avg ₨{" "}
                            {Math.round(b.totalRevenue / Math.max(b.totalRedemptions, 1)).toLocaleString()}
                            /redeem
                          </div>
                        )}
                      </td>
                      <td>₨ {b.totalBill.toLocaleString()}</td>
                      <td>₨ {b.totalSaved.toLocaleString()}</td>
                      <td>{b.totalRedemptions.toLocaleString()}</td>
                      <td>{b.uniqueStudents.toLocaleString()}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {b.qrCount > 0 && <span className="k-row k-hint" style={{ gap: 4 }}><Ico kind="store" tone="plain" size={11} />{b.qrCount} store</span>}
                          {b.promoCount > 0 && <span className="k-row k-hint" style={{ gap: 4 }}><Ico kind="globe" tone="plain" size={11} />{b.promoCount} online</span>}
                          {b.qrCount === 0 && b.promoCount === 0 && <span className="k-muted">–</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <IconButton
                          icon="eye"
                          label="View details"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrilldown(b);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
        {currentBrands.length === 0 && (
          <EmptyState icon="coin" title="No brands found" text={searchTerm ? "Try adjusting your search" : "No brands registered yet"} />
        )}

        {filteredAndSorted.length > itemsPerPage && (
          <div className="k-pager">
            <span>
              Showing {indexOfFirst + 1} –{" "}
              {Math.min(indexOfLast, filteredAndSorted.length)} of{" "}
              {filteredAndSorted.length}
            </span>
            <div className="k-pager-btns">
              <button type="button" className="k-page-btn" onClick={() => goToPage(1)} disabled={currentPage === 1} aria-label="First Page"><Ico kind="chevronLeft" tone="plain" size={13} /><Ico kind="chevronLeft" tone="plain" size={13} /></button>
              <button type="button" className="k-page-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous Page"><Ico kind="chevronLeft" tone="plain" size={15} /></button>
              {getPageNumbers().map((p) => (
                <button type="button" key={p} className="k-page-btn" onClick={() => goToPage(p)} aria-current={p === currentPage ? "page" : undefined}>{p}</button>
              ))}
              <button type="button" className="k-page-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next Page"><Ico kind="chevronRight" tone="plain" size={15} /></button>
              <button type="button" className="k-page-btn" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} aria-label="Last Page"><Ico kind="chevronRight" tone="plain" size={13} /><Ico kind="chevronRight" tone="plain" size={13} /></button>
            </div>
            {!isMobile && <span>{itemsPerPage} per page</span>}
          </div>
        )}
      </div>

      {/* brand drill-down */}
      <Modal
        open={showDrilldown && !!selectedBrand}
        onClose={closeDrilldown}
        size="lg"
        icon="store"
        tone="green"
        title={selectedBrand?.name}
        sub={selectedBrand ? `${selectedBrand.category} • ${selectedBrand.platform}` : undefined}
        footer={<Button onClick={closeDrilldown}>Close</Button>}
      >
        {selectedBrand && (
          <>
            <div className="k-stats">
              <StatCard label="Total Revenue" value={`₨ ${selectedBrand.totalRevenue.toLocaleString()}`} icon="coin" tone="green" />
              <StatCard label="Total Bills" value={`₨ ${selectedBrand.totalBill.toLocaleString()}`} icon="wallet" tone="blue" />
              <StatCard label="Student Saved" value={`₨ ${selectedBrand.totalSaved.toLocaleString()}`} icon="gift" tone="yellow" />
              <StatCard label="Redemptions" value={selectedBrand.totalRedemptions} icon="ticket" tone="purple" />
              <StatCard label="Unique Students" value={selectedBrand.uniqueStudents} icon="users" tone="pink" />
              <StatCard label="Offers" value={selectedBrand.offersCount} icon="store" tone="blue" />
            </div>

            <Card title="Redemption Breakdown" icon="chart" tone="sand">
              <div className="br-split">
                <div className="br-split-card">
                  <div className="k-row" style={{ flexWrap: "nowrap" }}>
                    <Ico kind="store" tone="yellow" size={36} />
                    <div><b>In-Store (QR)</b><div className="k-hint">{selectedBrand.qrCount} redemptions</div></div>
                  </div>
                  <Facts rows={[["Revenue", `₨ ${selectedBrand.qrRevenue.toLocaleString()}`], ["Saved", `₨ ${selectedBrand.qrSaved.toLocaleString()}`]]} />
                </div>
                <div className="br-split-card">
                  <div className="k-row" style={{ flexWrap: "nowrap" }}>
                    <Ico kind="globe" tone="blue" size={36} />
                    <div><b>Online (Promo)</b><div className="k-hint">{selectedBrand.promoCount} redemptions</div></div>
                  </div>
                  <Facts rows={[["Revenue", `₨ ${selectedBrand.promoRevenue.toLocaleString()}`], ["Bills", `₨ ${selectedBrand.promoBill.toLocaleString()}`]]} />
                </div>
              </div>
            </Card>

            {selectedBrand.topOffer !== NO_TOP_OFFER && (
              <Card title="Top Performing Offer" icon="trophy" tone="orange">
                <div className="k-row" style={{ flexWrap: "nowrap" }}>
                  <Ico kind="flame" tone="orange" size={36} />
                  <div style={{ minWidth: 0 }}>
                    <b style={{ overflowWrap: "anywhere" }}>{selectedBrand.topOffer}</b>
                    <div className="k-hint">{selectedBrand.topOfferCount} redemptions</div>
                  </div>
                </div>
              </Card>
            )}

            <Card title="Contact & Info" icon="mail" tone="sand">
              <Facts rows={[
                ...(selectedBrand.email ? [["Email", selectedBrand.email]] : []),
                ...(selectedBrand.phone ? [["Phone", selectedBrand.phone]] : []),
                ...(selectedBrand.address ? [["Address", selectedBrand.address]] : []),
                ["Joined", new Date(selectedBrand.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
              ]} />
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
}
