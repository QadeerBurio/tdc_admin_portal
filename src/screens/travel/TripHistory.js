// Travel history (design/portal/TrHistory): completed trips month by month, from GET /api/traveler/history
// (completed bookings for this account today).
// Will need for partners: GET /api/partner/travel/history (completed bookings on the partner's packages).
import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import Ico, { TONES } from "../../portal/Ico";
import { Select, StatCard, PageLoading } from "../../portal/kit";
import dotSorted from "../dots/sorted.png";
import "../styles/TravelPortal.css";

const rs = (n) => `rs ${Number(n || 0).toLocaleString()}`;
const when = (b) => new Date(b.travelDate || b.updatedAt || b.createdAt || 0);

// the timeline on its own: trips are bookings with packageId { name, location }
export function TripTimeline({ trips }) {
  const months = useMemo(() => {
    const m = new Map();
    [...trips].sort((a, b) => when(b) - when(a)).forEach((t) => {
      const key = when(t).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(t);
    });
    return [...m.entries()];
  }, [trips]);
  return (
    <div className="tr-timeline">
      {months.map(([month, list], i) => list.map((t, k) => (
        <div className="tr-tl" key={t._id || `${i}-${k}`}>
          <div className="tr-tl-rail"><span className={i === 0 && k === 0 ? "on" : ""} /><i /></div>
          <div className="tr-tl-body">
            <span className="k-muted">{month}</span>
            <b>{[t.packageId?.name || t.packageName || "trip", t.packageId?.location].filter(Boolean).join(" · ")}</b>
            <span className="k-muted">{t.numberOfTravelers || 1} {t.numberOfTravelers === 1 ? "student" : "students"} · {rs(t.totalAmount)}</span>
          </div>
        </div>
      )))}
    </div>
  );
}

export default function TripHistory() {
  const { token } = useOutletContext();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6m");

  useEffect(() => {
    if (!token) return;
    axios.get("https://the-deft-crew-production.up.railway.app/api/traveler/history", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setTrips(Array.isArray(res.data) ? res.data : []))
      .catch((err) => { console.error("Error fetching travel history", err); setTrips([]); })
      .finally(() => setLoading(false));
  }, [token]);

  const shown = useMemo(() => {
    const now = new Date();
    const from = period === "6m" ? new Date(now.getFullYear(), now.getMonth() - 5, 1) : period === "year" ? new Date(now.getFullYear(), 0, 1) : null;
    return from ? trips.filter((t) => when(t) >= from) : trips;
  }, [trips, period]);
  const students = shown.reduce((n, t) => n + (Number(t.numberOfTravelers) || 1), 0);
  const places = new Set(shown.map((t) => t.packageId?.location || t.packageId?.name || t.packageName).filter(Boolean)).size;
  const revenue = shown.reduce((n, t) => n + (Number(t.totalAmount) || 0), 0);

  if (loading) return <div className="tdcp k-page"><PageLoading label="Loading travel history..." /></div>;

  return (
    <div className="tdcp k-page" data-screen="travel-history">
      <div className="k-head">
        <div className="tr-title">
          <Ico kind="compass" tone="blue" size={56} />
          <div>
            <h1>travel history<span className="dot" aria-hidden="true">.</span></h1>
            <p>trips that have happened, month by month.</p>
          </div>
        </div>
        <div className="k-actions">
          <Select aria-label="period" style={{ width: "auto" }} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="6m">last 6 months</option>
            <option value="year">this year</option>
            <option value="all">all time</option>
          </Select>
        </div>
      </div>

      <div className="k-stats">
        <StatCard label="trips completed" value={shown.length} icon="check" tone="green" />
        <StatCard label="students travelled" value={students} icon="users" tone="blue" />
        <StatCard label="destinations" value={places} icon="pin" tone="sky" />
        <StatCard label="revenue" value={rs(revenue)} icon="coin" tone="orange" />
      </div>

      <div className="tr-dash-grid">
        <section className="k-card tr-pad">
          <h2 className="tr-h2">timeline</h2>
          {shown.length > 0 ? <TripTimeline trips={shown} /> : <p className="k-muted" style={{ margin: 0 }}>{trips.length ? "no trips in this period." : "nothing here yet."}</p>}
        </section>
        {shown.length === 0 && (
          <section className="tr-none tr-none-sky" style={{ background: TONES.sky[0] }}>
            <img src={dotSorted} alt="" />
            <h2>no trips completed yet<span className="dot" aria-hidden="true">.</span></h2>
            <p>completed bookings move here after the travel date.</p>
          </section>
        )}
      </div>
    </div>
  );
}
