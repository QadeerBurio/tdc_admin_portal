import React, { useState, useEffect, useContext, useRef } from "react";
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
  TextField,
  Select,
  MenuItem,
  FormControl,
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
  Zoom,
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
  Email as EmailIcon,
  School as SchoolIcon,
  WhatsApp as WhatsAppIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  CloudUpload as CloudUploadIcon,
  Groups as GroupsIcon,
  Timer as TimerIcon,
  EmojiEvents as EmojiEventsIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AutoAwesome as AutoAwesomeIcon,
  Rocket as RocketIcon,
} from "@mui/icons-material";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { format } from "date-fns";
import ".//styles/EventManagement.css";
import EventFormV2 from "./events/EventFormV2";
import { API_BASE, eventsApi, authProblem, errorMessage, uploadImage, MAX_IMAGE_BYTES, IMAGE_TYPES } from "./events/eventsApi";
import { emptyForm, formFromEvent, validateForm, buildPayload, isLegacyEvent } from "./events/formLogic";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200";

// ─── Loading Spinner ──────────────────────────────────────────────────

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="loading-spinner-wrapper">
      <CircularProgress size={72} sx={{ color: "#000" }} />
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
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState("create");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [submitting, setSubmitting] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
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
    setTimeout(() => logout(), 1800);
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
        showSnackbar(`Upload successful — ${added} events added${skipped > 0 ? `, ${skipped} duplicates skipped` : ''}`, "success");
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

  // fetched every time the dialog opens, so admins always get the server's current fields
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
      const res = await axios.get(`${API_BASE}/all-registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegisteredUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setRegisteredUsers([]);
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
    // prices and payment accounts are not in list responses: load them for the form
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

  // image: types and 5 MB checked when picked
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
      // the image: a failed upload stops the save (no silent default photo)
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
      // the server's plain message (e.g. "A paid event needs at least one payment account")
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

  const handleViewRegistration = (registration) => {
    setSelectedRegistration(registration);
  };

  const handleExportData = () => {
    const headers = ["Student Name", "Email", "WhatsApp", "Student ID", "Event", "Registered Date"];
    const data = registeredUsers.map(reg => [
      reg.studentName || "Unknown",
      reg.email || "N/A",
      reg.whatsapp || "N/A",
      reg.studentId || "N/A",
      reg.eventTitle || "Unknown Event",
      reg.createdAt ? format(new Date(reg.createdAt), "MMM dd, yyyy HH:mm") : "N/A"
    ]);

    const csvContent = [headers.join(","), ...data.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showSnackbar("Data exported successfully", "success");
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "desc" ? "asc" : "desc",
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      Hackathons: "#2563eb",
      Workshops: "#7c3aed",
      Conferences: "#dc2626",
      Competitions: "#d97706",
      "Career Fairs": "#059669",
    };
    return colors[category] || "#666";
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      Hackathons: "💻",
      Workshops: "🔧",
      Conferences: "🎤",
      Competitions: "🏆",
      "Career Fairs": "💼",
    };
    return emojis[category] || "📌";
  };

  const totalRegistrations = registeredUsers.length;
  const totalEvents = events.length;
  const averageRegistrations = totalEvents > 0 ? (totalRegistrations / totalEvents).toFixed(1) : 0;
  const activeEvents = events.filter(e => e.date && new Date(e.date) > new Date()).length || 0;

  const filteredRegistrations = registeredUsers
    .filter(reg => {
      const matchesSearch = reg.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            reg.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEvent = filterCategory === "All" || reg.eventTitle === filterCategory;
      return matchesSearch && matchesEvent;
    })
    .sort((a, b) => {
      if (sortConfig.key === "createdAt") {
        return sortConfig.direction === "desc" 
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortConfig.key === "studentName") {
        return sortConfig.direction === "desc"
          ? b.studentName?.localeCompare(a.studentName) || 0
          : a.studentName?.localeCompare(b.studentName) || 0;
      }
      return 0;
    });

  const eventTitles = ["All", ...new Set(registeredUsers.map(reg => reg.eventTitle).filter(Boolean))];

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
              <EmojiEventsIcon className="event-title-icon" />
              Events Dashboard
            </div>
            <div className="event-subtitle">
              <span className="event-subtitle-dot" />
              Manage events and track registrations
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="gradient-btn" onClick={handleOpenCsvDialog} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <CloudUploadIcon /> Upload Events CSV
            </button>
            <button className="gradient-btn" onClick={handleCreateEvent}>
              <AddIcon /> Create New Event
            </button>
          </div>
        </div>

        {/* ─── Stats Cards ───────────────────────────────────────────── */}
        <div className="stats-grid">
          <div className="stat-card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)" }}>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Total Events</div>
                <div className="stat-value">{totalEvents}</div>
                <div className="stat-footer">
                  <TrendingUpIcon className="stat-footer-icon" style={{ color: "#10b981" }} />
                  <span className="stat-footer-text" style={{ color: "#10b981" }}>Active</span>
                </div>
              </div>
              <div className="icon-wrapper" style={{ background: "rgba(0,0,0,0.05)", color: "#000" }}>
                <EventIcon />
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #e8f0fe 100%)" }}>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Registrations</div>
                <div className="stat-value">{totalRegistrations}</div>
                <div className="stat-footer">
                  <GroupsIcon className="stat-footer-icon" style={{ color: "#3b82f6" }} />
                  <span className="stat-footer-text" style={{ color: "#3b82f6" }}>Total</span>
                </div>
              </div>
              <div className="icon-wrapper" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                <PeopleIcon />
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0e8ff 100%)" }}>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Avg Registrations</div>
                <div className="stat-value">{averageRegistrations}</div>
                <div className="stat-footer">
                  <AutoAwesomeIcon className="stat-footer-icon" style={{ color: "#8b5cf6" }} />
                  <span className="stat-footer-text" style={{ color: "#8b5cf6" }}>Per event</span>
                </div>
              </div>
              <div className="icon-wrapper" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                <TrendingUpIcon />
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%)" }}>
            <div className="stat-card-content">
              <div>
                <div className="stat-label">Active Events</div>
                <div className="stat-value">{activeEvents}</div>
                <div className="stat-footer">
                  <TimerIcon className="stat-footer-icon" style={{ color: "#10b981" }} />
                  <span className="stat-footer-text" style={{ color: "#10b981" }}>Running</span>
                </div>
              </div>
              <div className="icon-wrapper" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
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
                  backgroundColor: "#000",
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
                label={isMobile ? `Registrations (${registeredUsers.length})` : `Registrations (${registeredUsers.length})`}
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
                          </div>
                        </div>
                        <div className="event-card-content">
                          <div className="event-card-title">{event.title}</div>
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
            <div className="tab-content">
              <div className="registrations-header">
                <div className="registrations-title">
                  <PeopleIcon />
                  All Registrations
                  <span className="registrations-count">{filteredRegistrations.length}</span>
                </div>
                <div className="registrations-controls">
                  <TextField
                    className="search-field"
                    size="small"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth={isMobile}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "#999" }} />,
                      endAdornment: searchQuery && (
                        <IconButton size="small" onClick={() => setSearchQuery("")}>
                          <ClearIcon />
                        </IconButton>
                      ),
                    }}
                  />
                  <FormControl className="filter-select" size="small">
                    <Select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      displayEmpty
                    >
                      {eventTitles.map((title) => (
                        <MenuItem key={title} value={title}>
                          {title === "All" ? "All Events" : title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <button className="outline-btn" onClick={handleExportData}>
                    <DownloadIcon /> {isMobile ? "Export" : "Export Data"}
                  </button>
                </div>
              </div>

              {filteredRegistrations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <PeopleIcon />
                  </div>
                  <div className="empty-title">No registrations found</div>
                  <div className="empty-subtitle">Try adjusting your search or filter</div>
                </div>
              ) : (
                <div className="table-container">
                  {isMobile ? (
                    <div style={{ padding: "16px" }}>
                      {filteredRegistrations.map((reg, index) => (
                        <Fade in timeout={200 + index * 50} key={reg._id}>
                          <div className="mobile-reg-card">
                            <div className="mobile-reg-header">
                              <div className="mobile-reg-avatar">
                                {reg.studentName?.charAt(0).toUpperCase() || "S"}
                              </div>
                              <div className="mobile-reg-info">
                                <div className="mobile-reg-name">{reg.studentName || "Unknown"}</div>
                                <div className="mobile-reg-email">
                                  <EmailIcon />
                                  {reg.email || "N/A"}
                                </div>
                              </div>
                            </div>
                            <div className="mobile-reg-tags">
                              <span className="mobile-reg-tag outlined">
                                <WhatsAppIcon sx={{ fontSize: 14, color: "#25D366" }} /> {reg.whatsapp || "N/A"}
                              </span>
                              <span className="mobile-reg-tag dark">{reg.eventTitle || "Unknown Event"}</span>
                              <span className="mobile-reg-tag outlined">
                                {reg.createdAt ? format(new Date(reg.createdAt), "MMM dd, yyyy") : "N/A"}
                              </span>
                            </div>
                            <button className="mobile-reg-view-btn" onClick={() => handleViewRegistration(reg)}>
                              <VisibilityIcon sx={{ fontSize: 16 }} /> View Details
                            </button>
                          </div>
                        </Fade>
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHead className="table-header">
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell className="sortable-header" onClick={() => handleSort("studentName")}>
                            Student
                            {sortConfig.key === "studentName" && (
                              sortConfig.direction === "desc" ? <ArrowDownwardIcon sx={{ fontSize: 14 }} /> : <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                            )}
                          </TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>WhatsApp</TableCell>
                          <TableCell>Event</TableCell>
                          <TableCell className="sortable-header" onClick={() => handleSort("createdAt")}>
                            Date
                            {sortConfig.key === "createdAt" && (
                              sortConfig.direction === "desc" ? <ArrowDownwardIcon sx={{ fontSize: 14 }} /> : <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                            )}
                          </TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRegistrations.map((reg, index) => (
                          <TableRow className="table-row" key={reg._id}>
                            <TableCell sx={{ fontWeight: 600, color: "#999" }}>{index + 1}</TableCell>
                            <TableCell>
                              <div className="student-cell">
                                <div className="student-avatar">
                                  {reg.studentName?.charAt(0).toUpperCase() || "S"}
                                </div>
                                <span className="student-name">{reg.studentName || "Unknown"}</span>
                              </div>
                            </TableCell>
                            <TableCell>{reg.email || "N/A"}</TableCell>
                            <TableCell>
                              <div className="whatsapp-cell">
                                <WhatsAppIcon />
                                {reg.whatsapp || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="event-chip">{reg.eventTitle || "Unknown Event"}</span>
                            </TableCell>
                            <TableCell>
                              {reg.createdAt ? format(new Date(reg.createdAt), "MMM dd, yyyy") : "N/A"}
                            </TableCell>
                            <TableCell align="center">
                              <button className="view-btn" onClick={() => handleViewRegistration(reg)}>
                                <VisibilityIcon fontSize="small" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
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
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
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

        <div className="dialog-content">
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
        </div>

        {dialogType !== "view" && (
          <div className="dialog-actions">
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

      {/* ─── Registration Details Dialog ──────────────────────────── */}
      <Dialog
        className="modern-dialog"
        open={!!selectedRegistration}
        onClose={() => setSelectedRegistration(null)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
      >
        <div className="dialog-header">
          <div className="dialog-header-left">
            <div className="dialog-header-icon">
              <PersonIcon />
            </div>
            <div className="dialog-header-title">Student Details</div>
          </div>
          <button className="dialog-close-btn" onClick={() => setSelectedRegistration(null)}>
            <CloseIcon />
          </button>
        </div>
        <div className="dialog-content">
          {selectedRegistration && (
            <RegistrationDetailsView 
              registration={selectedRegistration} 
              isMobile={isMobile} 
            />
          )}
        </div>
        <div className="dialog-actions">
          <button className="dialog-cancel-btn" onClick={() => setSelectedRegistration(null)}>
            Close
          </button>
        </div>
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
      <Dialog open={openCsvDialog} onClose={handleCloseCsvDialog} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUploadIcon sx={{ color: '#10b981' }} /> Upload Events CSV / XLSX
            </Typography>
            <IconButton onClick={handleCloseCsvDialog} disabled={csvUploading}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleUploadCsvSubmit}>
            <Box
              sx={{
                border: '2px dashed #cbd5e1',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                mb: 3,
                transition: 'all 0.2s',
                '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#10b981' }
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
              <CloudUploadIcon sx={{ fontSize: 48, color: '#64748b', mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155' }}>
                {csvFile ? csvFile.name : "Click to select or drop .csv / .xlsx file"}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                Expected columns: name, date, venue, description, category, source_url
              </Typography>
            </Box>

            {csvUploading && (
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <CircularProgress size={36} sx={{ color: '#10b981' }} />
                <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>
                  Processing & importing events...
                </Typography>
              </Box>
            )}

            {csvResult && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Upload successful — {csvResult.added} events added
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
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': { background: '#059669' }
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
        overflow: "hidden", 
        mt: 2,
        boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
      }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#000", fontSize: isMobile ? "0.7rem" : "0.875rem" }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#000", fontSize: isMobile ? "0.7rem" : "0.875rem" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#000", fontSize: isMobile ? "0.7rem" : "0.875rem" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#000", fontSize: isMobile ? "0.7rem" : "0.875rem" }}>WhatsApp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {event.registrations.map((reg, index) => (
              <TableRow key={reg._id} sx={{ "&:hover": { bgcolor: "rgba(0,0,0,0.02)" } }}>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: 500, fontSize: isMobile ? "0.7rem" : "0.875rem" }}>{reg.studentName || "Unknown"}</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>{reg.email || "N/A"}</TableCell>
                <TableCell sx={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>{reg.whatsapp || "N/A"}</TableCell>
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

// ─── Registration Details View ─────────────────────────────────────

const RegistrationDetailsView = ({ registration, isMobile }) => (
  <>
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: isMobile ? 16 : 24, 
      marginBottom: isMobile ? 16 : 24,
      flexDirection: isMobile ? "column" : "row",
      textAlign: isMobile ? "center" : "left",
    }}>
      <div className="mobile-reg-avatar" style={{ width: isMobile ? 72 : 96, height: isMobile ? 72 : 96, fontSize: isMobile ? 32 : 40 }}>
        {registration.studentName?.charAt(0).toUpperCase() || "S"}
      </div>
      <div>
        <div style={{ fontSize: isMobile ? "1.1rem" : "1.5rem", fontWeight: 700, color: "#000" }}>
          {registration.studentName || "Unknown"}
        </div>
        <div style={{ fontSize: isMobile ? "0.8rem" : "0.875rem", color: "#666", fontWeight: 500 }}>
          {registration.eventTitle || "Unknown Event"}
        </div>
        <div style={{ fontSize: isMobile ? "0.7rem" : "0.75rem", color: "#999" }}>
          {registration.createdAt ? format(new Date(registration.createdAt), "MMM dd, yyyy HH:mm") : "N/A"}
        </div>
      </div>
    </div>

    <hr className="event-detail-divider" />

    <div style={{ display: "grid", gap: isMobile ? 12 : 20 }}>
      <div style={{ 
        padding: isMobile ? 16 : 20, 
        backgroundColor: "rgba(0,0,0,0.02)", 
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <EmailIcon sx={{ color: "#000", fontSize: isMobile ? 16 : 20 }} />
          <span style={{ fontWeight: 700, color: "#000", fontSize: isMobile ? "0.8rem" : "0.875rem" }}>Email</span>
        </div>
        <div style={{ fontSize: isMobile ? "0.85rem" : "1rem", color: "#000" }}>
          {registration.email || "N/A"}
        </div>
      </div>

      <div style={{ 
        padding: isMobile ? 16 : 20, 
        backgroundColor: "rgba(0,0,0,0.02)", 
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <WhatsAppIcon sx={{ color: "#25D366", fontSize: isMobile ? 16 : 20 }} />
          <span style={{ fontWeight: 700, color: "#000", fontSize: isMobile ? "0.8rem" : "0.875rem" }}>WhatsApp</span>
        </div>
        <div style={{ fontSize: isMobile ? "0.85rem" : "1rem", color: "#000" }}>
          {registration.whatsapp || "N/A"}
        </div>
      </div>

      <div style={{ 
        padding: isMobile ? 16 : 20, 
        backgroundColor: "rgba(0,0,0,0.02)", 
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <SchoolIcon sx={{ color: "#6366f1", fontSize: isMobile ? 16 : 20 }} />
          <span style={{ fontWeight: 700, color: "#000", fontSize: isMobile ? "0.8rem" : "0.875rem" }}>Student ID</span>
        </div>
        <div style={{ fontSize: isMobile ? "0.85rem" : "1rem", color: "#000" }}>
          {registration.studentId || "Not provided"}
        </div>
      </div>
    </div>
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
        <CircularProgress size={32} sx={{ color: "#000" }} />
        <Typography sx={{ mt: 1.5, color: "#666", fontSize: "0.85rem" }}>Loading the form…</Typography>
      </Box>
    );
  }
  return <EventFormV2 templates={templates} form={form} {...formProps} />;
};

export default EventManagement;