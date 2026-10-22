// src/screens/AdminPackage.js
// Travel bookings (design/portal/AdBookings). Also the traveler portal's package screen (TravelDashboard).
import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Ico from '../portal/Ico';
import { PageHeader, PageLoading, Button, IconButton, Field, Textarea, Select, SearchInput, StatCard, Modal, Table, EmptyState, Pill, Facts, toast, confirmDialog } from '../portal/kit';

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
        if (!(await confirmDialog("Are you sure you want to permanently delete this booking? This action cannot be undone."))) return;
        
        setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${API_URL}/bookings/${bookingId}`, config);
            fetchData(); 
            toast("Booking deleted successfully");
        } catch (err) {
            toast("Delete failed: " + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickApprove = async (bookingId) => {
        if (!(await confirmDialog("Confirm approval?"))) return;
        setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API_URL}/bookings/${bookingId}`, { 
                status: 'confirmed',
                adminNotes: 'Quick approved by Admin' 
            }, config);
            fetchData();
        } catch (err) {
            toast("Action failed: " + err.message);
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
            toast('Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const configs = {
            pending: { icon: 'clock', tone: 'orange', label: 'Pending' },
            confirmed: { icon: 'checkCircle', tone: 'green', label: 'Confirmed' },
            cancelled: { icon: 'xCircle', tone: 'red', label: 'Cancelled' },
            completed: { icon: 'star', tone: 'purple', label: 'Completed' }
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
        return <div className="tdcp k-page"><PageLoading label="Syncing Dashboard..." /></div>;
    }

    return (
        <div className="tdcp k-page" data-screen="bookings">
            <PageHeader
                title="bookings"
                sub="Overview of your travel packages and revenue"
                actions={<Button variant="secondary" icon="refresh" onClick={fetchData}>Refresh Data</Button>}
            />

            <div className="k-stats">
                <StatCard label="Total Bookings" value={stats.totalBookings} sub="all time" icon="users" tone="blue" />
                <StatCard label="Pending" value={stats.pendingBookings} sub="Awaiting" icon="clock" tone="orange" />
                <StatCard label="Confirmed" value={stats.confirmedBookings} sub="Approved" icon="checkCircle" tone="green" />
                <StatCard label="Total Revenue" value={`rs ${stats.totalRevenue.toLocaleString()}`} sub="Earnings" icon="wallet" tone="purple" />
            </div>

            <div className="k-toolbar">
                <SearchInput
                    className="k-grow"
                    placeholder="Search by customer, email or package..."
                    aria-label="search bookings"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select aria-label="status" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                </Select>
                <Select aria-label="sort" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount">Highest Amount</option>
                    <option value="status">By Status</option>
                </Select>
            </div>

            <div className="k-row" style={{ justifyContent: 'space-between' }}>
                <h3 className="k-row" style={{ margin: 0, fontSize: 18, gap: 10 }}><Ico kind="file" tone="sand" size={34} /> Recent Bookings</h3>
                <Pill tone="sand">{filteredBookings.length} bookings</Pill>
            </div>

            <Table
                minWidth={860}
                rows={filteredBookings}
                empty={<EmptyState icon="file" title="No bookings found" text="Try adjusting your search or filters" />}
                columns={[
                    {
                        key: 'customer',
                        label: 'Customer',
                        render: (item) => (
                            <div className="k-row" style={{ flexWrap: 'nowrap' }}>
                                <Ico kind="user" tone="yellow" size={36} />
                                <div style={{ minWidth: 0 }}>
                                    <b style={{ display: 'block' }}>{item.customerName}</b>
                                    <span className="k-hint">{item.customerEmail}</span>
                                </div>
                            </div>
                        ),
                    },
                    { key: 'package', label: 'Package', render: (item) => <b>{item.packageName}</b> },
                    {
                        key: 'date',
                        label: 'Travel Date',
                        render: (item) => (
                            <span className="k-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                                <Ico kind="calendar" tone="plain" size={14} />
                                {new Date(item.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        ),
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        render: (item) => {
                            const statusConfig = getStatusBadge(item.status);
                            return <Pill tone={statusConfig.tone}><Ico kind={statusConfig.icon} tone="plain" size={12} />{statusConfig.label}</Pill>;
                        },
                    },
                    { key: 'amount', label: 'Amount', render: (item) => <b>rs {item.totalAmount}</b> },
                    {
                        key: 'actions',
                        label: 'Actions',
                        thStyle: { textAlign: 'right' },
                        style: { textAlign: 'right' },
                        render: (item) => (
                            <div className="k-row" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                                {item.status === 'pending' && (
                                    <IconButton icon="check" label="Approve Now" variant="success" size="sm" onClick={() => handleQuickApprove(item._id)} disabled={submitting} />
                                )}
                                <IconButton
                                    icon="edit"
                                    label="Edit Booking"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedBooking(item);
                                        setStatusUpdate(item.status);
                                        setAdminNotes(item.adminNotes || '');
                                    }}
                                />
                                <IconButton icon="trash" label="Delete Booking" variant="danger" size="sm" onClick={() => handleDelete(item._id)} disabled={submitting} />
                            </div>
                        ),
                    },
                ]}
            />

            {/* edit */}
            <Modal
                open={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                icon="edit"
                tone="yellow"
                title="Update Booking Details"
                sub="Edit Booking"
                footer={<>
                    <Button variant="secondary" onClick={() => setSelectedBooking(null)}>Discard</Button>
                    <Button type="submit" form="booking-form" loading={submitting}>{submitting ? 'Saving...' : 'Update Booking'}</Button>
                </>}
            >
                {selectedBooking && (
                    <form id="booking-form" onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="k-card" style={{ padding: '6px 18px' }}>
                            <Facts rows={[
                                ['Booking ID', `#${selectedBooking._id.slice(-8).toUpperCase()}`],
                                ['Customer', selectedBooking.customerName],
                                ['Package', selectedBooking.packageName],
                                ['Amount', `rs ${selectedBooking.totalAmount}`],
                            ]} />
                        </div>
                        <Field label="Current Status" htmlFor="bk-status">
                            <Select id="bk-status" value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </Select>
                        </Field>
                        <Field label="Admin Notes" htmlFor="bk-notes">
                            <Textarea id="bk-notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes..." rows="4" />
                        </Field>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default AdminPackage;
