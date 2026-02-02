import React, { useState } from 'react';
import { paperAPI } from '../services/api';
import EditPaperModal from './EditPaperModal';
import './PaperList.css';

function PaperList({ papers, onRefresh, isAdmin = false, showStatus = false, allowEdit = false }) {
  const [editingPaper, setEditingPaper] = useState(null);
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

  const handleDelete = async (paperId) => {
    if (!window.confirm('Are you sure you want to delete this paper?')) {
      return;
    }

    try {
      await paperAPI.deletePaper(paperId);
      alert('Paper deleted successfully');
      onRefresh();
    } catch (error) {
      alert('Error deleting paper: ' + (error.response?.data?.error || error.message));
    }
  };

  if (papers.length === 0) {
    return (
      <div className="empty-state">
        <p>No papers found.</p>
      </div>
    );
  }

  return (
    <>
    <div className="paper-list">
      {papers.map((paper) => (
        <div key={paper.id} className="paper-card">
          <div className="paper-header">
            <h3>{paper.title}</h3>
            {showStatus && (
              <span className={`status-badge status-${paper.status}`}>
                {paper.status}
              </span>
            )}
          </div>
          
          <div className="paper-meta">
            <span><strong>Authors:</strong> {paper.authors}</span>
            <span><strong>Year:</strong> {paper.year}</span>
            {paper.journal && <span><strong>Journal:</strong> {paper.journal}</span>}
          </div>

          {paper.abstract && (
            <div className="paper-abstract">
              <strong>Abstract:</strong>
              <p>{paper.abstract.substring(0, 200)}...</p>
            </div>
          )}

          <div className="paper-details">
            {paper.volume && <span>Vol: {paper.volume}</span>}
            {paper.number && <span>No: {paper.number}</span>}
            {paper.pages && <span>Pages: {paper.pages}</span>}
            {paper.doi && <span>DOI: {paper.doi}</span>}
          </div>

          {paper.keywords && (
            <div className="paper-keywords">
              {paper.keywords.split(',').map((keyword, idx) => (
                <span key={idx} className="keyword-tag">{keyword.trim()}</span>
              ))}
            </div>
          )}

          <div className="paper-actions">
            {paper.pdf_filename && (
              <button 
                onClick={() => handleDownload(paper.id, paper.pdf_filename)}
                className="btn-download"
              >
                📄 Download PDF
              </button>
            )}
            {allowEdit && paper.status === 'approved' && (
              <button 
                onClick={() => setEditingPaper(paper)}
                className="btn-edit"
              >
                ✏️ Edit
              </button>
            )}
            {isAdmin && (
              <button 
                onClick={() => handleDelete(paper.id)}
                className="btn-delete"
              >
                🗑️ Delete
              </button>
            )}
          </div>

          <div className="paper-footer">
            <small>Added by: {paper.author_name || 'Unknown'}</small>
            <small>Created: {new Date(paper.created_at).toLocaleDateString()}</small>
          </div>
        </div>
      ))}
    </div>
    
    {editingPaper && (
      <EditPaperModal 
        paper={editingPaper}
        onClose={() => setEditingPaper(null)}
        onSuccess={() => {
          setEditingPaper(null);
          onRefresh();
        }}
      />
    )}
    </>
  );
}

export default PaperList;
