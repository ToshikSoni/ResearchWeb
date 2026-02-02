import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { statisticsAPI, paperAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PaperList from '../components/PaperList';
import AddPaperModal from '../components/AddPaperModal';
import './Dashboard.css';

function UserDashboard() {
  const { user, logout } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [papers, setPapers] = useState([]);
  const [myPapers, setMyPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    year: '',
    author: '',
    journal: ''
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my-papers'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, papersRes, myPapersRes] = await Promise.all([
        statisticsAPI.getStatistics(),
        paperAPI.getAllPapers(),
        paperAPI.getMyPapers()
      ]);
      
      setStatistics(statsRes.data);
      setPapers(papersRes.data);
      setMyPapers(myPapersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async () => {
    try {
      const response = await paperAPI.getAllPapers(filters);
      setPapers(response.data);
    } catch (error) {
      console.error('Error filtering papers:', error);
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
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Research Paper Database</h1>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
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

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <h3>{statistics?.papers_this_year || 0}</h3>
            <p>Papers This Year</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-details">
            <h3>{statistics?.my_papers_count || 0}</h3>
            <p>My Papers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
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
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Papers
        </button>
        <button 
          className={`tab ${activeTab === 'my-papers' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-papers')}
        >
          My Papers
        </button>
      </div>

      {/* Filters */}
      {activeTab === 'all' && (
        <div className="filters">
          <input
            type="text"
            placeholder="Search by title, author, abstract..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <input
            type="number"
            placeholder="Year"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          />
          <input
            type="text"
            placeholder="Author"
            value={filters.author}
            onChange={(e) => setFilters({ ...filters, author: e.target.value })}
          />
          <input
            type="text"
            placeholder="Journal"
            value={filters.journal}
            onChange={(e) => setFilters({ ...filters, journal: e.target.value })}
          />
          <button onClick={handleFilterChange} className="btn-filter">Apply Filters</button>
          <button onClick={() => {
            setFilters({ search: '', year: '', author: '', journal: '' });
            loadData();
          }} className="btn-clear">Clear</button>
        </div>
      )}

      {/* Action Button */}
      <div className="action-bar">
        <button onClick={handleAddPaper} className="btn-add">+ Add New Paper</button>
      </div>

      {/* Paper List */}
      <div className="content">
        {activeTab === 'all' ? (
          <PaperList papers={papers} onRefresh={loadData} />
        ) : (
          <PaperList papers={myPapers} onRefresh={loadData} showStatus={true} allowEdit={true} />
        )}
      </div>

      {/* Add Paper Modal */}
      {showAddModal && (
        <AddPaperModal onClose={() => setShowAddModal(false)} onSuccess={handlePaperAdded} />
      )}
    </div>
  );
}

export default UserDashboard;
