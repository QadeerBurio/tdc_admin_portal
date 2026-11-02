// AdminUserList.js: all students / brands / employers / travelers (design/portal/AdStudents, AdBrands, AdEmployers, AdTravelers),
// quick view, brand offer QR codes and redemptions.
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import Ico from "../portal/Ico";
import { TOKEN } from "../portal/tokens";
import { PageLoading, PageHeader, Button, IconButton, Spinner, StatCard, SearchInput, Segmented, Modal, EmptyState, Pill, Card, Facts, toast } from "../portal/kit";
import DeleteAccountDialog from "../portal/DeleteAccountDialog";
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
  // permanent delete (students only here; brands are deleted from Brand Approvals)
  const [deleteId, setDeleteId] = useState(null);
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
                          {u.role === "student" && (
                            <IconButton
                              icon="trash"
                              label={`Delete ${u.name || "student"}`}
                              size="sm"
                              variant="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(u._id);
                              }}
                            />
                          )}
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

<<<<<<< HEAD
                  {(selectedUser.role === "brand" || selectedUser.role === "employee") && (
                    <Card title="Company Details" icon="store" tone="purple">
                      <Facts rows={[
                        ["Name", selectedUser.brandName || selectedUser.companyName || 'N/A'],
                        ...(selectedUser.role === "brand" && selectedUser.category ? [["Category", selectedUser.category]] : []),
                        ["Role", <Pill key="role" tone={getRoleColor(selectedUser.role)}>{getRoleIcon(selectedUser.role)}{selectedUser.role}</Pill>],
                      ]} />
                    </Card>
=======
                    <div style={{
                      ...styles.modalGrid,
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      gap: isMobile ? "10px" : "16px",
                    }}>
                      {/* Personal Information */}
                      <div style={styles.modalSection}>
                        <h4 style={{
                          ...styles.modalSectionTitle,
                          fontSize: isMobile ? "11px" : "12px",
                        }}>
                          <User size={isMobile ? 12 : 14} /> Personal Information
                        </h4>
                        <div style={styles.modalDetails}>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Full Name</span>
                            <span style={styles.modalDetailValue}>{selectedUser.name}</span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Email</span>
                            <span style={styles.modalDetailValue}>{selectedUser.email}</span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Phone</span>
                            <span style={styles.modalDetailValue}>{selectedUser.phone || 'N/A'}</span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Address</span>
                            <span style={styles.modalDetailValue}>{selectedUser.address || 'N/A'}</span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Location</span>
                            <span style={styles.modalDetailValue}>{selectedUser.location || 'N/A'}</span>
                          </div>
                          {selectedUser.logo && (
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Logo</span>
                              <img
                                src={selectedUser.logo}
                                alt="Logo"
                                style={{
                                  ...styles.modalLogoPreview,
                                  width: isMobile ? "40px" : "60px",
                                  height: isMobile ? "40px" : "60px",
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Brand/Employee Company Details */}
                      {(selectedUser.role === "brand" || selectedUser.role === "employee") && (
                        <div style={styles.modalSection}>
                          <h4 style={{
                            ...styles.modalSectionTitle,
                            fontSize: isMobile ? "11px" : "12px",
                          }}>
                            <Store size={isMobile ? 12 : 14} /> Company Details
                          </h4>
                          <div style={styles.modalDetails}>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Name</span>
                              <span style={styles.modalDetailValue}>
                                {selectedUser.brandName || selectedUser.companyName || 'N/A'}
                              </span>
                            </div>
                            {selectedUser.role === "brand" && selectedUser.category && (
                              <div style={styles.modalDetailRow}>
                                <span style={styles.modalDetailLabel}>Category</span>
                                <span style={styles.modalDetailValue}>{selectedUser.category}</span>
                              </div>
                            )}
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Role</span>
                              <span style={styles.modalDetailValue}>
                                <span style={{
                                  ...styles.modalRoleBadge,
                                  background: `${getRoleColor(selectedUser.role)}15`,
                                  color: getRoleColor(selectedUser.role),
                                  fontSize: isMobile ? "10px" : "11px",
                                }}>
                                  {getRoleIcon(selectedUser.role)}
                                  {selectedUser.role}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Student Academic Info */}
                      {selectedUser.role === "student" && (
                        <div style={styles.modalSection}>
                          <h4 style={{
                            ...styles.modalSectionTitle,
                            fontSize: isMobile ? "11px" : "12px",
                          }}>
                            <GraduationCap size={isMobile ? 12 : 14} /> Academic Information
                          </h4>
                          <div style={styles.modalDetails}>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>University</span>
                              <span style={styles.modalDetailValue}>{selectedUser.university?.name || 'N/A'}</span>
                            </div>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Roll No</span>
                              <span style={styles.modalDetailValue}>{selectedUser.rollNo || 'N/A'}</span>
                            </div>
                            <div style={styles.modalDetailRow}>
                              <span style={styles.modalDetailLabel}>Alumni</span>
                              <span style={styles.modalDetailValue}>{selectedUser.isAlumni ? '✅ Yes' : '❌ No'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Referral Information - ALL ROLES */}
                      <div style={styles.modalSection}>
                        <h4 style={{
                          ...styles.modalSectionTitle,
                          fontSize: isMobile ? "11px" : "12px",
                        }}>
                          <UserPlus size={isMobile ? 12 : 14} /> Referral Information
                        </h4>
                        <div style={styles.modalDetails}>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Referral Code</span>
                            <code style={{
                              ...styles.modalReferralCode,
                              fontSize: isMobile ? "10px" : "12px",
                            }}>{selectedUser.referralCode || 'N/A'}</code>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Referral Count</span>
                            <span style={styles.modalDetailValue}>
                              <span style={{
                                ...styles.modalReferralBadge,
                                fontSize: isMobile ? "11px" : "12px",
                                ...(selectedUser.referralCount >= 10 ? styles.modalTopReferralBadge : {})
                              }}>
                                {selectedUser.referralCount || 0}
                                {selectedUser.referralCount >= 10 && ' 🔥'}
                              </span>
                            </span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Referral Level</span>
                            <span style={styles.modalDetailValue}>
                              <span style={{
                                ...styles.modalLevelBadge,
                                background: getReferralLevel(selectedUser.referralCount).bg,
                                color: getReferralLevel(selectedUser.referralCount).color,
                                fontSize: isMobile ? "10px" : "11px",
                              }}>
                                {getReferralLevel(selectedUser.referralCount).icon} {getReferralLevel(selectedUser.referralCount).level}
                              </span>
                            </span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Referred By</span>
                            <span style={styles.modalDetailValue}>{selectedUser.referredBy?.name || 'None'}</span>
                          </div>
                        </div>
                      </div>

                      {/* ✅ BRAND REVENUE & REDEMPTION STATS - CLICKABLE */}
                      {selectedUser.role === "brand" && (
                        <div style={{ ...styles.modalSection, gridColumn: isMobile ? '1' : 'span 2' }}>
                          <h4 style={{
                            ...styles.modalSectionTitle,
                            fontSize: isMobile ? "11px" : "12px",
                          }}>
                            <BarChart4 size={isMobile ? 12 : 14} /> Revenue & Redemptions
                          </h4>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                            gap: isMobile ? '8px' : '12px',
                            marginTop: '8px'
                          }}>
                            {/* Total Revenue - Clickable */}
                            <motion.div
                              onClick={openRedemptionsModal}
                              style={{
                                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                padding: isMobile ? '10px' : '14px',
                                borderRadius: '12px',
                                border: '1px solid #10b98130',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                              }}
                              whileHover={{ scale: 1.03, boxShadow: '0 4px 12px rgba(16,185,129,0.15)' }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <BarChart4 size={isMobile ? 14 : 16} color="#10b981" />
                                <ArrowUpRight size={isMobile ? 12 : 14} color="#10b981" />
                              </div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px',
                                fontWeight: '700',
                                color: '#059669',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                              }}>
                                Total Revenue
                              </div>
                              <div style={{
                                fontSize: isMobile ? '14px' : '18px',
                                fontWeight: '800',
                                color: '#065f46',
                                wordBreak: 'break-word',
                              }}>
                                ₨ {(userDetails.stats?.totalRevenue || 0).toLocaleString()}
                              </div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px',
                                color: '#047857',
                                fontWeight: '600',
                              }}>
                                From {userDetails.stats?.totalRedemptions || 0} redemptions
                              </div>
                            </motion.div>

                            {/* Total Saved */}
                            <div style={{
                              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                              padding: isMobile ? '10px' : '14px',
                              borderRadius: '12px',
                              border: '1px solid #f59e0b30',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Gift size={isMobile ? 14 : 16} color="#f59e0b" />
                              </div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px',
                                fontWeight: '700',
                                color: '#b45309',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                              }}>
                                Total Saved
                              </div>
                              <div style={{
                                fontSize: isMobile ? '14px' : '18px',
                                fontWeight: '800',
                                color: '#78350f',
                                wordBreak: 'break-word',
                              }}>
                                ₨ {(userDetails.stats?.totalSaved || 0).toLocaleString()}
                              </div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px',
                                color: '#92400e',
                                fontWeight: '600',
                              }}>
                                By students
                              </div>
                            </div>

                            {/* Unique Students */}
                            <div style={{
                              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                              padding: isMobile ? '10px' : '14px',
                              borderRadius: '12px',
                              border: '1px solid #3b82f630',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <UsersIcon size={isMobile ? 14 : 16} color="#3b82f6" />
                              </div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px',
                                fontWeight: '700',
                                color: '#1d4ed8',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                              }}>
                                Students
                              </div>
                              <div style={{
                                fontSize: isMobile ? '14px' : '18px',
                                fontWeight: '800',
                                color: '#1e3a8a',
                              }}>
                                {userDetails.stats?.uniqueStudents || 0}
                              </div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px',
                                color: '#1e40af',
                                fontWeight: '600',
                              }}>
                                Unique redeemers
                              </div>
                            </div>

                            {/* Online / In-Store Split */}
                            <div style={{
                              background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                              padding: isMobile ? '10px' : '14px',
                              borderRadius: '12px',
                              border: '1px solid #8b5cf630',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Store size={isMobile ? 14 : 16} color="#8b5cf6" />
                              </div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px',
                                fontWeight: '700',
                                color: '#6d28d9',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                              }}>
                                Online / Store
                              </div>
                              <div style={{
                                fontSize: isMobile ? '14px' : '18px',
                                fontWeight: '800',
                                color: '#4c1d95',
                              }}>
                                {userDetails.stats?.onlineCount || 0} / {userDetails.stats?.inStoreCount || 0}
                              </div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px',
                                color: '#5b21b6',
                                fontWeight: '600',
                              }}>
                                Redemptions
                              </div>
                            </div>
                          </div>
                          <div style={{
                            marginTop: '8px',
                            fontSize: isMobile ? '9px' : '11px',
                            color: '#64748b',
                            textAlign: 'center',
                            fontStyle: 'italic',
                          }}>
                            💡 Click on "Total Revenue" to see all students who redeemed
                          </div>
                        </div>
                      )}

                      {/* BRAND OFFERS WITH QR GENERATION */}
                      {selectedUser.role === "brand" && userDetails.offers && userDetails.offers.length > 0 && (
                        <div style={{ ...styles.modalSection, gridColumn: isMobile ? '1' : 'span 2' }}>
                          <h4 style={{
                            ...styles.modalSectionTitle,
                            fontSize: isMobile ? "11px" : "12px",
                          }}>
                            <Gift size={isMobile ? 12 : 14} /> Brand Offers ({userDetails.offers.length})
                          </h4>
                          <div style={styles.offerList}>
                            {userDetails.offers.slice(0, isMobile ? 3 : 5).map((offer, i) => (
                              <div key={i} style={{
                                ...styles.offerItem,
                                flexDirection: isMobile ? "column" : "row",
                                alignItems: isMobile ? "flex-start" : "center",
                                gap: isMobile ? "6px" : "0",
                              }}>
                                <div style={styles.offerItemLeft}>
                                  <span style={{
                                    ...styles.offerTitle,
                                    fontSize: isMobile ? "11px" : "12px",
                                  }}>{offer.title}</span>
                                  <span style={{
                                    ...styles.offerDiscount,
                                    fontSize: isMobile ? "10px" : "12px",
                                  }}>{offer.discountPercentage}% off</span>
                                  <span style={{
                                    ...styles.offerStatus,
                                    fontSize: isMobile ? "9px" : "11px",
                                  }}>
                                    {offer.claimedBy?.length || 0} claims
                                  </span>
                                </div>
                                <div style={styles.offerItemRight}>
                                  {offer.isOnline && offer.isInStore && (
                                    <span style={{ ...styles.badgeSmall, background: '#8b5cf6', fontSize: isMobile ? "8px" : "9px" }}>Online & In-Store</span>
                                  )}
                                  {offer.isOnline && !offer.isInStore && (
                                    <span style={{ ...styles.badgeSmall, background: '#3b82f6', fontSize: isMobile ? "8px" : "9px" }}>Online</span>
                                  )}
                                  {!offer.isOnline && offer.isInStore && (
                                    <span style={{ ...styles.badgeSmall, background: '#10b981', fontSize: isMobile ? "8px" : "9px" }}>In-Store</span>
                                  )}
                                  <motion.button
                                    className="qr-generate-btn"
                                    onClick={(e) => generateQRForOffer(offer, selectedUser, e)}
                                    style={{
                                      ...styles.qrGenerateBtn,
                                      padding: isMobile ? "3px 8px" : "4px 10px",
                                      fontSize: isMobile ? "9px" : "11px",
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={generatingQR}
                                    title="Generate QR Code for this offer"
                                  >
                                    {generatingQR && selectedOfferForQR?._id === offer._id ? (
                                      <div style={styles.spinnerSmall}></div>
                                    ) : (
                                      <QrCode size={isMobile ? 12 : 14} />
                                    )}
                                    <span style={styles.qrBtnText}>QR</span>
                                  </motion.button>
                                </div>
                              </div>
                            ))}
                            {userDetails.offers.length > (isMobile ? 3 : 5) && (
                              <div style={styles.moreItems}>+{userDetails.offers.length - (isMobile ? 3 : 5)} more</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Employee Jobs */}
                      {selectedUser.role === "employee" && userDetails.jobs && userDetails.jobs.length > 0 && (
                        <div style={{ ...styles.modalSection, gridColumn: isMobile ? '1' : 'span 2' }}>
                          <h4 style={{
                            ...styles.modalSectionTitle,
                            fontSize: isMobile ? "11px" : "12px",
                          }}>
                            <BriefcaseIcon size={isMobile ? 12 : 14} /> Jobs Posted ({userDetails.jobs.length})
                          </h4>
                          <div style={styles.jobList}>
                            {userDetails.jobs.slice(0, isMobile ? 3 : 5).map((job, i) => (
                              <div key={i} style={{
                                ...styles.jobItem,
                                flexDirection: isMobile ? "column" : "row",
                                alignItems: isMobile ? "flex-start" : "center",
                                gap: isMobile ? "4px" : "0",
                              }}>
                                <span style={{
                                  ...styles.jobTitle,
                                  fontSize: isMobile ? "11px" : "12px",
                                }}>{job.title}</span>
                                <span style={{
                                  ...styles.jobStatus,
                                  fontSize: isMobile ? "9px" : "11px",
                                }}>
                                  {job.active ? '🟢 Active' : '🔴 Inactive'}
                                </span>
                                <span style={{
                                  ...styles.jobApps,
                                  fontSize: isMobile ? "9px" : "11px",
                                }}>
                                  {job.totalApplications || 0} applications
                                </span>
                              </div>
                            ))}
                            {userDetails.jobs.length > (isMobile ? 3 : 5) && (
                              <div style={styles.moreItems}>+{userDetails.jobs.length - (isMobile ? 3 : 5)} more</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Student Discounts & Applications */}
                      {selectedUser.role === "student" && (
                        <>
                          {userDetails.claimedOffers && userDetails.claimedOffers.length > 0 && (
                            <div style={{ ...styles.modalSection, gridColumn: isMobile ? '1' : 'span 2' }}>
                              <h4 style={{
                                ...styles.modalSectionTitle,
                                fontSize: isMobile ? "11px" : "12px",
                              }}>
                                <Ticket size={isMobile ? 12 : 14} /> Claimed Discounts ({userDetails.claimedOffers.length})
                              </h4>
                              <div style={styles.claimedList}>
                                {userDetails.claimedOffers.slice(0, isMobile ? 3 : 5).map((offer, i) => (
                                  <div key={i} style={{
                                    ...styles.claimedItem,
                                    flexDirection: isMobile ? "column" : "row",
                                    alignItems: isMobile ? "flex-start" : "center",
                                    gap: isMobile ? "4px" : "0",
                                  }}>
                                    <span style={{
                                      ...styles.claimedTitle,
                                      fontSize: isMobile ? "11px" : "12px",
                                    }}>{offer.title}</span>
                                    <span style={{
                                      ...styles.claimedBrand,
                                      fontSize: isMobile ? "9px" : "11px",
                                    }}>{offer.brand?.name || 'Brand'}</span>
                                    <span style={{
                                      ...styles.claimedDiscount,
                                      fontSize: isMobile ? "10px" : "12px",
                                    }}>{offer.discountPercentage}% off</span>
                                  </div>
                                ))}
                                {userDetails.claimedOffers.length > (isMobile ? 3 : 5) && (
                                  <div style={styles.moreItems}>+{userDetails.claimedOffers.length - (isMobile ? 3 : 5)} more</div>
                                )}
                              </div>
                            </div>
                          )}

                          {userDetails.applications && userDetails.applications.length > 0 && (
                            <div style={{ ...styles.modalSection, gridColumn: isMobile ? '1' : 'span 2' }}>
                              <h4 style={{
                                ...styles.modalSectionTitle,
                                fontSize: isMobile ? "11px" : "12px",
                              }}>
                                <FileCheck size={isMobile ? 12 : 14} /> Job Applications ({userDetails.applications.length})
                              </h4>
                              <div style={styles.applicationList}>
                                {userDetails.applications.slice(0, isMobile ? 3 : 5).map((app, i) => (
                                  <div key={i} style={{
                                    ...styles.applicationItem,
                                    flexDirection: isMobile ? "column" : "row",
                                    alignItems: isMobile ? "flex-start" : "center",
                                    gap: isMobile ? "4px" : "0",
                                  }}>
                                    <span style={{
                                      ...styles.applicationJob,
                                      fontSize: isMobile ? "11px" : "12px",
                                    }}>{app.jobId?.title || 'Job'}</span>
                                    <span style={{
                                      ...styles.applicationStatus,
                                      background: {
                                        'pending': '#f59e0b20',
                                        'reviewed': '#3b82f620',
                                        'shortlisted': '#10b98120',
                                        'interview': '#8b5cf620',
                                        'rejected': '#ef444420',
                                        'hired': '#05966920'
                                      }[app.status] || '#94a3b820',
                                      color: {
                                        'pending': '#f59e0b',
                                        'reviewed': '#3b82f6',
                                        'shortlisted': '#10b981',
                                        'interview': '#8b5cf6',
                                        'rejected': '#ef4444',
                                        'hired': '#059669'
                                      }[app.status] || '#94a3b8',
                                      fontSize: isMobile ? "9px" : "10px",
                                      padding: isMobile ? "1px 6px" : "2px 8px",
                                    }}>
                                      {app.status || 'Pending'}
                                    </span>
                                  </div>
                                ))}
                                {userDetails.applications.length > (isMobile ? 3 : 5) && (
                                  <div style={styles.moreItems}>+{userDetails.applications.length - (isMobile ? 3 : 5)} more</div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Timestamps */}
                      <div style={{ ...styles.modalSection, gridColumn: isMobile ? '1' : 'span 2' }}>
                        <h4 style={{
                          ...styles.modalSectionTitle,
                          fontSize: isMobile ? "11px" : "12px",
                        }}>
                          <Calendar size={isMobile ? 12 : 14} /> Timestamps
                        </h4>
                        <div style={styles.modalDetails}>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Joined</span>
                            <span style={{
                              ...styles.modalDetailValue,
                              fontSize: isMobile ? "11px" : "12px",
                            }}>
                              {new Date(selectedUser.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div style={styles.modalDetailRow}>
                            <span style={styles.modalDetailLabel}>Last Updated</span>
                            <span style={{
                              ...styles.modalDetailValue,
                              fontSize: isMobile ? "11px" : "12px",
                            }}>
                              {new Date(selectedUser.updatedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                ...styles.modalFooter,
                padding: isMobile ? "12px 16px" : "16px 28px",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? "8px" : "12px",
              }}>
                <motion.button
                  onClick={() => viewUserDetails(selectedUser._id)}
                  style={{
                    ...styles.modalViewBtn,
                    width: isMobile ? "100%" : "auto",
                    justifyContent: "center",
                    padding: isMobile ? "8px 16px" : "8px 20px",
                    fontSize: isMobile ? "12px" : "13px",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Full Profile <ChevronRight size={isMobile ? 14 : 16} />
                </motion.button>
                <motion.button
                  onClick={closeModal}
                  style={{
                    ...styles.modalCloseBtnBottom,
                    width: isMobile ? "100%" : "auto",
                    justifyContent: "center",
                    padding: isMobile ? "8px 16px" : "8px 24px",
                    fontSize: isMobile ? "12px" : "13px",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && qrImage && selectedOfferForQR && (
          <motion.div
            style={styles.qrModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQRModal}
          >
            <motion.div
              style={{
                ...styles.qrModalContent,
                maxWidth: isMobile ? "98%" : "520px",
                borderRadius: isMobile ? "16px" : "28px",
              }}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{
                ...styles.qrModalHeader,
                padding: isMobile ? "14px 16px" : "20px 24px",
              }}>
                <div>
                  <h3 style={{
                    ...styles.qrModalTitle,
                    fontSize: isMobile ? "16px" : "18px",
                  }}>
                    <QrCode size={isMobile ? 16 : 20} style={{ marginRight: '8px', color: '#ff961a' }} />
                    QR Code - {selectedUser?.brandName || 'Brand'}
                  </h3>
                  <p style={{
                    ...styles.qrModalSubtitle,
                    fontSize: isMobile ? "11px" : "13px",
                  }}>
                    {selectedOfferForQR.title} • {selectedOfferForQR.discountPercentage}% OFF
                  </p>
                </div>
                <motion.button
                  onClick={closeQRModal}
                  style={styles.qrModalCloseBtn}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={isMobile ? 16 : 20} />
                </motion.button>
              </div>

              <div style={{
                ...styles.qrModalBody,
                padding: isMobile ? "16px" : "24px",
              }}>
                <div style={styles.qrImageContainer}>
                  <img
                    src={qrImage}
                    alt="QR Code"
                    style={{
                      ...styles.qrModalImage,
                      width: isMobile ? "200px" : "280px",
                      height: isMobile ? "200px" : "280px",
                    }}
                  />
                </div>

                <div style={{
                  ...styles.qrOfferDetails,
                  padding: isMobile ? "12px" : "16px",
                }}>
                  <div style={styles.qrOfferRow}>
                    <span style={styles.qrOfferLabel}>Brand:</span>
                    <span style={{
                      ...styles.qrOfferValue,
                      fontSize: isMobile ? "12px" : "13px",
                    }}>{selectedUser?.brandName || selectedUser?.name || 'Brand'}</span>
                  </div>
                  <div style={styles.qrOfferRow}>
                    <span style={styles.qrOfferLabel}>Offer:</span>
                    <span style={{
                      ...styles.qrOfferValue,
                      fontSize: isMobile ? "12px" : "13px",
                    }}>{selectedOfferForQR.title}</span>
                  </div>
                  <div style={styles.qrOfferRow}>
                    <span style={styles.qrOfferLabel}>Discount:</span>
                    <span style={{
                      ...styles.qrOfferValue,
                      color: '#ff961a',
                      fontWeight: 700,
                      fontSize: isMobile ? "13px" : "14px",
                    }}>
                      {selectedOfferForQR.discountPercentage}% OFF
                    </span>
                  </div>
                  <div style={styles.qrOfferRow}>
                    <span style={styles.qrOfferLabel}>Type:</span>
                    <span style={styles.qrOfferValue}>
                      {selectedOfferForQR.isOnline && selectedOfferForQR.isInStore ? (
                        <span style={{ ...styles.badgeSmall, background: '#8b5cf6', fontSize: isMobile ? "8px" : "9px" }}>Online & In-Store</span>
                      ) : selectedOfferForQR.isOnline ? (
                        <span style={{ ...styles.badgeSmall, background: '#3b82f6', fontSize: isMobile ? "8px" : "9px" }}>Online Only</span>
                      ) : selectedOfferForQR.isInStore ? (
                        <span style={{ ...styles.badgeSmall, background: '#10b981', fontSize: isMobile ? "8px" : "9px" }}>In-Store Only</span>
                      ) : (
                        <span style={{ ...styles.badgeSmall, background: '#94a3b8', fontSize: isMobile ? "8px" : "9px" }}>Standard</span>
                      )}
                    </span>
                  </div>
                  {selectedOfferForQR.promoCode && (
                    <div style={styles.qrOfferRow}>
                      <span style={styles.qrOfferLabel}>Promo Code:</span>
                      <span style={{
                        ...styles.qrOfferValue,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#0369a1',
                        fontSize: isMobile ? "12px" : "13px",
                      }}>
                        {selectedOfferForQR.promoCode}
                      </span>
                    </div>
>>>>>>> fix/remove-show-password
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

      {deleteId && (
        <DeleteAccountDialog
          userId={deleteId}
          onClose={() => setDeleteId(null)}
          onDeleted={() => {
            setUsers((list) => list.filter((x) => x._id !== deleteId));
            setDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
<<<<<<< HEAD
=======

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '0',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    position: 'relative',
    borderRadius: '0',
    overflow: 'hidden',
    width: '100%',
  },
  bgDecoration1: {
    position: 'absolute',
    top: '-100px',
    right: '-50px',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(255,150,26,0.06) 0%, rgba(255,150,26,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  bgDecoration2: {
    position: 'absolute',
    bottom: '-80px',
    left: '-60px',
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, rgba(139,92,246,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  bgDecoration3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(255,150,26,0.02) 0%, rgba(255,150,26,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  container: {
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: 'blur(20px)',
    borderRadius: "20px",
    padding: "10px 10px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    maxWidth: "100%",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ff961a",
    marginBottom: "12px",
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  refreshBtn: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '10px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  title: {
    margin: 0,
    color: "#0a0b0f",
    fontSize: "26px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#6c6f78",
    fontSize: "14px",
    fontWeight: "400",
  },
  downloadBtn: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    color: "#fff",
    border: "none",
    padding: "10px 22px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  },
  statsGrid: {
    display: "grid",
    gap: "10px",
    marginBottom: "20px",
  },
  statCard: {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: 'blur(10px)',
    borderRadius: "14px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    transition: "all 0.3s ease",
  },
  statIcon: {
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontWeight: "700",
    color: "#1e293b",
    lineHeight: 1.2,
  },
  statLabel: {
    color: "#64748b",
    fontWeight: "600",
    marginTop: "2px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  controlsBar: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  searchWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "380px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px 10px 42px",
    fontSize: "14px",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    transition: "all 0.2s ease",
    outline: "none",
    color: "#1e293b",
    fontFamily: "inherit",
  },
  clearSearch: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "50%",
  },
  filterGroupWrapper: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
  },
  filterGroup: {
    display: "flex",
    gap: "4px",
    background: "rgba(241, 245, 249, 0.8)",
    padding: "4px",
    borderRadius: "30px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748b",
    padding: "0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  filterBtn: {
    padding: "5px 12px",
    borderRadius: "24px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  activeFilter: {
    background: "#fff",
    color: "#ff961a",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "16px",
    border: "1px solid rgba(240, 242, 245, 0.8)",
    background: "rgba(255, 255, 255, 0.6)",
    backdropFilter: 'blur(10px)',
    width: '100%',
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },
  theadRow: {
    borderBottom: "1px solid #f0f2f5",
    background: "rgba(250, 251, 252, 0.8)",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  tr: {
    borderBottom: "1px solid #f5f7fa",
    transition: "background 0.2s ease",
  },
  topReferrerRow: {
    background: "linear-gradient(90deg, #faf5ff 0%, #ffffff 100%)",
    borderLeft: "3px solid #8b5cf6",
  },
  td: {
    padding: "12px 16px",
    fontSize: "13px",
    color: "#1e293b",
    verticalAlign: "middle",
  },
  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #ff961a10 0%, #f3b24510 100%)",
    color: "#ff961a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    flexShrink: 0,
    position: "relative",
  },
  topAvatar: {
    background: "linear-gradient(135deg, #8b5cf620 0%, #a78bfa20 100%)",
    color: "#8b5cf6",
    border: "2px solid #8b5cf6",
  },
  crownBadge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    fontSize: "12px",
    animation: "crownFloat 2s ease-in-out infinite",
  },
  userName: {
    fontWeight: "600",
    color: "#1e293b",
    display: "block",
    fontSize: "13px",
  },
  userRole: {
    fontSize: "10px",
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  emailCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#475569",
    fontSize: "12px",
    marginBottom: "2px",
  },
  phoneCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#64748b",
    fontSize: "11px",
  },
  companyTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(241, 245, 249, 0.8)",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "500",
    color: "#475569",
  },
  universityTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(241, 245, 249, 0.8)",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "500",
    color: "#475569",
  },
  rollNoText: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  referralInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  referralCode: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
  },
  referralStats: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  referralBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 10px",
    borderRadius: "16px",
    fontSize: "11px",
    fontWeight: "600",
  },
  referralCountNumber: {
    fontWeight: "700",
    fontSize: "13px",
  },
  referralLevelText: {
    fontSize: "9px",
    opacity: 0.8,
  },
  flameBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "#f5f3ff",
    padding: "2px 8px",
    borderRadius: "10px",
    fontSize: "9px",
    fontWeight: "700",
    color: "#8b5cf6",
    animation: "flamePulse 2s ease-in-out infinite",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  badgeDotVerified: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    display: "inline-block",
  },
  badgeDotPending: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    backgroundColor: "#f59e0b",
    display: "inline-block",
  },
  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
  viewBtn: {
    padding: "6px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "transparent",
  },
  expandBtn: {
    padding: "6px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
    overflowY: 'auto',
  },
  modalContent: {
    background: '#fff',
    borderRadius: '24px',
    maxWidth: '820px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    marginTop: '30px',
    marginBottom: '30px',
  },
  modalHeader: {
    padding: '20px 28px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
    flexShrink: 0,
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  modalAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f9c349 0%, #ff961a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  modalAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  modalCrown: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    fontSize: '16px',
    animation: 'crownFloat 2s ease-in-out infinite',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '2px',
  },
  modalCloseBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
    maxHeight: 'calc(90vh - 180px)',
    WebkitOverflowScrolling: 'touch',
  },
  modalStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '20px',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  modalStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
  },
  modalStatLabel: {
    fontSize: '10px',
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  modalStatDivider: {
    width: '1px',
    height: '30px',
    background: '#e5e7eb',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  modalSection: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #f1f5f9',
  },
  modalSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 10px 0',
    paddingBottom: '8px',
    borderBottom: '1px solid #f1f5f9',
  },
  modalDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modalDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: '12px',
    gap: '8px',
  },
  modalDetailLabel: {
    color: '#64748b',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    minWidth: '80px',
  },
  modalDetailValue: {
    color: '#0f172a',
    textAlign: 'right',
    wordBreak: 'break-word',
    fontWeight: '500',
  },
  modalRoleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalReferralCode: {
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: '600',
    color: '#eab308',
    background: '#fefce8',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  modalReferralBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
    color: '#d97706',
    padding: '2px 10px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '12px',
  },
  modalTopReferralBadge: {
    background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
    color: '#8b5cf6',
  },
  modalLevelBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  modalLogoPreview: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #e5e7eb',
  },
  logoThumb: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #e5e7eb',
  },
  logoIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    color: '#10b981',
    marginTop: '2px',
  },
  offerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  offerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12px',
  },
  offerTitle: {
    fontWeight: '500',
    color: '#0f172a',
  },
  offerDiscount: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  offerStatus: {
    color: '#64748b',
    fontSize: '11px',
  },
  offerItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    flex: 1,
  },
  offerItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  badgeSmall: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '9px',
    fontWeight: '600',
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  qrGenerateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'linear-gradient(135deg, #ff961a 0%, #f3b245 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  qrBtnText: {
    fontSize: '10px',
    fontWeight: '600',
  },
  jobList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  jobItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12px',
  },
  jobTitle: {
    fontWeight: '500',
    color: '#0f172a',
  },
  jobStatus: {
    fontSize: '11px',
  },
  jobApps: {
    color: '#64748b',
    fontSize: '11px',
  },
  claimedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  claimedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12px',
  },
  claimedTitle: {
    fontWeight: '500',
    color: '#0f172a',
  },
  claimedBrand: {
    color: '#64748b',
    fontSize: '11px',
  },
  claimedDiscount: {
    color: '#10b981',
    fontWeight: '600',
  },
  applicationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  applicationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12px',
  },
  applicationJob: {
    fontWeight: '500',
    color: '#0f172a',
  },
  applicationStatus: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
  },
  moreItems: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#94a3b8',
    padding: '4px',
  },
  loadingDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    gap: '12px',
    color: '#64748b',
  },
  spinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid #e2e8f0',
    borderTopColor: '#ff961a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  modalFooter: {
    padding: '16px 28px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  modalViewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modalCloseBtnBottom: {
    padding: '8px 24px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    background: '#fff',
    color: '#475569',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#94a3b8",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px",
  },
  emptySubtext: {
    fontSize: "12px",
    color: "#cbd5e1",
    display: "block",
    marginTop: "6px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px",
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: 'blur(20px)',
    borderRadius: "28px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
    minHeight: "400px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#ff961a",
    borderRadius: "50%",
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "14px",
  },
  loadingBar: {
    width: "200px",
    height: "4px",
    background: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "8px",
  },
  loadingProgress: {
    height: "100%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    borderRadius: "4px",
  },
  qrModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '20px',
  },
  qrModalContent: {
    background: '#fff',
    borderRadius: '28px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 40px 80px -20px rgba(0,0,0,0.4)',
    animation: 'qrModalIn 0.3s ease forwards',
  },
  qrModalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  qrModalSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  qrModalCloseBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  qrModalBody: {
    padding: '24px',
  },
  qrImageContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  qrModalImage: {
    width: '280px',
    height: '280px',
    borderRadius: '16px',
    border: '3px solid #f1f5f9',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  },
  qrOfferDetails: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  qrOfferRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '13px',
  },
  qrOfferLabel: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  qrOfferValue: {
    color: '#0f172a',
    fontWeight: '500',
    textAlign: 'right',
  },
  qrModalActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  qrActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  qrScanInstructions: {
    textAlign: 'center',
    padding: '12px',
    background: '#f0f9ff',
    borderRadius: '12px',
    border: '1px solid #bae6fd',
  },
  qrScanText: {
    margin: 0,
    fontWeight: '500',
    color: '#0369a1',
  },
  qrScanSubtext: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#64748b',
  },
  paginationWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '12px',
    background: 'rgba(255,255,255,0.4)',
    borderRadius: '0 0 16px 16px',
  },
  paginationInfo: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  paginationBtn: {
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    height: '36px',
  },
  paginationNumberBtn: {
    minWidth: '36px',
    height: '36px',
  },
  paginationActive: {
    background: 'linear-gradient(135deg, #ff961a 0%, #f3b245 100%)',
    color: '#fff',
    borderColor: '#ff961a',
  },
  paginationBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  paginationPageSize: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  // ========== BRAND REDEMPTIONS DRILL-DOWN ==========
  redemptionsOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '16px',
  },
  redemptionsModal: {
    background: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '960px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 30px 60px -12px rgba(0,0,0,0.35)',
  },
  redemptionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
  },
  redemptionsTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
  },
  redemptionsSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#64748b',
    fontWeight: 500,
  },
  redemptionStatBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '10px 12px',
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #f1f5f9',
  },
  redemptionTh: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap',
  },
  redemptionTd: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#334155',
    verticalAlign: 'middle',
  },
};
>>>>>>> fix/remove-show-password
