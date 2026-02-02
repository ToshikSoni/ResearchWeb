from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from config import Config
from models import db, User, ResearchPaper, ApprovalRequest
from sqlalchemy import or_, and_, func

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
CORS(app)
db.init_app(app)
jwt = JWTManager(app)

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_email_domain(email):
    """Validate that email belongs to the allowed domain"""
    return email.endswith(f"@{app.config['ALLOWED_EMAIL_DOMAIN']}")


# ==================== AUTH ROUTES ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['email', 'password', 'name']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate email domain
    if not validate_email_domain(data['email']):
        return jsonify({'error': f'Only @{app.config["ALLOWED_EMAIL_DOMAIN"]} emails are allowed'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User already exists'}), 400
    
    # Create new user
    user = User(
        email=data['email'],
        name=data['name'],
        role='user'  # Default role
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Create access token
    access_token = create_access_token(identity={'id': user.id, 'role': user.role})
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Create access token
    access_token = create_access_token(identity={'id': user.id, 'role': user.role})
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    current_user_identity = get_jwt_identity()
    user = User.query.get(current_user_identity['id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200


# ==================== PAPER ROUTES ====================

@app.route('/api/papers', methods=['GET'])
@jwt_required()
def get_papers():
    """Get all approved papers with optional filters"""
    current_user_identity = get_jwt_identity()
    
    # Base query - only approved papers for regular users
    if current_user_identity['role'] == 'admin':
        query = ResearchPaper.query
    else:
        query = ResearchPaper.query.filter_by(status='approved')
    
    # Apply filters
    if 'year' in request.args:
        query = query.filter_by(year=int(request.args['year']))
    
    if 'author' in request.args:
        query = query.filter(ResearchPaper.authors.contains(request.args['author']))
    
    if 'journal' in request.args:
        query = query.filter(ResearchPaper.journal.contains(request.args['journal']))
    
    if 'keyword' in request.args:
        query = query.filter(ResearchPaper.keywords.contains(request.args['keyword']))
    
    if 'search' in request.args:
        search_term = f"%{request.args['search']}%"
        query = query.filter(
            or_(
                ResearchPaper.title.like(search_term),
                ResearchPaper.authors.like(search_term),
                ResearchPaper.abstract.like(search_term)
            )
        )
    
    papers = query.order_by(ResearchPaper.created_at.desc()).all()
    
    return jsonify([paper.to_dict() for paper in papers]), 200


@app.route('/api/papers/<int:paper_id>', methods=['GET'])
@jwt_required()
def get_paper(paper_id):
    """Get a specific paper"""
    paper = ResearchPaper.query.get(paper_id)
    
    if not paper:
        return jsonify({'error': 'Paper not found'}), 404
    
    return jsonify(paper.to_dict()), 200


@app.route('/api/papers', methods=['POST'])
@jwt_required()
def create_paper():
    """Create a new paper"""
    current_user_identity = get_jwt_identity()
    
    # Get form data
    data = request.form.to_dict()
    
    # Handle PDF upload
    pdf_filename = None
    if 'pdf' in request.files:
        file = request.files['pdf']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to avoid conflicts
            filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            pdf_filename = filename
    
    # Create paper
    paper = ResearchPaper(
        title=data.get('title'),
        authors=data.get('authors'),
        year=int(data.get('year', 0)),
        month=data.get('month'),
        journal=data.get('journal'),
        volume=data.get('volume'),
        number=data.get('number'),
        pages=data.get('pages'),
        publisher=data.get('publisher'),
        doi=data.get('doi'),
        isbn=data.get('isbn'),
        issn=data.get('issn'),
        url=data.get('url'),
        abstract=data.get('abstract'),
        keywords=data.get('keywords'),
        note=data.get('note'),
        pdf_filename=pdf_filename,
        user_id=current_user_identity['id'],
        status='pending' if current_user_identity['role'] == 'user' else 'approved'
    )
    
    db.session.add(paper)
    db.session.commit()
    
    # If user is not admin, create approval request
    if current_user_identity['role'] == 'user':
        approval_request = ApprovalRequest(
            paper_id=paper.id,
            user_id=current_user_identity['id'],
            request_type='create'
        )
        db.session.add(approval_request)
        db.session.commit()
    
    return jsonify({
        'message': 'Paper created successfully' if current_user_identity['role'] == 'admin' else 'Paper submitted for approval',
        'paper': paper.to_dict()
    }), 201


@app.route('/api/papers/<int:paper_id>', methods=['PUT'])
@jwt_required()
def update_paper(paper_id):
    """Update a paper"""
    current_user_identity = get_jwt_identity()
    paper = ResearchPaper.query.get(paper_id)
    
    if not paper:
        return jsonify({'error': 'Paper not found'}), 404
    
    # Check permissions
    if current_user_identity['role'] != 'admin' and paper.user_id != current_user_identity['id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.form.to_dict()
    
    # Handle PDF upload
    if 'pdf' in request.files:
        file = request.files['pdf']
        if file and allowed_file(file.filename):
            # Delete old file if exists
            if paper.pdf_filename:
                old_file_path = os.path.join(app.config['UPLOAD_FOLDER'], paper.pdf_filename)
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
            
            filename = secure_filename(file.filename)
            filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            paper.pdf_filename = filename
    
    # Update fields
    for field in ['title', 'authors', 'year', 'month', 'journal', 'volume', 'number', 
                  'pages', 'publisher', 'doi', 'isbn', 'issn', 'url', 'abstract', 
                  'keywords', 'note']:
        if field in data:
            if field == 'year':
                setattr(paper, field, int(data[field]))
            else:
                setattr(paper, field, data[field])
    
    # If user is not admin, set status to pending
    if current_user_identity['role'] == 'user':
        paper.status = 'pending'
        # Create approval request
        approval_request = ApprovalRequest(
            paper_id=paper.id,
            user_id=current_user_identity['id'],
            request_type='update'
        )
        db.session.add(approval_request)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Paper updated successfully' if current_user_identity['role'] == 'admin' else 'Paper update submitted for approval',
        'paper': paper.to_dict()
    }), 200


@app.route('/api/papers/<int:paper_id>', methods=['DELETE'])
@jwt_required()
def delete_paper(paper_id):
    """Delete a paper"""
    current_user_identity = get_jwt_identity()
    paper = ResearchPaper.query.get(paper_id)
    
    if not paper:
        return jsonify({'error': 'Paper not found'}), 404
    
    # Only admin can delete
    if current_user_identity['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete associated approval requests first
    ApprovalRequest.query.filter_by(paper_id=paper_id).delete()
    
    # Delete PDF file if exists
    if paper.pdf_filename:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], paper.pdf_filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error deleting file: {e}")
    
    db.session.delete(paper)
    db.session.commit()
    
    return jsonify({'message': 'Paper deleted successfully'}), 200


@app.route('/api/papers/<int:paper_id>/pdf', methods=['GET'])
@jwt_required()
def get_paper_pdf(paper_id):
    """Get PDF file for a paper"""
    paper = ResearchPaper.query.get(paper_id)
    
    if not paper or not paper.pdf_filename:
        return jsonify({'error': 'PDF not found'}), 404
    
    return send_from_directory(app.config['UPLOAD_FOLDER'], paper.pdf_filename)


# ==================== USER ROUTES ====================

@app.route('/api/users/my-papers', methods=['GET'])
@jwt_required()
def get_my_papers():
    """Get papers uploaded by current user"""
    current_user_identity = get_jwt_identity()
    papers = ResearchPaper.query.filter_by(user_id=current_user_identity['id']).order_by(ResearchPaper.created_at.desc()).all()
    
    return jsonify([paper.to_dict() for paper in papers]), 200


# ==================== ADMIN ROUTES ====================

@app.route('/api/admin/approval-requests', methods=['GET'])
@jwt_required()
def get_approval_requests():
    """Get all pending approval requests (admin only)"""
    current_user_identity = get_jwt_identity()
    
    if current_user_identity['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    status = request.args.get('status', 'pending')
    requests = ApprovalRequest.query.filter_by(status=status).order_by(ApprovalRequest.created_at.desc()).all()
    
    return jsonify([req.to_dict() for req in requests]), 200


@app.route('/api/admin/approval-requests/<int:request_id>', methods=['PUT'])
@jwt_required()
def handle_approval_request(request_id):
    """Approve or reject an approval request (admin only)"""
    current_user_identity = get_jwt_identity()
    
    if current_user_identity['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    approval_request = ApprovalRequest.query.get(request_id)
    
    if not approval_request:
        return jsonify({'error': 'Request not found'}), 404
    
    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    
    if action not in ['approve', 'reject']:
        return jsonify({'error': 'Invalid action'}), 400
    
    approval_request.status = 'approved' if action == 'approve' else 'rejected'
    approval_request.reviewed_at = datetime.utcnow()
    approval_request.reviewed_by = current_user_identity['id']
    approval_request.admin_comment = data.get('comment', '')
    
    # Update paper status
    if action == 'approve':
        approval_request.paper.status = 'approved'
    else:
        approval_request.paper.status = 'rejected'
    
    db.session.commit()
    
    return jsonify({
        'message': f'Request {action}d successfully',
        'request': approval_request.to_dict()
    }), 200


@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    current_user_identity = get_jwt_identity()
    
    if current_user_identity['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    users = User.query.all()
    
    return jsonify([user.to_dict() for user in users]), 200


@app.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    """Update user role (admin only)"""
    current_user_identity = get_jwt_identity()
    
    if current_user_identity['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    new_role = data.get('role')
    
    if new_role not in ['admin', 'user']:
        return jsonify({'error': 'Invalid role'}), 400
    
    user.role = new_role
    db.session.commit()
    
    return jsonify({
        'message': 'User role updated successfully',
        'user': user.to_dict()
    }), 200


# ==================== STATISTICS ROUTES ====================

@app.route('/api/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    """Get statistics for dashboard"""
    current_user_identity = get_jwt_identity()
    
    # Total papers (approved only for users)
    if current_user_identity['role'] == 'admin':
        total_papers = ResearchPaper.query.count()
        pending_papers = ResearchPaper.query.filter_by(status='pending').count()
    else:
        total_papers = ResearchPaper.query.filter_by(status='approved').count()
        pending_papers = 0
    
    # Papers by year
    papers_by_year = db.session.query(
        ResearchPaper.year,
        func.count(ResearchPaper.id).label('count')
    ).filter(
        ResearchPaper.status == 'approved'
    ).group_by(ResearchPaper.year).order_by(ResearchPaper.year).all()
    
    # Papers this year
    current_year = datetime.now().year
    papers_this_year = ResearchPaper.query.filter(
        ResearchPaper.year == current_year,
        ResearchPaper.status == 'approved'
    ).count()
    
    # My papers (for users)
    my_papers_count = ResearchPaper.query.filter_by(user_id=current_user_identity['id']).count()
    
    # Pending approval requests
    if current_user_identity['role'] == 'admin':
        pending_approvals = ApprovalRequest.query.filter_by(status='pending').count()
    else:
        pending_approvals = ApprovalRequest.query.filter_by(
            user_id=current_user_identity['id'],
            status='pending'
        ).count()
    
    return jsonify({
        'total_papers': total_papers,
        'pending_papers': pending_papers,
        'papers_this_year': papers_this_year,
        'my_papers_count': my_papers_count,
        'pending_approvals': pending_approvals,
        'papers_by_year': [{'year': year, 'count': count} for year, count in papers_by_year]
    }), 200


# ==================== INITIALIZATION ====================

def init_db():
    """Initialize database and create tables"""
    with app.app_context():
        db.create_all()
        
        # Create default admin if not exists
        admin = User.query.filter_by(email=f'admin@{app.config["ALLOWED_EMAIL_DOMAIN"]}').first()
        if not admin:
            admin = User(
                email=f'admin@{app.config["ALLOWED_EMAIL_DOMAIN"]}',
                name='Admin',
                role='admin'
            )
            admin.set_password('admin123')  # Change this in production!
            db.session.add(admin)
            db.session.commit()
            print(f"Default admin created: admin@{app.config['ALLOWED_EMAIL_DOMAIN']} / admin123")


@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'Research Paper Database API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/*',
            'papers': '/api/papers/*',
            'admin': '/api/admin/*',
            'statistics': '/api/statistics'
        }
    }), 200


if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
