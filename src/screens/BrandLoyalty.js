// BrandLoyalty.js: the brand's loyalty program (FLAG_LOYALTY_V2). Tiers by verified visit (default
// visits 1-5 = 15%, visit 6 onward = 25%), which offers and branches count, the maximum discount, the
// dates it runs, and the numbers: verified visits, repeat customers, members by tier.
// Flow: save a draft -> preview the card students will see -> publish -> pause or edit -> end (final).
// A visit counts only when the brand confirms the bill (verify student / promo confirm, or a paid order
// on the connected store); claims and QR codes never do.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Ico from "../portal/Ico";
import { PageLoading, Button, IconButton, Field, Input, Textarea, Dropdown, DateInput, Modal, Segmented, StatCard, EmptyState, Pill, Facts, toast, confirmDialog } from "../portal/kit";
import LoyaltyPreview, { ruleText } from "../portal/LoyaltyPreview";
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
  startDate: "",
  endDate: "",
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

// dates: the brand picks days; the program starts at the start of the first and ends at the end of the last (local time)
const pad = (n) => String(n).padStart(2, "0");
export const toDay = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const startOfDay = (day) => (day ? new Date(`${day}T00:00:00`).toISOString() : null);
const endOfDay = (day) => (day ? new Date(`${day}T23:59:59.999`).toISOString() : null);

// what the brand sees as the program's state, including dates
export function phaseOf(p, now = new Date()) {
  if (!p) return { key: "none", label: "not set up", tone: "sand" };
  if (p.status === "ended") return { key: "ended", label: "ended", tone: "sand" };
  if (p.status === "paused") return { key: "paused", label: "paused", tone: "sand" };
  if (p.status === "draft") return { key: "draft", label: "draft", tone: "sand" };
  if (p.startsAt && new Date(p.startsAt) > now) return { key: "scheduled", label: "scheduled", tone: "blue" };
  if (p.endsAt && new Date(p.endsAt) < now) return { key: "finished", label: "past its end date", tone: "orange" };
  return { key: "on", label: "on", tone: "green" };
}

export default function BrandLoyalty() {
  const { offers = [], brandName = "" } = useOutletContext() || {};
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [program, setProgram] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewVisits, setPreviewVisits] = useState("0");

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
          startDate: toDay(p.startsAt),
          endDate: toDay(p.endsAt),
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

  const tiersForSave = () => form.tiers.map((t) => ({ name: t.name, minVisit: Number(t.minVisit), maxVisit: t.maxVisit == null ? null : Number(t.maxVisit), discountPct: Number(t.discountPct) }));
  const body = () => ({
    tiers: tiersForSave(),
    maxDiscountPct: Number(form.maxDiscountPct),
    maxVisitsPerDay: Number(form.maxVisitsPerDay),
    resetMonths: Number(form.resetMonths),
    terms: form.terms,
    eligibleOfferIds: form.eligibleOfferIds,
    branchIds: form.branchIds,
    startsAt: startOfDay(form.startDate),
    endsAt: endOfDay(form.endDate),
  });

  const dateError = form.startDate && form.endDate && form.endDate < form.startDate ? "the end date must be on or after the start date" : null;
  const endInPast = form.endDate && new Date(endOfDay(form.endDate)) < new Date();
  const tierError = form.tiers.some((t) => Number(t.discountPct) > cap);
  const invalid = !!dateError || tierError;

  const save = async (status) => {
    if (invalid && status !== "paused" && status !== "ended") { toast("fix the highlighted fields first", "bad"); return false; }
    setSaving(true);
    try {
      // pausing or ending changes only the status; the rest is saved with "save changes" or "publish"
      const payload = status === "paused" || status === "ended" ? { status } : { ...body(), ...(status ? { status } : {}) };
      const next = program
        ? await loyaltyApi.updateProgram(program.id, { ...payload, version: program.version })
        : await loyaltyApi.createProgram(payload);
      toast(
        status === "active" ? (form.startDate && new Date(startOfDay(form.startDate)) > new Date() ? "published: visits start counting on the start date" : "published: verified visits now count")
          : status === "paused" ? "loyalty paused: visits stop counting"
            : status === "ended" ? "loyalty ended: visits no longer count"
              : program ? "changes saved" : "saved as a draft",
        "ok"
      );
      setProgram(next);
      await load();
      return true;
    } catch (err) {
      toast(err.message, "bad");
      if (err.code === "VERSION_CONFLICT") load();
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (await save("active")) setPreview(false);
  };
  const endProgram = async () => {
    const ok = await confirmDialog(
      "Students stop earning visits and discounts from this program right away. Visits already counted stay in your numbers. Ending is final for this program.",
      { title: "end your loyalty program?", confirmLabel: "end program" }
    );
    if (ok) await save("ended");
  };

  const restart = async () => {
    const ok = await confirmDialog(
      "This makes a new draft of your program with the same rules. Every student starts again from 0 visits: visits from before the end never count again. Nothing is live until you publish.",
      { title: "restart your loyalty program?", confirmLabel: "restart as a draft", danger: false }
    );
    if (!ok) return;
    setSaving(true);
    try {
      const next = await loyaltyApi.restartProgram(program.id, { version: program.version });
      setProgram(next);
      toast("restarted as a draft: preview it, then publish", "ok");
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

  const phase = phaseOf(program);
  const ended = phase.key === "ended";
  const live = program?.status === "active";
  const previewProps = {
    brandName,
    tiers: tiersForSave(),
    maxVisitsPerDay: form.maxVisitsPerDay,
    resetMonths: form.resetMonths,
    terms: form.terms,
    startsAt: startOfDay(form.startDate),
    endsAt: endOfDay(form.endDate),
    visits: Math.max(0, Number(previewVisits) || 0),
  };

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
          {program && <Pill tone={phase.tone} dot>{phase.label}</Pill>}
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

      {ended && (
        <section className="k-card pad" aria-label="program ended">
          <div className="k-card-head">
            <Ico kind="info" tone="sand" size={36} />
            <h3>this program has ended</h3>
          </div>
          <p className="k-hint">visits no longer count and students get your offer's usual discount. the visits already counted stay in your numbers below.</p>
          <p className="k-hint">restarting makes a new draft of this program (same rules, no dates). every student starts again from 0 visits; visits from before never count again.</p>
          <Button icon="refresh" loading={saving} onClick={restart}>restart as a new draft</Button>
        </section>
      )}

      <fieldset disabled={ended} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
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
              {form.tiers.length > 1 && !ended && <IconButton icon="trash" label={`remove tier ${i + 1}`} variant="ghost" onClick={() => removeTier(i)} />}
            </div>
          ))}
          <div className="k-row" style={{ gap: 8, flexWrap: "wrap" }}>
            {form.tiers.length < 10 && !ended && <Button variant="secondary" icon="plus" onClick={addTier}>add tier</Button>}
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
          <div className="k-row" style={{ flexWrap: "wrap", gap: 12 }}>
            <Field label="start date" hint="empty = as soon as you publish" htmlFor="loy-start" style={{ flex: "1 1 160px" }}>
              <DateInput id="loy-start" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </Field>
            <Field label="end date" hint={endInPast ? "this date has passed: visits won't count" : "empty = no end date; it stops counting after this day"} htmlFor="loy-end" style={{ flex: "1 1 160px" }} error={dateError || undefined}>
              <DateInput id="loy-end" value={form.endDate} aria-invalid={dateError ? "true" : undefined} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </Field>
          </div>
          <Field label="offers that count" hint="none selected = all your offers">
            <Dropdown multiple options={offerOptions} value={form.eligibleOfferIds} onChange={(v) => setForm((f) => ({ ...f, eligibleOfferIds: v }))} placeholder="all offers" disabled={ended} />
          </Field>
          <Field label="branches that count" hint="none selected = every branch">
            <Dropdown multiple options={branchOptions} value={form.branchIds} onChange={(v) => setForm((f) => ({ ...f, branchIds: v }))} placeholder="every branch" disabled={ended} />
          </Field>
          <Field label="terms students see" htmlFor="loy-terms">
            <Textarea id="loy-terms" rows={3} maxLength={1000} value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} placeholder="e.g. one visit a day counts. dine-in only." />
          </Field>
        </section>
      </fieldset>

      {!ended && (
        <section className="k-card pad">
          <div className="k-card-head">
            <Ico kind="spark" tone="green" size={36} />
            <h3>loyalty for your brand</h3>
          </div>
          <p className="k-hint">
            {!program ? "save a draft, preview the card students will see, then publish."
              : live ? (phase.key === "scheduled" ? "published: visits start counting on the start date. changes you save apply straight away."
                : phase.key === "finished" ? "the end date has passed, so visits no longer count. change the end date, or end the program."
                  : "students earn visits and get their tier's discount when you confirm the bill. changes you save apply straight away.")
                : program.status === "paused" ? "paused: students get your offer's usual discount and no visits count. publish to turn it back on."
                  : "draft: nothing counts yet. preview it, then publish."}
          </p>
          <div className="k-row" style={{ gap: 8, flexWrap: "wrap" }}>
            <Button variant="secondary" icon="check" loading={saving} disabled={invalid} onClick={() => save()}>{program ? "save changes" : "save as draft"}</Button>
            <Button variant={live ? "secondary" : "primary"} icon="eye" disabled={invalid} onClick={() => setPreview(true)}>{live ? "preview" : "preview and publish"}</Button>
            {live && <Button variant="secondary" icon="pause" loading={saving} onClick={() => save("paused")}>pause</Button>}
            {program && <Button variant="danger" icon="xCircle" loading={saving} onClick={endProgram}>end program</Button>}
          </div>
        </section>
      )}

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

      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        title="preview: what students see"
        sub="the loyalty card on your offer screen in the app"
        icon="eye"
        tone="yellow"
        footer={<>
          <Button variant="secondary" onClick={() => setPreview(false)}>{live ? "close" : "back to editing"}</Button>
          {!live && <Button icon="check" loading={saving} onClick={publish}>publish</Button>}
        </>}
      >
        <div style={{ marginBottom: 12 }}>
          <span className="k-hint" id="loy-prev-label" style={{ display: "block", marginBottom: 6 }}>as a student with this many verified visits</span>
          <Segmented
            label="verified visits in the preview"
            value={previewVisits}
            onChange={setPreviewVisits}
            options={[...new Set([0, ...form.tiers.map((t) => t.minVisit - 1).filter((n) => n > 0), Math.max(...form.tiers.map((t) => t.minVisit))])].sort((a, b) => a - b).slice(0, 6).map((n) => ({ value: String(n), label: String(n) }))}
          />
        </div>
        <LoyaltyPreview {...previewProps} />
        {!live && (
          <p className="k-hint" style={{ marginTop: 12 }}>
            {form.startDate && new Date(startOfDay(form.startDate)) > new Date() ? `publishing schedules it: visits count from ${form.startDate}.` : "publishing turns it on now: confirmed bills start counting as visits."}
          </p>
        )}
      </Modal>
    </div>
  );
}
