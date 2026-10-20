// src/screens/events/RegistrationsTab.js
// All registrations (admin): filters, pagination, payment review, answers panel, CSV,
// tickets (codes + status, cancel / restore, re-send; search finds a ticket code).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Tooltip,
} from "@mui/material";
import {
  People as PeopleIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { eventsApi, authProblem, errorMessage } from "./eventsApi";

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
const when = (d) => (d ? format(new Date(d), "MMM dd, yyyy HH:mm") : "—");
const humanize = (k) => String(k).replace(/^q_/, "").replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const answerText = (v) => (Array.isArray(v) ? v.join("\n") : v == null || v === "" ? "—" : String(v));

// tickets: same chip colours as payments (valid = green, cancelled = red, used = grey)
const TICKET_CHIP = { valid: "verified", cancelled: "rejected", used: "not_required" };
export const TicketChip = ({ status }) => <span className={`ev2-status ${TICKET_CHIP[status] || "not_required"}`}>{status || "—"}</span>;
const ticketList = (reg) => (Array.isArray(reg?.tickets) ? reg.tickets : []);
// table / card cell: every code with its status (a registration can hold several seats)
export const TicketCodes = ({ reg }) => {
  const list = ticketList(reg);
  if (!list.length) return <span style={{ color: "#aaa" }}>—</span>;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      {list.map((t) => (
        <span key={t.code} style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <span className="ev2-mono" style={t.status === "cancelled" ? { textDecoration: "line-through", color: "#999" } : undefined}>
            {t.code}
          </span>
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
      await load();
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
      notify(`Ticket sent again. ${res?.message || ""}`.trim(), "success");
    } catch (err) {
      if (!onAuthError(err)) notify(errorMessage(err, "Couldn't send the ticket"), "error");
    } finally {
      setTicketBusy("");
    }
  };

  // compact: icon buttons for table rows (labels in tooltips / aria-label)
  const actionsFor = (reg, compact = false) => {
    const s = reg.payment?.status || "not_required";
    if (compact) {
      return (
        <span style={{ display: "inline-flex", gap: 2 }}>
          {(s === "pending" || s === "rejected") && (
            <Tooltip title="Verify payment">
              <IconButton size="small" color="success" aria-label="Verify" onClick={(e) => openConfirm(reg, "verify", e)}>
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
          )}
          {(s === "pending" || s === "verified") && (
            <Tooltip title="Reject payment">
              <IconButton size="small" color="error" aria-label="Reject" onClick={(e) => openConfirm(reg, "reject", e)}>
                <CancelIcon />
              </IconButton>
            </Tooltip>
          )}
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", gap: 6 }}>
        {(s === "pending" || s === "rejected") && (
          <Button size="small" variant="outlined" color="success" startIcon={<CheckCircleIcon />} onClick={(e) => openConfirm(reg, "verify", e)}>
            Verify
          </Button>
        )}
        {(s === "pending" || s === "verified") && (
          <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={(e) => openConfirm(reg, "reject", e)}>
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
      <span style={{ color: "#aaa" }}>—</span>
    );

  const tickets = (reg) => (reg.ticket?.tier ? `${reg.ticket.tier} × ${reg.ticket.quantity || 1}` : "—");
  const rows = data.registrations;

  return (
    <div className="tab-content">
      <div className="registrations-header">
        <div className="registrations-title">
          <PeopleIcon />
          All Registrations
          <span className="registrations-count">{data.total}</span>
        </div>
        <div className="registrations-controls ev2-filters">
          <TextField
            className="search-field"
            size="small"
            placeholder="Name, email, WhatsApp, transaction ID, ticket code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth={isMobile}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ mr: 1, color: "#999" }} />,
                endAdornment: search ? (
                  <IconButton size="small" aria-label="clear search" onClick={() => setSearch("")}>
                    <ClearIcon />
                  </IconButton>
                ) : null,
              },
            }}
          />
          <FormControl className="filter-select" size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="reg-event">Event</InputLabel>
            <Select labelId="reg-event" label="Event" value={eventId} onChange={(e) => { setEventId(e.target.value); setPage(1); }}>
              <MenuItem value="">All events</MenuItem>
              {(events || []).map((ev) => (
                <MenuItem key={ev._id} value={ev._id}>
                  {ev.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className="filter-select" size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="reg-status">Payment</InputLabel>
            <Select labelId="reg-status" label="Payment" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              {STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <button className="outline-btn" onClick={exportCsv} disabled={exporting}>
            {exporting ? <CircularProgress size={16} /> : <DownloadIcon />} {isMobile ? "CSV" : "Export CSV"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="empty-state">
          <Alert severity="error" sx={{ borderRadius: "14px", mb: 2 }}>
            {error}
          </Alert>
          <Button startIcon={<RefreshIcon />} onClick={load}>
            Try again
          </Button>
        </div>
      ) : loading && !rows.length ? (
        <div className="empty-state">
          <CircularProgress size={32} sx={{ color: "#000" }} />
        </div>
      ) : !rows.length ? (
        <div className="empty-state">
          <div className="empty-icon-wrapper">
            <PeopleIcon />
          </div>
          <div className="empty-title">No registrations found</div>
          <div className="empty-subtitle">{eventId || status !== "all" || q ? "Try other filters" : "Registrations appear here when students sign up"}</div>
        </div>
      ) : (
        <div className="table-container ev2-scroll" style={{ opacity: loading ? 0.6 : 1 }}>
          {isMobile ? (
            <div style={{ padding: 16 }}>
              {rows.map((reg) => (
                <div className="mobile-reg-card ev2-row-click" key={reg._id} onClick={() => setPanel(reg)}>
                  <div className="mobile-reg-header">
                    <div className="mobile-reg-avatar">{reg.studentName?.charAt(0).toUpperCase() || "S"}</div>
                    <div className="mobile-reg-info">
                      <div className="mobile-reg-name">{reg.studentName || "Unknown"}</div>
                      <div className="mobile-reg-email">{reg.eventTitle || "Unknown event"}</div>
                    </div>
                    <StatusChip status={reg.payment?.status} />
                  </div>
                  <div className="mobile-reg-tags">
                    <span className="mobile-reg-tag outlined">{tickets(reg)}</span>
                    <span className="mobile-reg-tag outlined">{pkr(reg.payment?.amount)}</span>
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
            <Table size="small" sx={{ minWidth: 1140 }}>
              <TableHead className="table-header">
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Tickets</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Receipt</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ticket code</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((reg) => (
                  <TableRow className="table-row ev2-row-click" key={reg._id} hover onClick={() => setPanel(reg)}>
                    <TableCell>
                      <div className="student-cell">
                        <div className="student-avatar">{reg.studentName?.charAt(0).toUpperCase() || "S"}</div>
                        <div>
                          <div className="student-name">{reg.studentName || "Unknown"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#777" }}>{reg.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="event-chip">{reg.eventTitle || "Unknown event"}</span>
                    </TableCell>
                    <TableCell>{tickets(reg)}</TableCell>
                    <TableCell>{reg.payment?.amount ? pkr(reg.payment.amount) : "Free"}</TableCell>
                    <TableCell>{METHOD_LABEL[reg.payment?.method] || "—"}</TableCell>
                    <TableCell className="ev2-mono">{reg.payment?.transactionId || "—"}</TableCell>
                    <TableCell>{receiptThumb(reg)}</TableCell>
                    <TableCell>
                      <StatusChip status={reg.payment?.status} />
                    </TableCell>
                    <TableCell>
                      <TicketCodes reg={reg} />
                    </TableCell>
                    <TableCell align="right">{actionsFor(reg, true)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="ev2-pager">
            <span>
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)} of {data.total}
            </span>
            <span>
              <Button size="small" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="small" disabled={page >= data.pages || loading} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </span>
          </div>
        </div>
      )}

      {/* side panel: everything the student sent */}
      <Drawer anchor="right" open={!!panel} onClose={() => setPanel(null)}>
        {panel && (
          <div className="ev2-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{panel.studentName}</div>
                <div style={{ color: "#666", fontSize: "0.85rem" }}>{panel.eventTitle}</div>
              </div>
              <IconButton aria-label="close" onClick={() => setPanel(null)}>
                <CloseIcon />
              </IconButton>
            </div>
            <div style={{ margin: "8px 0 12px" }}>
              <StatusChip status={panel.payment?.status} />
            </div>
            {[
              ["Email", panel.email],
              ["WhatsApp", panel.whatsapp],
              ["Student ID / CNIC", panel.studentId],
              ...Object.entries(panel.answers || {}).map(([k, v]) => [labelFor(panel, k), answerText(v)]),
              ["Tickets", tickets(panel)],
              ["Amount", panel.payment?.amount ? pkr(panel.payment.amount) : "Free"],
              ["Method", METHOD_LABEL[panel.payment?.method] || "—"],
              ["Transaction ID", panel.payment?.transactionId || "—"],
              ["Registered", when(panel.createdAt)],
              ["Payment sent", when(panel.payment?.submittedAt)],
              ["Reviewed", when(panel.payment?.reviewedAt)],
              ...(panel.payment?.rejectReason ? [["Reject reason", panel.payment.rejectReason]] : []),
            ].map(([label, value]) => (
              <div className="ev2-panel-item" key={label}>
                <div className="ev2-panel-label">{label}</div>
                <div className={`ev2-panel-value ${label === "Transaction ID" ? "ev2-mono" : ""}`}>{value || "—"}</div>
              </div>
            ))}
            {panel.payment?.receiptUrl && (
              <div className="ev2-panel-item">
                <div className="ev2-panel-label">Receipt</div>
                <img src={panel.payment.receiptUrl} alt="receipt" style={{ width: "100%", borderRadius: 12, cursor: "zoom-in" }} onClick={() => setReceipt(panel.payment.receiptUrl)} />
              </div>
            )}
            <div style={{ marginTop: 16 }}>{actionsFor(panel)}</div>

            {/* tickets: one code per seat */}
            <div className="ev2-panel-item" style={{ marginTop: 20 }}>
              <div className="ev2-panel-label">Tickets</div>
              {ticketList(panel).length === 0 ? (
                <div className="ev2-panel-value" style={{ color: "#777" }}>
                  {panel.payment?.status === "pending"
                    ? "Issued when the payment is verified."
                    : panel.payment?.status === "rejected"
                      ? "No ticket: the payment was rejected."
                      : "No ticket yet."}
                </div>
              ) : (
                <>
                  {ticketList(panel).map((t) => (
                    <div
                      key={t.code}
                      data-ticket={t.code}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid #eee" }}
                    >
                      <div>
                        <div className="ev2-mono" style={{ fontWeight: 700, ...(t.status === "cancelled" ? { textDecoration: "line-through", color: "#999" } : {}) }}>
                          {t.code}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#777" }}>
                          {[t.tier, t.of > 1 ? `seat ${t.seat} of ${t.of}` : null, t.status === "cancelled" && t.cancelReason === "payment_rejected" ? "cancelled with the payment" : null]
                            .filter(Boolean)
                            .join(" · ") || "1 seat"}
                        </div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <TicketChip status={t.status} />
                        {t.status === "valid" && (
                          <Button size="small" color="error" disabled={!!ticketBusy} onClick={() => setTicketConfirm({ reg: panel, code: t.code, action: "cancel" })}>
                            Cancel
                          </Button>
                        )}
                        {t.status === "cancelled" && ["verified", "not_required", undefined].includes(panel.payment?.status) && (
                          <Button size="small" disabled={!!ticketBusy} onClick={() => setTicketConfirm({ reg: panel, code: t.code, action: "restore" })}>
                            Restore
                          </Button>
                        )}
                      </span>
                    </div>
                  ))}
                  {ticketList(panel).some((t) => t.status === "valid") && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={ticketBusy === "resend" ? <CircularProgress size={14} /> : <SendIcon />}
                      disabled={!!ticketBusy}
                      onClick={() => resend(panel)}
                      sx={{ mt: 1.5 }}
                    >
                      Re-send ticket (push + email)
                    </Button>
                  )}
                  {panel.ticketDelivery?.emailError && (
                    <div style={{ fontSize: "0.75rem", color: "#b42318", marginTop: 6 }}>Last email failed: {panel.ticketDelivery.emailError}</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ticket cancel / restore confirmation */}
      <Dialog open={!!ticketConfirm} onClose={() => !ticketBusy && setTicketConfirm(null)} maxWidth="xs" fullWidth>
        {ticketConfirm && (
          <>
            <DialogTitle>{ticketConfirm.action === "cancel" ? "Cancel this ticket?" : "Restore this ticket?"}</DialogTitle>
            <DialogContent>
              <div style={{ fontSize: "0.9rem" }}>
                <span className="ev2-mono">{ticketConfirm.code}</span> · {ticketConfirm.reg.studentName} · {ticketConfirm.reg.eventTitle}
              </div>
              <div style={{ color: "#555", fontSize: "0.85rem", marginTop: 8 }}>
                {ticketConfirm.action === "cancel"
                  ? "The student's app shows it as cancelled and it won't get them in. You can restore it later."
                  : "The ticket becomes valid again."}
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTicketConfirm(null)} disabled={!!ticketBusy}>
                Back
              </Button>
              <Button variant="contained" color={ticketConfirm.action === "cancel" ? "error" : "success"} onClick={ticketAction} disabled={!!ticketBusy}>
                {ticketBusy ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : ticketConfirm.action === "cancel" ? "Cancel ticket" : "Restore ticket"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* receipt, large */}
      <Dialog open={!!receipt} onClose={() => setReceipt(null)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          {receipt && <img src={receipt} alt="receipt" style={{ maxWidth: "100%", maxHeight: "80vh", display: "block" }} />}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<OpenInNewIcon />} href={receipt || undefined} target="_blank" rel="noopener noreferrer">
            Open in new tab
          </Button>
          <Button onClick={() => setReceipt(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* verify / reject confirmation */}
      <Dialog open={!!confirm} onClose={() => !acting && setConfirm(null)} maxWidth="xs" fullWidth>
        {confirm && (
          <>
            <DialogTitle>{confirm.action === "verify" ? "Verify this payment?" : "Reject this payment?"}</DialogTitle>
            <DialogContent>
              <div style={{ fontSize: "0.9rem", marginBottom: 12 }}>
                {confirm.reg.studentName} · {confirm.reg.eventTitle}
                <br />
                {pkr(confirm.reg.payment?.amount)} by {METHOD_LABEL[confirm.reg.payment?.method] || "—"}, transaction{" "}
                <span className="ev2-mono">{confirm.reg.payment?.transactionId || "—"}</span>
              </div>
              {confirm.action === "reject" ? (
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  label="Reason *"
                  placeholder="e.g. no payment with this transaction ID"
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 300))}
                  helperText={`The student sees this. ${reason.length}/300`}
                />
              ) : (
                <div style={{ color: "#555", fontSize: "0.85rem" }}>Only verify after you see this amount in the account. The student is notified.</div>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirm(null)} disabled={acting}>
                Cancel
              </Button>
              <Tooltip title={confirm.action === "reject" && !reason.trim() ? "Write a short reason" : ""}>
                <span>
                  <Button
                    variant="contained"
                    color={confirm.action === "verify" ? "success" : "error"}
                    onClick={review}
                    disabled={acting || (confirm.action === "reject" && !reason.trim())}
                  >
                    {acting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : confirm.action === "verify" ? "Verify" : "Reject"}
                  </Button>
                </span>
              </Tooltip>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}
