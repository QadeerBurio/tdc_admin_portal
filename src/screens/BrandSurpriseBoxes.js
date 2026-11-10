// BrandSurpriseBoxes.js: the brand's Surprise Boxes (FLAG_SURPLUS_BOXES): merchant surplus food, pickup only,
// pay at pickup (tdc never takes money).
//   today     today's numbers and the live orders board: confirm, preparing, ready, cancel (with a reason)
//   listings  create / edit a box with the food disclosures (contents may vary, allergens, best-before),
//             quantity, prices and the pickup window; publish, pause, close. Once a student has ordered,
//             the disclosures, price and window are locked (they accepted them).
//             duplicate (same box, next possible pickup day, as a draft); cancel box (closes it and cancels
//             its open orders with one reason the students see)
//   pickup    verify a student's 6-character code or QR at the branch, then "paid at pickup" completes it
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Field, Input, Textarea, Select, DateInput, Checkbox, Tabs, StatCard, EmptyState, Pill, Facts, Modal, toast, confirmDialog } from "../portal/kit";
import surplusApi, { STATE_LABEL, STATE_TONE, ACTION_LABEL, karachi, karachiToUtc, utcToKarachiInput } from "../services/surplusApi";
import { duplicateForm, cancellableOrders } from "../portal/surplusDuplicate";
import "./styles/BrandPortal.css";

const money = (n, c = "PKR") => `${c} ${Number(n || 0).toLocaleString("en-PK")}`;
const time = (iso) => karachi(iso, { hour: "2-digit", minute: "2-digit" });
const blankListing = (branchId = "") => ({ branchId, title: "", description: "", contentsMayVary: true, allergens: "", allergenNotes: "", dietary: "", bestBefore: "", quantityTotal: 5, listPrice: "", price: "", pickupStart: "", pickupEnd: "", orderCutoff: "", publish: true });

export default function BrandSurpriseBoxes() {
  const [enabled, setEnabled] = useState(null);
  const [tab, setTab] = useState("today");
  const [branches, setBranches] = useState([]);
  useEffect(() => {
    surplusApi.flagsMe().then((f) => setEnabled(!!f.surplusBoxes)).catch(() => setEnabled(false));
    surplusApi.branches().then(setBranches).catch(() => setBranches([]));
  }, []);
  if (enabled === null) return <PageLoading />;
  if (!enabled) return <div className="tdcp k-page"><EmptyState icon="gift" tone="orange" title="surprise boxes aren't available for your brand yet" text="tdc is piloting them with a few brands." /></div>;
  return (
    <div className="tdcp k-page" data-screen="surprise-boxes">
      <PageHeader title="surprise boxes" sub="sell today's surplus food as surprise boxes. pickup only; students pay you at pickup." />
      <Tabs label="surprise boxes" value={tab} onChange={setTab} tabs={[{ id: "today", label: "today", icon: "clock" }, { id: "listings", label: "listings", icon: "gift" }, { id: "pickup", label: "verify pickup", icon: "qr" }]} />
      <div style={{ marginTop: 16 }}>
        {tab === "today" && <Today />}
        {tab === "listings" && <Listings branches={branches} />}
        {tab === "pickup" && <Pickup branches={branches} />}
      </div>
    </div>
  );
}

// ---------- today: numbers + live board ----------
function Today() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState(null);
  const [busy, setBusy] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [reason, setReason] = useState("");
  const load = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([surplusApi.summary(), surplusApi.orders("live")]);
      setSummary(s); setOrders(o);
    } catch (e) { toast(e.message, "bad"); setOrders([]); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
  const move = async (o, to, extra = {}) => {
    setBusy(o.id);
    try {
      await surplusApi.transition(o.id, { to, version: o.version, ...extra });
      toast(`order ${o.ref}: ${STATE_LABEL[to] || to}`, "ok");
      setCancelling(null); setReason("");
    } catch (e) {
      toast(e.code === "STALE_VERSION" ? "this order changed meanwhile; reloaded" : e.message, "bad");
    } finally { setBusy(null); load(); }
  };
  if (!orders) return <PageLoading />;
  const cols = [
    { id: "new", label: "new", states: ["ORDER_PLACED"] },
    { id: "prep", label: "confirmed / preparing", states: ["CONFIRMED", "PREPARING"] },
    { id: "ready", label: "ready for pickup", states: ["READY_FOR_PICKUP"] },
    { id: "handed", label: "handed over, not paid", states: ["PICKUP_VERIFIED"] },
  ];
  return (
    <>
      <div className="k-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <StatCard label="orders today" value={summary?.orders || 0} icon="receipt" tone="blue" />
        <StatCard label="boxes ordered" value={summary?.boxesOrdered || 0} icon="gift" tone="orange" />
        <StatCard label="to collect at pickup (PKR)" value={summary?.toCollectAtPickup || 0} icon="coin" tone="yellow" />
        <StatCard label="collected at pickup (PKR)" value={summary?.collectedAtPickup || 0} icon="check" tone="green" />
        <StatCard label="no-shows" value={summary?.noShows || 0} icon="alert" tone="red" />
        <StatCard label="boxes left on sale" value={summary?.boxesLeft || 0} icon="store" tone="sand" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 16 }} aria-label="live orders">
        {cols.map((c) => {
          const list = orders.filter((o) => c.states.includes(o.state));
          return (
            <section key={c.id} className="k-card pad" aria-label={c.label}>
              <div className="k-card-head"><h3 style={{ margin: 0 }}>{c.label}</h3><Pill>{list.length}</Pill></div>
              {list.length === 0 && <p className="k-hint">none</p>}
              {list.map((o) => (
                <div key={o.id} className="k-card pad" style={{ marginTop: 10, background: "var(--paper)" }} data-order={o.ref}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong>{o.ref}</strong><Pill tone={STATE_TONE[o.state]}>{STATE_LABEL[o.state]}</Pill>
                  </div>
                  <div style={{ fontSize: 14, marginTop: 6 }}>{o.qty} × {o.title}</div>
                  <div className="k-hint">{o.student.firstName} · pickup {time(o.pickupStart)}–{time(o.pickupEnd)} · {o.branchName}</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>collect {money(o.total, o.currency)} at pickup</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {o.next.filter((n) => n !== "MERCHANT_CANCELLED").map((n) => (
                      <Button key={n} size="sm" disabled={busy === o.id} onClick={() => move(o, n, n === "COMPLETED" ? { markPaid: true } : {})}>{n === "COMPLETED" ? `paid ${money(o.total, o.currency)}: complete` : ACTION_LABEL[n]}</Button>
                    ))}
                    {o.next.includes("MERCHANT_CANCELLED") && <Button size="sm" variant="secondary" disabled={busy === o.id} onClick={() => { setCancelling(o); setReason(""); }}>cancel</Button>}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
      <Modal open={!!cancelling} onClose={() => setCancelling(null)} title={`cancel order ${cancelling?.ref || ""}?`} sub="the student is told straight away, with your reason." icon="close" tone="red"
        footer={<><Button variant="secondary" onClick={() => setCancelling(null)}>keep it</Button><Button disabled={reason.trim().length < 3} loading={busy === cancelling?.id} onClick={() => move(cancelling, "MERCHANT_CANCELLED", { reason })}>cancel order</Button></>}>
        <Field label="reason (the student sees it)" htmlFor="sb-cancel-reason"><Textarea id="sb-cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. we sold out earlier than expected" /></Field>
      </Modal>
    </>
  );
}

// ---------- listings ----------
function Listings({ branches }) {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null); // { listing | null, duplicateOf?, form }
  const [saving, setSaving] = useState(false);
  // cancel box: { listing, cancel: [orders] | null, stay: [orders], reason, busy, result }
  const [cancelBox, setCancelBox] = useState(null);
  const load = useCallback(() => surplusApi.listings().then(setData).catch((e) => { toast(e.message, "bad"); setData({ listings: [] }); }), []);
  useEffect(() => { load(); }, [load]);
  const branchOptions = branches.filter((b) => b.isActive !== false);
  const open = (l = null) => setEditing({
    listing: l,
    form: l ? {
      branchId: l.branch.id, title: l.title, description: l.disclosures?.description || "", contentsMayVary: l.contentsMayVary, allergens: (l.allergens || []).join(", "), allergenNotes: l.disclosures?.allergenNotes || "",
      dietary: (l.dietary || []).join(", "), bestBefore: utcToKarachiInput(l.disclosures?.bestBefore), quantityTotal: l.quantityTotal, listPrice: l.listPrice, price: l.price,
      pickupStart: utcToKarachiInput(l.pickupStart), pickupEnd: utcToKarachiInput(l.pickupEnd), orderCutoff: utcToKarachiInput(l.orderCutoff), publish: l.status === "published",
    } : blankListing(branchOptions[0]?._id || ""),
  });
  const duplicate = (l) => setEditing({ listing: null, duplicateOf: l, form: duplicateForm(l, branchOptions.map((b) => b._id)) });
  const set = (k, v) => setEditing((e) => ({ ...e, form: { ...e.form, [k]: v } }));
  const locked = !!editing?.listing && editing.listing.orders > 0;
  const save = async () => {
    const f = editing.form;
    setSaving(true);
    try {
      const disclosures = {
        title: f.title, description: f.description, contentsMayVary: !!f.contentsMayVary, allergens: f.allergens, allergenNotes: f.allergenNotes, dietary: f.dietary,
        bestBefore: f.bestBefore ? karachiToUtc(f.bestBefore) : null, listPrice: Number(f.listPrice), price: Number(f.price),
        pickupStart: karachiToUtc(f.pickupStart), pickupEnd: karachiToUtc(f.pickupEnd), ...(f.orderCutoff ? { orderCutoff: karachiToUtc(f.orderCutoff) } : {}),
      };
      if (!editing.listing) {
        await surplusApi.createListing({ ...disclosures, branchId: f.branchId, quantityTotal: Number(f.quantityTotal), status: f.publish ? "published" : "draft" });
        toast(f.publish ? "published: students can see it now" : "saved as a draft", "ok");
      } else {
        await surplusApi.updateListing(editing.listing.id, { version: editing.listing.version, ...(locked ? {} : disclosures), quantityTotal: Number(f.quantityTotal) });
        toast("saved", "ok");
      }
      setEditing(null);
    } catch (e) { toast(e.code === "STALE_VERSION" ? "this listing changed meanwhile (a student may have just ordered); reloaded" : e.message, "bad"); }
    finally { setSaving(false); load(); }
  };
  const openCancel = async (l) => {
    setCancelBox({ listing: l, cancel: null, stay: [], reason: "", busy: false, result: null });
    try {
      const { cancel, stay } = cancellableOrders(await surplusApi.orders("live"), l.id);
      setCancelBox((c) => c && { ...c, cancel, stay });
    } catch (e) { toast(e.message, "bad"); setCancelBox(null); }
  };
  // close the box first (no new orders), then cancel each open order with the same reason
  const runCancel = async () => {
    const { listing: l, cancel, reason } = cancelBox;
    setCancelBox((c) => ({ ...c, busy: true }));
    const failed = [];
    let done = 0;
    try {
      if (l.status !== "closed") await surplusApi.updateListing(l.id, { version: l.version, status: "closed" });
    } catch (e) {
      toast(e.code === "STALE_VERSION" ? "this box changed meanwhile (a student may have just ordered); try again" : e.message, "bad");
      setCancelBox((c) => ({ ...c, busy: false }));
      load();
      return;
    }
    for (const o of cancel) {
      try {
        await surplusApi.transition(o.id, { to: "MERCHANT_CANCELLED", version: o.version, reason: reason.trim() });
        done += 1;
      } catch (e) {
        // the order moved meanwhile: read it again and cancel it if that's still possible
        try {
          const fresh = cancellableOrders(await surplusApi.orders("live"), l.id).cancel.find((x) => x.id === o.id);
          if (!fresh) throw e;
          await surplusApi.transition(fresh.id, { to: "MERCHANT_CANCELLED", version: fresh.version, reason: reason.trim() });
          done += 1;
        } catch (e2) { failed.push({ ref: o.ref, message: e2.message || e.message }); }
      }
    }
    setCancelBox((c) => ({ ...c, busy: false, result: { done, failed } }));
    toast(failed.length ? `box closed; ${done} order${done === 1 ? "" : "s"} cancelled, ${failed.length} couldn't be` : `box closed; ${done} order${done === 1 ? "" : "s"} cancelled`, failed.length ? "bad" : "ok");
    load();
  };
  const setStatus = async (l, status) => {
    if (status === "closed" && !(await confirmDialog("close this listing? no new orders; existing orders stay."))) return;
    try { await surplusApi.updateListing(l.id, { version: l.version, status }); toast(status === "published" ? "published" : status, "ok"); }
    catch (e) { toast(e.message, "bad"); } finally { load(); }
  };
  if (!data) return <PageLoading />;
  return (
    <>
      {data.blocked && <div className="k-card pad" role="alert" style={{ background: "var(--red-soft, #fdecea)", marginBottom: 12 }}>tdc has paused your surprise box listings. contact support.</div>}
      <div className="k-toolbar" style={{ marginBottom: 12 }}>
        <Button icon="plus" disabled={data.blocked || branchOptions.length === 0} onClick={() => open()}>new surprise box</Button>
        {branchOptions.length === 0 && <span className="k-hint">add a branch first: every box is picked up at one of your branches.</span>}
      </div>
      {data.listings.length === 0 ? <EmptyState icon="gift" tone="orange" title="no surprise boxes yet" text="list what's left at the end of the day: a price, a quantity and a pickup window." /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {data.listings.map((l) => (
            <section key={l.id} className="k-card pad" data-listing={l.title}>
              <BoxPhoto l={l} onChanged={load} />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{l.title}</strong><Pill tone={l.status === "published" ? "green" : l.status === "blocked" ? "red" : "sand"}>{l.status.replace("_", " ")}</Pill></div>
              <Facts rows={[
                ["pickup", `${karachi(l.pickupStart)} – ${time(l.pickupEnd)}`],
                ["branch", l.branch.name],
                ["price", `${money(l.price, l.currency)} (usually ${money(l.listPrice, l.currency)})`],
                ["boxes", `${l.quantityLeft} left of ${l.quantityTotal}`],
                ["orders", String(l.orders)],
                ["allergens", l.disclosures?.allergenNotes || "–"],
              ]} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {!["closed", "blocked"].includes(l.status) && <Button size="sm" variant="secondary" onClick={() => open(l)}>edit</Button>}
                {["draft", "paused"].includes(l.status) && <Button size="sm" onClick={() => setStatus(l, "published")}>publish</Button>}
                {["published", "sold_out"].includes(l.status) && <Button size="sm" variant="secondary" onClick={() => setStatus(l, "paused")}>pause</Button>}
                {!["closed", "blocked"].includes(l.status) && <Button size="sm" variant="secondary" onClick={() => setStatus(l, "closed")}>close</Button>}
                {!data.blocked && branchOptions.length > 0 && <Button size="sm" variant="secondary" icon="copy" onClick={() => duplicate(l)} aria-label={`duplicate ${l.title}`}>duplicate</Button>}
                {l.status !== "blocked" && (l.status !== "closed" || l.orders > 0) && <Button size="sm" variant="danger" onClick={() => openCancel(l)} aria-label={`cancel box ${l.title}`}>cancel box</Button>}
              </div>
            </section>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} size="lg" icon="gift" tone="orange" title={editing?.listing ? "edit surprise box" : editing?.duplicateOf ? "duplicate surprise box" : "new surprise box"}
        sub="students see all of this before they confirm. pickup only; they pay you at pickup."
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>cancel</Button><Button loading={saving} onClick={save}>{editing?.listing ? "save" : editing?.form.publish ? "publish" : "save draft"}</Button></>}>
        {editing && (
          <div style={{ display: "grid", gap: 12 }}>
            {editing.duplicateOf && (
              <p className="k-hint" role="note">
                a copy of "{editing.duplicateOf.title}". check the pickup times{editing.form.shiftedDays ? ` (moved ${editing.form.shiftedDays} day${editing.form.shiftedDays === 1 ? "" : "s"} ahead, same times)` : ""}{editing.form.branchChanged ? ", and the branch: the original one isn't active" : ""}. it's saved as a draft unless you tick "publish now".
              </p>
            )}
            {locked && <p className="k-hint" role="note">students have ordered this box, so its contents, allergens, prices and pickup window are locked. you can still change the quantity.</p>}
            {!editing.listing && (
              <Field label="branch (pickup place)" htmlFor="sb-branch">
                <Select id="sb-branch" value={editing.form.branchId} onChange={(e) => set("branchId", e.target.value)}>{branchOptions.map((b) => <option key={b._id} value={b._id}>{b.name}{b.city ? `, ${b.city}` : ""}</option>)}</Select>
              </Field>
            )}
            <Field label="title" htmlFor="sb-title"><Input id="sb-title" disabled={locked} value={editing.form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. evening bakery box" /></Field>
            <Field label="what's usually inside" htmlFor="sb-desc"><Textarea id="sb-desc" disabled={locked} value={editing.form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. 3-4 breads and pastries from today" /></Field>
            <Checkbox label="contents may vary (shown to students)" disabled={locked} checked={!!editing.form.contentsMayVary} onChange={(e) => set("contentsMayVary", e.target.checked)} />
            <Field label="allergens (comma separated)" htmlFor="sb-allergens"><Input id="sb-allergens" disabled={locked} value={editing.form.allergens} onChange={(e) => set("allergens", e.target.value)} placeholder="gluten, dairy, eggs, nuts" /></Field>
            <Field label="allergen notes (required)" hint="what the box contains or may contain; write 'none known' if so" htmlFor="sb-allergen-notes"><Textarea id="sb-allergen-notes" disabled={locked} value={editing.form.allergenNotes} onChange={(e) => set("allergenNotes", e.target.value)} /></Field>
            <Field label="dietary (comma separated, optional)" htmlFor="sb-dietary"><Input id="sb-dietary" disabled={locked} value={editing.form.dietary} onChange={(e) => set("dietary", e.target.value)} placeholder="halal, vegetarian" /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <Field label="boxes" htmlFor="sb-qty"><Input id="sb-qty" type="number" min={1} max={500} value={editing.form.quantityTotal} onChange={(e) => set("quantityTotal", e.target.value)} /></Field>
              <Field label="usual value (PKR)" htmlFor="sb-list"><Input id="sb-list" type="number" min={0} disabled={locked} value={editing.form.listPrice} onChange={(e) => set("listPrice", e.target.value)} /></Field>
              <Field label="price at pickup (PKR)" htmlFor="sb-price"><Input id="sb-price" type="number" min={0} disabled={locked} value={editing.form.price} onChange={(e) => set("price", e.target.value)} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <Field label="pickup from (Karachi)" htmlFor="sb-start"><DateInput withTime id="sb-start" disabled={locked} value={editing.form.pickupStart} onChange={(e) => set("pickupStart", e.target.value)} /></Field>
              <Field label="pickup until (Karachi)" htmlFor="sb-end"><DateInput withTime id="sb-end" disabled={locked} value={editing.form.pickupEnd} onChange={(e) => set("pickupEnd", e.target.value)} /></Field>
              <Field label="orders close (optional)" hint="default: 30 minutes before pickup ends" htmlFor="sb-cutoff"><DateInput withTime id="sb-cutoff" disabled={locked} value={editing.form.orderCutoff} onChange={(e) => set("orderCutoff", e.target.value)} /></Field>
              <Field label="best before (optional)" hint="must be after pickup ends" htmlFor="sb-best"><DateInput withTime id="sb-best" disabled={locked} value={editing.form.bestBefore} onChange={(e) => set("bestBefore", e.target.value)} /></Field>
            </div>
            <p className="k-hint">cancellation rule shown to students: they can cancel until 30 minutes before pickup starts; after that, not collecting is a no-show. you can cancel any time with a reason.</p>
            {!editing.listing && <Checkbox label="publish now" checked={!!editing.form.publish} onChange={(e) => set("publish", e.target.checked)} />}
          </div>
        )}
      </Modal>
      <Modal open={!!cancelBox} onClose={() => !cancelBox?.busy && setCancelBox(null)} icon="close" tone="red"
        title={cancelBox ? `cancel "${cancelBox.listing.title}"?` : ""}
        sub="the box closes (no new orders) and its open orders are cancelled. each student is told straight away, with your reason."
        footer={cancelBox?.result
          ? <Button onClick={() => setCancelBox(null)}>done</Button>
          : <><Button variant="secondary" disabled={cancelBox?.busy} onClick={() => setCancelBox(null)}>keep it</Button>
            <Button variant="danger" loading={cancelBox?.busy} disabled={!cancelBox?.cancel || (cancelBox?.reason || "").trim().length < 3} onClick={runCancel}>
              {cancelBox?.cancel?.length ? `close and cancel ${cancelBox.cancel.length} order${cancelBox.cancel.length === 1 ? "" : "s"}` : "close the box"}
            </Button></>}>
        {cancelBox && (
          <div style={{ display: "grid", gap: 12 }}>
            {!cancelBox.cancel ? <PageLoading /> : cancelBox.result ? (
              <div role="status">
                <p><strong>{cancelBox.result.done}</strong> order{cancelBox.result.done === 1 ? "" : "s"} cancelled; the box is closed.</p>
                {cancelBox.result.failed.length > 0 && (
                  <>
                    <p className="k-hint">these couldn't be cancelled; check them on the today tab:</p>
                    <ul>{cancelBox.result.failed.map((f) => <li key={f.ref}>{f.ref}: {f.message}</li>)}</ul>
                  </>
                )}
              </div>
            ) : (
              <>
                <p>{cancelBox.cancel.length ? `${cancelBox.cancel.length} open order${cancelBox.cancel.length === 1 ? "" : "s"} will be cancelled: ${cancelBox.cancel.map((o) => o.ref).join(", ")}.` : "no open orders to cancel."}</p>
                {cancelBox.stay.length > 0 && <p className="k-hint">{cancelBox.stay.length} order{cancelBox.stay.length === 1 ? "" : "s"} already handed over ({cancelBox.stay.map((o) => o.ref).join(", ")}) stay as they are.</p>}
                <Field label="reason (students see it)" htmlFor="sb-box-cancel-reason">
                  <Textarea id="sb-box-cancel-reason" value={cancelBox.reason} onChange={(e) => { const v = e.target.value; setCancelBox((c) => ({ ...c, reason: v })); }} placeholder="e.g. our oven broke down this evening" />
                </Field>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

// ---------- a box's optional photo ----------
// images only (jpg, png, webp, heic), at most 5 MB: checked here first, and again on the server. Once a student
// has ordered, the photo is part of what they saw and can't change.
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const PHOTO_MAX = 5 * 1024 * 1024;
export function photoProblem(file) {
  if (!file) return "choose a photo";
  if (!PHOTO_TYPES.includes(String(file.type || "").toLowerCase()) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "")) return "only jpg, png, webp or heic photos";
  if (file.size > PHOTO_MAX) return "the photo can be at most 5 MB";
  return null;
}
function BoxPhoto({ l, onChanged }) {
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const locked = l.orders > 0 || ["closed", "blocked"].includes(l.status);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = photoProblem(file);
    if (problem) return toast(problem, "bad");
    setBusy(true);
    try { await surplusApi.uploadPhoto(l.id, file, l.version); toast("photo saved", "ok"); }
    catch (err) { toast(err.code === "STALE_VERSION" ? "this box changed meanwhile; reloaded" : err.message, "bad"); }
    finally { setBusy(false); onChanged(); }
  };
  const remove = async () => {
    setBusy(true);
    try { await surplusApi.removePhoto(l.id, l.version); toast("photo removed", "ok"); }
    catch (err) { toast(err.message, "bad"); }
    finally { setBusy(false); onChanged(); }
  };
  return (
    <div style={{ marginBottom: 10 }}>
      {l.image && <img src={l.image} alt={l.title} style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 12, display: "block" }} />}
      {!locked && (
        <div className="k-row" style={{ gap: 6, marginTop: l.image ? 6 : 0 }}>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={pick} style={{ display: "none" }} aria-label={`photo for ${l.title}`} data-photo-input={l.id} />
          <Button size="sm" variant="secondary" icon="image" loading={busy} onClick={() => input.current?.click()}>{l.image ? "change photo" : "add photo"}</Button>
          {l.image && <Button size="sm" variant="secondary" disabled={busy} onClick={remove} aria-label={`remove the photo of ${l.title}`}>remove photo</Button>}
        </div>
      )}
      {locked && l.orders > 0 && !l.image && <p className="k-hint" style={{ margin: 0 }}>no photo (students have ordered, so it can't be added now)</p>}
    </div>
  );
}

// ---------- verify pickup ----------
function Pickup({ branches }) {
  const options = branches.filter((b) => b.isActive !== false);
  const [branchId, setBranchId] = useState(options[0]?._id || "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  useEffect(() => { if (!branchId && options[0]) setBranchId(options[0]._id); }, [options, branchId]);
  const verify = async (payload) => {
    if (!branchId) return toast("choose the branch you're at", "bad");
    setBusy(true);
    try {
      const o = await surplusApi.verifyPickup({ ...payload, branchId, markPaid: false });
      setResult(o); setCode("");
      toast(`code ok: hand over order ${o.ref}`, "ok");
    } catch (e) {
      setResult(null);
      toast(e.message + (e.ref ? ` (order ${e.ref})` : ""), "bad");
    } finally { setBusy(false); }
  };
  const markPaid = async () => {
    setBusy(true);
    try {
      const o = await surplusApi.transition(result.id, { to: "COMPLETED", version: result.version, markPaid: true });
      setResult(o);
      toast(`order ${o.ref} completed`, "ok");
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  };
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
      <section className="k-card pad">
        <div className="k-card-head"><Ico kind="qr" tone="green" size={30} /><h3>verify a pickup</h3></div>
        <p className="k-hint">ask for the 6-character code in the student's app, or scan their QR. a code works once, only at the branch the box is for, until the pickup window ends.</p>
        <Field label="branch you're at" htmlFor="sb-pick-branch"><Select id="sb-pick-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>{options.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</Select></Field>
        <form onSubmit={(e) => { e.preventDefault(); verify({ code }); }} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginTop: 8 }}>
          <Field label="pickup code" htmlFor="sb-code"><Input id="sb-code" value={code} maxLength={8} autoComplete="off" onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. K7QM2X" style={{ letterSpacing: 3, fontWeight: 700, width: 160 }} /></Field>
          <Button type="submit" loading={busy} disabled={code.replace(/\W/g, "").length !== 6}>verify code</Button>
          <Button variant="secondary" icon="qr" onClick={() => setScanning(true)}>scan QR</Button>
        </form>
      </section>
      {result && (
        <section className="k-card pad" aria-live="polite" data-result={result.ref}>
          <div className="k-card-head"><Ico kind="checkCircle" tone="green" size={30} /><h3>{result.state === "COMPLETED" ? "completed" : "hand over this order"}</h3></div>
          <Facts rows={[["order", result.ref], ["student", result.student.firstName], ["box", `${result.qty} × ${result.title}`], ["collect", money(result.total, result.currency)], ["status", STATE_LABEL[result.state]]]} />
          {result.state === "PICKUP_VERIFIED" && <Button icon="check" loading={busy} onClick={markPaid}>student paid {money(result.total, result.currency)}: complete</Button>}
        </section>
      )}
      {scanning && <QrScan onClose={() => setScanning(false)} onScan={(text) => { setScanning(false); verify({ qr: text }); }} />}
    </div>
  );
}

function QrScan({ onScan, onClose }) {
  const ref = useRef(null);
  const [error, setError] = useState("");
  const id = useMemo(() => `sb-qr-${Math.random().toString(36).slice(2)}`, []);
  useEffect(() => {
    let scanner = null;
    let done = false;
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (done) return;
      scanner = new Html5Qrcode(id);
      ref.current = scanner;
      return scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, (text) => { if (!done) { done = true; scanner.stop().catch(() => {}); onScan(text); } }, () => {});
    }).catch((e) => setError(e?.message || "camera not available: type the code instead"));
    return () => { done = true; if (scanner) scanner.stop().catch(() => {}); };
  }, [id, onScan]);
  return (
    <Modal open onClose={onClose} title="scan the student's QR" icon="qr" tone="green" footer={<Button variant="secondary" onClick={onClose}>close</Button>}>
      <div id={id} style={{ width: "100%", minHeight: 260 }} />
      {error && <p className="k-hint" role="alert">{error}</p>}
    </Modal>
  );
}
