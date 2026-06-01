import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaDownload, FaCalendarAlt, FaChartLine, FaUsers, FaBriefcase, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const ReportsManager = ({ token, stats }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [jobsByDepartment, setJobsByDepartment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/jobs/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeeklyData(res.data.weeklyApplications || []);
      setJobsByDepartment(res.data.jobsByDepartment || []);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs/candidates/export", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const csvData = convertToCSV(res.data);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hiring_report_${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting report:", err);
      alert("Failed to export report");
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

  const maxApplications = Math.max(...weeklyData.map(d => d.count), 1);

  if (loading) return <div style={styles.loading}>Loading reports...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics & Reports</h1>
          <p style={styles.subtitle}>Track your hiring metrics and performance</p>
        </div>
        <button style={styles.exportBtn} onClick={exportReport}>
          <FaDownload /> Export Report
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#eff6ff", color: "#3b82f6" }}><FaBriefcase /></div>
          <div>
            <div style={styles.statValue}>{stats.totalJobs}</div>
            <div style={styles.statLabel}>Total Jobs</div>
            <div style={styles.statChange}>+{stats.activeJobs} active</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#f0fdf4", color: "#10b981" }}><FaUsers /></div>
          <div>
            <div style={styles.statValue}>{stats.totalApplications}</div>
            <div style={styles.statLabel}>Applications</div>
            <div style={styles.statChange}>{stats.pendingApplications} pending review</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#fef3c7", color: "#f59e0b" }}><FaCheckCircle /></div>
          <div>
            <div style={styles.statValue}>{stats.shortlistedCandidates}</div>
            <div style={styles.statLabel}>Shortlisted</div>
            <div style={styles.statChange}>Ready for interview</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#dcfce7", color: "#059669" }}><FaCheckCircle /></div>
          <div>
            <div style={styles.statValue}>{stats.hiredCandidates}</div>
            <div style={styles.statLabel}>Hired</div>
            <div style={styles.statChange}>Successfully placed</div>
          </div>
        </div>
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Weekly Applications</h3>
          <div style={styles.barChart}>
            {weeklyData.map((item, index) => (
              <div key={index} style={styles.barItem}>
                <div style={styles.barLabel}>{item.date}</div>
                <div style={styles.barWrapper}>
                  <div style={{ ...styles.bar, width: `${(item.count / maxApplications) * 100}%`, background: "#ff961a" }} />
                  <span style={styles.barValue}>{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Jobs by Department</h3>
          <div style={styles.pieChart}>
            {jobsByDepartment.map((dept, index) => (
              <div key={index} style={styles.pieItem}>
                <div style={{ ...styles.pieColor, background: `hsl(${index * 45}, 70%, 50%)` }} />
                <div style={styles.pieLabel}>{dept._id}</div>
                <div style={styles.pieValue}>{dept.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.insightsCard}>
        <h3 style={styles.chartTitle}>Key Insights</h3>
        <div style={styles.insightsGrid}>
          <div style={styles.insightItem}>
            <FaChartLine size={24} color="#ff961a" />
            <div>
              <div style={styles.insightValue}>
                {stats.totalApplications > 0 
                  ? Math.round((stats.hiredCandidates / stats.totalApplications) * 100) 
                  : 0}%
              </div>
              <div style={styles.insightLabel}>Hiring Rate</div>
            </div>
          </div>
          <div style={styles.insightItem}>
            <FaUsers size={24} color="#3b82f6" />
            <div>
              <div style={styles.insightValue}>
                {stats.totalApplications > 0 
                  ? Math.round(stats.totalApplications / stats.totalJobs) 
                  : 0}
              </div>
              <div style={styles.insightLabel}>Applications per Job</div>
            </div>
          </div>
          <div style={styles.insightItem}>
            <FaCheckCircle size={24} color="#10b981" />
            <div>
              <div style={styles.insightValue}>
                {stats.totalApplications > 0 
                  ? Math.round((stats.shortlistedCandidates / stats.totalApplications) * 100) 
                  : 0}%
              </div>
              <div style={styles.insightLabel}>Shortlist Rate</div>
            </div>
          </div>
          <div style={styles.insightItem}>
            <FaTimesCircle size={24} color="#ef4444" />
            <div>
              <div style={styles.insightValue}>
                {stats.totalApplications > 0 
                  ? Math.round(((stats.totalApplications - stats.hiredCandidates) / stats.totalApplications) * 100) 
                  : 0}%
              </div>
              <div style={styles.insightLabel}>Rejection Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { animation: "fadeInUp 0.5s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" },
  title: { fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 },
  subtitle: { fontSize: "14px", color: "#64748b", marginTop: "4px" },
  exportBtn: { background: "#ff961a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "28px" },
  statCard: { background: "#fff", padding: "20px", borderRadius: "16px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "16px" },
  statIcon: { width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" },
  statValue: { fontSize: "28px", fontWeight: "800", color: "#1e293b" },
  statLabel: { fontSize: "13px", color: "#64748b", marginTop: "4px" },
  statChange: { fontSize: "11px", color: "#10b981", marginTop: "4px" },
  chartsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" },
  chartCard: { background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e5e7eb" },
  chartTitle: { fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "20px" },
  barChart: { display: "flex", flexDirection: "column", gap: "12px" },
  barItem: { display: "flex", alignItems: "center", gap: "12px" },
  barLabel: { width: "40px", fontSize: "12px", fontWeight: "500", color: "#64748b" },
  barWrapper: { flex: 1, position: "relative", height: "30px", backgroundColor: "#f1f5f9", borderRadius: "8px", overflow: "hidden" },
  bar: { height: "100%", borderRadius: "8px", transition: "width 0.5s ease" },
  barValue: { position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", fontWeight: "600", color: "#1e293b" },
  pieChart: { display: "flex", flexDirection: "column", gap: "12px" },
  pieItem: { display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  pieColor: { width: "12px", height: "12px", borderRadius: "50%" },
  pieLabel: { flex: 1, fontSize: "13px", color: "#1e293b" },
  pieValue: { fontSize: "16px", fontWeight: "600", color: "#ff961a" },
  insightsCard: { background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e5e7eb" },
  insightsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "16px" },
  insightItem: { display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "#f8fafc", borderRadius: "12px" },
  insightValue: { fontSize: "24px", fontWeight: "700", color: "#1e293b" },
  insightLabel: { fontSize: "12px", color: "#64748b", marginTop: "4px" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontSize: "16px", color: "#64748b" }
};

export default ReportsManager;