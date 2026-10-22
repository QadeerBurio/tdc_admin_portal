// src/screens/AdminOffers.js
// Manage offers (design/portal/AdOffers): every slider and offer banner in the app.
import React, { useState, useEffect } from "react";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Spinner, Field, Select, SearchInput, Segmented, StatCard, EmptyState, Pill, toast, confirmDialog } from "../portal/kit";
import "./styles/AdminOffers.css";

export default function AdminOffers() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("slider");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://the-deft-crew-production.up.railway.app/api/admin/all?type=${filter}`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      await fetch(`https://the-deft-crew-production.up.railway.app/api/admin/toggle/${id}`, { method: "PATCH" });
      await fetchItems();
    } catch (error) {
      toast("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirmDialog("⚠️ Permanent delete? This action cannot be undone."))) return;
    setDeletingId(id);
    try {
      await fetch(`https://the-deft-crew-production.up.railway.app/api/admin/delete/${id}`, { 
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      await fetchItems();
    } catch (error) {
      console.error("Delete error:", error);
      toast("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items
    .filter(item =>
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item._id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "title") return a.title?.localeCompare(b.title);
      if (sortBy === "status") return a.active === b.active ? 0 : a.active ? -1 : 1;
      return 0;
    });

  const activeCount = items.filter(item => item.active).length;
  const draftCount = items.filter(item => !item.active).length;

  const toggleBtn = (item) => (
    <button
      type="button"
      className="k-icon-btn sm"
      onClick={() => handleToggle(item._id)}
      disabled={togglingId === item._id}
      title={item.active ? "Hide (back to draft)" : "Make live"}
      aria-label={item.active ? "Hide (back to draft)" : "Make live"}
    >
      {togglingId === item._id ? <Spinner size="sm" /> : <Ico kind={item.active ? "lock" : "eye"} tone="plain" size={15} />}
    </button>
  );
  const deleteBtn = (item) => (
    <button
      type="button"
      className="k-icon-btn sm danger"
      onClick={() => handleDelete(item._id)}
      disabled={deletingId === item._id}
      title="Delete"
      aria-label="Delete"
    >
      {deletingId === item._id ? <Spinner size="sm" /> : <Ico kind="trash" tone="plain" size={15} />}
    </button>
  );
  const statusPill = (item) => <Pill tone={item.active ? "green" : "sand"} dot>{item.active ? "Live" : "Draft"}</Pill>;
  const typePill = (item) => <Pill tone="sand">{item.type === "slider" ? "Slider" : "Offer"}</Pill>;

  return (
    <div className="tdcp k-page ao" data-screen="offers">
      <PageHeader
        title="manage offers"
        sub={`every slider and offer in the app. ${items.length} total.`}
        actions={
          <Segmented
            label="asset type"
            value={filter}
            onChange={setFilter}
            options={[{ value: "slider", label: "Sliders" }, { value: "offer", label: "Banners" }]}
          />
        }
      />

      <div className="k-stats">
        <StatCard label="Live" value={activeCount} icon="checkCircle" tone="green" />
        <StatCard label="Draft" value={draftCount} icon="clock" tone="sand" />
        <StatCard label="Total" value={items.length} icon="chart" tone="blue" />
      </div>

      <div className="k-toolbar">
        <SearchInput
          className="k-grow"
          placeholder={isMobile ? "Search..." : `Search ${filter}s by title or ID...`}
          aria-label="search offers"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="secondary" icon="filter" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>Filters</Button>
        <div className="k-seg" role="group" aria-label="view">
          <button type="button" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} aria-label="grid view" title="grid view"><Ico kind="image" tone="plain" size={16} /></button>
          <button type="button" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")} aria-label="list view" title="list view"><Ico kind="menu" tone="plain" size={16} /></button>
        </div>
        <Select aria-label="sort" style={{ width: "auto" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title</option>
          <option value="status">Status</option>
        </Select>
      </div>

      {showFilters && (
        <div className="k-card pad ao-filters">
          <Field label="Status">
            <Select>
              <option value="all">All</option>
              <option value="active">Live</option>
              <option value="draft">Draft</option>
            </Select>
          </Field>
          <Field label="Date Range">
            <Select>
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </Select>
          </Field>
          <Button style={{ alignSelf: "flex-end" }}>Apply Filters</Button>
        </div>
      )}

      {loading ? (
        <PageLoading label="Loading assets..." />
      ) : filteredItems.length === 0 ? (
        <div className="k-card">
          <EmptyState
            icon="tag"
            tone="sand"
            title={`No ${filter} assets found`}
            text={searchTerm ? "Try a different search term" : "Create your first asset using the admin panel"}
            action={<Button icon="plus">Create New</Button>}
          />
        </div>
      ) : viewMode === "grid" ? (
        <div className="k-grid">
          {filteredItems.map((item) => (
            <article key={item._id} className="k-card ao-card">
              <div className="ao-img">
                <img
                  src={item.image}
                  alt={item.title || "Preview"}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                  }}
                />
                <span className="ao-badge">{item.active ? <Pill tone="green" dot>LIVE</Pill> : <Pill tone="ink">DRAFT</Pill>}</span>
              </div>
              <div className="ao-body">
                <div className="k-row" style={{ gap: 6 }}>{statusPill(item)}{typePill(item)}</div>
                <h3 className="ao-title">{item.title || "Untitled Campaign"}</h3>
                {item.type === "offer" && item.description && (
                  <p className="ao-desc">
                    {item.description.length > (isMobile ? 40 : 60)
                      ? item.description.substring(0, isMobile ? 40 : 60) + "..."
                      : item.description}
                  </p>
                )}
              </div>
              <div className="ao-foot">
                <span className="k-hint k-row" style={{ gap: 6 }}><Ico kind="calendar" tone="plain" size={13} />{new Date(item.createdAt).toLocaleDateString()}</span>
                <span className="k-row" style={{ gap: 6 }}>{toggleBtn(item)}{deleteBtn(item)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="ao-list">
          {filteredItems.map((item) => (
            <article key={item._id} className="k-card ao-row">
              <img
                className="ao-thumb"
                src={item.image}
                alt={item.title || "Preview"}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                }}
              />
              <div className="ao-row-main">
                <div className="k-row" style={{ gap: 6 }}>
                  {statusPill(item)}
                  {typePill(item)}
                  <span className="k-hint">ID: {item._id.slice(-8).toUpperCase()}</span>
                </div>
                <h3 className="ao-title">{item.title || "Untitled Campaign"}</h3>
                {item.type === "offer" && item.description && <p className="ao-desc">{item.description}</p>}
                <span className="k-hint k-row" style={{ gap: 6 }}><Ico kind="calendar" tone="plain" size={13} />{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <span className="k-row" style={{ gap: 6 }}>{toggleBtn(item)}{deleteBtn(item)}</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
