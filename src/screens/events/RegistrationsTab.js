// src/screens/events/RegistrationsTab.js
// All registrations (admin): filters, pagination, payment review, answers panel, CSV,
// tickets (codes + status, cancel / restore, re-send; search finds a ticket code).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import Ico from "../../portal/Ico";
import { Button, IconButton, SearchInput, Select, Field, Textarea, Modal, Drawer, Table, EmptyState, PageLoading } from "../../portal/kit";
import { eventsApi, authProblem, errorMessage, API_BASE } from "./eventsApi";

const STATUSES = [
  { value: "all", label: "All payments" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "not_required", label: "Not required (free)" },
];
const STATUS_LABEL = { pending: "pending", verified: "verified", rejected: "rejected", not_required: "not required" };
const METHOD_LABEL = { easypaisa: "Easypaisa", jazzcash: "JazzCash", bank: "Bank" };
const BASE_LABELS = { studentName: "Name", email: "Email", whatsapp: "WhatsApp", studentId: "Student ID / CNIC", university: "University" };
const LIMIT = 25;

const pkr = (n) => `PKR ${Number(n || 0).toLocaleString("en-US")}`;
const when = (d) => (d ? format(new Date(d), "MMM dd, yyyy HH:mm") : "–");
const humanize = (k) => String(k).replace(/^q_/, "").replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const answerText = (v) => (Array.isArray(v) ? v.join("\n") : v == null || v === "" ? "–" : String(v));

// tickets: same chip colours as payments (valid = green, cancelled = red, used = grey)
const TICKET_CHIP = { valid: "verified", cancelled: "rejected", used: "not_required" };
export const TicketChip = ({ status }) => <span className={`ev2-status ${TICKET_CHIP[status] || "not_required"}`}>{status || "–"}</span>;
const ticketList = (reg) => (Array.isArray(reg?.tickets) ? reg.tickets : []);
// the public ticket page (the email's "download ticket")
export const ticketLink = (t) => (t?.pageToken ? `${API_BASE}/ticket/${t.pageToken}` : "");
// the last email of this registration's tickets, in words
export const emailState = (reg) => {
  const d = reg?.ticketDelivery || {};
  if (d.emailStatus === "failed") return { tone: "bad", text: `email failed${d.emailError ? `: ${d.emailError}` : ""}` };
  if (d.emailStatus === "no_email") return { tone: "bad", text: "email not sent: no email address" };
  if (d.emailStatus === "sent" || d.emailedAt) return { tone: "ok", text: `email sent${d.emailedAt ? ` · ${when(d.emailedAt)}` : ""}` };
  return { tone: "none", text: "email: not sent yet" };
};
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // older browsers / no clipboard permission
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}
// table / card cell: every code with its status (a registration can hold several seats)
export const TicketCodes = ({ reg }) => {
  const list = ticketList(reg);
  if (!list.length) return <span className="k-muted">–</span>;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      {list.map((t) => (
        <span key={t.code} style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <span className={`ev2-mono${t.status === "cancelled" ? " ev2-struck" : ""}`}>{t.code}</span>
          <TicketChip status={t.status} />
        </span>
      ))}
    </span>
  );
};

export const StatusChip = ({ status }) => {
  const s = status || "not_required";
  return <span className={`ev2-status ${s}`}>{STATUS_LABEL[s] || s}</span>;
};

export default function RegistrationsTab({ token, events, onAuthError, notify, isMobile, onChanged }) {
  const [eventId, setEventId] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ registrations: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [confirm, setConfirm] = useState(null); // { reg, action }
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ticketConfirm, setTicketConfirm] = useState(null); // { reg, code, action }
  const [ticketBusy, setTicketBusy] = useState("");
  const reqId = useRef(0);
  // the parent's handler changes every render: keep it out of load()'s dependencies
  const authRef = useRef(onAuthError);
  authRef.current = onAuthError;

  // search waits for typing to stop
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => {
    const p = { page, limit: LIMIT };
    if (eventId) p.eventId = eventId;
    if (status !== "all") p.status = status;
    if (q) p.q = q;
    return p;
  }, [eventId, status, q, page]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    try {
      const res = await eventsApi.registrations(token, params);
      if (id !== reqId.current) return;
      setData({
        registrations: Array.isArray(res?.registrations) ? res.registrations : [],
        total: res?.total || 0,
        pages: res?.pages || 1,
      });
    } catch (err) {
      if (id !== reqId.current) return;
      if (authProblem(err)) {
        authRef.current(err);
        setError(authProblem(err));
      } else {
        setError(errorMessage(err, "Couldn't load registrations"));
      }
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [token, params]);

  useEffect(() => {
    load();
  }, [load]);

  const eventById = useMemo(() => new Map((events || []).map((e) => [String(e._id), e])), [events]);
  const labelFor = (reg, key) => {
    const ev = eventById.get(String(reg.eventId?._id || reg.eventId));
    const f = (ev?.registrationForm || []).find((x) => x.key === key);
    return f?.label || BASE_LABELS[key] || humanize(key);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { page: _p, limit: _l, ...filters } = params;
      const res = await eventsApi.registrationsCsv(token, filters);
      const cd = res.headers?.["content-disposition"] || "";
      const name = /filename="?([^";]+)"?/.exec(cd)?.[1] || `registrations-${format(new Date(), "yyyy-MM-dd")}.csv`;
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      notify("CSV downloaded", "success");
    } catch (err) {
      if (!onAuthError(err)) notify(errorMessage(err, "Couldn't export the CSV"), "error");
    } finally {
      setExporting(false);
    }
  };

  const openConfirm = (reg, action, e) => {
    if (e) e.stopPropagation();
    setReason("");
    setConfirm({ reg, action });
  };
  const review = async () => {
    if (!confirm) return;
    const { reg, action } = confirm;
    if (action === "reject" && !reason.trim()) return;
    setActing(true);
    try {
      await eventsApi.reviewPayment(token, reg._id, action, action === "reject" ? reason.trim() : undefined);
      notify(action === "verify" ? "Payment verified. The student was notified." : "Payment rejected. The student was notified.", "success");
      setConfirm(null);
      setPanel(null);
      await load();
      onChanged && onChanged();
    } catch (err) {
      if (!onAuthError(err)) notify(errorMessage(err, "Couldn't update the payment"), "error");
    } finally {
      setActing(false);
    }
  };

  // tickets: cancel / restore one code (after a confirmation), re-send push + email
  const ticketAction = async () => {
    if (!ticketConfirm) return;
    const { reg, code, action } = ticketConfirm;
    setTicketBusy(code);
    try {
      const res = await eventsApi.ticketAction(token, reg._id, code, action);
      notify(action === "cancel" ? `Ticket ${code} cancelled.` : `Ticket ${code} restored.`, "success");
      setTicketConfirm(null);
      if (res?.registration) setPanel((p) => (p && p._id === reg._id ? { ...p, ...res.registration } : p));
      // the panel is already up to date: the list refreshes in the background
      load();
    } catch (err) {
      if (!onAuthError(err)) notify(errorMessage(err, "Couldn't update the ticket"), "error");
    } finally {
      setTicketBusy("");
    }
  };
  const resend = async (reg) => {
    setTicketBusy("resend");
    try {
      const res = await eventsApi.resendTicket(token, reg._id);
      const failedMail = res?.result?.email === "failed" || res?.result?.email === "no_email";
      notify(`Ticket sent again. ${res?.message || ""}`.trim(), failedMail ? "warning" : "success");
      // the fresh row: email status and (for old tickets) the new page links
      if (res?.registration) setPanel((p) => (p && p._id === reg._id ? { ...p, ...res.registration } : p));
      load();
    } catch (err) {
      if (!onAuthError(err)) notify(errorMessage(err, "Couldn't send the ticket"), "error");
    } finally {
      setTicketBusy("");
    }
  };

  const copyLink = async (t) => {
    const url = ticketLink(t);
    if (!url) return;
    const copied = await copyText(url);
    notify(copied ? `Ticket link copied (${t.code}).` : `Couldn't copy. The link is: ${url}`, copied ? "success" : "warning");
  };

  // compact: icon buttons for table rows (labels in title / aria-label)
  const actionsFor = (reg, compact = false) => {
    const s = reg.payment?.status || "not_required";
    if (compact) {
      return (
        <span style={{ display: "inline-flex", gap: 6 }}>
          {(s === "pending" || s === "rejected") && (
            <IconButton icon="checkCircle" label="Verify payment" variant="success" size="sm" onClick={(e) => openConfirm(reg, "verify", e)} />
          )}
          {(s === "pending" || s === "verified") && (
            <IconButton icon="xCircle" label="Reject payment" variant="danger" size="sm" onClick={(e) => openConfirm(reg, "reject", e)} />
          )}
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
        {(s === "pending" || s === "rejected") && (
          <Button size="sm" variant="success" icon="checkCircle" onClick={(e) => openConfirm(reg, "verify", e)}>
            Verify
          </Button>
        )}
        {(s === "pending" || s === "verified") && (
          <Button size="sm" variant="danger" icon="xCircle" onClick={(e) => openConfirm(reg, "reject", e)}>
            Reject
          </Button>
        )}
      </span>
    );
  };

  const receiptThumb = (reg) =>
    reg.payment?.receiptUrl ? (
      <img
        className="ev2-receipt-thumb"
        src={reg.payment.receiptUrl}
        alt="receipt"
        onClick={(e) => {
          e.stopPropagation();
          setReceipt(reg.payment.receiptUrl);
        }}
      />
    ) : (
      <span className="k-muted">–</span>
    );

  const tickets = (reg) => (reg.ticket?.tier ? `${reg.ticket.tier} × ${reg.ticket.quantity || 1}` : "–");
  const rows = data.registrations;

  const columns = [
    {
      key: "student",
      label: "Student",
      render: (reg) => (
        <div className="student-cell">
          <div className="student-avatar">{reg.studentName?.charAt(0).toUpperCase() || "S"}</div>
          <div style={{ minWidth: 0 }}>
            <div className="student-name">{reg.studentName || "Unknown"}</div>
            <div className="k-muted" style={{ fontSize: 12.5 }}>{reg.email}</div>
          </div>
        </div>
      ),
    },
    { key: "event", label: "Event", render: (reg) => <span className="event-chip">{reg.eventTitle || "Unknown event"}</span> },
    { key: "tickets", label: "Tickets", render: (reg) => tickets(reg) },
    { key: "amount", label: "Amount", render: (reg) => (reg.payment?.amount ? pkr(reg.payment.amount) : "Free") },
    { key: "method", label: "Method", render: (reg) => METHOD_LABEL[reg.payment?.method] || "–" },
    { key: "trx", label: "Transaction ID", render: (reg) => <span className="ev2-mono">{reg.payment?.transactionId || "–"}</span> },
    { key: "receipt", label: "Receipt", render: (reg) => receiptThumb(reg) },
    { key: "status", label: "Status", render: (reg) => <StatusChip status={reg.payment?.status} /> },
    { key: "code", label: "Ticket code", render: (reg) => <TicketCodes reg={reg} /> },
    { key: "actions", label: "Actions", thStyle: { textAlign: "right" }, style: { textAlign: "right" }, render: (reg) => actionsFor(reg, true) },
  ];

  return (
    <div className="ev2-regs" data-tab="registrations">
      <div className="k-card pad ev2-regs-bar">
        <div className="ev2-regs-title">
          <Ico kind="users" tone="blue" size={36} />
          <h3>All Registrations</h3>
          <span className="k-count">{data.total}</span>
        </div>
        <div className="k-toolbar">
          <SearchInput
            className="k-grow"
            placeholder="Name, email, WhatsApp, transaction ID, ticket code"
            aria-label="search registrations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select aria-label="Event" value={eventId} onChange={(e) => { setEventId(e.target.value); setPage(1); }} style={{ width: "auto", minWidth: 180, maxWidth: "100%" }}>
            <option value="">All events</option>
            {(events || []).map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title}
              </option>
            ))}
          </Select>
          <Select aria-label="Payment" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ width: "auto", minWidth: 170, maxWidth: "100%" }}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Button variant="secondary" icon="download" onClick={exportCsv} loading={exporting}>
            {isMobile ? "CSV" : "Export CSV"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="k-card">
          <EmptyState icon="alert" tone="red" title={error} action={<Button variant="secondary" icon="refresh" onClick={load}>Try again</Button>} />
        </div>
      ) : loading && !rows.length ? (
        <div className="k-card"><PageLoading label="loading registrations…" minHeight={220} /></div>
      ) : !rows.length ? (
        <div className="k-card">
          <EmptyState
            icon="users"
            tone="blue"
            title="No registrations found"
            text={eventId || status !== "all" || q ? "Try other filters" : "Registrations appear here when students sign up"}
          />
        </div>
      ) : (
        <div style={{ opacity: loading ? 0.6 : 1 }}>
          {isMobile ? (
            <div className="ev2-cards">
              {rows.map((reg) => (
                <div className="k-card mobile-reg-card ev2-row-click" key={reg._id} onClick={() => setPanel(reg)}>
                  <div className="mobile-reg-header">
                    <div className="student-avatar">{reg.studentName?.charAt(0).toUpperCase() || "S"}</div>
                    <div className="mobile-reg-info">
                      <div className="mobile-reg-name">{reg.studentName || "Unknown"}</div>
                      <div className="mobile-reg-email">{reg.eventTitle || "Unknown event"}</div>
                    </div>
                    <StatusChip status={reg.payment?.status} />
                  </div>
                  <div className="mobile-reg-tags">
                    <span className="mobile-reg-tag">{tickets(reg)}</span>
                    <span className="mobile-reg-tag">{pkr(reg.payment?.amount)}</span>
                    {reg.payment?.transactionId && <span className="mobile-reg-tag dark ev2-mono">{reg.payment.transactionId}</span>}
                    {receiptThumb(reg)}
                  </div>
                  {ticketList(reg).length > 0 && (
                    <div style={{ margin: "8px 0" }}>
                      <TicketCodes reg={reg} />
                    </div>
                  )}
                  {actionsFor(reg)}
                </div>
              ))}
            </div>
          ) : (
            <Table columns={columns} rows={rows} rowKey={(r) => r._id} onRowClick={(reg) => setPanel(reg)} minWidth={1140} />
          )}
          <div className="ev2-pager">
            <span>
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)} of {data.total}
            </span>
            <span style={{ display: "inline-flex", gap: 8 }}>
              <Button size="sm" variant="secondary" icon="chevronLeft" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" iconRight="chevronRight" disabled={page >= data.pages || loading} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </span>
          </div>
        </div>
      )}

      {/* side panel: everything the student sent */}
      <Drawer open={!!panel} onClose={() => setPanel(null)} title={panel?.studentName} sub={panel?.eventTitle}>
        {panel && (
          <div className="ev2-panel">
            <div>
              <StatusChip status={panel.payment?.status} />
            </div>
            {[
              ["Email", panel.email],
              ["WhatsApp", panel.whatsapp],
              ["Student ID / CNIC", panel.studentId],
              ...Object.entries(panel.answers || {}).map(([k, v]) => [labelFor(panel, k), answerText(v)]),
              ["Tickets", tickets(panel)],
              ["Amount", panel.payment?.amount ? pkr(panel.payment.amount) : "Free"],
              ["Method", METHOD_LABEL[panel.payment?.method] || "–"],
              ["Transaction ID", panel.payment?.transactionId || "–"],
              ["Registered", when(panel.createdAt)],
              ["Payment sent", when(panel.payment?.submittedAt)],
              ["Reviewed", when(panel.payment?.reviewedAt)],
              ...(panel.payment?.rejectReason ? [["Reject reason", panel.payment.rejectReason]] : []),
            ].map(([label, value]) => (
              <div className="ev2-panel-item" key={label}>
                <div className="ev2-panel-label">{label}</div>
                <div className={`ev2-panel-value ${label === "Transaction ID" ? "ev2-mono" : ""}`}>{value || "–"}</div>
              </div>
            ))}
            {panel.payment?.receiptUrl && (
              <div className="ev2-panel-item">
                <div className="ev2-panel-label">Receipt</div>
                <img src={panel.payment.receiptUrl} alt="receipt" style={{ width: "100%", borderRadius: 14, cursor: "zoom-in", marginTop: 6 }} onClick={() => setReceipt(panel.payment.receiptUrl)} />
              </div>
            )}
            <div style={{ marginTop: 8 }}>{actionsFor(panel)}</div>

            {/* tickets: one code per seat */}
            <div className="ev2-panel-item" style={{ marginTop: 12 }}>
              <div className="ev2-panel-label">Tickets</div>
              {ticketList(panel).length === 0 ? (
                <div className="ev2-panel-value k-muted">
                  {panel.payment?.status === "pending"
                    ? "Issued when the payment is verified."
                    : panel.payment?.status === "rejected"
                      ? "No ticket: the payment was rejected."
                      : "No ticket yet."}
                </div>
              ) : (
                <>
                  {ticketList(panel).map((t) => (
                    <div key={t.code} data-ticket={t.code} className="ev2-ticket">
                      <div style={{ minWidth: 0 }}>
                        <div className={`ev2-mono${t.status === "cancelled" ? " ev2-struck" : ""}`} style={{ fontWeight: 700 }}>
                          {t.code}
                        </div>
                        <div className="ev2-small k-muted">
                          {[t.tier, t.of > 1 ? `seat ${t.seat} of ${t.of}` : null, t.status === "cancelled" && t.cancelReason === "payment_rejected" ? "cancelled with the payment" : null]
                            .filter(Boolean)
                            .join(" · ") || "1 seat"}
                        </div>
                        <div data-email-state={emailState(panel).tone} className={`ev2-small ev2-mail ${emailState(panel).tone}`}>
                          {emailState(panel).text}
                        </div>
                        {ticketLink(t) ? (
                          <Button size="sm" variant="ghost" icon="link" onClick={() => copyLink(t)} aria-label={`copy ticket link for ${t.code}`} style={{ paddingLeft: 0, marginTop: 4 }}>
                            Copy ticket link
                          </Button>
                        ) : (
                          <div className="ev2-small k-muted" style={{ marginTop: 2 }}>No link yet: re-send creates it.</div>
                        )}
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <TicketChip status={t.status} />
                        {t.status === "valid" && (
                          <Button size="sm" variant="danger" disabled={!!ticketBusy} onClick={() => setTicketConfirm({ reg: panel, code: t.code, action: "cancel" })}>
                            Cancel
                          </Button>
                        )}
                        {t.status === "cancelled" && ["verified", "not_required", undefined].includes(panel.payment?.status) && (
                          <Button size="sm" variant="secondary" disabled={!!ticketBusy} onClick={() => setTicketConfirm({ reg: panel, code: t.code, action: "restore" })}>
                            Restore
                          </Button>
                        )}
                      </span>
                    </div>
                  ))}
                  {ticketList(panel).some((t) => t.status === "valid") && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="send"
                      loading={ticketBusy === "resend"}
                      disabled={!!ticketBusy}
                      onClick={() => resend(panel)}
                      style={{ marginTop: 12 }}
                    >
                      Re-send ticket (push + email)
                    </Button>
                  )}
                  {emailState(panel).tone === "bad" && (
                    <div className="ev2-small ev2-mail bad" style={{ marginTop: 6 }}>The ticket is still valid. Fix the cause, then re-send.</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ticket cancel / restore confirmation */}
      <Modal
        open={!!ticketConfirm}
        onClose={() => !ticketBusy && setTicketConfirm(null)}
        size="sm"
        icon="ticket"
        tone={ticketConfirm?.action === "cancel" ? "red" : "green"}
        title={ticketConfirm ? (ticketConfirm.action === "cancel" ? "Cancel this ticket?" : "Restore this ticket?") : ""}
        footer={ticketConfirm ? <>
          <Button variant="secondary" onClick={() => setTicketConfirm(null)} disabled={!!ticketBusy}>
            Back
          </Button>
          <Button variant={ticketConfirm.action === "cancel" ? "danger" : "success"} onClick={ticketAction} loading={!!ticketBusy}>
            {ticketConfirm.action === "cancel" ? "Cancel ticket" : "Restore ticket"}
          </Button>
        </> : null}
      >
        {ticketConfirm && (
          <>
            <div style={{ fontSize: 14.5 }}>
              <span className="ev2-mono">{ticketConfirm.code}</span> · {ticketConfirm.reg.studentName} · {ticketConfirm.reg.eventTitle}
            </div>
            <div className="k-muted" style={{ fontSize: 14 }}>
              {ticketConfirm.action === "cancel"
                ? "The student's app shows it as cancelled and it won't get them in. You can restore it later."
                : "The ticket becomes valid again."}
            </div>
          </>
        )}
      </Modal>

      {/* receipt, large */}
      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        size="lg"
        icon="receipt"
        title="receipt"
        footer={<>
          <a className="k-btn secondary" href={receipt || undefined} target="_blank" rel="noopener noreferrer">
            <Ico kind="external" tone="plain" size={18} />
            Open in new tab
          </a>
          <Button onClick={() => setReceipt(null)}>Close</Button>
        </>}
      >
        {receipt && <img src={receipt} alt="receipt" style={{ maxWidth: "100%", maxHeight: "70vh", display: "block", margin: "0 auto", borderRadius: 14 }} />}
      </Modal>

      {/* verify / reject confirmation */}
      <Modal
        open={!!confirm}
        onClose={() => !acting && setConfirm(null)}
        size="sm"
        icon={confirm?.action === "verify" ? "checkCircle" : "xCircle"}
        tone={confirm?.action === "verify" ? "green" : "red"}
        title={confirm ? (confirm.action === "verify" ? "Verify this payment?" : "Reject this payment?") : ""}
        footer={confirm ? <>
          <Button variant="secondary" onClick={() => setConfirm(null)} disabled={acting}>
            Cancel
          </Button>
          <span title={confirm.action === "reject" && !reason.trim() ? "Write a short reason" : undefined}>
            <Button
              variant={confirm.action === "verify" ? "success" : "danger"}
              onClick={review}
              loading={acting}
              disabled={acting || (confirm.action === "reject" && !reason.trim())}
            >
              {confirm.action === "verify" ? "Verify" : "Reject"}
            </Button>
          </span>
        </> : null}
      >
        {confirm && (
          <>
            <div style={{ fontSize: 14.5, lineHeight: 1.55 }}>
              {confirm.reg.studentName} · {confirm.reg.eventTitle}
              <br />
              {pkr(confirm.reg.payment?.amount)} by {METHOD_LABEL[confirm.reg.payment?.method] || "–"}, transaction{" "}
              <span className="ev2-mono">{confirm.reg.payment?.transactionId || "–"}</span>
            </div>
            {confirm.action === "reject" ? (
              <Field label="Reason *" htmlFor="ev2-reject-reason" hint={`The student sees this. ${reason.length}/300`}>
                <Textarea
                  id="ev2-reject-reason"
                  autoFocus
                  rows={2}
                  placeholder="e.g. no payment with this transaction ID"
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 300))}
                />
              </Field>
            ) : (
              <div className="k-muted" style={{ fontSize: 14 }}>Only verify after you see this amount in the account. The student is notified.</div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
