import React, { useState, useEffect } from 'react';
import { adminAPI, paperAPI } from '../services/api';
import './ApprovalRequests.css';

function ApprovalRequests({ onRefresh }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getApprovalRequests(filter);
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (paperId, filename) => {
    try {
      const response = await paperAPI.downloadPDF(paperId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'paper.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error downloading PDF: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleApproval = async (requestId, action) => {
    const comment = prompt(`Enter a comment for ${action}ing this request (optional):`);
    
    try {
      await adminAPI.handleApprovalRequest(requestId, action, comment || '');
      alert(`Request ${action}d successfully`);
      loadRequests();
      onRefresh();
    } catch (error) {
      alert('Error handling request: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading requests...</div>;
  }

  return (
    <div className="approval-requests">
      <div className="filter-bar">
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button 
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No {filter} requests found.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <span className={`request-type ${request.request_type}`}>
                  {request.request_type.toUpperCase()}
                </span>
                <span className={`request-status ${request.status}`}>
                  {request.status}
                </span>
              </div>

              <div className="request-info">
                <p><strong>Submitted by:</strong> {request.user_name}</p>
                <p><strong>Date:</strong> {new Date(request.created_at).toLocaleString()}</p>
              </div>

              {request.paper && (
                <div className="paper-info">
                  <h4>{request.paper.title}</h4>
                  <p><strong>Authors:</strong> {request.paper.authors}</p>
                  <p><strong>Year:</strong> {request.paper.year}</p>
                  {request.paper.journal && <p><strong>Journal:</strong> {request.paper.journal}</p>}
                  {request.paper.abstract && (
                    <p className="abstract"><strong>Abstract:</strong> {request.paper.abstract.substring(0, 150)}...</p>
                  )}
                </div>
              )}

              {request.admin_comment && (
                <div className="admin-comment">
                  <strong>Admin Comment:</strong> {request.admin_comment}
                </div>
              )}

              <div className="request-actions">
                {request.paper?.pdf_filename && (
                  <button 
                    onClick={() => handleDownload(request.paper.id, request.paper.pdf_filename)}
                    className="btn-view-pdf"
                  >
                    📄 View PDF
                  </button>
                )}
                {request.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleApproval(request.id, 'approve')}
                      className="btn-approve"
                    >
                      ✓ Approve
                    </button>
                    <button 
                      onClick={() => handleApproval(request.id, 'reject')}
                      className="btn-reject"
                    >
                      ✗ Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApprovalRequests;
