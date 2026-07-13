import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { AuthContext } from "../context/AuthContext";
import { 
  CheckCircle, XCircle, Package, Truck, Check, Download, 
  Clock, Users, Wallet, CreditCard, Shield, Search, 
  Filter, ChevronDown, ChevronUp, Eye, RefreshCw,
  Printer, MapPin, Phone, Mail, User, Award,
  TrendingUp, BarChart3, Sparkles, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CardManager = () => {
  const { token } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('payments'); 
  const [logisticsFilter, setLogisticsFilter] = useState('Printing');
  const [data, setData] = useState([]); 
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [stats, setStats] = useState({ 
    printing: 0, shipped: 0, delivered: 0, pending: 0, 
    approvedTotal: 0, totalRevenue: 0 
  });

  const API_BASE = "http://localhost:5000/api/admin";
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/card-stats`, config);
      setStats(res.data);
    } catch (err) { console.error("Stats error", err); }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = activeTab === 'payments' 
        ? `${API_BASE}/pending-payments` 
        : `${API_BASE}/logistics/${logisticsFilter}`;
      
      const res = await axios.get(endpoint, config);
      setData(res.data);
      fetchStats(); 
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, [activeTab, logisticsFilter]);

  useEffect(() => {
    loadData();
    setSelectedIds([]); 
  }, [loadData]);

  const handlePaymentAction = async (userId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this payment?`)) return;
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/${action}-payment/${userId}`, {}, config);
      loadData();
    } catch (err) { alert("Action failed."); }
    finally { setLoading(false); }
  };

  const handleBulkUpdate = async (newStatus) => {
    if (selectedIds.length === 0) return alert("Select members first.");
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/bulk-update-status`, { userIds: selectedIds, newStatus: newStatus }, config);
      setSelectedIds([]);
      loadData();
    } catch (err) { alert("Update failed"); }
    finally { setLoading(false); }
  };

  const exportToCSV = () => {
    if (data.length === 0) return alert("No data to export");
    const header = "Member Name,Roll No,Phone,City,Shipping Address,Status\n";
    const rows = data.map(u => 
      `"${u.name}","${u.rollNo}","${u.shippingDetails?.phone || 'N/A'}","${u.shippingDetails?.city || 'N/A'}","${u.shippingDetails?.address || 'N/A'}","${u.cardStatus || 'N/A'}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `TDC_Logistics_${logisticsFilter}_${new Date().toLocaleDateString()}.csv`);
  };

  const openUserDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const closeUserDetail = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  const filteredData = data.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.pageWrapper}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>
      <div style={styles.bgDecoration3}></div>

      <div style={styles.maxWidthContainer}>
        {/* HEADER SECTION */}
        <motion.header 
          style={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div style={styles.headerBadge}>
              <CreditCard size={14} />
              <span>Card Management</span>
            </div>
            <h1 style={styles.title}>Card Command Center</h1>
            <p style={styles.subtitle}>Streamline verification and physical card distribution</p>
          </div>
          
          <motion.div 
            style={styles.statsRow}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <StatCard label="Total Issued" value={stats.approvedTotal} icon={<Users size={18}/>} color="#10b981" bg="#d1fae5" />
            <StatCard label="Net Revenue" value={`₨ ${stats.totalRevenue.toLocaleString()}`} icon={<Wallet size={18}/>} color="#3b82f6" bg="#dbeafe" />
            <StatCard label="Awaiting" value={stats.pending} icon={<Clock size={18}/>} color="#f59e0b" bg="#fef3c7" />
          </motion.div>
        </motion.header>

        {/* MAIN NAVIGATION */}
        <motion.div 
          style={styles.tabContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button 
            onClick={() => setActiveTab('payments')} 
            style={activeTab === 'payments' ? styles.activeTab : styles.tab}
          >
            <Shield size={16} /> Verification Queue
            {stats.pending > 0 && <span style={styles.tabBadge}>{stats.pending}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('logistics')} 
            style={activeTab === 'logistics' ? styles.activeTab : styles.tab}
          >
            <Package size={16} /> Logistics Pipeline
          </button>
        </motion.div>

        {/* Loading Bar */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              style={styles.loaderBar}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              exit={{ width: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <motion.div 
          style={styles.searchBar}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, roll number or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button style={styles.clearSearch} onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </motion.div>

        {/* Content */}
        {activeTab === 'payments' ? (
          <motion.div 
            style={styles.gridContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div style={styles.gridStyle}>
              {filteredData.map((req, index) => (
                <motion.div 
                  key={req._id} 
                  style={styles.cardItem}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -8, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.cardUser}>
                      <div style={styles.cardAvatar}>
                        {req.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={styles.cardName}>{req.name}</h3>
                        <span style={styles.rollBadge}>🎓 {req.rollNo}</span>
                      </div>
                    </div>
                    <button 
                      style={styles.viewBtn}
                      onClick={() => openUserDetail(req)}
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                  
                  <div style={styles.imageContainer} onClick={() => window.open(req.paymentReceipt, '_blank')}>
                    <img src={req.paymentReceipt} alt="Receipt" style={styles.receiptImg} />
                    <div style={styles.imgOverlay}>
                      <Eye size={14} /> View Receipt
                    </div>
                  </div>
                  
                  <div style={styles.cardFooter}>
                    <div style={styles.cardInfo}>
                      <span style={styles.cardInfoLabel}>Amount</span>
                      <span style={styles.cardInfoValue}>₨ {req.amount || 500}</span>
                    </div>
                    <div style={styles.cardInfo}>
                      <span style={styles.cardInfoLabel}>Date</span>
                      <span style={styles.cardInfoValue}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={styles.actionRow}>
                    <motion.button 
                      onClick={() => handlePaymentAction(req._id, 'approve')} 
                      style={styles.approveBtn}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CheckCircle size={16} /> Approve
                    </motion.button>
                    <motion.button 
                      onClick={() => handlePaymentAction(req._id, 'reject')} 
                      style={styles.rejectBtn}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <XCircle size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              {filteredData.length === 0 && !loading && <EmptyState message="The queue is empty. Great job!" />}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            style={styles.tableWrapper}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div style={styles.tableHeaderActions}>
              <div style={styles.subFilterRow}>
                {[
                  { id: 'Printing', icon: <Printer size={14}/> },
                  { id: 'Shipped', icon: <Truck size={14}/> },
                  { id: 'Delivered', icon: <Check size={14}/> }
                ].map(s => (
                  <motion.button 
                    key={s.id} 
                    onClick={() => setLogisticsFilter(s.id)} 
                    style={logisticsFilter === s.id ? styles.subTabActive : styles.subTab}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {s.icon} {s.id} <span style={styles.countBadge}>{stats[s.id.toLowerCase()] || 0}</span>
                  </motion.button>
                ))}
              </div>

              <div style={styles.actionButtons}>
                <motion.button 
                  onClick={exportToCSV} 
                  style={styles.btnExport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={16}/> CSV
                </motion.button>
                {logisticsFilter === 'Printing' && (
                  <motion.button 
                    onClick={() => handleBulkUpdate('Shipped')} 
                    style={styles.shipBtn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Truck size={16} /> Dispatch Selected
                  </motion.button>
                )}
                {logisticsFilter === 'Shipped' && (
                  <motion.button 
                    onClick={() => handleBulkUpdate('Delivered')} 
                    style={styles.deliveredBtn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check size={16} /> Mark Delivered
                  </motion.button>
                )}
              </div>
            </div>

            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? data.map(o=>o._id) : [])} checked={selectedIds.length === data.length && data.length > 0} /></th>
                    <th style={styles.th}>Member Details</th>
                    <th style={styles.th}>Contact</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Status</th>
                    <th style={{...styles.th, textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((order, index) => (
                    <motion.tr 
                      key={order._id} 
                      style={styles.tr}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      whileHover={{ backgroundColor: '#f8fafc' }}
                    >
                      <td style={styles.td}><input type="checkbox" checked={selectedIds.includes(order._id)} onChange={() => setSelectedIds(prev => prev.includes(order._id) ? prev.filter(id => id !== order._id) : [...prev, order._id])} /></td>
                      <td style={styles.td}>
                        <div style={styles.memberCell}>
                          <div style={styles.memberAvatar}>
                            {order.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={styles.memberName}>{order.name}</div>
                            <div style={styles.memberRoll}>{order.rollNo}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.contactCell}>
                          <Phone size={12} color="#94a3b8" />
                          <span>{order.shippingDetails?.phone || 'N/A'}</span>
                        </div>
                        <div style={styles.contactCell}>
                          <Mail size={12} color="#94a3b8" />
                          <span>{order.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.locationCell}>
                          <MapPin size={12} color="#94a3b8" />
                          <span>{order.shippingDetails?.city || 'N/A'}</span>
                        </div>
                        <div style={styles.locationAddress}>
                          {order.shippingDetails?.address || 'No address'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.statusBadge, backgroundColor: getStatusBg(order.cardStatus), color: getStatusColor(order.cardStatus)}}>
                          {order.cardStatus}
                        </span>
                      </td>
                      <td style={{...styles.td, textAlign: 'center'}}>
                        <motion.button 
                          style={styles.viewBtnSmall}
                          onClick={() => openUserDetail(order)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye size={14} />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length === 0 && !loading && <EmptyState message="No records found in this stage." />}
          </motion.div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedUser && (
          <motion.div 
            style={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeUserDetail}
          >
            <motion.div 
              style={styles.modalContent}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.modalAvatar}>
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>{selectedUser.name}</h2>
                    <p style={styles.modalSubtitle}>Roll No: {selectedUser.rollNo}</p>
                  </div>
                </div>
                <motion.button 
                  style={styles.modalClose}
                  onClick={closeUserDetail}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.modalGrid}>
                  <div style={styles.modalSection}>
                    <h4 style={styles.modalSectionTitle}>
                      <User size={14} /> Personal Information
                    </h4>
                    <div style={styles.modalDetail}>
                      <span style={styles.modalLabel}>Full Name</span>
                      <span style={styles.modalValue}>{selectedUser.name}</span>
                    </div>
                    <div style={styles.modalDetail}>
                      <span style={styles.modalLabel}>Roll Number</span>
                      <span style={styles.modalValue}>{selectedUser.rollNo}</span>
                    </div>
                    <div style={styles.modalDetail}>
                      <span style={styles.modalLabel}>Email</span>
                      <span style={styles.modalValue}>{selectedUser.email || 'N/A'}</span>
                    </div>
                    <div style={styles.modalDetail}>
                      <span style={styles.modalLabel}>Phone</span>
                      <span style={styles.modalValue}>{selectedUser.shippingDetails?.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={styles.modalSection}>
                    <h4 style={styles.modalSectionTitle}>
                      <MapPin size={14} /> Shipping Details
                    </h4>
                    <div style={styles.modalDetail}>
                      <span style={styles.modalLabel}>City</span>
                      <span style={styles.modalValue}>{selectedUser.shippingDetails?.city || 'N/A'}</span>
                    </div>
                    <div style={styles.modalDetail}>
                      <span style={styles.modalLabel}>Address</span>
                      <span style={styles.modalValue}>{selectedUser.shippingDetails?.address || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={styles.modalSection}>
                    <h4 style={styles.modalSectionTitle}>
                      <CreditCard size={14} /> Card Status
                    </h4>
                    <div style={styles.modalDetail}>
                      <span style={styles.modalLabel}>Current Status</span>
                      <span style={{
                        ...styles.modalStatusBadge,
                        backgroundColor: getStatusBg(selectedUser.cardStatus),
                        color: getStatusColor(selectedUser.cardStatus)
                      }}>
                        {selectedUser.cardStatus || 'Pending'}
                      </span>
                    </div>
                    <div style={styles.modalDetail}>
                      <span style={styles.modalLabel}>Payment Status</span>
                      <span style={{
                        ...styles.modalPaymentBadge,
                        backgroundColor: selectedUser.paymentStatus === 'Verified' ? '#d1fae5' : '#fef3c7',
                        color: selectedUser.paymentStatus === 'Verified' ? '#10b981' : '#f59e0b'
                      }}>
                        {selectedUser.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedUser.paymentReceipt && (
                  <div style={styles.modalReceipt}>
                    <h4 style={styles.modalSectionTitle}>
                      <Eye size={14} /> Payment Receipt
                    </h4>
                    <img 
                      src={selectedUser.paymentReceipt} 
                      alt="Receipt" 
                      style={styles.modalReceiptImg} 
                      onClick={() => window.open(selectedUser.paymentReceipt, '_blank')}
                    />
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <motion.button 
                  style={styles.modalCloseBtn}
                  onClick={closeUserDetail}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
                {activeTab === 'payments' && selectedUser.paymentStatus !== 'Verified' && (
                  <motion.button 
                    style={styles.modalApproveBtn}
                    onClick={() => {
                      handlePaymentAction(selectedUser._id, 'approve');
                      closeUserDetail();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircle size={16} /> Approve Payment
                  </motion.button>
                )}
              </div>
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
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.98); }
          }

          .stat-card {
            transition: all 0.3s ease;
          }
          .stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
          }

          .card-item {
            transition: all 0.3s ease;
          }

          .action-btn {
            transition: all 0.2s ease;
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
            .header {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .statsRow {
              flex-wrap: wrap !important;
              justify-content: center !important;
            }
            .gridStyle {
              grid-template-columns: 1fr !important;
            }
            .tableHeaderActions {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 12px !important;
            }
            .subFilterRow {
              flex-wrap: wrap !important;
              justify-content: center !important;
            }
            .actionButtons {
              flex-wrap: wrap !important;
              justify-content: center !important;
            }
            .modalContent {
              width: 95% !important;
              max-height: 95vh !important;
            }
          }
        `}
      </style>
    </div>
  );
};

// --- COMPONENTS ---
const StatCard = ({ label, value, icon, color, bg }) => (
  <motion.div 
    className="stat-card" 
    style={styles.statBox}
    whileHover={{ y: -3, boxShadow: "0 8px 25px rgba(0,0,0,0.08)" }}
  >
    <div style={{...styles.statIconBox, background: bg, color: color}}>
      {icon}
    </div>
    <div>
      <div style={styles.statLabel}>{label}</div>
      <div style={{...styles.statValue, color: color}}>{value}</div>
    </div>
  </motion.div>
);

const EmptyState = ({ message }) => (
  <motion.div 
    style={styles.emptyContainer}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <div style={styles.emptyIcon}>🌟</div>
    <div style={styles.emptyText}>{message}</div>
    <p style={styles.emptySubtext}>Everything is up to date</p>
  </motion.div>
);

// --- STYLES ---
const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '25px 35px',
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
    background: 'radial-gradient(circle, rgba(8,99,79,0.06) 0%, rgba(8,99,79,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  bgDecoration2: {
    position: 'absolute',
    bottom: '-80px',
    left: '-60px',
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(8,99,79,0.04) 0%, rgba(8,99,79,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  bgDecoration3: {
    position: 'absolute',
    top: '50%',
    right: '10%',
    width: '150px',
    height: '150px',
    background: 'radial-gradient(circle, rgba(8,99,79,0.03) 0%, rgba(8,99,79,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  maxWidthContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ecfdf5',
    padding: '6px 16px',
    borderRadius: '40px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#10b981',
    marginBottom: '12px'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: '#64748b',
    fontSize: '14px'
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  statBox: {
    backgroundColor: '#fff',
    padding: '14px 20px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '140px',
    transition: 'all 0.3s ease'
  },
  statIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px'
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '800'
  },
  tabContainer: {
    display: 'flex',
    gap: '30px',
    borderBottom: '2px solid #e2e8f0',
    marginBottom: '24px'
  },
  tab: {
    padding: '12px 0',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: '0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative'
  },
  activeTab: {
    padding: '12px 0',
    background: 'none',
    border: 'none',
    color: '#08634f',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '3px solid #08634f',
    position: 'relative'
  },
  tabBadge: {
    background: '#ef4444',
    color: '#fff',
    fontSize: '10px',
    padding: '1px 8px',
    borderRadius: '12px',
    fontWeight: '700',
    marginLeft: '4px'
  },
  loaderBar: {
    height: '3px',
    width: '100%',
    background: 'linear-gradient(90deg, #08634f, #10b981)',
    borderRadius: '2px',
    marginBottom: '20px'
  },
  searchBar: {
    position: 'relative',
    maxWidth: '400px',
    marginBottom: '24px'
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8'
  },
  searchInput: {
    width: '100%',
    padding: '10px 40px 10px 40px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    transition: 'all 0.2s ease',
    color: '#0f172a'
  },
  clearSearch: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '14px'
  },
  gridContainer: {
    padding: '4px 0'
  },
  gridStyle: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  cardUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cardAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #08634f 0%, #10b981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff'
  },
  cardName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a'
  },
  rollBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#08634f',
    background: '#ecfdf5',
    padding: '2px 10px',
    borderRadius: '12px',
    display: 'inline-block'
  },
  viewBtn: {
    padding: '6px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    color: '#64748b',
    transition: 'all 0.2s ease'
  },
  imageContainer: {
    height: '150px',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    border: '1px solid #f1f5f9',
    marginBottom: '16px'
  },
  receiptImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  imgOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: '8px',
    background: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  cardFooter: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '12px'
  },
  cardInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  cardInfoLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  cardInfoValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a'
  },
  actionRow: {
    display: 'flex',
    gap: '8px'
  },
  approveBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    background: 'linear-gradient(135deg, #08634f 0%, #10b981 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  rejectBtn: {
    padding: '10px 14px',
    background: '#fff',
    color: '#ef4444',
    border: '1px solid #fee2e2',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tableWrapper: {
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
  },
  tableHeaderActions: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '12px'
  },
  subFilterRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  subTab: {
    padding: '8px 16px',
    borderRadius: '10px',
    background: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  subTabActive: {
    padding: '8px 16px',
    borderRadius: '10px',
    background: '#08634f',
    color: '#fff',
    border: '1px solid #08634f',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  countBadge: {
    background: 'rgba(255,255,255,0.2)',
    padding: '1px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '700'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  btnExport: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
    color: '#475569'
  },
  shipBtn: {
    padding: '8px 16px',
    background: '#08634f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  deliveredBtn: {
    padding: '8px 16px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  tableResponsive: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '700px'
  },
  th: {
    padding: '12px 16px',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '10px',
    fontWeight: '700',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e2e8f0'
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '13px',
    color: '#334155'
  },
  tr: {
    transition: 'all 0.2s ease'
  },
  memberCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  memberAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #08634f 0%, #10b981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff'
  },
  memberName: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: '13px'
  },
  memberRoll: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  contactCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#475569',
    marginBottom: '2px'
  },
  locationCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#475569',
    marginBottom: '2px'
  },
  locationAddress: {
    fontSize: '11px',
    color: '#94a3b8',
    marginLeft: '20px'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-block'
  },
  viewBtnSmall: {
    padding: '6px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    color: '#64748b',
    transition: 'all 0.2s ease'
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: '20px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  emptyText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: '18px',
    marginBottom: '4px'
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: '13px'
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    background: '#fff',
    borderRadius: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  modalAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #08634f 0%, #10b981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  modalClose: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    transition: 'all 0.2s ease'
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px'
  },
  modalSection: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #f1f5f9'
  },
  modalSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 10px 0',
    paddingBottom: '8px',
    borderBottom: '1px solid #f1f5f9'
  },
  modalDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '12px'
  },
  modalLabel: {
    color: '#64748b'
  },
  modalValue: {
    color: '#0f172a',
    fontWeight: '500'
  },
  modalStatusBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600'
  },
  modalPaymentBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600'
  },
  modalReceipt: {
    marginTop: '8px'
  },
  modalReceiptImg: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '12px',
    cursor: 'pointer',
    border: '1px solid #f1f5f9'
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  modalCloseBtn: {
    padding: '8px 24px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    background: '#fff',
    color: '#475569',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  modalApproveBtn: {
    padding: '8px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #08634f 0%, #10b981 100%)',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  }
};

// Helper functions
const getStatusBg = (s) => {
  if (s === 'Printing') return '#fef3c7';
  if (s === 'Shipped') return '#dbeafe';
  if (s === 'Delivered') return '#d1fae5';
  return '#f1f5f9';
};

const getStatusColor = (s) => {
  if (s === 'Printing') return '#b45309';
  if (s === 'Shipped') return '#4338ca';
  if (s === 'Delivered') return '#047857';
  return '#64748b';
};

export default CardManager;