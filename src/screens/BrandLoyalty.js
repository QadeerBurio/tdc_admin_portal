// BrandLoyalty.js: the brand's loyalty program (FLAG_LOYALTY_V2). Tiers by verified visit (default
// visits 1-5 = 15%, visit 6 onward = 25%), which offers and branches count, the maximum discount, the
// opt-in switch, and the numbers: verified visits, repeat customers, members by tier.
// A visit counts only when the brand confirms the bill (verify student / promo confirm, or a paid order
// on the connected store); claims and QR codes never do.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Ico from "../portal/Ico";
import { PageLoading, Button, IconButton, Field, Input, Textarea, Dropdown, Segmented, StatCard, EmptyState, Pill, Facts, toast } from "../portal/kit";
import loyaltyApi from "../services/loyaltyApi";
import api from "../services/api";
import "./styles/BrandPortal.css";

const DEFAULT_TIERS = [
  { name: "Member", minVisit: 1, maxVisit: 5, discountPct: 15 },
  { name: "Regular", minVisit: 6, maxVisit: null, discountPct: 25 },
];
const blankForm = () => ({
  tiers: DEFAULT_TIERS.map((t) => ({ ...t })),
  maxDiscountPct: 25,
  maxVisitsPerDay: 1,
  resetMonths: 12,
  terms: "",
  eligibleOfferIds: [],
  branchIds: [],
});

// keep tiers contiguous: each tier starts right after the previous one ends, the last has no end
const chain = (tiers) => {
  const out = tiers.map((t) => ({ ...t }));
  out.forEach((t, i) => {
    t.minVisit = i === 0 ? 1 : (Number(out[i - 1].maxVisit) || out[i - 1].minVisit) + 1;
    if (i === out.length - 1) t.maxVisit = null;
    else if (t.maxVisit == null || Number(t.maxVisit) < t.minVisit) t.maxVisit = t.minVisit;
  });
  return out;
};
const ruleText = (t) => (t.maxVisit == null ? `visit ${t.minVisit} onward` : t.minVisit === t.maxVisit ? `visit ${t.minVisit}` : `visits ${t.minVisit}–${t.maxVisit}`);

export default function BrandLoyalty() {
  const { offers = [] } = useOutletContext() || {};
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [program, setProgram] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const flags = await loyaltyApi.flagsMe().catch(() => ({}));
      setEnabled(!!flags.loyaltyV2);
      if (!flags.loyaltyV2) return;
      const [p, a, b] = await Promise.all([
        loyaltyApi.myProgram(),
        loyaltyApi.analytics().catch(() => null),
        api.get("/branches/my-branches").then((r) => r.data?.branches || []).catch(() => []),
      ]);
      setProgram(p);
      setStats(a);
      setBranches(b);
      if (p) {
        setForm({
          tiers: p.tiers.map((t) => ({ name: t.name, minVisit: t.minVisit, maxVisit: t.maxVisit, discountPct: t.discountPct })),
          maxDiscountPct: p.brandMaxDiscountPct ?? p.maxDiscountPct,
          maxVisitsPerDay: p.maxVisitsPerDay,
          resetMonths: p.resetMonths,
          terms: p.terms || "",
          eligibleOfferIds: p.eligibleOfferIds || [],
          branchIds: p.branchIds || [],
        });
      }
    } catch (err) {
      toast(err.message || "couldn't load your loyalty program", "bad");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setTier = (i, key, value) => setForm((f) => ({ ...f, tiers: chain(f.tiers.map((t, j) => (j === i ? { ...t, [key]: value } : t))) }));
  const addTier = () => setForm((f) => {
    const tiers = f.tiers.map((t) => ({ ...t }));
    const last = tiers[tiers.length - 1];
    last.maxVisit = last.minVisit + 4;
    tiers.push({ name: `Tier ${tiers.length + 1}`, minVisit: last.maxVisit + 1, maxVisit: null, discountPct: Math.min(Number(last.discountPct) + 5, Number(f.maxDiscountPct) || 100) });
    return { ...f, tiers: chain(tiers) };
  });
  const removeTier = (i) => setForm((f) => ({ ...f, tiers: chain(f.tiers.filter((_, j) => j !== i)) }));

  const offerOptions = useMemo(() => offers.map((o) => ({ value: String(o._id), label: `${o.title || "offer"} · ${o.discountPercentage || 0}%` })), [offers]);
  const branchOptions = useMemo(() => branches.map((b) => ({ value: String(b._id), label: b.name + (b.city ? ` · ${b.city}` : "") })), [branches]);
  const cap = program?.adminMaxDiscountPct != null ? Math.min(Number(form.maxDiscountPct), program.adminMaxDiscountPct) : Number(form.maxDiscountPct);

  const body = () => ({
    tiers: form.tiers.map((t) => ({ name: t.name, minVisit: Number(t.minVisit), maxVisit: t.maxVisit == null ? null : Number(t.maxVisit), discountPct: Number(t.discountPct) })),
    maxDiscountPct: Number(form.maxDiscountPct),
    maxVisitsPerDay: Number(form.maxVisitsPerDay),
    resetMonths: Number(form.resetMonths),
    terms: form.terms,
    eligibleOfferIds: form.eligibleOfferIds,
    branchIds: form.branchIds,
  });

  const save = async (status) => {
    setSaving(true);
    try {
      const next = program
        ? await loyaltyApi.updateProgram(program.id, { ...body(), ...(status ? { status } : {}), version: program.version })
        : await loyaltyApi.createProgram({ ...body(), ...(status ? { status } : {}) });
      toast(status === "active" ? "loyalty is on: verified visits now count" : status === "paused" ? "loyalty paused: visits stop counting" : "saved", "ok");
      setProgram(next);
      await load();
    } catch (err) {
      toast(err.message, "bad");
      if (err.code === "VERSION_CONFLICT") load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;
  if (!enabled) {
    return (
      <div className="tdcp k-page" data-screen="brand-loyalty">
        <EmptyState icon="star" tone="yellow" title="loyalty is coming soon" text="repeat-visit rewards for your regulars. tdc switches it on for pilot brands first." />
      </div>
    );
  }

  const on = program?.status === "active";
  return (
    <div className="tdcp k-page" data-screen="brand-loyalty">
      <div className="k-head">
        <div className="br-title">
          <Ico kind="star" tone="yellow" size={56} />
          <div>
            <h1>loyalty<span className="dot" aria-hidden="true">.</span></h1>
            <p>reward your regulars: the more verified visits, the bigger the discount.</p>
          </div>
        </div>
        <div className="k-actions">
          {program && <Pill tone={on ? "green" : "sand"} dot>{on ? "on" : program.status === "paused" ? "paused" : program.status === "ended" ? "ended" : "draft"}</Pill>}
        </div>
      </div>

      {stats?.program && (
        <div className="k-stats">
          <StatCard label="verified visits" value={stats.verifiedVisits} icon="check" tone="green" />
          <StatCard label="members" value={stats.members} sub="students with a counted visit" icon="users" tone="blue" />
          <StatCard label="repeat customers" value={stats.repeatCustomers} sub="2 or more visits" icon="star" tone="yellow" />
          <StatCard label="reversals" value={stats.reversals} sub="refunds and corrections" icon="receipt" tone="coral" />
        </div>
      )}

      <section className="k-card pad">
        <div className="k-card-head">
          <Ico kind="tag" tone="red" size={36} />
          <h3>tiers</h3>
        </div>
        <p className="k-hint">a visit is one bill you confirm (verify student, promo code, or a paid order on your store). claims and QR scans don't count.</p>
        {form.tiers.map((t, i) => (
          <div className="k-row" key={i} style={{ alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
            <Field label="tier name" htmlFor={`tier-name-${i}`} style={{ flex: "2 1 140px" }}>
              <Input id={`tier-name-${i}`} value={t.name} maxLength={40} onChange={(e) => setTier(i, "name", e.target.value)} />
            </Field>
            <Field label="from visit" htmlFor={`tier-from-${i}`} style={{ flex: "1 1 90px" }}>
              <Input id={`tier-from-${i}`} value={t.minVisit} readOnly aria-readonly="true" />
            </Field>
            <Field label="to visit" htmlFor={`tier-to-${i}`} style={{ flex: "1 1 90px" }}>
              {t.maxVisit == null
                ? <Input id={`tier-to-${i}`} value="and up" readOnly aria-readonly="true" />
                : <Input id={`tier-to-${i}`} type="number" min={t.minVisit} value={t.maxVisit} onChange={(e) => setTier(i, "maxVisit", Math.max(Number(e.target.value) || t.minVisit, t.minVisit))} />}
            </Field>
            <Field label="discount %" htmlFor={`tier-pct-${i}`} style={{ flex: "1 1 90px" }} error={Number(t.discountPct) > cap ? `max ${cap}%` : undefined}>
              <Input id={`tier-pct-${i}`} type="number" min={1} max={100} value={t.discountPct} invalid={Number(t.discountPct) > cap} onChange={(e) => setTier(i, "discountPct", e.target.value)} />
            </Field>
            {form.tiers.length > 1 && <IconButton icon="trash" label={`remove tier ${i + 1}`} variant="ghost" onClick={() => removeTier(i)} />}
          </div>
        ))}
        <div className="k-row" style={{ gap: 8, flexWrap: "wrap" }}>
          {form.tiers.length < 10 && <Button variant="secondary" icon="plus" onClick={addTier}>add tier</Button>}
          <span className="k-muted">{form.tiers.map((t) => `${ruleText(t)}: ${t.discountPct}%`).join(" · ")}</span>
        </div>
      </section>

      <section className="k-card pad">
        <div className="k-card-head">
          <Ico kind="shield" tone="blue" size={36} />
          <h3>rules</h3>
        </div>
        <div className="k-row" style={{ flexWrap: "wrap", gap: 12 }}>
          <Field label="maximum discount %" hint={program?.adminMaxDiscountPct != null ? `tdc caps this program at ${program.adminMaxDiscountPct}%` : "no tier can go above this"} htmlFor="loy-max" style={{ flex: "1 1 160px" }}>
            <Input id="loy-max" type="number" min={1} max={100} value={form.maxDiscountPct} onChange={(e) => setForm((f) => ({ ...f, maxDiscountPct: e.target.value }))} />
          </Field>
          <Field label="visits that count per day" hint="per student; 0 = no limit" htmlFor="loy-day" style={{ flex: "1 1 160px" }}>
            <Input id="loy-day" type="number" min={0} max={10} value={form.maxVisitsPerDay} onChange={(e) => setForm((f) => ({ ...f, maxVisitsPerDay: e.target.value }))} />
          </Field>
          <Field label="visits expire after (months)" hint="0 = never" htmlFor="loy-reset" style={{ flex: "1 1 160px" }}>
            <Input id="loy-reset" type="number" min={0} max={60} value={form.resetMonths} onChange={(e) => setForm((f) => ({ ...f, resetMonths: e.target.value }))} />
          </Field>
        </div>
        <Field label="offers that count" hint="none selected = all your offers">
          <Dropdown multiple options={offerOptions} value={form.eligibleOfferIds} onChange={(v) => setForm((f) => ({ ...f, eligibleOfferIds: v }))} placeholder="all offers" />
        </Field>
        <Field label="branches that count" hint="none selected = every branch">
          <Dropdown multiple options={branchOptions} value={form.branchIds} onChange={(v) => setForm((f) => ({ ...f, branchIds: v }))} placeholder="every branch" />
        </Field>
        <Field label="terms students see" htmlFor="loy-terms">
          <Textarea id="loy-terms" rows={3} maxLength={1000} value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} placeholder="e.g. one visit a day counts. dine-in only." />
        </Field>
      </section>

      <section className="k-card pad">
        <div className="k-card-head">
          <Ico kind="spark" tone="green" size={36} />
          <h3>loyalty for your brand</h3>
        </div>
        <Segmented
          label="loyalty on or off"
          value={on ? "on" : "off"}
          onChange={(v) => !saving && save(v === "on" ? "active" : program ? "paused" : undefined)}
          options={[{ value: "off", label: "off" }, { value: "on", label: "on" }]}
        />
        <p className="k-hint">{on ? "students earn visits and get their tier's discount when you confirm the bill." : "off: students get your offer's usual discount and no visits count."}</p>
        <div className="k-row" style={{ gap: 8 }}>
          <Button icon="check" loading={saving} onClick={() => save()}>{program ? "save changes" : "save as draft"}</Button>
        </div>
      </section>

      {stats?.program && (
        <section className="k-card pad">
          <div className="k-card-head">
            <Ico kind="users" tone="purple" size={36} />
            <h3>members by tier</h3>
          </div>
          <Facts rows={Object.entries(stats.tierCounts || {}).map(([name, n]) => [name, String(n)])} />
          <p className="k-hint">{stats.creditsNotCounted} confirmed bills didn't count as visits (e.g. a second visit on the same day).</p>
        </section>
      )}
    </div>
  );
}
