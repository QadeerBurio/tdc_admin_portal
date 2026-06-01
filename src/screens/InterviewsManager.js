import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCalendarAlt, FaClock, FaVideo, FaTrash, FaEdit, FaCheck, FaPlus, FaSpinner } from "react-icons/fa";

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

  useEffect(() => {
    fetchInterviews();
    fetchApplicationsForScheduling();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/jobs/interviews/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterviews(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching interviews:", err);
      setError("Failed to load interviews. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsForScheduling = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs/candidates/all?status=shortlisted", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  };

  const scheduleInterview = async () => {
    if (!selectedApplication) {
      alert("Please select a candidate");
      return;
    }
    
    if (!interviewDate) {
      alert("Please select an interview date and time");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/jobs/interviews/schedule`, {
        applicationId: selectedApplication,
        interviewDate: new Date(interviewDate).toISOString(),
        interviewNotes: interviewNotes,
        meetingLink: meetingLink
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.message) {
        alert("Interview scheduled successfully!");
        setShowScheduleModal(false);
        resetForm();
        fetchInterviews();
        fetchApplicationsForScheduling();
      }
    } catch (err) {
      console.error("Error scheduling interview:", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to schedule interview";
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const rescheduleInterview = async (interviewId, currentDate) => {
    const newDate = prompt("Enter new interview date and time (YYYY-MM-DD HH:MM):\n\nExample: 2024-12-25 14:30", 
      currentDate ? new Date(currentDate).toISOString().slice(0, 16).replace('T', ' ') : "");
    
    if (newDate) {
      setActionInProgress(interviewId);
      try {
        const formattedDate = new Date(newDate.replace(' ', 'T'));
        if (isNaN(formattedDate.getTime())) {
          alert("Invalid date format. Please use YYYY-MM-DD HH:MM");
          setActionInProgress(null);
          return;
        }
        
        await axios.put(`http://localhost:5000/api/jobs/interviews/reschedule/${interviewId}`, {
          interviewDate: formattedDate.toISOString(),
          interviewNotes: "Interview rescheduled"
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Interview rescheduled successfully");
        fetchInterviews();
      } catch (err) {
        console.error("Error rescheduling:", err);
        alert(err.response?.data?.message || "Failed to reschedule interview");
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const cancelInterview = async (interviewId, candidateName) => {
    if (window.confirm(`Are you sure you want to cancel the interview with ${candidateName}?`)) {
      setActionInProgress(interviewId);
      try {
        await axios.delete(`http://localhost:5000/api/jobs/interviews/cancel/${interviewId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Interview cancelled successfully");
        fetchInterviews();
      } catch (err) {
        console.error("Error cancelling:", err);
        alert(err.response?.data?.message || "Failed to cancel interview");
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const completeInterview = async (interviewId, candidateName) => {
    const feedback = prompt(`Enter interview feedback for ${candidateName}:`);
    if (feedback !== null) {
      setActionInProgress(interviewId);
      try {
        await axios.patch(`http://localhost:5000/api/jobs/interviews/complete/${interviewId}`, {
          feedback
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Interview marked as completed");
        fetchInterviews();
      } catch (err) {
        console.error("Error completing interview:", err);
        alert(err.response?.data?.message || "Failed to complete interview");
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

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#d97706", label: "Pending" },
      reviewed: { bg: "#dbeafe", color: "#2563eb", label: "Reviewed" },
      shortlisted: { bg: "#d1fae5", color: "#059669", label: "Shortlisted" },
      interview: { bg: "#ede9fe", color: "#7c3aed", label: "Interview Scheduled" },
      hired: { bg: "#d1fae5", color: "#059669", label: "Hired" },
      rejected: { bg: "#fee2e2", color: "#dc2626", label: "Rejected" }
    };
    return colors[status] || colors.pending;
  };

  if (loading) return <div style={styles.loading}>Loading interviews...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Interviews</h1>
          <p style={styles.subtitle}>Schedule and manage candidate interviews</p>
        </div>
        <button style={styles.scheduleBtn} onClick={() => setShowScheduleModal(true)}>
          <FaPlus /> Schedule Interview
        </button>
      </div>

      {interviews.length === 0 ? (
        <div style={styles.emptyState}>
          <FaCalendarAlt size={48} color="#cbd5e1" />
          <p>No interviews scheduled</p>
          <button style={styles.emptyScheduleBtn} onClick={() => setShowScheduleModal(true)}>
            Schedule your first interview
          </button>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>Candidate</th>
                <th>Position</th>
                <th>Interview Date</th>
                <th>Meeting Link</th>
                <th>Status</th>
                <th>Actions</th>
               </tr>
            </thead>
            <tbody>
              {interviews.map((interview) => (
                <tr key={interview._id} style={styles.tableRow}>
                  <td>
                    <div style={styles.candidateName}>{interview.fullName}</div>
                    <div style={styles.candidateEmail}>{interview.email}</div>
                    <div style={styles.candidatePhone}>{interview.phone}</div>
                  </td>
                  <td>
                    <div style={styles.jobTitle}>{interview.jobId?.title}</div>
                    <div style={styles.jobDept}>{interview.jobId?.department}</div>
                  </td>
                  <td>
                    {interview.interviewDate ? (
                      <>
                        <div style={styles.interviewDate}>
                          <FaCalendarAlt size={12} /> {new Date(interview.interviewDate).toLocaleDateString()}
                        </div>
                        <div style={styles.interviewTime}>
                          <FaClock size={12} /> {new Date(interview.interviewDate).toLocaleTimeString()}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Not scheduled</span>
                    )}
                  </td>
                  <td>
                    {interview.meetingLink ? (
                      <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" style={styles.meetingLink}>
                        <FaVideo /> Join Meeting
                      </a>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>No link</span>
                    )}
                  </td>
                  <td>
                    <span style={{ 
                      ...styles.statusBadge, 
                      background: getStatusBadge(interview.status).bg, 
                      color: getStatusBadge(interview.status).color 
                    }}>
                      {getStatusBadge(interview.status).label}
                    </span>
                  </td>
                  <td>
                    <div style={styles.actionButtons}>
                      <button 
                        style={styles.rescheduleBtn} 
                        onClick={() => rescheduleInterview(interview._id, interview.interviewDate)}
                        disabled={actionInProgress === interview._id}
                      >
                        {actionInProgress === interview._id ? <FaSpinner className="spinner" /> : <FaEdit />}
                        Reschedule
                      </button>
                      <button 
                        style={styles.completeBtn} 
                        onClick={() => completeInterview(interview._id, interview.fullName)}
                        disabled={actionInProgress === interview._id}
                      >
                        {actionInProgress === interview._id ? <FaSpinner className="spinner" /> : <FaCheck />}
                        Complete
                      </button>
                      <button 
                        style={styles.cancelBtn} 
                        onClick={() => cancelInterview(interview._id, interview.fullName)}
                        disabled={actionInProgress === interview._id}
                      >
                        {actionInProgress === interview._id ? <FaSpinner className="spinner" /> : <FaTrash />}
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div style={styles.modalOverlay} onClick={() => setShowScheduleModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Schedule Interview</h2>
            
            <div style={styles.formGroup}>
              <label>Select Candidate *</label>
              <select 
                value={selectedApplication || ""} 
                onChange={(e) => setSelectedApplication(e.target.value)} 
                style={styles.select}
              >
                <option value="">Select a candidate</option>
                {applications.map(app => (
                  <option key={app._id} value={app._id}>
                    {app.fullName} - {app.jobId?.title}
                  </option>
                ))}
              </select>
              {applications.length === 0 && (
                <p style={styles.hint}>No shortlisted candidates available. Please shortlist candidates first.</p>
              )}
            </div>

            <div style={styles.formGroup}>
              <label>Interview Date & Time *</label>
              <input 
                type="datetime-local" 
                value={interviewDate} 
                onChange={(e) => setInterviewDate(e.target.value)} 
                style={styles.input} 
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Meeting Link (Zoom/Google Meet)</label>
              <input 
                type="url" 
                placeholder="https://meet.google.com/... or https://zoom.us/j/..." 
                value={meetingLink} 
                onChange={(e) => setMeetingLink(e.target.value)} 
                style={styles.input} 
              />
            </div>

            <div style={styles.formGroup}>
              <label>Interview Notes</label>
              <textarea 
                rows="4" 
                placeholder="Add any notes or instructions for the candidate..." 
                value={interviewNotes} 
                onChange={(e) => setInterviewNotes(e.target.value)} 
                style={styles.textarea} 
              />
            </div>

            <div style={styles.modalButtons}>
              <button style={styles.cancelModalBtn} onClick={() => setShowScheduleModal(false)}>
                Cancel
              </button>
              <button 
                style={styles.submitBtn} 
                onClick={scheduleInterview} 
                disabled={submitting || applications.length === 0}
              >
                {submitting ? <><FaSpinner className="spinner" /> Scheduling...</> : "Schedule Interview"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinner {
            animation: spin 1s linear infinite;
            margin-right: 6px;
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: { animation: "fadeInUp 0.5s ease", padding: "20px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" },
  title: { fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 },
  subtitle: { fontSize: "14px", color: "#64748b", marginTop: "4px" },
  scheduleBtn: { background: "#ff961a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600" },
  tableContainer: { overflowX: "auto", background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { borderBottom: "1px solid #e5e7eb", background: "#f8fafc", padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151" },
  tableRow: { borderBottom: "1px solid #e5e7eb" },
  candidateName: { fontWeight: "600", color: "#1e293b", marginBottom: "2px" },
  candidateEmail: { fontSize: "11px", color: "#64748b", marginBottom: "2px" },
  candidatePhone: { fontSize: "11px", color: "#94a3b8" },
  jobTitle: { fontWeight: "500", color: "#1e293b", marginBottom: "2px" },
  jobDept: { fontSize: "11px", color: "#94a3b8" },
  interviewDate: { fontSize: "13px", color: "#1e293b", marginBottom: "4px" },
  interviewTime: { fontSize: "12px", color: "#10b981" },
  meetingLink: { color: "#3b82f6", textDecoration: "none", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" },
  statusBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", display: "inline-block" },
  actionButtons: { display: "flex", gap: "8px", flexWrap: "wrap" },
  rescheduleBtn: { padding: "6px 12px", background: "#fef3c7", border: "none", borderRadius: "8px", color: "#d97706", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },
  completeBtn: { padding: "6px 12px", background: "#d1fae5", border: "none", borderRadius: "8px", color: "#059669", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },
  cancelBtn: { padding: "6px 12px", background: "#fee2e2", border: "none", borderRadius: "8px", color: "#dc2626", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: "#fff", borderRadius: "20px", padding: "32px", maxWidth: "500px", width: "90%", maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: "24px", fontWeight: "700", marginBottom: "24px", color: "#1e293b" },
  formGroup: { marginBottom: "20px" },
  select: { width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", backgroundColor: "#fff" },
  input: { width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px" },
  textarea: { width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", minHeight: "100px", resize: "vertical" },
  hint: { fontSize: "12px", color: "#ef4444", marginTop: "8px" },
  modalButtons: { display: "flex", gap: "12px", marginTop: "24px" },
  cancelModalBtn: { flex: 1, padding: "12px", background: "#e5e7eb", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
  submitBtn: { flex: 1, padding: "12px", background: "#ff961a", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  emptyState: { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb" },
  emptyScheduleBtn: { marginTop: "16px", padding: "10px 20px", background: "#ff961a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontSize: "16px", color: "#64748b" },
  error: { display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontSize: "16px", color: "#ef4444" }
};

export default InterviewsManager;