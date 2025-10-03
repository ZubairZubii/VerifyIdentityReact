import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { paymentAmount } = location.state || {};

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleNewVerification = () => {
    navigate('/form?type=residential');
  };

  return (
    <div className="page-container">
      <BackButton onBack={handleBackToHome} />
      
      <motion.div
        className="success-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <i className="fas fa-check-circle"></i>
        </motion.div>

        <motion.h1
          className="success-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Payment Successful!
        </motion.h1>

        <motion.p
          className="success-message"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Your identity verification request has been submitted and payment processed successfully.
        </motion.p>

        <motion.div
          className="success-details"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="detail-item">
            <span className="detail-label">Transaction ID:</span>
            <span className="detail-value">TXN-{Date.now().toString().slice(-8)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Amount Paid:</span>
            <span className="detail-value">${((paymentAmount || 5000) / 100).toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value success-status">Completed</span>
          </div>
        </motion.div>

        <motion.div
          className="success-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            className="action-button primary"
            onClick={handleBackToHome}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className="fas fa-home"></i>
            Back to Home
          </motion.button>
          
          <motion.button
            className="action-button secondary"
            onClick={handleNewVerification}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className="fas fa-plus"></i>
            New Verification
          </motion.button>
        </motion.div>

        <motion.div
          className="success-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="info-card">
            <i className="fas fa-envelope"></i>
            <div>
              <h4>Confirmation Email</h4>
              <p>A confirmation email has been sent to your registered email address.</p>
            </div>
          </div>
          
          <div className="info-card">
            <i className="fas fa-clock"></i>
            <div>
              <h4>Processing Time</h4>
              <p>Your verification will be processed within 24-48 hours.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;

