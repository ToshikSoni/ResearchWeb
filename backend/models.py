from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'admin' or 'user'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    papers = db.relationship('ResearchPaper', backref='author', lazy=True, foreign_keys='ResearchPaper.user_id')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }


class ResearchPaper(db.Model):
    __tablename__ = 'research_papers'
    
    id = db.Column(db.Integer, primary_key=True)
    # BibTeX fields
    title = db.Column(db.String(500), nullable=False)
    authors = db.Column(db.Text, nullable=False)  # Comma-separated
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.String(20))
    journal = db.Column(db.String(200))
    volume = db.Column(db.String(50))
    number = db.Column(db.String(50))
    pages = db.Column(db.String(50))
    publisher = db.Column(db.String(200))
    doi = db.Column(db.String(100))
    isbn = db.Column(db.String(50))
    issn = db.Column(db.String(50))
    url = db.Column(db.String(500))
    abstract = db.Column(db.Text)
    keywords = db.Column(db.Text)  # Comma-separated
    note = db.Column(db.Text)
    
    # File storage
    pdf_filename = db.Column(db.String(255))
    
    # Metadata
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='approved')  # 'pending', 'approved', 'rejected'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'authors': self.authors,
            'year': self.year,
            'month': self.month,
            'journal': self.journal,
            'volume': self.volume,
            'number': self.number,
            'pages': self.pages,
            'publisher': self.publisher,
            'doi': self.doi,
            'isbn': self.isbn,
            'issn': self.issn,
            'url': self.url,
            'abstract': self.abstract,
            'keywords': self.keywords,
            'note': self.note,
            'pdf_filename': self.pdf_filename,
            'user_id': self.user_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'author_name': self.author.name if self.author else None
        }


class ApprovalRequest(db.Model):
    __tablename__ = 'approval_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    paper_id = db.Column(db.Integer, db.ForeignKey('research_papers.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    request_type = db.Column(db.String(20), nullable=False)  # 'create', 'update', 'delete'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected'
    admin_comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    paper = db.relationship('ResearchPaper', backref='approval_requests', foreign_keys=[paper_id])
    user = db.relationship('User', foreign_keys=[user_id])
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'paper_id': self.paper_id,
            'user_id': self.user_id,
            'request_type': self.request_type,
            'status': self.status,
            'admin_comment': self.admin_comment,
            'created_at': self.created_at.isoformat(),
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'reviewed_by': self.reviewed_by,
            'paper': self.paper.to_dict() if self.paper else None,
            'user_name': self.user.name if self.user else None
        }
