import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaDownload,
  FaCalendarAlt,
  FaChartLine,
  FaUsers,
  FaBriefcase,
  FaCheckCircle,
  FaFileAlt,
  FaStar,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaChartPie,
  FaChartBar,
  FaTrophy,
  FaRocket,
  FaSpinner,
  FaEye,
  FaBuilding,
  FaMapMarkerAlt,
  FaDollarSign,
  FaGraduationCap,
  FaLongArrowAltUp,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ReportsManager = ({ token, stats }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [jobsByDepartment, setJobsByDepartment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");
  const [hoveredBar, setHoveredBar] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    fetchReportData();
    setTimeout(() => setAnimated(true), 100);
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeeklyData(res.data.weeklyApplications || [
        { date: "Mon", count: 5 },
        { date: "Tue", count: 8 },
        { date: "Wed", count: 12 },
        { date: "Thu", count: 7 },
        { date: "Fri", count: 15 },
        { date: "Sat", count: 3 },
        { date: "Sun", count: 6 },
      ]);
      setJobsByDepartment(res.data.jobsByDepartment || [
        { _id: "Engineering", count: 12 },
        { _id: "Marketing", count: 8 },
        { _id: "Sales", count: 6 },
        { _id: "HR", count: 4 },
        { _id: "Finance", count: 5 },
      ]);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const res = await axios.get("https://the-deft-crew-production.up.railway.app/api/jobs/candidates/export", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const csvData = convertToCSV(res.data);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hiring_report_${new Date().toISOString().slice(0,10)}.csv`;
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

  const metrics = [
    {
      id: "applications",
      label: "Total Applications",
      value: stats.totalApplications || 0,
      icon: <FaUsers />,
      change: "+12%",
      trend: "up"
    },
    {
      id: "shortlisted",
      label: "Shortlisted",
      value: stats.shortlistedCandidates || 0,
      icon: <FaStar />,
      change: "+8%",
      trend: "up"
    },
    {
      id: "hired",
      label: "Hired",
      value: stats.hiredCandidates || 0,
      icon: <FaTrophy />,
      change: "+5%",
      trend: "up"
    },
    {
      id: "activeJobs",
      label: "Active Jobs",
      value: stats.activeJobs || 0,
      icon: <FaBriefcase />,
      change: "-2%",
      trend: "down"
    }
  ];

  const insights = [
    {
      id: "hiringRate",
      label: "Hiring Rate",
      value: stats.totalApplications > 0 
        ? Math.round((stats.hiredCandidates / stats.totalApplications) * 100) 
        : 0,
      icon: <FaChartLine />,
    },
    {
      id: "appsPerJob",
      label: "Apps per Job",
      value: stats.totalJobs > 0 
        ? Math.round(stats.totalApplications / stats.totalJobs) 
        : 0,
      icon: <FaFileAlt />,
    },
    {
      id: "shortlistRate",
      label: "Shortlist Rate",
      value: stats.totalApplications > 0 
        ? Math.round((stats.shortlistedCandidates / stats.totalApplications) * 100) 
        : 0,
      icon: <FaStar />,
    },
    {
      id: "interviewRate",
      label: "Interview Rate",
      value: stats.totalApplications > 0 
        ? Math.round((stats.totalInterviews / stats.totalApplications) * 100) 
        : 0,
      icon: <FaCalendarAlt />,
    }
  ];

  if (loading) return (
    <div style={styles.loadingContainer}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <FaSpinner size={50} color="#f9c349" />
      </motion.div>
      <p style={styles.loadingText}>Generating reports...</p>
      <div style={styles.loadingBar}>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
          style={styles.loadingProgress}
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={styles.header}
      >
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaChartLine size={24} />
          </div>
          <div>
            <h1 style={styles.title}>Analytics & Reports</h1>
            <p style={styles.subtitle}>Track your hiring metrics and performance</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <select
            style={styles.dateSelect}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.exportBtn}
            onClick={exportReport}
          >
            <FaDownload size={14} /> Export Report
          </motion.button>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={styles.metricsGrid}
      >
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            whileHover={{ y: -2 }}
            style={styles.metricCard}
          >
            <div style={styles.metricIcon}>
              {metric.icon}
            </div>
            <div style={styles.metricContent}>
              <div style={styles.metricValue}>{metric.value}</div>
              <div style={styles.metricLabel}>{metric.label}</div>
              <div style={{
                ...styles.metricChange,
                color: metric.trend === "up" ? "#10b981" : "#ef4444"
              }}>
                {metric.trend === "up" ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                {metric.change}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        {/* Weekly Applications Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={styles.chartCard}
        >
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>
              <FaChartBar size={16} /> Weekly Applications
            </h3>
            <span style={styles.chartSubtitle}>{weeklyData.reduce((sum, d) => sum + d.count, 0)} total</span>
          </div>
          <div style={styles.barChart}>
            {weeklyData.map((item, index) => {
              const height = (item.count / maxApplications) * 100;
              return (
                <div key={index} style={styles.barItem}>
                  <div 
                    style={styles.barContainer}
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: animated ? `${height}%` : 0 }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      style={{
                        ...styles.bar,
                        height: `${height}%`,
                        background: hoveredBar === index 
                          ? "#f9c349"
                          : "#e5e7eb",
                      }}
                    />
                    {hoveredBar === index && (
                      <div style={styles.barTooltip}>
                        {item.count} applications
                      </div>
                    )}
                  </div>
                  <div style={styles.barLabel}>{item.date}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Jobs by Department */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={styles.chartCard}
        >
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>
              <FaChartPie size={16} /> Jobs by Department
            </h3>
            <span style={styles.chartSubtitle}>{jobsByDepartment.length} departments</span>
          </div>
          <div style={styles.departmentList}>
            {jobsByDepartment.map((dept, index) => {
              const total = jobsByDepartment.reduce((sum, d) => sum + d.count, 0);
              const percentage = total > 0 ? (dept.count / total) * 100 : 0;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  style={styles.departmentItem}
                >
                  <div style={styles.departmentHeader}>
                    <span style={styles.departmentDot} />
                    <span style={styles.departmentName}>{dept._id || "Other"}</span>
                    <span style={styles.departmentCount}>{dept.count}</span>
                  </div>
                  <div style={styles.departmentBar}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: animated ? `${percentage}%` : 0 }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      style={{
                        ...styles.departmentProgress,
                        width: `${percentage}%`,
                        background: "#f9c349"
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={styles.insightsCard}
      >
        <div style={styles.insightsHeader}>
          <h3 style={styles.chartTitle}>
            <FaRocket size={16} /> Key Insights
          </h3>
          <p style={styles.insightsSubtitle}>Performance metrics at a glance</p>
        </div>
        <div style={styles.insightsGrid}>
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -2 }}
              style={styles.insightItem}
            >
              <div style={styles.insightIcon}>
                {insight.icon}
              </div>
              <div style={styles.insightContent}>
                <div style={styles.insightValue}>
                  {insight.value}{insight.id !== "appsPerJob" ? "%" : ""}
                </div>
                <div style={styles.insightLabel}>{insight.label}</div>
                <div style={styles.insightTrend}>
                  <FaLongArrowAltUp size={12} color="#10b981" />
                  <span style={{ color: "#10b981" }}>+{Math.floor(Math.random() * 10)}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

     

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #f9c349;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #e8a800;
          }
        `}
      </style>
    </motion.div>
  );
};

const styles = {
  container: {
    padding: "24px 32px",
    width: "100%",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    gap: "16px",
  },
  loadingText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
    fontWeight: "500",
  },
  loadingBar: {
    width: "180px",
    height: "4px",
    background: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
  },
  loadingProgress: {
    height: "100%",
    background: "#f9c349",
    borderRadius: "4px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  headerIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#f9c349",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  dateSelect: {
    padding: "8px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  exportBtn: {
    background: "#f9c349",
    color: "#0f172a",
    border: "none",
    padding: "8px 18px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s ease",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  metricCard: {
    background: "#fff",
    padding: "18px 20px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    transition: "all 0.2s ease",
    cursor: "default",
  },
  metricIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f9c349",
    fontSize: "18px",
    flexShrink: 0,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 1.2,
  },
  metricLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  metricChange: {
    fontSize: "11px",
    fontWeight: "600",
    marginTop: "2px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "24px",
  },
  chartCard: {
    background: "#fff",
    padding: "20px 24px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  chartTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  chartSubtitle: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  barChart: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: "160px",
    padding: "0 4px",
    gap: "6px",
  },
  barItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    height: "100%",
  },
  barContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    position: "relative",
    cursor: "pointer",
  },
  bar: {
    width: "60%",
    minHeight: "4px",
    borderRadius: "4px 4px 0 0",
    transition: "all 0.2s ease",
  },
  barTooltip: {
    position: "absolute",
    top: "-28px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#0f172a",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  barLabel: {
    fontSize: "10px",
    color: "#94a3b8",
    marginTop: "6px",
    fontWeight: "500",
  },
  departmentList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  departmentItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  departmentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  departmentDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#f9c349",
    flexShrink: 0,
  },
  departmentName: {
    flex: 1,
    fontSize: "13px",
    color: "#0f172a",
    fontWeight: "500",
  },
  departmentCount: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#f9c349",
  },
  departmentBar: {
    height: "5px",
    background: "#f1f5f9",
    borderRadius: "3px",
    overflow: "hidden",
    marginLeft: "16px",
  },
  departmentProgress: {
    height: "100%",
    borderRadius: "3px",
    transition: "all 0.2s ease",
  },
  insightsCard: {
    background: "#fff",
    padding: "20px 24px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    marginBottom: "24px",
  },
  insightsHeader: {
    marginBottom: "16px",
  },
  insightsSubtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  insightsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "12px",
  },
  insightItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    background: "#f8fafc",
    borderRadius: "10px",
    transition: "all 0.2s ease",
    cursor: "default",
  },
  insightIcon: {
    fontSize: "20px",
    color: "#f9c349",
    flexShrink: 0,
  },
  insightContent: {
    flex: 1,
  },
  insightValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },
  insightLabel: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "1px",
  },
  insightTrend: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "2px",
    fontSize: "11px",
  },
  footerStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
    padding: "16px 20px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  footerStat: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#475569",
    fontWeight: "500",
  },
};

export default ReportsManager;