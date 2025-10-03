import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminDashboardPage.css';

interface FormSubmission {
  _id: string;
  formType: 'residential' | 'commercial' | 'auto';
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  birthDate: string;
  aaaMembershipId: string;
  insurancePolicyNumber: string;
  ownerType: 'myself' | 'other';
  propertyType?: string;
  propertyAddress?: string;
  vin?: string;
  techId: string;
  status: 'submitted' | 'processing' | 'approved' | 'rejected' | 'completed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  emailSent: boolean;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalSubmissions: number;
  statsByType: Array<{
    _id: string;
    count: number;
    pending: number;
    processing: number;
    completed: number;
  }>;
  recentSubmissions: FormSubmission[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  businessIndustry?: string;
  companySize?: string;
  role: 'user' | 'admin' | 'partner';
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  statsByStatus: Array<{
    _id: string;
    count: number;
  }>;
  recentUsers: User[];
}

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'users'>('overview');
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    formType: '',
    status: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/stats/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch form submissions
  const fetchSubmissions = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.formType && { formType: filters.formType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/submissions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubmissions(data.data);
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
        } else {
          setError(data.message || 'Failed to fetch submissions');
        }
      } else {
        setError('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Network error while fetching submissions');
    } finally {
      setLoading(false);
    }
  };

  // Delete submission
  const deleteSubmission = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/submissions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSubmissions(prev => prev.filter(sub => sub._id !== id));
        setShowDeleteModal(false);
        setSubmissionToDelete(null);
        // Refresh stats
        fetchStats();
      } else {
        setError('Failed to delete submission');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      setError('Network error while deleting submission');
    }
  };

  // Update submission status
  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/submissions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        setSubmissions(prev => 
          prev.map(sub => 
            sub._id === id ? { ...sub, status: status as any } : sub
          )
        );
        // Refresh stats
        fetchStats();
      } else {
        setError('Failed to update submission status');
      }
    } catch (error) {
      console.error('Error updating submission status:', error);
      setError('Network error while updating submission');
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/stats/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Fetch users
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`http://localhost:5000/api/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
        } else {
          setError(data.message || 'Failed to fetch users');
        }
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error while fetching users');
    } finally {
      setLoading(false);
    }
  };

  // Update user status
  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        setUsers(prev => 
          prev.map(user => 
            user._id === userId ? { ...user, status: status as any } : user
          )
        );
        // Refresh stats
        fetchUserStats();
      } else {
        setError('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Network error while updating user');
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setUsers(prev => prev.filter(user => user._id !== userId));
        setShowDeleteModal(false);
        setSubmissionToDelete(null);
        // Refresh stats
        fetchUserStats();
      } else {
        setError('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Network error while deleting user');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSubmissions();
    fetchUserStats();
  }, []);

  useEffect(() => {
    fetchSubmissions(1);
  }, [filters]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1);
    }
  }, [activeTab, filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#3b82f6';
      case 'processing': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'completed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getFormTypeIcon = (formType: string) => {
    switch (formType) {
      case 'residential': return 'fa-home';
      case 'commercial': return 'fa-building';
      case 'auto': return 'fa-car';
      default: return 'fa-file';
    }
  };

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#ef4444';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getUserRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return 'fa-crown';
      case 'partner': return 'fa-handshake';
      case 'user': return 'fa-user';
      default: return 'fa-user';
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <div className="header-title">
            <i className="fas fa-tachometer-alt"></i>
            <h1>Admin Dashboard</h1>
          </div>
          <div className="header-subtitle">
            <p>Manage form submissions and user accounts</p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="dashboard-nav"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i>
          Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          <i className="fas fa-file-alt"></i>
          Form Submissions
        </button>
        <button
          className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <i className="fas fa-users"></i>
          Manage Users
        </button>
      </motion.div>

      {/* Content Area */}
      <div className="dashboard-content">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="overview-content"
            >
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-file-alt"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats?.totalSubmissions || 0}</h3>
                    <p>Total Submissions</p>
                  </div>
                </div>
                
                {stats?.statsByType.map((typeStat) => (
                  <div key={typeStat._id} className="stat-card">
                    <div className="stat-icon">
                      <i className={`fas ${getFormTypeIcon(typeStat._id)}`}></i>
                    </div>
                    <div className="stat-info">
                      <h3>{typeStat.count}</h3>
                      <p>{typeStat._id.charAt(0).toUpperCase() + typeStat._id.slice(1)} Forms</p>
                      <div className="stat-breakdown">
                        <span className="pending">{typeStat.pending} Pending</span>
                        <span className="processing">{typeStat.processing} Processing</span>
                        <span className="completed">{typeStat.completed} Completed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Submissions */}
              <div className="recent-submissions">
                <h2>Recent Submissions</h2>
                <div className="submissions-list">
                  {stats?.recentSubmissions.map((submission) => (
                    <div key={submission._id} className="submission-item">
                      <div className="submission-icon">
                        <i className={`fas ${getFormTypeIcon(submission.formType)}`}></i>
                      </div>
                      <div className="submission-info">
                        <h4>{submission.fullName}</h4>
                        <p>{submission.email}</p>
                        <span className="form-type">{submission.formType}</span>
                      </div>
                      <div className="submission-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(submission.status) }}
                        >
                          {submission.status}
                        </span>
                        <span className="submission-date">
                          {formatDate(submission.submittedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <motion.div
              key="submissions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="submissions-content"
            >
              {/* Filters */}
              <div className="filters-section">
                <div className="filters-row">
                  <div className="filter-group">
                    <label>Form Type:</label>
                    <select
                      value={filters.formType}
                      onChange={(e) => setFilters(prev => ({ ...prev, formType: e.target.value }))}
                    >
                      <option value="">All Types</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label>Status:</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">All Status</option>
                      <option value="submitted">Submitted</option>
                      <option value="processing">Processing</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div className="filter-group search-group">
                    <label>Search:</label>
                    <input
                      type="text"
                      placeholder="Search by name, email, or tech ID..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Submissions Table */}
              {loading ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading submissions...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>{error}</p>
                </div>
              ) : (
                <>
                  <div className="submissions-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Form Type</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Submitted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((submission) => (
                          <tr key={submission._id}>
                            <td>
                              <div className="form-type-cell">
                                <i className={`fas ${getFormTypeIcon(submission.formType)}`}></i>
                                {submission.formType}
                              </div>
                            </td>
                            <td>{submission.fullName}</td>
                            <td>{submission.email}</td>
                            <td>
                              <select
                                value={submission.status}
                                onChange={(e) => updateSubmissionStatus(submission._id, e.target.value)}
                                className="status-select"
                                style={{ backgroundColor: getStatusColor(submission.status) }}
                              >
                                <option value="submitted">Submitted</option>
                                <option value="processing">Processing</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            <td>
                              <span className={`payment-status ${submission.paymentStatus}`}>
                                {submission.paymentStatus}
                              </span>
                            </td>
                            <td>{formatDate(submission.submittedAt)}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="view-btn"
                                  onClick={() => setSelectedSubmission(submission)}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => {
                                    setSubmissionToDelete(submission._id);
                                    setShowDeleteModal(true);
                                  }}
                                  title="Delete Submission"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => fetchSubmissions(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                        Previous
                      </button>
                      
                      <span className="page-info">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => fetchSubmissions(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="users-content"
            >
              {/* User Statistics */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{userStats?.totalUsers || 0}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-user-check"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{userStats?.activeUsers || 0}</h3>
                    <p>Active Users</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-user-clock"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{userStats?.pendingUsers || 0}</h3>
                    <p>Pending Users</p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="filters-section">
                <div className="filters-row">
                  <div className="filter-group">
                    <label>Status:</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div className="filter-group search-group">
                    <label>Search:</label>
                    <input
                      type="text"
                      placeholder="Search by name, email, or company..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Users Table */}
              {loading ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading users...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>{error}</p>
                </div>
              ) : (
                <>
                  <div className="submissions-table">
                    <table>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Company</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Last Login</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user._id}>
                            <td>
                              <div className="user-info">
                                <div className="user-avatar">
                                  <i className="fas fa-user"></i>
                                </div>
                                <div className="user-details">
                                  <div className="user-name">{user.name}</div>
                                  <div className="user-email">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="company-info">
                                <div className="company-name">{user.companyName || 'Not provided'}</div>
                                <div className="company-industry">{user.businessIndustry || ''}</div>
                              </div>
                            </td>
                            <td>
                              <div className="role-cell">
                                <i className={`fas ${getUserRoleIcon(user.role)}`}></i>
                                {user.role}
                              </div>
                            </td>
                            <td>
                              <select
                                value={user.status}
                                onChange={(e) => updateUserStatus(user._id, e.target.value)}
                                className="status-select"
                                style={{ backgroundColor: getUserStatusColor(user.status) }}
                              >
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                            <td>
                              {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                            </td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="view-btn"
                                  onClick={() => setSelectedSubmission(user as any)}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => {
                                    setSubmissionToDelete(user._id);
                                    setShowDeleteModal(true);
                                  }}
                                  title="Delete User"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => fetchUsers(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                        Previous
                      </button>
                      
                      <span className="page-info">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => fetchUsers(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submission Details Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSubmission(null)}
          >
            <motion.div
              className="modal-content submission-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Submission Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedSubmission(null)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Form Type:</label>
                    <span className="form-type-badge">
                      <i className={`fas ${getFormTypeIcon(selectedSubmission.formType)}`}></i>
                      {selectedSubmission.formType}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <span>{selectedSubmission.fullName}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedSubmission.email}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedSubmission.phoneNumber}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Address:</label>
                    <span>{selectedSubmission.address}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Birth Date:</label>
                    <span>{selectedSubmission.birthDate}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>AAA Membership ID:</label>
                    <span>{selectedSubmission.aaaMembershipId}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Insurance Policy:</label>
                    <span>{selectedSubmission.insurancePolicyNumber}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Tech ID:</label>
                    <span>{selectedSubmission.techId}</span>
                  </div>
                  
                  {selectedSubmission.propertyType && (
                    <div className="detail-item">
                      <label>Property Type:</label>
                      <span>{selectedSubmission.propertyType}</span>
                    </div>
                  )}
                  
                  {selectedSubmission.propertyAddress && (
                    <div className="detail-item">
                      <label>Property Address:</label>
                      <span>{selectedSubmission.propertyAddress}</span>
                    </div>
                  )}
                  
                  {selectedSubmission.vin && (
                    <div className="detail-item">
                      <label>VIN:</label>
                      <span>{selectedSubmission.vin}</span>
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <label>Status:</label>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedSubmission.status) }}
                    >
                      {selectedSubmission.status}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Payment Status:</label>
                    <span className={`payment-status ${selectedSubmission.paymentStatus}`}>
                      {selectedSubmission.paymentStatus}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Email Sent:</label>
                    <span className={selectedSubmission.emailSent ? 'success' : 'error'}>
                      {selectedSubmission.emailSent ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Submitted:</label>
                    <span>{formatDate(selectedSubmission.submittedAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="modal-content delete-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Confirm Delete</h2>
              </div>
              
              <div className="modal-body">
                <p>Are you sure you want to delete this {activeTab === 'users' ? 'user' : 'submission'}? This action cannot be undone.</p>
              </div>
              
              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="delete-confirm-btn"
                  onClick={() => {
                    if (submissionToDelete) {
                      if (activeTab === 'users') {
                        deleteUser(submissionToDelete);
                      } else {
                        deleteSubmission(submissionToDelete);
                      }
                    }
                  }}
                >
                  <i className="fas fa-trash"></i>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardPage;
