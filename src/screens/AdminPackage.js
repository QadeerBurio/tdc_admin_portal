import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './styles/AdminPackage.css';

const API_URL = 'http://localhost:5000/api/admin';

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
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- NEW DELETE HANDLER ---
    const handleDelete = async (bookingId) => {
        if (!window.confirm("Are you sure you want to permanently delete this booking? This action cannot be undone.")) return;
        
        setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${API_URL}/bookings/${bookingId}`, config);
            
            // Optimistic UI update or just refetch
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

    if (loading) {
        return (
            <div className="admin-loader-container">
                <div className="spinner"></div>
                <p>Syncing Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div>
                    <h1>Booking Management</h1>
                    <p className="subtitle">Overview of your travel packages and revenue</p>
                </div>
                <button className="refresh-btn" onClick={fetchData}>Refresh Data</button>
            </header>

            {/* Stats Overview */}
            <section className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon total">Σ</div>
                    <div className="stat-info">
                        <p>Total Bookings</p>
                        <h3>{stats.totalBookings}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pending">⏳</div>
                    <div className="stat-info">
                        <p>Pending</p>
                        <h3 className="text-orange">{stats.pendingBookings}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon confirmed">✅</div>
                    <div className="stat-info">
                        <p>Confirmed</p>
                        <h3 className="text-green">{stats.confirmedBookings}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon revenue">💰</div>
                    <div className="stat-info">
                        <p>Total Revenue</p>
                        <h3 className="text-blue">${stats.totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>
            </section>

            {/* Bookings Table */}
            <div className="main-content-card">
                <div className="table-header">
                    <h2>Recent Bookings</h2>
                </div>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Package</th>
                                <th>Travel Date</th>
                                <th>Status</th>
                                <th>Amount</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.length > 0 ? bookings.map((item) => (
                                <tr key={item._id}>
                                    <td className="user-cell">
                                        <div className="avatar">{item.customerName.charAt(0)}</div>
                                        <div>
                                            <span className="name">{item.customerName}</span>
                                            <span className="email">{item.customerEmail}</span>
                                        </div>
                                    </td>
                                    <td><span className="pkg-name">{item.packageName}</span></td>
                                    <td>{new Date(item.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td>
                                        <span className={`status-badge ${item.status}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="font-bold">${item.totalAmount}</td>
                                    <td className="text-right">
                                        <div className="action-group">
                                            {item.status === 'pending' && (
                                                <button 
                                                    disabled={submitting}
                                                    className="btn-icon approve" 
                                                    onClick={() => handleQuickApprove(item._id)}
                                                    title="Approve Now"
                                                >
                                                    ✓
                                                </button>
                                            )}
                                            <button className="btn-secondary" onClick={() => {
                                                setSelectedBooking(item);
                                                setStatusUpdate(item.status);
                                                setAdminNotes(item.adminNotes || '');
                                            }}>
                                                Edit
                                            </button>
                                            
                                            {/* --- DELETE BUTTON --- */}
                                            <button 
                                                className="btn-icon delete" 
                                                onClick={() => handleDelete(item._id)}
                                                disabled={submitting}
                                                title="Delete Booking"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="empty-state">No bookings found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {selectedBooking && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Edit Booking Details</h3>
                            <button className="close-x" onClick={() => setSelectedBooking(null)}>&times;</button>
                        </div>
                        
                        <form onSubmit={handleUpdate}>
                            <div className="modal-body">
                                <div className="info-row">
                                    <label>Booking ID:</label>
                                    <span>#{selectedBooking._id.slice(-8).toUpperCase()}</span>
                                </div>
                                
                                <div className="input-group">
                                    <label>Current Status</label>
                                    <select 
                                        value={statusUpdate} 
                                        onChange={(e) => setStatusUpdate(e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Admin Notes</label>
                                    <textarea 
                                        value={adminNotes} 
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add notes..."
                                        rows="4"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-link" onClick={() => setSelectedBooking(null)}>Discard</button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Update Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPackage;