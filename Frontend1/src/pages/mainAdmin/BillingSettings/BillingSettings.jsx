import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout/AdminLayout';
import axios from 'axios';
import './BillingSettings.css';

const BillingSettings = () => {
  const [settings, setSettings] = useState({
    companyName: '',
    companyLogo: '',
    gstNumber: '',
    panNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    phone: '',
    email: '',
    website: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountHolderName: ''
    },
    termsAndConditions: '',
    footerNote: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/billing-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching billing settings:', error);
      setMessage({ type: 'error', text: 'Failed to load billing settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put('/api/admin/billing-settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Billing settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error saving billing settings:', error);
      setMessage({ type: 'error', text: 'Failed to save billing settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="billing-settings-container">
          <div className="loading">Loading billing settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="billing-settings-container">
        <div className="billing-header">
          <h1>Billing Settings</h1>
          <p>Configure company details for invoices and receipts</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} className="billing-form">
          <div className="form-section">
            <h2>Company Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={settings.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
              </div>
              <div className="form-group">
                <label>Company Logo URL</label>
                <input
                  type="text"
                  name="companyLogo"
                  value={settings.companyLogo}
                  onChange={handleChange}
                  placeholder="Enter logo URL"
                />
              </div>
              <div className="form-group">
                <label>GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={settings.gstNumber}
                  onChange={handleChange}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                />
              </div>
              <div className="form-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={settings.panNumber}
                  onChange={handleChange}
                  placeholder="e.g., AAAAA0000A"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Contact Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="text"
                  name="website"
                  value={settings.website}
                  onChange={handleChange}
                  placeholder="Enter website URL"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Address</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={settings.address?.street || ''}
                  onChange={handleChange}
                  placeholder="Enter street address"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="address.city"
                  value={settings.address?.city || ''}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="address.state"
                  value={settings.address?.state || ''}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="address.pincode"
                  value={settings.address?.pincode || ''}
                  onChange={handleChange}
                  placeholder="Enter pincode"
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="address.country"
                  value={settings.address?.country || 'India'}
                  onChange={handleChange}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Bank Details (for invoices)</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankDetails.bankName"
                  value={settings.bankDetails?.bankName || ''}
                  onChange={handleChange}
                  placeholder="Enter bank name"
                />
              </div>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  name="bankDetails.accountHolderName"
                  value={settings.bankDetails?.accountHolderName || ''}
                  onChange={handleChange}
                  placeholder="Enter account holder name"
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="bankDetails.accountNumber"
                  value={settings.bankDetails?.accountNumber || ''}
                  onChange={handleChange}
                  placeholder="Enter account number"
                />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="bankDetails.ifscCode"
                  value={settings.bankDetails?.ifscCode || ''}
                  onChange={handleChange}
                  placeholder="Enter IFSC code"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Receipt Settings</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Terms & Conditions</label>
                <textarea
                  name="termsAndConditions"
                  value={settings.termsAndConditions}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter terms and conditions for receipts"
                />
              </div>
              <div className="form-group full-width">
                <label>Footer Note</label>
                <input
                  type="text"
                  name="footerNote"
                  value={settings.footerNote}
                  onChange={handleChange}
                  placeholder="e.g., Thank you for your purchase!"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default BillingSettings;
