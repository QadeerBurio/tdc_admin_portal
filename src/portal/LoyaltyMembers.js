// LoyaltyMembers.js: who has a brand's loyalty (server: GET /api/loyalty/brands/me/members, admin
// GET /api/loyalty/admin/programs/:id/members). Totals (members, visits this month, rewards earned / used), a filter
// (all / reward ready / reward used), one row per student ("tdc verified user · university", visits so far / needed,
// rewards earned, rewards used, last visit) and a CSV export with the same fields. Never a name, phone or e-mail.
//   <LoyaltyMembers load={(filter) => …view} loadCsv={(filter) => …csv text} />
import React, { useCallback, useEffect, useState } from "react";
import { Button, Segmented, StatCard, Table, EmptyState, Pill, toast } from "./kit";

const FILTERS = [
  { value: "all", label: "all" },
  { value: "reward-ready", label: "reward ready" },
  { value: "reward-used", label: "reward used" },
];
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–");

export function visitsText(m) {
  return m.visitsNeeded ? `${m.visits} / ${m.visitsNeeded}` : String(m.visits);
}

export default function LoyaltyMembers({ load, loadCsv, title = "members" }) {
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchView = useCallback(async () => {
    try {
      setError("");
      setView(await load(filter));
    } catch (e) {
      setError(e?.message || "could not load members");
    }
  }, [load, filter]);
  useEffect(() => { fetchView(); }, [fetchView]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const text = await loadCsv(filter);
      const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `loyalty-members-${filter}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast(e?.message || "could not export", "bad");
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { key: "student", label: "student", render: (m) => <span>{m.label}{m.university ? ` · ${m.university}` : ""}</span> },
    { key: "visits", label: "visits", render: (m) => <span>{visitsText(m)}{m.rewardReady && <> <Pill tone="yellow">reward ready</Pill></>}</span> },
    { key: "rewardsEarned", label: "rewards earned" },
    { key: "rewardsUsed", label: "rewards used" },
    { key: "lastVisitAt", label: "last visit", render: (m) => day(m.lastVisitAt) },
  ];
  const t = view?.totals;
  return (
    <section data-testid="loyalty-members" aria-label={title}>
      {t && (
        <div className="k-stats" style={{ marginBottom: 12 }}>
          <StatCard label="members" value={t.members} sub="students in the program" icon="users" tone="blue" />
          <StatCard label="visits this month" value={t.visitsThisMonth} icon="check" tone="green" />
          <StatCard label="rewards earned" value={t.rewardsEarned} icon="gift" tone="yellow" />
          <StatCard label="rewards used" value={t.rewardsUsed} icon="star" tone="purple" />
        </div>
      )}
      <div className="k-row" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Segmented label="show members" options={FILTERS} value={filter} onChange={setFilter} />
        <Button variant="secondary" icon="download" onClick={exportCsv} loading={exporting} disabled={!view?.members?.length}>export csv</Button>
      </div>
      {error ? (
        <div className="tdcp-card tdcp-empty" role="alert">{error} <Button size="sm" variant="secondary" onClick={fetchView}>try again</Button></div>
      ) : (
        <Table
          label="loyalty members"
          columns={columns}
          rows={view?.members || []}
          rowKey={(m) => m.studentId}
          loading={!view}
          minWidth={640}
          empty={<EmptyState icon="users" title={filter === "all" ? "no members yet" : filter === "reward-ready" ? "no reward waiting" : "no reward used yet"} text="a student joins with their first confirmed bill at a program offer." />}
        />
      )}
      <p className="k-hint" style={{ marginTop: 8 }}>students are shown as on recent claims: no name, phone or e-mail, in the list or the export.</p>
    </section>
  );
}
