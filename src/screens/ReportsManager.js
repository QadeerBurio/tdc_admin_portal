// Reports (design/portal/EmpReports): your hiring numbers from jobs/stats.
import React, { useState, useEffect } from "react";
import axios from "axios";
import Ico from "../portal/Ico";
import { Button, StatCard, EmptyState, PageLoading, toast } from "../portal/kit";
import "./styles/EmployerPortal.css";

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const ReportsManager = ({ token, stats }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [jobsByDepartment, setJobsByDepartment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportStats, setReportStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    hiredApplications: 0,
    totalInterviews: 0,
    upcomingInterviews: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);

  const API_URL = "https://the-deft-crew-production.up.railway.app/api";
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAllReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fetch all report data ──────────────────────────────────────────
  const fetchAllReportData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchWeeklyApplications(),
        fetchJobsByDepartment(),
        fetchRecentApplications(),
      ]);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch stats from /jobs/stats ─────────────────────────────────
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs/stats`, config);
      const data = res.data;
      
      setReportStats({
        totalJobs: data.totalJobs || 0,
        activeJobs: data.activeJobs || 0,
        totalApplications: data.totalApplications || 0,
        pendingApplications: data.pendingApplications || 0,
        shortlistedApplications: data.shortlistedApplications || 0,
        hiredApplications: data.hiredApplications || 0,
        totalInterviews: data.totalInterviews || 0,
        upcomingInterviews: data.upcomingInterviews || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      // Use passed stats as fallback
      if (stats) {
        setReportStats({
          totalJobs: stats.totalJobs || 0,
          activeJobs: stats.activeJobs || 0,
          totalApplications: stats.totalApplications || 0,
          pendingApplications: stats.pendingApplications || 0,
          shortlistedApplications: stats.shortlistedCandidates || 0,
          hiredApplications: stats.hiredCandidates || 0,
          totalInterviews: stats.totalInterviews || 0,
          upcomingInterviews: stats.upcomingInterviews || 0,
        });
      }
    }
  };

  // ─── Fetch weekly applications data ──────────────────────────────
  const fetchWeeklyApplications = async () => {
    try {
      // Try to get real data from stats endpoint which has weeklyApplications
      const res = await axios.get(`${API_URL}/jobs/stats`, config);
      
      setWeeklyData(Array.isArray(res.data.weeklyApplications) ? res.data.weeklyApplications : []);
    } catch (err) {
      console.error("Error fetching weekly applications:", err);
      setWeeklyData([]);
    }
  };

  // ─── Fetch jobs by department ─────────────────────────────────────
  const fetchJobsByDepartment = async () => {
    try {
      // Try to get real data
      const res = await axios.get(`${API_URL}/jobs/stats`, config);
      
      if (res.data.jobsByDepartment && res.data.jobsByDepartment.length > 0) {
        setJobsByDepartment(res.data.jobsByDepartment);
      } else {
        // Generate from my-jobs
        const jobsRes = await axios.get(`${API_URL}/jobs/my-jobs`, config);
        const jobs = jobsRes.data || [];
        const deptMap = {};
        jobs.forEach(job => {
          const dept = job.department || 'Other';
          deptMap[dept] = (deptMap[dept] || 0) + 1;
        });
        const deptData = Object.entries(deptMap).map(([key, value]) => ({
          _id: key,
          count: value
        }));
        setJobsByDepartment(deptData);
      }
    } catch (err) {
      console.error("Error fetching jobs by department:", err);
      setJobsByDepartment([]);
    }
  };

  // ─── Fetch recent applications ────────────────────────────────────
  const fetchRecentApplications = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs/candidates/all?limit=10`, config);
      setRecentApplications(res.data || []);
    } catch (err) {
      console.error("Error fetching recent applications:", err);
      setRecentApplications([]);
    }
  };

  // ─── Export Report ─────────────────────────────────────────────────
  const exportReport = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs/candidates/export`, config);
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
      toast("Failed to export report");
    }
  };

  const convertToCSV = (data) => {
    if (!data || !data.length) return '';
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

  const weekTotal = weeklyData.reduce((sum, d) => sum + (d.count || 0), 0);
  const maxApplications = Math.max(...weeklyData.map((d) => d.count || 0), 1);
  const deptTotal = jobsByDepartment.reduce((sum, d) => sum + (d.count || 0), 0);
  const s = reportStats;

  if (loading) return <div className="tdcp k-page"><PageLoading label="Generating reports..." /></div>;

  return (
    <div className="tdcp k-page" data-screen="employer-reports">
      <div className="k-head">
        <div className="emp-title">
          <Ico kind="chart" tone="green" size={56} />
          <div>
            <h1>reports<span className="dot" aria-hidden="true">.</span></h1>
            <p>your hiring numbers. {weekTotal} applications in the last 7 days.</p>
          </div>
        </div>
        <div className="k-actions">
          <Button variant="secondary" icon="download" onClick={exportReport}>export report</Button>
        </div>
      </div>

      <div className="k-stats">
        <StatCard label="total applications" value={s.totalApplications || 0} sub={`${s.pendingApplications || 0} pending`} icon="users" tone="blue" />
        <StatCard label="shortlisted" value={s.shortlistedApplications || 0} icon="star" tone="orange" />
        <StatCard label="hired" value={s.hiredApplications || 0} icon="trophy" tone="green" />
        <StatCard label="active jobs" value={s.activeJobs || 0} sub={`of ${s.totalJobs || 0} posted`} icon="briefcase" tone="coral" />
      </div>

      <div className="er-grid">
        <section className="k-card er-card">
          <div className="er-card-head">
            <h2>weekly applications</h2>
            <span>last 7 days · {weekTotal} total</span>
          </div>
          {weeklyData.length > 0 ? (
            <div className="er-bars" role="img" aria-label={`applications in the last 7 days: ${weeklyData.map((d) => `${d.date} ${d.count}`).join(", ")}`}>
              {weeklyData.map((d, i) => (
                <div className="er-bar" key={i}>
                  <b>{d.count}</b>
                  <div className="er-bar-track"><div className="er-bar-fill" style={{ height: `${Math.max(3, ((d.count || 0) / maxApplications) * 100)}%` }} /></div>
                  <span>{String(d.date).toLowerCase()}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="chart" tone="green" title="no applications yet" text="applications will show here as students apply to your roles." />
          )}
        </section>

        <section className="k-card er-card">
          <div className="er-card-head">
            <h2>jobs by department</h2>
            <span>{jobsByDepartment.length} {jobsByDepartment.length === 1 ? "department" : "departments"}</span>
          </div>
          {jobsByDepartment.length > 0 ? (
            <div className="er-depts">
              {jobsByDepartment.map((d) => (
                <div key={d._id || "other"}>
                  <div className="er-dept-row"><b>{d._id || "Other"}</b><span>{d.count} {d.count === 1 ? "job" : "jobs"} · {pct(d.count, deptTotal)}%</span></div>
                  <div className="er-dept-track"><div style={{ width: `${pct(d.count, deptTotal)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="briefcase" tone="coral" title="no jobs yet" text="post a job and its department shows here." />
          )}
        </section>
      </div>

      <section className="er-glance">
        <h2>at a glance<span aria-hidden="true">.</span></h2>
        <div className="er-glance-grid">
          <div><b>{pct(s.hiredApplications, s.totalApplications)}%</b><span>hiring rate</span></div>
          <div><b>{s.totalJobs > 0 ? Math.round(s.totalApplications / s.totalJobs) : 0}</b><span>applications per job</span></div>
          <div><b>{pct(s.shortlistedApplications, s.totalApplications)}%</b><span>shortlist rate</span></div>
          <div><b>{pct(s.totalInterviews, s.totalApplications)}%</b><span>interview rate</span></div>
        </div>
      </section>
    </div>
  );
};

export default ReportsManager;
