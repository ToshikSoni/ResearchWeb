import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { statisticsAPI, paperAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import PaperList from '../components/PaperList';
import AddPaperModal from '../components/AddPaperModal';
import ApprovalRequests from '../components/ApprovalRequests';
import UserManagement from '../components/UserManagement';
import logo from '../Images/SPSULOGO.png';
import './Dashboard.css';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('papers');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    loadData();
    
    // Hide welcome message after 5 seconds
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    
    return () => clearTimeout(timer);
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

  const handleAddPaper = () => setShowAddModal(true);

  const handlePaperAdded = () => {
    setShowAddModal(false);
    loadData();
  };

  // Get current time with full day greetings
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', emoji: '🌅' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', emoji: '☀️' };
    } else if (hour >= 17 && hour < 20) {
      return { text: 'Good Evening', emoji: '🌆' };
    } else {
      return { text: 'Good Night', emoji: '🌙' };
    }
  };

  const greeting = getGreeting();

  // Calculate real research metrics from actual data
  const researchImpact = statistics?.total_papers ? 
    ((statistics?.papers_this_year / statistics?.total_papers) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spsu-loader">
          <img src={logo} alt="SPSU" className="loading-logo" />
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading SPSU Research Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard admin-dashboard">
      
      {/* Welcome Toast */}
      {showWelcome && (
        <div className="welcome-toast">
          <div className="welcome-content">
            <span className="welcome-icon">👋</span>
            <div>
              <h4>Welcome back, {user?.name}!</h4>
              <p>SPSU Research Department • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={() => setShowWelcome(false)} className="toast-close">×</button>
        </div>
      )}

      {/* Header with SPSU Branding */}
      <header className="dashboard-header">
        <div className="header-content">
          
          <div className="header-left">
            <div className="logo-container">
              <img src={logo} alt="SPSU Logo" className="university-logo" />
              <div className="logo-glow"></div>
            </div>
            <div className="header-title-wrapper">
              <h1>Admin Dashboard</h1>
              <div className="university-badge">
                <span className="badge-icon">🏛️</span>
                <span className="badge-text">Sir Padampat Singhania University</span>
              </div>
            </div>
          </div>

          <div className="user-info">
            <div className="greeting-badge">
              <span className="greeting-icon">{greeting.emoji}</span>
              <span className="greeting-text">{greeting.text}</span>
            </div>
            <div className="admin-profile">
              <span className="admin-badge">
                <span className="badge-icon">👑</span>
                Research Admin
              </span>
              <span className="user-name">{user?.name || 'Admin'}</span>
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
            <button onClick={logout} className="btn-logout">
              <span className="btn-icon">🚪</span>
              <span className="btn-text">Logout</span>
            </button>
          </div>

        </div>

        {/* Research Stats Ticker - Using Real Data */}
        <div className="research-ticker">
          <div className="ticker-content">
            <span className="ticker-item">📊 Total Research Papers: {statistics?.total_papers || 0}</span>
            <span className="ticker-item">📈 This Year's Publications: {statistics?.papers_this_year || 0}</span>
            <span className="ticker-item">⏳ Pending Reviews: {statistics?.pending_approvals || 0}</span>
            <span className="ticker-item">📝 Pending Papers: {statistics?.pending_papers || 0}</span>
          </div>
        </div>
      </header>

      {/* Statistics with SPSU Theming */}
      <div className="stats-container">
        <div 
          className={`stat-card ${hoveredCard === 'total' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredCard('total')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="stat-icon-wrapper">
            <div className="stat-icon">📚</div>
            <div className="stat-icon-bg"></div>
          </div>
          <div className="stat-details">
            <h3>{statistics?.total_papers || 0}</h3>
            <p>Total Research Papers</p>
            {statistics?.papers_this_year > 0 && (
              <div className="stat-trend positive">
                <span>📈 {researchImpact}%</span> of total this year
              </div>
            )}
          </div>
          <div className="stat-card-glow"></div>
        </div>

        <div 
          className={`stat-card pending ${hoveredCard === 'pending' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredCard('pending')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="stat-icon-wrapper">
            <div className="stat-icon">⏳</div>
            <div className="stat-icon-bg"></div>
          </div>
          <div className="stat-details">
            <h3>{statistics?.pending_papers || 0}</h3>
            <p>Pending Papers</p>
            {statistics?.pending_papers > 0 && (
              <div className="stat-trend warning">
                <span>⚡</span> Awaiting review
              </div>
            )}
          </div>
          <div className="stat-card-glow"></div>
        </div>

        <div 
          className={`stat-card ${hoveredCard === 'year' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredCard('year')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="stat-icon-wrapper">
            <div className="stat-icon">📅</div>
            <div className="stat-icon-bg"></div>
          </div>
          <div className="stat-details">
            <h3>{statistics?.papers_this_year || 0}</h3>
            <p>Papers This Year</p>
            {statistics?.papers_this_year > 0 && (
              <div className="stat-trend positive">
                <span>⭐</span> Active research year
              </div>
            )}
          </div>
          <div className="stat-card-glow"></div>
        </div>

        <div 
          className={`stat-card warning ${hoveredCard === 'approvals' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredCard('approvals')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="stat-icon-wrapper">
            <div className="stat-icon">🔔</div>
            <div className="stat-icon-bg"></div>
          </div>
          <div className="stat-details">
            <h3>{statistics?.pending_approvals || 0}</h3>
            <p>Pending Approvals</p>
            {statistics?.pending_approvals > 0 && (
              <div className="stat-trend urgent">
                <span>!</span> Requires attention
              </div>
            )}
          </div>
          <div className="stat-card-glow"></div>
        </div>
      </div>

      {/* Chart with SPSU Branding */}
      {statistics?.papers_by_year?.length > 0 && (
        <div className="chart-container">
          <div className="chart-header">
            <h2>
              <span className="chart-icon">📈</span>
              SPSU Research Publications Trend
            </h2>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color" style={{ background: '#2c3e50' }}></span>
                Publications
              </span>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={statistics.papers_by_year}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2c3e50" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2c3e50" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="year" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    border: 'none'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#2c3e50" 
                  strokeWidth={3}
                  fill="url(#colorCount)"
                  dot={{ r: 6, fill: '#2c3e50' }}
                  activeDot={{ r: 8, fill: '#f1c40f' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SPSU Research Quote */}
      <div className="quote-carousel">
        <div className="quote-container">
          <div className="quote-mark">"</div>
          <p className="quote-text">Research is formalized curiosity. It is poking and prying with a purpose.</p>
          <div className="quote-author">- Zora Neale Hurston</div>
        </div>
      </div>

      {/* Tabs with SPSU Styling */}
      <div className="tabs-container">
        <div className="tabs-header">
          <h3 className="tabs-title">Research Management</h3>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'papers' ? 'active' : ''}`}
              onClick={() => setActiveTab('papers')}
            >
              <span className="tab-icon">📄</span>
              All Papers
              <span className="tab-count">{papers.length}</span>
            </button>

            <button
              className={`tab ${activeTab === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvals')}
            >
              <span className="tab-icon">✅</span>
              Approval Requests
              {statistics?.pending_approvals > 0 && (
                <span className="badge">{statistics.pending_approvals}</span>
              )}
            </button>

            <button
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="tab-icon">👥</span>
              User Management
            </button>
          </div>
        </div>

        {/* Action */}
        {activeTab === 'papers' && (
          <div className="action-bar">
            <button onClick={handleAddPaper} className="btn-add">
              <span className="btn-add-icon">+</span>
              Add New Research Paper
            </button>
          </div>
        )}

        {/* Content */}
        <div className="content">
          {activeTab === 'papers' && (
            <>
              {papers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No Research Papers Found</h3>
                  <p>Start building SPSU's research repository by adding your first paper.</p>
                  <button onClick={handleAddPaper} className="btn-add-empty">
                    + Add First Paper
                  </button>
                </div>
              ) : (
                <PaperList papers={papers} onRefresh={loadData} isAdmin />
              )}
            </>
          )}
          {activeTab === 'approvals' && (
            <ApprovalRequests onRefresh={loadData} />
          )}
          {activeTab === 'users' && <UserManagement />}
        </div>
      </div>

      {/* Research Impact Footer - Using Real Data */}
      <footer className="research-footer">
        <div className="footer-content">
          <div className="footer-left">
            <img src={logo} alt="SPSU" className="footer-logo" />
            <div className="footer-info">
              <h4>Sir Padampat Singhania University</h4>
              <p>Research Department • Excellence in Innovation</p>
            </div>
          </div>
          <div className="footer-right">
            <div className="footer-stat">
              <span className="footer-stat-value">{statistics?.total_papers || 0}</span>
              <span className="footer-stat-label">Total Publications</span>
            </div>
            <div className="footer-stat">
              <span className="footer-stat-value">{statistics?.papers_this_year || 0}</span>
              <span className="footer-stat-label">This Year</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {showAddModal && (
        <AddPaperModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handlePaperAdded}
        />
      )}

    </div>
  );
}

export default AdminDashboard;