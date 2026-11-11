// AdminFeatures.js: admin "features" page (oversight menu). One tab per feature that can be turned on per account;
// each lists every account with admin access (server: GET /api/admin/features/flag/:flag), newest first, with who
// turned it on and why, and a Remove button (asks for a reason; the admin log keeps it). The Railway state is shown
// as counts only: accounts listed in Railway keep the feature until they're removed there.
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import featuresApi from "../services/featuresApi";
import { PageHeader, PageLoading, Tabs, Table, Button, Pill, EmptyState, Card, toast } from "../portal/kit";
import FeatureReasonDialog from "../portal/FeatureReasonDialog";

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
  const [removing, setRemoving] = useState(null); // account row

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
    await featuresApi.set(removing.id, flag, false, reason); // throws: the dialog shows the error
    toast(`${f.label} removed for ${removing.name || "the account"}: saved`);
    setRemoving(null);
    await Promise.all([loadList(0), loadFlags()]);
  };

  const columns = [
    { key: "name", label: "account", render: (r) => (r.role
      ? <button type="button" className="k-linkbtn" style={{ background: "none", border: 0, padding: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit", textAlign: "left" }} onClick={() => navigate(`/admin/users/${r.role}/${r.id}`)}>{r.name || "(no name)"}</button>
      : r.name) },
    { key: "role", label: "role", render: (r) => ROLE_LABEL[r.role] || r.role || "–" },
    { key: "university", label: "university", render: (r) => r.university || "–" },
    { key: "setBy", label: "turned on by", render: (r) => r.setBy?.name || "admin" },
    { key: "reason", label: "reason", style: { maxWidth: 320, overflowWrap: "anywhere" } },
    { key: "setAt", label: "when", render: (r) => date(r.setAt) },
    { key: "rail", label: "", render: (r) => (r.fromRailway ? <Pill tone="blue" title="also listed in Railway: stays on after Remove">also in Railway</Pill> : null) },
    { key: "act", label: "", render: (r) => <Button size="sm" variant="secondary" icon="trash" onClick={() => setRemoving(r)} aria-label={`remove ${f?.label} for ${r.name || "account"}`}>remove</Button> },
  ];

  return (
    <div className="tdcp k-page" data-screen="admin-features">
      <PageHeader title="features" sub="who has each feature turned on from the admin portal. Turn one on from a profile's features tab, or for many accounts from a list: select → Features…" actions={<Button variant="secondary" icon="refresh" onClick={() => { loadFlags(); loadList(0); }}>Refresh</Button>} />
      <Tabs label="features" value={flag} onChange={setFlag} tabs={flags.map((x) => ({ id: x.flag, label: x.label, count: x.adminAccessCount }))} />
      {f && (
        <Card style={{ margin: "16px 0" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <strong>{f.label}</strong>
            <span className="k-hint">for {f.roles.map((r) => ROLE_LABEL[r] || r).join(" / ")} accounts</span>
            {f.killed ? <Pill tone="red">kill switch on in Railway: off for everyone</Pill> : <Pill tone="sand">Railway: {f.railway || "not set"}</Pill>}
            {f.railwayIdCount > 0 && <Pill tone="blue">also on through Railway: {f.railwayIdCount} id{f.railwayIdCount === 1 ? "" : "s"}</Pill>}
          </div>
        </Card>
      )}
      <Table
        label={`accounts with ${f?.label || "this feature"}`}
        columns={columns}
        rows={list?.accounts || []}
        rowKey={(r) => r.id}
        loading={!list && loadingList}
        minWidth={980}
        empty={<EmptyState icon="settings" title={`no account has ${f?.label || "this feature"} from the admin portal`} text="Turn it on from a profile's features tab, or select accounts on a list and use Features…" />}
      />
      {list && list.accounts.length < list.total && (
        <div style={{ marginTop: 12 }}><Button variant="secondary" onClick={() => loadList(list.accounts.length)} loading={loadingList}>load more ({list.total - list.accounts.length} left)</Button></div>
      )}
      {removing && (
        <FeatureReasonDialog
          title={`remove ${f?.label}`}
          sub={`for ${removing.name || "this account"}${removing.fromRailway ? ": it stays on, because it's also listed in Railway" : ""}`}
          confirmLabel="remove"
          onConfirm={remove}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
