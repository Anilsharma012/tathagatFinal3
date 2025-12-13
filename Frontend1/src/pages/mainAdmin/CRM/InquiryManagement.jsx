import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout/AdminLayout';
import crm from '../../../utils/crmApi';
import './crm.css';

const formTypes = [
  { key: 'all', label: 'All Inquiries', color: '#6366f1' },
  { key: 'contact', label: 'Contact Form', color: '#10b981' },
  { key: 'demo_reservation', label: 'Demo Reservation', color: '#f59e0b' },
  { key: 'guide_form', label: 'Guide Form', color: '#3b82f6' },
  { key: 'faq_question', label: 'FAQ Questions', color: '#ef4444' },
  { key: 'other', label: 'Other', color: '#6b7280' }
];

const InquiryManagement = () => {
  const [activeType, setActiveType] = useState('all');
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [activeType, search]);

  const fetchCounts = async () => {
    try {
      const { data } = await crm.get('/crm/leads/form-type-counts');
      if (data.success) {
        const total = Object.values(data.counts).reduce((a, b) => a + b, 0);
        setCounts({ ...data.counts, all: total });
      }
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let url = '/crm/leads';
      let params = { limit: 100 };
      
      if (activeType !== 'all') {
        url = `/crm/leads/by-type/${activeType}`;
      }
      if (search) params.search = search;
      
      const { data } = await crm.get(url, { params });
      if (data.success) {
        setLeads(data.leads || data.items || []);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) return;
    const headers = ['Name', 'Mobile', 'Email', 'Course Interest', 'Message', 'Form Type', 'Date'];
    const rows = leads.map(l => [
      l.name || '',
      l.mobile || '',
      l.email || '',
      l.courseInterest || '',
      (l.message || l.notes || '').replace(/,/g, ' '),
      l.formType || '',
      new Date(l.createdAt).toLocaleString()
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inquiries_${activeType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="crm-container">
        <div className="crm-header">
          <h1>Inquiry Management</h1>
          <p className="muted">View and manage all form submissions from the website</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {formTypes.map(ft => (
            <button
              key={ft.key}
              onClick={() => setActiveType(ft.key)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: activeType === ft.key ? `2px solid ${ft.color}` : '1px solid #e5e7eb',
                background: activeType === ft.key ? ft.color : '#fff',
                color: activeType === ft.key ? '#fff' : '#374151',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {ft.label}
              <span style={{
                background: activeType === ft.key ? 'rgba(255,255,255,0.3)' : '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                {counts[ft.key] || 0}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <button onClick={exportCSV} className="btn" style={{ background: '#10b981', color: '#fff' }}>
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="ph-banner" role="status">Loading inquiries...</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Interest</th>
                  <th>Message</th>
                  <th>Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l._id}>
                    <td><strong>{l.name}</strong></td>
                    <td>{l.mobile || '-'}</td>
                    <td>{l.email || '-'}</td>
                    <td>{l.courseInterest || '-'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.message || l.notes || '-'}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: formTypes.find(f => f.key === l.formType)?.color || '#6b7280',
                        color: '#fff'
                      }}>
                        {l.formType || 'other'}
                      </span>
                    </td>
                    <td>{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: '40px' }}>No inquiries found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InquiryManagement;
