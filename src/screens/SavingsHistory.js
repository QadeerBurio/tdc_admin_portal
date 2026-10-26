// Redemptions (design/portal/BrRedemptions): every completed visit, in-store (QR) and online (promo code).
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import Ico from "../portal/Ico";
import { Button, Select, DateInput, SearchInput, Segmented, StatCard, EmptyState, PageLoading, Pill } from "../portal/kit";
import RedemptionTabs from "./RedemptionTabs";
import "./styles/BrandPortal.css";

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
  const [redemptionType, setRedemptionType] = useState("all"); // "all" | "qr" | "promo"
  const [platform, setPlatform] = useState("all"); // "all" | "shopify" | "woocommerce" | "in-store" | "custom"
  const [brandStats, setBrandStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageDiscount: 0,
    topPerformingOffer: "",
    onlineCount: 0,
    inStoreCount: 0,
    onlineSavings: 0,
    inStoreSavings: 0,
  });

  useEffect(() => {
    fetchHistory();
  }, [token]);

  useEffect(() => {
    let results = [...history];

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      results = results.filter(item =>
        item.name?.toLowerCase().includes(term) ||
        item.brand?.toLowerCase().includes(term) ||
        item.rollNo?.toLowerCase().includes(term) ||
        item.promoCode?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term)
      );
    }

    if (redemptionType !== "all") {
      results = results.filter(item => item.redemptionType === redemptionType);
    }

    if (platform !== "all") {
      results = results.filter(item => item.platform === platform);
    }

    if (dateRange.start) {
      results = results.filter(item => new Date(item.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      results = results.filter(item => new Date(item.date) <= endDate);
    }

    results.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortField === "bill" || sortField === "saved") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredHistory(results);
    calculateBrandStats(results);
  }, [searchTerm, dateRange, sortField, sortDirection, history, redemptionType, platform]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/savings-report",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setHistory(data);
      setFilteredHistory(data);
      calculateBrandStats(data);
    } catch (err) {
      console.error("Error fetching history", err);
      setHistory([]);
      setFilteredHistory([]);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const calculateBrandStats = (data) => {
    if (!data || data.length === 0) {
      setBrandStats({
        totalRevenue: 0,
        totalTransactions: 0,
        averageDiscount: 0,
        topPerformingOffer: "No data",
        onlineCount: 0,
        inStoreCount: 0,
        onlineSavings: 0,
        inStoreSavings: 0,
      });
      return;
    }

    const totalRevenue = data.reduce((acc, curr) => acc + ((curr.bill || 0) - (curr.saved || 0)), 0);
    const totalTransactions = data.length;
    const averageDiscount = totalTransactions > 0
      ? (data.reduce((acc, curr) => acc + (curr.saved || 0), 0) / totalTransactions)
      : 0;

    const onlineItems = data.filter(d => d.redemptionType === "promo");
    const inStoreItems = data.filter(d => d.redemptionType === "qr");
    const onlineCount = onlineItems.length;
    const inStoreCount = inStoreItems.length;
    const onlineSavings = onlineItems.reduce((acc, curr) => acc + (curr.saved || 0), 0);
    const inStoreSavings = inStoreItems.reduce((acc, curr) => acc + (curr.saved || 0), 0);

    const offerCounts = {};
    data.forEach(item => {
      const key = item.brand || "Unknown";
      offerCounts[key] = (offerCounts[key] || 0) + 1;
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
      totalTransactions,
      averageDiscount,
      topPerformingOffer: topOffer,
      onlineCount,
      inStoreCount,
      onlineSavings,
      inStoreSavings,
    });
  };

  const downloadCSV = () => {
    const headers = [
      "Student Name",
      "Roll No",
      "Email",
      "University",
      "Brand/Offer",
      "Type",
      "Platform",
      "Promo Code",
      "Bill Amount (PKR)",
      "Saved Amount (PKR)",
      "Paid Amount (PKR)",
      "Date",
    ];

    const rows = filteredHistory.map(item => [
      item.name || "",
      item.rollNo || "",
      item.email || "",
      item.university || "",
      item.brand || "",
      item.redemptionType === "promo" ? "Online" : "In-Store",
      item.platform || "in-store",
      item.promoCode || "-",
      (item.bill || 0).toFixed(2),
      (item.saved || 0).toFixed(2),
      ((item.bill || 0) - (item.saved || 0)).toFixed(2),
      new Date(item.date).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.map(h => `"${h}"`).join(",") +
      "\n" +
      rows.map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Savings_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
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
    setRedemptionType("all");
    setPlatform("all");
    setShowFilters(false);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return <Ico kind={sortDirection === "asc" ? "chevronUp" : "chevronDown"} tone="plain" size={14} />;
  };

  const hasActiveFilters =
    searchTerm ||
    dateRange.start ||
    dateRange.end ||
    redemptionType !== "all" ||
    platform !== "all";

  const getPlatformBadge = (item) => {
    if (item.redemptionType === "qr") {
      return <Pill tone="orange">in-store</Pill>;
    }

    const platformName =
      item.platform === "shopify"
        ? "Shopify"
        : item.platform === "woocommerce"
        ? "WooCommerce"
        : item.platform === "custom"
        ? "Online"
        : "Online";

    const tone =
      item.platform === "shopify"
        ? "green"
        : item.platform === "woocommerce"
        ? "blue"
        : "purple";

    return <Pill tone={tone}>{platformName}</Pill>;
  };

  const sortTh = (field, label) => (
    <th aria-sort={sortField === field ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
      <button type="button" className="k-th-sort" onClick={() => handleSort(field)}>{label} {getSortIcon(field)}</button>
    </th>
  );

  return (
    <div className="tdcp k-page" data-screen="brand-redemptions">
      <div className="k-head">
        <div className="br-title">
          <Ico kind="receipt" tone="blue" size={56} />
          <div>
            <h1>redemptions<span className="dot" aria-hidden="true">.</span></h1>
            <p>every completed visit, in-store and online.</p>
          </div>
        </div>
        <div className="k-actions">
          <Button icon="download" onClick={downloadCSV} disabled={filteredHistory.length === 0}>export report</Button>
        </div>
      </div>

      <RedemptionTabs />

      <div className="k-stats">
        <StatCard label="redemptions" value={brandStats.totalTransactions} icon="receipt" tone="blue" />
        <StatCard label="revenue from tdc" value={`₨ ${brandStats.totalRevenue.toLocaleString()}`} icon="coin" tone="green" />
        <StatCard label="average discount" value={`₨ ${brandStats.averageDiscount.toFixed(0)}`} icon="tag" tone="red" />
        <StatCard label="top offer" value={<span className="br-stat-text">{brandStats.topPerformingOffer}</span>} icon="star" tone="orange" />
        <StatCard
          label="online / in-store"
          value={`${brandStats.onlineCount} / ${brandStats.inStoreCount}`}
          sub={`₨ ${brandStats.onlineSavings.toLocaleString()} / ₨ ${brandStats.inStoreSavings.toLocaleString()}`}
          icon="store"
          tone="purple"
        />
      </div>

      <div className="k-toolbar">
        <Segmented
          label="filter by type"
          value={redemptionType}
          onChange={setRedemptionType}
          options={[
            { value: "all", label: "all" },
            { value: "qr", label: "in-store (QR)" },
            { value: "promo", label: "online (promo code)" },
          ]}
        />
        <Select aria-label="platform" style={{ width: "auto" }} value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="all">all platforms</option>
          <option value="in-store">in-store</option>
          <option value="shopify">Shopify</option>
          <option value="woocommerce">WooCommerce</option>
          <option value="custom">custom website</option>
        </Select>
      </div>

      <div className="k-toolbar">
        <SearchInput
          className="k-grow"
          aria-label="search redemptions"
          placeholder="Search by name, roll no, promo code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant={showFilters ? "primary" : "secondary"} icon="calendar" onClick={() => setShowFilters(!showFilters)}>dates</Button>
        {hasActiveFilters && (
          <Button variant="ghost" icon="close" onClick={clearFilters}>clear</Button>
        )}
      </div>

      {showFilters && (
        <div className="k-toolbar">
          <DateInput aria-label="from date" style={{ width: "auto" }} value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
          <span className="k-muted">to</span>
          <DateInput aria-label="to date" style={{ width: "auto" }} value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
        </div>
      )}

      <div className="k-table-card">
        <div className="k-table-scroll">
          <table className="k-table" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                {sortTh("date", "date")}
                {sortTh("rollNo", "customer")}
                {sortTh("brand", "offer")}
                <th>type</th>
                {sortTh("bill", "bill")}
                {sortTh("saved", "discount")}
                <th>paid</th>
              </tr>
            </thead>
            {!loading && filteredHistory.length > 0 && (
              <tbody>
                {filteredHistory.map((item, index) => (
                  <tr key={index}>
                    <td className="br-nowrap">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="vr-cell">
                        <b>{item.rollNo || item.name || "N/A"}</b>
                        {item.university && item.university !== "N/A" && (
                          <span className="k-muted">{item.university}</span>
                        )}
                      </div>
                    </td>
                    <td>{item.brand}</td>
                    <td>
                      <div className="vr-cell">
                        {getPlatformBadge(item)}
                        {item.promoCode && <span className="vr-mono k-muted">{item.promoCode}</span>}
                      </div>
                    </td>
                    <td className="br-nowrap">₨ {(item.bill || 0).toLocaleString()}</td>
                    <td className="br-nowrap br-off">- ₨ {(item.saved || 0).toLocaleString()}</td>
                    <td className="br-nowrap"><b>₨ {((item.bill || 0) - (item.saved || 0)).toLocaleString()}</b></td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {loading ? (
          <PageLoading label="Loading transaction records..." />
        ) : filteredHistory.length === 0 ? (
          <EmptyState icon="receipt" tone="blue" title="No Redemption found" text="Try adjusting your search or filters" />
        ) : null}
      </div>

      {filteredHistory.length > 0 && (
        <div className="br-foot">
          <span>Showing {filteredHistory.length} of {history.length} transactions</span>
          <span>
            Revenue:{" "}
            <strong>
              ₨{" "}
              {filteredHistory
                .reduce((acc, curr) => acc + ((curr.bill || 0) - (curr.saved || 0)), 0)
                .toLocaleString()}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default SavingsHistory;
