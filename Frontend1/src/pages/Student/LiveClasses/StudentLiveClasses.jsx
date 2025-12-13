import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import "../../../components/LiveClasses/liveClasses.css";
import {
  fetchLiveClasses,
  downloadClassIcs,
} from "../../../utils/liveClassesApi";
import http from "../../../utils/http";
import { getCache, setCache } from "../../../utils/liveClassesCache";
import { downloadICS } from "../../../utils/ics";

const scope = "student";

const StudentLiveClasses = () => {
  const [tab, setTab] = useState("upcoming");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const selectedCourseRef = useRef(null);
  const abortControllerRef = useRef(null);
  const versionTimerRef = useRef(null);
  const versionRef = useRef(readVersion());
  const timersRef = useRef({});
  const [prefs, setPrefs] = useState(readPrefs());
  const [active, setActive] = useState(null);

  useEffect(() => {
    loadEnrolledCourses();
    return () => {
      clearAllTimers();
      stopVersionPolling();
    };
  }, []);
  useEffect(() => {
    scheduleReminders(items, prefs);
  }, [items, prefs]);
  useEffect(() => {
    selectedCourseRef.current = selectedCourse;
    if (selectedCourse) {
      fetchSessionsForCourse(selectedCourse);
      startVersionPolling();
    } else {
      stopVersionPolling();
    }
  }, [selectedCourse]);

  const [offline, setOffline] = useState(false);

  const loadEnrolledCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await http.get("/user/student/my-courses");
      const courses =
        res.data?.enrolledCourses ||
        res.data?.courses ||
        res.data?.enrollments ||
        [];
      const validCourses = courses
        .map((enr) => {
          const course =
            enr.courseId && typeof enr.courseId === "object"
              ? enr.courseId
              : enr;
          return {
            _id: course._id || enr.courseId,
            name: course.name || "Course",
            thumbnail: course.thumbnail,
            courseType: course.courseType,
          };
        })
        .filter((c) => c._id);
      setEnrolledCourses(validCourses);
    } catch (e) {
      console.error("Error loading enrolled courses:", e);
      toast.error("Failed to load courses");
    }
    setCoursesLoading(false);
  };

  const normalizeItem = (item, courseName) => {
    const dateStr = item.date ? item.date.split("T")[0] : null;
    let startDateTime = item.sessionStartTime || item.startTime;
    let endDateTime = item.sessionEndTime || item.endTime;

    if (
      dateStr &&
      item.startTime &&
      typeof item.startTime === "string" &&
      item.startTime.includes(":")
    ) {
      startDateTime = new Date(`${dateStr}T${item.startTime}:00`);
    }
    if (
      dateStr &&
      item.endTime &&
      typeof item.endTime === "string" &&
      item.endTime.includes(":")
    ) {
      endDateTime = new Date(`${dateStr}T${item.endTime}:00`);
    }

    return {
      _id: item._id,
      title: item.topic || item.title || "Live Session",
      startTime: startDateTime,
      endTime: endDateTime,
      joinLink: item.sessionLink || item.meetingLink || item.link,
      platform: item.platform || item.liveBatchId?.platform || "zoom",
      courseId: item.courseId || item.liveBatchId?.courseId,
      courseName:
        courseName ||
        item.liveBatchId?.subjectId?.name ||
        item.liveBatchId?.name ||
        "Session",
      batchName: item.liveBatchId?.name || "",
      description: item.description || item.notes,
      status: item.status || "scheduled",
      recordingUrl: item.recordingUrl || item.recordingLink,
      source: "livebatch",
    };
  };

  const fetchSessionsForCourse = async (course) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const courseId = course._id;

    console.log("Fetching sessions for course:", courseId, course.name);

    setLoading(true);
    setItems([]);
    try {
      const scheduleRes = await http.get(
        `/live-batches/student/schedule?courseId=${courseId}`,
        {
          signal: controller.signal,
        },
      );
      console.log("Schedule API response:", scheduleRes.data);

      if (selectedCourseRef.current?._id !== courseId) return;
      const data = scheduleRes.data;
      if (data?.success && data?.data) {
        const sessions = [
          ...(data.data.upcoming || []),
          ...(data.data.past || []),
        ];
        console.log("Raw sessions:", sessions);
        const normalized = sessions.map((session) =>
          normalizeItem(session, course.name),
        );
        console.log("Normalized sessions:", normalized);
        const uniqueItems = Array.from(
          new Map(normalized.map((item) => [item._id, item])).values(),
        );
        setItems(uniqueItems);
      }
    } catch (e) {
      if (e.name === "CanceledError" || e.name === "AbortError") return;
      console.error("Error fetching sessions:", e);
      toast.error("Failed to load live sessions");
    }
    if (selectedCourseRef.current?._id === courseId) {
      setLoading(false);
    }
  };

  const now = useMemo(() => new Date(), []);

  const upcomingItems = useMemo(() => {
    const nowTime = new Date();
    return items
      .filter((it) => {
        const endTime = it.endTime ? new Date(it.endTime) : null;
        return endTime && endTime > nowTime;
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [items]);

  const pastItems = useMemo(() => {
    const nowTime = new Date();
    return items
      .filter((it) => {
        const endTime = it.endTime ? new Date(it.endTime) : null;
        return !endTime || endTime <= nowTime;
      })
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [items]);

  const canJoin = (it) => {
    const now = new Date();
    const start = it.startTime ? new Date(it.startTime) : null;
    const end = it.endTime ? new Date(it.endTime) : null;
    if (!start || !end) return false;
    return (
      now >= new Date(start.getTime() - 10 * 60000) &&
      now <= new Date(end.getTime() + 30 * 60000)
    );
  };

  const isLive = (it) => {
    const now = new Date();
    const start = it.startTime ? new Date(it.startTime) : null;
    const end = it.endTime ? new Date(it.endTime) : null;
    if (!start || !end) return false;
    return now >= start && now <= end;
  };

  const countdown = (it) => {
    const now = new Date();
    const start = it.startTime ? new Date(it.startTime) : null;
    if (!start) return null;
    const diff = start - now;
    if (diff <= 0 || diff > 7 * 24 * 60 * 60000) return null;

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const clearAllTimers = () => {
    Object.values(timersRef.current).forEach((arr) =>
      arr.forEach((t) => clearTimeout(t)),
    );
    timersRef.current = {};
  };

  const scheduleReminders = (list, preferences) => {
    clearAllTimers();
    list.forEach((it) => {
      const pref = preferences[it._id];
      if (!pref || !pref.browser) return;
      const reminders = Array.isArray(it.reminders)
        ? it.reminders
        : [1440, 60, 10];
      const start = it.startTime ? new Date(it.startTime).getTime() : 0;
      const now = Date.now();
      const timers = [];
      reminders.forEach((mins) => {
        const t = start - mins * 60000 - now;
        if (t > 0 && t < 24 * 60 * 60000) {
          const id = setTimeout(
            () => toast.info(`Reminder: ${it.title} starts in ${mins} minutes`),
            t,
          );
          timers.push(id);
        }
      });
      timersRef.current[it._id] = timers;
    });
  };

  const downloadIcs = async (it) => {
    try {
      await downloadClassIcs(it._id, it.title);
    } catch {
      downloadICS({
        title: it.title,
        description: it.description,
        startTime: it.startTime,
        endTime: it.endTime,
        url: it.joinLink,
      });
    }
  };

  const onCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link || "");
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const onToggleReminder = async (it) => {
    const current = !!prefs[it._id]?.browser;
    const next = { ...prefs, [it._id]: { browser: !current } };
    setPrefs(next);
    writePrefs(next);
    toast.success(!current ? "Reminder enabled" : "Reminder disabled");
  };

  const openDetails = (it) => {
    setActive(it);
    markLastViewed();
  };
  const closeDetails = () => setActive(null);

  const fetchVersion = async () => {
    const r = await http.get("/live-classes/version");
    return Number(r?.data?.v || Date.now());
  };

  const startVersionPolling = () => {
    stopVersionPolling();
    versionTimerRef.current = setInterval(async () => {
      try {
        const v = await fetchVersion();
        if (v && v !== versionRef.current) {
          versionRef.current = v;
          writeVersion(v);
          if (selectedCourseRef.current)
            fetchSessionsForCourse(selectedCourseRef.current);
        }
      } catch {}
    }, 20000);
  };
  const stopVersionPolling = () => {
    if (versionTimerRef.current) {
      clearInterval(versionTimerRef.current);
      versionTimerRef.current = null;
    }
  };

  const mirrorStudentCache = (data, f) => {
    try {
      sessionStorage.setItem(
        "live:student:list:v1",
        JSON.stringify({ items: data, filters: f, ts: Date.now() }),
      );
    } catch {}
  };
  const markLastViewed = () => {
    try {
      sessionStorage.setItem("live:student:lastViewed:v1", String(Date.now()));
    } catch {}
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Date TBD";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPlatformLabel = (platform) => {
    const labels = {
      zoom: "Zoom",
      google_meet: "Google Meet",
      custom: "Custom Link",
    };
    return labels[platform] || platform || "Online";
  };

  const displayItems = tab === "upcoming" ? upcomingItems : pastItems;

  const goBackToCourses = () => {
    setSelectedCourse(null);
    setItems([]);
  };

  if (!selectedCourse) {
    return (
      <div className="lc-container">
        <h1 className="lc-page-title">Live Classes</h1>
        <p style={{ color: "#666", marginBottom: "24px" }}>
          Select a course to view its live classes
        </p>

        {coursesLoading ? (
          <div className="lc-loading">
            <div className="lc-spinner"></div>
            <p>Loading your courses...</p>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="lc-empty">
            <div className="lc-empty-icon">📚</div>
            <h3>No Enrolled Courses</h3>
            <p>You need to enroll in a course to view live classes.</p>
          </div>
        ) : (
          <div className="lc-course-grid">
            {enrolledCourses.map((course) => (
              <div
                key={course._id}
                className="lc-course-card"
                onClick={() => setSelectedCourse(course)}
              >
                <div className="lc-course-thumbnail">
                  {course.thumbnail ? (
                    <img
                      src={`/uploads/${course.thumbnail}`}
                      alt={course.name}
                    />
                  ) : (
                    <div className="lc-course-placeholder">📖</div>
                  )}
                </div>
                <div className="lc-course-info">
                  <h3 className="lc-course-name-card">{course.name}</h3>
                  <span className="lc-course-type">
                    {course.courseType || "Course"}
                  </span>
                </div>
                <div className="lc-course-arrow">→</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lc-container">
      <div className="lc-breadcrumb">
        <button className="lc-back-btn" onClick={goBackToCourses}>
          ← Back to Courses
        </button>
        <span className="lc-current-course">{selectedCourse.name}</span>
      </div>

      <h1 className="lc-page-title">Live Classes</h1>

      <div className="lc-header">
        <div className="lc-tabs">
          <button
            className={`lc-tab ${tab === "upcoming" ? "active" : ""}`}
            onClick={() => setTab("upcoming")}
          >
            Upcoming ({upcomingItems.length})
          </button>
          <button
            className={`lc-tab ${tab === "past" ? "active" : ""}`}
            onClick={() => setTab("past")}
          >
            Past Classes ({pastItems.length})
          </button>
        </div>
        <div className="lc-actions">
          <button
            className="lc-btn"
            onClick={() => fetchSessionsForCourse(selectedCourse)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {offline && (
        <div className="lc-banner">Offline - showing cached data</div>
      )}

      {loading && items.length === 0 ? (
        <div className="lc-loading">
          <div className="lc-spinner"></div>
          <p>Loading live classes...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="lc-empty">
          <div className="lc-empty-icon">
            {tab === "upcoming" ? "📅" : "📼"}
          </div>
          <h3>
            {tab === "upcoming" ? "No Upcoming Classes" : "No Past Classes"}
          </h3>
          <p>
            {tab === "upcoming"
              ? "Live classes for this course will appear here when instructors schedule them."
              : "Completed classes for this course will appear here."}
          </p>
        </div>
      ) : (
        <div className="lc-card-list">
          {displayItems.map((it) => (
            <div
              key={it._id}
              className={`lc-card ${isLive(it) ? "live-now" : ""}`}
            >
              <div className="lc-card-header" onClick={() => openDetails(it)}>
                <div className="lc-title">{it.title}</div>
                <div className="lc-badges-row">
                  <span className={`lc-badge ${it.platform}`}>
                    {getPlatformLabel(it.platform)}
                  </span>
                  {isLive(it) && (
                    <span className="lc-badge live">LIVE NOW</span>
                  )}
                  {it.status === "completed" && (
                    <span className="lc-badge completed">Completed</span>
                  )}
                </div>
              </div>

              {it.batchName && (
                <div className="lc-batch-name">{it.batchName}</div>
              )}

              <div className="lc-schedule">
                <span className="lc-date">{formatDate(it.startTime)}</span>
                <span className="lc-time">
                  {formatTime(it.startTime)} - {formatTime(it.endTime)}
                </span>
              </div>

              {tab === "upcoming" && countdown(it) && (
                <div className="lc-countdown">
                  <span className="lc-countdown-icon">⏰</span> Starts in{" "}
                  {countdown(it)}
                </div>
              )}

              <div className="lc-card-actions">
                {tab === "upcoming" ? (
                  <>
                    {canJoin(it) && it.joinLink ? (
                      <a
                        className="lc-btn primary"
                        href={it.joinLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {isLive(it) ? "Join Now" : "Join Class"}
                      </a>
                    ) : (
                      <span className="lc-btn link-coming-soon">
                        Link Coming Soon
                      </span>
                    )}
                    <button className="lc-btn" onClick={() => downloadIcs(it)}>
                      Add to Calendar
                    </button>
                    <button
                      className={`lc-btn ${prefs[it._id]?.browser ? "active" : ""}`}
                      onClick={() => onToggleReminder(it)}
                    >
                      {prefs[it._id]?.browser ? "🔔 On" : "🔕 Remind"}
                    </button>
                  </>
                ) : (
                  <>
                    {it.recordingUrl ? (
                      <a
                        className="lc-btn primary"
                        href={it.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Watch Recording
                      </a>
                    ) : (
                      <span className="lc-no-recording">
                        Recording not available
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="lc-modal-overlay" onClick={closeDetails}>
          <div className="lc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lc-modal-header">
              <h2>{active.title}</h2>
              <button className="lc-close" onClick={closeDetails}>
                ×
              </button>
            </div>
            <div className="lc-modal-body">
              <div className="lc-detail-row">
                <strong>Course:</strong> {active.courseName}
              </div>
              {active.batchName && (
                <div className="lc-detail-row">
                  <strong>Batch:</strong> {active.batchName}
                </div>
              )}
              <div className="lc-detail-row">
                <strong>Date:</strong> {formatDate(active.startTime)}
              </div>
              <div className="lc-detail-row">
                <strong>Time:</strong> {formatTime(active.startTime)} -{" "}
                {formatTime(active.endTime)}
              </div>
              <div className="lc-detail-row">
                <strong>Platform:</strong> {getPlatformLabel(active.platform)}
              </div>
              {active.description && (
                <div className="lc-detail-row">
                  <strong>Description:</strong>
                  <p>{active.description}</p>
                </div>
              )}
              {countdown(active) && (
                <div className="lc-countdown">
                  Starts in {countdown(active)}
                </div>
              )}
            </div>
            <div className="lc-modal-footer">
              {canJoin(active) && active.joinLink ? (
                <a
                  className="lc-btn primary"
                  href={active.joinLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {isLive(active) ? "Join Now" : "Join Class"}
                </a>
              ) : (
                <span className="lc-btn link-coming-soon">
                  Link Coming Soon
                </span>
              )}
              <button className="lc-btn" onClick={() => downloadIcs(active)}>
                Add to Calendar
              </button>
              <button className="lc-btn" onClick={closeDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PREF_KEY = "live_classes_notify_prefs";
const readPrefs = () => {
  try {
    return JSON.parse(sessionStorage.getItem(PREF_KEY)) || {};
  } catch {
    return {};
  }
};
const writePrefs = (p) => {
  try {
    sessionStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {}
};

const V_KEY = "live:classes:version:v1";
const readVersion = () => {
  try {
    return Number(sessionStorage.getItem(V_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeVersion = (v) => {
  try {
    sessionStorage.setItem(V_KEY, String(v));
  } catch {}
};

export default StudentLiveClasses;
