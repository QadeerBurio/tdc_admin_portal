import React, { useState, useEffect, useContext, useRef } from "react";
import { withTdcTheme } from "../portal/muiTheme";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Tooltip,
  Stack,
  Fade,
  Slide,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  CloudUpload as CloudUploadIcon,
  Groups as GroupsIcon,
  Timer as TimerIcon,
  EmojiEvents as EmojiEventsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Rocket as RocketIcon,
} from "@mui/icons-material";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import ".//styles/EventManagement.css";
import EventFormV2 from "./events/EventFormV2";
import RegistrationsTab, { StatusChip } from "./events/RegistrationsTab";
import { API_BASE, eventsApi, authProblem, errorMessage, uploadImage, MAX_IMAGE_BYTES, IMAGE_TYPES } from "./events/eventsApi";
import { emptyForm, formFromEvent, validateForm, buildPayload, isLegacyEvent, eventNeedsAppUpdate, UPDATE_WARNING } from "./events/formLogic";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200";

// ─── Loading Spinner ──────────────────────────────────────────────────

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="loading-spinner-wrapper">
      <CircularProgress size={72} sx={{ color: "#111111" }} />
      <div className="loading-spinner-icon">
        <RocketIcon />
      </div>
    </div>
    <div className="loading-title">Loading Dashboard</div>
    <div className="loading-subtitle">Please wait while we fetch your data</div>
  </div>
);

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
    if (!window.confirm("Are you sure you want to delete this event?")) return;
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

  const getCategoryColor = (category) => {
    const colors = {
      Hackathons: "#2B7FC0",
      Workshops: "#8E44AD",
      Conferences: "#D9443F",
      Competitions: "#C77700",
      "Career Fairs": "#2E8B3E",
      Concerts: "#C2185B",
    };
    return colors[category] || "#D9D2C2";
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      Hackathons: "💻",
      Workshops: "🔧",
      Conferences: "🎤",
      Competitions: "🏆",
      "Career Fairs": "💼",
      Concerts: "🎵",
    };
    return emojis[category] || "📌";
  };

  const totalRegistrations = regTotal;
  const totalEvents = events.length;
  const averageRegistrations = totalEvents > 0 ? (totalRegistrations / totalEvents).toFixed(1) : 0;
  const activeEvents = events.filter(e => e.date && new Date(e.date) > new Date()).length || 0;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="event-dashboard">
      <div className="event-container">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <div className="event-header">
          <div className="event-header-left">
            <div className="event-title">
              <span>events<span className="dot" aria-hidden="true">.</span></span>
            </div>
            <div className="event-subtitle">
              campus events, competitions and partner tickets in the app.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="gradient-btn" onClick={handleOpenCsvDialog} style={{ background: '#111111' }}>
              <CloudUploadIcon /> Upload Events CSV
            </button>
            <button className="gradient-btn" onClick={handleCreateEvent}>
              <AddIcon /> Create New Event
            </button>
          </div>
        </div>

        {/* ─── Stats Cards ───────────────────────────────────────────── */}
        <div className="stats-grid">
          <div className="stat-card" style={{ background: "#FFFFFF" }}>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Total Events</div>
                <div className="stat-value">{totalEvents}</div>
                <div className="stat-footer">
                  <TrendingUpIcon className="stat-footer-icon" style={{ color: "#1E6B3A" }} />
                  <span className="stat-footer-text" style={{ color: "#1E6B3A" }}>Active</span>
                </div>
              </div>
              <div className="icon-wrapper" style={{ background: "rgba(0,0,0,0.05)", color: "#111111" }}>
                <EventIcon />
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: "#FFFFFF" }}>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Registrations</div>
                <div className="stat-value">{totalRegistrations}</div>
                <div className="stat-footer">
                  <GroupsIcon className="stat-footer-icon" style={{ color: "#2B7FC0" }} />
                  <span className="stat-footer-text" style={{ color: "#2B7FC0" }}>Total</span>
                </div>
              </div>
              <div className="icon-wrapper" style={{ background: "rgba(59,130,246,0.1)", color: "#2B7FC0" }}>
                <PeopleIcon />
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: "#FFFFFF" }}>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Ave Registrations</div>
                <div className="stat-value">{averageRegistrations}</div>
                <div className="stat-footer">
                  <AutoAwesomeIcon className="stat-footer-icon" style={{ color: "#8E44AD" }} />
                  <span className="stat-footer-text" style={{ color: "#8E44AD" }}>Per event</span>
                </div>
              </div>
              <div className="icon-wrapper" style={{ background: "rgba(139,92,246,0.1)", color: "#8E44AD" }}>
                <TrendingUpIcon />
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: "#FFFFFF" }}>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Active Events</div>
                <div className="stat-value">{activeEvents}</div>
                <div className="stat-footer">
                  <TimerIcon className="stat-footer-icon" style={{ color: "#1E6B3A" }} />
                  <span className="stat-footer-text" style={{ color: "#1E6B3A" }}>Running</span>
                </div>
              </div>
              <div className="icon-wrapper" style={{ background: "rgba(16,185,129,0.1)", color: "#1E6B3A" }}>
                <RocketIcon />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tabs ──────────────────────────────────────────────────── */}
        <Paper className="main-paper">
          <div className="tabs-header">
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? "fullWidth" : "standard"}
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "#111111",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
            >
              <Tab
                className={`tab-item ${tabValue === 0 ? "active" : ""}`}
                label={isMobile ? `Events (${events.length})` : `Events (${events.length})`}
                icon={<EventIcon className="tab-icon" />}
                iconPosition="start"
              />
              <Tab
                className={`tab-item ${tabValue === 1 ? "active" : ""}`}
                label={`Registrations (${regTotal})`}
                icon={<PeopleIcon className="tab-icon" />}
                iconPosition="start"
              />
            </Tabs>
          </div>

          {/* ─── Events Tab ──────────────────────────────────────────── */}
          {tabValue === 0 && (
            <div className="tab-content">
              {events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <EventIcon />
                  </div>
                  <div className="empty-title">No Events Created</div>
                  <div className="empty-subtitle">Create your first event to get started</div>
                  <button className="gradient-btn" onClick={handleCreateEvent}>
                    <AddIcon /> Create Event
                  </button>
                </div>
              ) : (
                <div className="events-grid">
                  {events.map((event, index) => (
                    <Fade in timeout={300 + index * 80} key={event._id}>
                      <div className="glass-card">
                        <div className="event-image-container">
                          <img
                            src={event.image || "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200"}
                            alt={event.title}
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200";
                            }}
                          />
                          <div 
                            className="event-category-chip"
                            style={{
                              backgroundColor: `${getCategoryColor(event.type)}20`,
                              color: getCategoryColor(event.type),
                            }}
                          >
                            {getCategoryEmoji(event.type)} {event.type || "Event"}
                          </div>
                          <div className="event-register-chip">
                            {event.registrations?.length || 0} registered
                            {event.capacity ? ` · ${event.registeredCount || 0}/${event.capacity} seats` : ""}
                          </div>
                        </div>
                        <div className="event-card-content">
                          <div className="event-card-title">{event.title}</div>
                          {eventNeedsAppUpdate(event) && (
                            <Tooltip title={UPDATE_WARNING}>
                              <span className="ev2-status pending" style={{ marginBottom: 6 }}>app update needed</span>
                            </Tooltip>
                          )}
                          <div className="event-card-details">
                            <div className="event-card-detail">
                              <LocationIcon />
                              <span>{event.city || "TBD"}</span>
                            </div>
                            <div className="event-card-detail">
                              <CalendarIcon />
                              <span>{event.date || "TBA"}</span>
                            </div>
                            <div className="event-card-detail">
                              <PersonIcon />
                              <span>{event.organizer || "TBD"}</span>
                            </div>
                          </div>
                        </div>
                        <hr className="event-card-divider" />
                        <div className="event-card-actions">
                          <div className="event-action-buttons">
                            <Tooltip title="View Details">
                              <button className="event-action-btn" onClick={() => handleViewEvent(event)}>
                                <VisibilityIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Edit Event">
                              <button className="event-action-btn" onClick={() => handleEditEvent(event)}>
                                <EditIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Delete Event">
                              <button className="event-action-btn delete" onClick={() => handleDeleteEvent(event._id)}>
                                <DeleteIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
                              </button>
                            </Tooltip>
                          </div>
                          <button className="view-registrations-btn" onClick={() => handleViewEvent(event)}>
                            {isMobile ? "View" : "View Registrations"}
                          </button>
                        </div>
                      </div>
                    </Fade>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Registrations Tab ───────────────────────────────────── */}
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
        </Paper>
      </div>

      {/* ─── Create/Edit/View Dialog ───────────────────────────────── */}
      <Dialog
        className="modern-dialog"
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            overflow: "hidden",
            borderRadius: "20px",
          },
        }}
      >
        <div className="dialog-header">
          <div className="dialog-header-left">
            <div className="dialog-header-icon">
              {dialogType === "create" ? <AddIcon /> : dialogType === "edit" ? <EditIcon /> : <VisibilityIcon />}
            </div>
            <div className="dialog-header-title">
              {dialogType === "create" ? "Create New Event" : 
               dialogType === "edit" ? "Edit Event" : 
               "Event Details"}
            </div>
          </div>
          <button className="dialog-close-btn" onClick={() => setOpenDialog(false)}>
            <CloseIcon />
          </button>
        </div>

        <DialogContent
          className="dialog-content"
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {dialogType === "view" && selectedEvent ? (
            <EventDetailsView 
              event={selectedEvent} 
              getCategoryColor={getCategoryColor}
              getCategoryEmoji={getCategoryEmoji}
              isMobile={isMobile}
            />
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
        </DialogContent>

        {dialogType !== "view" && (
          <div className="dialog-actions" style={{ flexShrink: 0 }}>
            <button className="dialog-cancel-btn" onClick={() => setOpenDialog(false)}>
              Cancel
            </button>
            <button className="gradient-btn" onClick={handleSubmit} disabled={submitting || templatesState !== "ready" || !form}>
              {submitting ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : 
                dialogType === "create" ? "Create Event" : "Update Event"}
            </button>
          </div>
        )}
      </Dialog>

      {/* ─── Snackbar ───────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: isMobile ? "center" : "right" }}
        TransitionComponent={Slide}
      >
        <Alert
          className={`snackbar-alert ${snackbar.severity === "error" ? "error" : ""}`}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ─── CSV Upload Dialog ────────────────────────────────────────── */}
      <Dialog
        open={openCsvDialog}
        onClose={handleCloseCsvDialog}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            overflow: "hidden",
            borderRadius: "16px",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 3,
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUploadIcon sx={{ color: '#1E6B3A' }} /> Upload Events CSV / XLSX
            </Typography>
            <IconButton onClick={handleCloseCsvDialog} disabled={csvUploading}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleUploadCsvSubmit}>
            <Box
              sx={{
                border: '2px dashed #ECE7DB',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                backgroundColor: '#FAF8F3',
                cursor: 'pointer',
                mb: 3,
                transition: 'all 0.2s',
                '&:hover': { backgroundColor: '#F0ECE2', borderColor: '#2E8B3E' }
              }}
              onClick={() => csvFileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={csvFileInputRef}
                accept=".csv, .xlsx, .xls"
                style={{ display: 'none' }}
                onChange={handleCsvFileChange}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: '#6B675E', mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#111111' }}>
                {csvFile ? csvFile.name : "Click to select or drop .csv / .xlsx file"}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                Expected columns: name, date, venue, description, category, source_url
              </Typography>
            </Box>

            {csvUploading && (
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <CircularProgress size={36} sx={{ color: '#1E6B3A' }} />
                <Typography variant="body2" sx={{ mt: 1, color: '#6B675E' }}>
                  Processing & importing events...
                </Typography>
              </Box>
            )}

            {csvResult && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Upload successful: {csvResult.added} events added
                </Typography>
                {csvResult.skipped > 0 && (
                  <Typography variant="body2">
                    {csvResult.skipped} duplicates skipped
                  </Typography>
                )}
              </Alert>
            )}

            {csvError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {csvError}
              </Alert>
            )}

            <DialogActions sx={{ px: 0, pb: 0 }}>
              <Button onClick={handleCloseCsvDialog} disabled={csvUploading} color="inherit">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!csvFile || csvUploading}
                sx={{
                  background: '#111111',
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': { background: '#2E8B3E' }
                }}
              >
                {csvUploading ? "Uploading..." : "Upload & Import"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// ─── Event Details View Component ──────────────────────────────────

const EventDetailsView = ({ event, getCategoryColor, getCategoryEmoji, isMobile }) => (
  <>
    <div className="event-detail-image">
      <img
        src={event.image || "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200"}
        alt={event.title}
        onError={(e) => {
          e.target.src = "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200";
        }}
      />
      <div 
        className="event-category-chip"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          backgroundColor: `${getCategoryColor(event.type)}20`,
          color: getCategoryColor(event.type),
        }}
      >
        {getCategoryEmoji(event.type)} {event.type || "Event"}
      </div>
    </div>
    
    <div className="event-detail-title">{event.title}</div>
    {eventNeedsAppUpdate(event) && (
      <Alert severity="warning" className="ev2-banner">
        {UPDATE_WARNING}
      </Alert>
    )}
    {event.capacity ? (
      <div className="ev2-capacity">
        {event.registeredCount || 0} of {event.capacity} seats taken
      </div>
    ) : null}
    
    <div className="event-detail-grid">
      <div>
        <div className="event-detail-item">
          <PersonIcon />
          <span><strong>Organizer:</strong> {event.organizer || "TBD"}</span>
        </div>
        <div className="event-detail-item">
          <LocationIcon />
          <span><strong>City:</strong> {event.city || "TBD"}</span>
        </div>
        <div className="event-detail-item">
          <EmojiEventsIcon />
          <span><strong>Prize:</strong> {event.prize || "TBD"}</span>
        </div>
      </div>
      <div>
        <div className="event-detail-item">
          <CalendarIcon />
          <span><strong>Date:</strong> {event.date || "TBA"}</span>
        </div>
        <div className="event-detail-item">
          <GroupsIcon />
          <span><strong>Team:</strong> {event.teamSize || "1-4"}</span>
        </div>
        <div className="event-detail-item">
          <TimerIcon />
          <span><strong>Deadline:</strong> {event.deadline || "Limited spots"}</span>
        </div>
      </div>
    </div>
    
    <div className="event-detail-description">
      <p><strong>Description:</strong> {event.description || "No description provided."}</p>
    </div>
    
    <hr className="event-detail-divider" />
    
    <div className="event-detail-participants">
      <PeopleIcon /> Registered Participants ({event.registrations?.length || 0})
    </div>
    
    {event.registrations?.length > 0 ? (
      <TableContainer sx={{ 
        borderRadius: 14, 
        border: "1px solid rgba(0,0,0,0.04)", 
        overflowX: "auto", 
        mt: 2,
        boxShadow: "0 1px 2px rgba(17, 17, 17, 0.04)",
      }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#111111", fontSize: isMobile ? "0.7rem" : "0.875rem" }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#111111", fontSize: isMobile ? "0.7rem" : "0.875rem" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#111111", fontSize: isMobile ? "0.7rem" : "0.875rem" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#111111", fontSize: isMobile ? "0.7rem" : "0.875rem" }}>WhatsApp</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#111111", fontSize: isMobile ? "0.7rem" : "0.875rem" }}>Payment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {event.registrations.map((reg, index) => (
              <TableRow key={reg._id} sx={{ "&:hover": { bgcolor: "rgba(0,0,0,0.02)" } }}>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: 500, fontSize: isMobile ? "0.7rem" : "0.875rem" }}>{reg.studentName || "Unknown"}</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>{reg.email || "N/A"}</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>{reg.whatsapp || "N/A"}</TableCell>
                <TableCell><StatusChip status={reg.payment?.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ) : (
      <Box sx={{ 
        textAlign: "center", 
        py: 4, 
        bgcolor: "rgba(0,0,0,0.02)", 
        borderRadius: 14, 
        mt: 2,
        border: "1px solid rgba(0,0,0,0.04)",
      }}>
        <Typography color="text.secondary" fontWeight="500" sx={{ fontSize: isMobile ? "0.8rem" : "0.85rem" }}>
          No participants registered yet
        </Typography>
      </Box>
    )}
  </>
);

// ─── Event Form (dialog body): templates loading / error / the v2 form ──

const EventDialogBody = ({ templates, templatesState, onRetry, form, ...formProps }) => {
  if (templatesState === "error") {
    return (
      <Alert
        severity="error"
        sx={{ borderRadius: "14px" }}
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        The event form couldn't load its category fields from the server. Check your connection and try again.
      </Alert>
    );
  }
  if (templatesState !== "ready" || !form || !templates) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <CircularProgress size={32} sx={{ color: "#111111" }} />
        <Typography sx={{ mt: 1.5, color: "#6B675E", fontSize: "0.85rem" }}>Loading the form…</Typography>
      </Box>
    );
  }
  return <EventFormV2 templates={templates} form={form} {...formProps} />;
};

export default withTdcTheme(EventManagement);