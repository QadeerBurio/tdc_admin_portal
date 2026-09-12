// Branches.js - Complete Branch Management Screen
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import {
  FaStore,
  FaGlobe,
  FaPlus,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaPhone,
  FaPercent,
  FaTimes,
  FaCheck,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCity,
  FaAlignLeft,
  FaToggleOn,
  FaToggleOff,
  FaEllipsisV,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// const API_BASE = "http://localhost:5000/api/branches";
const API_BASE = "https://the-deft-crew-production.up.railway.app/api/branches";

const DISCOUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

export default function Branches() {
  const { token } = useContext(AuthContext);

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | online | store
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

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
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
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
    <div style={styles.container}>
      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            style={{
              ...styles.toast,
              background:
                toast.type === "error"
                  ? "linear-gradient(135deg, #fee2e2, #fecaca)"
                  : "linear-gradient(135deg, #d1fae5, #a7f3d0)",
              borderColor: toast.type === "error" ? "#ef4444" : "#10b981",
            }}
          >
            {toast.type === "error" ? (
              <FaExclamationTriangle size={16} color="#dc2626" />
            ) : (
              <FaCheckCircle size={16} color="#059669" />
            )}
            <span
              style={{
                color: toast.type === "error" ? "#991b1b" : "#065f46",
              }}
            >
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Branches</h1>
          <p style={styles.pageSubtitle}>
            Manage all your store and online branches in one place
          </p>
        </div>
        <button style={styles.addBtn} onClick={openCreateModal}>
          <FaPlus size={14} />
          Add Branch
        </button>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <FaStore size={18} color="#f59e0b" />
          <div>
            <div style={styles.statValue}>{totalCount}</div>
            <div style={styles.statLabel}>Total</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <FaCheckCircle size={18} color="#10b981" />
          <div>
            <div style={styles.statValue}>{activeCount}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <FaGlobe size={18} color="#3b82f6" />
          <div>
            <div style={styles.statValue}>{onlineCount}</div>
            <div style={styles.statLabel}>Online</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <FaMapMarkerAlt size={18} color="#ec4899" />
          <div>
            <div style={styles.statValue}>{storeCount}</div>
            <div style={styles.statLabel}>In-Store</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersBar}>
        <div style={styles.searchWrapper}>
          <FaSearch size={14} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={styles.clearSearch}
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Type:</span>
          {[
            { key: "all", label: "All" },
            { key: "online", label: "Online" },
            { key: "store", label: "In-Store" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              style={{
                ...styles.filterBtn,
                ...(filterType === f.key ? styles.filterBtnActive : {}),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Branches Grid */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <FaSpinner size={32} style={{ animation: "spin 0.8s linear infinite" }} color="#f59e0b" />
          <p style={styles.loadingText}>Loading branches...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <FaStore size={56} color="#cbd5e1" />
          <h3 style={styles.emptyTitle}>
            {branches.length === 0 ? "No branches yet" : "No matching branches"}
          </h3>
          <p style={styles.emptyText}>
            {branches.length === 0
              ? "Create your first branch to start accepting redemptions"
              : "Try adjusting your search or filter"}
          </p>
          {branches.length === 0 && (
            <button style={styles.addBtn} onClick={openCreateModal}>
              <FaPlus size={14} /> Create Branch
            </button>
          )}
        </div>
      ) : (
        <div style={styles.branchGrid}>
          <AnimatePresence>
            {filtered.map((b, index) => (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
                style={{
                  ...styles.branchCard,
                  opacity: b.isActive ? 1 : 0.55,
                }}
              >
                {/* Header */}
                <div style={styles.branchCardHeader}>
                  <div style={styles.branchIconWrap}>
                    <FaStore size={18} color="#f59e0b" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.branchName}>{b.name}</div>
                    <div style={styles.branchMeta}>
                      {b.city && (
                        <>
                          <FaCity size={10} /> {b.city} •{" "}
                        </>
                      )}
                      <span
                        style={{
                          color: b.isActive ? "#10b981" : "#ef4444",
                          fontWeight: 600,
                        }}
                      >
                        {b.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <button
                    style={styles.iconBtn}
                    onClick={() => handleToggleActive(b)}
                    title={b.isActive ? "Deactivate" : "Activate"}
                  >
                    {b.isActive ? (
                      <FaToggleOn size={20} color="#10b981" />
                    ) : (
                      <FaToggleOff size={20} color="#94a3b8" />
                    )}
                  </button>
                </div>

                {/* Discount */}
                <div style={styles.discountStrip}>
                  <FaPercent size={14} />
                  <span style={styles.discountValue}>
                    {b.discountPercentage}% OFF
                  </span>
                </div>

                {/* Description */}
                {b.description && (
                  <p style={styles.branchDesc}>{b.description}</p>
                )}

                {/* Info */}
                <div style={styles.infoGrid}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Availability:</span>
                    <div style={styles.availTags}>
                      {b.isOnline && (
                        <span style={styles.tagOnline}>
                          <FaGlobe size={9} /> Online
                        </span>
                      )}
                      {b.isInStore && (
                        <span style={styles.tagStore}>
                          <FaStore size={9} /> In-Store
                        </span>
                      )}
                    </div>
                  </div>

                  {b.isInStore && b.location && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>
                        <FaMapMarkerAlt size={11} /> Location:
                      </span>
                      <span style={styles.infoValue}>{b.location}</span>
                    </div>
                  )}

                  {b.phone && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>
                        <FaPhone size={11} /> Phone:
                      </span>
                      <span style={styles.infoValue}>{b.phone}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={styles.cardActions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => openEditModal(b)}
                  >
                    <FaEdit size={12} /> Edit
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => setDeleteConfirm(b)}
                  >
                    <FaTrash size={12} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={styles.modalIcon}>
                    {editingBranch ? <FaEdit size={16} /> : <FaPlus size={16} />}
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>
                      {editingBranch ? "Edit Branch" : "Create New Branch"}
                    </h2>
                    <p style={styles.modalSubtitle}>
                      {editingBranch
                        ? "Update branch details"
                        : "Add a new branch to your brand"}
                    </p>
                  </div>
                </div>
                <button style={styles.modalCloseBtn} onClick={closeModal}>
                  <FaTimes size={14} />
                </button>
              </div>

              <div style={styles.modalBody}>
                {/* Name */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Branch Name <span style={styles.req}>*</span>
                  </label>
                  <input
                    style={{
                      ...styles.input,
                      borderColor: errors.name ? "#ef4444" : "#e2e8f0",
                    }}
                    placeholder="e.g., Gulberg Branch, DHA Phase 5"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                  />
                  {errors.name && (
                    <p style={styles.errorText}>{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    <FaAlignLeft size={11} /> Description
                  </label>
                  <textarea
                    style={{ ...styles.textarea }}
                    placeholder="Brief description about this branch..."
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                {/* Discount */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Discount Percentage <span style={styles.req}>*</span>
                  </label>
                  <select
                    style={{
                      ...styles.select,
                      borderColor: errors.discountPercentage
                        ? "#ef4444"
                        : "#e2e8f0",
                    }}
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
                    {DISCOUNT_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}%
                      </option>
                    ))}
                  </select>
                  {errors.discountPercentage && (
                    <p style={styles.errorText}>
                      {errors.discountPercentage}
                    </p>
                  )}
                </div>

                {/* Availability */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    Availability <span style={styles.req}>*</span>
                  </label>
                  <div style={styles.availabilityRow}>
                    <label
                      style={{
                        ...styles.availToggle,
                        background: form.isOnline ? "#dbeafe" : "#f8fafc",
                        borderColor: form.isOnline ? "#3b82f6" : "#e2e8f0",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.isOnline}
                        onChange={(e) => {
                          setForm({ ...form, isOnline: e.target.checked });
                          if (errors.availability)
                            setErrors({ ...errors, availability: undefined });
                        }}
                      />
                      <FaGlobe
                        size={14}
                        color={form.isOnline ? "#3b82f6" : "#94a3b8"}
                      />
                      <span
                        style={{
                          color: form.isOnline ? "#1e40af" : "#475569",
                        }}
                      >
                        Online
                      </span>
                    </label>

                    <label
                      style={{
                        ...styles.availToggle,
                        background: form.isInStore ? "#fce7f3" : "#f8fafc",
                        borderColor: form.isInStore ? "#ec4899" : "#e2e8f0",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.isInStore}
                        onChange={(e) => {
                          setForm({ ...form, isInStore: e.target.checked });
                          if (errors.availability)
                            setErrors({ ...errors, availability: undefined });
                        }}
                      />
                      <FaStore
                        size={14}
                        color={form.isInStore ? "#ec4899" : "#94a3b8"}
                      />
                      <span
                        style={{
                          color: form.isInStore ? "#831843" : "#475569",
                        }}
                      >
                        In-Store
                      </span>
                    </label>
                  </div>
                  {errors.availability && (
                    <p style={styles.errorText}>{errors.availability}</p>
                  )}
                </div>

                {/* Location (only if in-store) */}
                {form.isInStore && (
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <FaMapMarkerAlt size={11} /> Location{" "}
                      <span style={styles.req}>*</span>
                    </label>
                    <input
                      style={{
                        ...styles.input,
                        borderColor: errors.location
                          ? "#ef4444"
                          : "#e2e8f0",
                      }}
                      placeholder="Street address or area"
                      value={form.location}
                      onChange={(e) => {
                        setForm({ ...form, location: e.target.value });
                        if (errors.location)
                          setErrors({ ...errors, location: undefined });
                      }}
                    />
                    {errors.location && (
                      <p style={styles.errorText}>{errors.location}</p>
                    )}
                  </div>
                )}

                {/* City + Phone (Row) */}
                <div style={styles.row}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <FaCity size={11} /> City
                    </label>
                    <input
                      style={styles.input}
                      placeholder="e.g., Lahore, Karachi"
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <FaPhone size={11} /> Phone
                    </label>
                    <input
                      style={styles.input}
                      placeholder="+92 300 1234567"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Active toggle */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Status</label>
                  <label
                    style={{
                      ...styles.availToggle,
                      background: form.isActive ? "#d1fae5" : "#fee2e2",
                      borderColor: form.isActive ? "#10b981" : "#ef4444",
                      width: "fit-content",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                    />
                    <span
                      style={{
                        color: form.isActive ? "#065f46" : "#991b1b",
                        fontWeight: 600,
                      }}
                    >
                      {form.isActive ? "Active" : "Inactive"}
                    </span>
                  </label>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button style={styles.cancelBtn} onClick={closeModal}>
                  Cancel
                </button>
                <button
                  style={{
                    ...styles.submitBtn,
                    opacity: submitting ? 0.7 : 1,
                  }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FaSpinner
                        size={12}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck size={12} />
                      {editingBranch ? "Update Branch" : "Create Branch"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={styles.confirmModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.confirmIconWrap}>
                <FaExclamationTriangle size={26} color="#ef4444" />
              </div>
              <h3 style={styles.confirmTitle}>Delete Branch?</h3>
              <p style={styles.confirmText}>
                Are you sure you want to delete{" "}
                <strong>{deleteConfirm.name}</strong>? This action cannot be
                undone.
              </p>
              <div style={styles.confirmActions}>
                <button
                  style={styles.cancelBtn}
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  style={styles.deleteConfirmBtn}
                  onClick={() => handleDelete(deleteConfirm._id)}
                >
                  <FaTrash size={12} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ==================================================
// STYLES
// ==================================================
const styles = {
  container: {
    padding: "4px 0",
    width: "100%",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 18px",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    border: "1px solid",
    fontWeight: 600,
    fontSize: 13,
    maxWidth: 380,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "linear-gradient(135deg, #f9c349 0%, #f59e0b 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(249, 195, 73, 0.35)",
    transition: "all 0.2s ease",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  },
  statValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 3,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  filtersBar: {
    display: "flex",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchWrapper: {
    position: "relative",
    flex: 1,
    minWidth: 200,
    maxWidth: 400,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  searchInput: {
    width: "100%",
    padding: "10px 36px 10px 34px",
    borderRadius: 12,
    border: "1.5px solid #e2e8f0",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    background: "#fff",
    boxSizing: "border-box",
  },
  clearSearch: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748b",
  },
  filterGroup: {
    display: "flex",
    gap: 4,
    background: "#f1f5f9",
    padding: 4,
    borderRadius: 24,
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#64748b",
    padding: "0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  filterBtn: {
    padding: "5px 12px",
    borderRadius: 20,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    transition: "all 0.2s",
  },
  filterBtnActive: {
    background: "#fff",
    color: "#f59e0b",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  branchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  branchCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    transition: "all 0.25s ease",
    cursor: "default",
  },
  branchCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  branchIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  branchName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.2,
    wordBreak: "break-word",
  },
  branchMeta: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 3,
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    padding: 4,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  discountStrip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: 10,
    alignSelf: "flex-start",
    fontWeight: 700,
  },
  discountValue: {
    fontSize: 14,
    letterSpacing: "-0.3px",
  },
  branchDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.5,
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 10,
    borderTop: "1px dashed #e2e8f0",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    flexWrap: "wrap",
  },
  infoLabel: {
    color: "#64748b",
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  infoValue: {
    color: "#0f172a",
    fontWeight: 600,
  },
  availTags: {
    display: "inline-flex",
    gap: 4,
    flexWrap: "wrap",
  },
  tagOnline: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 10,
    background: "#dbeafe",
    color: "#1e40af",
    padding: "2px 8px",
    borderRadius: 10,
    fontWeight: 700,
  },
  tagStore: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 10,
    background: "#fce7f3",
    color: "#831843",
    padding: "2px 8px",
    borderRadius: 10,
    fontWeight: 700,
  },
  cardActions: {
    display: "flex",
    gap: 8,
    marginTop: 4,
  },
  editBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  deleteBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  loadingContainer: {
    textAlign: "center",
    padding: 60,
    color: "#64748b",
  },
  loadingText: {
    fontSize: 13,
    fontWeight: 500,
    marginTop: 12,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#94a3b8",
    background: "#fff",
    borderRadius: 16,
    border: "1px dashed #e2e8f0",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
    margin: "16px 0 6px",
  },
  emptyText: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 20,
  },
  // ============ MODAL ============
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  modalContent: {
    background: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 560,
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 30px 60px -12px rgba(0,0,0,0.35)",
  },
  modalHeader: {
    padding: "18px 22px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #fff 100%)",
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "#fef3c7",
    color: "#f59e0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: "20px 22px",
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#334155",
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  req: {
    color: "#ef4444",
  },
  input: {
    padding: "10px 12px",
    fontSize: 13,
    color: "#0f172a",
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    transition: "all 0.2s",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "10px 12px",
    fontSize: 13,
    color: "#0f172a",
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    transition: "all 0.2s",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
    width: "100%",
    boxSizing: "border-box",
    minHeight: 70,
    lineHeight: 1.5,
  },
  select: {
    padding: "10px 12px",
    fontSize: 13,
    color: "#0f172a",
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    transition: "all 0.2s",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  errorText: {
    fontSize: 11,
    color: "#ef4444",
    margin: 0,
    fontWeight: 600,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  availabilityRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  availToggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 10,
    border: "1.5px solid",
    cursor: "pointer",
    transition: "all 0.2s",
    fontWeight: 600,
    fontSize: 13,
  },
  modalFooter: {
    padding: "14px 22px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    background: "#fafbfc",
  },
  cancelBtn: {
    padding: "9px 22px",
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    color: "#475569",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  submitBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "9px 24px",
    background: "linear-gradient(135deg, #f9c349 0%, #f59e0b 100%)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  confirmModal: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    maxWidth: 380,
    width: "90%",
    textAlign: "center",
    boxShadow: "0 30px 60px -12px rgba(0,0,0,0.35)",
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 8px",
  },
  confirmText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.5,
    margin: "0 0 20px",
  },
  confirmActions: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
  },
  deleteConfirmBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 22px",
    background: "#ef4444",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};