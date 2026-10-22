// src/screens/CardManager.js
// Student cards (design/portal/AdCards): payment verification queue and the printing / shipping pipeline.
import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { AuthContext } from "../context/AuthContext";
import Ico from '../portal/Ico';
import { PageHeader, Button, IconButton, SearchInput, Segmented, StatCard, Tabs, Modal, EmptyState, Pill, Card, Facts, Spinner, toast, confirmDialog } from '../portal/kit';
import './styles/CardManager.css';

const STATUS_TONE = { Printing: 'yellow', Shipped: 'blue', Delivered: 'green' };
const statusPill = (s) => <Pill tone={STATUS_TONE[s] || 'sand'} dot>{s}</Pill>;

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const [stats, setStats] = useState({ 
    printing: 0, shipped: 0, delivered: 0, pending: 0, 
    approvedTotal: 0, totalRevenue: 0 
  });

  const API_BASE = "https://the-deft-crew-production.up.railway.app/api/admin";
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (!(await confirmDialog(`Are you sure you want to ${action} this payment?`))) return;
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/${action}-payment/${userId}`, {}, config);
      loadData();
    } catch (err) { toast("Action failed."); }
    finally { setLoading(false); }
  };

  const handleBulkUpdate = async (newStatus) => {
    if (selectedIds.length === 0) return toast("Select members first.");
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/bulk-update-status`, { userIds: selectedIds, newStatus: newStatus }, config);
      setSelectedIds([]);
      loadData();
    } catch (err) { toast("Update failed"); }
    finally { setLoading(false); }
  };

  const exportToCSV = () => {
    if (data.length === 0) return toast("No data to export");
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

  const empty = (message) => (
    <div className="k-card" style={{ gridColumn: '1 / -1' }}>
      <EmptyState icon="checkCircle" tone="green" title={message} text="Everything is up to date" />
    </div>
  );
  const toggleOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="tdcp k-page cm" data-screen="cards">
      <PageHeader title="student cards" sub="physical privilege card requests." />

      <div className="k-stats">
        <StatCard label="Total Issued" value={stats.approvedTotal} icon="users" tone="green" />
        <StatCard label="Net Revenue" value={`₨ ${stats.totalRevenue.toLocaleString()}`} icon="wallet" tone="blue" />
        <StatCard label="Awaiting" value={stats.pending} icon="clock" tone="orange" />
      </div>

      <Tabs
        label="card sections"
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'payments', label: isMobile ? 'Verification' : 'Verification Queue', icon: 'shield', count: stats.pending > 0 ? stats.pending : undefined },
          { id: 'logistics', label: isMobile ? 'Logistics' : 'Logistics Pipeline', icon: 'card' },
        ]}
      />

      {loading && <div className="k-row k-hint" role="status"><Spinner size="sm" />loading…</div>}

      <SearchInput
        style={{ maxWidth: 420 }}
        placeholder={isMobile ? "Search..." : "Search by name, roll number or email..."}
        aria-label="search members"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {activeTab === 'payments' ? (
        <div className="k-grid">
          {filteredData.map((req) => (
            <article key={req._id} className="k-card cm-card">
              <div className="k-row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                <div className="k-row" style={{ flexWrap: 'nowrap', minWidth: 0 }}>
                  <span className="cm-avatar">{req.name?.charAt(0).toUpperCase()}</span>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="cm-name">{req.name}</h3>
                    <Pill tone="sand"><Ico kind="grad" tone="plain" size={12} />{req.rollNo}</Pill>
                  </div>
                </div>
                <IconButton icon="eye" label="View details" size="sm" onClick={() => openUserDetail(req)} />
              </div>

              <button type="button" className="cm-receipt" onClick={() => window.open(req.paymentReceipt, '_blank')}>
                <img src={req.paymentReceipt} alt="Receipt" />
                <span className="cm-receipt-tag"><Ico kind="eye" tone="plain" size={13} />View Receipt</span>
              </button>

              <Facts rows={[["Amount", `₨ ${req.amount || 500}`], ["Date", new Date(req.createdAt).toLocaleDateString()]]} />

              <div className="k-row" style={{ flexWrap: 'nowrap' }}>
                <Button variant="success" icon="checkCircle" style={{ flex: 1 }} onClick={() => handlePaymentAction(req._id, 'approve')}>Approve</Button>
                <IconButton icon="xCircle" label="Reject" variant="danger" onClick={() => handlePaymentAction(req._id, 'reject')} />
              </div>
            </article>
          ))}
          {filteredData.length === 0 && !loading && empty("The queue is empty. Great job!")}
        </div>
      ) : (
        <div className="k-table-card">
          <div className="cm-bar">
            <Segmented
              label="stage"
              value={logisticsFilter}
              onChange={setLogisticsFilter}
              options={['Printing', 'Shipped', 'Delivered'].map((id) => ({ value: id, label: id, count: stats[id.toLowerCase()] || 0 }))}
            />
            <div className="k-row" style={{ gap: 8 }}>
              <Button size="sm" variant="secondary" icon="download" onClick={exportToCSV}>{isMobile ? 'Export' : 'CSV'}</Button>
              {logisticsFilter === 'Printing' && (
                <Button size="sm" icon="send" onClick={() => handleBulkUpdate('Shipped')}>{isMobile ? 'Dispatch' : 'Dispatch Selected'}</Button>
              )}
              {logisticsFilter === 'Shipped' && (
                <Button size="sm" variant="success" icon="check" onClick={() => handleBulkUpdate('Delivered')}>{isMobile ? 'Deliver' : 'Mark Delivered'}</Button>
              )}
            </div>
          </div>
          <div className="k-table-scroll">
            <table className="k-table" style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input type="checkbox" aria-label="select all" className="cm-check" onChange={(e) => setSelectedIds(e.target.checked ? data.map(o=>o._id) : [])} checked={selectedIds.length === data.length && data.length > 0} />
                  </th>
                  <th>member details</th>
                  <th>contact</th>
                  <th>location</th>
                  <th>status</th>
                  <th style={{ textAlign: 'center' }}>actions</th>
                </tr>
              </thead>
              {filteredData.length > 0 && (
                <tbody>
                  {filteredData.map((order) => (
                    <tr key={order._id}>
                      <td><input type="checkbox" aria-label={`select ${order.name}`} className="cm-check" checked={selectedIds.includes(order._id)} onChange={() => toggleOne(order._id)} /></td>
                      <td>
                        <div className="k-row" style={{ flexWrap: 'nowrap' }}>
                          <span className="cm-avatar">{order.name?.charAt(0).toUpperCase()}</span>
                          <div><b>{order.name}</b><div className="k-hint">{order.rollNo}</div></div>
                        </div>
                      </td>
                      <td>
                        <div className="k-row k-hint" style={{ gap: 6 }}><Ico kind="phone" tone="plain" size={12} />{order.shippingDetails?.phone || 'N/A'}</div>
                        <div className="k-row k-hint" style={{ gap: 6 }}><Ico kind="mail" tone="plain" size={12} />{order.email || 'N/A'}</div>
                      </td>
                      <td>
                        <div className="k-row" style={{ gap: 6 }}><Ico kind="pin" tone="plain" size={12} />{order.shippingDetails?.city || 'N/A'}</div>
                        <div className="k-hint cm-address">{order.shippingDetails?.address || 'No address'}</div>
                      </td>
                      <td>{statusPill(order.cardStatus)}</td>
                      <td style={{ textAlign: 'center' }}><IconButton icon="eye" label="View details" size="sm" onClick={() => openUserDetail(order)} /></td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
          {filteredData.length === 0 && !loading && <EmptyState icon="checkCircle" tone="green" title="No records found in this stage." text="Everything is up to date" />}
        </div>
      )}

      {/* member detail */}
      <Modal
        open={showDetailModal && !!selectedUser}
        onClose={closeUserDetail}
        size="lg"
        title={selectedUser?.name}
        sub={selectedUser ? `Roll No: ${selectedUser.rollNo}` : undefined}
        footer={selectedUser ? <>
          <Button variant="secondary" onClick={closeUserDetail}>Close</Button>
          {activeTab === 'payments' && selectedUser.paymentStatus !== 'Verified' && (
            <Button
              variant="success"
              icon="checkCircle"
              onClick={() => {
                handlePaymentAction(selectedUser._id, 'approve');
                closeUserDetail();
              }}
            >
              Approve Payment
            </Button>
          )}
        </> : null}
      >
        {selectedUser && (
          <>
            <div className="cm-detail">
              <Card title="Personal Information" icon="user" tone="blue">
                <Facts rows={[
                  ["Full Name", selectedUser.name],
                  ["Roll Number", selectedUser.rollNo],
                  ["Email", selectedUser.email || 'N/A'],
                  ["Phone", selectedUser.shippingDetails?.phone || 'N/A'],
                ]} />
              </Card>
              <Card title="Shipping Details" icon="pin" tone="orange">
                <Facts rows={[
                  ["City", selectedUser.shippingDetails?.city || 'N/A'],
                  ["Address", selectedUser.shippingDetails?.address || 'N/A'],
                ]} />
              </Card>
              <Card title="Card Status" icon="card" tone="pink">
                <Facts rows={[
                  ["Current Status", statusPill(selectedUser.cardStatus || 'Pending')],
                  ["Payment Status", <Pill key="p" tone={selectedUser.paymentStatus === 'Verified' ? 'green' : 'orange'} dot>{selectedUser.paymentStatus || 'Pending'}</Pill>],
                ]} />
              </Card>
            </div>
            {selectedUser.paymentReceipt && (
              <Card title="Payment Receipt" icon="receipt" tone="sand">
                <button type="button" className="cm-receipt big" onClick={() => window.open(selectedUser.paymentReceipt, '_blank')}>
                  <img src={selectedUser.paymentReceipt} alt="Receipt" />
                </button>
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default CardManager;
