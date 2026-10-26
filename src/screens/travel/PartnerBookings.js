// Bookings (design/portal/TrBookings). Today it shows the rows GET /api/traveler/bookings returns for this
// account (loaded by the shell); confirm and decline stay disabled until handlers are passed.
// Will need: GET /api/partner/travel/bookings (student name and contact, package, travel date, amount,
// status pending|confirmed|declined|cancelled|completed, stats) and
// POST /api/partner/travel/bookings/:id/confirm and /decline (with a reason).
import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Ico from "../../portal/Ico";
import { Button, IconButton, SearchInput, Segmented, StatCard, EmptyState, PageLoading, Pill } from "../../portal/kit";
import dotSorted from "../dots/sorted.png";
import "../styles/TravelPortal.css";

const rs = (n) => `rs ${Number(n || 0).toLocaleString()}`;
export const BOOKING_TONE = { pending: "orange", confirmed: "green", declined: "red", cancelled: "sand", completed: "blue" };
const FILTERS = ["all", "pending", "confirmed", "cancelled"];

// the bookings table on its own, so the partner API can feed it later
export function BookingsTable({ bookings, onConfirm = null, onDecline = null }) {
  return (
    <div className="k-table-card">
      <div className="k-table-scroll">
        <table className="k-table" style={{ minWidth: 860 }}>
          <thead>
            <tr><th>student</th><th>package</th><th>travel date</th><th>amount</th><th>status</th><th style={{ textAlign: "right" }}>actions</th></tr>
          </thead>
          {bookings.length > 0 && (
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <b>{b.customerName || "student"}</b>
                    {b.customerEmail && <div className="k-hint">{b.customerEmail}</div>}
                  </td>
                  <td>
                    {b.packageName || b.packageId?.name || "package"}
                    {b.packageId?.location && <div className="k-hint">{b.packageId.location}</div>}
                  </td>
                  <td className="tr-nowrap">
                    {b.travelDate ? new Date(b.travelDate).toLocaleDateString() : "–"}
                    <div className="k-hint">{b.numberOfTravelers || 1} {b.numberOfTravelers === 1 ? "traveller" : "travellers"}</div>
                  </td>
                  <td className="tr-nowrap"><b>{rs(b.totalAmount)}</b></td>
                  <td><Pill tone={BOOKING_TONE[b.status] || "sand"} dot>{b.status || "pending"}</Pill></td>
                  <td>
                    {b.status === "pending" ? (
                      <span className="k-row" style={{ gap: 6, flexWrap: "nowrap", justifyContent: "flex-end" }}>
                        <Button size="sm" icon="check" disabled={!onConfirm} title={onConfirm ? "confirm" : "confirming opens with partner bookings"} onClick={() => onConfirm && onConfirm(b)}>confirm</Button>
                        <IconButton icon="close" label={onDecline ? "decline" : "declining opens with partner bookings"} variant="danger" size="sm" disabled={!onDecline} onClick={() => onDecline && onDecline(b)} />
                      </span>
                    ) : (
                      <span className="k-hint" style={{ display: "block", textAlign: "right" }}>–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {bookings.length === 0 && (
        <div className="tr-table-none">
          <img src={dotSorted} alt="" />
          <p className="tr-none-t">no bookings yet<span className="dot" aria-hidden="true">.</span></p>
          <p className="k-muted">once students book a package, you'll confirm or decline them here.</p>
        </div>
      )}
    </div>
  );
}

export default function PartnerBookings() {
  const { bookings, loading, reload } = useOutletContext();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c = { all: bookings.length };
    bookings.forEach((b) => { c[b.status] = (c[b.status] || 0) + 1; });
    return c;
  }, [bookings]);
  const revenue = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").reduce((n, b) => n + (Number(b.totalAmount) || 0), 0);
  const shown = useMemo(() => {
    const t = search.toLowerCase().trim();
    return bookings.filter((b) =>
      (status === "all" || b.status === status) &&
      (!t || [b.customerName, b.customerEmail, b.packageName, b.packageId?.name].some((v) => v && v.toLowerCase().includes(t)))
    );
  }, [bookings, status, search]);

  if (loading) return <div className="tdcp k-page"><PageLoading label="Loading bookings..." /></div>;

  return (
    <div className="tdcp k-page" data-screen="travel-bookings">
      <div className="k-head">
        <div className="tr-title">
          <Ico kind="calendar" tone="purple" size={56} />
          <div>
            <h1>bookings<span className="dot" aria-hidden="true">.</span></h1>
            <p>every student booking for your packages.</p>
          </div>
        </div>
        <div className="k-actions">
          <Button variant="secondary" icon="refresh" onClick={reload}>refresh</Button>
        </div>
      </div>

      <div className="k-stats">
        <StatCard label="total bookings" value={bookings.length} icon="users" tone="blue" />
        <StatCard label="pending" value={counts.pending || 0} icon="clock" tone="orange" />
        <StatCard label="confirmed" value={counts.confirmed || 0} icon="check" tone="green" />
        <StatCard label="revenue" value={rs(revenue)} icon="coin" tone="purple" />
      </div>

      <div className="k-toolbar">
        <SearchInput className="k-grow" aria-label="search bookings" placeholder="search by student, email or package" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Segmented label="status" value={status} onChange={setStatus} options={FILTERS.map((f) => ({ value: f, label: f, count: f === "all" ? counts.all : counts[f] || 0 }))} />
      </div>

      {bookings.length > 0 && shown.length === 0 ? (
        <div className="k-card"><EmptyState icon="search" title="no bookings match" text="try another filter or search." /></div>
      ) : (
        <BookingsTable bookings={shown} />
      )}
    </div>
  );
}
