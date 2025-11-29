import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import http from '../../../utils/http';
import './LiveBatchManagement.css';

const LiveBatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [courseSubjectMap, setCourseSubjectMap] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('batches');
  
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [linkedCourses, setLinkedCourses] = useState([]);
  
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  const [batchForm, setBatchForm] = useState({
    name: '', courseId: '', subjectId: '', description: '', instructor: '', isActive: true
  });

  const [sessionForm, setSessionForm] = useState({
    topic: '', description: '', date: '', startTime: '', endTime: '',
    platform: 'zoom', meetingLink: '', meetingId: '', meetingPassword: '',
    recordingUrl: '', notes: ''
  });

  const [linkForm, setLinkForm] = useState({
    courseId: '', visibleFrom: '', visibleTill: ''
  });

  useEffect(() => {
    loadCourseSubjectMap();
    loadCourses();
    loadBatches();
  }, []);

  const loadCourseSubjectMap = async () => {
    try {
      const res = await http.get('/live-batches/course-subject-map');
      setCourseSubjectMap(res.data?.data || []);
    } catch (err) {
      console.error('Error loading course-subject map:', err);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await http.get('/live-batches/courses');
      setCourses(res.data?.data || []);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const getSubjectsForCourse = (courseId) => {
    const course = courseSubjectMap.find(c => c._id === courseId);
    return course?.subjects || [];
  };

  const handleCourseChange = (newCourseId) => {
    setBatchForm({
      ...batchForm,
      courseId: newCourseId,
      subjectId: '',
      instructor: ''
    });
  };

  const handleSubjectChange = (newSubjectId) => {
    const subjects = getSubjectsForCourse(batchForm.courseId);
    const subject = subjects.find(s => s._id === newSubjectId);
    setBatchForm({
      ...batchForm,
      subjectId: newSubjectId,
      instructor: subject?.instructor || ''
    });
  };

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await http.get('/live-batches/batches');
      setBatches(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const loadBatchDetails = async (batchId) => {
    try {
      const res = await http.get(`/live-batches/batches/${batchId}`);
      const data = res.data?.data || {};
      setSessions(data.sessions || []);
      setLinkedCourses(data.linkedCourses || []);
    } catch (err) {
      toast.error('Failed to load batch details');
    }
  };

  const selectBatch = (batch) => {
    setSelectedBatch(batch);
    loadBatchDetails(batch._id);
    setActiveTab('sessions');
  };

  const openBatchModal = (batch = null) => {
    if (batch) {
      setEditingBatch(batch);
      setBatchForm({
        name: batch.name || '',
        courseId: batch.courseId?._id || batch.courseId || '',
        subjectId: batch.subjectId?._id || batch.subjectId || '',
        description: batch.description || '',
        instructor: batch.instructor || '',
        isActive: batch.isActive !== false
      });
    } else {
      setEditingBatch(null);
      setBatchForm({ name: '', courseId: '', subjectId: '', description: '', instructor: '', isActive: true });
    }
    setShowBatchModal(true);
  };

  const saveBatch = async () => {
    if (!batchForm.name || !batchForm.courseId || !batchForm.subjectId) {
      toast.error('Name, Course and Subject are required');
      return;
    }
    try {
      if (editingBatch) {
        await http.put(`/live-batches/batches/${editingBatch._id}`, batchForm);
        toast.success('Batch updated');
      } else {
        await http.post('/live-batches/batches', batchForm);
        toast.success('Batch created');
      }
      setShowBatchModal(false);
      loadBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save batch');
    }
  };

  const deleteBatch = async (batch) => {
    if (!window.confirm(`Delete batch "${batch.name}"? This cannot be undone.`)) return;
    try {
      await http.delete(`/live-batches/batches/${batch._id}`);
      toast.success('Batch deleted');
      if (selectedBatch?._id === batch._id) {
        setSelectedBatch(null);
        setSessions([]);
        setLinkedCourses([]);
        setActiveTab('batches');
      }
      loadBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete batch');
    }
  };

  const openSessionModal = (session = null) => {
    if (session) {
      setEditingSession(session);
      setSessionForm({
        topic: session.topic || '',
        description: session.description || '',
        date: session.date ? session.date.split('T')[0] : '',
        startTime: session.startTime || '',
        endTime: session.endTime || '',
        platform: session.platform || 'zoom',
        meetingLink: session.meetingLink || '',
        meetingId: session.meetingId || '',
        meetingPassword: session.meetingPassword || '',
        recordingUrl: session.recordingUrl || '',
        notes: session.notes || ''
      });
    } else {
      setEditingSession(null);
      setSessionForm({
        topic: '', description: '', date: '', startTime: '', endTime: '',
        platform: 'zoom', meetingLink: '', meetingId: '', meetingPassword: '',
        recordingUrl: '', notes: ''
      });
    }
    setShowSessionModal(true);
  };

  const saveSession = async () => {
    if (!sessionForm.topic || !sessionForm.date || !sessionForm.startTime || !sessionForm.endTime) {
      toast.error('Topic, Date, Start Time and End Time are required');
      return;
    }
    try {
      const payload = { ...sessionForm, liveBatchId: selectedBatch._id };
      if (editingSession) {
        await http.put(`/live-batches/sessions/${editingSession._id}`, payload);
        toast.success('Session updated');
      } else {
        await http.post('/live-batches/sessions', payload);
        toast.success('Session created');
      }
      setShowSessionModal(false);
      loadBatchDetails(selectedBatch._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save session');
    }
  };

  const deleteSession = async (session) => {
    if (!window.confirm(`Delete session "${session.topic}"?`)) return;
    try {
      await http.delete(`/live-batches/sessions/${session._id}`);
      toast.success('Session deleted');
      loadBatchDetails(selectedBatch._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete session');
    }
  };

  const openLinkModal = () => {
    setLinkForm({ courseId: '', visibleFrom: '', visibleTill: '' });
    setShowLinkModal(true);
  };

  const linkCourse = async () => {
    if (!linkForm.courseId || !linkForm.visibleFrom) {
      toast.error('Course and Visible From date are required');
      return;
    }
    try {
      await http.post('/live-batches/batches/attach-courses', {
        liveBatchId: selectedBatch._id,
        courses: [{
          courseId: linkForm.courseId,
          visibleFrom: linkForm.visibleFrom,
          visibleTill: linkForm.visibleTill || null
        }]
      });
      toast.success('Course linked');
      setShowLinkModal(false);
      loadBatchDetails(selectedBatch._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to link course');
    }
  };

  const unlinkCourse = async (link) => {
    if (!window.confirm('Remove this course link?')) return;
    try {
      await http.delete(`/live-batches/batches/${selectedBatch._id}/courses/${link.courseId._id || link.courseId}`);
      toast.success('Course unlinked');
      loadBatchDetails(selectedBatch._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlink course');
    }
  };

  const availableCourses = useMemo(() => {
    const linkedIds = linkedCourses.map(l => l.courseId?._id || l.courseId);
    return courses.filter(c => !linkedIds.includes(c._id));
  }, [courses, linkedCourses]);

  const getStatusBadge = (status) => {
    const colors = {
      scheduled: '#3498db',
      live: '#e74c3c',
      completed: '#27ae60',
      cancelled: '#95a5a6'
    };
    return (
      <span style={{
        background: colors[status] || '#95a5a6',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="lbm-container">
      <div className="lbm-header">
        <h1>Live Batches Management</h1>
        <p className="lbm-subtitle">Manage live class batches, sessions, and course links</p>
      </div>

      <div className="lbm-tabs">
        <button 
          className={`lbm-tab ${activeTab === 'batches' ? 'active' : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          All Batches
        </button>
        {selectedBatch && (
          <>
            <button 
              className={`lbm-tab ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              Sessions ({sessions.length})
            </button>
            <button 
              className={`lbm-tab ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              Linked Courses ({linkedCourses.length})
            </button>
          </>
        )}
      </div>

      {activeTab === 'batches' && (
        <div className="lbm-section">
          <div className="lbm-section-header">
            <h2>Live Batches</h2>
            <button className="lbm-btn primary" onClick={() => openBatchModal()}>
              + Create Batch
            </button>
          </div>

          {loading ? (
            <div className="lbm-loading">Loading...</div>
          ) : batches.length === 0 ? (
            <div className="lbm-empty">No batches found. Create your first batch to get started.</div>
          ) : (
            <div className="lbm-grid">
              {batches.map(batch => (
                <div key={batch._id} className={`lbm-card ${!batch.isActive ? 'inactive' : ''}`}>
                  <div className="lbm-card-header">
                    <h3>{batch.courseId?.name || 'Course'}</h3>
                    {!batch.isActive && <span className="lbm-badge inactive">Inactive</span>}
                  </div>
                  <div className="lbm-card-body">
                    <p><strong>Subject:</strong> {batch.subjectId?.name || 'N/A'}</p>
                    <p><strong>Instructor:</strong> {batch.instructor || 'N/A'}</p>
                    <p><strong>Sessions:</strong> {batch.sessionCount || 0}</p>
                    <p><strong>Linked Courses:</strong> {batch.courseCount || 0}</p>
                    {batch.description && <p className="lbm-desc">{batch.description}</p>}
                  </div>
                  <div className="lbm-card-footer">
                    <button className="lbm-btn small" onClick={() => selectBatch(batch)}>
                      Manage
                    </button>
                    <button className="lbm-btn small secondary" onClick={() => openBatchModal(batch)}>
                      Edit
                    </button>
                    <button className="lbm-btn small danger" onClick={() => deleteBatch(batch)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && selectedBatch && (
        <div className="lbm-section">
          <div className="lbm-section-header">
            <div>
              <h2>Sessions for: {selectedBatch.name}</h2>
              <p className="lbm-subtitle">Subject: {selectedBatch.subjectId?.name}</p>
            </div>
            <button className="lbm-btn primary" onClick={() => openSessionModal()}>
              + Add Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="lbm-empty">No sessions yet. Add your first session.</div>
          ) : (
            <table className="lbm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Topic</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Recording</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, idx) => (
                  <tr key={session._id}>
                    <td>{session.sessionNumber || idx + 1}</td>
                    <td>{session.topic}</td>
                    <td>{new Date(session.date).toLocaleDateString()}</td>
                    <td>{session.startTime} - {session.endTime}</td>
                    <td>{session.platform}</td>
                    <td>{getStatusBadge(session.status)}</td>
                    <td>
                      {session.recordingUrl ? (
                        <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer">View</a>
                      ) : '-'}
                    </td>
                    <td>
                      <button className="lbm-btn small" onClick={() => openSessionModal(session)}>Edit</button>
                      <button className="lbm-btn small danger" onClick={() => deleteSession(session)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'courses' && selectedBatch && (
        <div className="lbm-section">
          <div className="lbm-section-header">
            <div>
              <h2>Linked Courses for: {selectedBatch.name}</h2>
              <p className="lbm-subtitle">Sessions will be visible to enrolled students based on visibility dates</p>
            </div>
            <button className="lbm-btn primary" onClick={openLinkModal}>
              + Link Course
            </button>
          </div>

          {linkedCourses.length === 0 ? (
            <div className="lbm-empty">No courses linked. Link a course to make sessions visible to students.</div>
          ) : (
            <table className="lbm-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Visible From</th>
                  <th>Visible Till</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {linkedCourses.map(link => (
                  <tr key={link._id}>
                    <td>{link.courseId?.name || 'Unknown Course'}</td>
                    <td>{new Date(link.visibleFrom).toLocaleDateString()}</td>
                    <td>{link.visibleTill ? new Date(link.visibleTill).toLocaleDateString() : 'No End Date'}</td>
                    <td>
                      <button className="lbm-btn small danger" onClick={() => unlinkCourse(link)}>Unlink</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showBatchModal && (
        <div className="lbm-modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="lbm-modal" onClick={e => e.stopPropagation()}>
            <div className="lbm-modal-header">
              <h3>{editingBatch ? 'Edit Batch' : 'Create New Batch'}</h3>
              <button className="lbm-close" onClick={() => setShowBatchModal(false)}>&times;</button>
            </div>
            <div className="lbm-modal-body">
              <div className="lbm-form-group">
                <label>Course *</label>
                <select
                  value={batchForm.courseId}
                  onChange={e => handleCourseChange(e.target.value)}
                >
                  <option value="">Select Course</option>
                  {courseSubjectMap.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lbm-form-group">
                <label>Subject *</label>
                <select
                  value={batchForm.subjectId}
                  onChange={e => handleSubjectChange(e.target.value)}
                  disabled={!batchForm.courseId}
                >
                  <option value="">Select Subject</option>
                  {getSubjectsForCourse(batchForm.courseId).map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.instructor ? `(Instructor: ${s.instructor})` : ''}
                    </option>
                  ))}
                </select>
                {!batchForm.courseId && (
                  <small style={{color: '#666', fontSize: '12px'}}>Select a course first to see subjects</small>
                )}
              </div>
              <div className="lbm-form-group">
                <label>Instructor</label>
                <input
                  type="text"
                  value={batchForm.instructor}
                  onChange={e => setBatchForm({...batchForm, instructor: e.target.value})}
                  placeholder="Instructor name (auto-filled from subject)"
                />
                {batchForm.instructor && (
                  <small style={{color: '#28a745', fontSize: '12px'}}>Auto-filled from subject. You can modify if needed.</small>
                )}
              </div>
              <div className="lbm-form-group">
                <label>Batch Name *</label>
                <input
                  type="text"
                  value={batchForm.name}
                  onChange={e => setBatchForm({...batchForm, name: e.target.value})}
                  placeholder="e.g., Quant Batch 1 - CAT 2030"
                />
              </div>
              <div className="lbm-form-group">
                <label>Description</label>
                <textarea
                  value={batchForm.description}
                  onChange={e => setBatchForm({...batchForm, description: e.target.value})}
                  placeholder="Batch description..."
                />
              </div>
              <div className="lbm-form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={batchForm.isActive}
                    onChange={e => setBatchForm({...batchForm, isActive: e.target.checked})}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="lbm-modal-footer">
              <button className="lbm-btn secondary" onClick={() => setShowBatchModal(false)}>Cancel</button>
              <button className="lbm-btn primary" onClick={saveBatch}>
                {editingBatch ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="lbm-modal-overlay" onClick={() => setShowSessionModal(false)}>
          <div className="lbm-modal large" onClick={e => e.stopPropagation()}>
            <div className="lbm-modal-header">
              <h3>{editingSession ? 'Edit Session' : 'Add New Session'}</h3>
              <button className="lbm-close" onClick={() => setShowSessionModal(false)}>&times;</button>
            </div>
            <div className="lbm-modal-body">
              <div className="lbm-form-row">
                <div className="lbm-form-group">
                  <label>Topic *</label>
                  <input
                    type="text"
                    value={sessionForm.topic}
                    onChange={e => setSessionForm({...sessionForm, topic: e.target.value})}
                    placeholder="Session topic"
                  />
                </div>
              </div>
              <div className="lbm-form-row three">
                <div className="lbm-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={e => setSessionForm({...sessionForm, date: e.target.value})}
                  />
                </div>
                <div className="lbm-form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={e => setSessionForm({...sessionForm, startTime: e.target.value})}
                  />
                </div>
                <div className="lbm-form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={e => setSessionForm({...sessionForm, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="lbm-form-row two">
                <div className="lbm-form-group">
                  <label>Platform</label>
                  <select
                    value={sessionForm.platform}
                    onChange={e => setSessionForm({...sessionForm, platform: e.target.value})}
                  >
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="youtube_live">YouTube Live</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="lbm-form-group">
                  <label>Meeting Link</label>
                  <input
                    type="url"
                    value={sessionForm.meetingLink}
                    onChange={e => setSessionForm({...sessionForm, meetingLink: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="lbm-form-row two">
                <div className="lbm-form-group">
                  <label>Meeting ID</label>
                  <input
                    type="text"
                    value={sessionForm.meetingId}
                    onChange={e => setSessionForm({...sessionForm, meetingId: e.target.value})}
                    placeholder="Meeting ID"
                  />
                </div>
                <div className="lbm-form-group">
                  <label>Meeting Password</label>
                  <input
                    type="text"
                    value={sessionForm.meetingPassword}
                    onChange={e => setSessionForm({...sessionForm, meetingPassword: e.target.value})}
                    placeholder="Password"
                  />
                </div>
              </div>
              <div className="lbm-form-group">
                <label>Recording URL (after class)</label>
                <input
                  type="url"
                  value={sessionForm.recordingUrl}
                  onChange={e => setSessionForm({...sessionForm, recordingUrl: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div className="lbm-form-group">
                <label>Description</label>
                <textarea
                  value={sessionForm.description}
                  onChange={e => setSessionForm({...sessionForm, description: e.target.value})}
                  placeholder="Session description..."
                />
              </div>
              <div className="lbm-form-group">
                <label>Notes</label>
                <textarea
                  value={sessionForm.notes}
                  onChange={e => setSessionForm({...sessionForm, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="lbm-modal-footer">
              <button className="lbm-btn secondary" onClick={() => setShowSessionModal(false)}>Cancel</button>
              <button className="lbm-btn primary" onClick={saveSession}>
                {editingSession ? 'Update' : 'Add Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkModal && (
        <div className="lbm-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="lbm-modal" onClick={e => e.stopPropagation()}>
            <div className="lbm-modal-header">
              <h3>Link Course to Batch</h3>
              <button className="lbm-close" onClick={() => setShowLinkModal(false)}>&times;</button>
            </div>
            <div className="lbm-modal-body">
              <div className="lbm-form-group">
                <label>Select Course *</label>
                <select
                  value={linkForm.courseId}
                  onChange={e => setLinkForm({...linkForm, courseId: e.target.value})}
                >
                  <option value="">Select Course</option>
                  {availableCourses.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.courseType?.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>
              <div className="lbm-form-group">
                <label>Visible From *</label>
                <input
                  type="date"
                  value={linkForm.visibleFrom}
                  onChange={e => setLinkForm({...linkForm, visibleFrom: e.target.value})}
                />
                <small>Sessions scheduled after this date will be visible to enrolled students</small>
              </div>
              <div className="lbm-form-group">
                <label>Visible Till (Optional)</label>
                <input
                  type="date"
                  value={linkForm.visibleTill}
                  onChange={e => setLinkForm({...linkForm, visibleTill: e.target.value})}
                />
                <small>Leave empty for no end date</small>
              </div>
            </div>
            <div className="lbm-modal-footer">
              <button className="lbm-btn secondary" onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button className="lbm-btn primary" onClick={linkCourse}>Link Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveBatchManagement;
