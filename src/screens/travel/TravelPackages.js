// Packages (design/portal/TrPackages): the student trips live in the app, from GET /api/traveler/packages.
// Partners cannot own or edit packages yet, so cards are read-only and "edit" stays disabled.
// Will need for editing: packages scoped to the partner (owner, status draft|published, bookings count)
// from GET /api/partner/travel/packages, and the PackageForm handlers.
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import axios from "axios";
import Ico, { TONES } from "../../portal/Ico";
import { Button, SearchInput, Segmented, Select, EmptyState, PageLoading, Pill } from "../../portal/kit";
import PackageForm from "./PackageForm";
import "../styles/TravelPortal.css";

const TILE = [["compass", "sky"], ["globe", "orange"], ["pin", "purple"], ["plane", "blue"], ["star", "yellow"]];
const rs = (n) => `rs ${Number(n || 0).toLocaleString()}`;

// one package card; status and bookings show when the partner API provides them
export function PackageCard({ pkg, index = 0, onEdit = null }) {
  const [icon, tone] = TILE[index % TILE.length];
  const [broken, setBroken] = useState(false);
  return (
    <article className="k-card tr-pack">
      <div className="tr-pack-media" style={{ background: TONES[tone][0] }}>
        {pkg.image && !broken ? <img src={pkg.image} alt="" onError={() => setBroken(true)} /> : <Ico kind={icon} tone="white" size={64} />}
        {pkg.category && <span className="tr-pack-cat">{pkg.category}</span>}
        <span className="tr-pack-status"><Pill tone={pkg.status === "draft" ? "sand" : "green"}>{pkg.status === "draft" ? "draft" : "live"}</Pill></span>
      </div>
      <div className="tr-pack-body">
        <h2>{pkg.name}</h2>
        {pkg.location && <p className="tr-pack-where"><Ico kind="pin" tone="plain" size={16} />{pkg.location}</p>}
        <div className="tr-pack-foot">
          <div>
            <b>{rs(pkg.price)}</b>
            {pkg.bookings != null && <span className="k-muted">{pkg.bookings} bookings</span>}
          </div>
          <Button variant="secondary" size="sm" disabled={!onEdit} title={onEdit ? "edit" : "editing opens with partner packages"} onClick={() => onEdit && onEdit(pkg)}>edit</Button>
        </div>
      </div>
    </article>
  );
}

export default function TravelPackages() {
  const { token } = useOutletContext();
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showForm, setShowForm] = useState(!!location.state?.create);

  useEffect(() => {
    if (!token) return;
    axios.get("https://the-deft-crew-production.up.railway.app/api/traveler/packages", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setPackages(Array.isArray(res.data) ? res.data : []))
      .catch((err) => { console.error("Error fetching packages", err); setPackages([]); })
      .finally(() => setLoading(false));
  }, [token]);

  const categories = useMemo(() => [...new Set(packages.map((p) => p.category).filter(Boolean))].sort(), [packages]);
  const shown = useMemo(() => {
    const t = search.toLowerCase().trim();
    const list = packages.filter((p) =>
      (cat === "all" || p.category === cat) &&
      (!t || p.name?.toLowerCase().includes(t) || p.category?.toLowerCase().includes(t) || p.location?.toLowerCase().includes(t))
    );
    const by = { newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0), low: (a, b) => (a.price || 0) - (b.price || 0), high: (a, b) => (b.price || 0) - (a.price || 0) };
    return [...list].sort(by[sort]);
  }, [packages, search, cat, sort]);

  if (loading) return <div className="tdcp k-page"><PageLoading label="Loading packages..." /></div>;

  return (
    <div className="tdcp k-page" data-screen="travel-packages">
      <div className="k-head">
        <div className="tr-title">
          <Ico kind="plane" tone="sky" size={56} />
          <div>
            <h1>packages<span className="dot" aria-hidden="true">.</span></h1>
            <p>student trips live in the app across {categories.length} {categories.length === 1 ? "category" : "categories"}. {packages.length} live.</p>
          </div>
        </div>
        <div className="k-actions">
          <Button icon="plus" onClick={() => setShowForm(true)}>new package</Button>
        </div>
      </div>

      <div className="k-toolbar">
        <SearchInput className="k-grow" aria-label="search packages" placeholder="search by name or category" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="sort" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">newest</option>
          <option value="low">price: low to high</option>
          <option value="high">price: high to low</option>
        </Select>
      </div>
      {categories.length > 0 && (
        <Segmented label="category" value={cat} onChange={setCat} options={[{ value: "all", label: "all" }, ...categories.map((c) => ({ value: c, label: c.toLowerCase() }))]} />
      )}

      {shown.length > 0 ? (
        <div className="k-grid">
          {shown.map((p, i) => <PackageCard key={p._id || i} pkg={p} index={i} />)}
        </div>
      ) : (
        <div className="k-card">
          <EmptyState
            icon="plane"
            tone="sky"
            title={packages.length ? "no packages match" : "no packages live yet"}
            text={packages.length ? "try another category or search." : "packages show here once they're live in the app."}
          />
        </div>
      )}

      <PackageForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
