import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { AuthContext } from "../context/AuthContext";
import { CheckCircle, XCircle, Package, Truck, Check, Download, Clock, Users, Wallet } from 'lucide-react';

const CardManager = () => {
  const { token } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('payments'); 
  const [logisticsFilter, setLogisticsFilter] = useState('Printing');
  const [data, setData] = useState([]); 
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({ 
    printing: 0, shipped: 0, delivered: 0, pending: 0, 
    approvedTotal: 0, totalRevenue: 0 
  });

  const API_BASE = "https://the-deft-crew-production.up.railway.app/api/admin";
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
      setLoading(false);
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

  return (
    <div style={wrapperStyle}>
      <div style={maxWidthContainer}>
        {/* HEADER SECTION */}
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Card Command Center</h1>
            <p style={subtitleStyle}>Streamline verification and physical card distribution</p>
          </div>
          
          <div style={statsRow}>
            <StatCard label="Total Issued" value={stats.approvedTotal} icon={<Users size={18}/>} color="#08634f" />
            <StatCard label="Net Revenue" value={`₨ ${stats.totalRevenue.toLocaleString()}`} icon={<Wallet size={18}/>} color="#08634f" />
            <StatCard label="Awaiting" value={stats.pending} icon={<Clock size={18}/>} color="#b45309" />
          </div>
        </header>

        {/* MAIN NAVIGATION */}
        <div style={tabContainerStyle}>
          <button 
            onClick={() => setActiveTab('payments')} 
            style={activeTab === 'payments' ? activeTabStyle : tabStyle}
          >
            Verification Queue
          </button>
          <button 
            onClick={() => setActiveTab('logistics')} 
            style={activeTab === 'logistics' ? activeTabStyle : tabStyle}
          >
            Logistics Pipeline
          </button>
        </div>

        {loading && <div style={loaderBar}></div>}

        {activeTab === 'payments' ? (
          <div style={gridStyle}>
            {data.map(req => (
              <div key={req._id} style={cardItemStyle}>
                <div style={cardHeaderStyle}>
                  <h3 style={cardName}>{req.name}</h3>
                  <span style={rollBadge}>{req.rollNo}</span>
                </div>
                <div style={imageContainerStyle} onClick={() => window.open(req.paymentReceipt, '_blank')}>
                  <img src={req.paymentReceipt} alt="Receipt" style={receiptImgStyle} />
                  <div style={imgOverlay}>View Full Receipt</div>
                </div>
                <div style={actionRowStyle}>
                  <button onClick={() => handlePaymentAction(req._id, 'approve')} style={approveBtnStyle}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => handlePaymentAction(req._id, 'reject')} style={rejectBtnStyle}>
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
            {data.length === 0 && !loading && <EmptyState message="The queue is empty. Great job!" />}
          </div>
        ) : (
          <div style={tableWrapper}>
            <div style={tableHeaderActions}>
              <div style={subFilterRow}>
                {[
                  { id: 'Printing', icon: <Package size={14}/> },
                  { id: 'Shipped', icon: <Truck size={14}/> },
                  { id: 'Delivered', icon: <Check size={14}/> }
                ].map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setLogisticsFilter(s.id)} 
                    style={logisticsFilter === s.id ? subTabActive : subTab}
                  >
                    {s.icon} {s.id} <span style={countBadge}>{stats[s.id.toLowerCase()] || 0}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={exportToCSV} style={btnExport}><Download size={16}/> CSV</button>
                {logisticsFilter === 'Printing' && <button onClick={() => handleBulkUpdate('Shipped')} style={shipBtnStyle}>Dispatch Selected</button>}
                {logisticsFilter === 'Shipped' && <button onClick={() => handleBulkUpdate('Delivered')} style={deliveredBtnStyle}>Mark as Delivered</button>}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                <thead>
                    <tr>
                    <th style={thStyle}><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? data.map(o=>o._id) : [])} checked={selectedIds.length === data.length && data.length > 0} /></th>
                    <th style={thStyle}>Member Details</th>
                    <th style={thStyle}>Contact</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(order => (
                    <tr key={order._id} style={trStyle}>
                        <td style={tdStyle}><input type="checkbox" checked={selectedIds.includes(order._id)} onChange={() => setSelectedIds(prev => prev.includes(order._id) ? prev.filter(id => id !== order._id) : [...prev, order._id])} /></td>
                        <td style={tdStyle}>
                        <div style={{fontWeight: '700', color: '#0f172a'}}>{order.name}</div>
                        <div style={{fontSize: '12px', color: '#64748b'}}>{order.rollNo}</div>
                        </td>
                        <td style={tdStyle}>{order.shippingDetails?.phone}</td>
                        <td style={tdStyle}>{order.shippingDetails?.city}</td>
                        <td style={tdStyle}>
                        <span style={{...statusBadgeStyle, backgroundColor: getStatusBg(order.cardStatus), color: getStatusColor(order.cardStatus)}}>
                            {order.cardStatus}
                        </span>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            {data.length === 0 && !loading && <EmptyState message="No records found in this stage." />}
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTS ---
const StatCard = ({ label, value, icon, color }) => (
  <div style={statBox}>
    <div style={statIconBox}>{icon}</div>
    <div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ color: color, fontSize: '20px', fontWeight: '800' }}>{value}</div>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div style={emptyContainer}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌟</div>
    <div style={{ color: '#64748b', fontWeight: '600', fontSize: '18px' }}>{message}</div>
  </div>
);

// --- STYLES (Refined Width & Aesthetics) ---
const wrapperStyle = { background: '#f8fafc', minHeight: '100vh', padding: '20px' };
const maxWidthContainer = { maxWidth: '1200px', margin: '0 auto' };

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' };
const titleStyle = { margin: 0, fontSize: '28px', fontWeight: '800', color: '#0f172a' };
const subtitleStyle = { margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' };

const statsRow = { display: 'flex', gap: '16px' };
const statBox = { backgroundColor: '#fff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' };
const statIconBox = { width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#08634f' };

const tabContainerStyle = { display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' };
const tabStyle = { padding: '12px 0', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '15px', fontWeight: '600', transition: '0.2s' };
const activeTabStyle = { ...tabStyle, color: '#08634f', borderBottom: '3px solid #08634f' };

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' };
const cardItemStyle = { backgroundColor: '#fff', borderRadius: '24px', padding: '20px', border: '1px solid #e2e8f0', transition: '0.3s' };
const cardHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' };
const cardName = { margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' };
const rollBadge = { fontSize: '10px', fontWeight: '800', color: '#08634f', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' };

const imageContainerStyle = { height: '160px', borderRadius: '16px', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid #f1f5f9', marginBottom: '16px' };
const receiptImgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const imgOverlay = { position: 'absolute', bottom: 0, width: '100%', padding: '8px', background: 'rgba(255,255,255,0.9)', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#08634f' };

const actionRowStyle = { display: 'flex', gap: '8px' };
const approveBtnStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: '#08634f', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' };
const rejectBtnStyle = { padding: '10px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '12px', cursor: 'pointer' };

const tableWrapper = { background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const tableHeaderActions = { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #f1f5f9' };
const subFilterRow = { display: 'flex', gap: '8px' };
const subTab = { padding: '8px 14px', borderRadius: '10px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' };
const subTabActive = { ...subTab, background: '#08634f', color: '#fff', border: '1px solid #08634f' };
const countBadge = { background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '6px', fontSize: '10px' };

const btnExport = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' };
const shipBtnStyle = { padding: '8px 16px', background: '#08634f', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' };
const deliveredBtnStyle = { padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' };

const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '16px 20px', background: '#f8fafc', color: '#64748b', fontSize: '11px', fontWeight: '800', textAlign: 'left', textTransform: 'uppercase' };
const tdStyle = { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' };
const trStyle = { transition: '0.2s' };
const statusBadgeStyle = { padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' };

const emptyContainer = { textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '24px' };
const loaderBar = { height: '4px', width: '100%', background: '#08634f', position: 'fixed', top: 0, left: 0, zIndex: 1000 };

const getStatusBg = (s) => (s === 'Printing' ? '#fffbeb' : s === 'Shipped' ? '#eef2ff' : '#ecfdf5');
const getStatusColor = (s) => (s === 'Printing' ? '#b45309' : s === 'Shipped' ? '#4338ca' : '#047857');

export default CardManager;