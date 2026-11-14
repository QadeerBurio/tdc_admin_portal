// AdminFeatures.js: admin "features" page (oversight menu). One tab per feature that can be set per account:
// - "default for all students / brands / employers": one switch per role the feature has a default for, ON unless an
//   admin turned it off; a change asks for a reason and a confirm ("turn off for every brand"); server:
//   PUT /api/admin/features/defaults/:flag { role }. Shown with who set it, when and why.
// - every account forced on or forced off (server: GET /api/admin/features/flag/:flag), newest first, with who and
//   why, and "reset to default" (asks for a reason; the admin log keeps it).
// The Railway state is shown as counts only.
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import featuresApi from "../services/featuresApi";
import { PageHeader, PageLoading, Tabs, Table, Button, Pill, EmptyState, Card, toast } from "../portal/kit";
import FeatureReasonDialog from "../portal/FeatureReasonDialog";
import { Switch } from "../portal/AccountFeatures";

const ONE = { student: "student", brand: "brand", employee: "employer" };
const MANY = { student: "students", brand: "brands", employee: "employers" };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const PAGE = 50;
const ROLE_LABEL = { student: "student", brand: "brand", employee: "employer" };
const date = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–");

export default function AdminFeatures() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState(null);
  const [error, setError] = useState("");
  const [flag, setFlag] = useState("");
  const [list, setList] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [removing, setRemoving] = useState(null); // account row to reset to default
  const [defaulting, setDefaulting] = useState(null); // { role, enabled }: a role's default

  const loadFlags = useCallback(async () => {
    try {
      const f = await featuresApi.flags();
      setFlags(f);
      setFlag((cur) => cur || f[0]?.flag || "");
    } catch (e) {
      setError(e?.message || "could not load features");
    }
  }, []);
  useEffect(() => { loadFlags(); }, [loadFlags]);

  const loadList = useCallback(async (offset = 0) => {
    if (!flag) return;
    setLoadingList(true);
    try {
      const page = await featuresApi.list(flag, { offset, limit: PAGE });
      setList((prev) => (offset && prev ? { ...page, accounts: [...prev.accounts, ...page.accounts] } : page));
    } catch (e) {
      toast(e?.message || "could not load the list");
    } finally {
      setLoadingList(false);
    }
  }, [flag]);
  useEffect(() => { setList(null); loadList(0); }, [loadList]);

  if (error) return <div className="tdcp k-page"><EmptyState icon="alert" tone="red" title="could not load features" text={error} action={<Button onClick={() => { setError(""); loadFlags(); }}>try again</Button>} /></div>;
  if (!flags) return <div className="tdcp k-page"><PageLoading label="loading features…" /></div>;

  const f = flags.find((x) => x.flag === flag);
  const remove = async (reason) => {
    await featuresApi.setState(removing.id, flag, "default", reason); // throws: the dialog shows the error
    toast(`${f.label} for ${removing.name || "the account"}: back to the default: saved`);
    setRemoving(null);
    await Promise.all([loadList(0), loadFlags()]);
  };
  const saveDefault = async (reason) => {
    await featuresApi.setDefault(flag, defaulting.enabled, reason, defaulting.role); // throws: the dialog shows the error
    toast(`${f.label}: ${defaulting.enabled ? "on" : "off"} for every ${ONE[defaulting.role]}: saved`);
    setDefaulting(null);
    await loadFlags();
  };
  // the default per role this feature has one for: { student: { enabled, set, reason, setAt, setBy }, brand: … }
  const defaults = f?.defaults || (f?.studentDefault ? { student: { ...f.studentDefault, set: !!f.studentDefault.setAt } } : {});
  const roleDefaults = ["student", "brand", "employee"].filter((r) => defaults[r]);

  const columns = [
    { key: "name", label: "account", render: (r) => (r.role
      ? <button type="button" className="k-linkbtn" style={{ background: "none", border: 0, padding: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit", textAlign: "left" }} onClick={() => navigate(`/admin/users/${r.role}/${r.id}`)}>{r.name || "(no name)"}</button>
      : r.name) },
    { key: "role", label: "role", render: (r) => ROLE_LABEL[r.role] || r.role || "–" },
    { key: "university", label: "university", render: (r) => r.university || "–" },
    { key: "forced", label: "state", render: (r) => (r.forced === "off" ? <Pill tone="red">forced off</Pill> : <Pill tone="green">forced on</Pill>) },
    { key: "setBy", label: "set by", render: (r) => r.setBy?.name || "admin" },
    { key: "reason", label: "reason", style: { maxWidth: 320, overflowWrap: "anywhere" } },
    { key: "setAt", label: "when", render: (r) => date(r.setAt) },
    { key: "rail", label: "", render: (r) => (r.fromRailway ? <Pill tone="blue" title="also listed in Railway">also in Railway</Pill> : null) },
    { key: "act", label: "", render: (r) => <Button size="sm" variant="secondary" icon="refresh" onClick={() => setRemoving(r)} aria-label={`reset ${f?.label} to default for ${r.name || "account"}`}>reset to default</Button> },
  ];

  return (
    <div className="tdcp k-page" data-screen="admin-features">
      <PageHeader title="features" sub="every feature is on by default for the accounts that can use it. Switch a role's default off here, or one account off from its profile's features tab (or many from a list: select → Features…)." actions={<Button variant="secondary" icon="refresh" onClick={() => { loadFlags(); loadList(0); }}>Refresh</Button>} />
      <Tabs label="features" value={flag} onChange={setFlag} tabs={flags.map((x) => ({ id: x.flag, label: x.label, count: (x.adminAccessCount || 0) + (x.forcedOffCount || 0) }))} />
      {f && (
        <Card style={{ margin: "16px 0" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <strong>{f.label}</strong>
            <span className="k-hint">for {f.roles.map((r) => ROLE_LABEL[r] || r).join(" / ")} accounts</span>
            {f.killed ? <Pill tone="red">kill switch on in Railway: off for everyone</Pill> : <Pill tone="sand">Railway: {f.railway || "not set"}</Pill>}
            {f.railwayIdCount > 0 && <Pill tone="blue">also on through Railway: {f.railwayIdCount} id{f.railwayIdCount === 1 ? "" : "s"}</Pill>}
          </div>
          {roleDefaults.map((role) => {
            const d = defaults[role];
            const on = d.enabled === true;
            return (
              <div key={role} data-testid={role === "student" ? "student-default" : `${role}-default`} data-role={role} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: "1px solid #ECE7DA" }}>
                <Switch
                  checked={on}
                  disabled={f.killed}
                  label={`${f.label}: default for all ${MANY[role]} ${on ? "on" : d.enabled === false ? "off" : "not set"}`}
                  onClick={() => setDefaulting({ role, enabled: !on })}
                />
                <strong>default for all {MANY[role]}</strong>
                <Pill tone={on ? "green" : d.enabled === false ? "red" : "sand"}>{on ? (d.set ? "on" : "on by default") : d.enabled === false ? "off" : "not set: Railway decides"}</Pill>
                {d.set && d.setAt && <span className="k-hint" style={{ flexBasis: "100%" }}>set {d.enabled ? "on" : "off"} by {d.setBy?.name || "admin"} on {date(d.setAt)}: “{d.reason}”</span>}
                <span className="k-hint" style={{ flexBasis: "100%" }}>{cap(MANY[role])} forced off stay off. Only {MANY[role]} are affected.{f.killed ? " The Railway kill switch is on: off for everyone." : ""}</span>
              </div>
            );
          })}
        </Card>
      )}
      <Table
        label={`accounts with ${f?.label || "this feature"}`}
        columns={columns}
        rows={list?.accounts || []}
        rowKey={(r) => r.id}
        loading={!list && loadingList}
        minWidth={980}
        empty={<EmptyState icon="settings" title={`no account is forced on or off for ${f?.label || "this feature"}`} text="Force one from a profile's features tab, or select accounts on a list and use Features…" />}
      />
      {list && list.accounts.length < list.total && (
        <div style={{ marginTop: 12 }}><Button variant="secondary" onClick={() => loadList(list.accounts.length)} loading={loadingList}>load more ({list.total - list.accounts.length} left)</Button></div>
      )}
      {removing && (
        <FeatureReasonDialog
          title={`reset ${f?.label} to default`}
          sub={`for ${removing.name || "this account"}: the default decides again (forced ${removing.forced === "off" ? "off" : "on"} until now)`}
          confirmLabel="reset to default"
          onConfirm={remove}
          onClose={() => setRemoving(null)}
        />
      )}
      {defaulting && (
        <FeatureReasonDialog
          title={`turn ${defaulting.enabled ? "on" : "off"} ${f?.label} for every ${ONE[defaulting.role]}`}
          sub={defaulting.enabled
            ? `Every ${ONE[defaulting.role]} gets it, except those an admin forced off. Only ${MANY[defaulting.role]} are affected.`
            : `Every ${ONE[defaulting.role]} loses it, also those on the Railway list, except those an admin forced on. Only ${MANY[defaulting.role]} are affected.`}
          confirmLabel={`turn ${defaulting.enabled ? "on" : "off"} for every ${ONE[defaulting.role]}`}
          onConfirm={saveDefault}
          onClose={() => setDefaulting(null)}
        />
      )}
    </div>
  );
}
