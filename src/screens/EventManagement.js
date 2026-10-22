// EventManagement.js: events admin (design/portal/AdEvents). Same calls and handlers as before; kit UI.
import React, { useState, useEffect, useContext, useRef } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { withTdcTheme } from "../portal/muiTheme";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import ".//styles/EventManagement.css";
import EventFormV2 from "./events/EventFormV2";
import RegistrationsTab, { StatusChip } from "./events/RegistrationsTab";
import { API_BASE, eventsApi, authProblem, errorMessage, uploadImage, MAX_IMAGE_BYTES, IMAGE_TYPES } from "./events/eventsApi";
import { emptyForm, formFromEvent, validateForm, buildPayload, isLegacyEvent, eventNeedsAppUpdate, UPDATE_WARNING } from "./events/formLogic";
import Ico from "../portal/Ico";
import { PageLoading, PageHeader, Button, IconButton, StatCard, Tabs, Modal, EmptyState, FileUpload, Pill, Table, Facts, toast, confirmDialog } from "../portal/kit";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200";
const CATEGORY_TONE = { Hackathons: "blue", Workshops: "purple", Conferences: "red", Competitions: "orange", "Career Fairs": "green", Concerts: "pink" };

// ─── Main Component ──────────────────────────────────────────────────

const EventManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { token, logout } = useContext(AuthContext);

  const [events, setEvents] = useState([]);
  const [regTotal, setRegTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState("create");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // CSV/XLSX Upload State
  const [openCsvDialog, setOpenCsvDialog] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState("");
  const csvFileInputRef = useRef(null);

  // 401 / 403: say why, then go to the login screen (never a blank page)
  const handleAuthError = (err) => {
    const msg = authProblem(err);
    if (!msg) return false;
    setSnackbar({ open: true, message: msg, severity: "error" });
    setTimeout(() => {
      logout();
      setTimeout(() => {
        if (window.location.pathname !== "/login") window.location.replace("/login");
      }, 50);
    }, 1800);
    return true;
  };

  const handleOpenCsvDialog = () => {
    setCsvFile(null);
    setCsvResult(null);
    setCsvError("");
    setOpenCsvDialog(true);
  };

  const handleCloseCsvDialog = () => {
    if (!csvUploading) {
      setOpenCsvDialog(false);
      setCsvFile(null);
      setCsvResult(null);
      setCsvError("");
    }
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.csv' && ext !== '.xlsx' && ext !== '.xls') {
      setCsvError("Invalid file type. Only .csv and .xlsx files are allowed.");
      setCsvFile(null);
      return;
    }

    setCsvError("");
    setCsvResult(null);
    setCsvFile(file);
  };

  const handleUploadCsvSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setCsvError("Please select a .csv or .xlsx file.");
      return;
    }

    setCsvUploading(true);
    setCsvError("");
    setCsvResult(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", csvFile);

      const res = await axios.post(`${API_BASE}/admin/import-csv`, uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data && res.data.success) {
        const { added, skipped } = res.data;
        setCsvResult({ added, skipped });
        showSnackbar(`Upload successful: ${added} events added${skipped > 0 ? `, ${skipped} duplicates skipped` : ''}`, "success");
        fetchDashboardData();
      } else {
        setCsvError(res.data?.message || "Upload failed.");
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      const msg = err.response?.data?.message || err.message || "Error uploading events file.";
      setCsvError(msg);
      showSnackbar(msg, "error");
    } finally {
      setCsvUploading(false);
    }
  };

  // ── create / edit form (events v2: built from the server's category templates) ──
  const [templates, setTemplates] = useState(null);
  const [templatesState, setTemplatesState] = useState("idle"); // idle | loading | ready | error
  const [form, setForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [imageError, setImageError] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);

  const loadTemplates = async () => {
    setTemplatesState("loading");
    try {
      const t = await eventsApi.templates();
      if (!t || !Array.isArray(t.categories) || !t.generic) throw new Error("bad templates");
      setTemplates(t);
      setTemplatesState("ready");
      return t;
    } catch (err) {
      setTemplatesState("error");
      return null;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEvents(), fetchAllRegistrations()]);
    } catch (error) {
      showSnackbar("Error loading dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/my-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const eventsWithCounts = await Promise.all(
        (Array.isArray(res.data) ? res.data : []).map(async (event) => {
          const registrations = await fetchEventRegistrations(event._id);
          return { ...event, registrations: registrations || [] };
        })
      );
      setEvents(eventsWithCounts);
    } catch (error) {
      console.error("Error fetching events:", error);
      if (!handleAuthError(error)) showSnackbar(errorMessage(error, "Couldn't load your events"), "error");
      setEvents([]);
    }
  };

  const fetchAllRegistrations = async () => {
    try {
      const res = await eventsApi.registrations(token, { page: 1, limit: 1 });
      setRegTotal(res?.total || 0);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      handleAuthError(error);
      setRegTotal(0);
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      const res = await axios.get(`${API_BASE}/registrations/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      return [];
    }
  };

  const resetImage = (preview) => {
    setSelectedFile(null);
    setImagePreview(preview || null);
    setImageError("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateEvent = async () => {
    setDialogType("create");
    setEditingEvent(null);
    setForm(null);
    setFormErrors({});
    resetImage(null);
    setOpenDialog(true);
    const t = await loadTemplates();
    if (t) setForm(emptyForm(t));
  };

  const handleEditEvent = async (event) => {
    setDialogType("edit");
    setEditingEvent(event);
    setForm(null);
    setFormErrors({});
    resetImage(event.image || null);
    setOpenDialog(true);
    const t = await loadTemplates();
    if (!t) return;
    let info = null;
    if (!isLegacyEvent(event)) {
      try {
        info = await eventsApi.paymentInfo(token, event._id);
      } catch (err) {
        if (handleAuthError(err)) return;
        showSnackbar("Prices and payment accounts didn't load. Saving is blocked until they do.", "error");
      }
    }
    setForm(formFromEvent(t, event, info));
  };

  const handleViewEvent = async (event) => {
    setDialogType("view");
    const registrations = await fetchEventRegistrations(event._id);
    setSelectedEvent({ ...event, registrations });
    setOpenDialog(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!(await confirmDialog("Are you sure you want to delete this event?"))) return;
    try {
      await axios.delete(`${API_BASE}/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar("Event deleted successfully", "success");
      await fetchEvents();
      await fetchAllRegistrations();
    } catch (error) {
      if (handleAuthError(error)) return;
      showSnackbar(errorMessage(error, "Error deleting event"), "error");
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError("Pick a JPG, PNG, WebP or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`This image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`);
      event.target.value = "";
      return;
    }
    setImageError("");
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    resetImage(null);
    setForm((f) => (f ? { ...f, image: "" } : f));
  };

  const handleSubmit = async () => {
    if (!form || !templates) return;
    const errs = validateForm(templates, form);
    setFormErrors(errs);
    if (Object.keys(errs).length) {
      showSnackbar(errs._form || "Some fields need fixing. They're marked in red.", "error");
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    try {
      let imageUrl = form.image || DEFAULT_IMAGE;
      if (selectedFile) {
        setUploadProgress(30);
        try {
          imageUrl = await uploadImage(selectedFile);
        } catch (upErr) {
          setUploadProgress(0);
          setImageError(upErr.message);
          showSnackbar(upErr.message, "error");
          return;
        }
        setUploadProgress(100);
        setForm((f) => ({ ...f, image: imageUrl }));
        setSelectedFile(null);
      }

      const body = buildPayload(templates, form, imageUrl, { isCreate: dialogType === "create" });
      if (dialogType === "create") {
        await eventsApi.create(token, body);
        showSnackbar("Event created successfully", "success");
      } else {
        await eventsApi.update(token, form._id, body);
        showSnackbar("Event updated successfully", "success");
      }
      setOpenDialog(false);
      resetImage(null);
      await fetchEvents();
      await fetchAllRegistrations();
    } catch (error) {
      if (handleAuthError(error)) return;
      showSnackbar(errorMessage(error, "Error saving event"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getCategoryTone = (category) => CATEGORY_TONE[category] || "sand";

  // notices from showSnackbar / setSnackbar show as kit toasts (same text)
  useEffect(() => {
    if (!snackbar.open) return;
    toast(snackbar.message, snackbar.severity === "error" ? "bad" : snackbar.severity === "success" ? "ok" : undefined);
    setSnackbar((s) => ({ ...s, open: false }));
  }, [snackbar]);

  const totalRegistrations = regTotal;
  const totalEvents = events.length;
  const averageRegistrations = totalEvents > 0 ? (totalRegistrations / totalEvents).toFixed(1) : 0;
  const activeEvents = events.filter(e => e.date && new Date(e.date) > new Date()).length || 0;

  if (loading) {
    return <div className="tdcp k-page"><PageLoading label="loading events…" /></div>;
  }

  const dialogTitle = dialogType === "create" ? "create new event" : dialogType === "edit" ? "edit event" : "event details";

  return (
    <div className="tdcp k-page" data-screen="events">
      <PageHeader
        title="events"
        sub="campus events, competitions and partner tickets in the app."
        actions={<>
          <Button variant="secondary" icon="upload" onClick={handleOpenCsvDialog}>upload events CSV</Button>
          <Button icon="plus" onClick={handleCreateEvent}>create new event</Button>
        </>}
      />

      <div className="k-stats">
        <StatCard label="total events" value={totalEvents} icon="calendar" tone="purple" />
        <StatCard label="registrations" value={totalRegistrations} icon="users" tone="blue" />
        <StatCard label="average registrations" value={averageRegistrations} sub="per event" icon="chart" tone="green" />
        <StatCard label="upcoming events" value={activeEvents} sub="date still ahead" icon="clock" tone="orange" />
      </div>

      <Tabs
        label="events sections"
        value={tabValue}
        onChange={(v) => handleTabChange(null, v)}
        tabs={[{ id: 0, label: "events", count: events.length, icon: "calendar" }, { id: 1, label: "registrations", count: regTotal, icon: "users" }]}
      />

      {tabValue === 0 && (
        events.length === 0 ? (
          <div className="k-card"><EmptyState icon="calendar" tone="purple" title="no events created" text="create your first event to get started." action={<Button icon="plus" onClick={handleCreateEvent}>create event</Button>} /></div>
        ) : (
          <div className="k-grid">
            {events.map((event) => (
              <article className="k-card ev-card" key={event._id}>
                <div className="ev-card-img">
                  <img src={event.image || DEFAULT_IMAGE} alt="" onError={(e) => { e.target.src = DEFAULT_IMAGE; }} />
                  <span className="ev-card-type"><Pill tone={getCategoryTone(event.type)}>{event.type || "Event"}</Pill></span>
                  <span className="ev-card-reg"><Pill tone="ink">{event.registrations?.length || 0} registered{event.capacity ? ` · ${event.registeredCount || 0}/${event.capacity} seats` : ""}</Pill></span>
                </div>
                <div className="ev-card-body">
                  <h3>{event.title}</h3>
                  {eventNeedsAppUpdate(event) && <span title={UPDATE_WARNING}><Pill tone="yellow">app update needed</Pill></span>}
                  <div className="ev-card-meta">
                    <span><Ico kind="pin" tone="plain" size={15} />{event.city || "TBD"}</span>
                    <span><Ico kind="calendar" tone="plain" size={15} />{event.date || "TBA"}</span>
                    <span><Ico kind="user" tone="plain" size={15} />{event.organizer || "TBD"}</span>
                  </div>
                </div>
                <div className="ev-card-actions">
                  <IconButton icon="eye" label="view details" onClick={() => handleViewEvent(event)} />
                  <IconButton icon="edit" label="edit event" onClick={() => handleEditEvent(event)} />
                  <IconButton icon="trash" label="delete event" variant="danger" onClick={() => handleDeleteEvent(event._id)} />
                  <Button size="sm" variant="secondary" onClick={() => handleViewEvent(event)} style={{ marginLeft: "auto" }}>{isMobile ? "view" : "view registrations"}</Button>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {tabValue === 1 && (
        <RegistrationsTab
          token={token}
          events={events}
          onAuthError={handleAuthError}
          notify={showSnackbar}
          isMobile={isMobile}
          onChanged={() => {
            fetchEvents();
            fetchAllRegistrations();
          }}
        />
      )}

      {/* create / edit / view */}
      <Modal
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        size="lg"
        title={dialogTitle}
        icon={dialogType === "create" ? "plus" : dialogType === "edit" ? "edit" : "eye"}
        tone={dialogType === "view" ? "purple" : "yellow"}
        footer={dialogType !== "view" ? <>
          <Button variant="secondary" onClick={() => setOpenDialog(false)}>cancel</Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={submitting || templatesState !== "ready" || !form}>
            {dialogType === "create" ? "create event" : "update event"}
          </Button>
        </> : null}
      >
        {dialogType === "view" && selectedEvent ? (
          <EventDetailsView event={selectedEvent} getCategoryTone={getCategoryTone} />
        ) : (
          <EventDialogBody
            templates={templates}
            templatesState={templatesState}
            onRetry={() => (dialogType === "edit" && editingEvent ? handleEditEvent(editingEvent) : handleCreateEvent())}
            form={form}
            setForm={setForm}
            errors={formErrors}
            imagePreview={imagePreview}
            onPickImage={handleFileSelect}
            onRemoveImage={handleRemoveImage}
            imageError={imageError}
            uploadProgress={uploadProgress}
            fileInputRef={fileInputRef}
          />
        )}
      </Modal>

      {/* CSV / XLSX upload */}
      <Modal
        open={openCsvDialog}
        onClose={handleCloseCsvDialog}
        title="upload events CSV / XLSX"
        icon="upload"
        tone="green"
        footer={<>
          <Button variant="secondary" onClick={handleCloseCsvDialog} disabled={csvUploading}>cancel</Button>
          <Button type="submit" form="ev-csv-form" disabled={!csvFile || csvUploading} loading={csvUploading}>{csvUploading ? "uploading..." : "upload & import"}</Button>
        </>}
      >
        <form id="ev-csv-form" onSubmit={handleUploadCsvSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FileUpload
            accept=".csv, .xlsx, .xls"
            onChange={handleCsvFileChange}
            inputRef={csvFileInputRef}
            file={csvFile}
            label="click to select or drop a .csv / .xlsx file"
            hint="expected columns: name, date, venue, description, category, source_url"
            disabled={csvUploading}
          />
          {csvUploading && <PageLoading label="processing & importing events..." minHeight={110} />}
          {csvResult && (
            <div className="k-note ok">
              <b>Upload successful: {csvResult.added} events added</b>
              {csvResult.skipped > 0 && <div>{csvResult.skipped} duplicates skipped</div>}
            </div>
          )}
          {csvError && <div className="k-note bad">{csvError}</div>}
        </form>
      </Modal>
    </div>
  );
};

// ─── Event Details View ──────────────────────────────────

const EventDetailsView = ({ event, getCategoryTone }) => (
  <>
    <div className="ev-detail-img">
      <img src={event.image || DEFAULT_IMAGE} alt="" onError={(e) => { e.target.src = DEFAULT_IMAGE; }} />
      <span className="ev-card-type"><Pill tone={getCategoryTone(event.type)}>{event.type || "Event"}</Pill></span>
    </div>
    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px" }}>{event.title}</h3>
    {eventNeedsAppUpdate(event) && <div className="k-note warn">{UPDATE_WARNING}</div>}
    {event.capacity ? <Pill tone="blue">{event.registeredCount || 0} of {event.capacity} seats taken</Pill> : null}
    <div className="k-card pad" style={{ padding: "6px 18px" }}>
      <Facts rows={[
        ["organizer", event.organizer || "TBD"],
        ["city", event.city || "TBD"],
        ["prize", event.prize || "TBD"],
        ["date", event.date || "TBA"],
        ["team", event.teamSize || "1-4"],
        ["deadline", event.deadline || "Limited spots"],
      ]} />
    </div>
    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55 }}><b>description:</b> {event.description || "No description provided."}</p>
    <h4 style={{ margin: "6px 0 0", fontFamily: "var(--heading)", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
      <Ico kind="users" tone="blue" size={32} /> registered participants ({event.registrations?.length || 0})
    </h4>
    <Table
      minWidth={560}
      rows={event.registrations || []}
      empty={<div className="k-empty" style={{ padding: 24 }}><p>No participants registered yet</p></div>}
      columns={[
        { key: "n", label: "#", render: (r, i) => i + 1 },
        { key: "name", label: "name", render: (r) => <b>{r.studentName || "Unknown"}</b> },
        { key: "email", label: "email", render: (r) => r.email || "N/A" },
        { key: "wa", label: "WhatsApp", render: (r) => r.whatsapp || "N/A" },
        { key: "pay", label: "payment", render: (r) => <StatusChip status={r.payment?.status} /> },
      ]}
    />
  </>
);

// ─── Event Form (dialog body): templates loading / error / the v2 form ──

const EventDialogBody = ({ templates, templatesState, onRetry, form, ...formProps }) => {
  if (templatesState === "error") {
    return (
      <div className="k-note bad" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ flex: 1, minWidth: 200 }}>The event form couldn't load its category fields from the server. Check your connection and try again.</span>
        <Button size="sm" variant="secondary" onClick={onRetry}>try again</Button>
      </div>
    );
  }
  if (templatesState !== "ready" || !form || !templates) {
    return <PageLoading label="loading the form…" minHeight={180} />;
  }
  return <EventFormV2 templates={templates} form={form} {...formProps} />;
};

export default withTdcTheme(EventManagement);
