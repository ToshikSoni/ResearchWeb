import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { statisticsAPI, paperAPI, adminAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PaperList from '../components/PaperList';
import AddPaperModal from '../components/AddPaperModal';
import ApprovalRequests from '../components/ApprovalRequests';
import UserManagement from '../components/UserManagement';
import './Dashboard.css';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('papers'); // 'papers', 'approvals', 'users'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, papersRes] = await Promise.all([
        statisticsAPI.getStatistics(),
        paperAPI.getAllPapers()
      ]);
      
      setStatistics(statsRes.data);
      setPapers(papersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaper = () => {
    setShowAddModal(true);
  };

  const handlePaperAdded = () => {
    setShowAddModal(false);
    loadData();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="user-info">
            <span className="admin-badge">👑 Admin</span>
            <span>{user.name}</span>
            <button onClick={logout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-details">
            <h3>{statistics?.total_papers || 0}</h3>
            <p>Total Papers</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-details">
            <h3>{statistics?.pending_papers || 0}</h3>
            <p>Pending Papers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <h3>{statistics?.papers_this_year || 0}</h3>
            <p>Papers This Year</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">🔔</div>
          <div className="stat-details">
            <h3>{statistics?.pending_approvals || 0}</h3>
            <p>Pending Approvals</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {statistics?.papers_by_year && statistics.papers_by_year.length > 0 && (
        <div className="chart-container">
          <h2>Publications by Year</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={statistics.papers_by_year}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'papers' ? 'active' : ''}`}
          onClick={() => setActiveTab('papers')}
        >
          All Papers
        </button>
        <button 
          className={`tab ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          Approval Requests {statistics?.pending_approvals > 0 && (
            <span className="badge">{statistics.pending_approvals}</span>
          )}
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      {/* Action Button */}
      {activeTab === 'papers' && (
        <div className="action-bar">
          <button onClick={handleAddPaper} className="btn-add">+ Add New Paper</button>
        </div>
      )}

      {/* Content */}
      <div className="content">
        {activeTab === 'papers' && (
          <PaperList papers={papers} onRefresh={loadData} isAdmin={true} />
        )}
        {activeTab === 'approvals' && (
          <ApprovalRequests onRefresh={loadData} />
        )}
        {activeTab === 'users' && (
          <UserManagement />
        )}
      </div>

      {/* Add Paper Modal */}
      {showAddModal && (
        <AddPaperModal onClose={() => setShowAddModal(false)} onSuccess={handlePaperAdded} />
      )}
    </div>
  );
}

export default AdminDashboard;
