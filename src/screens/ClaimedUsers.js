// Claimed students (inside redemptions, design/portal/BrRedemptions): students who claimed your discount.
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import Ico, { TONES } from "../portal/Ico";
import { Button, Field, Select, SearchInput, StatCard, Modal, EmptyState, PageLoading, Pill, Facts } from "../portal/kit";
import RedemptionTabs from "./RedemptionTabs";
import "./styles/BrandPortal.css";

// wa.me wants the number with country code and digits only: 0300... -> 92300..., 92... stays as it is
const waNumber = (phone) => {
  const d = String(phone || "").replace(/\D/g, "");
  return d.startsWith("92") ? d : `92${d.replace(/^0/, "")}`;
};

const ClaimedUsers = () => {
  const { token } = useContext(AuthContext);
  const [claimedUsers, setClaimedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortField, setSortField] = useState("claimedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filterUniversity, setFilterUniversity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [universities, setUniversities] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    universities: 0,
    newThisWeek: 0,
    avgDiscount: 0
  });

  useEffect(() => {
    fetchClaimedUsers();
  }, [token]);

  useEffect(() => {
    let results = claimedUsers.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.rollNo?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.universityName?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.offerTitle?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
    
    if (filterUniversity) {
      results = results.filter(user => user.universityName === filterUniversity);
    }
    
    if (filterStatus) {
      const now = new Date();
      results = results.filter(user => {
        const days = Math.floor((now - new Date(user.claimedAt)) / (1000 * 60 * 60 * 24));
        if (filterStatus === "new") return days <= 7;
        if (filterStatus === "active") return days > 7 && days <= 30;
        if (filterStatus === "old") return days > 30;
        return true;
      });
    }
    
    results = sortUsers(results);
    setFilteredUsers(results);
  }, [searchTerm, claimedUsers, sortField, sortDirection, filterUniversity, filterStatus]);

  const sortUsers = (users) => {
    return [...users].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "claimedAt" || sortField === "redemptionsCount") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      
      if (sortField === "claimedAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const fetchClaimedUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/offers/claimed-users",{ 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const usersWithUni = res.data.map(user => ({
        ...user,
        universityName: user.universityName || user.university?.name || "N/A"
      }));
      
      setClaimedUsers(usersWithUni);
      setFilteredUsers(usersWithUni);
      
      const uniSet = new Set(usersWithUni.map(u => u.universityName).filter(Boolean));
      setUniversities([...uniSet]);
      
      const now = new Date();
      const newThisWeek = usersWithUni.filter(u => {
        const days = Math.floor((now - new Date(u.claimedAt)) / (1000 * 60 * 60 * 24));
        return days <= 7;
      }).length;
      
      const avgDiscount = usersWithUni.length > 0 
        ? usersWithUni.reduce((sum, u) => sum + (u.discountPercentage || 0), 0) / usersWithUni.length 
        : 0;
      
      setStats({
        total: usersWithUni.length,
        universities: uniSet.size,
        newThisWeek: newThisWeek,
        avgDiscount: Math.round(avgDiscount)
      });
    } catch (err) {
      console.error("Error fetching claimed users", err);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const downloadCSV = () => {
    const headers = ["Student Name", "Roll No", "University", "Email", "Phone", "Offer Title", "Discount", "Redeemed Count", "Date Claimed", "Status"];
    const rows = filteredUsers.map(u => {
      const status = getStatusInfo(u.claimedAt);
      return [
        u.name || "N/A",
        u.rollNo || "N/A",
        u.universityName || "N/A",
        u.email || "N/A",
        u.phone || "N/A",
        u.offerTitle || "N/A",
        `${u.discountPercentage || 0}%`,
        u.redemptionsCount || 0,
        new Date(u.claimedAt).toLocaleDateString(),
        status.label
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(v => `"${v}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Claimed_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUniversityColor = (uni) => {
    if (!uni) return 'sand';
    const colors = ['orange', 'green', 'blue', 'purple', 'pink', 'sky', 'yellow', 'red', 'coral', 'ink'];
    const index = uni.length % colors.length;
    return colors[index];
  };

  const getStatusInfo = (date) => {
    if (!date) return { tone: 'sand', label: 'Unknown' };
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days <= 7) return { tone: 'green', label: 'New' };
    if (days <= 30) return { tone: 'yellow', label: 'Active' };
    return { tone: 'sand', label: 'Old' };
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setShowActionMenu(null);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const toggleActionMenu = (userId) => {
    setShowActionMenu(showActionMenu === userId ? null : userId);
  };

  const handleAction = (action, user) => {
    setShowActionMenu(null);
    switch(action) {
      case 'view':
        openUserDetails(user);
        break;
      case 'email':
        window.location.href = `mailto:${user.email}`;
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${waNumber(user.phone)}`, '_blank');
        break;
      case 'print':
        window.print();
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: `Student: ${user.name}`,
            text: `Check out this student: ${user.name} from ${user.universityName}`,
            url: window.location.href,
          });
        }
        break;
      default:
        break;
    }
  };

  const Avatar = ({ name, uni, big }) => {
    const [bg, fg] = TONES[getUniversityColor(uni)] || TONES.sand;
    return <div className={"cu-avatar" + (big ? " big" : "")} style={{ background: bg, color: fg }}>{getInitials(name)}</div>;
  };

  const sortTh = (field, label) => (
    <th aria-sort={sortField === field ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
      <button type="button" className="k-th-sort" onClick={() => handleSort(field)}>
        {label} {sortField === field && <Ico kind={sortDirection === "asc" ? "chevronUp" : "chevronDown"} tone="plain" size={14} />}
      </button>
    </th>
  );

  const clearAll = () => { setFilterUniversity(""); setFilterStatus(""); setSearchTerm(""); };

  return (
    <div className="tdcp k-page" data-screen="brand-claimed">
      <div className="k-head">
        <div className="br-title">
          <Ico kind="receipt" tone="blue" size={56} />
          <div>
            <h1>redemptions<span className="dot" aria-hidden="true">.</span></h1>
            <p>Track and manage students who claimed your brand offers</p>
          </div>
        </div>
        <div className="k-actions">
          <Button icon="download" onClick={downloadCSV} disabled={filteredUsers.length === 0}>Export CSV</Button>
        </div>
      </div>

      <RedemptionTabs />

      {loading ? (
        <PageLoading label="Loading student records..." minHeight={300} />
      ) : (
        <>
          <div className="k-stats">
            <StatCard label="Total Leads" value={stats.total} sub={`${stats.newThisWeek} new this week`} icon="grad" tone="orange" />
            <StatCard label="Universities" value={stats.universities} sub={`Across ${stats.total} students`} icon="hat" tone="blue" />
            <StatCard label="Avg Discount" value={`${stats.avgDiscount}%`} sub="Average offer discount" icon="chart" tone="green" />
            <StatCard label="Showing" value={filteredUsers.length} sub="Showing results" icon="filter" tone="yellow" />
          </div>

          <div className="k-toolbar">
            <SearchInput className="k-grow" aria-label="search students" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Button variant={showFilters ? "primary" : "secondary"} icon="filter" onClick={() => setShowFilters(!showFilters)}>Filters</Button>
          </div>

          {showFilters && (
            <div className="k-card cu-filters">
              <Field label="University" htmlFor="cu-uni">
                <Select id="cu-uni" value={filterUniversity} onChange={(e) => setFilterUniversity(e.target.value)}>
                  <option value="">All Universities</option>
                  {universities.map(uni => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Status" htmlFor="cu-status">
                <Select id="cu-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="new">New (0-7 days)</option>
                  <option value="active">Active (8-30 days)</option>
                  <option value="old">Old (30+ days)</option>
                </Select>
              </Field>
              <Button variant="ghost" onClick={clearAll}>Clear All Filters</Button>
            </div>
          )}

          <div className="k-table-card">
            <div className="k-table-scroll">
              <table className="k-table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    {sortTh("name", "Student")}
                    {sortTh("offerTitle", "Offer")}
                    {sortTh("discountPercentage", "Discount")}
                    {sortTh("redemptionsCount", "Uses")}
                    {sortTh("claimedAt", "Date")}
                    <th>Status</th>
                  </tr>
                </thead>
                {filteredUsers.length > 0 && (
                  <tbody>
                    {filteredUsers.map((item, index) => {
                      const status = getStatusInfo(item.claimedAt);
                      return (
                        <tr key={item._id || index} className="clickable" onClick={() => handleAction('view', item)}>
                          <td>
                            <div className="cu-student">
                              <Avatar name={item.name} uni={item.universityName} />
                              <div className="vr-cell">
                                <b>{item.name || "Unknown"}</b>
                                <span className="k-muted">{item.universityName}</span>
                              </div>
                            </div>
                          </td>
                          <td>{item.offerTitle || "N/A"}</td>
                          <td><Pill tone="yellow">{item.discountPercentage || 0}% off</Pill></td>
                          <td>{item.redemptionsCount || 0} ×</td>
                          <td className="br-nowrap">{formatDate(item.claimedAt)}</td>
                          <td><Pill tone={status.tone} dot>{status.label}</Pill></td>
                        </tr>
                      );
                    })}
                  </tbody>
                )}
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <EmptyState icon="users" tone="blue" title="No matching records found" text="Try adjusting your search criteria or filters" />
            )}
          </div>

          <div className="br-foot">
            <span>
              Showing {filteredUsers.length} of {claimedUsers.length} leads
              {filterUniversity && ` · Filtered by: ${filterUniversity}`}
              {filterStatus && ` · Status: ${filterStatus}`}
              {searchTerm && ` · Search: "${searchTerm}"`}
            </span>
            <Button variant="ghost" size="sm" iconRight="chevronRight" onClick={clearAll}>View All</Button>
          </div>
        </>
      )}

      <Modal
        open={showUserModal && !!selectedUser}
        onClose={closeUserModal}
        title={selectedUser?.name || "Unknown"}
        sub={`Roll No: ${selectedUser?.rollNo || "N/A"}`}
        footer={selectedUser && <>
          <Button variant="secondary" icon="mail" onClick={() => handleAction('email', selectedUser)}>email</Button>
          <Button variant="secondary" icon="phone" onClick={() => handleAction('whatsapp', selectedUser)}>whatsapp</Button>
          <Button variant="secondary" icon="file" onClick={() => handleAction('print', selectedUser)}>print</Button>
        </>}
      >
        {selectedUser && (
          <div className="bo-form">
            <div className="cu-student">
              <Avatar name={selectedUser.name} uni={selectedUser.universityName} big />
              <Pill tone={getStatusInfo(selectedUser.claimedAt).tone} dot>{getStatusInfo(selectedUser.claimedAt).label}</Pill>
            </div>
            <Facts rows={[
              ["University", selectedUser.universityName || "N/A"],
              ["Email", selectedUser.email || "N/A"],
              ["Offer", selectedUser.offerTitle || "N/A"],
              ["Discount", `${selectedUser.discountPercentage || 0}% OFF`],
              ["Redemptions", `${selectedUser.redemptionsCount || 0} times`],
              ["Claimed Date", `${formatDate(selectedUser.claimedAt)} at ${formatTime(selectedUser.claimedAt)}`],
              ["Total Saved", `Rs. ${selectedUser.totalSaved?.toLocaleString() || 0}`],
            ]} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClaimedUsers;
