# Research Paper Database

A full-stack web application for managing university research papers and publications.

## Features

- **Authentication**: Email-based authentication restricted to @spsu.ac.in domain
- **Role-Based Access**: Admin and User roles with different permissions
- **Paper Management**: Full CRUD operations on research papers (BibTeX format)
- **PDF Storage**: Upload and download research papers in PDF format
- **Approval Workflow**: User submissions require admin approval
- **Statistics Dashboard**: Visual analytics with charts and graphs
- **Filtering & Search**: Advanced search capabilities across papers

## Tech Stack

### Backend
- Python 3.13
- Flask (Web Framework)
- SQLAlchemy (ORM)
- SQLite (Database)
- JWT Authentication
- Flask-CORS

### Frontend
- React 18
- React Router (Navigation)
- Axios (HTTP Client)
- Recharts (Data Visualization)

## Project Structure

```
researchweb/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── config.py           # Configuration
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── uploads/           # PDF storage directory
│
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── context/       # Auth context
    │   ├── pages/         # Page components
    │   ├── services/      # API services
    │   └── App.js         # Main app component
    └── package.json       # Node dependencies
```

## Installation & Setup

### Prerequisites
- Python 3.13+
- Node.js 18+
- npm

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. The database will be automatically created on first run

4. Run the backend server:
```bash
python app.py
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## Default Credentials

### Admin Account
- Email: `admin@spsu.ac.in`
- Password: `admin123`

**Important**: Change the admin password after first login in production!

## Usage

### For Users
1. Register with your @spsu.ac.in email
2. Browse approved research papers
3. Apply filters to search papers
4. Upload your own papers (requires admin approval)
5. View statistics and analytics

### For Admins
1. Login with admin credentials
2. Manage all research papers (CRUD operations)
3. Approve/Reject user submissions
4. Manage user roles
5. View comprehensive statistics

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Papers
- `GET /api/papers` - Get all papers (with filters)
- `GET /api/papers/:id` - Get specific paper
- `POST /api/papers` - Create new paper
- `PUT /api/papers/:id` - Update paper
- `DELETE /api/papers/:id` - Delete paper (admin only)
- `GET /api/papers/:id/pdf` - Download PDF

### Admin
- `GET /api/admin/approval-requests` - Get approval requests
- `PUT /api/admin/approval-requests/:id` - Handle approval request
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role

### Statistics
- `GET /api/statistics` - Get dashboard statistics

## Database Schema

### Users Table
- id, email, password_hash, name, role, created_at

### Research Papers Table
- BibTeX fields: title, authors, year, month, journal, volume, number, pages
- Additional: publisher, doi, isbn, issn, url, abstract, keywords, note
- Metadata: user_id, status, pdf_filename, created_at, updated_at

### Approval Requests Table
- paper_id, user_id, request_type, status, admin_comment
- reviewed_at, reviewed_by

## Security Features

- JWT-based authentication
- Email domain restriction (@spsu.ac.in)
- Role-based access control
- Password hashing
- CORS protection
- File type validation for PDFs

## Future Enhancements

- Email notifications for approval status
- Advanced analytics with more chart types
- Export papers to BibTeX format
- Bulk upload capabilities
- User profile management
- Paper versioning
- Citation management

## Development Notes

- Backend runs on port 5000
- Frontend runs on port 3000
- SQLite database file: `research_papers.db`
- PDFs stored in `backend/uploads/` directory
- Maximum file size: 16MB

## Troubleshooting

### Backend Issues
- Ensure Python 3.13+ is installed
- Check if port 5000 is available
- Verify all dependencies are installed

### Frontend Issues
- Ensure Node.js 18+ is installed
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

### Database Issues
- Delete `research_papers.db` and restart backend to recreate
- Check file permissions for uploads directory

## License

This project is for educational purposes.
