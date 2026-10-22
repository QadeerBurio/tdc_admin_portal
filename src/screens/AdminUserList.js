// AdminUserList.js: all students / brands / employers / travelers (design/portal/AdStudents, AdBrands, AdEmployers, AdTravelers),
// quick view, brand offer QR codes and redemptions.
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import Ico from "../portal/Ico";
import { TOKEN } from "../portal/tokens";
import { PageLoading, PageHeader, Button, IconButton, Spinner, StatCard, SearchInput, Segmented, Modal, EmptyState, Pill, Card, Facts, toast } from "../portal/kit";
import "./styles/AdminUserList.css";

// Header copy from the design boards; the number is the count of loaded accounts.
const fmtCount = (n) => (n == null ? "" : Number(n).toLocaleString("en-US"));
const BOARD = {
  student: { title: "all students", sub: (n) => (n == null ? "registered tdc users." : `${fmtCount(n)} registered tdc users.`) },
  brand: { title: "all brands", sub: (n) => (n == null ? "partner brands across Karachi, Lahore and Islamabad." : `${fmtCount(n)} partner brands across Karachi, Lahore and Islamabad.`) },
  employee: { title: "all employers", sub: (n) => (n == null ? "companies hiring through the career hub." : `${fmtCount(n)} companies hiring through the career hub.`) },
  traveler: { title: "all travelers", sub: (n) => (n == null ? "users with a traveler account." : `users with a traveler account. ${fmtCount(n)} so far.`) },
};
const ROLE_ICON = { student: "grad", brand: "store", employee: "briefcase", traveler: "plane", admin: "shield" };
const ROLE_TONE = { student: "blue", brand: "purple", employee: "green", traveler: "ink", admin: "red" };
const APP_TONE = { pending: "orange", reviewed: "blue", shortlisted: "green", interview: "purple", rejected: "red", hired: "green" };
const PLATFORM = { shopify: ["green", "Shopify"], woocommerce: ["blue", "WooCommerce"] };

export default function AdminUserList({ role, title }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterReferral, setFilterReferral] = useState("all");
  const [togglingId, setTogglingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [refreshing, setRefreshing] = useState(false);
  const [userDetails, setUserDetails] = useState({
    offers: [],
    jobs: [],
    applications: [],
    claimedOffers: [],
    savings: [],
    resume: null,
    stats: {}
  });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);

  // QR Code states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [selectedOfferForQR, setSelectedOfferForQR] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [copied, setCopied] = useState(false);

  // Brand Redemptions Drill-Down states
  const [showRedemptionsModal, setShowRedemptionsModal] = useState(false);
  const [brandRedemptions, setBrandRedemptions] = useState([]);
  const [brandRedemptionStats, setBrandRedemptionStats] = useState({
    totalRedemptions: 0,
    totalRevenue: 0,
    totalBill: 0,
    totalSaved: 0,
    uniqueStudents: 0,
    onlineCount: 0,
    inStoreCount: 0,
    onlineSaved: 0,
    inStoreSaved: 0
  });
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [redemptionSearchTerm, setRedemptionSearchTerm] = useState("");
  const [redemptionFilter, setRedemptionFilter] = useState("all");

  // Refs for scroll management
  const modalRef = useRef(null);
  const modalBodyRef = useRef(null);
  const pageWrapperRef = useRef(null);
  const tableContainerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    fetchUsers();
  }, [role]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterReferral, sortField, sortDirection]);

  useEffect(() => {
    if (showModal && modalBodyRef.current) {
      setTimeout(() => {
        if (modalBodyRef.current) {
          modalBodyRef.current.scrollTop = 0;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  }, [showModal]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://the-deft-crew-production.up.railway.app/api/admin/users/${role}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const refreshUsers = async () => {
    setRefreshing(true);
    await fetchUsers();
    setTimeout(() => setRefreshing(false), 500);
  };

  const downloadExcel = () => {
    const dataToExport = users.map((user) => ({
      'Full Name': user.name,
      'Email': user.email,
      'Phone': user.phone || 'N/A',
      'Role': user.role,
      'Status': user.status,
      'Brand/Company': user.brandName || user.companyName || 'N/A',
      'University': user.university?.name || 'N/A',
      'Roll No': user.rollNo || 'N/A',
      'Referral Code': user.referralCode || 'N/A',
      'Referral Count': user.referralCount || 0,
      'Referred By': user.referredBy?.name || 'None',
      'Is VIP': user.isVip ? 'Yes' : 'No',
      'Is Alumni': user.isAlumni ? 'Yes' : 'No',
      'Card Status': user.cardStatus || 'None',
      'Payment Status': user.paymentStatus || 'None',
      'Joined Date': new Date(user.createdAt).toLocaleDateString(),
      'Has Logo': user.logo ? 'Yes' : 'No',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, `${role}_report_${Date.now()}.xlsx`);
  };

  const toggleVerification = async (id, e) => {
    e.stopPropagation();
    setTogglingId(id);
    try {
      const res = await fetch(
        `https://the-deft-crew-production.up.railway.app/api/admin/approve-user/${id}`,
        { method: "POST", headers: getAuthHeaders() }
      );
      if (res.ok) fetchUsers();
    } catch (err) {
      toast("Error updating status");
    } finally {
      setTogglingId(null);
    }
  };

  const viewUserDetails = (userId) => {
    setShowModal(false);
    navigate(`/admin/users/${role}/${userId}`);
  };

  const openUserModal = async (user) => {
    setSelectedUser(user);
    setShowModal(true);
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await fetchUserCompleteDetails(user);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserDetails({
      offers: [],
      jobs: [],
      applications: [],
      claimedOffers: [],
      savings: [],
      resume: null,
      stats: {}
    });
    document.body.style.overflow = '';
  };

  const fetchUserCompleteDetails = async (user) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem("token");

      let details = {
        offers: [],
        jobs: [],
        applications: [],
        claimedOffers: [],
        savings: [],
        resume: null,
        stats: {}
      };

      if (user.role === 'brand') {
        try {
          const offersRes = await fetch(
            `https://the-deft-crew-production.up.railway.app/api/offers/brand/${user._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const offersData = await offersRes.json();
          details.offers = Array.isArray(offersData) ? offersData : [];

          // Fetch revenue stats for this brand
          try {
            const statsRes = await fetch(
              `https://the-deft-crew-production.up.railway.app/api/offers/brand/${user._id}/redemptions`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const statsData = await statsRes.json();
            if (statsData.success) {
              details.stats = statsData.stats;
            }
          } catch (statsErr) {
            console.error("Error fetching brand revenue stats:", statsErr);
          }
        } catch (err) {
          console.error("Error fetching brand details:", err);
        }
      }

      // Students and employers: the API has no per-user admin endpoints for claims, savings, applications,
      // CV or posted jobs (the /my-... endpoints return the logged-in admin's own data), so none are loaded here.

      setUserDetails(details);
    } catch (err) {
      console.error("Error fetching user details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // QR Code Functions
  const generateQRForOffer = async (offer, brandUser, e) => {
    e.stopPropagation();
    setSelectedOfferForQR(offer);
    setGeneratingQR(true);

    try {
      const qrPayload = {
        type: 'offer',
        offerId: offer._id,
        brandId: brandUser._id,
        brandName: brandUser.brandName || brandUser.name || 'Brand',
        offerTitle: offer.title || 'Offer',
        discount: offer.discountPercentage || 0,
        timestamp: new Date().toISOString(),
        isOnline: offer.isOnline || false,
        isInStore: offer.isInStore || false,
        promoCode: offer.promoCode || null
      };

      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 400,
        margin: 2,
        color: {
          dark: TOKEN.ink,
          light: TOKEN.card
        },
        errorCorrectionLevel: 'H'
      });

      setQrImage(qrDataUrl);
      setQrData(qrPayload);
      setShowQRModal(true);
    } catch (err) {
      console.error("Error generating QR code:", err);
      toast("Failed to generate QR code for this offer");
    } finally {
      setGeneratingQR(false);
    }
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setQrImage(null);
    setQrData(null);
    setSelectedOfferForQR(null);
  };

  const downloadQR = () => {
    if (qrImage) {
      const link = document.createElement('a');
      link.download = `qr-${selectedOfferForQR?.title || 'offer'}-${selectedUser?.brandName || 'brand'}.png`;
      link.href = qrImage;
      link.click();
    }
  };

  const copyQRData = () => {
    if (qrData) {
      navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareQR = async () => {
    if (qrImage) {
      try {
        const response = await fetch(qrImage);
        const blob = await response.blob();
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });

        if (navigator.share) {
          await navigator.share({
            title: `${selectedUser?.brandName || 'Brand'} Discount QR Code`,
            text: `Scan this QR code to get ${selectedOfferForQR?.discountPercentage || 0}% off at ${selectedUser?.brandName || selectedUser?.name || 'Brand'}`,
            files: [file]
          });
        } else {
          await navigator.clipboard.writeText(qrImage);
          toast('QR code copied to clipboard!');
        }
      } catch (err) {
        console.error("Share error:", err);
      }
    }
  };

  // ========== BRAND REDEMPTIONS DRILL-DOWN ==========
  const fetchBrandRedemptions = async (brandId) => {
    setLoadingRedemptions(true);
    try {
      const res = await fetch(
        `https://the-deft-crew-production.up.railway.app/api/offers/brand/${brandId}/redemptions`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (data.success) {
        setBrandRedemptions(Array.isArray(data.redemptions) ? data.redemptions : []);
        setBrandRedemptionStats(data.stats || {});
      } else {
        setBrandRedemptions([]);
        setBrandRedemptionStats({});
        console.error("Failed to load redemptions:", data.message);
      }
    } catch (err) {
      console.error("Error fetching brand redemptions:", err);
      setBrandRedemptions([]);
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const openRedemptionsModal = async (e) => {
    if (e) e.stopPropagation();
    if (!selectedUser || selectedUser.role !== 'brand') return;
    setShowRedemptionsModal(true);
    setRedemptionSearchTerm("");
    setRedemptionFilter("all");
    await fetchBrandRedemptions(selectedUser._id);
  };

  const closeRedemptionsModal = () => {
    setShowRedemptionsModal(false);
    setBrandRedemptions([]);
    setBrandRedemptionStats({
      totalRedemptions: 0,
      totalRevenue: 0,
      totalBill: 0,
      totalSaved: 0,
      uniqueStudents: 0,
      onlineCount: 0,
      inStoreCount: 0,
      onlineSaved: 0,
      inStoreSaved: 0
    });
    setRedemptionSearchTerm("");
    setRedemptionFilter("all");
  };

  const filteredRedemptions = brandRedemptions.filter(r => {
    if (redemptionFilter !== "all" && r.redemptionType !== redemptionFilter) {
      return false;
    }
    if (redemptionSearchTerm) {
      const term = redemptionSearchTerm.toLowerCase().trim();
      return (
        r.studentName?.toLowerCase().includes(term) ||
        r.rollNo?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.offerTitle?.toLowerCase().includes(term) ||
        r.promoCode?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getRoleIcon = (role) => <Ico kind={ROLE_ICON[role] || "user"} tone="plain" size={14} />;

  const getRoleColor = (role) => ROLE_TONE[role] || "sand";

  const getReferralLevel = (count) => {
    if (count >= 10) return { level: 'Elite', tone: 'purple', icon: 'trophy' };
    if (count >= 5) return { level: 'Pro', tone: 'orange', icon: 'star' };
    if (count >= 1) return { level: 'Starter', tone: 'blue', icon: 'spark' };
    return { level: 'New', tone: 'sand', icon: 'plus' };
  };

  const handleStatClick = (filterType, value) => {
    setCurrentPage(1);
    if (activeStatFilter === filterType) {
      setActiveStatFilter(null);
      setFilterStatus("all");
      setFilterReferral("all");
    } else {
      setActiveStatFilter(filterType);
      if (filterType === 'verified') {
        setFilterStatus("verified");
        setFilterReferral("all");
      } else if (filterType === 'pending') {
        setFilterStatus("pending");
        setFilterReferral("all");
      } else if (filterType === 'vip') {
        setFilterStatus("all");
        setFilterReferral("all");
      } else if (filterType === 'referrals') {
        setFilterStatus("all");
        setFilterReferral("high");
      }
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.referralCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" ||
        (filterStatus === "verified" && user.status === "Verified") ||
        (filterStatus === "pending" && user.status !== "Verified");

      const matchesReferral = filterReferral === "all" ||
        (filterReferral === "high" && (user.referralCount || 0) >= 10) ||
        (filterReferral === "medium" && (user.referralCount || 0) >= 5 && (user.referralCount || 0) < 10) ||
        (filterReferral === "low" && (user.referralCount || 0) > 0 && (user.referralCount || 0) < 5) ||
        (filterReferral === "none" && (user.referralCount || 0) === 0);

      return matchesSearch && matchesStatus && matchesReferral;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'referralCount') {
        aVal = a.referralCount || 0;
        bVal = b.referralCount || 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredAndSortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = isMobile ? 3 : 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const stats = {
    total: users.length,
    verified: users.filter(u => u.status === "Verified").length,
    pending: users.filter(u => u.status !== "Verified").length,
    vip: users.filter(u => u.isVip).length,
    totalReferrals: users.reduce((sum, u) => sum + (u.referralCount || 0), 0),
    topReferrers: users.filter(u => (u.referralCount || 0) >= 10).length,
    withLogo: users.filter(u => u.logo).length,
  };

  if (loading) {
    return <div className="tdcp k-page"><PageLoading label={`Loading ${role} records...`} /></div>;
  }

  const offerType = (o, long) => (o.isOnline && o.isInStore ? <Pill tone="purple">Online & In-Store</Pill>
    : o.isOnline ? <Pill tone="blue">{long ? "Online Only" : "Online"}</Pill>
      : o.isInStore ? <Pill tone="green">{long ? "In-Store Only" : "In-Store"}</Pill>
        : long ? <Pill tone="sand">Standard</Pill> : null);

  const sortHead = (field, label) => (
    <button type="button" className="k-th-sort" onClick={() => handleSort(field)} aria-label={`sort by ${label}`}>
      {label}
      {sortField === field && <Ico kind={sortDirection === 'asc' ? 'chevronUp' : 'chevronDown'} tone="plain" size={14} />}
    </button>
  );

  const statCards = [
    { icon: 'users', label: 'Total', value: stats.total, tone: 'green', filter: 'total' },
    { icon: 'checkCircle', label: 'Verified', value: stats.verified, tone: 'blue', filter: 'verified' },
    { icon: 'clock', label: 'Pending', value: stats.pending, tone: 'orange', filter: 'pending' },
    { icon: 'star', label: 'VIP', value: stats.vip, tone: 'pink', filter: 'vip' },
    { icon: 'gift', label: 'Referrals', value: stats.totalReferrals, tone: 'yellow', filter: 'referrals' },
    { icon: 'image', label: 'With Logo', value: stats.withLogo, tone: 'purple', filter: 'logo' },
  ];
  const listLimit = isMobile ? 3 : 5;

  return (
    <div className="tdcp k-page aul" ref={pageWrapperRef} data-screen={`users-${role}`}>
      <PageHeader
        title={BOARD[role]?.title || title}
        sub={BOARD[role] ? BOARD[role].sub(loading ? null : users.length) : `all ${role} accounts.`}
        actions={<>
          <Button variant="secondary" icon="refresh" onClick={refreshUsers} loading={refreshing}>Refresh</Button>
          <Button icon="download" onClick={downloadExcel} disabled={users.length === 0}>Export</Button>
        </>}
      />

      {/* stats: verified, pending, VIP and referrals filter the list */}
      <div className="k-stats aul-stats" style={isTablet ? { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" } : undefined}>
        {statCards.map((s) => (
          <StatCard
            key={s.filter}
            label={s.label}
            value={s.value}
            icon={s.icon}
            tone={s.tone}
            pressed={activeStatFilter === s.filter}
            onClick={() => handleStatClick(s.filter, s.value)}
          />
        ))}
      </div>

      {/* search and filters */}
      <div className="k-toolbar">
        <SearchInput
          className="k-grow"
          style={{ maxWidth: 420 }}
          placeholder={isMobile ? "Search..." : `Search by name, email, ${role === 'brand' || role === 'employee' ? 'company or ' : ''}referral code...`}
          aria-label="search users"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="aul-filter-label">Status</span>
        <Segmented
          label="status"
          value={filterStatus}
          onChange={(v) => {
            if (v === "all") { setFilterStatus("all"); setActiveStatFilter(null); setCurrentPage(1); }
            else if (v === "verified") { setFilterStatus("verified"); setActiveStatFilter('verified'); setCurrentPage(1); }
            else { setFilterStatus("pending"); setActiveStatFilter('pending'); setCurrentPage(1); }
          }}
          options={[{ value: "all", label: "All" }, { value: "verified", label: "Verified" }, { value: "pending", label: "Pending" }]}
        />
        <span className="aul-filter-label">Referrals</span>
        <Segmented
          label="referrals"
          value={filterReferral}
          onChange={(v) => {
            if (v === "all") { setFilterReferral("all"); setActiveStatFilter(null); setCurrentPage(1); }
            else if (v === "high") { setFilterReferral("high"); setActiveStatFilter('referrals'); setCurrentPage(1); }
            else { setFilterReferral("medium"); setActiveStatFilter(null); setCurrentPage(1); }
          }}
          options={[{ value: "all", label: "All" }, { value: "high", label: "10+" }, { value: "medium", label: "5-9" }]}
        />
      </div>

      {/* table */}
      <div className="k-table-card" ref={tableContainerRef}>
        <div className="k-table-scroll">
          <table className="k-table" style={{ minWidth: 1040 }}>
            <thead>
              <tr>
                <th>{sortHead('name', 'user')}</th>
                <th>{sortHead('email', 'contact')}</th>
                {(role === "brand" || role === "employee") && <th>{sortHead('brandName', 'company')}</th>}
                {role === "student" && <th>{sortHead('university', 'university')}</th>}
                <th>{sortHead('referralCount', 'referral')}</th>
                <th>{sortHead('status', 'status')}</th>
                <th style={{ textAlign: 'center' }}>logo</th>
                <th style={{ textAlign: 'center' }}>role</th>
                <th style={{ textAlign: 'center' }}>actions</th>
              </tr>
            </thead>
            {currentUsers.length > 0 && (
              <tbody>
                {currentUsers.map((u) => {
                  const referralLevel = getReferralLevel(u.referralCount);
                  const isTop = u.referralCount >= 10;
                  const verified = u.status === "Verified";
                  return (
                    <tr key={u._id} className={`clickable${isTop ? " aul-top" : ""}`} onClick={() => openUserModal(u)}>
                      <td>
                        <div className="aul-user">
                          <span className="aul-avatar">
                            {u.name?.charAt(0).toUpperCase() || '?'}
                            {isTop && <span className="aul-crown"><Ico kind="star" tone="yellow" size={16} /></span>}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="aul-name">{u.name}</div>
                            <div className="aul-sub">{u.role}{u.isAlumni ? ' • Alumni' : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="aul-line"><Ico kind="mail" tone="plain" size={14} />{u.email}</div>
                        {u.phone && <div className="aul-line aul-sub"><Ico kind="phone" tone="plain" size={13} />{u.phone}</div>}
                      </td>
                      {(role === "brand" || role === "employee") && (
                        <td>
                          <Pill tone="sand"><Ico kind="store" tone="plain" size={13} />{u.brandName || u.companyName || "N/A"}</Pill>
                          {u.logo && <div className="aul-line aul-sub aul-ok"><Ico kind="image" tone="plain" size={12} />Logo</div>}
                        </td>
                      )}
                      {role === "student" && (
                        <td>
                          <Pill tone="sand"><Ico kind="grad" tone="plain" size={13} />{u.university?.name || "N/A"}</Pill>
                          {u.rollNo && <div className="aul-line aul-sub">#{u.rollNo}</div>}
                        </td>
                      )}
                      <td>
                        <div className="aul-line"><Ico kind="link" tone="plain" size={13} /><code className="aul-code">{u.referralCode || 'N/A'}</code></div>
                        <div className="aul-line" style={{ marginTop: 6 }}>
                          <Pill tone={referralLevel.tone}><b>{u.referralCount || 0}</b><Ico kind={referralLevel.icon} tone="plain" size={12} />{referralLevel.level}</Pill>
                          {isTop && <Pill tone="purple"><Ico kind="flame" tone="plain" size={12} />Top</Pill>}
                        </div>
                      </td>
                      <td>
                        <Pill tone={verified ? "green" : "orange"} dot>{verified ? "Verified" : "Pending"}</Pill>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {u.logo ? (
                          <img
                            src={u.logo}
                            alt="Logo"
                            className="aul-logo"
                            onError={(e) => { e.target.replaceWith(document.createTextNode('–')); }}
                          />
                        ) : (
                          <span className="aul-sub">–</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Pill tone={getRoleColor(u.role)}>{getRoleIcon(u.role)}{isMobile ? "" : u.role}</Pill>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="aul-actions">
                          <IconButton
                            icon="eye"
                            label="View Full Profile"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewUserDetails(u._id);
                            }}
                          />
                          <button
                            type="button"
                            className={`k-icon-btn sm ${verified ? "danger" : "success"}`}
                            onClick={(e) => toggleVerification(u._id, e)}
                            disabled={togglingId === u._id}
                            title={verified ? "Revoke Access" : "Approve User"}
                            aria-label={verified ? "Revoke Access" : "Approve User"}
                          >
                            {togglingId === u._id ? <Spinner size="sm" /> : <Ico kind={verified ? "xCircle" : "check"} tone="plain" size={15} />}
                          </button>
                          <IconButton
                            icon="chevronRight"
                            label="View Details"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserModal(u);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
        {currentUsers.length === 0 && (
          <EmptyState icon="users" tone="sand" title="No users found" text={searchTerm ? "Try adjusting your search" : `No ${role} users registered yet`} />
        )}

        {/* pagination */}
        {filteredAndSortedUsers.length > itemsPerPage && (
          <div className="k-pager">
            <span>Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length}</span>
            <div className="k-pager-btns">
              <button type="button" className="k-page-btn" onClick={goToFirstPage} disabled={currentPage === 1} title="First Page" aria-label="First Page"><Ico kind="chevronLeft" tone="plain" size={14} /><Ico kind="chevronLeft" tone="plain" size={14} /></button>
              <button type="button" className="k-page-btn" onClick={goToPrevPage} disabled={currentPage === 1} title="Previous Page" aria-label="Previous Page"><Ico kind="chevronLeft" tone="plain" size={16} /></button>
              {getPageNumbers().map((page) => (
                <button type="button" key={page} className="k-page-btn" onClick={() => goToPage(page)} aria-current={page === currentPage ? "page" : undefined}>{page}</button>
              ))}
              <button type="button" className="k-page-btn" onClick={goToNextPage} disabled={currentPage === totalPages} title="Next Page" aria-label="Next Page"><Ico kind="chevronRight" tone="plain" size={16} /></button>
              <button type="button" className="k-page-btn" onClick={goToLastPage} disabled={currentPage === totalPages} title="Last Page" aria-label="Last Page"><Ico kind="chevronRight" tone="plain" size={14} /><Ico kind="chevronRight" tone="plain" size={14} /></button>
            </div>
            {!isMobile && <span>{itemsPerPage} per page</span>}
          </div>
        )}
      </div>

      {/* user details */}
      <Modal
        open={showModal && !!selectedUser}
        onClose={closeModal}
        size="lg"
        title={selectedUser?.name}
        sub={selectedUser ? `${selectedUser.role} • ${selectedUser.email}` : undefined}
        footer={<>
          <Button variant="secondary" onClick={closeModal}>Close</Button>
          <Button iconRight="chevronRight" onClick={() => viewUserDetails(selectedUser._id)}>View Full Profile</Button>
        </>}
      >
        {selectedUser && (
          <div ref={modalRef} className="aul-modal">
            <div ref={modalBodyRef} />
            {loadingDetails ? (
              <PageLoading label="Loading user details..." minHeight={220} />
            ) : (
              <>
                <div className="aul-who">
                  <span className="aul-avatar lg">
                    {selectedUser.logo ? (
                      <img
                        src={selectedUser.logo}
                        alt="Logo"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = selectedUser.name?.charAt(0).toUpperCase() || 'U';
                        }}
                      />
                    ) : (
                      selectedUser.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </span>
                  <div className="aul-quick">
                    <div><b>{selectedUser.referralCount || 0}</b><span>Referrals</span></div>
                    <div><Pill tone={selectedUser.status === 'Verified' ? 'green' : 'orange'} dot>{selectedUser.status}</Pill><span>Status</span></div>
                    <div><b>{selectedUser.isVip ? <Ico kind="star" tone="yellow" size={26} /> : '–'}</b><span>VIP</span></div>
                    <div><b>{selectedUser.role}</b><span>Role</span></div>
                  </div>
                </div>

                <div className="aul-grid">
                  <Card title="Personal Information" icon="user" tone="blue">
                    <Facts rows={[
                      ["Full Name", selectedUser.name],
                      ["Email", selectedUser.email],
                      ["Phone", selectedUser.phone || 'N/A'],
                      ["Address", selectedUser.address || 'N/A'],
                      ["Location", selectedUser.location || 'N/A'],
                      ...(selectedUser.logo ? [["Logo", <img key="logo" src={selectedUser.logo} alt="Logo" className="aul-logo lg" onError={(e) => { e.target.style.display = 'none'; }} />]] : []),
                    ]} />
                  </Card>

                  {(selectedUser.role === "brand" || selectedUser.role === "employee") && (
                    <Card title="Company Details" icon="store" tone="purple">
                      <Facts rows={[
                        ["Name", selectedUser.brandName || selectedUser.companyName || 'N/A'],
                        ...(selectedUser.role === "brand" && selectedUser.category ? [["Category", selectedUser.category]] : []),
                        ["Role", <Pill key="role" tone={getRoleColor(selectedUser.role)}>{getRoleIcon(selectedUser.role)}{selectedUser.role}</Pill>],
                      ]} />
                    </Card>
                  )}

                  {selectedUser.role === "student" && (
                    <Card title="Academic Information" icon="grad" tone="blue">
                      <Facts rows={[
                        ["University", selectedUser.university?.name || 'N/A'],
                        ["Roll No", selectedUser.rollNo || 'N/A'],
                        ["Alumni", selectedUser.isAlumni ? 'Yes' : 'No'],
                      ]} />
                    </Card>
                  )}

                  <Card title="Referral Information" icon="link" tone="orange">
                    <Facts rows={[
                      ["Referral Code", <code key="code" className="aul-code">{selectedUser.referralCode || 'N/A'}</code>],
                      ["Referral Count", <span key="count" className="aul-line" style={{ justifyContent: "flex-end" }}>{selectedUser.referralCount || 0}{selectedUser.referralCount >= 10 && <Ico kind="flame" tone="red" size={22} />}</span>],
                      ["Referral Level", <Pill key="level" tone={getReferralLevel(selectedUser.referralCount).tone}><Ico kind={getReferralLevel(selectedUser.referralCount).icon} tone="plain" size={12} />{getReferralLevel(selectedUser.referralCount).level}</Pill>],
                      ["Referred By", selectedUser.referredBy?.name || 'None'],
                    ]} />
                  </Card>

                  {selectedUser.role === "brand" && (
                    <Card title="Revenue & Redemptions" icon="chart" tone="green" style={{ gridColumn: "1 / -1" }}>
                      <div className="k-stats aul-rev">
                        <StatCard label="Total Revenue" value={`₨ ${(userDetails.stats?.totalRevenue || 0).toLocaleString()}`} sub={`From ${userDetails.stats?.totalRedemptions || 0} redemptions`} icon="chart" tone="green" onClick={openRedemptionsModal} />
                        <StatCard label="Total Saved" value={`₨ ${(userDetails.stats?.totalSaved || 0).toLocaleString()}`} sub="By students" icon="gift" tone="yellow" />
                        <StatCard label="Students" value={userDetails.stats?.uniqueStudents || 0} sub="Unique redeemers" icon="users" tone="blue" />
                        <StatCard label="Online / Store" value={`${userDetails.stats?.onlineCount || 0} / ${userDetails.stats?.inStoreCount || 0}`} sub="Redemptions" icon="store" tone="purple" />
                      </div>
                      <p className="aul-hint">Click on "Total Revenue" to see all students who redeemed</p>
                    </Card>
                  )}

                  {selectedUser.role === "brand" && userDetails.offers && userDetails.offers.length > 0 && (
                    <Card title={`Brand Offers (${userDetails.offers.length})`} icon="gift" tone="yellow" style={{ gridColumn: "1 / -1" }}>
                      <div className="aul-list">
                        {userDetails.offers.slice(0, listLimit).map((offer, i) => (
                          <div key={i} className="aul-item">
                            <div className="aul-item-main">
                              <b>{offer.title}</b>
                              <span className="aul-ok">{offer.discountPercentage}% off</span>
                              <span className="aul-sub">{offer.claimedBy?.length || 0} claims</span>
                            </div>
                            <div className="aul-item-side">
                              {offerType(offer, false)}
                              <Button
                                size="sm"
                                variant="secondary"
                                icon="qr"
                                loading={generatingQR && selectedOfferForQR?._id === offer._id}
                                disabled={generatingQR}
                                onClick={(e) => generateQRForOffer(offer, selectedUser, e)}
                                title="Generate QR Code for this offer"
                              >
                                QR
                              </Button>
                            </div>
                          </div>
                        ))}
                        {userDetails.offers.length > listLimit && <div className="aul-more">+{userDetails.offers.length - listLimit} more</div>}
                      </div>
                    </Card>
                  )}

                  {selectedUser.role === "employee" && userDetails.jobs && userDetails.jobs.length > 0 && (
                    <Card title={`Jobs Posted (${userDetails.jobs.length})`} icon="briefcase" tone="green" style={{ gridColumn: "1 / -1" }}>
                      <div className="aul-list">
                        {userDetails.jobs.slice(0, listLimit).map((job, i) => (
                          <div key={i} className="aul-item">
                            <b>{job.title}</b>
                            <Pill tone={job.active ? "green" : "red"} dot>{job.active ? 'Active' : 'Inactive'}</Pill>
                            <span className="aul-sub">{job.totalApplications || 0} applications</span>
                          </div>
                        ))}
                        {userDetails.jobs.length > listLimit && <div className="aul-more">+{userDetails.jobs.length - listLimit} more</div>}
                      </div>
                    </Card>
                  )}

                  {selectedUser.role === "student" && userDetails.claimedOffers && userDetails.claimedOffers.length > 0 && (
                    <Card title={`Claimed Discounts (${userDetails.claimedOffers.length})`} icon="ticket" tone="pink" style={{ gridColumn: "1 / -1" }}>
                      <div className="aul-list">
                        {userDetails.claimedOffers.slice(0, listLimit).map((offer, i) => (
                          <div key={i} className="aul-item">
                            <b>{offer.title}</b>
                            <span className="aul-sub">{offer.brand?.name || 'Brand'}</span>
                            <span className="aul-ok">{offer.discountPercentage}% off</span>
                          </div>
                        ))}
                        {userDetails.claimedOffers.length > listLimit && <div className="aul-more">+{userDetails.claimedOffers.length - listLimit} more</div>}
                      </div>
                    </Card>
                  )}

                  {selectedUser.role === "student" && userDetails.applications && userDetails.applications.length > 0 && (
                    <Card title={`Job Applications (${userDetails.applications.length})`} icon="file" tone="blue" style={{ gridColumn: "1 / -1" }}>
                      <div className="aul-list">
                        {userDetails.applications.slice(0, listLimit).map((app, i) => (
                          <div key={i} className="aul-item">
                            <b>{app.jobId?.title || 'Job'}</b>
                            <Pill tone={APP_TONE[app.status] || "sand"}>{app.status || 'Pending'}</Pill>
                          </div>
                        ))}
                        {userDetails.applications.length > listLimit && <div className="aul-more">+{userDetails.applications.length - listLimit} more</div>}
                      </div>
                    </Card>
                  )}

                  <Card title="Timestamps" icon="calendar" tone="sand" style={{ gridColumn: "1 / -1" }}>
                    <Facts rows={[
                      ["Joined", new Date(selectedUser.createdAt).toLocaleString()],
                      ["Last Updated", new Date(selectedUser.updatedAt).toLocaleString()],
                    ]} />
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* offer QR code */}
      <Modal
        open={showQRModal && !!qrImage && !!selectedOfferForQR}
        onClose={closeQRModal}
        icon="qr"
        tone="yellow"
        title={`QR Code - ${selectedUser?.brandName || 'Brand'}`}
        sub={selectedOfferForQR ? `${selectedOfferForQR.title} • ${selectedOfferForQR.discountPercentage}% OFF` : undefined}
        footer={<>
          <Button variant="secondary" icon="copy" onClick={copyQRData}>{copied ? 'Copied!' : 'Copy Data'}</Button>
          <Button variant="secondary" icon="share" onClick={shareQR}>Share</Button>
          <Button icon="download" onClick={downloadQR}>Download</Button>
        </>}
      >
        {selectedOfferForQR && (
          <>
            <div className="aul-qr"><img src={qrImage} alt="QR Code" /></div>
            <div className="k-card pad" style={{ padding: "6px 18px" }}>
              <Facts rows={[
                ["Brand", selectedUser?.brandName || selectedUser?.name || 'Brand'],
                ["Offer", selectedOfferForQR.title],
                ["Discount", <b key="d">{selectedOfferForQR.discountPercentage}% OFF</b>],
                ["Type", offerType(selectedOfferForQR, true)],
                ...(selectedOfferForQR.promoCode ? [["Promo Code", <code key="p" className="aul-code">{selectedOfferForQR.promoCode}</code>]] : []),
              ]} />
            </div>
            <div className="k-note">
              <b>Students can scan this QR code to claim this discount</b>
              <div className="aul-sub">The QR code contains all necessary information for verification</div>
            </div>
          </>
        )}
      </Modal>

      {/* brand redemptions */}
      <Modal
        open={showRedemptionsModal && !!selectedUser}
        onClose={closeRedemptionsModal}
        size="xl"
        icon="chart"
        tone="green"
        title="Revenue Details"
        sub={selectedUser ? `${selectedUser.brandName || selectedUser.name} • All students who redeemed` : undefined}
        footer={<>
          <span className="aul-sub" style={{ marginRight: "auto", alignSelf: "center" }}>
            Showing <b>{filteredRedemptions.length}</b> of <b>{brandRedemptions.length}</b> redemptions
          </span>
          <Button onClick={closeRedemptionsModal}>Close</Button>
        </>}
      >
        <div className="k-stats">
          <StatCard label="Net revenue" value={`₨ ${(brandRedemptionStats.totalRevenue || 0).toLocaleString()}`} icon="chart" tone="green" />
          <StatCard label="Total bills" value={`₨ ${(brandRedemptionStats.totalBill || 0).toLocaleString()}`} icon="receipt" tone="blue" />
          <StatCard label="Student saved" value={`₨ ${(brandRedemptionStats.totalSaved || 0).toLocaleString()}`} icon="gift" tone="yellow" />
          <StatCard label="Students" value={brandRedemptionStats.uniqueStudents || 0} icon="users" tone="purple" />
        </div>
        <div className="k-toolbar">
          <SearchInput
            className="k-grow"
            placeholder="Search by name, roll no, promo code..."
            aria-label="search redemptions"
            value={redemptionSearchTerm}
            onChange={(e) => setRedemptionSearchTerm(e.target.value)}
          />
          <Segmented
            label="redemption type"
            value={redemptionFilter}
            onChange={setRedemptionFilter}
            options={[{ value: 'all', label: 'All' }, { value: 'qr', label: 'In-Store' }, { value: 'promo', label: 'Online' }]}
          />
        </div>
        {loadingRedemptions ? (
          <PageLoading label="Loading redemptions..." minHeight={200} />
        ) : filteredRedemptions.length === 0 ? (
          <EmptyState icon="coin" tone="sand" title="No redemptions found" text={redemptionSearchTerm ? 'Try a different search' : 'No students have redeemed yet'} />
        ) : (
          <div className="k-table-card">
            <div className="k-table-scroll">
              <table className="k-table" style={{ minWidth: 720 }}>
                <thead>
                  <tr><th>#</th><th>student</th><th>type</th><th>bill</th><th>saved</th><th>paid</th><th>date</th></tr>
                </thead>
                <tbody>
                  {filteredRedemptions.map((r, i) => {
                    const [ptone, plabel] = PLATFORM[r.platform] || ["purple", "Online"];
                    return (
                      <tr key={i}>
                        <td className="aul-sub">{i + 1}</td>
                        <td>
                          <div className="aul-name">{r.rollNo !== 'N/A' ? r.rollNo : r.studentName}</div>
                          <div className="aul-sub">
                            {r.studentName}
                            {r.university && r.university !== 'N/A' && ` • ${r.university}`}
                          </div>
                          {r.email && <div className="aul-sub">{r.email}</div>}
                        </td>
                        <td>
                          {r.redemptionType === 'promo' ? (
                            <div>
                              <Pill tone={ptone}><Ico kind="globe" tone="plain" size={12} />{plabel}</Pill>
                              {r.promoCode && <div><code className="aul-code">{r.promoCode}</code></div>}
                            </div>
                          ) : (
                            <Pill tone="yellow"><Ico kind="store" tone="plain" size={12} />In-Store</Pill>
                          )}
                          <div className="aul-sub aul-ellipsis">{r.offerTitle}</div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>₨ {(r.bill || 0).toLocaleString()}</td>
                        <td><Pill tone="green">₨ {(r.saved || 0).toLocaleString()}</Pill></td>
                        <td className="aul-ok" style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>₨ {(r.paid || 0).toLocaleString()}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div>
                            {new Date(r.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="aul-sub">
                            {new Date(r.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
