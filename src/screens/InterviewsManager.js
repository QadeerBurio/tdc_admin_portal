// Interviews (design/portal/EmpInterviews, schedule form: EmpSchedule): schedule, track and manage interviews.
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Ico from "../portal/Ico";
import { Button, Field, Input, Textarea, Select, DateInput, SearchInput, Segmented, Modal, EmptyState, PageLoading, Pill, toast, confirmDialog } from "../portal/kit";
import dotSorted from "./dots/sorted.png";
import "./styles/EmployerPortal.css";

// a date as the value of a datetime-local input (local time)
const toLocalInput = (d) => {
  const x = new Date(d);
  if (isNaN(x.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};

const InterviewsManager = ({ token }) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    upcoming: 0,
    today: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  // reschedule and complete open kit modals in place of window.prompt
  const [rescheduleTarget, setRescheduleTarget] = useState(null); // { id, value }
  const [completeTarget, setCompleteTarget] = useState(null); // { id, name, feedback }

  useEffect(() => {
    fetchInterviews();
    fetchApplicationsForScheduling();
  }, []);

  const showNotification = (message, type = "success") => {
    toast(message, type === "error" ? "bad" : "ok");
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/interviews/all",{
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterviews(res.data);
      calculateStats(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching interviews:", err);
      setError("Failed to load interviews. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayInterviews = data.filter(i => {
      const date = new Date(i.interviewDate);
      return i.status === "interview" && date >= today && date < tomorrow;
    });

    const pending = data.filter(i => i.status === "interview" && new Date(i.interviewDate) > now).length;
    const completed = data.filter(i => i.status === "completed" || i.status === "hired").length;

    setStats({
      total: data.length,
      pending,
      completed,
      upcoming: data.filter(i => i.status === "interview" && new Date(i.interviewDate) > now).length,
      today: todayInterviews.length,
    });
  };

  const fetchApplicationsForScheduling = async () => {
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/candidates/all?status=shortlisted", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  };

  const scheduleInterview = async () => {
    if (!selectedApplication) {
      showNotification("Please select a candidate", "error");
      return;
    }
    
    if (!interviewDate) {
      showNotification("Please select an interview date and time", "error");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `https://the-deft-crew-production.up.railway.app/api/jobs/interviews/schedule`,
        {
          applicationId: selectedApplication,
          interviewDate: new Date(interviewDate).toISOString(),
          interviewNotes: interviewNotes,
          meetingLink: meetingLink
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      showNotification("Interview scheduled successfully!", "success");
      setShowScheduleModal(false);
      resetForm();
      fetchInterviews();
      fetchApplicationsForScheduling();
    } catch (err) {
      console.error("Error scheduling interview:", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to schedule interview";
      showNotification(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // opens the reschedule modal, prefilled with the current date and time
  const rescheduleInterview = (interviewId, currentDate) => {
    setRescheduleTarget({ id: interviewId, value: currentDate ? toLocalInput(currentDate) : "" });
  };

  const submitReschedule = async () => {
    const interviewId = rescheduleTarget?.id;
    const newDate = rescheduleTarget?.value;
    setRescheduleTarget(null);
    if (newDate) {
      setActionInProgress(interviewId);
      try {
        const formattedDate = new Date(newDate.replace(' ', 'T'));
        if (isNaN(formattedDate.getTime())) {
          showNotification("Invalid date format. Please use YYYY-MM-DD HH:MM", "error");
          setActionInProgress(null);
          return;
        }
        
        await axios.put(
          `https://the-deft-crew-production.up.railway.app/api/jobs/interviews/reschedule/${interviewId}`,
          {
            interviewDate: formattedDate.toISOString(),
            interviewNotes: "Interview rescheduled"
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification("Interview rescheduled successfully", "success");
        fetchInterviews();
      } catch (err) {
        console.error("Error rescheduling:", err);
        showNotification(err.response?.data?.message || "Failed to reschedule interview", "error");
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const cancelInterview = async (interviewId, candidateName) => {
    if (await confirmDialog(`Are you sure you want to cancel the interview with ${candidateName}?`)) {
      setActionInProgress(interviewId);
      try {
        await axios.delete(
          `https://the-deft-crew-production.up.railway.app/api/jobs/interviews/cancel/${interviewId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification("Interview cancelled successfully", "success");
        fetchInterviews();
      } catch (err) {
        console.error("Error cancelling:", err);
        showNotification(err.response?.data?.message || "Failed to cancel interview", "error");
      } finally {
        setActionInProgress(null);
      }
    }
  };

  // opens the feedback modal
  const completeInterview = (interviewId, candidateName) => {
    setCompleteTarget({ id: interviewId, name: candidateName, feedback: "" });
  };

  const submitComplete = async () => {
    const interviewId = completeTarget?.id;
    const feedback = completeTarget?.feedback ?? "";
    setCompleteTarget(null);
    if (feedback !== null) {
      setActionInProgress(interviewId);
      try {
        await axios.patch(
          `https://the-deft-crew-production.up.railway.app/api/jobs/interviews/complete/${interviewId}`,
          { feedback },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification("Interview marked as completed", "success");
        fetchInterviews();
      } catch (err) {
        console.error("Error completing interview:", err);
        showNotification(err.response?.data?.message || "Failed to complete interview", "error");
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const resetForm = () => {
    setSelectedApplication(null);
    setInterviewDate("");
    setInterviewNotes("");
    setMeetingLink("");
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { tone: "sand", label: "Pending" },
      reviewed: { tone: "sand", label: "Reviewed" },
      shortlisted: { tone: "yellow", label: "Shortlisted" },
      interview: { tone: "purple", label: "Scheduled" },
      completed: { tone: "green", label: "Completed" },
      hired: { tone: "green", label: "Hired" },
      rejected: { tone: "red", label: "Rejected" }
    };
    return configs[status] || configs.pending;
  };

  const isUpcoming = (date) => {
    return new Date(date) > new Date();
  };

  const isToday = (date) => {
    const today = new Date();
    const interviewDate = new Date(date);
    return interviewDate.getDate() === today.getDate() &&
           interviewDate.getMonth() === today.getMonth() &&
           interviewDate.getFullYear() === today.getFullYear();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (date) => {
    const now = new Date();
    const interviewDate = new Date(date);
    const diff = interviewDate - now;
    if (diff < 0) return "Past";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)} days`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Filter and search
  const filteredInterviews = interviews
    .filter(i => 
      i.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.jobId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.jobId?.department?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(i => !statusFilter ||
      (statusFilter === "upcoming" && isUpcoming(i.interviewDate)) ||
      (statusFilter === "today" && isToday(i.interviewDate)) ||
      (statusFilter === "past" && !isUpcoming(i.interviewDate)))
    .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInterviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage);

  const openSchedule = () => setShowScheduleModal(true);

  if (loading) return <div className="tdcp k-page"><PageLoading label="Loading interviews..." /></div>;

  return (
    <div className="tdcp k-page" data-screen="employer-interviews">
      <div className="k-head">
        <div className="emp-title">
          <Ico kind="calendar" tone="purple" size={56} />
          <div>
            <h1>interviews<span className="dot" aria-hidden="true">.</span></h1>
            <p>schedule, track and manage candidate interviews.</p>
          </div>
        </div>
        <div className="k-actions">
          <Button icon="plus" onClick={openSchedule}>schedule interview</Button>
        </div>
      </div>

      {error && <div className="k-note bad" role="alert">{error}</div>}

      <div className="ei-stats">
        {[
          [stats.total, "total", "calendar", "purple"],
          [stats.upcoming, "upcoming", "send", "sky"],
          [stats.today, "today", "spark", "orange"],
          [stats.pending, "pending", "clock", "coral"],
          [stats.completed, "completed", "check", "green"],
        ].map(([n, label, icon, tone]) => (
          <div className="k-card ei-stat" key={label}>
            <Ico kind={icon} tone={tone} size={48} />
            <div><b>{n}</b><span>{label}</span></div>
          </div>
        ))}
      </div>

      <div className="k-toolbar">
        <SearchInput className="k-grow" aria-label="search interviews" placeholder="search by candidate, email or position" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        <Segmented
          label="filter by date"
          value={statusFilter || "all"}
          onChange={(v) => { setStatusFilter(v === "all" ? "" : v); setCurrentPage(1); }}
          options={[{ value: "all", label: "all" }, { value: "upcoming", label: "upcoming" }, { value: "today", label: "today" }, { value: "past", label: "past" }]}
        />
      </div>

      {interviews.length === 0 ? (
        <div className="k-card ei-none">
          <img src={dotSorted} alt="" />
          <h2>no interviews yet<span className="dot" aria-hidden="true">.</span></h2>
          <p>shortlist a candidate, then schedule your first interview here.</p>
          <div className="k-row" style={{ justifyContent: "center" }}>
            <Button onClick={openSchedule}>schedule interview</Button>
            <Link to="/candidate" className="k-btn secondary">review candidates</Link>
          </div>
        </div>
      ) : (
        <div className="k-table-card">
          <div className="k-table-scroll">
            <table className="k-table" style={{ minWidth: 900 }}>
              <thead>
                <tr><th>candidate</th><th>position</th><th>interview</th><th>meeting</th><th>status</th><th style={{ textAlign: "right" }}>actions</th></tr>
              </thead>
              {currentItems.length > 0 && (
                <tbody>
                  {currentItems.map((interview) => {
                    const upcoming = isUpcoming(interview.interviewDate);
                    const today = isToday(interview.interviewDate);
                    const busy = actionInProgress === interview._id;
                    const cfg = getStatusConfig(interview.status);
                    return (
                      <tr key={interview._id}>
                        <td>
                          <b>{interview.fullName}</b>
                          <div className="k-hint">{interview.email}</div>
                        </td>
                        <td>
                          {interview.jobId?.title || "Position"}
                          {interview.jobId?.department && <div className="k-hint">{interview.jobId.department}</div>}
                        </td>
                        <td className="ei-when">
                          <b>{formatDate(interview.interviewDate)}</b>
                          <div className="k-hint">{formatTime(interview.interviewDate)}{upcoming ? ` · in ${getTimeRemaining(interview.interviewDate)}` : " · past"}</div>
                          {today && upcoming && <Pill tone="orange">today</Pill>}
                        </td>
                        <td>
                          {interview.meetingLink ? (
                            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="k-btn secondary sm"><Ico kind="external" tone="plain" size={15} />join</a>
                          ) : (
                            <span className="k-hint">No link</span>
                          )}
                        </td>
                        <td><Pill tone={cfg.tone} dot>{cfg.label}</Pill></td>
                        <td>
                          <span className="k-row" style={{ gap: 6, flexWrap: "nowrap", justifyContent: "flex-end" }}>
                            <Button size="sm" variant="secondary" icon="calendar" disabled={busy} onClick={() => rescheduleInterview(interview._id, interview.interviewDate)}>reschedule</Button>
                            {interview.status !== "completed" && interview.status !== "hired" && (
                              <Button size="sm" icon="check" disabled={busy} onClick={() => completeInterview(interview._id, interview.fullName)}>complete</Button>
                            )}
                            <Button size="sm" variant="danger" icon="close" loading={busy} disabled={busy} onClick={() => cancelInterview(interview._id, interview.fullName)}>cancel</Button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>
          {filteredInterviews.length === 0 && (
            <EmptyState icon="calendar" tone="purple" title="no interviews match" text="try another filter or search." />
          )}
          {filteredInterviews.length > itemsPerPage && (
            <div className="k-pager">
              <span>{currentPage} / {totalPages}</span>
              <div className="k-pager-btns">
                <button type="button" className="k-page-btn" aria-label="Previous Page" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><Ico kind="chevronLeft" tone="plain" size={15} /></button>
                <button type="button" className="k-page-btn" aria-label="Next Page" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><Ico kind="chevronRight" tone="plain" size={15} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* schedule interview (EmpSchedule) */}
      <Modal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        icon="calendar"
        tone="purple"
        title="schedule interview"
        sub="pick a shortlisted candidate and set the details."
        footer={<>
          <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>cancel</Button>
          <Button icon="check" onClick={scheduleInterview} loading={submitting} disabled={submitting || applications.length === 0}>schedule</Button>
        </>}
      >
        <div className="emp-form">
          <Field label="candidate *" htmlFor="ei-cand" error={applications.length === 0 ? "no shortlisted candidates yet. shortlist someone in candidates first." : null}>
            <Select id="ei-cand" invalid={applications.length === 0} value={selectedApplication || ""} onChange={(e) => setSelectedApplication(e.target.value)}>
              <option value="">choose a shortlisted candidate</option>
              {applications.map(app => (
                <option key={app._id} value={app._id}>
                  {app.fullName} · {app.jobId?.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="date and time *" htmlFor="ei-date">
            <DateInput id="ei-date" withTime value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
          </Field>
          <Field label="meeting link (optional)" htmlFor="ei-link">
            <Input id="ei-link" type="url" placeholder="https://meet.google.com/… or https://zoom.us/j/…" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
          </Field>
          <Field label="notes for the candidate (optional)" htmlFor="ei-notes">
            <Textarea id="ei-notes" rows={3} placeholder="what to prepare, who they'll meet…" value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} />
          </Field>
        </div>
      </Modal>

      {/* reschedule (was a prompt) */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        icon="calendar"
        tone="sky"
        title="reschedule interview"
        sub="pick the new date and time."
        footer={<>
          <Button variant="secondary" onClick={() => setRescheduleTarget(null)}>cancel</Button>
          <Button icon="check" disabled={!rescheduleTarget?.value} onClick={submitReschedule}>reschedule</Button>
        </>}
      >
        <Field label="new date and time" htmlFor="ei-new-date">
          <DateInput id="ei-new-date" withTime value={rescheduleTarget?.value || ""} onChange={(e) => setRescheduleTarget({ ...rescheduleTarget, value: e.target.value })} />
        </Field>
      </Modal>

      {/* complete with feedback (was a prompt) */}
      <Modal
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        icon="check"
        tone="green"
        title="complete interview"
        sub={completeTarget ? `Enter interview feedback for ${completeTarget.name}:` : ""}
        footer={<>
          <Button variant="secondary" onClick={() => setCompleteTarget(null)}>cancel</Button>
          <Button icon="check" onClick={submitComplete}>mark completed</Button>
        </>}
      >
        <Field label="feedback" htmlFor="ei-feedback">
          <Textarea id="ei-feedback" rows={4} value={completeTarget?.feedback || ""} onChange={(e) => setCompleteTarget({ ...completeTarget, feedback: e.target.value })} placeholder="how did it go?" />
        </Field>
      </Modal>
    </div>
  );
};

export default InterviewsManager;
