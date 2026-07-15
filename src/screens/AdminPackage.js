import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  FaUsers, FaCalendarAlt, FaDollarSign, FaClock, 
  FaCheckCircle, FaTimesCircle, FaEdit, FaTrash,
  FaSyncAlt, FaSearch, FaFilter, FaArrowUp,
  FaArrowDown, FaEye, FaChevronRight, FaSpinner,
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaStar, FaTrophy, FaRocket, FaShieldAlt,
  FaChartLine, FaBox, FaPlane, FaHotel,
  FaUtensils, FaBus, FaCamera, FaShoppingBag
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'https://the-deft-crew-production.up.railway.app/api/admin';

const AdminPackage = () => {
    const { token } = useContext(AuthContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        totalRevenue: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('newest');

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [bookingsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/bookings/all`, config),
                axios.get(`${API_URL}/bookings/stats`, config)
            ]);
            setBookings(bookingsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (bookingId) => {
        if (!window.confirm("Are you sure you want to permanently delete this booking? This action cannot be undone.")) return;
        
        setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${API_URL}/bookings/${bookingId}`, config);
            fetchData(); 
            alert("Booking deleted successfully");
        } catch (err) {
            alert("Delete failed: " + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickApprove = async (bookingId) => {
        if (!window.confirm("Confirm approval?")) return;
        setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API_URL}/bookings/${bookingId}`, { 
                status: 'confirmed',
                adminNotes: 'Quick approved by Admin' 
            }, config);
            fetchData();
        } catch (err) {
            alert("Action failed: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(
                `${API_URL}/bookings/${selectedBooking._id}`,
                { status: statusUpdate, adminNotes },
                config
            );
            setSelectedBooking(null);
            fetchData();
        } catch (error) {
            alert('Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const configs = {
            pending: { icon: <FaClock size={12} />, color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
            confirmed: { icon: <FaCheckCircle size={12} />, color: '#10b981', bg: '#d1fae5', label: 'Confirmed' },
            cancelled: { icon: <FaTimesCircle size={12} />, color: '#ef4444', bg: '#fee2e2', label: 'Cancelled' },
            completed: { icon: <FaStar size={12} />, color: '#8b5cf6', bg: '#ede9fe', label: 'Completed' }
        };
        return configs[status] || configs.pending;
    };

    const filteredBookings = bookings
        .filter(booking => {
            const matchesSearch = booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  booking.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  booking.packageName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'All' || booking.status === filterStatus;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortBy === 'amount') return b.totalAmount - a.totalAmount;
            if (sortBy === 'status') return a.status.localeCompare(b.status);
            return 0;
        });

    if (loading) {
        return (
            <motion.div 
                className="admin-loader-container" 
                style={styles.loaderContainer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <motion.div 
                    className="spinner" 
                    style={styles.spinner}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p style={{ color: '#64748b', marginTop: '16px', fontWeight: 500 }}>Syncing Dashboard...</p>
            </motion.div>
        );
    }

    return (
        <div style={styles.pageWrapper}>
            {/* Decorative Background */}
            <div style={styles.bgDecoration1}></div>
            <div style={styles.bgDecoration2}></div>
            <div style={styles.bgDecoration3}></div>

            <motion.div 
                className="admin-dashboard" 
                style={styles.dashboard}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <motion.header 
                    className="admin-header" 
                    style={styles.header}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div>
                        <div style={styles.headerBadge}>
                            <FaPlane size={14} />
                            <span>Travel Management</span>
                        </div>
                        <h1 style={styles.headerTitle}>Booking Management</h1>
                        <p style={styles.headerSub}>Overview of your travel packages and revenue</p>
                    </div>
                    <motion.button 
                        className="refresh-btn" 
                        style={styles.refreshBtn} 
                        onClick={fetchData}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FaSyncAlt /> Refresh Data
                    </motion.button>
                </motion.header>

                {/* Stats Overview */}
                <motion.section 
                    className="stats-grid" 
                    style={styles.statsGrid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {[
                        { icon: <FaUsers size={20} />, label: 'Total Bookings', value: stats.totalBookings, color: '#3b82f6', bg: '#eff6ff', trend: '+12%' },
                        { icon: <FaClock size={20} />, label: 'Pending', value: stats.pendingBookings, color: '#f59e0b', bg: '#fef3c7', trend: 'Awaiting' },
                        { icon: <FaCheckCircle size={20} />, label: 'Confirmed', value: stats.confirmedBookings, color: '#10b981', bg: '#d1fae5', trend: 'Approved' },
                        { icon: <FaDollarSign size={20} />, label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, color: '#8b5cf6', bg: '#ede9fe', trend: 'Earnings' }
                    ].map((stat, index) => (
                        <motion.div 
                            key={index}
                            className="stat-card" 
                            style={{...styles.statCard, borderLeft: `4px solid ${stat.color}`}}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                            whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
                        >
                            <div style={{...styles.statIcon, background: stat.bg, color: stat.color}}>
                                {stat.icon}
                            </div>
                            <div style={styles.statInfo}>
                                <p style={styles.statLabel}>{stat.label}</p>
                                <h3 style={styles.statValue}>{stat.value}</h3>
                                <span style={{...styles.statTrend, color: stat.color}}>
                                    {stat.trend}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </motion.section>

                {/* Filter Bar */}
                <motion.div 
                    style={styles.filterBar}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div style={styles.searchWrapper}>
                        <FaSearch style={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search by customer, email or package..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                    <div style={styles.filterGroup}>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="All">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="amount">Highest Amount</option>
                            <option value="status">By Status</option>
                        </select>
                    </div>
                </motion.div>

                {/* Bookings Table */}
                <motion.div 
                    className="main-content-card" 
                    style={styles.mainCard}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div style={styles.tableHeader}>
                        <h2 style={styles.tableTitle}>
                            <FaBox size={18} /> Recent Bookings
                        </h2>
                        <span style={styles.tableCount}>{filteredBookings.length} bookings</span>
                    </div>
                    <div className="table-responsive" style={styles.tableResponsive}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.theadRow}>
                                    <th style={styles.th}>Customer</th>
                                    <th style={styles.th}>Package</th>
                                    <th style={styles.th}>Travel Date</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Amount</th>
                                    <th style={{...styles.th, textAlign: 'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length > 0 ? filteredBookings.map((item, index) => {
                                    const statusConfig = getStatusBadge(item.status);
                                    return (
                                        <motion.tr 
                                            key={item._id}
                                            style={styles.tr}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.03 }}
                                            whileHover={{ backgroundColor: '#f8fafc' }}
                                        >
                                            <td style={styles.td}>
                                                <div style={styles.userCell}>
                                                    <div style={{...styles.avatar, background: `hsl(${index * 45}, 70%, 50%)`}}>
                                                        {item.customerName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <span style={styles.userName}>{item.customerName}</span>
                                                        <span style={styles.userEmail}>{item.customerEmail}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.packageName}>{item.packageName}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.dateCell}>
                                                    <FaCalendarAlt size={12} color="#94a3b8" />
                                                    <span>{new Date(item.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{...styles.statusBadge, background: statusConfig.bg, color: statusConfig.color}}>
                                                    {statusConfig.icon} {statusConfig.label}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.amount}>${item.totalAmount}</span>
                                            </td>
                                            <td style={{...styles.td, textAlign: 'right'}}>
                                                <div style={styles.actionGroup}>
                                                    {item.status === 'pending' && (
                                                        <motion.button 
                                                            className="btn-icon approve" 
                                                            style={{...styles.approveBtn, ...styles.iconBtn}}
                                                            onClick={() => handleQuickApprove(item._id)}
                                                            disabled={submitting}
                                                            title="Approve Now"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <FaCheckCircle size={14} />
                                                        </motion.button>
                                                    )}
                                                    <motion.button 
                                                        className="btn-secondary" 
                                                        style={{...styles.editBtn, ...styles.iconBtn}}
                                                        onClick={() => {
                                                            setSelectedBooking(item);
                                                            setStatusUpdate(item.status);
                                                            setAdminNotes(item.adminNotes || '');
                                                        }}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <FaEdit size={14} />
                                                    </motion.button>
                                                    <motion.button 
                                                        className="btn-icon delete" 
                                                        style={{...styles.deleteBtn, ...styles.iconBtn}}
                                                        onClick={() => handleDelete(item._id)}
                                                        disabled={submitting}
                                                        title="Delete Booking"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <FaTrash size={14} />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="6" style={styles.emptyState}>
                                            <div style={styles.emptyContent}>
                                                <FaBox size={40} color="#cbd5e1" />
                                                <p style={styles.emptyText}>No bookings found</p>
                                                <span style={styles.emptySubtext}>Try adjusting your search or filters</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>

            {/* Edit Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <motion.div 
                        className="modal-overlay" 
                        style={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedBooking(null)}
                    >
                        <motion.div 
                            className="modal-card" 
                            style={styles.modalCard}
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            transition={{ type: "spring", damping: 25 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={styles.modalHeader}>
                                <div>
                                    <div style={styles.modalBadge}>
                                        <FaEdit size={14} />
                                        <span>Edit Booking</span>
                                    </div>
                                    <h3 style={styles.modalTitle}>Update Booking Details</h3>
                                </div>
                                <motion.button 
                                    className="close-x" 
                                    style={styles.closeBtn} 
                                    onClick={() => setSelectedBooking(null)}
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    ✕
                                </motion.button>
                            </div>
                            
                            <form onSubmit={handleUpdate}>
                                <div style={styles.modalBody}>
                                    <div style={styles.infoRow}>
                                        <label style={styles.infoLabel}>Booking ID:</label>
                                        <span style={styles.infoValue}>#{selectedBooking._id.slice(-8).toUpperCase()}</span>
                                    </div>
                                    
                                    <div style={styles.infoRow}>
                                        <label style={styles.infoLabel}>Customer:</label>
                                        <span style={styles.infoValue}>{selectedBooking.customerName}</span>
                                    </div>
                                    
                                    <div style={styles.infoRow}>
                                        <label style={styles.infoLabel}>Package:</label>
                                        <span style={styles.infoValue}>{selectedBooking.packageName}</span>
                                    </div>
                                    
                                    <div style={styles.infoRow}>
                                        <label style={styles.infoLabel}>Amount:</label>
                                        <span style={styles.infoValue}>${selectedBooking.totalAmount}</span>
                                    </div>
                                    
                                    <div style={styles.inputGroup}>
                                        <label style={styles.modalLabel}>Current Status</label>
                                        <select 
                                            value={statusUpdate} 
                                            onChange={(e) => setStatusUpdate(e.target.value)}
                                            style={styles.modalSelect}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.modalLabel}>Admin Notes</label>
                                        <textarea 
                                            value={adminNotes} 
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Add notes..."
                                            rows="4"
                                            style={styles.modalTextarea}
                                        />
                                    </div>
                                </div>

                                <div style={styles.modalFooter}>
                                    <motion.button 
                                        type="button" 
                                        className="btn-link" 
                                        style={styles.cancelModalBtn} 
                                        onClick={() => setSelectedBooking(null)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Discard
                                    </motion.button>
                                    <motion.button 
                                        type="submit" 
                                        className="btn-primary" 
                                        style={styles.submitModalBtn} 
                                        disabled={submitting}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {submitting ? (
                                            <>
                                                <FaSpinner style={styles.spinnerIcon} className="spinner" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Update Booking'
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>
                {`
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeInScale {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.6; transform: scale(0.98); }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    
                    .stat-card {
                        transition: all 0.3s ease;
                    }
                    
                    .action-btn {
                        transition: all 0.2s ease;
                    }
                    .action-btn:hover {
                        transform: translateY(-2px);
                    }
                    
                    .status-badge {
                        transition: all 0.2s ease;
                    }
                    
                    input:focus, select:focus, textarea:focus {
                        outline: none;
                        border-color: #ff961a;
                        box-shadow: 0 0 0 3px rgba(255,150,26,0.1);
                    }

                    .spinner {
                        animation: spin 0.8s linear infinite;
                    }

                    ::-webkit-scrollbar {
                        width: 6px;
                    }
                    ::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 10px;
                    }
                    ::-webkit-scrollbar-thumb {
                        background: linear-gradient(135deg, #f9c349 0%, #ff961a 100%);
                        border-radius: 10px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                        background: #ff961a;
                    }

                    @media (max-width: 768px) {
                        .stat-card {
                            min-width: unset !important;
                        }
                        .table-responsive {
                            overflow-x: auto;
                        }
                    }
                `}
            </style>
        </div>
    );
};

const styles = {
    pageWrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '20px 30px',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
        borderRadius: '32px',
        overflow: 'hidden'
    },
    bgDecoration1: {
        position: 'absolute',
        top: '-100px',
        right: '-50px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,150,26,0.06) 0%, rgba(255,150,26,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
    },
    bgDecoration2: {
        position: 'absolute',
        bottom: '-80px',
        left: '-60px',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(255,150,26,0.04) 0%, rgba(255,150,26,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
    },
    bgDecoration3: {
        position: 'absolute',
        top: '50%',
        right: '10%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(255,150,26,0.03) 0%, rgba(255,150,26,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
    },
    dashboard: {
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
    },
    loaderContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        gap: '16px'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #ff961a',
        borderRadius: '50%'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '20px 0',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '10px'
    },
    headerBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: '#fff7ed',
        padding: '6px 16px',
        borderRadius: '40px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#ff961a',
        marginBottom: '16px'
    },
    headerTitle: {
        fontSize: '32px',
        fontWeight: '800',
        margin: 0,
        color: '#1e293b',
        letterSpacing: '-0.5px'
    },
    headerSub: {
        color: '#64748b',
        fontSize: '14px',
        marginTop: '8px'
    },
    refreshBtn: {
        backgroundColor: '#1e293b',
        color: '#fff',
        border: 'none',
        padding: '10px 24px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontSize: '14px'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
    },
    statCard: {
        background: '#fff',
        padding: '20px 24px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        border: '1px solid #e5e7eb',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    },
    statIcon: {
        width: '52px',
        height: '52px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0
    },
    statInfo: {
        flex: 1
    },
    statLabel: {
        fontSize: '12px',
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        margin: 0
    },
    statValue: {
        fontSize: '26px',
        fontWeight: '800',
        color: '#0f172a',
        margin: '4px 0 0 0',
        lineHeight: 1.2
    },
    statTrend: {
        fontSize: '11px',
        fontWeight: '500',
        marginTop: '4px',
        display: 'inline-block'
    },
    filterBar: {
        display: 'flex',
        gap: '16px',
        padding: '16px 0 24px',
        flexWrap: 'wrap',
        alignItems: 'center'
    },
    searchWrapper: {
        flex: 1,
        minWidth: '200px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#fff',
        padding: '0 16px',
        borderRadius: '14px',
        border: '2px solid #e2e8f0',
        transition: 'all 0.2s ease'
    },
    searchIcon: {
        color: '#94a3b8',
        fontSize: '14px'
    },
    searchInput: {
        flex: 1,
        padding: '10px 0',
        border: 'none',
        background: 'transparent',
        fontSize: '14px',
        outline: 'none',
        color: '#1e293b'
    },
    filterGroup: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
    },
    filterSelect: {
        padding: '10px 16px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        background: '#fff',
        fontSize: '13px',
        color: '#1e293b',
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.2s ease'
    },
    mainCard: {
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    },
    tableHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid #f1f5f9'
    },
    tableTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: 0
    },
    tableCount: {
        fontSize: '13px',
        color: '#94a3b8',
        fontWeight: '500'
    },
    tableResponsive: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '800px'
    },
    theadRow: {
        background: '#f8fafc',
        borderBottom: '2px solid #e2e8f0'
    },
    th: {
        padding: '14px 20px',
        textAlign: 'left',
        fontSize: '11px',
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    tr: {
        borderBottom: '1px solid #f1f5f9',
        transition: 'all 0.2s ease'
    },
    td: {
        padding: '14px 20px',
        fontSize: '14px',
        color: '#334155'
    },
    userCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '700',
        color: '#fff'
    },
    userName: {
        display: 'block',
        fontWeight: '600',
        color: '#0f172a',
        fontSize: '14px'
    },
    userEmail: {
        display: 'block',
        fontSize: '12px',
        color: '#94a3b8'
    },
    packageName: {
        fontWeight: '500',
        color: '#0f172a'
    },
    dateCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        color: '#475569'
    },
    statusBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    amount: {
        fontWeight: '700',
        color: '#0f172a'
    },
    actionGroup: {
        display: 'flex',
        gap: '6px',
        justifyContent: 'flex-end'
    },
    iconBtn: {
        padding: '8px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        background: 'transparent'
    },
    approveBtn: {
        background: '#d1fae5',
        color: '#10b981'
    },
    editBtn: {
        background: '#eff6ff',
        color: '#3b82f6'
    },
    deleteBtn: {
        background: '#fee2e2',
        color: '#ef4444'
    },
    emptyState: {
        padding: '60px 20px',
        textAlign: 'center'
    },
    emptyContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
    },
    emptyText: {
        fontSize: '16px',
        fontWeight: '500',
        color: '#64748b',
        margin: 0
    },
    emptySubtext: {
        fontSize: '13px',
        color: '#94a3b8'
    },
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modalCard: {
        background: '#fff',
        borderRadius: '24px',
        maxWidth: '520px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
    },
    modalHeader: {
        padding: '24px 28px 16px',
        borderBottom: '2px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    modalBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#fff7ed',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#ff961a',
        marginBottom: '12px'
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#0f172a',
        margin: 0
    },
    closeBtn: {
        border: 'none',
        background: '#f1f5f9',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        cursor: 'pointer',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        transition: 'all 0.2s ease'
    },
    modalBody: {
        padding: '24px 28px',
        overflowY: 'auto'
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #f1f5f9'
    },
    infoLabel: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#64748b'
    },
    infoValue: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#0f172a'
    },
    inputGroup: {
        marginTop: '16px'
    },
    modalLabel: {
        display: 'block',
        fontSize: '12px',
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '6px'
    },
    modalSelect: {
        width: '100%',
        padding: '12px 14px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s ease',
        background: '#f8fafc',
        color: '#0f172a'
    },
    modalTextarea: {
        width: '100%',
        padding: '12px 14px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s ease',
        background: '#f8fafc',
        fontFamily: 'inherit',
        resize: 'vertical',
        minHeight: '80px'
    },
    modalFooter: {
        padding: '20px 28px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
    },
    cancelModalBtn: {
        padding: '10px 24px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        background: '#fff',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: '#64748b'
    },
    submitModalBtn: {
        padding: '10px 24px',
        borderRadius: '12px',
        border: 'none',
        background: '#1e293b',
        color: '#fff',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    spinnerIcon: {
        marginRight: '8px'
    }
};

export default AdminPackage;