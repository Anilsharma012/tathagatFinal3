const mongoose = require('mongoose');

const BillingSettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Tathagat Education' },
  companyLogo: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    accountHolderName: { type: String, default: '' }
  },
  termsAndConditions: { type: String, default: '' },
  footerNote: { type: String, default: 'Thank you for your purchase!' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.BillingSettings || mongoose.model('BillingSettings', BillingSettingsSchema);
