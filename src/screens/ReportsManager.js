import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaDownload,
  FaCalendarAlt,
  FaChartLine,
  FaUsers,
  FaBriefcase,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
  FaStar,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaChartPie,
  FaChartBar,
  FaTrophy,
  FaAward,
  FaRocket,
  FaFilter,
  FaSpinner,
  FaEye,
  FaBuilding,
  FaMapMarkerAlt,
  FaDollarSign,
  FaGraduationCap,
  FaLongArrowAltUp,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ReportsManager = ({ token, stats }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [jobsByDepartment, setJobsByDepartment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");
  const [activeMetric, setActiveMetric] = useState("applications");
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
      color: "#3b82f6",
      bg: "#eff6ff",
      change: "+12%",
      trend: "up"
    },
    {
      id: "shortlisted",
      label: "Shortlisted",
      value: stats.shortlistedCandidates || 0,
      icon: <FaStar />,
      color: "#f59e0b",
      bg: "#fef3c7",
      change: "+8%",
      trend: "up"
    },
    {
      id: "hired",
      label: "Hired",
      value: stats.hiredCandidates || 0,
      icon: <FaTrophy />,
      color: "#10b981",
      bg: "#d1fae5",
      change: "+5%",
      trend: "up"
    },
    {
      id: "activeJobs",
      label: "Active Jobs",
      value: stats.activeJobs || 0,
      icon: <FaBriefcase />,
      color: "#8b5cf6",
      bg: "#ede9fe",
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
      color: "#ff961a"
    },
    {
      id: "appsPerJob",
      label: "Apps per Job",
      value: stats.totalJobs > 0 
        ? Math.round(stats.totalApplications / stats.totalJobs) 
        : 0,
      icon: <FaFileAlt />,
      color: "#3b82f6"
    },
    {
      id: "shortlistRate",
      label: "Shortlist Rate",
      value: stats.totalApplications > 0 
        ? Math.round((stats.shortlistedCandidates / stats.totalApplications) * 100) 
        : 0,
      icon: <FaStar />,
      color: "#f59e0b"
    },
    {
      id: "interviewRate",
      label: "Interview Rate",
      value: stats.totalApplications > 0 
        ? Math.round((stats.totalInterviews / stats.totalApplications) * 100) 
        : 0,
      icon: <FaCalendarAlt />,
      color: "#8b5cf6"
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
            <FaChartLine />
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
            <option value="year">Last Year</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={styles.exportBtn}
            onClick={exportReport}
          >
            <FaDownload /> Export Report
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
            className="metric-card"
            whileHover={{ scale: 1.03, y: -5 }}
            style={styles.metricCard}
          >
            <div style={{ ...styles.metricIcon, background: metric.bg, color: metric.color }}>
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
              <FaChartBar /> Weekly Applications
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
                          ? "linear-gradient(135deg, #ff961a 0%, #f9c349 100%)"
                          : "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)"
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
              <FaChartPie /> Jobs by Department
            </h3>
            <span style={styles.chartSubtitle}>{jobsByDepartment.length} departments</span>
          </div>
          <div style={styles.departmentList}>
            {jobsByDepartment.map((dept, index) => {
              const total = jobsByDepartment.reduce((sum, d) => sum + d.count, 0);
              const percentage = total > 0 ? (dept.count / total) * 100 : 0;
              const colors = ["#f9c349", "#ff961a", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  style={styles.departmentItem}
                >
                  <div style={styles.departmentHeader}>
                    <span style={{ ...styles.departmentDot, background: colors[index % colors.length] }} />
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
                        background: colors[index % colors.length]
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
            <FaRocket /> Key Insights
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
              whileHover={{ scale: 1.05, y: -3 }}
              style={styles.insightItem}
            >
              <div style={{ ...styles.insightIcon, color: insight.color }}>
                {insight.icon}
              </div>
              <div style={styles.insightContent}>
                <div style={styles.insightValue}>
                  {insight.value}%
                </div>
                <div style={styles.insightLabel}>{insight.label}</div>
                <div style={styles.insightTrend}>
                  <FaLongArrowAltUp color="#10b981" size={12} />
                  <span style={{ color: "#10b981" }}>+{Math.floor(Math.random() * 10)}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Stats Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={styles.footerStats}
      >
        <div style={styles.footerStat}>
          <FaEye size={18} color="#94a3b8" />
          <span>Total Views: 2,847</span>
        </div>
        <div style={styles.footerStat}>
          <FaBuilding size={18} color="#94a3b8" />
          <span>Companies: 15</span>
        </div>
        <div style={styles.footerStat}>
          <FaMapMarkerAlt size={18} color="#94a3b8" />
          <span>Locations: 8</span>
        </div>
        <div style={styles.footerStat}>
          <FaDollarSign size={18} color="#94a3b8" />
          <span>Avg Salary: $85,000</span>
        </div>
        <div style={styles.footerStat}>
          <FaGraduationCap size={18} color="#94a3b8" />
          <span>Avg Experience: 5.2 yrs</span>
        </div>
      </motion.div>

      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }

          .metric-card {
            animation: fadeInUp 0.6s ease forwards;
            opacity: 0;
          }
          .metric-card:nth-child(1) { animation-delay: 0.05s; }
          .metric-card:nth-child(2) { animation-delay: 0.1s; }
          .metric-card:nth-child(3) { animation-delay: 0.15s; }
          .metric-card:nth-child(4) { animation-delay: 0.2s; }

          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #f9c349 0%, #ff961a 100%);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #ff961a;
          }
        `}
      </style>
    </motion.div>
  );
};

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    minHeight: "100vh",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    gap: "20px",
  },
  loadingText: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
  },
  loadingBar: {
    width: "200px",
    height: "4px",
    background: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
  },
  loadingProgress: {
    height: "100%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    borderRadius: "4px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    color: "#fff",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "4px",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  dateSelect: {
    padding: "10px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "14px",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.3s ease",
  },
  exportBtn: {
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 4px 15px rgba(255, 150, 26, 0.3)",
    transition: "all 0.3s ease",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },
  metricCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "all 0.3s ease",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  metricIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.5px",
    lineHeight: 1.2,
  },
  metricLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
  },
  metricChange: {
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "28px",
  },
  chartCard: {
    background: "#fff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  chartTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  chartSubtitle: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  barChart: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: "180px",
    padding: "0 4px",
    gap: "8px",
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
    width: "70%",
    minHeight: "4px",
    borderRadius: "4px 4px 0 0",
    transition: "all 0.3s ease",
    position: "relative",
  },
  barTooltip: {
    position: "absolute",
    top: "-30px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#0f172a",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  barLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "8px",
    fontWeight: "500",
  },
  departmentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  departmentItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  departmentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  departmentDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  departmentName: {
    flex: 1,
    fontSize: "13px",
    color: "#0f172a",
    fontWeight: "500",
  },
  departmentCount: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ff961a",
  },
  departmentBar: {
    height: "6px",
    background: "#f1f5f9",
    borderRadius: "3px",
    overflow: "hidden",
    marginLeft: "20px",
  },
  departmentProgress: {
    height: "100%",
    borderRadius: "3px",
    transition: "all 0.3s ease",
  },
  insightsCard: {
    background: "#fff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  insightsHeader: {
    marginBottom: "20px",
  },
  insightsSubtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  insightsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  insightItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  insightIcon: {
    fontSize: "24px",
    flexShrink: 0,
  },
  insightContent: {
    flex: 1,
  },
  insightValue: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  insightLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  insightTrend: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "4px",
    fontSize: "12px",
  },
  footerStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
    padding: "20px",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
  },
  footerStat: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#475569",
    fontWeight: "500",
  },
};

export default ReportsManager;