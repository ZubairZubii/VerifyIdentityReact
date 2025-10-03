import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import BackButton from '../components/BackButton';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SDBBODhuBK96kcAAMkjIQnHwxF1tHAccEqNpFmNtSrU3TVmouCSv1E2ADkReuOUp4kj4MaDgLwG4TCkMtdjkVr300SdbAF2wK';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Payment amount (you can make this dynamic)
const PAYMENT_AMOUNT = 5000; // $50.00 in cents

interface PaymentFormProps {
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  submissionId?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onPaymentSuccess, onPaymentError, submissionId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Update payment status in database immediately
        try {
          if (submissionId) {
            await fetch(`http://localhost:5000/api/submissions/${submissionId}/payment`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentStatus: 'completed',
                paymentIntentId: paymentIntent.id,
                paymentAmount: paymentIntent.amount
              }),
            });
          }
        } catch (updateError) {
          console.error('Error updating payment status:', updateError);
        }
        
        onPaymentSuccess();
      }
    } catch (err) {
      onPaymentError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-element-container">
        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
            fields: {
              billingDetails: 'auto'
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto'
            }
          }}
        />
      </div>
      
      {message && (
        <div className="payment-message error">
          <i className="fas fa-exclamation-circle"></i>
          {message}
        </div>
      )}

      <motion.button
        type="submit"
        className="payment-submit-button"
        disabled={!stripe || isProcessing}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <i className={`fas ${isProcessing ? 'fa-spinner fa-spin' : 'fa-credit-card'}`}></i>
        {isProcessing ? 'Processing Payment...' : `Pay $${(PAYMENT_AMOUNT / 100).toFixed(2)}`}
      </motion.button>
    </form>
  );
};

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get form data from location state
  const formData = location.state?.formData || {};

  useEffect(() => {
    // If no form data, redirect back to form
    if (!formData || Object.keys(formData).length === 0) {
      navigate('/form?type=residential');
      return;
    }

    // Create payment intent when component mounts
    createPaymentIntent();
  }, [formData, navigate]);

  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: PAYMENT_AMOUNT,
          currency: 'usd',
          metadata: {
            formType: formData.formType || 'unknown',
            fullName: formData.fullName || 'unknown',
            submissionId: location.state?.submissionId || ''
          }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setClientSecret(result.clientSecret);
      } else {
        setErrorMessage('Failed to initialize payment. Please try again.');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setErrorMessage('Network error. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowSuccess(true);
    // Redirect to success page after 2 seconds
    setTimeout(() => {
      navigate('/payment-success', { 
        state: { 
          formData,
          paymentAmount: PAYMENT_AMOUNT 
        } 
      });
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setErrorMessage(error);
    setShowError(true);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="page-container">
      <BackButton onBack={handleBackClick} />
      
      <motion.div
        className="payment-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="payment-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="payment-icon">
            <i className="fas fa-credit-card"></i>
          </div>
          <h1>Complete Your Payment</h1>
          <p>Secure payment processing powered by Stripe</p>
        </motion.div>

        <motion.div
          className="payment-summary"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>Order Summary</h3>
          <div className="summary-item">
            <span>Identity Verification Service</span>
            <span>${(PAYMENT_AMOUNT / 100).toFixed(2)}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>${(PAYMENT_AMOUNT / 100).toFixed(2)}</span>
          </div>
        </motion.div>

        <motion.div
          className="payment-form-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Payment Methods Info */}
          <div className="payment-methods-info">
            <h3>Payment Methods</h3>
            <p className="payment-methods-subtitle">
              This payment is implemented via <strong>Google Pay</strong> and <strong>Apple Pay</strong> for secure and fast checkout
            </p>
            <div className="payment-methods-badges">
              <div className="payment-badge apple-pay">
                <i className="fab fa-apple-pay"></i>
                <span>Apple Pay</span>
              </div>
              <div className="payment-badge google-pay">
                <i className="fab fa-google-pay"></i>
                <span>Google Pay</span>
              </div>
            </div>
            <p className="payment-methods-note">
              <strong>Apple Pay</strong> and <strong>Google Pay</strong> are available on supported devices for instant payment. 
              Your payment information is secure and encrypted through Stripe.
            </p>
          </div>

          {isLoading ? (
            <div className="payment-loading">
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
              <p>Initializing payment...</p>
            </div>
          ) : clientSecret ? (
            <Elements 
              stripe={stripePromise}
              options={{
                clientSecret: clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#8B45FF',
                    colorBackground: '#ffffff',
                    colorText: '#30313d',
                    colorDanger: '#df1b41',
                    fontFamily: 'system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px',
                  },
                  rules: {
                    '.Tab': {
                      border: '1px solid #e5e7eb',
                      boxShadow: 'none',
                      borderRadius: '8px',
                      margin: '0 4px',
                    },
                    '.Tab--selected': {
                      backgroundColor: '#8B45FF',
                      color: '#ffffff',
                      border: '1px solid #8B45FF',
                    },
                    '.Tab:hover': {
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #8B45FF',
                    },
                    '.Input': {
                      border: '1px solid #d1d5db',
                      boxShadow: 'none',
                    },
                    '.Input:focus': {
                      border: '1px solid #8B45FF',
                      boxShadow: '0 0 0 1px #8B45FF',
                    },
                    '.TabLabel': {
                      fontWeight: '600',
                      fontSize: '14px',
                    },
                    '.TabIcon': {
                      marginRight: '8px',
                    }
                  }
                }
              }}
            >
              <PaymentForm 
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                submissionId={location.state?.submissionId}
              />
            </Elements>
          ) : (
            <div className="payment-error">
              <i className="fas fa-exclamation-triangle"></i>
              <p>Failed to initialize payment. Please try again.</p>
              <button onClick={createPaymentIntent} className="retry-button">
                <i className="fas fa-redo"></i>
                Retry
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          className="payment-security"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="security-badges">
            <div className="security-badge">
              <i className="fas fa-shield-alt"></i>
              <span>256-bit SSL</span>
            </div>
            <div className="security-badge">
              <i className="fab fa-cc-stripe"></i>
              <span>Stripe Secure</span>
            </div>
            <div className="security-badge">
              <i className="fas fa-lock"></i>
              <span>PCI Compliant</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="success-popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="success-popup"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Payment Successful!</h3>
              <p>Your payment has been processed successfully. Redirecting...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Popup */}
      <AnimatePresence>
        {showError && (
          <motion.div
            className="success-popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowError(false)}
          >
            <motion.div
              className="success-popup error-popup"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="success-icon error-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h3>Payment Failed</h3>
              <p>{errorMessage}</p>
              <motion.button
                className="success-ok-button"
                onClick={() => setShowError(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentPage;

// Remove Stripe branding after page load
if (typeof window !== 'undefined') {
  const removeStripeBranding = () => {
    // Remove Stripe branding elements
    const stripeBrandLinks = document.querySelectorAll('[data-testid="stripe-brand-link"], a[href*="stripe.com"][target="_blank"]');
    stripeBrandLinks.forEach(element => {
      (element as HTMLElement).style.display = 'none';
      (element as HTMLElement).style.visibility = 'hidden';
      (element as HTMLElement).style.opacity = '0';
    });

    // Remove floating Stripe elements
    const floatingElements = document.querySelectorAll('div[style*="position: fixed"][style*="bottom"][style*="right"]');
    floatingElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      if (htmlElement.style.zIndex && parseInt(htmlElement.style.zIndex) > 1000) {
        htmlElement.style.display = 'none';
      }
    });
  };

  // Run after a delay to ensure Stripe elements are loaded
  setTimeout(removeStripeBranding, 2000);
  
  // Run periodically to catch dynamically added elements
  setInterval(removeStripeBranding, 3000);
}
