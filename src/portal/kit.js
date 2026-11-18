// kit.js: the tdc portal UI kit (design/portal/Ad*). One loader, one button, one input, one modal...
// Every admin screen uses these so the whole admin looks the same. Colours: tdc tokens and Ico tones.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import Ico, { TONES } from "./Ico";
import "./portal.css";
import "./kit.css";
import "./motion.css";
import CountUp from "./motion";

const cx = (...a) => a.filter(Boolean).join(" ");

/* ---------------- loader ---------------- */
export function Spinner({ size = "md", onDark = false, label }) {
  return <span className={cx("k-spin", size, onDark && "on-dark")} role={label ? "status" : undefined} aria-label={label} aria-hidden={label ? undefined : "true"} />;
}
export function PageLoading({ label = "loading…", minHeight }) {
  return (
    <div className="k-page-loading" role="status" style={minHeight ? { minHeight } : undefined}>
      <Spinner size="lg" />
      <span>{label}</span>
    </div>
  );
}
export function Skeleton({ w = "100%", h = 14, r, style }) {
  return <span className="k-skel" aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/* ---------------- buttons ---------------- */
export function Button({ variant = "primary", size, block, loading, icon, iconRight, children, className, type = "button", disabled, ...rest }) {
  return (
    <button type={type} className={cx("k-btn", variant, size, block && "block", className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner size="sm" onDark={variant === "primary"} /> : icon ? <Ico kind={icon} tone="plain" size={18} /> : null}
      {children}
      {iconRight && !loading && <Ico kind={iconRight} tone="plain" size={18} />}
    </button>
  );
}
export function IconButton({ icon, label, variant, size, className, type = "button", ...rest }) {
  return (
    <button type={type} className={cx("k-icon-btn", variant, size, className)} aria-label={label} title={label} {...rest}>
      <Ico kind={icon} tone="plain" size={size === "sm" ? 15 : 18} />
    </button>
  );
}

/* ---------------- fields ---------------- */
export function Field({ label, hint, error, children, htmlFor, style }) {
  return (
    <div className="k-field" style={style}>
      {label && <label className="k-label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="k-error">{error}</span> : hint ? <span className="k-hint">{hint}</span> : null}
    </div>
  );
}
export const Input = React.forwardRef(function Input({ className, size, invalid, ...rest }, ref) {
  return <input ref={ref} className={cx("k-input", size, invalid && "invalid", className)} {...rest} />;
});
export const Textarea = React.forwardRef(function Textarea({ className, invalid, ...rest }, ref) {
  return <textarea ref={ref} className={cx("k-textarea", invalid && "invalid", className)} {...rest} />;
});
export const Select = React.forwardRef(function Select({ className, size, invalid, children, ...rest }, ref) {
  return <select ref={ref} className={cx("k-select", size, invalid && "invalid", className)} {...rest}>{children}</select>;
});
export function SearchInput({ className, style, ...rest }) {
  return (
    <div className={cx("k-search", className)} style={style}>
      <span className="k-search-ico"><Ico kind="search" tone="plain" size={17} /></span>
      <input type="search" className="k-input" {...rest} />
    </div>
  );
}
export const DateInput = React.forwardRef(function DateInput({ className, withTime, ...rest }, ref) {
  return <input ref={ref} type={withTime ? "datetime-local" : "date"} className={cx("k-input", "k-date", className)} {...rest} />;
});
export function Checkbox({ label, className, ...rest }) {
  return <label className={cx("k-check", className)}><input type="checkbox" {...rest} />{label}</label>;
}

// Searchable dropdown. options: [{ value, label, hint }]. onChange(value). With multiple: value is an array.
export function Dropdown({ options = [], value, onChange, placeholder = "select…", searchable = true, multiple = false, disabled, id, renderOption, emptyText = "no matches", style }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? options.filter((o) => `${o.label} ${o.hint || ""}`.toLowerCase().includes(t)) : options;
  }, [options, q]);
  const selected = multiple ? options.filter((o) => (value || []).includes(o.value)) : options.find((o) => o.value === value);
  const pick = (o) => {
    if (multiple) {
      const cur = value || [];
      onChange(cur.includes(o.value) ? cur.filter((v) => v !== o.value) : [...cur, o.value]);
    } else { onChange(o.value); setOpen(false); setQ(""); }
  };
  const onKey = (e) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, list.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && open && list[active]) { e.preventDefault(); pick(list[active]); }
  };
  return (
    <div className="k-dd" ref={ref} style={style} onKeyDown={onKey} data-kit="dropdown">
      <button type="button" id={id} className="k-dd-btn" aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen((o) => !o)}>
        {multiple
          ? (selected.length ? selected.map((o) => (
            <span className="k-tag" key={o.value}>{o.label}
              <span role="button" tabIndex={-1} className="k-tag-x" aria-label={`remove ${o.label}`} onClick={(e) => { e.stopPropagation(); pick(o); }}><Ico kind="close" tone="plain" size={12} /></span>
            </span>)) : <span className="k-dd-ph">{placeholder}</span>)
          : selected ? <span>{selected.label}</span> : <span className="k-dd-ph">{placeholder}</span>}
        <span className="k-dd-caret"><Ico kind="chevronDown" tone="plain" size={16} /></span>
      </button>
      {open && (
        <div className="k-dd-pop">
          {searchable && <input autoFocus className="k-input" placeholder="search…" value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} aria-label="search options" />}
          <div className="k-dd-list" role="listbox" aria-multiselectable={multiple || undefined}>
            {list.length === 0 && <div className="k-dd-empty">{emptyText}</div>}
            {list.map((o, i) => {
              const on = multiple ? (value || []).includes(o.value) : o.value === value;
              return (
                <div key={String(o.value)} role="option" aria-selected={on} className={cx("k-dd-opt", i === active && "active")} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(o); }}>
                  <span>{renderOption ? renderOption(o) : o.label}{o.hint && <span className="k-muted" style={{ fontSize: 12.5 }}> · {o.hint}</span>}</span>
                  {on && <Ico kind="check" tone="plain" size={15} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export const MultiSelect = (props) => <Dropdown {...props} multiple />;

// File upload: click or drop. onChange receives an event-like object ({ target: { files } }) so existing handlers keep working.
export function FileUpload({ accept, multiple, onChange, label = "click or drop a file", hint, file, disabled, inputRef }) {
  const [over, setOver] = useState(false);
  const local = useRef(null);
  const ref = inputRef || local;
  return (
    <div
      className={cx("k-drop", over && "over")}
      role="button" tabIndex={0} data-kit="upload"
      onClick={() => !disabled && ref.current && ref.current.click()}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && ref.current) { e.preventDefault(); ref.current.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled && e.dataTransfer.files?.length) onChange({ target: { files: e.dataTransfer.files }, dataTransfer: e.dataTransfer, preventDefault() {} }); }}
    >
      <Ico kind="upload" tone="sand" size={40} />
      <span><b>{file ? (file.name || String(file)) : label}</b></span>
      {hint && <span className="k-hint">{hint}</span>}
      <input ref={ref} type="file" accept={accept} multiple={multiple} hidden onChange={onChange} disabled={disabled} />
    </div>
  );
}
export function Progress({ value = 0, label }) {
  return (
    <div>
      <div className="k-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
      {label && <span className="k-hint">{label}</span>}
    </div>
  );
}

/* ---------------- tabs ---------------- */
export function Tabs({ tabs, value, onChange, label = "sections" }) {
  return (
    <div className="k-tabs" role="tablist" aria-label={label} data-kit="tabs">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className="k-tab" onClick={() => onChange(t.id)}>
          {t.icon && <Ico kind={t.icon} tone="plain" size={17} />}{t.label}{t.count != null && <span className="k-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
// Segmented filter (status filters etc.)
export function Segmented({ options, value, onChange, label = "filter" }) {
  return (
    <div className="k-seg" role="group" aria-label={label} data-kit="tabs">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}{o.count != null && <span style={{ opacity: .7 }}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------- modal, drawer ----------------
 * Every modal and drawer in the portal (and TypeToConfirm / confirmDialog, which are modals):
 *  - the header (title + close) and the footer (actions) stay put; only the body scrolls (both are flex items that
 *    don't shrink; the body has min-height: 0, so it can be shorter than its content and scroll)
 *  - at most the viewport minus a margin (100dvh: mobile browser bars don't cut it off); full screen on phones
 *  - wide tables scroll sideways inside the body, never the page
 *  - the page behind is locked (also on iOS: the body is pinned) and comes back to where it was on close
 *  - Escape closes; Tab stays inside; focus goes back to what opened it; Page Up / Down, arrows, Home / End scroll
 *    the body even when the focus is on the close button
 */
// one lock for any number of open modals (a confirm on top of a modal): released when the last one closes
let lockCount = 0;
let locked = null; // { y, style }
function lockPage() {
  if (lockCount++ > 0) return;
  const b = document.body;
  locked = { y: window.scrollY || window.pageYOffset || 0, style: { position: b.style.position, top: b.style.top, left: b.style.left, right: b.style.right, width: b.style.width, overflow: b.style.overflow } };
  Object.assign(b.style, { position: "fixed", top: `-${locked.y}px`, left: "0", right: "0", width: "100%", overflow: "hidden" });
  b.setAttribute("data-modal-open", "");
}
function unlockPage() {
  if (--lockCount > 0 || !locked) return;
  const b = document.body;
  Object.assign(b.style, locked.style);
  b.removeAttribute("data-modal-open");
  const y = locked.y;
  locked = null;
  window.scrollTo(0, y);
}
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SCROLL_KEYS = { PageDown: 0.9, PageUp: -0.9, ArrowDown: 40, ArrowUp: -40, Home: "top", End: "bottom", " ": 0.9 };
const typing = (el) => !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);

function useDialog(open, onClose) {
  const dialogRef = useRef(null);
  const bodyRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    lockPage();
    // focus: the first field / button in the body, else the dialog itself
    const t = setTimeout(() => {
      const d = dialogRef.current;
      if (!d || d.contains(document.activeElement)) return;
      const first = bodyRef.current?.querySelector(FOCUSABLE) || d.querySelector(FOCUSABLE);
      (first || d).focus({ preventScroll: true });
    }, 0);
    const onKey = (e) => {
      const d = dialogRef.current;
      if (!d) return;
      // only the top-most dialog answers (a confirm opened over a modal)
      const all = document.querySelectorAll('[data-kit-dialog="open"]');
      if (all[all.length - 1] !== d) return;
      if (e.key === "Escape" && closeRef.current) { e.stopPropagation(); closeRef.current(); return; }
      if (e.key === "Tab") {
        const items = [...d.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null || x === document.activeElement);
        if (!items.length) { e.preventDefault(); d.focus(); return; }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !d.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !d.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
        return;
      }
      const step = SCROLL_KEYS[e.key];
      const body = bodyRef.current;
      if (step === undefined || !body || typing(e.target) || (e.key === " " && e.target?.tagName === "BUTTON")) return;
      // the body scrolls itself when it (or something in it) has the focus; from the header / footer we do it
      if (body.contains(e.target) && e.target !== body && /^(ArrowDown|ArrowUp)$/.test(e.key) && e.target.closest?.('[role="listbox"],[role="tablist"],[role="radiogroup"]')) return;
      e.preventDefault();
      if (step === "top") body.scrollTop = 0;
      else if (step === "bottom") body.scrollTop = body.scrollHeight;
      else body.scrollTop += step < 1 && step > -1 ? step * body.clientHeight : step;
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      unlockPage();
      if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open]);
  return { dialogRef, bodyRef };
}

export function Modal({ open = true, onClose, title, sub, icon, tone = "sand", size, footer, children, closeLabel = "close", bodyStyle }) {
  const { dialogRef, bodyRef } = useDialog(open, onClose);
  if (!open) return null;
  const label = typeof title === "string" ? title : undefined;
  return createPortal(
    <div className="tdcp k-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }} data-kit="modal">
      <div ref={dialogRef} className={cx("k-modal", size)} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} data-kit-dialog="open">
        {(title || onClose) && (
          <div className="k-modal-head">
            {icon && <Ico kind={icon} tone={tone} size={40} />}
            <div style={{ flex: 1, minWidth: 0 }}>{title && <h2>{title}</h2>}{sub && <p>{sub}</p>}</div>
            {onClose && <IconButton icon="close" label={closeLabel} variant="ghost" onClick={onClose} />}
          </div>
        )}
        <div ref={bodyRef} className="k-modal-body" style={bodyStyle} tabIndex={0} role="region" aria-label={label ? `${label}: content` : "content"} data-kit-body>{children}</div>
        {footer && <div className="k-modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
export function Drawer({ open = true, onClose, title, sub, footer, children }) {
  const { dialogRef, bodyRef } = useDialog(open, onClose);
  if (!open) return null;
  const label = typeof title === "string" ? title : undefined;
  return createPortal(
    <div className="tdcp k-overlay drawer" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }} data-kit="drawer">
      <div ref={dialogRef} className="k-drawer" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} data-kit-dialog="open">
        <div className="k-modal-head">
          <div style={{ flex: 1, minWidth: 0 }}>{title && <h2>{title}</h2>}{sub && <p>{sub}</p>}</div>
          {onClose && <IconButton icon="close" label="close" variant="ghost" onClick={onClose} />}
        </div>
        <div ref={bodyRef} className="k-modal-body" tabIndex={0} role="region" aria-label={label ? `${label}: content` : "content"} data-kit-body>{children}</div>
        {footer && <div className="k-modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
// TypeToConfirm: a modal for things that can't be undone. The confirm button stays off until the exact
// text (e.g. the account's name) is typed. children: what will happen; disabledReason: why it can't now.
export function TypeToConfirm({ open = true, onClose, title, sub, expected, children, confirmLabel = "delete", loading, disabledReason, error, onConfirm }) {
  const [typed, setTyped] = useState("");
  useEffect(() => { if (!open) setTyped(""); }, [open]);
  const matches = !!expected && typed.trim() === String(expected).trim();
  const canConfirm = matches && !loading && !disabledReason;
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      icon="alert"
      tone="red"
      title={title}
      sub={sub}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={loading}>cancel</Button>
        <Button variant="danger" icon="trash" loading={loading} disabled={!canConfirm} onClick={onConfirm}>{confirmLabel}</Button>
      </>}
    >
      {children}
      {disabledReason ? <p className="k-error" role="status" style={{ margin: 0 }}>{disabledReason}</p> : (
        <Field label={<>type <b style={{ color: "var(--ink)" }}>{expected}</b> to confirm</>} htmlFor="k-type-confirm" error={error}>
          <Input id="k-type-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} disabled={loading}
            onKeyDown={(e) => { if (e.key === "Enter" && canConfirm) onConfirm(); }} invalid={!!error} />
        </Field>
      )}
    </Modal>
  );
}

/* ---------------- table, empty ---------------- */
export function EmptyState({ icon = "search", tone = "sand", title, text, action }) {
  return (
    <div className="k-empty">
      <Ico kind={icon} tone={tone} size={52} />
      {title && <h3>{title}</h3>}
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
// columns: [{ key, label, render(row), style }], rows, rowKey, onRowClick
export function Table({ columns, rows, rowKey = (r, i) => r._id || i, onRowClick, empty, loading, minWidth = 720, label = "table" }) {
  return (
    <div className="k-table-card">
      {/* focusable so keyboard users can scroll a wide table sideways (WCAG scrollable-region-focusable) */}
      <div className="k-table-scroll" tabIndex={0} role="region" aria-label={label}>
        <table className="k-table" style={{ minWidth }}>
          <thead><tr>{columns.map((c) => <th key={c.key} style={c.thStyle}>{c.label}</th>)}</tr></thead>
          {!loading && rows.length > 0 && (
            <tbody>
              {rows.map((r, i) => (
                <tr key={rowKey(r, i)} className={onRowClick ? "clickable" : undefined} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                  {columns.map((c) => <td key={c.key} style={c.style}>{c.render ? c.render(r, i) : r[c.key]}</td>)}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {loading ? <PageLoading /> : rows.length === 0 ? (empty || <EmptyState title="nothing here yet" />) : null}
    </div>
  );
}

/* ---------------- pill, stat, header, card ---------------- */
// tone: an Ico tone (red, sky, green, purple, orange, coral, blue, pink, yellow, ink, sand, white)
// pill text is small, so it needs 4.5:1 on its tint (icons only need 3:1): darker text for the tones whose icon
// colour is lighter than that (WCAG 2 AA, checked with axe)
const PILL_TEXT = { red: "#B63935", sky: "#196EA1", green: "#287A37", orange: "#9B5D00", coral: "#C03438", blue: "#256DA5" };
export function Pill({ tone = "sand", dot, children, title }) {
  const [bg, fg] = TONES[tone] || TONES.sand;
  return <span className="k-pill" title={title} style={{ background: bg, color: PILL_TEXT[tone] || fg }}>{dot && <span className="k-pill-dot" />}{children}</span>;
}
export function StatCard({ label, value, sub, icon, tone = "sand", dark, onClick, pressed }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className={cx("k-stat", dark && "dark")} onClick={onClick} aria-pressed={onClick ? !!pressed : undefined}>
      {icon && <div className="k-stat-ico"><Ico kind={icon} tone={dark ? "yellow" : tone} size={40} /></div>}
      <div className="k-stat-lbl">{label}</div>
      <div className="k-stat-num"><CountUp value={value} /></div>
      {sub != null && sub !== "" && <div className="k-stat-sub">{sub}</div>}
    </Tag>
  );
}
export function PageHeader({ title, sub, actions, children }) {
  return (
    <div className="k-head">
      <div style={{ minWidth: 0 }}>
        <h1>{title}<span className="dot" aria-hidden="true">.</span></h1>
        {sub && <p>{sub}</p>}
        {children}
      </div>
      {actions && <div className="k-actions">{actions}</div>}
    </div>
  );
}
export function Card({ title, icon, tone = "sand", action, children, pad = true, style }) {
  return (
    <section className={cx("k-card", pad && "pad")} style={style}>
      {(title || action) && (
        <div className="k-card-head">
          {icon && <Ico kind={icon} tone={tone} size={36} />}
          {title && <h3>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Facts({ rows }) {
  return <div className="k-facts">{rows.map(([k, v]) => <div className="k-fact" key={k}><span>{k}</span><span>{v === undefined || v === null || v === "" ? "–" : v}</span></div>)}</div>;
}

/* ---------------- toast + confirm (self-mounting, work in any screen or portal) ---------------- */
let hostApi = null;
let hostReady = null;
function ensureHost() {
  if (hostApi) return Promise.resolve(hostApi);
  if (hostReady) return hostReady;
  hostReady = new Promise((resolve) => {
    const el = document.createElement("div");
    el.setAttribute("data-kit-host", "");
    document.body.appendChild(el);
    createRoot(el).render(<KitHost onReady={(api) => { hostApi = api; resolve(api); }} />);
  });
  return hostReady;
}
function KitHost({ onReady }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  useEffect(() => {
    onReady({
      toast: (message, tone) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((t) => [...t, { id, message: String(message), tone }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
      },
      confirm: (message, opts) => new Promise((resolve) => setConfirmState({ message: String(message), opts: opts || {}, resolve })),
    });
  }, [onReady]);
  const done = (v) => { if (confirmState) confirmState.resolve(v); setConfirmState(null); };
  return (
    <>
      {toasts.length > 0 && createPortal(
        <div className="tdcp k-toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={cx("k-toast", t.tone)} role="status" data-kit="toast">
              <span className="k-toast-dot" />
              <span className="k-toast-msg">{t.message}</span>
              <button type="button" aria-label="dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}><Ico kind="close" tone="plain" size={14} /></button>
            </div>
          ))}
        </div>, document.body)}
      {confirmState && (
        <Modal
          onClose={() => done(false)}
          size="sm"
          title={confirmState.opts.title || "are you sure?"}
          icon={confirmState.opts.danger === false ? "info" : "alert"}
          tone={confirmState.opts.danger === false ? "sand" : "red"}
          footer={<>
            <Button variant="secondary" onClick={() => done(false)}>{confirmState.opts.cancelLabel || "cancel"}</Button>
            <Button variant={confirmState.opts.danger === false ? "primary" : "danger"} onClick={() => done(true)} autoFocus>{confirmState.opts.confirmLabel || "yes, continue"}</Button>
          </>}
        >
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, whiteSpace: "pre-line" }} data-kit="confirm">{confirmState.message}</p>
        </Modal>
      )}
    </>
  );
}
// toast(message): replaces alert(message). Same text. Tone is picked from the words (failed/error -> red, success -> green).
export function toast(message, tone) {
  const t = tone || (/(fail|error|could not|couldn't|invalid|denied|not found|unable|please|required|must|missing|cannot)/i.test(String(message)) ? "bad" : /(success|saved|sent|created|updated|deleted|approved|copied|done|uploaded|published|added|removed|verified)/i.test(String(message)) ? "ok" : undefined);
  ensureHost().then((api) => api.toast(message, t));
}
// confirmDialog(message): replaces window.confirm(message). Resolves true (continue) or false (stop).
export function confirmDialog(message, opts) {
  return ensureHost().then((api) => api.confirm(message, opts));
}
