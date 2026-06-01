import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Wallet, TrendingUp, PiggyBank } from 'lucide-react';

const SavingsTracker = () => {
  const { user, token } = useContext(AuthContext);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/traveler/savings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching savings:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSaved = savings.reduce((acc, curr) => acc + (curr.amountSaved || 0), 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner"></div>
        <p>Calculating your savings...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>My Savings</h2>
        <p style={{ color: '#64748b', margin: 0 }}>Track your student travel savings</p>
      </div>

      {/* Total Savings Card */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        padding: '32px',
        borderRadius: '20px',
        color: '#fff',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: '0 0 8px' }}>Total Saved</p>
            <h1 style={{ fontSize: '36px', fontWeight: '800', margin: 0 }}>
              PKR {totalSaved.toLocaleString()}
            </h1>
          </div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PiggyBank size={32} />
          </div>
        </div>
      </div>

      {/* Savings List */}
      {savings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <Wallet size={48} style={{ marginBottom: '16px' }} />
          <h3>No savings yet</h3>
          <p>Book your first trip to start saving!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {savings.map((saving, index) => (
            <div key={index} style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>
                  {saving.packageName}
                </h4>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: saving.isActive ? '#f0fdf4' : '#f1f5f9',
                  color: saving.isActive ? '#10b981' : '#64748b'
                }}>
                  {saving.isActive ? 'Active' : 'Used'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                  +PKR {saving.amountSaved?.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Student Discount
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavingsTracker;