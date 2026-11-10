// CareerInterviews.js: the employer's interviews on the hiring timeline (FLAG_CAREER_TIMELINE), at /interviews for
// pilot employers (server: GET /api/career/employers/me/interviews, scoped to their own jobs). An agenda by day
// (Karachi): time, candidate, job, how to join, status; per job, by status, upcoming or past. Scheduling, moving and
// cancelling stay in the candidate's drawer on the candidates page; the classic interviews list is one click away.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PageLoading, Button, Select, Segmented, EmptyState, Pill, StatCard, toast } from "../portal/kit";
import careerApi from "../services/careerApi";

const STATUS_TONE = { invited: "yellow", accepted: "green", reschedule_requested: "orange", declined: "sand", cancelled: "sand", completed: "blue", candidate_no_show_reported: "red", employer_no_show_reported: "red", disputed: "red" };
const KARACHI = "Asia/Karachi";
const dayKey = (iso) => new Date(new Date(iso).getTime() + 5 * 3600e3).toISOString().slice(0, 10);
const dayLabel = (iso) => new Date(iso).toLocaleDateString("en-GB", { timeZone: KARACHI, weekday: "long", day: "numeric", month: "long", year: "numeric" });
const time = (iso) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: KARACHI, hour: "2-digit", minute: "2-digit" });
const safeLink = (u) => (/^https:\/\//i.test(String(u || "")) ? u : null);

// group by Karachi day, in order
export function byDay(list) {
  const map = new Map();
  for (const iv of list) {
    const k = dayKey(iv.startsAt);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(iv);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => ({ key, label: dayLabel(items[0].startsAt), items }));
}

export default function CareerInterviews({ onClassic }) {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [when, setWhen] = useState("upcoming");
  const [list, setList] = useState(null);
  useEffect(() => { careerApi.pipeline().then((d) => setJobs(d.jobs || [])).catch(() => setJobs([])); }, []);
  const load = useCallback(async () => {
    setList(null);
    const nowIso = new Date().toISOString();
    try {
      const d = await careerApi.employerInterviews({ ...(jobId ? { jobId } : {}), ...(status ? { status } : {}), ...(when === "upcoming" ? { from: nowIso } : when === "past" ? { to: nowIso } : {}) });
      setList(when === "past" ? [...d.interviews].reverse() : d.interviews);
    } catch (e) { toast(e.message, "bad"); setList([]); }
  }, [jobId, status, when]);
  useEffect(() => { load(); }, [load]);
  const days = useMemo(() => (list ? byDay(list) : []), [list]);
  const week = useMemo(() => (list || []).filter((i) => new Date(i.startsAt) - Date.now() < 7 * 864e5 && new Date(i.startsAt) >= Date.now()).length, [list]);

  return (
    <div className="tdcp k-page" data-screen="career-interviews">
      <PageHeader
        title="interviews"
        sub="your interviews on the hiring timeline, by day (Karachi time). schedule, move or cancel one from the candidate's card."
        actions={<>
          <Select aria-label="job" value={jobId} onChange={(e) => setJobId(e.target.value)} style={{ minWidth: 190 }}>
            <option value="">all jobs</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}{j.archived ? " (deleted)" : ""}</option>)}
          </Select>
          <Select aria-label="status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">every status</option>
            {Object.keys(STATUS_TONE).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </Select>
          {onClassic && <Button variant="secondary" onClick={onClassic}>classic list</Button>}
        </>}
      />
      <div className="k-row" style={{ gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Segmented label="when" value={when} onChange={setWhen} options={[{ value: "upcoming", label: "upcoming" }, { value: "past", label: "past" }, { value: "all", label: "all" }]} />
        {when === "upcoming" && list && <StatCard label="in the next 7 days" value={week} icon="calendar" tone="purple" />}
      </div>
      {!list ? <PageLoading /> : days.length === 0 ? (
        <EmptyState icon="calendar" tone="purple" title={when === "upcoming" ? "no upcoming interviews" : "no interviews"} text="schedule one from a candidate's card on the candidates page." action={<Link to="/candidate" className="k-btn secondary">go to candidates</Link>} />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {days.map((d) => (
            <section key={d.key} className="k-card pad" aria-label={d.label} data-day={d.key}>
              <h3 style={{ marginTop: 0 }}>{d.label}</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {d.items.map((i) => (
                  <li key={i.id} data-interview={i.id} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "10px 0", borderTop: "1px solid var(--line-soft)" }}>
                    <strong style={{ minWidth: 56 }}>{time(i.startsAt)}</strong>
                    <span style={{ flex: "1 1 220px" }}>{i.candidate.firstName} · {i.job.title}
                      <span className="k-muted" style={{ display: "block", fontSize: 12.5 }}>
                        {i.mode === "online" ? (safeLink(i.meetingLink) ? <a href={safeLink(i.meetingLink)} target="_blank" rel="noopener noreferrer">online: join link</a> : "online") : i.mode === "in-person" ? `in person${i.location ? `: ${i.location}` : ""}` : "phone"}
                        {i.rescheduled ? ` · moved ${i.rescheduled}×` : ""}
                      </span>
                    </span>
                    <Pill tone={STATUS_TONE[i.status] || "sand"}>{i.status.replace(/_/g, " ")}</Pill>
                    <Button size="sm" variant="secondary" icon="download" onClick={() => careerApi.downloadIcs(i.id).catch((e) => toast(e.message, "bad"))} aria-label={`calendar file for ${i.candidate.firstName}'s interview`}>.ics</Button>
                    <Link to={`/candidate/${i.applicationId}`} className="k-btn secondary sm" aria-label={`open ${i.candidate.firstName}'s profile`}>profile</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
