// src/screens/BrandApprovalScreen.js
// Brand approvals (feat/admin-approvals-metrics; server routes/brandApproval.routes.js):
//   search (brand / owner name, email, phone, city, category — on the server, any case, debounced), filters
//   (status tabs with counts, city, category, joined between), sort, 25 per page; a row opens a drawer with the
//   business details, documents, branches, offers, contact and the approve / reject history (admin + reason);
//   approve, reject (reason required), request more info (reason required, the brand is notified), bulk approve /
//   reject with one reason. Every action is logged on the server; the list updates in place (no reload).
//   Kept from before: log in as an approved brand, an offer's QR code, permanent delete.
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import QRCode from 'qrcode';
import { TOKEN } from '../portal/tokens';
import {
  PageHeader, Button, Segmented, Modal, Drawer, EmptyState, Pill, Card, Facts, Field, Textarea, Table, SearchInput,
  Select, DateInput, Checkbox, toast,
} from '../portal/kit';
import DeleteAccountDialog from '../portal/DeleteAccountDialog';
import './styles/Brands.css';
import { storeBadge } from '../portal/storeBadge';
import { API_ORIGIN } from "../config/api";
import { brandApprovalApi } from '../services/brandApprovalApi';

const API_BASE = `${API_ORIGIN}/api`;
const PAGE_SIZE = 25;
const STATUS = {
  pending: { tone: 'orange', label: 'Pending' },
  approved: { tone: 'green', label: 'Approved' },
  rejected: { tone: 'red', label: 'Rejected' },
  draft: { tone: 'blue', label: 'Draft' },
};
const ACTION_LABEL = {
  'brand.approve': 'Approved', 'brand.reject': 'Rejected', 'brand.request_info': 'Asked for more information',
  'brand.set_pending': 'Moved back to pending', 'brand.set_draft': 'Saved as draft',
};
// what each decision needs: a reason for reject and request-info (the brand sees it)
const DECISIONS = {
  approved: { title: 'Approve', verb: 'approve', variant: 'success', icon: 'checkCircle', needsReason: false, hint: 'optional: a note for the brand' },
  rejected: { title: 'Reject', verb: 'reject', variant: 'danger', icon: 'xCircle', needsReason: true, hint: 'required: the brand sees this reason' },
  info: { title: 'Request more information', verb: 'send the request to', variant: 'primary', icon: 'mail', needsReason: true, hint: 'required: say what the brand needs to send or fix' },
};
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' }) : '–');
const fmtTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' }) : '–');
const nameOf = (b) => b?.brandName || b?.name || 'brand';

/** a value that follows `value` after `ms` without changes (the search box) */
function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

const StatusPill = ({ status }) => { const c = STATUS[status] || STATUS.pending; return <Pill tone={c.tone} dot>{c.label}</Pill>; };
const Logo = ({ b, lg }) => (b.logo
  ? <img src={b.logo} alt="" className={`ba-logo ${lg ? 'lg' : ''}`} />
  : <span className={`ba-logo ph ${lg ? 'lg' : ''}`} aria-hidden="true">{nameOf(b)[0].toUpperCase()}</span>);

const BrandApprovalScreen = () => {
  const { token, user, login } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  // filters (all on the server)
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 300);
  const [status, setStatus] = useState('pending');
  const [city, setCity] = useState('all');
  const [category, setCategory] = useState('all');
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ brands: [], total: 0, pages: 1, counts: {}, options: { cities: [], categories: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const seq = useRef(0);

  const [selected, setSelected] = useState(() => new Set());
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [decision, setDecision] = useState(null); // { kind: approved|rejected|info, ids: [] }
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);
  const [qr, setQr] = useState(null); // { image, offer, payload }
  const [copied, setCopied] = useState(false);

  // a new search / filter starts again on page 1
  useEffect(() => { setPage(1); }, [q, status, city, category, joinedFrom, joinedTo, sort]);

  const params = useCallback(() => ({
    q: q || undefined, status, city: city === 'all' ? undefined : city, category: category === 'all' ? undefined : category,
    joinedFrom: joinedFrom || undefined, joinedTo: joinedTo || undefined, sort, page, limit: PAGE_SIZE,
  }), [q, status, city, category, joinedFrom, joinedTo, sort, page]);

  /** quiet: refresh without the loading state (after an action) */
  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!isAdmin) return;
    const mine = ++seq.current;
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const res = await brandApprovalApi.list(params());
      if (mine !== seq.current) return; // an older reply arriving late
      setData({ brands: res.brands || [], total: res.total || 0, pages: res.pages || 1, counts: res.counts || {}, options: res.options || { cities: [], categories: [] } });
      setSelected((s) => new Set([...s].filter((id) => (res.brands || []).some((b) => b._id === id))));
    } catch (e) {
      if (mine === seq.current) setError(e.message || 'could not load brands');
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [isAdmin, params]);
  useEffect(() => { load(); }, [load]);

  const openDetail = useCallback(async (id) => {
    setOpenId(id);
    setDetail(null);
    setDetailError(null);
    try {
      setDetail(await brandApprovalApi.detail(id));
    } catch (e) {
      setDetailError(e.message || 'could not load this brand');
    }
  }, []);
  const closeDetail = () => { setOpenId(null); setDetail(null); setDetailError(null); };

  /** put the server's updated rows into the list (counts kept), then refresh counts quietly */
  const applyUpdated = (rows) => {
    const by = new Map(rows.filter(Boolean).map((b) => [b._id, b]));
    setData((d) => ({ ...d, brands: d.brands.map((b) => (by.has(b._id) ? { ...b, ...by.get(b._id) } : b)) }));
    if (openId && by.has(openId)) openDetail(openId);
    load({ quiet: true });
  };

  const startDecision = (kind, ids, bulk = false) => { setDecision({ kind, ids, bulk }); setReason(''); setReasonError(''); };
  const submitDecision = async () => {
    const d = DECISIONS[decision.kind];
    const text = reason.trim();
    if (d.needsReason && text.length < 3) { setReasonError('a reason is required (at least 3 characters)'); return; }
    setBusy(true);
    try {
      let rows = [];
      if (decision.kind === 'info') rows = [(await brandApprovalApi.requestInfo(decision.ids[0], text)).brand];
      else if (decision.ids.length === 1 && !decision.bulk) rows = [(await brandApprovalApi.setStatus(decision.ids[0], decision.kind, text)).brand];
      else rows = (await brandApprovalApi.bulk(decision.ids, decision.kind, text)).brands || [];
      toast(decision.kind === 'info' ? 'request sent to the brand' : `${rows.length} brand${rows.length === 1 ? '' : 's'} ${decision.kind}`, 'ok');
      setDecision(null);
      if (decision.bulk) setSelected(new Set());
      applyUpdated(rows);
    } catch (e) {
      if (e.code === 'REASON_REQUIRED') setReasonError(e.message);
      else toast(e.message || 'could not save', 'bad');
    } finally {
      setBusy(false);
    }
  };

  // ── kept from before: log in as an approved brand, an offer's QR code
  const handleAutoLogin = async (brandId) => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) { toast('You need to be logged in as admin first', 'bad'); return; }
    setAutoLoginLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/admin-login-as-brand`, { brandId }, { headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' } });
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        await login(response.data.token, response.data.user);
        toast(`Logged in as ${nameOf(response.data.user)}`, 'ok');
        setTimeout(() => { window.location.href = '/brand-dashboard'; }, 500);
      } else toast(response.data.message || 'Failed to login as brand', 'bad');
    } catch (error) {
      const s = error.response?.status;
      toast(s === 403 ? 'Only admins can login as brands' : s === 404 ? 'Brand not found' : error.response?.data?.message || 'Failed to login as brand', 'bad');
    } finally {
      setAutoLoginLoading(false);
    }
  };
  const showQr = async (offer, brand) => {
    try {
      const payload = { type: 'offer', offerId: offer._id, brandId: brand._id, brandName: nameOf(brand), offerTitle: offer.title || 'Offer', discount: offer.discountPercentage || 0, timestamp: new Date().toISOString(), isOnline: !!offer.isOnline, isInStore: !!offer.isInStore };
      const image = await QRCode.toDataURL(JSON.stringify(payload), { width: 400, margin: 2, color: { dark: TOKEN.ink, light: TOKEN.card }, errorCorrectionLevel: 'H' });
      setQr({ image, offer, payload });
    } catch {
      toast('Failed to generate QR code for this offer', 'bad');
    }
  };
  const downloadQr = () => { const a = document.createElement('a'); a.download = `qr-${qr.offer.title || 'offer'}.png`; a.href = qr.image; a.click(); };
  const copyQr = () => { navigator.clipboard?.writeText(JSON.stringify(qr.payload, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (!isAdmin) {
    return (
      <div className="tdcp k-page">
        <div className="k-card"><EmptyState icon="lock" tone="red" title="Access Restricted" text="This area is reserved for administrators only." /></div>
      </div>
    );
  }

  const { brands, counts } = data;
  const pageIds = brands.map((b) => b._id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected((s) => { const n = new Set(s); if (allOnPage) pageIds.forEach((id) => n.delete(id)); else pageIds.forEach((id) => n.add(id)); return n; });
  const filtered = !!(q || city !== 'all' || category !== 'all' || joinedFrom || joinedTo);
  const clearFilters = () => { setSearch(''); setCity('all'); setCategory('all'); setJoinedFrom(''); setJoinedTo(''); };
  const stop = (e) => e.stopPropagation();

  const columns = [
    { key: 'sel', label: <Checkbox aria-label="select every brand on this page" checked={allOnPage} onChange={toggleAll} />, thStyle: { width: 44 },
      render: (b) => <span onClick={stop}><Checkbox aria-label={`select ${nameOf(b)}`} checked={selected.has(b._id)} onChange={() => toggle(b._id)} /></span> },
    { key: 'brand', label: 'brand', render: (b) => (
      <span className="ba-line" style={{ gap: 12 }}>
        <Logo b={b} />
        <span className="ba-info">
          <button type="button" className="ba-link" onClick={(e) => { stop(e); openDetail(b._id); }}>{nameOf(b)}</button>
          <span className="ba-email">{b.name && b.brandName ? b.name : b.email}</span>
        </span>
      </span>
    ) },
    { key: 'category', label: 'category', render: (b) => b.category || 'General' },
    { key: 'city', label: 'city', render: (b) => b.city || '–' },
    { key: 'joined', label: 'joined', render: (b) => <span className="ba-date">{fmtDate(b.createdAt)}</span> },
    { key: 'branches', label: 'branches', render: (b) => b.branchesCount ?? 0, style: { textAlign: 'right' }, thStyle: { textAlign: 'right' } },
    { key: 'offers', label: 'offers', render: (b) => b.offersCount ?? 0, style: { textAlign: 'right' }, thStyle: { textAlign: 'right' } },
    { key: 'status', label: 'status', render: (b) => <StatusPill status={b.brandApprovalStatus} /> },
  ];

  const tab = (value, label) => ({ value, label, count: counts[value] ?? undefined });
  const d = detail?.brand;
  const decisionDef = decision ? DECISIONS[decision.kind] : null;

  return (
    <div className="tdcp k-page ba" data-screen="brand-approvals">
      <PageHeader
        title="brand approvals"
        sub="review new brands before they go live in the app."
        actions={<Button variant="secondary" icon="refresh" loading={loading} onClick={() => load()}>refresh</Button>}
      />

      <Segmented label="status" value={status} onChange={setStatus}
        options={[tab('pending', 'Pending'), tab('approved', 'Approved'), tab('rejected', 'Rejected'), tab('draft', 'Draft'), tab('all', 'All')]} />

      <div className="ba-filters" role="search" aria-label="find brands">
        <Field label="search" htmlFor="ba-search" style={{ flex: '2 1 260px' }}>
          <SearchInput id="ba-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="brand, owner, email, phone, city, category" autoComplete="off" />
        </Field>
        <Field label="city" htmlFor="ba-city" style={{ flex: '1 1 140px' }}>
          <Select id="ba-city" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">all cities</option>
            {data.options.cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="category" htmlFor="ba-cat" style={{ flex: '1 1 140px' }}>
          <Select id="ba-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">all categories</option>
            {data.options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="joined from" htmlFor="ba-from" style={{ flex: '1 1 140px' }}>
          <DateInput id="ba-from" value={joinedFrom} max={joinedTo || undefined} onChange={(e) => setJoinedFrom(e.target.value)} />
        </Field>
        <Field label="joined to" htmlFor="ba-to" style={{ flex: '1 1 140px' }}>
          <DateInput id="ba-to" value={joinedTo} min={joinedFrom || undefined} onChange={(e) => setJoinedTo(e.target.value)} />
        </Field>
        <Field label="sort" htmlFor="ba-sort" style={{ flex: '1 1 130px' }}>
          <Select id="ba-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">newest first</option>
            <option value="oldest">oldest first</option>
            <option value="name">name A–Z</option>
          </Select>
        </Field>
      </div>

      {selected.size > 0 && (
        <div className="k-card pad ba-bulk" role="region" aria-label="bulk actions">
          <b>{selected.size} selected</b>
          <Button size="sm" variant="success" icon="checkCircle" onClick={() => startDecision('approved', [...selected], true)}>approve selected</Button>
          <Button size="sm" variant="danger" icon="xCircle" onClick={() => startDecision('rejected', [...selected], true)}>reject selected</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>clear</Button>
        </div>
      )}

      {error ? (
        <div className="k-card" role="alert">
          <EmptyState icon="alert" tone="red" title="couldn't load brands" text={error} action={<Button icon="refresh" onClick={() => load()}>try again</Button>} />
        </div>
      ) : (
        <Table
          label="brands"
          columns={columns}
          rows={brands}
          loading={loading}
          onRowClick={(b) => openDetail(b._id)}
          minWidth={880}
          empty={<EmptyState icon="store" tone="sand" title={filtered ? 'no brands match' : status === 'all' ? 'no brands yet' : `no ${status} brands`}
            text={filtered ? 'try another search or clear the filters' : 'new brands show up here when they sign up'}
            action={filtered ? <Button variant="secondary" onClick={clearFilters}>clear filters</Button> : null} />}
        />
      )}

      {!error && data.total > 0 && (
        <nav className="ba-pager" aria-label="pages">
          <span className="k-hint" aria-live="polite">{data.total} brand{data.total === 1 ? '' : 's'} · page {page} of {data.pages}</span>
          <Button size="sm" variant="secondary" icon="chevronLeft" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>previous</Button>
          <Button size="sm" variant="secondary" iconRight="chevronRight" disabled={page >= data.pages || loading} onClick={() => setPage((p) => p + 1)}>next</Button>
        </nav>
      )}

      {/* brand detail */}
      <Drawer
        open={!!openId}
        onClose={closeDetail}
        title={d ? nameOf(d) : 'brand'}
        sub={d ? <StatusPill status={d.brandApprovalStatus} /> : undefined}
        footer={d ? <>
          <Button variant="ghost" icon="trash" onClick={() => setDeleteId(d._id)} style={{ color: 'var(--danger)' }}>delete</Button>
          {d.brandApprovalStatus === 'approved' && <Button variant="ghost" icon="key" loading={autoLoginLoading} onClick={() => handleAutoLogin(d._id)}>login as brand</Button>}
          <Button variant="secondary" icon="mail" onClick={() => startDecision('info', [d._id])}>request info</Button>
          {d.brandApprovalStatus !== 'rejected' && <Button variant="danger" icon="xCircle" onClick={() => startDecision('rejected', [d._id])}>reject</Button>}
          {d.brandApprovalStatus !== 'approved' && <Button variant="success" icon="checkCircle" onClick={() => startDecision('approved', [d._id])}>approve</Button>}
        </> : null}
      >
        {detailError ? (
          <EmptyState icon="alert" tone="red" title="couldn't load this brand" text={detailError} action={<Button onClick={() => openDetail(openId)}>try again</Button>} />
        ) : !d ? (
          <div role="status" className="k-hint">loading brand…</div>
        ) : (
          <div className="ba-detail">
            <div className="ba-who"><Logo b={d} lg /><div><b>{nameOf(d)}</b><div className="k-hint">joined {fmtDate(d.createdAt)}</div></div></div>
            <Card title="business details" icon="store" tone="purple">
              <Facts rows={[['brand name', nameOf(d)], ['owner', d.name], ['category', d.category || 'General'], ['city', d.city], ['address', d.address], ['sells', [d.isOnline && 'online', d.isInStore && 'in store'].filter(Boolean).join(' · ') || '–']]} />
            </Card>
            <Card title="contact" icon="mail" tone="blue">
              <Facts rows={[['email', d.email], ['phone', d.phone], ['website', d.websiteUrl]]} />
            </Card>
            <Card title="documents" icon="file" tone="sand">
              <Facts rows={[
                ['logo', d.logo ? <a key="l" href={d.logo} target="_blank" rel="noreferrer">open logo</a> : 'none'],
                ['online store', (() => { const s = storeBadge(d.onlineStore); return <Pill key="s" tone={s.tone}>{s.label}</Pill>; })()],
              ]} />
              <p className="k-hint" style={{ margin: '8px 0 0' }}>brands don't upload registration documents at sign-up; use “request info” to ask for any you need.</p>
            </Card>
            <Card title={`branches (${detail.branches.length})`} icon="pin" tone="green">
              {detail.branches.length ? (
                <ul className="ba-ul">{detail.branches.map((b) => <li key={b._id}><b>{b.name}</b> <span className="k-hint">{[b.city, b.location].filter(Boolean).join(' · ')}</span> {!b.isActive && <Pill tone="red">inactive</Pill>}</li>)}</ul>
              ) : <p className="k-hint" style={{ margin: 0 }}>no branches yet</p>}
            </Card>
            <Card title={`offers (${detail.offers.length})`} icon="gift" tone="yellow">
              {detail.offers.length ? (
                <div className="ba-offers">{detail.offers.map((o) => (
                  <div key={o._id} className="ba-offer">
                    <div className="ba-offer-main"><b>{o.title}</b><span className="ba-ok">{o.discountPercentage}% off</span><Pill tone={o.status === 'archived' ? 'sand' : 'green'} dot>{o.status === 'archived' ? 'archived' : 'live'}</Pill></div>
                    <div className="ba-offer-side"><Button size="sm" variant="secondary" icon="qr" onClick={() => showQr(o, d)}>QR</Button></div>
                  </div>
                ))}</div>
              ) : <p className="k-hint" style={{ margin: 0 }}>no offers yet</p>}
            </Card>
            <Card title="history" icon="clock" tone="sand">
              {detail.history.length ? (
                <ol className="ba-history">{detail.history.map((h) => (
                  <li key={h.id}>
                    <b>{ACTION_LABEL[h.action] || h.action}</b>
                    <span className="k-hint"> · {fmtTime(h.at)} · {h.admin ? `by ${h.admin.name}` : 'before the action log (admin not recorded)'}</span>
                    {h.reason && <div className="ba-reason">“{h.reason}”</div>}
                  </li>
                ))}</ol>
              ) : <p className="k-hint" style={{ margin: 0 }}>no decisions yet</p>}
            </Card>
          </div>
        )}
      </Drawer>

      {/* approve / reject / request info — one brand or the selection */}
      <Modal
        open={!!decision}
        onClose={busy ? undefined : () => setDecision(null)}
        size="sm"
        icon={decisionDef?.icon}
        tone={decision?.kind === 'rejected' ? 'red' : decision?.kind === 'approved' ? 'green' : 'blue'}
        title={decision ? `${decisionDef.title}${decision.ids.length > 1 ? ` ${decision.ids.length} brands` : ''}` : ''}
        sub={decision ? (decision.ids.length > 1 ? 'one reason for all of them; each brand is notified and logged' : 'the brand is notified; this is logged with your name') : undefined}
        footer={decision ? <>
          <Button variant="secondary" onClick={() => setDecision(null)} disabled={busy}>cancel</Button>
          <Button variant={decisionDef.variant} icon={decisionDef.icon} loading={busy} onClick={submitDecision}>{decisionDef.title.toLowerCase()}</Button>
        </> : null}
      >
        {decision && (
          <Field label={decisionDef.needsReason ? 'reason (required)' : 'note (optional)'} htmlFor="ba-reason" hint={decisionDef.hint} error={reasonError}>
            <Textarea id="ba-reason" rows={4} maxLength={500} value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(''); }} invalid={!!reasonError} aria-required={decisionDef.needsReason} autoFocus />
          </Field>
        )}
      </Modal>

      <Modal
        open={!!qr}
        onClose={() => setQr(null)}
        icon="qr"
        tone="yellow"
        title={`QR code - ${qr ? qr.payload.brandName : ''}`}
        sub={qr ? `${qr.offer.title} • ${qr.offer.discountPercentage}% OFF` : undefined}
        footer={qr ? <>
          <Button variant="secondary" icon="copy" onClick={copyQr}>{copied ? 'copied!' : 'copy data'}</Button>
          <Button icon="download" onClick={downloadQr}>download</Button>
        </> : null}
      >
        {qr && <div className="ba-qr"><img src={qr.image} alt={`QR code for ${qr.offer.title}`} /></div>}
      </Modal>

      {deleteId && (
        <DeleteAccountDialog
          userId={deleteId}
          onClose={() => setDeleteId(null)}
          onDeleted={() => {
            if (openId === deleteId) closeDetail();
            setData((x) => ({ ...x, brands: x.brands.filter((b) => b._id !== deleteId) }));
            setDeleteId(null);
            load({ quiet: true });
          }}
        />
      )}
    </div>
  );
};

export default BrandApprovalScreen;
