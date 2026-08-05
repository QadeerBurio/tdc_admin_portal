import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  XCircle, 
  Users, 
  Plane, 
  Hotel, 
  Package, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TravelerBookings = () => {
  const { user, token } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [cancellingId, setCancellingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://the-deft-crew-production.up.railway.app/api/traveler/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    setCancellingId(bookingId);
    try {
      await axios.put(`https://the-deft-crew-production.up.railway.app/api/traveler/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (error) {
      alert('Failed to cancel booking: ' + (error.response?.data?.message || error.message));
    } finally {
      setCancellingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredBookings = selectedStatus === 'All' 
    ? bookings 
    : bookings.filter(b => b.status === selectedStatus.toLowerCase());

  const statusColors = {
    pending: { bg: '#fef3c7', color: '#d97706', icon: <Clock size={14} /> },
    confirmed: { bg: '#d1fae5', color: '#059669', icon: <CheckCircle size={14} /> },
    cancelled: { bg: '#fee2e2', color: '#dc2626', icon: <XCircle size={14} /> },
    completed: { bg: '#dbeafe', color: '#2563eb', icon: <CheckCircle size={14} /> }
  };

  const statusStats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={styles.spinner}
        />
        <p style={styles.loadingText}>Loading your bookings...</p>
        <div style={styles.loadingBar}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={styles.loadingProgress}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Background Decorations */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>
      <div style={styles.bgDecoration3}></div>

      <div style={styles.container}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.header}
        >
          <div style={styles.headerContent}>
            <div style={styles.headerIconWrapper}>
              <Plane size={isMobile ? 20 : 24} color="#ff961a" />
            </div>
            <div>
              <h2 style={isMobile ? styles.mobileTitle : styles.title}>My Bookings</h2>
              <p style={isMobile ? styles.mobileSubtitle : styles.subtitle}>
                {bookings.length} bookings • {statusStats.pending} pending
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            style={styles.refreshBtn}
            onClick={fetchBookings}
          >
            <Clock size={isMobile ? 16 : 18} />
            {!isMobile && "Refresh"}
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            ...styles.statsGrid,
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
            gap: isMobile ? "8px" : "12px",
          }}
        >
          <div style={styles.statCard}>
            <div style={styles.statValue}>{statusStats.total}</div>
            <div style={styles.statLabel}>Total</div>
          </div>
          <div style={{...styles.statCard, background: '#fef3c7'}}>
            <div style={{...styles.statValue, color: '#d97706'}}>{statusStats.pending}</div>
            <div style={styles.statLabel}>Pending</div>
          </div>
          <div style={{...styles.statCard, background: '#d1fae5'}}>
            <div style={{...styles.statValue, color: '#059669'}}>{statusStats.confirmed}</div>
            <div style={styles.statLabel}>Confirmed</div>
          </div>
          <div style={{...styles.statCard, background: '#dbeafe'}}>
            <div style={{...styles.statValue, color: '#2563eb'}}>{statusStats.completed}</div>
            <div style={styles.statLabel}>Completed</div>
          </div>
          <div style={{...styles.statCard, background: '#fee2e2'}}>
            <div style={{...styles.statValue, color: '#dc2626'}}>{statusStats.cancelled}</div>
            <div style={styles.statLabel}>Cancelled</div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={styles.filterSection}
        >
          {isMobile ? (
            <>
              <button 
                style={styles.mobileFilterToggle}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <span>Filter: {selectedStatus}</span>
                {isFilterOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={styles.mobileFilterDropdown}
                  >
                    {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(status => (
                      <button
                        key={status}
                        style={{
                          ...styles.mobileFilterOption,
                          backgroundColor: selectedStatus === status ? '#1e293b' : 'transparent',
                          color: selectedStatus === status ? '#fff' : '#64748b',
                        }}
                        onClick={() => { setSelectedStatus(status); setIsFilterOpen(false); }}
                      >
                        {status}
                        {selectedStatus === status && <CheckCircle size={16} color="#fff" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div style={styles.filterGroup}>
              {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(status => (
                <button
                  key={status}
                  style={{
                    ...styles.filterBtn,
                    backgroundColor: selectedStatus === status ? '#1e293b' : '#f1f5f9',
                    color: selectedStatus === status ? '#fff' : '#64748b',
                  }}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status}
                  {status !== 'All' && (
                    <span style={styles.filterCount}>
                      {statusStats[status.toLowerCase()]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.emptyState}
          >
            <Package size={isMobile ? 48 : 64} color="#cbd5e1" />
            <h3 style={styles.emptyTitle}>No bookings found</h3>
            <p style={styles.emptySubtext}>
              {selectedStatus === 'All' 
                ? 'Start exploring packages to make your first booking!' 
                : `No ${selectedStatus.toLowerCase()} bookings found`}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={styles.bookingList}
          >
            {filteredBookings.map((booking, index) => {
              const statusConfig = statusColors[booking.status] || statusColors.pending;
              const isExpanded = expandedId === booking._id;
              
              return (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  style={styles.bookingCard}
                >
                  {/* Mobile Header */}
                  {isMobile && (
                    <div style={styles.mobileCardHeader}>
                      <div style={styles.mobileCardTitle}>
                        <h3 style={styles.mobileCardName}>{booking.packageName}</h3>
                        <span style={{
                          ...styles.statusBadge,
                          background: statusConfig.bg,
                          color: statusConfig.color,
                        }}>
                          {statusConfig.icon} {booking.status}
                        </span>
                      </div>
                      <button
                        style={styles.mobileExpandBtn}
                        onClick={() => toggleExpand(booking._id)}
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  )}

                  {/* Desktop View / Expanded Mobile View */}
                  <div style={{
                    ...styles.bookingContent,
                    display: isMobile ? (isExpanded ? 'flex' : 'none') : 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '12px' : '16px',
                  }}>
                    {/* Booking Image */}
                    {booking.image && (
                      <div style={{
                        ...styles.bookingImage,
                        width: isMobile ? '100%' : '120px',
                        height: isMobile ? '140px' : '120px',
                      }}>
                        <img 
                          src={booking.image} 
                          alt={booking.packageName}
                          style={styles.bookingImg}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200';
                          }}
                        />
                      </div>
                    )}

                    {/* Booking Info */}
                    <div style={{
                      ...styles.bookingInfo,
                      flex: 1,
                      width: isMobile ? '100%' : 'auto',
                    }}>
                      {!isMobile && (
                        <div style={styles.desktopCardHeader}>
                          <h3 style={styles.bookingTitle}>{booking.packageName}</h3>
                          <span style={{
                            ...styles.statusBadge,
                            background: statusConfig.bg,
                            color: statusConfig.color,
                          }}>
                            {statusConfig.icon} {booking.status}
                          </span>
                        </div>
                      )}

                      <div style={isMobile ? styles.mobileDetailsGrid : styles.bookingDetails}>
                        <div style={styles.bookingDetail}>
                          <Calendar size={isMobile ? 14 : 16} color="#64748b" />
                          <span style={{ fontSize: isMobile ? '13px' : '14px' }}>
                            {new Date(booking.travelDate).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div style={styles.bookingDetail}>
                          <Users size={isMobile ? 14 : 16} color="#64748b" />
                          <span style={{ fontSize: isMobile ? '13px' : '14px' }}>
                            {booking.numberOfTravelers || 1} traveler(s)
                          </span>
                        </div>
                        <div style={styles.bookingDetail}>
                          <DollarSign size={isMobile ? 14 : 16} color="#64748b" />
                          <span style={{ 
                            fontSize: isMobile ? '13px' : '14px',
                            fontWeight: 700,
                            color: '#1e293b'
                          }}>
                            ${booking.totalAmount?.toLocaleString()}
                          </span>
                        </div>
                        {booking.location && (
                          <div style={styles.bookingDetail}>
                            <MapPin size={isMobile ? 14 : 16} color="#64748b" />
                            <span style={{ fontSize: isMobile ? '13px' : '14px' }}>
                              {booking.location}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Booking ID and Date */}
                      <div style={styles.bookingMeta}>
                        <span style={styles.bookingId}>
                          Booking ID: #{booking._id?.slice(-8).toUpperCase()}
                        </span>
                        <span style={styles.bookingDate}>
                          Booked on {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {booking.status === 'pending' && (
                      <div style={{
                        ...styles.bookingActions,
                        width: isMobile ? '100%' : 'auto',
                        marginTop: isMobile ? '12px' : '0',
                      }}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            ...styles.cancelBtn,
                            width: isMobile ? '100%' : 'auto',
                            padding: isMobile ? '12px' : '8px 16px',
                            fontSize: isMobile ? '14px' : '13px',
                            justifyContent: 'center',
                          }}
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={cancellingId === booking._id}
                        >
                          <XCircle size={isMobile ? 16 : 14} />
                          {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                        </motion.button>
                      </div>
                    )}

                    {booking.status === 'confirmed' && (
                      <div style={{
                        ...styles.bookingActions,
                        width: isMobile ? '100%' : 'auto',
                        marginTop: isMobile ? '12px' : '0',
                      }}>
                        <div style={styles.confirmedBadge}>
                          <CheckCircle size={isMobile ? 16 : 14} color="#059669" />
                          <span style={{ fontSize: isMobile ? '13px' : '14px' }}>Confirmed</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .spinner {
            animation: spin 1s linear infinite;
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
              padding: 10px 12px !important;
            }
            .stat-value {
              font-size: 16px !important;
            }
            .stat-label {
              font-size: 9px !important;
            }
            .booking-card {
              padding: 12px !important;
              border-radius: 12px !important;
            }
            .booking-title {
              font-size: 15px !important;
            }
            .booking-detail {
              font-size: 12px !important;
            }
            .status-badge {
              font-size: 10px !important;
              padding: 3px 10px !important;
            }
            .filter-btn {
              font-size: 11px !important;
              padding: 4px 10px !important;
            }
          }

          @media (max-width: 480px) {
            .stat-card {
              padding: 8px 10px !important;
            }
            .stat-value {
              font-size: 14px !important;
            }
            .stat-label {
              font-size: 8px !important;
            }
            .mobile-title {
              font-size: 18px !important;
            }
            .mobile-subtitle {
              font-size: 12px !important;
            }
            .booking-card {
              padding: 10px !important;
              border-radius: 10px !important;
            }
            .booking-title {
              font-size: 14px !important;
            }
            .booking-detail {
              font-size: 11px !important;
            }
            .status-badge {
              font-size: 9px !important;
              padding: 2px 8px !important;
            }
            .mobile-card-name {
              font-size: 14px !important;
            }
            .cancel-btn {
              font-size: 13px !important;
              padding: 10px !important;
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
  container: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: 'blur(20px)',
    borderRadius: "28px",
    padding: "32px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    maxWidth: "1400px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #ff961a',
    borderRadius: '50%',
  },
  loadingText: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },
  loadingBar: {
    width: '180px',
    height: '4px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    background: 'linear-gradient(135deg, #f9c349 0%, #ff961a 100%)',
    borderRadius: '4px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  headerIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: '#fff7ed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #fef3c7',
  },
  title: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  mobileTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '2px',
  },
  mobileSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  refreshBtn: {
    background: '#fff',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '10px 18px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  statsGrid: {
    display: 'grid',
    marginBottom: '20px',
  },
  statCard: {
    background: '#fff',
    padding: '14px 18px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1e293b',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
    marginTop: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  filterSection: {
    marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: 'none',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  filterCount: {
    background: 'rgba(255,255,255,0.5)',
    padding: '0 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: '700',
  },
  mobileFilterToggle: {
    width: '100%',
    padding: '10px 16px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    cursor: 'pointer',
  },
  mobileFilterDropdown: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '8px',
    marginTop: '8px',
    overflow: 'hidden',
  },
  mobileFilterOption: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  bookingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  bookingCard: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '18px 20px',
    transition: 'all 0.2s ease',
  },
  desktopCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  bookingTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    textTransform: 'capitalize',
  },
  bookingContent: {
    display: 'flex',
    gap: '16px',
  },
  bookingImage: {
    borderRadius: '12px',
    overflow: 'hidden',
    flexShrink: 0,
    background: '#f1f5f9',
  },
  bookingImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingDetails: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  bookingDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#475569',
  },
  bookingMeta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    fontSize: '11px',
    color: '#94a3b8',
  },
  bookingId: {
    fontFamily: 'monospace',
  },
  bookingDate: {
    color: '#94a3b8',
  },
  bookingActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: '10px',
    border: '2px solid #ef4444',
    background: '#fff',
    color: '#ef4444',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  confirmedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '10px',
    background: '#d1fae5',
    color: '#059669',
    fontWeight: '600',
    fontSize: '13px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
  // Mobile specific styles
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '8px',
  },
  mobileCardTitle: {
    flex: 1,
  },
  mobileCardName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 6px 0',
  },
  mobileExpandBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  mobileDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    marginBottom: '6px',
  },
};

export default TravelerBookings;