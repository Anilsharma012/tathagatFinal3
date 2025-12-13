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
    cinNumber: '',
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
    centreDetails: {
      name: '',
      address: '',
      city: '',
      state: '',
      stateCode: ''
    },
    taxSettings: {
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 18,
      defaultHsnCode: '999293'
    },
    authorizedSignatory: {
      name: '',
      designation: '',
      signatureImage: ''
    },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountHolderName: ''
    },
    termsAndConditions: '',
    footerNote: '',
    invoicePrefix: 'STX'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
        setSettings(prev => ({
          ...prev,
          ...response.data.settings,
          address: { ...prev.address, ...response.data.settings.address },
          centreDetails: { ...prev.centreDetails, ...response.data.settings.centreDetails },
          taxSettings: { ...prev.taxSettings, ...response.data.settings.taxSettings },
          authorizedSignatory: { ...prev.authorizedSignatory, ...response.data.settings.authorizedSignatory },
          bankDetails: { ...prev.bankDetails, ...response.data.settings.bankDetails }
        }));
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

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const isSignature = field === 'authorizedSignatory.signatureImage';
    if (isSignature) {
      setUploadingSignature(true);
    } else {
      setUploadingLogo(true);
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('/api/upload/image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.url) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          setSettings(prev => ({
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: response.data.url
            }
          }));
        } else {
          setSettings(prev => ({ ...prev, [field]: response.data.url }));
        }
        setMessage({ type: 'success', text: 'Image uploaded successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      if (isSignature) {
        setUploadingSignature(false);
      } else {
        setUploadingLogo(false);
      }
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
          <h1>Billing & Invoice Settings</h1>
          <p>Configure company details for tax invoices and receipts</p>
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
                <label>Invoice Prefix</label>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={settings.invoicePrefix}
                  onChange={handleChange}
                  placeholder="e.g., STX"
                />
              </div>
              <div className="form-group">
                <label>Company Logo</label>
                <div className="image-upload-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'companyLogo')}
                    id="logo-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logo-upload" className="upload-btn">
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </label>
                  {settings.companyLogo && (
                    <img src={settings.companyLogo} alt="Logo" className="preview-image" />
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Logo URL (or use upload)</label>
                <input
                  type="text"
                  name="companyLogo"
                  value={settings.companyLogo}
                  onChange={handleChange}
                  placeholder="Enter logo URL"
                />
              </div>
              <div className="form-group">
                <label>GSTIN</label>
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
              <div className="form-group">
                <label>CIN Number</label>
                <input
                  type="text"
                  name="cinNumber"
                  value={settings.cinNumber}
                  onChange={handleChange}
                  placeholder="e.g., U80904DL2021PTC123456"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Registered Office Address</h2>
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
            <h2>Centre/Branch Details (for invoices)</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Centre Name</label>
                <input
                  type="text"
                  name="centreDetails.name"
                  value={settings.centreDetails?.name || ''}
                  onChange={handleChange}
                  placeholder="e.g., Delhi Centre"
                />
              </div>
              <div className="form-group full-width">
                <label>Centre Address</label>
                <input
                  type="text"
                  name="centreDetails.address"
                  value={settings.centreDetails?.address || ''}
                  onChange={handleChange}
                  placeholder="Enter centre address"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="centreDetails.city"
                  value={settings.centreDetails?.city || ''}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="centreDetails.state"
                  value={settings.centreDetails?.state || ''}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
              </div>
              <div className="form-group">
                <label>State Code</label>
                <input
                  type="text"
                  name="centreDetails.stateCode"
                  value={settings.centreDetails?.stateCode || ''}
                  onChange={handleChange}
                  placeholder="e.g., 07 for Delhi"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Tax Settings</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>CGST Rate (%)</label>
                <input
                  type="number"
                  name="taxSettings.cgstRate"
                  value={settings.taxSettings?.cgstRate || 9}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  step="0.5"
                />
              </div>
              <div className="form-group">
                <label>SGST Rate (%)</label>
                <input
                  type="number"
                  name="taxSettings.sgstRate"
                  value={settings.taxSettings?.sgstRate || 9}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  step="0.5"
                />
              </div>
              <div className="form-group">
                <label>IGST Rate (%)</label>
                <input
                  type="number"
                  name="taxSettings.igstRate"
                  value={settings.taxSettings?.igstRate || 18}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  step="0.5"
                />
              </div>
              <div className="form-group">
                <label>Default HSN Code</label>
                <input
                  type="text"
                  name="taxSettings.defaultHsnCode"
                  value={settings.taxSettings?.defaultHsnCode || '999293'}
                  onChange={handleChange}
                  placeholder="e.g., 999293"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Authorized Signatory</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Signatory Name</label>
                <input
                  type="text"
                  name="authorizedSignatory.name"
                  value={settings.authorizedSignatory?.name || ''}
                  onChange={handleChange}
                  placeholder="Enter signatory name"
                />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  name="authorizedSignatory.designation"
                  value={settings.authorizedSignatory?.designation || ''}
                  onChange={handleChange}
                  placeholder="e.g., Director"
                />
              </div>
              <div className="form-group">
                <label>Signature Image</label>
                <div className="image-upload-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'authorizedSignatory.signatureImage')}
                    id="signature-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="signature-upload" className="upload-btn">
                    {uploadingSignature ? 'Uploading...' : 'Upload Signature'}
                  </label>
                  {settings.authorizedSignatory?.signatureImage && (
                    <img 
                      src={settings.authorizedSignatory.signatureImage} 
                      alt="Signature" 
                      className="preview-image signature-preview" 
                    />
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Signature URL (or use upload)</label>
                <input
                  type="text"
                  name="authorizedSignatory.signatureImage"
                  value={settings.authorizedSignatory?.signatureImage || ''}
                  onChange={handleChange}
                  placeholder="Enter signature image URL"
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
            <h2>Invoice Settings</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Terms & Conditions</label>
                <textarea
                  name="termsAndConditions"
                  value={settings.termsAndConditions}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter terms and conditions for invoices"
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
