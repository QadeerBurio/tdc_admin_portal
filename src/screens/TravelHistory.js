import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { History, MapPin, Calendar, Star } from 'lucide-react';

const TravelHistory = () => {
  const { user, token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/traveler/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner"></div>
        <p>Loading your travel history...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Travel History</h2>
        <p style={{ color: '#64748b', margin: 0 }}>Your completed journeys</p>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <History size={48} style={{ marginBottom: '16px' }} />
          <h3>No travel history yet</h3>
          <p>Your completed trips will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map(trip => (
            <div key={trip._id} style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              gap: '16px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <img 
                  src={trip.packageId?.image} 
                  alt={trip.packageName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/80'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>
                  {trip.packageName}
                </h3>
                <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '13px' }}>
                  <span><Calendar size={14} /> {new Date(trip.travelDate).toLocaleDateString()}</span>
                  <span><MapPin size={14} /> {trip.packageId?.location}</span>
                  <span><Star size={14} /> {trip.numberOfTravelers} traveler(s)</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: '#f0fdf4',
                  color: '#10b981',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  Completed
                </span>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginTop: '8px' }}>
                  ${trip.totalAmount?.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TravelHistory;