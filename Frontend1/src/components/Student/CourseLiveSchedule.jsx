import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import http from '../../utils/http';
import './CourseLiveSchedule.css';

const CourseLiveSchedule = ({ courseId }) => {
  const [schedule, setSchedule] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (courseId) {
      loadSchedule();
    }
  }, [courseId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await http.get(`/live-batches/student/schedule?courseId=${courseId}`);
      if (res.data?.success) {
        setSchedule({
          upcoming: res.data.data.upcoming || [],
          past: res.data.data.past || []
        });
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
      if (err.response?.status !== 403) {
        toast.error('Failed to load live class schedule');
      }
    } finally {
      setLoading(false);
    }
  };

  const canJoin = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const [endHour, endMin] = session.endTime.split(':').map(Number);
    
    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHour, startMin, 0, 0);
    
    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHour, endMin, 0, 0);
    
    const joinWindow = 10 * 60 * 1000;
    const graceWindow = 30 * 60 * 1000;
    
    return now >= new Date(startDateTime.getTime() - joinWindow) && 
           now <= new Date(endDateTime.getTime() + graceWindow);
  };

  const getTimeRemaining = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startHour, startMin] = session.startTime.split(':').map(Number);
    
    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHour, startMin, 0, 0);
    
    const diff = startDateTime - now;
    
    if (diff <= 0) return null;
    if (diff > 24 * 60 * 60 * 1000) return null;
    
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getStatusBadge = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const [endHour, endMin] = session.endTime.split(':').map(Number);
    
    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHour, startMin, 0, 0);
    
    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHour, endMin, 0, 0);
    
    if (now >= startDateTime && now <= endDateTime) {
      return <span className="cls-badge live">LIVE NOW</span>;
    }
    if (now < startDateTime) {
      return <span className="cls-badge scheduled">Scheduled</span>;
    }
    return <span className="cls-badge completed">Completed</span>;
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'zoom': return '📹';
      case 'google_meet': return '📺';
      case 'youtube_live': return '▶️';
      default: return '🎥';
    }
  };

  const displaySessions = activeTab === 'upcoming' ? schedule.upcoming : schedule.past;

  if (loading) {
    return (
      <div className="cls-container">
        <div className="cls-loading">Loading live class schedule...</div>
      </div>
    );
  }

  if (schedule.upcoming.length === 0 && schedule.past.length === 0) {
    return (
      <div className="cls-container">
        <div className="cls-empty">
          <div className="cls-empty-icon">📅</div>
          <h3>No Live Classes Scheduled</h3>
          <p>There are no live classes scheduled for this course yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cls-container">
      <div className="cls-header">
        <h2>Live Class Schedule</h2>
        <button className="cls-refresh-btn" onClick={loadSchedule}>
          Refresh
        </button>
      </div>

      <div className="cls-tabs">
        <button 
          className={`cls-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({schedule.upcoming.length})
        </button>
        <button 
          className={`cls-tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Sessions ({schedule.past.length})
        </button>
      </div>

      <div className="cls-sessions">
        {displaySessions.length === 0 ? (
          <div className="cls-no-sessions">
            {activeTab === 'upcoming' 
              ? 'No upcoming sessions scheduled.'
              : 'No past sessions available.'}
          </div>
        ) : (
          displaySessions.map(session => (
            <div key={session._id} className="cls-session-card">
              <div className="cls-session-header">
                <div className="cls-subject-name">
                  {session.liveBatchId?.subjectId?.name || 'Live Class'}
                </div>
                {getStatusBadge(session)}
              </div>
              
              <div className="cls-session-topic">
                {session.topic}
              </div>
              
              <div className="cls-session-info">
                <div className="cls-date-time">
                  <span className="cls-date">{formatDate(session.date)}</span>
                  <span className="cls-time">{session.startTime} - {session.endTime}</span>
                </div>
                <div className="cls-platform">
                  {getPlatformIcon(session.platform)} {session.platform}
                </div>
              </div>

              {getTimeRemaining(session) && (
                <div className="cls-countdown">
                  Starts in {getTimeRemaining(session)}
                </div>
              )}

              <div className="cls-session-actions">
                {activeTab === 'upcoming' ? (
                  <>
                    {canJoin(session) && session.meetingLink ? (
                      <a 
                        href={session.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="cls-btn primary"
                      >
                        Join Class
                      </a>
                    ) : (
                      <button className="cls-btn disabled" disabled>
                        {session.meetingLink ? 'Not Started Yet' : 'Link Not Available'}
                      </button>
                    )}
                    {session.meetingId && (
                      <button 
                        className="cls-btn secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(session.meetingId);
                          toast.success('Meeting ID copied');
                        }}
                      >
                        Copy Meeting ID
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {session.recordingUrl ? (
                      <a 
                        href={session.recordingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="cls-btn primary"
                      >
                        Watch Recording
                      </a>
                    ) : (
                      <span className="cls-no-recording">Recording not available</span>
                    )}
                  </>
                )}
              </div>

              {session.notes && (
                <div className="cls-session-notes">
                  <strong>Notes:</strong> {session.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseLiveSchedule;
