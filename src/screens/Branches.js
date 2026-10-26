// Branches.js - Complete Branch Management Screen
// Branches (design/portal/BrBranches): every location where students can redeem.
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Ico from "../portal/Ico";
import { PageLoading, Button, IconButton, Field, Input, Textarea, Select, Checkbox, SearchInput, Segmented, Modal, EmptyState, Pill, toast } from "../portal/kit";
import "./styles/BrandPortal.css";

const API_BASE = "https://the-deft-crew-production.up.railway.app/api/branches";

const DISCOUNT_OPTIONS = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

// new choices are 15-60%; a saved branch with another value keeps it as an option so it displays and saves unchanged
const discountChoices = (current) => {
  const v = Number(current);
  return current !== "" && current != null && !DISCOUNT_OPTIONS.includes(v) ? [v, ...DISCOUNT_OPTIONS] : DISCOUNT_OPTIONS;
};

export default function Branches() {
  const { token } = useContext(AuthContext);

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | online | store

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    discountPercentage: "",
    isOnline: false,
    isInStore: false,
    location: "",
    city: "",
    phone: "",
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  // ============ FETCH BRANCHES ============
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/my-branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setBranches(res.data.branches || []);
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
      setBranches([]);
      showToast(err.response?.data?.message || "Failed to load branches", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBranches();
  }, [token]);

  // ============ TOAST ============
  const showToast = (message, type = "success") => {
    toast(message, type === "error" ? "bad" : "ok");
  };

  // ============ OPEN MODAL ============
  const openCreateModal = () => {
    setEditingBranch(null);
    setForm({
      name: "",
      description: "",
      discountPercentage: "",
      isOnline: false,
      isInStore: false,
      location: "",
      city: "",
      phone: "",
      isActive: true,
    });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name || "",
      description: branch.description || "",
      discountPercentage: branch.discountPercentage || "",
      isOnline: branch.isOnline || false,
      isInStore: branch.isInStore || false,
      location: branch.location || "",
      city: branch.city || "",
      phone: branch.phone || "",
      isActive: branch.isActive !== false,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setEditingBranch(null);
    setErrors({});
  };

  // ============ VALIDATION ============
  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Branch name is required";
    if (!form.discountPercentage)
      newErrors.discountPercentage = "Discount percentage is required";
    if (!form.isOnline && !form.isInStore)
      newErrors.availability = "Select at least one availability type";
    if (form.isInStore && !form.location.trim())
      newErrors.location = "Location is required for in-store branches";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============ SUBMIT ============
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        discountPercentage: Number(form.discountPercentage),
        isOnline: form.isOnline,
        isInStore: form.isInStore,
        location: form.isInStore ? form.location.trim() : "",
        city: form.isInStore ? form.city.trim() : "",
        phone: form.phone.trim(),
        isActive: form.isActive,
      };

      if (editingBranch) {
        await axios.put(`${API_BASE}/${editingBranch._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Branch updated successfully", "success");
      } else {
        await axios.post(API_BASE, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Branch created successfully", "success");
      }

      closeModal();
      await fetchBranches();
    } catch (err) {
      console.error("Error saving branch:", err);
      showToast(
        err.response?.data?.message || "Failed to save branch",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============ DELETE ============
  const handleDelete = async (branchId) => {
    try {
      await axios.delete(`${API_BASE}/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Branch deleted successfully", "success");
      setDeleteConfirm(null);
      await fetchBranches();
    } catch (err) {
      console.error("Error deleting branch:", err);
      showToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  // ============ TOGGLE ACTIVE ============
  const handleToggleActive = async (branch) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/${branch._id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setBranches((prev) =>
          prev.map((b) => (b._id === branch._id ? res.data.branch : b))
        );
        showToast(res.data.message, "success");
      }
    } catch (err) {
      console.error("Error toggling branch:", err);
      showToast("Failed to toggle status", "error");
    }
  };

  // ============ FILTERED ============
  const filtered = branches.filter((b) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      b.name?.toLowerCase().includes(term) ||
      b.description?.toLowerCase().includes(term) ||
      b.location?.toLowerCase().includes(term) ||
      b.city?.toLowerCase().includes(term);

    const matchesType =
      filterType === "all" ||
      (filterType === "online" && b.isOnline) ||
      (filterType === "store" && b.isInStore);

    return matchesSearch && matchesType;
  });

  const totalCount = branches.length;
  const activeCount = branches.filter((b) => b.isActive).length;
  const onlineCount = branches.filter((b) => b.isOnline).length;
  const storeCount = branches.filter((b) => b.isInStore).length;

  // ============ RENDER ============
  return (
    <div className="tdcp k-page" data-screen="brand-branches">
      <div className="k-head">
        <div className="br-title">
          <Ico kind="pin" tone="sky" size={56} />
          <div>
            <h1>branches<span className="dot" aria-hidden="true">.</span></h1>
            <p>every location where students can redeem. {totalCount} total, {activeCount} active.</p>
          </div>
        </div>
        <div className="k-actions">
          <Button icon="plus" onClick={openCreateModal}>add branch</Button>
        </div>
      </div>

      <div className="k-toolbar">
        <Segmented
          label="filter by type"
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: "all", label: "all", count: totalCount },
            { value: "online", label: "online", count: onlineCount },
            { value: "store", label: "in-store", count: storeCount },
          ]}
        />
        <SearchInput className="k-grow" placeholder="Search branches..." aria-label="search branches" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <PageLoading label="Loading branches..." minHeight={300} />
      ) : filtered.length === 0 ? (
        <div className="k-card">
          <EmptyState
            icon="pin"
            tone="sky"
            title={branches.length === 0 ? "No branches yet" : "No matching branches"}
            text={branches.length === 0 ? "Create your first branch to start accepting redemptions" : "Try adjusting your search or filter"}
            action={branches.length === 0 ? <Button icon="plus" onClick={openCreateModal}>Create Branch</Button> : null}
          />
        </div>
      ) : (
        <div className="k-grid">
          {filtered.map((b) => (
            <article key={b._id} className={"k-card bb-card" + (b.isActive ? "" : " off")}>
              <div className="bb-top">
                <Ico kind="pin" tone="sky" size={44} />
                <div className="bb-name">
                  <h2>{b.name}</h2>
                  {b.city && <p className="k-hint">{b.city}</p>}
                </div>
                <Pill tone={b.isActive ? "green" : "sand"} dot>{b.isActive ? "active" : "inactive"}</Pill>
              </div>
              <div className="bb-chips">
                {b.isInStore && <span className="bb-chip">in-store</span>}
                {b.isOnline && <span className="bb-chip">online</span>}
                <Pill tone="yellow">{b.discountPercentage}% off</Pill>
              </div>
              {b.isInStore && b.location && <p className="bb-line"><Ico kind="pin" tone="plain" size={15} />{b.location}</p>}
              {b.phone && <p className="bb-line"><Ico kind="phone" tone="plain" size={15} />{b.phone}</p>}
              {b.description && <p className="bo-desc">{b.description}</p>}
              <div className="bb-actions">
                <Button variant="secondary" size="sm" icon="edit" onClick={() => openEditModal(b)}>edit</Button>
                <Button variant="secondary" size="sm" icon={b.isActive ? "pause" : "play"} onClick={() => handleToggleActive(b)}>{b.isActive ? "deactivate" : "activate"}</Button>
                <IconButton icon="trash" label="delete" variant="danger" onClick={() => setDeleteConfirm(b)} />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* create / edit branch */}
      <Modal
        open={showModal}
        onClose={closeModal}
        icon={editingBranch ? "edit" : "plus"}
        tone="sky"
        title={editingBranch ? "Edit Branch" : "Create New Branch"}
        sub={editingBranch ? "Update branch details" : "Add a new branch to your brand"}
        footer={<>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button icon="check" onClick={handleSubmit} loading={submitting} disabled={submitting}>
            {submitting ? "Saving..." : editingBranch ? "Update Branch" : "Create Branch"}
          </Button>
        </>}
      >
        <div className="bo-form">
          <Field label="Branch Name *" htmlFor="bb-name" error={errors.name}>
            <Input
              id="bb-name"
              invalid={!!errors.name}
              placeholder="e.g., Gulberg Branch, DHA Phase 5"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
            />
          </Field>
          <Field label="Description" htmlFor="bb-desc">
            <Textarea
              id="bb-desc"
              placeholder="Brief description about this branch..."
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <Field label="Discount Percentage *" htmlFor="bb-pct" error={errors.discountPercentage}>
            <Select
              id="bb-pct"
              invalid={!!errors.discountPercentage}
              value={form.discountPercentage}
              onChange={(e) => {
                setForm({
                  ...form,
                  discountPercentage: e.target.value,
                });
                if (errors.discountPercentage)
                  setErrors({
                    ...errors,
                    discountPercentage: undefined,
                  });
              }}
            >
              <option value="">Select discount %</option>
              {discountChoices(form.discountPercentage).map((v) => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Availability *" error={errors.availability}>
            <div className="k-row">
              <label className={"br-where" + (form.isOnline ? " on" : "")}>
                <input
                  type="checkbox"
                  checked={form.isOnline}
                  onChange={(e) => {
                    setForm({ ...form, isOnline: e.target.checked });
                    if (errors.availability)
                      setErrors({ ...errors, availability: undefined });
                  }}
                />
                Online
              </label>
              <label className={"br-where" + (form.isInStore ? " on" : "")}>
                <input
                  type="checkbox"
                  checked={form.isInStore}
                  onChange={(e) => {
                    setForm({ ...form, isInStore: e.target.checked });
                    if (errors.availability)
                      setErrors({ ...errors, availability: undefined });
                  }}
                />
                In-Store
              </label>
            </div>
          </Field>
          {form.isInStore && (
            <Field label="Location *" htmlFor="bb-loc" error={errors.location}>
              <Input
                id="bb-loc"
                invalid={!!errors.location}
                placeholder="Street address or area"
                value={form.location}
                onChange={(e) => {
                  setForm({ ...form, location: e.target.value });
                  if (errors.location)
                    setErrors({ ...errors, location: undefined });
                }}
              />
            </Field>
          )}
          <div className="bo-two">
            <Field label="City" htmlFor="bb-city">
              <Input
                id="bb-city"
                placeholder="e.g., Lahore, Karachi"
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
              />
            </Field>
            <Field label="Phone" htmlFor="bb-phone">
              <Input
                id="bb-phone"
                placeholder="+92 300 1234567"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Status">
            <Checkbox
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
              label={form.isActive ? "Active" : "Inactive"}
            />
          </Field>
        </div>
      </Modal>

      {/* delete confirm */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        icon="trash"
        tone="red"
        title="Delete Branch?"
        footer={<>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" icon="trash" onClick={() => handleDelete(deleteConfirm._id)}>Delete</Button>
        </>}
      >
        {deleteConfirm && (
          <p className="bb-confirm">
            Are you sure you want to delete{" "}
            <strong>{deleteConfirm.name}</strong>? This action cannot be
            undone.
          </p>
        )}
      </Modal>
    </div>
  );
}
