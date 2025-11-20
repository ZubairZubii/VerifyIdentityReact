import dotenv from 'dotenv';
dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Create payment intent
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        service: 'identity-verification',
        ...metadata
      }
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Retrieve payment intent
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent: paymentIntent
    };
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Confirm payment intent
const confirmPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    return {
      success: true,
      paymentIntent: paymentIntent
    };
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create customer
const createCustomer = async (email, name, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        service: 'identity-verification',
        ...metadata
      }
    });

    return {
      success: true,
      customer: customer
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// List payment methods for customer
const listPaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return {
      success: true,
      paymentMethods: paymentMethods.data
    };
  } catch (error) {
    console.error('Error listing payment methods:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create setup intent for saving payment methods
const createSetupIntent = async (customerId) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return {
      success: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    };
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Webhook signature verification
const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return {
      success: true,
      event: event
    };
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Handle successful payment
const handleSuccessfulPayment = async (paymentIntent) => {
  try {
    console.log('Payment successful:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      customer: paymentIntent.customer
    });

    // Update form submission payment status
    if (paymentIntent.metadata && paymentIntent.metadata.submissionId) {
      const FormSubmission = require('./models/forms_model');
      const formController = require('./controllers/form_controller');
      
      try {
        const submission = await FormSubmission.findById(paymentIntent.metadata.submissionId);
        if (submission) {
          submission.paymentStatus = 'completed';
          submission.paymentIntentId = paymentIntent.id;
          submission.paymentAmount = paymentIntent.amount;
          submission.status = 'processing'; // Move to processing after payment
          await submission.save();
          
          console.log('Updated submission payment status:', submission._id);
          
          // Send confirmation email to user
          try {
            const emailResult = await formController.sendUserConfirmationEmail(submission._id);
            if (emailResult.success) {
              console.log('User confirmation email sent for submission:', submission._id);
            } else {
              console.error('Failed to send user confirmation email:', emailResult.error);
            }
          } catch (emailError) {
            console.error('Error sending user confirmation email:', emailError);
          }
        } else {
          console.log('Submission not found for payment:', paymentIntent.metadata.submissionId);
        }
      } catch (dbError) {
        console.error('Error updating submission payment status:', dbError);
      }
    }

    return {
      success: true,
      message: 'Payment processed successfully'
    };
  } catch (error) {
    console.error('Error handling successful payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Handle failed payment
const handleFailedPayment = async (paymentIntent) => {
  try {
    console.log('Payment failed:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      last_payment_error: paymentIntent.last_payment_error
    });

    // Here you can add additional logic like:
    // - Log the failure
    // - Send notification to admin
    // - Update database status

    return {
      success: true,
      message: 'Payment failure handled'
    };
  } catch (error) {
    console.error('Error handling failed payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  confirmPaymentIntent,
  createCustomer,
  listPaymentMethods,
  createSetupIntent,
  verifyWebhookSignature,
  handleSuccessfulPayment,
  handleFailedPayment
};
