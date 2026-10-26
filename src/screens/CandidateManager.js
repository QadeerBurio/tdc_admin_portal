// Candidates (design/portal/EmpCandidates): review applications and move people forward.
import React, { useState, useEffect } from "react";
import axios from "axios";
import Ico from "../portal/Ico";
import { Button, IconButton, Select, SearchInput, Segmented, Modal, EmptyState, PageLoading, Pill, Checkbox, toast } from "../portal/kit";
import "./styles/EmployerPortal.css";

const STATUSES = ["pending", "reviewed", "shortlisted", "interview", "rejected", "hired"];

const CandidatesManager = ({ token }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [sortBy, setSortBy] = useState("recent");
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/candidates/all",{
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(res.data);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`https://the-deft-crew-production.up.railway.app/api/jobs/application/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCandidates();
    } catch (err) {
      console.error("Error updating status:", err);
      toast("Failed to update status");
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedCandidates.length === 0) {
      toast("Please select candidates first");
      return;
    }
    try {
      await axios.patch("https://the-deft-crew-production.up.railway.app/api/jobs/candidates/bulk-status",
        { candidateIds: selectedCandidates, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast(`${selectedCandidates.length} candidates updated to ${status}`);
      setSelectedCandidates([]);
      setShowBulkActions(false);
      fetchCandidates();
    } catch (err) {
      console.error("Error bulk updating:", err);
      toast("Failed to update candidates");
    }
  };

  const exportCandidates = async () => {
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/candidates/export",{
        headers: { Authorization: `Bearer ${token}` }
      });
      const csvData = convertToCSV(res.data);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates_${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting:", err);
      toast("Failed to export candidates");
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  const viewCandidateDetails = async (id) => {
    try {
      const res = await axios.get(`https://the-deft-crew-production.up.railway.app/api/jobs/candidates/${id}`,{
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCandidate(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching candidate details:", err);
      toast("Failed to load candidate details");
    }
  };

  const toggleSelectCandidate = (id) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c._id));
    }
    setSelectAll(!selectAll);
  };

  const getSortValue = (candidate) => {
    switch (sortBy) {
      case "recent": return new Date(candidate.appliedAt).getTime();
      case "oldest": return -new Date(candidate.appliedAt).getTime();
      case "name": return candidate.fullName;
      case "experience": return candidate.yearsOfExperience;
      default: return new Date(candidate.appliedAt).getTime();
    }
  };

  const filteredCandidates = candidates
    .filter(c =>
      c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.jobId?.title?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(c => statusFilter ? c.status === statusFilter : true)
    .sort((a, b) => {
      const valA = getSortValue(a);
      const valB = getSortValue(b);
      if (sortBy === "name" || sortBy === "experience") {
        return valA > valB ? 1 : -1;
      }
      return valB - valA;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const getStatusConfig = (status) => {
    const configs = {
      pending: { tone: "sand", label: "Pending" },
      reviewed: { tone: "sand", label: "Reviewed" },
      shortlisted: { tone: "yellow", label: "Shortlisted" },
      interview: { tone: "ink", label: "Interview" },
      rejected: { tone: "red", label: "Rejected" },
      hired: { tone: "green", label: "Hired" }
    };
    return configs[status] || configs.pending;
  };

  const getStatusStats = () => {
    const stats = {};
    candidates.forEach(c => {
      stats[c.status] = (stats[c.status] || 0) + 1;
    });
    return stats;
  };

  const totalStats = {
    total: candidates.length,
    ...getStatusStats()
  };

  const statItems = [
    { key: 'total', label: 'Total' },
    { key: 'pending', label: 'Pending' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'interview', label: 'Interview' },
    { key: 'hired', label: 'Hired' },
  ];

  const initial = (n) => String(n?.charAt(0) || "a").toLowerCase();
  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "");

  // one candidate: panel beside the list on wide screens, a modal on narrow ones
  const renderDetail = (c) => (
    <div className="ec-detail">
      <div className="ec-who">
        <span className="ec-avatar" aria-hidden="true">{initial(c.fullName)}</span>
        <div className="ec-who-text">
          <h2>{c.fullName || "Unknown"}</h2>
          <p>applied for {c.jobId?.title || "a role"}{c.appliedAt ? ` · ${fmt(c.appliedAt)}` : ""}</p>
        </div>
        <Pill tone={getStatusConfig(c.status).tone} dot>{getStatusConfig(c.status).label}</Pill>
      </div>
      <div className="ec-facts">
        <div><span>experience</span><b>{c.yearsOfExperience != null ? `${c.yearsOfExperience} years` : "–"}</b></div>
        <div><span>position</span><b>{[c.currentPosition, c.currentCompany].filter(Boolean).join(" at ") || "–"}</b></div>
        <div><span>city</span><b>{c.city || "–"}</b></div>
        <div><span>contact</span><b>{[c.email, c.phone].filter(Boolean).join(" · ") || "–"}</b></div>
      </div>
      {(c.resumeUrl || c.portfolioUrl || c.linkedInUrl || c.githubUrl) && (
        <div className="k-row">
          {c.resumeUrl && <a className="k-btn secondary sm" href={c.resumeUrl} target="_blank" rel="noopener noreferrer"><Ico kind="file" tone="plain" size={16} />CV</a>}
          {c.portfolioUrl && <a className="k-btn secondary sm" href={c.portfolioUrl} target="_blank" rel="noopener noreferrer"><Ico kind="globe" tone="plain" size={16} />portfolio</a>}
          {c.linkedInUrl && <a className="k-btn secondary sm" href={c.linkedInUrl} target="_blank" rel="noopener noreferrer"><Ico kind="link" tone="plain" size={16} />LinkedIn</a>}
          {c.githubUrl && <a className="k-btn secondary sm" href={c.githubUrl} target="_blank" rel="noopener noreferrer"><Ico kind="link" tone="plain" size={16} />GitHub</a>}
        </div>
      )}
      <div>
        <h3 className="ec-h3">cover letter</h3>
        <p className="ec-letter">{c.coverLetter || "No cover letter."}</p>
      </div>
      <div className="ec-moves">
        <h3 className="ec-h3">update status</h3>
        <div className="ec-chips" role="group" aria-label="update status">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={c.status === s}
              onClick={() => {
                updateStatus(c._id, s);
                setSelectedCandidate({ ...c, status: s });
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="tdcp k-page"><PageLoading label="Loading candidates..." /></div>;

  return (
    <div className="tdcp k-page" data-screen="employer-candidates">
      <div className="k-head">
        <div className="emp-title">
          <Ico kind="users" tone="blue" size={56} />
          <div>
            <h1>candidates<span className="dot" aria-hidden="true">.</span></h1>
            <p>review applications and move people forward.</p>
          </div>
        </div>
        <div className="k-actions">
          <Button variant={showBulkActions ? "primary" : "secondary"} icon="check" onClick={() => setShowBulkActions(!showBulkActions)}>bulk update</Button>
          <Button variant="secondary" icon="download" onClick={exportCandidates}>export CSV</Button>
          <IconButton icon="refresh" label="refresh" onClick={fetchCandidates} />
        </div>
      </div>

      <Segmented
        label="filter by status"
        value={statusFilter || "all"}
        onChange={(v) => { setStatusFilter(v === "all" ? "" : v); setCurrentPage(1); }}
        options={[{ value: "all", label: "all", count: totalStats.total }, ...statItems.filter((s) => s.key !== "total").map((s) => ({ value: s.key, label: s.label.toLowerCase(), count: totalStats[s.key] || 0 })), { value: "rejected", label: "rejected", count: totalStats.rejected || 0 }]}
      />

      {showBulkActions && (
        <div className="k-card ec-bulk">
          <span><b>{selectedCandidates.length}</b> selected</span>
          <Checkbox checked={selectAll} onChange={handleSelectAll} label="select all" />
          <div className="k-row">
            {['shortlisted', 'interview', 'rejected', 'hired'].map(status => (
              <Button key={status} size="sm" variant="secondary" disabled={selectedCandidates.length === 0} onClick={() => bulkUpdateStatus(status)}>
                {status}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => { setSelectedCandidates([]); setShowBulkActions(false); }}>cancel</Button>
          </div>
        </div>
      )}

      <div className="ec-split">
        <section className="k-card ec-list" aria-label="candidate list">
          <div className="ec-list-tools">
            <SearchInput className="k-grow" aria-label="search candidates" placeholder="search by name, email or position" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            <Select aria-label="sort" style={{ width: "auto" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">most recent</option>
              <option value="oldest">oldest first</option>
              <option value="name">by name</option>
              <option value="experience">by experience</option>
            </Select>
          </div>
          {currentItems.length === 0 ? (
            <EmptyState
              icon="users"
              tone="blue"
              title="No candidates found"
              text="Try adjusting your search or filters"
              action={(search || statusFilter) ? <Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter(""); }}>clear filters</Button> : null}
            />
          ) : (
            currentItems.map((c) => (
              <div key={c._id} className={"ec-row" + (selectedCandidate?._id === c._id ? " on" : "")}>
                {showBulkActions && (
                  <input type="checkbox" aria-label={`select ${c.fullName}`} checked={selectedCandidates.includes(c._id)} onChange={() => toggleSelectCandidate(c._id)} />
                )}
                <button type="button" className="ec-row-btn" onClick={() => viewCandidateDetails(c._id)}>
                  <span className="emp-i" aria-hidden="true">{initial(c.fullName)}</span>
                  <span className="ec-row-text">
                    <b>{c.fullName || "Unknown"}</b>
                    <span>{[c.jobId?.title || "Position", `${c.yearsOfExperience || 0}y exp`].join(" · ")}</span>
                  </span>
                  <Pill tone={getStatusConfig(c.status).tone}>{getStatusConfig(c.status).label.toLowerCase()}</Pill>
                </button>
              </div>
            ))
          )}
          {totalPages > 1 && (
            <div className="k-pager">
              <span>{currentPage} / {totalPages}</span>
              <div className="k-pager-btns">
                <button type="button" className="k-page-btn" aria-label="Previous Page" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><Ico kind="chevronLeft" tone="plain" size={15} /></button>
                <button type="button" className="k-page-btn" aria-label="Next Page" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><Ico kind="chevronRight" tone="plain" size={15} /></button>
              </div>
            </div>
          )}
        </section>

        {!isTablet && (
          <section className="k-card ec-panel" aria-label="candidate details">
            {selectedCandidate ? renderDetail(selectedCandidate) : (
              <EmptyState icon="user" tone="blue" title="pick a candidate" text="their application shows here." />
            )}
          </section>
        )}
      </div>

      <Modal
        open={isTablet && showDetailsModal && !!selectedCandidate}
        onClose={() => setShowDetailsModal(false)}
        size="lg"
        icon="user"
        tone="blue"
        title="candidate"
      >
        {selectedCandidate && renderDetail(selectedCandidate)}
      </Modal>
    </div>
  );
};

export default CandidatesManager;
