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
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Tooltip,
  Stack,
  Badge,
  AppBar,
  Toolbar,
  IconButton as MuiIconButton,
  Menu,
  MenuItem as MuiMenuItem,
  LinearProgress,
  Fade,
  Zoom,
  Slide,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  WhatsApp as WhatsAppIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Stars as StarsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Groups as GroupsIcon,
  Timer as TimerIcon,
  EmojiEvents as EmojiEventsIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { format } from "date-fns";

const API_BASE = "https://the-deft-crew-production.up.railway.app/api/events";
const CATEGORIES = ["Hackathons", "Workshops", "Conferences", "Competitions", "Career Fairs"];

// ─── Styled Components ──────────────────────────────────────────────
const GlassCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  borderRadius: 24,
  background: "rgba(255, 255, 255, 0.92)",
  backdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.9)",
  boxShadow: "0 4px 40px rgba(0, 0, 0, 0.04)",
  "&:hover": {
    transform: "translateY(-10px) scale(1.01)",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.12)",
    borderColor: "rgba(249, 195, 73, 0.4)",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: "linear-gradient(90deg, #f9c349, #f5a623, #f9c349)",
    backgroundSize: "200% 100%",
    animation: "shimmer 3s ease-in-out infinite",
    borderRadius: "24px 24px 0 0",
    opacity: 0,
    transition: "opacity 0.3s ease",
  },
  "&:hover::before": {
    opacity: 1,
  },
  "@keyframes shimmer": {
    "0%": { backgroundPosition: "200% 0" },
    "100%": { backgroundPosition: "-200% 0" },
  },
}));

const GradientStatCard = styled(Paper)(({ theme, gradient }) => ({
  padding: theme.spacing(3.5),
  borderRadius: 24,
  position: "relative",
  overflow: "hidden",
  height: "100%",
  background: gradient || "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
  border: "1px solid rgba(255, 255, 255, 0.9)",
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-6px) scale(1.01)",
    boxShadow: "0 16px 60px rgba(0, 0, 0, 0.08)",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    width: "120px",
    height: "120px",
    background: "radial-gradient(circle, rgba(249, 195, 73, 0.06) 0%, transparent 70%)",
    pointerEvents: "none",
    borderRadius: "0 0 0 100%",
  },
}));

const StatIconWrapper = styled(Box)(({ gradient }) => ({
  width: 60,
  height: 60,
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: gradient || "linear-gradient(135deg, #f9c349, #f5a623)",
  color: "#fff",
  boxShadow: "0 8px 32px rgba(249, 195, 73, 0.25)",
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "scale(1.12) rotate(-8deg)",
    boxShadow: "0 12px 40px rgba(249, 195, 73, 0.35)",
  },
}));

const GradientChip = styled(Chip)(({ theme, color }) => ({
  background: `linear-gradient(135deg, ${color || "#f9c349"}20, ${color || "#f9c349"}08)`,
  color: color || "#f9c349",
  fontWeight: 700,
  border: `1px solid ${color || "#f9c349"}25`,
  backdropFilter: "blur(12px)",
  borderRadius: "8px",
  padding: "4px 8px",
  "&:hover": {
    background: `linear-gradient(135deg, ${color || "#f9c349"}30, ${color || "#f9c349"}15)`,
    transform: "scale(1.05)",
  },
  transition: "all 0.2s ease",
}));

const AnimatedBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    background: "linear-gradient(135deg, #f9c349, #f5a623)",
    color: "#000000",
    fontWeight: "bold",
    fontSize: 10,
    minWidth: 22,
    height: 22,
    boxShadow: "0 4px 16px rgba(249, 195, 73, 0.4)",
    animation: "pulse 2s infinite",
    "@keyframes pulse": {
      "0%": { transform: "scale(1)" },
      "50%": { transform: "scale(1.15)" },
      "100%": { transform: "scale(1)" },
    },
  },
}));

const UploadArea = styled(Box)(({ theme }) => ({
  border: "2px dashed rgba(249, 195, 73, 0.25)",
  borderRadius: 20,
  padding: theme.spacing(5),
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  background: "rgba(249, 195, 73, 0.02)",
  "&:hover": {
    borderColor: "#f9c349",
    background: "rgba(249, 195, 73, 0.06)",
    transform: "scale(1.01)",
    boxShadow: "0 8px 30px rgba(249, 195, 73, 0.08)",
  },
  "&:active": {
    transform: "scale(0.98)",
  },
}));

const GlowButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #000000, #1a1a1a)",
  color: "#ffffff",
  padding: "12px 32px",
  borderRadius: 14,
  fontWeight: 700,
  textTransform: "none",
  fontSize: "0.95rem",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-3px) scale(1.02)",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)",
    background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
  },
  "&:active": {
    transform: "scale(0.97)",
  },
  "&:disabled": {
    background: "#e0e0e0",
    color: "#999",
  },
}));

const NeonBorderBox = styled(Box)(({ theme }) => ({
  position: "relative",
  borderRadius: 24,
  padding: "3px",
  background: "linear-gradient(135deg, #f9c349, #f5a623, #f9c349, #f5a623)",
  backgroundSize: "300% 300%",
  animation: "gradient 4s ease infinite",
  "@keyframes gradient": {
    "0%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
    "100%": { backgroundPosition: "0% 50%" },
  },
}));

const NeonContent = styled(Box)(({ theme }) => ({
  background: "#ffffff",
  borderRadius: 21,
  padding: theme.spacing(1.5),
}));

const ModernTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    transition: "all 0.3s ease",
    "&:hover fieldset": {
      borderColor: "#f9c349",
      borderWidth: 2,
    },
    "&.Mui-focused fieldset": {
      borderColor: "#000000",
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 500,
    "&.Mui-focused": {
      color: "#000000",
    },
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(249, 195, 73, 0.04)",
    transform: "scale(1.002)",
  },
  "&:last-child td": {
    borderBottom: "none",
  },
}));

const SearchWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

// ─── Main Component ──────────────────────────────────────────────────
const EventManagement = () => {
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
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
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [formData, setFormData] = useState({
    title: "",
    organizer: "",
    city: "",
    type: "Hackathons",
    prize: "",
    deadline: "",
    description: "",
    location: "",
    contact: "",
    date: "",
    teamSize: "",
    image: "",
  });

  useEffect(() => {
    fetchDashboardData();
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const mockNotifications = [
      {
        id: 1,
        type: "registration",
        message: "John Doe registered for Hackathon 2026",
        event: "Hackathon 2026",
        time: "2 hours ago",
        read: false,
        avatar: "JD",
      },
      {
        id: 2,
        type: "registration",
        message: "Sarah Ahmed registered for AI Workshop",
        event: "AI Workshop",
        time: "5 hours ago",
        read: false,
        avatar: "SA",
      },
      {
        id: 3,
        type: "event",
        message: "New event created: Web Dev Conference",
        event: "Web Dev Conference",
        time: "1 day ago",
        read: true,
        avatar: "WC",
      },
      {
        id: 4,
        type: "registration",
        message: "Muhammad Ali registered for Career Fair 2026",
        event: "Career Fair 2026",
        time: "3 days ago",
        read: true,
        avatar: "MA",
      },
    ];
    setNotifications(mockNotifications);
  };

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

  const handleCreateEvent = () => {
    setDialogType("create");
    setFormData({
      title: "",
      organizer: "",
      city: "",
      type: "Hackathons",
      prize: "",
      deadline: "",
      description: "",
      location: "",
      contact: "",
      date: "",
      teamSize: "",
      image: "",
    });
    setSelectedFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    setOpenDialog(true);
  };

  const handleEditEvent = (event) => {
    setDialogType("edit");
    setFormData({
      _id: event._id,
      title: event.title || "",
      organizer: event.organizer || "",
      city: event.city || "",
      type: event.type || "Hackathons",
      prize: event.prize || "",
      deadline: event.deadline || "",
      description: event.description || "",
      location: event.location || "",
      contact: event.contact || "",
      date: event.date || "",
      teamSize: event.teamSize || "",
      image: event.image || "",
    });
    setSelectedFile(null);
    setImagePreview(event.image || null);
    setUploadProgress(0);
    setOpenDialog(true);
  };

  const handleViewEvent = async (event) => {
    setDialogType("view");
    const registrations = await fetchEventRegistrations(event._id);
    setSelectedEvent({ ...event, registrations });
    setOpenDialog(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This will also delete all registrations.")) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar("Event deleted successfully", "success");
      await fetchEvents();
      await fetchAllRegistrations();
    } catch (error) {
      showSnackbar(error.response?.data?.error || "Error deleting event", "error");
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'tdc_profiles');
    formData.append('cloud_name', 'decaxpera');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/decaxpera/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.organizer || !formData.city) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    
    try {
      let imageUrl = formData.image || "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200";
      
      if (selectedFile) {
        setUploadProgress(30);
        const uploadedUrl = await uploadImageToCloudinary(selectedFile);
        setUploadProgress(70);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
        setUploadProgress(100);
      }

      const eventData = {
        title: formData.title,
        organizer: formData.organizer,
        city: formData.city,
        type: formData.type || "Hackathons",
        prize: formData.prize || "TBD",
        deadline: formData.deadline || "Limited spots",
        description: formData.description || "",
        location: formData.location || "Online/Venue TBD",
        contact: formData.contact || "",
        date: formData.date || new Date().toLocaleDateString(),
        teamSize: formData.teamSize || "1-4 Members",
        image: imageUrl,
      };

      if (dialogType === "create") {
        await axios.post(`${API_BASE}/create`, eventData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showSnackbar("Event created successfully", "success");
        addNotification({
          type: "event",
          message: `New event created: ${formData.title}`,
          event: formData.title,
        });
      } else {
        await axios.put(`${API_BASE}/event/${formData._id}`, eventData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showSnackbar("Event updated successfully", "success");
      }
      setOpenDialog(false);
      setSelectedFile(null);
      setImagePreview(null);
      setUploadProgress(0);
      await fetchEvents();
      await fetchAllRegistrations();
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Error saving event", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      time: "Just now",
      read: false,
      avatar: notification.event?.charAt(0) || "N",
    };
    setNotifications([newNotification, ...notifications]);
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

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
    return colors[category] || "#000000";
  };

  const getCategoryBg = (category) => {
    const colors = {
      Hackathons: "#dbeafe",
      Workshops: "#ede9fe",
      Conferences: "#fef2f2",
      Competitions: "#fffbeb",
      "Career Fairs": "#ecfdf5",
    };
    return colors[category] || "#f5f5f5";
  };

  const totalRegistrations = registeredUsers.length;
  const totalEvents = events.length;
  const averageRegistrations = totalEvents > 0 ? (totalRegistrations / totalEvents).toFixed(1) : 0;
  const activeEvents = events.filter(e => e.date && new Date(e.date) > new Date()).length || 0;

  const filteredRegistrations = registeredUsers
    .filter(reg => {
      const matchesSearch = reg.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            reg.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            reg.whatsapp?.includes(searchQuery);
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
  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      }}>
        <CircularProgress size={80} sx={{ color: "#f9c349", mb: 3 }} />
        <Typography variant="h6" color="text.secondary" fontWeight="600">
          Loading your dashboard...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please wait while we fetch your data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: "#f5f7fa", 
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%)",
    }}>
     
      {/* ─── Main Content ───────────────────────────────────────────── */}
      <Container maxWidth="xl" sx={{ py: 5 }}>
        {/* Header Section */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start",
          mb: 5,
          flexWrap: "wrap",
          gap: 3,
        }}>
          <Box>
            <Typography 
              variant="h4" 
              fontWeight="800" 
              color="#000"
              sx={{
                background: "linear-gradient(135deg, #000000, #333333)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}
            >
              Event Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
              Manage your events and track registrations in one place
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            
            <GlowButton
              startIcon={<AddIcon />}
              onClick={handleCreateEvent}
            >
              Create Event
            </GlowButton>
          </Box>
        </Box>

        {/* Notification Panel */}
        {showNotificationPanel && (
          <Paper sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 20,
            border: "1px solid rgba(255, 255, 255, 0.8)",
            bgcolor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" fontWeight="700" color="#000">
                Notifications
              </Typography>
              <Button 
                size="small" 
                onClick={() => setShowNotificationPanel(false)}
                sx={{ textTransform: "none", color: "#666" }}
              >
                Close
              </Button>
            </Box>
            <Stack spacing={2}>
              {notifications.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                  No notifications
                </Typography>
              ) : (
                notifications.map((n) => (
                  <Paper
                    key={n.id}
                    sx={{
                      p: 2.5,
                      bgcolor: n.read ? "transparent" : "rgba(249, 195, 73, 0.06)",
                      borderRadius: 16,
                      border: n.read ? "none" : "1px solid rgba(249, 195, 73, 0.2)",
                      transition: "all 0.2s ease",
                      "&:hover": { bgcolor: "rgba(249, 195, 73, 0.04)" },
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                      <Avatar sx={{ bgcolor: "#f9c349", color: "#000", width: 40, height: 40 }}>
                        {n.avatar}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="#000">
                          {n.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {n.time}
                        </Typography>
                      </Box>
                      {!n.read && (
                        <Chip
                          label="New"
                          size="small"
                          sx={{ bgcolor: "#f9c349", color: "#000", fontWeight: 700, fontSize: 10 }}
                        />
                      )}
                    </Box>
                  </Paper>
                ))
              )}
            </Stack>
          </Paper>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Fade in timeout={400}>
              <GradientStatCard gradient="linear-gradient(135deg, #ffffff 0%, #fff9f0 100%)">
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                      Total Events
                    </Typography>
                    <Typography variant="h3" fontWeight="800" color="#000" sx={{ mt: 0.5 }}>
                      {totalEvents}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                      <TrendingUpIcon sx={{ fontSize: 16, color: "#f9c349" }} />
                      <Typography variant="caption" color="success.main" fontWeight="600">
                        Active
                      </Typography>
                    </Box>
                  </Box>
                  <StatIconWrapper gradient="linear-gradient(135deg, #f9c349, #f5a623)">
                    <EventIcon />
                  </StatIconWrapper>
                </Box>
              </GradientStatCard>
            </Fade>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Fade in timeout={600}>
              <GradientStatCard gradient="linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)">
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                      Registrations
                    </Typography>
                    <Typography variant="h3" fontWeight="800" color="#000" sx={{ mt: 0.5 }}>
                      {totalRegistrations}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                      <GroupsIcon sx={{ fontSize: 16, color: "#2563eb" }} />
                      <Typography variant="caption" color="success.main" fontWeight="600">
                        Total
                      </Typography>
                    </Box>
                  </Box>
                  <StatIconWrapper gradient="linear-gradient(135deg, #2563eb, #1d4ed8)">
                    <PeopleIcon />
                  </StatIconWrapper>
                </Box>
              </GradientStatCard>
            </Fade>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Fade in timeout={800}>
              <GradientStatCard gradient="linear-gradient(135deg, #ffffff 0%, #f5f0ff 100%)">
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                      Avg Registrations
                    </Typography>
                    <Typography variant="h3" fontWeight="800" color="#000" sx={{ mt: 0.5 }}>
                      {averageRegistrations}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                      <StarsIcon sx={{ fontSize: 16, color: "#7c3aed" }} />
                      <Typography variant="caption" color="success.main" fontWeight="600">
                        Per event
                      </Typography>
                    </Box>
                  </Box>
                  <StatIconWrapper gradient="linear-gradient(135deg, #7c3aed, #6d28d9)">
                    <TrendingUpIcon />
                  </StatIconWrapper>
                </Box>
              </GradientStatCard>
            </Fade>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Fade in timeout={1000}>
              <GradientStatCard gradient="linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)">
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                      Active Events
                    </Typography>
                    <Typography variant="h3" fontWeight="800" color="#000" sx={{ mt: 0.5 }}>
                      {activeEvents}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                      <TimerIcon sx={{ fontSize: 16, color: "#059669" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        Running
                      </Typography>
                    </Box>
                  </Box>
                  <StatIconWrapper gradient="linear-gradient(135deg, #059669, #047857)">
                    <CalendarIcon />
                  </StatIconWrapper>
                </Box>
              </GradientStatCard>
            </Fade>
          </Grid>
        </Grid>

        {/* ─── Tabs ────────────────────────────────────────────────── */}
        <Paper
          sx={{
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            bgcolor: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 4px 40px rgba(0, 0, 0, 0.04)",
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "#f0f0f0", px: 4, pt: 2.5 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: 16,
                  py: 2,
                  minWidth: 160,
                  color: "#888",
                  transition: "all 0.3s ease",
                  "&:hover": { color: "#000", backgroundColor: "rgba(249, 195, 73, 0.04)" },
                  borderRadius: "12px 12px 0 0",
                },
                "& .Mui-selected": {
                  color: "#000 !important",
                  fontWeight: 700,
                  backgroundColor: "rgba(249, 195, 73, 0.06)",
                },
                "& .MuiTabs-indicator": {
                  bgcolor: "#f9c349",
                  height: 4,
                  borderRadius: "4px 4px 0 0",
                },
              }}
            >
              <Tab
                label={`Events (${events.length})`}
                icon={<EventIcon sx={{ fontSize: 22 }} />}
                iconPosition="start"
              />
              <Tab
                label={`Registrations (${registeredUsers.length})`}
                icon={<PeopleIcon sx={{ fontSize: 22 }} />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* ─── Events Tab Content ────────────────────────────────── */}
          {tabValue === 0 && (
            <Box sx={{ p: 4 }}>
              <Grid container spacing={4}>
                {events.length === 0 ? (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: "center", py: 10 }}>
                      <EventIcon sx={{ fontSize: 100, color: "#e0e0e0", mb: 3 }} />
                      <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="700">
                        No Events Created Yet
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: "auto" }}>
                        Start by creating your first event and bring your campus community together.
                      </Typography>
                      <GlowButton startIcon={<AddIcon />} onClick={handleCreateEvent}>
                        Create Your First Event
                      </GlowButton>
                    </Box>
                  </Grid>
                ) : (
                  events.map((event, index) => (
                    <Grid item xs={12} md={6} lg={4} key={event._id}>
                      <Slide in timeout={300 + index * 100} direction="up">
                        <GlassCard>
                          <Box sx={{ position: "relative", pt: "56.25%", overflow: "hidden" }}>
                            <img
                              src={event.image || "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200"}
                              alt={event.title}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.6s ease",
                              }}
                              onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200";
                              }}
                            />
                            <GradientChip
                              label={event.type || "Event"}
                              size="small"
                              color={getCategoryColor(event.type)}
                              sx={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                backdropFilter: "blur(12px)",
                              }}
                            />
                            <Chip
                              label={`${event.registrations?.length || 0} registered`}
                              size="small"
                              sx={{
                                position: "absolute",
                                bottom: 16,
                                left: 16,
                                bgcolor: "rgba(0,0,0,0.75)",
                                color: "#fff",
                                fontWeight: 600,
                                backdropFilter: "blur(12px)",
                                border: "none",
                                borderRadius: "8px",
                                px: 1.5,
                              }}
                            />
                          </Box>
                          <CardContent sx={{ flexGrow: 1, pt: 2.5 }}>
                            <Typography variant="h6" gutterBottom fontWeight="700" color="#000" noWrap>
                              {event.title}
                            </Typography>
                            <Stack spacing={0.75}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LocationIcon sx={{ fontSize: 16, color: "#888" }} />
                                <Typography variant="body2" color="text.secondary">
                                  {event.city || "TBD"}
                                </Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: "#888" }} />
                                <Typography variant="body2" color="text.secondary">
                                  {event.date || "TBA"}
                                </Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <PeopleIcon sx={{ fontSize: 16, color: "#888" }} />
                                <Typography variant="body2" color="text.secondary">
                                  {event.teamSize || "1-4 Members"}
                                </Typography>
                              </Box>
                            </Stack>
                          </CardContent>
                          <Divider sx={{ borderColor: "#f0f0f0" }} />
                          <CardActions sx={{ justifyContent: "space-between", p: 2.5 }}>
                            <Box>
                              <Tooltip title="View Details">
                                <IconButton 
                                  onClick={() => handleViewEvent(event)} 
                                  sx={{ 
                                    color: "#888",
                                    transition: "all 0.2s ease",
                                    "&:hover": { color: "#000", bgcolor: "rgba(0,0,0,0.04)" },
                                  }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton 
                                  onClick={() => handleEditEvent(event)} 
                                  sx={{ 
                                    color: "#888",
                                    transition: "all 0.2s ease",
                                    "&:hover": { color: "#f9c349", bgcolor: "rgba(249, 195, 73, 0.08)" },
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  onClick={() => handleDeleteEvent(event._id)} 
                                  sx={{ 
                                    color: "#888",
                                    transition: "all 0.2s ease",
                                    "&:hover": { color: "#d32f2f", bgcolor: "rgba(211, 47, 47, 0.08)" },
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Chip
                              label="View Registrations"
                              size="small"
                              onClick={() => handleViewEvent(event)}
                              sx={{
                                cursor: "pointer",
                                bgcolor: "#000",
                                color: "#fff",
                                fontWeight: 600,
                                "&:hover": { bgcolor: "#1a1a1a", transform: "scale(1.02)" },
                                fontSize: 11,
                                borderRadius: 2,
                                transition: "all 0.2s ease",
                              }}
                            />
                          </CardActions>
                        </GlassCard>
                      </Slide>
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
          )}

          {/* ─── Registrations Tab Content ────────────────────────── */}
          {tabValue === 1 && (
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
                <Typography variant="h6" fontWeight="700" color="#000">
                  All Registrations
                </Typography>
                <SearchWrapper>
                  <TextField
                    size="small"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} />,
                      endAdornment: searchQuery && (
                        <IconButton size="small" onClick={() => setSearchQuery("")}>
                          <ClearIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      ),
                    }}
                    sx={{
                      minWidth: 240,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 14,
                        bgcolor: "rgba(0,0,0,0.02)",
                        "&:hover fieldset": { borderColor: "#f9c349" },
                        "&.Mui-focused fieldset": { borderColor: "#000" },
                      },
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      displayEmpty
                      sx={{
                        borderRadius: 14,
                        bgcolor: "rgba(0,0,0,0.02)",
                        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                        "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                      }}
                    >
                      {eventTitles.map((title) => (
                        <MenuItem key={title} value={title}>
                          {title === "All" ? "All Events" : title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Chip
                    label={`Total: ${filteredRegistrations.length}`}
                    sx={{ bgcolor: "#f9c349", color: "#000", fontWeight: 700, borderRadius: 2 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportData}
                    size="small"
                    sx={{
                      borderColor: "#000",
                      color: "#000",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 14,
                      px: 3,
                      "&:hover": { borderColor: "#000", bgcolor: "#f5f5f5" },
                    }}
                  >
                    Export
                  </Button>
                </SearchWrapper>
              </Box>

              {filteredRegistrations.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <PeopleIcon sx={{ fontSize: 80, color: "#e0e0e0", mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" fontWeight="600">
                    No registrations found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {registeredUsers.length > 0 ? "Try adjusting your filters" : "When students register, they'll appear here"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ 
                  borderRadius: 20, 
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                }}>
                  <Table>
                    <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: "#000" }}>#</TableCell>
                        <TableCell 
                          sx={{ fontWeight: 700, color: "#000", cursor: "pointer" }}
                          onClick={() => handleSort("studentName")}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            Student
                            {sortConfig.key === "studentName" && (
                              sortConfig.direction === "desc" ? <ArrowDownwardIcon sx={{ fontSize: 14 }} /> : <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#000" }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#000" }}>WhatsApp</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#000" }}>Event</TableCell>
                        <TableCell 
                          sx={{ fontWeight: 700, color: "#000", cursor: "pointer" }}
                          onClick={() => handleSort("createdAt")}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            Registered Date
                            {sortConfig.key === "createdAt" && (
                              sortConfig.direction === "desc" ? <ArrowDownwardIcon sx={{ fontSize: 14 }} /> : <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#000" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRegistrations.map((reg, index) => (
                        <StyledTableRow key={reg._id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Avatar sx={{ bgcolor: "#f9c349", width: 36, height: 36, color: "#000", fontWeight: "bold", fontSize: 14 }}>
                                {reg.studentName?.charAt(0).toUpperCase() || "S"}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600} color="#000">
                                {reg.studentName || "Unknown"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{reg.email || "N/A"}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <WhatsAppIcon sx={{ fontSize: 16, color: "#25D366" }} />
                              {reg.whatsapp || "N/A"}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <GradientChip
                              label={reg.eventTitle || "Unknown Event"}
                              size="small"
                              color="#f9c349"
                              sx={{ maxWidth: 150, fontSize: 11 }}
                            />
                          </TableCell>
                          <TableCell>
                            {reg.createdAt ? format(new Date(reg.createdAt), "MMM dd, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewRegistration(reg)}
                                sx={{ 
                                  color: "#888",
                                  transition: "all 0.2s ease",
                                  "&:hover": { color: "#f9c349", bgcolor: "rgba(249,195,73,0.08)" },
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Paper>
      </Container>

      {/* ─── Create/Edit/View Dialog ───────────────────────────────── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 28, 
            overflow: "hidden",
            bgcolor: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
          } 
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
      >
        <DialogTitle sx={{ 
          bgcolor: "#000", 
          color: "#fff", 
          py: 3.5, 
          px: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ 
              bgcolor: "rgba(255,255,255,0.1)", 
              borderRadius: 2, 
              p: 1,
              display: "flex",
              alignItems: "center",
            }}>
              {dialogType === "create" ? <AddIcon /> : dialogType === "edit" ? <EditIcon /> : <VisibilityIcon />}
            </Box>
            <Typography variant="h6" fontWeight="700">
              {dialogType === "create" ? "Create New Event" : 
               dialogType === "edit" ? "Edit Event" : 
               "Event Details"}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenDialog(false)} 
            sx={{ 
              color: "#fff", 
              "&:hover": { bgcolor: "rgba(255,255,255,0.12)", transform: "rotate(90deg)" },
              transition: "all 0.3s ease",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {dialogType === "view" && selectedEvent ? (
            <EventDetailsView 
              event={selectedEvent} 
              getCategoryBg={getCategoryBg}
              getCategoryColor={getCategoryColor}
            />
          ) : (
            <EventForm
              formData={formData}
              setFormData={setFormData}
              categories={CATEGORIES}
              selectedFile={selectedFile}
              imagePreview={imagePreview}
              handleFileSelect={handleFileSelect}
              handleRemoveImage={handleRemoveImage}
              fileInputRef={fileInputRef}
              uploadProgress={uploadProgress}
              submitting={submitting}
            />
          )}
        </DialogContent>

        {dialogType !== "view" && (
          <DialogActions sx={{ p: 4, pt: 0 }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{ 
                color: "#888", 
                textTransform: "none", 
                fontWeight: 600,
                "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                borderRadius: 2,
                px: 4,
              }}
            >
              Cancel
            </Button>
            <GlowButton
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ minWidth: 160 }}
            >
              {submitting ? <CircularProgress size={24} sx={{ color: "#f9c349" }} /> : 
                dialogType === "create" ? "Create Event" : "Update Event"}
            </GlowButton>
          </DialogActions>
        )}
      </Dialog>

      {/* ─── Registration Details Dialog ──────────────────────────── */}
      <Dialog
        open={!!selectedRegistration}
        onClose={() => setSelectedRegistration(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 28, 
            overflow: "hidden",
            bgcolor: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
          } 
        }}
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ 
          bgcolor: "#000", 
          color: "#fff", 
          py: 3.5, 
          px: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ 
              bgcolor: "rgba(255,255,255,0.1)", 
              borderRadius: 2, 
              p: 1,
              display: "flex",
              alignItems: "center",
            }}>
              <PersonIcon />
            </Box>
            <Typography variant="h6" fontWeight="700">
              Student Details
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setSelectedRegistration(null)} 
            sx={{ 
              color: "#fff", 
              "&:hover": { bgcolor: "rgba(255,255,255,0.12)", transform: "rotate(90deg)" },
              transition: "all 0.3s ease",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {selectedRegistration && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
                <Avatar sx={{ 
                  bgcolor: "#f9c349", 
                  width: 80, 
                  height: 80, 
                  color: "#000", 
                  fontWeight: "bold", 
                  fontSize: 32,
                  boxShadow: "0 8px 32px rgba(249, 195, 73, 0.3)",
                }}>
                  {selectedRegistration.studentName?.charAt(0).toUpperCase() || "S"}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="700" color="#000">
                    {selectedRegistration.studentName || "Unknown"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="500">
                    Registered for: {selectedRegistration.eventTitle || "Unknown Event"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedRegistration.createdAt ? format(new Date(selectedRegistration.createdAt), "MMM dd, yyyy HH:mm") : "N/A"}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 3, 
                    bgcolor: "rgba(0,0,0,0.02)", 
                    borderRadius: 16,
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: "rgba(249, 195, 73, 0.04)", transform: "scale(1.01)" },
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <EmailIcon sx={{ color: "#f9c349" }} />
                      <Typography variant="body2" fontWeight="700" color="#000">Email</Typography>
                    </Box>
                    <Typography variant="body1" color="#000">{selectedRegistration.email || "N/A"}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 3, 
                    bgcolor: "rgba(0,0,0,0.02)", 
                    borderRadius: 16,
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: "rgba(37, 211, 102, 0.04)", transform: "scale(1.01)" },
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <WhatsAppIcon sx={{ color: "#25D366" }} />
                      <Typography variant="body2" fontWeight="700" color="#000">WhatsApp</Typography>
                    </Box>
                    <Typography variant="body1" color="#000">{selectedRegistration.whatsapp || "N/A"}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 3, 
                    bgcolor: "rgba(0,0,0,0.02)", 
                    borderRadius: 16,
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: "rgba(99, 102, 241, 0.04)", transform: "scale(1.01)" },
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <SchoolIcon sx={{ color: "#6366f1" }} />
                      <Typography variant="body2" fontWeight="700" color="#000">Student ID / CNIC</Typography>
                    </Box>
                    <Typography variant="body1" color="#000">{selectedRegistration.studentId || "Not provided"}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button 
            onClick={() => setSelectedRegistration(null)}
            sx={{ 
              color: "#888", 
              textTransform: "none", 
              fontWeight: 600,
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
              borderRadius: 2,
              px: 4,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ───────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        TransitionComponent={Slide}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            borderRadius: 16,
            fontWeight: 600,
            bgcolor: snackbar.severity === "success" ? "#f9c349" : "#fff",
            color: snackbar.severity === "success" ? "#000" : "#000",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
            "& .MuiAlert-icon": {
              color: snackbar.severity === "success" ? "#000" : "#f9c349",
            },
          }}
          icon={snackbar.severity === "success" ? <CheckCircleIcon /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Event Details View Component ──────────────────────────────────
const EventDetailsView = ({ event, getCategoryBg, getCategoryColor }) => (
  <Box>
    <Box sx={{ 
      position: "relative", 
      mb: 4, 
      borderRadius: 16, 
      overflow: "hidden", 
      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      "& img": {
        transition: "transform 0.6s ease",
        "&:hover": {
          transform: "scale(1.02)",
        },
      },
    }}>
      <img
        src={event.image || "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200"}
        alt={event.title}
        style={{ width: "100%", height: 280, objectFit: "cover" }}
        onError={(e) => {
          e.target.src = "https://images.unsplash.com/photo-1523240715632-d984bb4b970e?w=1200";
        }}
      />
      <GradientChip
        label={event.type || "Event"}
        color={getCategoryColor(event.type)}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          fontSize: 12,
        }}
      />
    </Box>
    
    <Typography variant="h5" fontWeight="700" color="#000" gutterBottom>
      {event.title}
    </Typography>
    
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: "#f9c349" }} />
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: "#000" }}>Organizer:</strong> {event.organizer || "TBD"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocationIcon sx={{ fontSize: 18, color: "#f9c349" }} />
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: "#000" }}>City:</strong> {event.city || "TBD"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CategoryIcon sx={{ fontSize: 18, color: "#f9c349" }} />
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: "#000" }}>Category:</strong> {event.type || "TBD"}
            </Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarIcon sx={{ fontSize: 18, color: "#f9c349" }} />
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: "#000" }}>Date:</strong> {event.date || "TBA"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmojiEventsIcon sx={{ fontSize: 18, color: "#f9c349" }} />
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: "#000" }}>Prize:</strong> {event.prize || "TBD"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GroupsIcon sx={{ fontSize: 18, color: "#f9c349" }} />
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: "#000" }}>Team Size:</strong> {event.teamSize || "1-4"}
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
    
    <Paper sx={{ p: 3.5, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 16, mb: 4, border: "1px solid rgba(0,0,0,0.04)" }}>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
        <strong style={{ color: "#000" }}>Description:</strong> {event.description || "No description provided."}
      </Typography>
    </Paper>
    
    <Divider sx={{ my: 4 }} />
    
    <Typography variant="h6" fontWeight="700" color="#000" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ bgcolor: "#f9c349", borderRadius: 2, p: 1, display: "flex", alignItems: "center" }}>
        <PeopleIcon sx={{ color: "#000" }} />
      </Box>
      Registered Students ({event.registrations?.length || 0})
    </Typography>
    
    {event.registrations?.length > 0 ? (
      <TableContainer sx={{ 
        borderRadius: 16, 
        border: "1px solid rgba(0,0,0,0.06)",
        overflow: "hidden",
        mt: 2,
      }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#000" }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#000" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#000" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#000" }}>WhatsApp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {event.registrations.map((reg, index) => (
              <TableRow key={reg._id} sx={{ "&:hover": { bgcolor: "rgba(249, 195, 73, 0.04)" } }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{reg.studentName || "Unknown"}</TableCell>
                <TableCell>{reg.email || "N/A"}</TableCell>
                <TableCell>{reg.whatsapp || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ) : (
      <Box sx={{ textAlign: "center", py: 5, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 16, mt: 2 }}>
        <Typography color="text.secondary" fontWeight="500">No registrations yet</Typography>
        <Typography variant="caption" color="text.secondary">Students who register will appear here</Typography>
      </Box>
    )}
  </Box>
);

// ─── Event Form Component with Image Upload ──────────────────────
const EventForm = ({ 
  formData, 
  setFormData, 
  categories, 
  selectedFile, 
  imagePreview, 
  handleFileSelect, 
  handleRemoveImage,
  fileInputRef,
  uploadProgress,
  submitting
}) => (
  <Box sx={{ mt: 1 }}>
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ModernTextField
          fullWidth
          label="Event Title *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          size="medium"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernTextField
          fullWidth
          label="Organizer / University *"
          value={formData.organizer}
          onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
          required
          size="medium"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernTextField
          fullWidth
          label="City *"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          required
          size="medium"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth size="medium">
          <InputLabel sx={{ fontWeight: 500 }}>Category</InputLabel>
          <Select
            value={formData.type}
            label="Category"
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            sx={{
              borderRadius: 14,
              bgcolor: "rgba(0,0,0,0.02)",
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#f9c349" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#000", borderWidth: 2 },
            }}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <ModernTextField
          fullWidth
          label="Description"
          multiline
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          size="medium"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernTextField
          fullWidth
          label="Date"
          placeholder="15 May 2026"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          size="medium"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernTextField
          fullWidth
          label="Team Size"
          placeholder="2-4 Members"
          value={formData.teamSize}
          onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
          size="medium"
        />
      </Grid>
      <Grid item xs={12}>
        <ModernTextField
          fullWidth
          label="Location / Venue"
          placeholder="Online, Auditorium, etc."
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          size="medium"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernTextField
          fullWidth
          label="Prize Pool"
          placeholder="PKR 100,000"
          value={formData.prize}
          onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
          size="medium"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ModernTextField
          fullWidth
          label="Registration Deadline"
          placeholder="30 April 2026"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          size="medium"
        />
      </Grid>
      <Grid item xs={12}>
        <ModernTextField
          fullWidth
          label="Contact Info"
          placeholder="Email or Phone"
          value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          size="medium"
        />
      </Grid>
      
      {/* Image Upload Section */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" fontWeight="600" color="#000" sx={{ mb: 2 }}>
          Event Banner Image
        </Typography>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <UploadArea onClick={() => fileInputRef.current?.click()}>
          {imagePreview ? (
            <Box sx={{ position: 'relative' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '100%',
                  maxHeight: 240,
                  objectFit: 'cover',
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  bgcolor: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 38,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  "&:hover": { bgcolor: 'rgba(0,0,0,0.9)', transform: 'scale(1.1) rotate(90deg)' },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
          ) : (
            <Box>
              <CloudUploadIcon sx={{ fontSize: 60, color: '#f9c349', mb: 2 }} />
              <Typography variant="body1" fontWeight="600" color="#000">
                Click to upload image
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PNG, JPG, GIF up to 5MB
              </Typography>
            </Box>
          )}
        </UploadArea>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: '#f0f0f0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#f9c349',
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #f9c349, #f5a623)',
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontWeight: 500 }}>
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  </Box>
);

export default EventManagement;