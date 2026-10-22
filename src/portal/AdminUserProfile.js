// AdminUserProfile.js: full profile for one user (design/portal/AdStudentProfile, AdBrandProfile, AdEmployerProfile).
// Shows only what the API returns for that user. The boards also show claims, CV, applications, interviews,
// suspend and "log in as employer"; there are no admin endpoints for those yet, so they are not shown.
import React, { useEffect, useState } from "react";
import api, { usersApi, offersApi, engagementApi } from "../services/api";
import Ico from "./Ico";

const ROLE = {
  student: { list: "all students", icon: "grad", tone: "orange", label: "student" },
  brand: { list: "all brands", icon: "store", tone: "red", label: "brand" },
  employee: { list: "all employers", icon: "hat", tone: "sky", label: "employer" },
  traveler: { list: "all travelers", icon: "compass", tone: "pink", label: "traveler" },
};
const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const rs = (n) => `rs ${fmt(n)}`;
const date = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–");
const val = (v) => (v === undefined || v === null || v === "" ? "–" : String(v));

function Facts({ rows }) {
  return (
    <div className="tdcp-facts">
      {rows.map(([k, v]) => (
        <div className="tdcp-fact" key={k}><span>{k}</span><span>{val(v)}</span></div>
      ))}
    </div>
  );
}

function Card({ title, icon, tone, children, action }) {
  return (
    <section className="tdcp-card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {icon && <Ico kind={icon} tone={tone} size={36} />}
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, flex: 1 }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, icon, tone }) {
  return (
    <div className="tdcp-stat small" style={{ cursor: "default" }}>
      <div className="ico"><Ico kind={icon} tone={tone} size={40} /></div>
      <div className="lbl">{label}</div>
      <div className="num">{value}</div>
    </div>
  );
}

export default function AdminUserProfile({ role, id, onBack }) {
  const meta = ROLE[role] || ROLE.student;
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [extra, setExtra] = useState({});

  useEffect(() => {
    let alive = true;
    setUser(null); setError(""); setExtra({}); setTab("overview");
    (async () => {
      try {
        const u = await usersApi.details(id);
        if (!alive) return;
        if (!u || !u._id) { setError("This user could not be found."); return; }
        setUser(u);
        const r = u.role || role;
        if (r === "student") {
          const [profiles, ledger] = await Promise.all([
            engagementApi.profiles({ limit: 5000 }).catch(() => null),
            engagementApi.userLedger(id, 20).catch(() => null),
          ]);
          const profile = (profiles?.items || []).find((p) => String(p.user?._id || p.user) === String(id)) || null;
          if (alive) setExtra({ profile, ledger: ledger?.items || [] });
        } else if (r === "brand") {
          const [offers, redemptions, branches] = await Promise.all([
            offersApi.byBrand(id).catch(() => []),
            offersApi.brandRedemptions(id).catch(() => null),
            api.get(`/branches/brand/${id}`).then((x) => x.data).catch(() => null),
          ]);
          if (alive) setExtra({
            offers: Array.isArray(offers) ? offers : [],
            stats: redemptions?.stats || {},
            redemptions: Array.isArray(redemptions?.redemptions) ? redemptions.redemptions : [],
            branches: Array.isArray(branches?.branches) ? branches.branches : [],
          });
        }
      } catch (e) {
        if (alive) setError(e?.response?.status === 404 ? "This user could not be found." : "Could not load this profile. Try again.");
      }
    })();
    return () => { alive = false; };
  }, [id, role]);

  const back = (
    <button type="button" className="tdcp-btn tdcp-btn-secondary" onClick={onBack} style={{ height: 38, padding: "0 14px", alignSelf: "flex-start" }}>
      <Ico kind="back" tone="plain" size={16} /> {meta.list}
    </button>
  );

  if (error) return (<>{back}<div className="tdcp-card tdcp-empty">{error}</div></>);
  if (!user) return (<>{back}<div className="tdcp-card tdcp-empty" role="status">loading profile…</div></>);

  const r = user.role || role;
  const name = r === "brand" ? user.brandName || user.name : r === "employee" ? user.companyName || user.name : user.name;
  const uni = user.university?.name;
  const sub = r === "student"
    ? [user.academicLevel, uni, user.city].filter(Boolean).join(" · ")
    : r === "brand" ? [user.category, user.city, user.isOnline && user.isInStore ? "online and in-store" : user.isOnline ? "online" : user.isInStore ? "in-store" : ""].filter(Boolean).join(" · ")
    : [user.city, user.websiteUrl].filter(Boolean).join(" · ");
  const chips = [];
  if (r === "student") {
    if (user.status) chips.push([user.status === "Verified" ? "verified student" : user.status.toLowerCase(), user.status === "Verified" ? "ok" : "warn"]);
    if (user.isAlumni) chips.push(["alumni", ""]);
    if (user.isVip) chips.push(["VIP", "dark"]);
    const lvl = extra.profile?.level?.id; if (lvl) chips.push([String(lvl).replace(/_/g, " "), "warn"]);
  }
  if (r === "brand" && user.brandApprovalStatus) chips.push([user.brandApprovalStatus === "approved" ? "approved" : user.brandApprovalStatus, user.brandApprovalStatus === "approved" ? "ok" : user.brandApprovalStatus === "rejected" ? "bad" : "warn"]);
  if (user.accountStatus && user.accountStatus !== "active") chips.push([user.accountStatus, "bad"]);

  const tabs = r === "student" ? ["overview", "crew", "account"] : r === "brand" ? ["overview", "offers", "redemptions", "account"] : ["overview", "account"];
  const p = extra.profile;

  const account = (
    <Card title="account" icon="shield" tone="sand">
      <Facts rows={[
        ["role", meta.label], ["account status", user.accountStatus || "active"], ["email verified", user.emailVerified === false ? "no" : "yes"],
        ["joined", date(user.createdAt)], ["last updated", date(user.updatedAt)],
        ...(r === "student" ? [["card status", user.cardStatus], ["payment status", user.paymentStatus]] : []),
      ]} />
    </Card>
  );

  let body = null;
  if (tab === "account") body = account;
  else if (r === "student" && tab === "overview") body = (
    <>
      <div className="tdcp-grid-small">
        <Stat label="crew points" value={p ? fmt(p.points?.balance) : "–"} icon="star" tone="orange" />
        <Stat label="lifetime points" value={p ? fmt(p.points?.lifetime) : "–"} icon="award" tone="purple" />
        <Stat label="day streak" value={p ? fmt(p.streak?.count) : "–"} icon="flame" tone="coral" />
        <Stat label="referrals" value={fmt(user.referralCount)} icon="users" tone="blue" />
        <Stat label="saved with tdc" value={p?.stats?.totalSaved != null ? rs(p.stats.totalSaved) : "–"} icon="heart" tone="pink" />
      </div>
      <div className="tdcp-grid-2">
        <Card title="personal" icon="user" tone="orange">
          <Facts rows={[["full name", user.name], ["email", user.email], ["phone", user.phone], ["city", user.city], ["gender", user.gender], ["instagram", user.instagram]]} />
        </Card>
        <Card title="education" icon="grad" tone="blue">
          <Facts rows={[["institute", uni], ["roll no", user.rollNo], ["level", user.academicLevel], ["alumni", user.isAlumni ? "yes" : "no"], ["headline", user.headline], ["skills", (user.skills || []).join(", ")]]} />
        </Card>
      </div>
    </>
  );
  else if (r === "student" && tab === "crew") body = (
    <div className="tdcp-grid-2">
      <Card title="the crew" icon="star" tone="yellow">
        <Facts rows={[
          ["referral code", user.referralCode], ["referred by", user.referredBy?.name || "none"], ["referrals", fmt(user.referralCount)],
          ["level", p?.level?.id ? String(p.level.id).replace(/_/g, " ") : "–"], ["points balance", p ? fmt(p.points?.balance) : "–"],
          ["streak", p ? `${fmt(p.streak?.count)} days (best ${fmt(p.streak?.best)})` : "–"], ["last active", date(p?.lastActiveAt)],
        ]} />
      </Card>
      <Card title="points history" icon="receipt" tone="sand">
        {(extra.ledger || []).length === 0 ? <div className="tdcp-empty" style={{ padding: 12 }}>no points yet.</div> : (
          <div className="tdcp-facts">
            {extra.ledger.map((l) => (
              <div className="tdcp-fact" key={l._id}><span>{String(l.reason || "points").replace(/_/g, " ")} · {date(l.createdAt)}</span><span>{l.delta > 0 ? "+" : ""}{fmt(l.delta)}</span></div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
  else if (r === "brand" && tab === "overview") body = (
    <>
      <div className="tdcp-grid-small">
        <Stat label="offers" value={fmt(extra.offers?.length)} icon="tag" tone="red" />
        <Stat label="redeemed" value={fmt(extra.stats?.totalRedemptions)} icon="check" tone="green" />
        <Stat label="revenue via tdc" value={rs(extra.stats?.totalRevenue)} icon="coin" tone="orange" />
        <Stat label="students saved" value={rs(extra.stats?.totalSaved)} icon="heart" tone="pink" />
        <Stat label="unique students" value={fmt(extra.stats?.uniqueStudents)} icon="users" tone="blue" />
      </div>
      <div className="tdcp-grid-2">
        <Card title="brand details" icon="store" tone="red">
          <Facts rows={[["contact person", user.name], ["email", user.email], ["phone", user.phone], ["category", user.category], ["address", user.address], ["website", user.websiteUrl], ["platform", user.platform]]} />
        </Card>
        <Card title="branches" icon="pin" tone="sky">
          {(extra.branches || []).length === 0 ? <div className="tdcp-empty" style={{ padding: 12 }}>no branches added.</div> : (
            <div className="tdcp-facts">{extra.branches.map((b) => <div className="tdcp-fact" key={b._id}><span>{b.name || b.branchName || "branch"}</span><span>{[b.area, b.city].filter(Boolean).join(", ") || b.address}</span></div>)}</div>
          )}
        </Card>
      </div>
    </>
  );
  else if (r === "brand" && tab === "offers") body = (
    <Card title={`offers (${fmt(extra.offers?.length)})`} icon="tag" tone="red">
      {(extra.offers || []).length === 0 ? <div className="tdcp-empty" style={{ padding: 12 }}>no offers yet.</div> : (
        <div className="tdcp-facts">{extra.offers.map((o) => (
          <div className="tdcp-fact" key={o._id}><span>{o.title}</span><span>{o.discountPercentage != null ? `${o.discountPercentage}% off` : ""}{o.isOnline ? " · online" : ""}{o.isInStore ? " · in-store" : ""}</span></div>
        ))}</div>
      )}
    </Card>
  );
  else if (r === "brand" && tab === "redemptions") body = (
    <Card title={`redemptions (${fmt(extra.redemptions?.length)})`} icon="receipt" tone="blue">
      {(extra.redemptions || []).length === 0 ? <div className="tdcp-empty" style={{ padding: 12 }}>no redemptions yet.</div> : (
        <div className="tdcp-table-wrap">
          <table className="tdcp-table">
            <thead><tr><th>student</th><th>institute</th><th>type</th><th>bill</th><th>saved</th><th>date</th></tr></thead>
            <tbody>{extra.redemptions.slice(0, 100).map((x, i) => (
              <tr key={i} style={{ cursor: "default" }}><td>{x.studentName || "–"}</td><td>{x.university || "–"}</td><td>{x.redemptionType || x.platform || "–"}</td><td>{rs(x.bill)}</td><td>{rs(x.saved)}</td><td>{date(x.date)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
  else body = (
    <>
      <div className="tdcp-grid-2">
        <Card title={r === "employee" ? "company details" : "details"} icon={meta.icon} tone={meta.tone}>
          <Facts rows={r === "employee"
            ? [["company", user.companyName], ["hiring contact", user.name], ["email", user.email], ["phone", user.phone], ["address", user.address], ["website", user.websiteUrl]]
            : [["full name", user.name], ["email", user.email], ["phone", user.phone], ["city", user.city], ["address", user.address]]} />
        </Card>
      </div>
      {r === "employee" && <div className="tdcp-card tdcp-empty">job postings, candidates and interviews for one employer are not available from the API yet.</div>}
    </>
  );

  return (
    <>
      {back}
      <div className="tdcp-head" style={{ alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          {user.logo || user.profileImage || user.avatar
            ? <img src={user.logo || user.profileImage || user.avatar} alt="" style={{ width: 64, height: 64, borderRadius: 32, objectFit: "cover", background: "#F5F2EA", flex: "none" }} />
            : <div className="tdcp-avatar" style={{ width: 64, height: 64, borderRadius: 32, fontSize: 24 }} aria-hidden="true">{(name || "?").charAt(0).toUpperCase()}</div>}
          <div style={{ minWidth: 0 }}>
            <h1 className="tdcp-title" style={{ overflowWrap: "anywhere" }}>{name}<span className="dot" aria-hidden="true">.</span></h1>
            {sub && <p className="tdcp-sub">{sub}</p>}
            {chips.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{chips.map(([t, c]) => <span key={t} className={`tdcp-chip ${c}`}>{t}</span>)}</div>}
          </div>
        </div>
      </div>
      <div className="tdcp-tabs" role="tablist" aria-label="profile sections">
        {tabs.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} className="tdcp-tab" onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {body}
    </>
  );
}
