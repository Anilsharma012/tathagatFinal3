const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Course = require('../models/Course');
const BillingSettings = require('../models/BillingSettings');
const { prepareInvoiceData, generateInvoicePdf } = require('../services/invoicePdfService');

router.get('/download/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id || req.user._id;

    const payment = await Payment.findOne({
      _id: paymentId,
      userId: userId,
      status: 'paid'
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or not authorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const course = await Course.findById(payment.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    let billingSettings = await BillingSettings.findOne({ isActive: true });
    if (!billingSettings) {
      billingSettings = {};
    }

    const invoiceData = prepareInvoiceData(payment, user, course, billingSettings);
    const pdfBuffer = await generateInvoicePdf(invoiceData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoiceData.invoiceNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice PDF',
      error: error.message
    });
  }
});

router.get('/preview/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id || req.user._id;

    const payment = await Payment.findOne({
      _id: paymentId,
      userId: userId,
      status: 'paid'
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or not authorized'
      });
    }

    const user = await User.findById(userId);
    const course = await Course.findById(payment.courseId);
    let billingSettings = await BillingSettings.findOne({ isActive: true });

    if (!billingSettings) {
      billingSettings = {};
    }

    const invoiceData = prepareInvoiceData(payment, user, course, billingSettings);

    res.json({
      success: true,
      invoiceData
    });

  } catch (error) {
    console.error('Error previewing invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview invoice',
      error: error.message
    });
  }
});

module.exports = router;
