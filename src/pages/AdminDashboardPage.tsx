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
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<FormSubmission | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    formType: '',
    status: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch recent submissions only
  const fetchRecentSubmissions = async () => {
    try {
      console.log('Fetching recent submissions...');
      
      // Try multiple endpoints to get data
      let submissionsData = [];
      
      // First try the debug endpoint
      try {
        const debugResponse = await fetch('http://localhost:5000/api/debug/submissions');
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          submissionsData = debugData.submissions || [];
          console.log('Got data from debug endpoint:', submissionsData.length);
        }
      } catch (e) {
        console.log('Debug endpoint failed, trying submissions endpoint...');
      }
      
      // If debug failed, try the submissions endpoint
      if (submissionsData.length === 0) {
        try {
          const submissionsResponse = await fetch('http://localhost:5000/api/submissions?limit=10');
          if (submissionsResponse.ok) {
            const submissionsDataResponse = await submissionsResponse.json();
            submissionsData = submissionsDataResponse.data || submissionsDataResponse || [];
            console.log('Got data from submissions endpoint:', submissionsData.length);
          }
        } catch (e) {
          console.log('Submissions endpoint failed');
        }
      }
      
      // Get recent submissions (last 5)
      const recent = submissionsData
        .sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0))
        .slice(0, 5);
      
      setRecentSubmissions(recent);
      console.log('Recent submissions set:', recent.length);
      
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
      setRecentSubmissions([]);
    }
  };

  // Fetch overview statistics - Simple approach
  const fetchOverviewStats = async () => {
    try {
      // Use the existing submissions data to calculate stats
      const totalSubmissions = submissions.length;
      const pendingSubmissions = submissions.filter(s => s.status === 'submitted').length;
      const completedSubmissions = submissions.filter(s => s.status === 'completed').length;
      
      // Calculate total revenue from completed payments
      const totalRevenue = submissions
        .filter(s => s.paymentStatus === 'completed' && s.paymentAmount)
        .reduce((sum, s) => sum + (s.paymentAmount || 0), 0);

      const stats = {
        totalSubmissions,
        pendingSubmissions,
        completedSubmissions,
        totalRevenue
      };

      setOverviewStats(stats);
      
    } catch (error) {
      console.error('Error calculating overview statistics:', error);
      // Set fallback data
      setOverviewStats({
        totalSubmissions: 0,
        pendingSubmissions: 0,
        completedSubmissions: 0,
        totalRevenue: 0
      });
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
      console.log('Fetching user stats with token:', !!token);
      
      const response = await fetch('http://localhost:5000/api/stats/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('User stats API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('User stats API response data:', data);
        if (data.success) {
          setUserStats(data.data);
        } else {
          console.error('User stats API error:', data.message);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('User stats API error:', errorData);
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

      console.log('Fetching users with params:', queryParams.toString());
      console.log('Token available:', !!token);

      const response = await fetch(`http://localhost:5000/api/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Users API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users API response data:', data);
        if (data.success) {
          setUsers(data.data);
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
          setError(null); // Clear any previous errors
        } else {
          setError(data.message || 'Failed to fetch users');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Users API error:', errorData);
        setError(errorData.message || 'Failed to fetch users');
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
        setUserToDelete(null);
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

  // Fetch submission details
  const fetchSubmissionDetails = async (submissionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/submissions/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubmissionDetails(data.data);
          console.log('Submission details loaded:', data.data);
        } else {
          setError(data.message || 'Failed to load submission details');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load submission details');
      }
    } catch (error) {
      console.error('Error fetching submission details:', error);
      setError('Network error while loading submission details');
    }
  };

  // Download attachment
  const downloadAttachment = async (submissionId: string, fieldName: string, filename: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/submissions/${submissionId}/download/${fieldName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Get the blob from the response
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('File downloaded successfully:', filename);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Network error while downloading file');
    }
  };

  useEffect(() => {
    fetchRecentSubmissions();
    fetchSubmissions();
    fetchUserStats();
  }, []);

  // Update stats when submissions change
  useEffect(() => {
    if (submissions.length > 0) {
      fetchOverviewStats();
    } else {
      // Set default stats even if no submissions
      setOverviewStats({
        totalSubmissions: 0,
        pendingSubmissions: 0,
        completedSubmissions: 0,
        totalRevenue: 0
      });
    }
  }, [submissions]);


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

              {/* Statistics Section */}
              <div className="statistics-section">
                <h2>Dashboard Statistics</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{overviewStats?.totalSubmissions || submissions.length || 0}</h3>
                      <p>Total Submissions</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-hourglass-half"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{overviewStats?.pendingSubmissions || submissions.filter(s => s.status === 'submitted').length || 0}</h3>
                      <p>Pending Review</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{overviewStats?.completedSubmissions || submissions.filter(s => s.status === 'completed').length || 0}</h3>
                      <p>Completed</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="stat-content">
                      <h3>${overviewStats?.totalRevenue ? (overviewStats.totalRevenue / 100).toFixed(2) : '0.00'}</h3>
                      <p>Total Revenue</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="recent-submissions">
                <div className="recent-submissions-header">
                  <h2>Recent Submissions</h2>
                  <button 
                    className="refresh-button"
                    onClick={fetchRecentSubmissions}
                    title="Refresh Recent Submissions"
                  >
                    <i className="fas fa-sync-alt"></i>
                    Refresh
                  </button>
                </div>
                
                {recentSubmissions && recentSubmissions.length > 0 ? (
                  <div className="submissions-list">
                    {recentSubmissions.map((submission, index) => (
                      <div key={submission._id || index} className="submission-item">
                        <div className="submission-icon">
                          <i className={`fas ${getFormTypeIcon(submission.formType)}`}></i>
                        </div>
                        <div className="submission-info">
                          <h4>{submission.fullName || 'Unknown User'}</h4>
                          <p>{submission.email || 'No email'}</p>
                          <span className="form-type">{submission.formType || 'Unknown'}</span>
                        </div>
                        <div className="submission-status">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(submission.status || 'submitted') }}
                          >
                            {submission.status || 'submitted'}
                          </span>
                          <span className="submission-date">
                            {formatDate(submission.submittedAt || submission.createdAt || new Date())}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-file-alt"></i>
                    <h3>No Recent Submissions</h3>
                    <p>No form submissions have been made yet.</p>
                    <button 
                      className="retry-button"
                      onClick={fetchRecentSubmissions}
                    >
                      <i className="fas fa-sync-alt"></i>
                      Refresh Data
                    </button>
                  </div>
                )}
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
                        onClick={() => fetchSubmissionDetails(submission._id)}
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
                  <button 
                    className="retry-button"
                    onClick={() => fetchUsers(1)}
                  >
                    <i className="fas fa-redo"></i>
                    Retry
                  </button>
                </div>
              ) : users.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-users"></i>
                  <h3>No Users Found</h3>
                  <p>No users match your current filters. Try adjusting your search criteria.</p>
                  <button 
                    className="retry-button"
                    onClick={() => {
                      setFilters({ formType: '', status: '', search: '' });
                      fetchUsers(1);
                    }}
                  >
                    <i className="fas fa-refresh"></i>
                    Clear Filters
                  </button>
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
                                  <div className="user-name">{user.name || 'Unknown'}</div>
                                  <div className="user-email">{user.email || 'No email'}</div>
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
                                {user.role || 'user'}
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
                                  onClick={() => setSelectedUser(user)}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => {
                                    setUserToDelete(user._id);
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

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              className="modal-content user-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>User Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="user-details-header">
                  <div className="user-avatar-large">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="user-basic-info">
                    <h3>{selectedUser.name || 'Unknown User'}</h3>
                    <p className="user-email">{selectedUser.email || 'No email'}</p>
                    <div className="user-status-badges">
                      <span 
                        className="role-badge"
                        style={{ backgroundColor: getUserStatusColor(selectedUser.role) }}
                      >
                        <i className={`fas ${getUserRoleIcon(selectedUser.role)}`}></i>
                        {selectedUser.role || 'user'}
                      </span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getUserStatusColor(selectedUser.status) }}
                      >
                        {selectedUser.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="details-grid">
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <span>{selectedUser.name || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedUser.email || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Phone Number:</label>
                    <span>{selectedUser.phoneNumber || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Company Name:</label>
                    <span>{selectedUser.companyName || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Business Industry:</label>
                    <span>{selectedUser.businessIndustry || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Company Size:</label>
                    <span>{selectedUser.companySize || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Website:</label>
                    <span>
                      {selectedUser.website ? (
                        <a href={selectedUser.website} target="_blank" rel="noopener noreferrer">
                          {selectedUser.website}
                        </a>
                      ) : 'Not provided'}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Description:</label>
                    <span>{selectedUser.description || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Email Verified:</label>
                    <span className={selectedUser.isEmailVerified ? 'success' : 'error'}>
                      {selectedUser.isEmailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Last Login:</label>
                    <span>{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Login Count:</label>
                    <span>{selectedUser.loginCount || 0}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Account Created:</label>
                    <span>{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Last Updated:</label>
                    <span>{formatDate(selectedUser.updatedAt)}</span>
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
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSubmissionToDelete(null);
                    setUserToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="delete-confirm-btn"
                  onClick={() => {
                    if (activeTab === 'users' && userToDelete) {
                      deleteUser(userToDelete);
                    } else if (activeTab === 'submissions' && submissionToDelete) {
                      deleteSubmission(submissionToDelete);
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

      {/* Submission Details Modal */}
      <AnimatePresence>
        {submissionDetails && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSubmissionDetails(null)}
          >
            <motion.div
              className="modal-content submission-details-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Submission Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setSubmissionDetails(null)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="submission-details-header">
                  <div className="submission-icon-large">
                    <i className={`fas ${getFormTypeIcon(submissionDetails.formType)}`}></i>
                  </div>
                  <div className="submission-basic-info">
                    <h3>{submissionDetails.fullName || 'Unknown User'}</h3>
                    <p className="submission-email">{submissionDetails.email || 'No email'}</p>
                    <div className="submission-status-badges">
                      <span 
                        className="form-type-badge"
                        style={{ backgroundColor: getStatusColor(submissionDetails.formType) }}
                      >
                        <i className={`fas ${getFormTypeIcon(submissionDetails.formType)}`}></i>
                        {submissionDetails.formType?.toUpperCase() || 'UNKNOWN'}
                      </span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(submissionDetails.status) }}
                      >
                        {submissionDetails.status || 'submitted'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="submission-details-grid">
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <span>{submissionDetails.fullName || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{submissionDetails.email || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Phone Number:</label>
                    <span>{submissionDetails.phoneNumber || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Address:</label>
                    <span>{submissionDetails.address || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Birth Date:</label>
                    <span>{submissionDetails.birthDate || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>AAA Membership ID:</label>
                    <span>{submissionDetails.aaaMembershipId || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Insurance Policy Number:</label>
                    <span>{submissionDetails.insurancePolicyNumber || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Owner Type:</label>
                    <span>{submissionDetails.ownerType || 'Not provided'}</span>
                  </div>
                  
                  {submissionDetails.ownerFullName && (
                    <div className="detail-item">
                      <label>Owner Full Name:</label>
                      <span>{submissionDetails.ownerFullName}</span>
                    </div>
                  )}
                  
                  {submissionDetails.ownerPhone && (
                    <div className="detail-item">
                      <label>Owner Phone:</label>
                      <span>{submissionDetails.ownerPhone}</span>
                    </div>
                  )}
                  
                  {submissionDetails.propertyType && (
                    <div className="detail-item">
                      <label>Property Type:</label>
                      <span>{submissionDetails.propertyType}</span>
                    </div>
                  )}
                  
                  {submissionDetails.propertyAddress && (
                    <div className="detail-item">
                      <label>Property Address:</label>
                      <span>{submissionDetails.propertyAddress}</span>
                    </div>
                  )}
                  
                  {submissionDetails.vin && (
                    <div className="detail-item">
                      <label>VIN:</label>
                      <span>{submissionDetails.vin}</span>
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <label>Tech ID:</label>
                    <span>{submissionDetails.techId || 'Not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Payment Status:</label>
                    <span className={submissionDetails.paymentStatus === 'completed' ? 'success' : 'error'}>
                      {submissionDetails.paymentStatus || 'pending'}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Submitted At:</label>
                    <span>{formatDate(submissionDetails.submittedAt)}</span>
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="attachments-section">
                  <h3>Attachments</h3>
                  <div className="attachments-grid">
                    {submissionDetails.licenseFront && (
                      <div className="attachment-item">
                        <div className="attachment-preview">
                          {submissionDetails.licenseFront.mimetype?.startsWith('image/') ? (
                            <img 
                              src={`data:${submissionDetails.licenseFront.mimetype};base64,${submissionDetails.licenseFront.data}`}
                              alt="License Front"
                              className="attachment-image"
                            />
                          ) : (
                            <div className="attachment-icon">
                              <i className="fas fa-id-card"></i>
                            </div>
                          )}
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name">License Front</span>
                          <span className="attachment-filename">{submissionDetails.licenseFront.originalname}</span>
                          <span className="attachment-size">({(submissionDetails.licenseFront.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          className="download-btn"
                          onClick={() => downloadAttachment(submissionDetails._id, 'licenseFront', submissionDetails.licenseFront.originalname)}
                          title="Download License Front"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    )}
                    
                    {submissionDetails.licenseBack && (
                      <div className="attachment-item">
                        <div className="attachment-preview">
                          {submissionDetails.licenseBack.mimetype?.startsWith('image/') ? (
                            <img 
                              src={`data:${submissionDetails.licenseBack.mimetype};base64,${submissionDetails.licenseBack.data}`}
                              alt="License Back"
                              className="attachment-image"
                            />
                          ) : (
                            <div className="attachment-icon">
                              <i className="fas fa-id-card"></i>
                            </div>
                          )}
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name">License Back</span>
                          <span className="attachment-filename">{submissionDetails.licenseBack.originalname}</span>
                          <span className="attachment-size">({(submissionDetails.licenseBack.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          className="download-btn"
                          onClick={() => downloadAttachment(submissionDetails._id, 'licenseBack', submissionDetails.licenseBack.originalname)}
                          title="Download License Back"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    )}
                    
                    {submissionDetails.proofOfResidency && (
                      <div className="attachment-item">
                        <div className="attachment-preview">
                          {submissionDetails.proofOfResidency.mimetype?.startsWith('image/') ? (
                            <img 
                              src={`data:${submissionDetails.proofOfResidency.mimetype};base64,${submissionDetails.proofOfResidency.data}`}
                              alt="Proof of Residency"
                              className="attachment-image"
                            />
                          ) : (
                            <div className="attachment-icon">
                              <i className="fas fa-home"></i>
                            </div>
                          )}
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name">Proof of Residency</span>
                          <span className="attachment-filename">{submissionDetails.proofOfResidency.originalname}</span>
                          <span className="attachment-size">({(submissionDetails.proofOfResidency.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          className="download-btn"
                          onClick={() => downloadAttachment(submissionDetails._id, 'proofOfResidency', submissionDetails.proofOfResidency.originalname)}
                          title="Download Proof of Residency"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    )}
                    
                    {submissionDetails.registration && (
                      <div className="attachment-item">
                        <div className="attachment-preview">
                          {submissionDetails.registration.mimetype?.startsWith('image/') ? (
                            <img 
                              src={`data:${submissionDetails.registration.mimetype};base64,${submissionDetails.registration.data}`}
                              alt="Registration"
                              className="attachment-image"
                            />
                          ) : (
                            <div className="attachment-icon">
                              <i className="fas fa-file-alt"></i>
                            </div>
                          )}
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name">Registration</span>
                          <span className="attachment-filename">{submissionDetails.registration.originalname}</span>
                          <span className="attachment-size">({(submissionDetails.registration.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          className="download-btn"
                          onClick={() => downloadAttachment(submissionDetails._id, 'registration', submissionDetails.registration.originalname)}
                          title="Download Registration"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    )}
                    
                    {submissionDetails.licensePlate && (
                      <div className="attachment-item">
                        <div className="attachment-preview">
                          {submissionDetails.licensePlate.mimetype?.startsWith('image/') ? (
                            <img 
                              src={`data:${submissionDetails.licensePlate.mimetype};base64,${submissionDetails.licensePlate.data}`}
                              alt="License Plate"
                              className="attachment-image"
                            />
                          ) : (
                            <div className="attachment-icon">
                              <i className="fas fa-car"></i>
                            </div>
                          )}
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name">License Plate</span>
                          <span className="attachment-filename">{submissionDetails.licensePlate.originalname}</span>
                          <span className="attachment-size">({(submissionDetails.licensePlate.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          className="download-btn"
                          onClick={() => downloadAttachment(submissionDetails._id, 'licensePlate', submissionDetails.licensePlate.originalname)}
                          title="Download License Plate"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    )}
                    
                    {submissionDetails.insuranceProof && (
                      <div className="attachment-item">
                        <div className="attachment-preview">
                          {submissionDetails.insuranceProof.mimetype?.startsWith('image/') ? (
                            <img 
                              src={`data:${submissionDetails.insuranceProof.mimetype};base64,${submissionDetails.insuranceProof.data}`}
                              alt="Insurance Proof"
                              className="attachment-image"
                            />
                          ) : (
                            <div className="attachment-icon">
                              <i className="fas fa-shield-alt"></i>
                            </div>
                          )}
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name">Insurance Proof</span>
                          <span className="attachment-filename">{submissionDetails.insuranceProof.originalname}</span>
                          <span className="attachment-size">({(submissionDetails.insuranceProof.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          className="download-btn"
                          onClick={() => downloadAttachment(submissionDetails._id, 'insuranceProof', submissionDetails.insuranceProof.originalname)}
                          title="Download Insurance Proof"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {!submissionDetails.licenseFront && !submissionDetails.licenseBack && 
                   !submissionDetails.proofOfResidency && !submissionDetails.registration && 
                   !submissionDetails.licensePlate && !submissionDetails.insuranceProof && (
                    <div className="no-attachments">
                      <i className="fas fa-file-slash"></i>
                      <p>No attachments available for this submission</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardPage;
