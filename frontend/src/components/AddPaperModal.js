import React, { useState } from 'react';
import { paperAPI } from '../services/api';
import './AddPaperModal.css';

function AddPaperModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    year: new Date().getFullYear(),
    month: '',
    journal: '',
    volume: '',
    number: '',
    pages: '',
    publisher: '',
    doi: '',
    isbn: '',
    issn: '',
    url: '',
    abstract: '',
    keywords: '',
    note: ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
    } else {
      setError('Please select a valid PDF file');
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Append PDF if selected
      if (pdfFile) {
        submitData.append('pdf', pdfFile);
      }

      await paperAPI.createPaper(submitData);
      alert('Paper submitted successfully! It will be reviewed by an admin.');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error submitting paper');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Research Paper</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="paper-form">
          <div className="form-row">
            <div className="form-group full-width">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Authors * (comma-separated)</label>
              <input
                type="text"
                name="authors"
                value={formData.authors}
                onChange={handleChange}
                placeholder="John Doe, Jane Smith"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Year *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <div className="form-group">
              <label>Month</label>
              <input
                type="text"
                name="month"
                value={formData.month}
                onChange={handleChange}
                placeholder="January"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Journal</label>
              <input
                type="text"
                name="journal"
                value={formData.journal}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Volume</label>
              <input
                type="text"
                name="volume"
                value={formData.volume}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Number</label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Pages</label>
              <input
                type="text"
                name="pages"
                value={formData.pages}
                onChange={handleChange}
                placeholder="1-10"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Publisher</label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>DOI</label>
              <input
                type="text"
                name="doi"
                value={formData.doi}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ISBN</label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>ISSN</label>
              <input
                type="text"
                name="issn"
                value={formData.issn}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>URL</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Abstract</label>
              <textarea
                name="abstract"
                value={formData.abstract}
                onChange={handleChange}
                rows="4"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Keywords (comma-separated)</label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                placeholder="machine learning, AI, neural networks"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Note</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows="2"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
              />
              {pdfFile && <small>Selected: {pdfFile.name}</small>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Paper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPaperModal;
