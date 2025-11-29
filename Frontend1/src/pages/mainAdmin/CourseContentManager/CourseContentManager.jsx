import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./CourseContentManager.css";
import { FaEdit, FaTrash, FaCopy } from "react-icons/fa";
import ChapterTab from "./ChapterTab/ChapterTab";
import TopicTab from "./TopicTab/TopicTab";
import AddTest from "./AddTest/AddTest";
import AddQuestion from "./AddQuestion/AddQuestion";
import BulkQuestionUpload from "./BulkQuestionUpload/BulkQuestionUpload";


const CourseContentManager = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [activeTab, setActiveTab] = useState("subject");
  
  // Copy subject modal state
  const [copyingSubject, setCopyingSubject] = useState(null);
  const [targetCourseId, setTargetCourseId] = useState("");
  const [isCopying, setIsCopying] = useState(false);

  // ✅ Fetch all courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get("/api/courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data.courses || []);
      } catch (error) {
        console.error("Error fetching courses", error);
      }
    };
    fetchCourses();
  }, []);

  // ✅ Fetch subjects when course selected
useEffect(() => {
  if (!selectedCourseId) return;
  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `/api/subjects/${selectedCourseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSubjects(res.data.subjects || []);
    } catch (error) {
      console.error("Error fetching subjects", error);
    }
  };
  fetchSubjects();
}, [selectedCourseId]);


  // ✅ Handle subject add
  const handleAddSubject = async () => {
    if (!subjectName || !selectedCourseId) return alert("Fill all fields!");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(
        "/api/subjects",
        {
          name: subjectName,
          courseId: selectedCourseId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("✅ Subject added!");
      console.log("Sending:", {
        courseId: selectedCourseId,
        name: subjectName,
      });

      setSubjectName("");
      // Force re-fetch all subjects for the selected course
      //   const refetch = async () => {
      //     const token = localStorage.getItem("adminToken");
      //     const res = await axios.get(
      //       `/api/subjects/${selectedCourseId}`,
      //       {
      //         headers: { Authorization: `Bearer ${token}` },
      //       }
      //     );
      //     setSubjects(res.data.subjects || []);
      //   };
      //   refetch();
      fetchSubjects();
    } catch (error) {
      console.error("Add subject failed", error);
      alert("Error adding subject");
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `/api/subjects/${selectedCourseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSubjects(res.data.subjects || []);
    } catch (error) {
      console.error("Error fetching subjects", error);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?"))
      return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`/api/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Subject deleted ✅");
      fetchSubjects();
    } catch (err) {
      alert("Delete failed");
      console.error(err);
    }
  };

  // Handle copy subject to another course
  const handleCopySubject = async () => {
    if (!targetCourseId) {
      alert("Please select a target course!");
      return;
    }
    
    setIsCopying(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(
        `/api/subjects/${copyingSubject._id}/copy`,
        { targetCourseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        const { counts, newSubjectName } = res.data.data;
        alert(
          `Subject "${newSubjectName}" copied successfully!\n\n` +
          `Copied:\n` +
          `- ${counts.chapters} Chapters\n` +
          `- ${counts.topics} Topics\n` +
          `- ${counts.tests} Tests\n` +
          `- ${counts.questions} Questions`
        );
        setCopyingSubject(null);
        setTargetCourseId("");
      }
    } catch (err) {
      console.error("Copy failed:", err);
      alert(err.response?.data?.message || "Failed to copy subject");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <AdminLayout>
      <div className="content-manager">
        <h2 className="page-title">📚 Course Content Manager</h2>

        {/* 🔥 Tabs for Subject & Chapter */}
        <div className="tab-buttons">
          <button
            className={activeTab === "subject" ? "active-tab" : ""}
            onClick={() => setActiveTab("subject")}
          >
            Subjects
          </button>
          <button
            className={activeTab === "chapter" ? "active-tab" : ""}
            onClick={() => setActiveTab("chapter")}
          >
            Chapters
          </button>
          <button
  className={activeTab === "topic" ? "active-tab" : ""}
  onClick={() => setActiveTab("topic")}
>
  Topics
</button>
<button
  className={activeTab === "test" ? "active-tab" : ""}
  onClick={() => setActiveTab("test")}
>
  Tests
</button>
<button
  className={activeTab === "question" ? "active-tab" : ""}
  onClick={() => setActiveTab("question")}
>
  Questions
</button>
<button
  className={activeTab === "bulkUpload" ? "active-tab" : ""}
  onClick={() => setActiveTab("bulkUpload")}
>
  Bulk Upload
</button>


        </div>

        {/* Course Dropdown */}
        <div className="form-group">
          <label>Select Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">-- Select Course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Subject Form */}
        {selectedCourseId && activeTab === "subject" && (
          <>
            <div className="form-group">
              <label>New Subject Name</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Enter subject name"
              />
              <button className="add-btn" onClick={handleAddSubject}>
                ➕ Add Subject
              </button>
            </div>

            {/* Subjects List */}
            <div className="table-wrapper">
              <h3>📖 Subjects List</h3>
              <table>
                <thead>
                  <tr>
                    <th>Sr.no</th>
                    <th>Subject Name</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub, idx) => (
                    <tr key={sub._id}>
                      <td>{idx + 1}</td>
                      <td>{sub.name}</td>
                      <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                      <td className="icon-actions">
                        <FaEdit
                          title="Edit"
                          style={{
                            cursor: "pointer",
                            marginRight: "10px",
                            color: "#007bff",
                          }}
                          onClick={() => {
                            setEditingSubject(sub);
                            setEditSubjectName(sub.name);
                          }}
                        />
                        <FaCopy
                          title="Copy to Another Course"
                          style={{
                            cursor: "pointer",
                            marginRight: "10px",
                            color: "#28a745",
                          }}
                          onClick={() => {
                            setCopyingSubject(sub);
                            setTargetCourseId("");
                          }}
                        />
                        <FaTrash
                          title="Delete"
                          style={{ cursor: "pointer", color: "red" }}
                          onClick={() => handleDeleteSubject(sub._id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {selectedCourseId && activeTab === "chapter" && (
          <ChapterTab selectedCourseId={selectedCourseId} />
        )}

        {selectedCourseId && activeTab === "topic" && (
        <TopicTab />
         )}
{selectedCourseId && activeTab === "test" && (
  <AddTest selectedCourseId={selectedCourseId} subjects={subjects} />
)}

{selectedCourseId && activeTab === "question" && (
  <AddQuestion selectedCourseId={selectedCourseId} subjects={subjects} />
)}

{activeTab === "bulkUpload" && (
  <BulkQuestionUpload />
)}

      </div>
      {editingSubject && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit Subject</h3>
            <input
              type="text"
              value={editSubjectName}
              onChange={(e) => setEditSubjectName(e.target.value)}
            />
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem("adminToken");
                  await axios.put(
                    `/api/subjects/${editingSubject._id}`,
                    {
                      name: editSubjectName,
                    },
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  );
                  alert("Subject updated ✅");
                  setEditingSubject(null);
                  fetchSubjects(); 
                } catch (err) {
                  console.error("Edit failed", err);
                  alert("Update failed");
                }
              }}
            >
              Update
            </button>
            <button onClick={() => setEditingSubject(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Copy Subject Modal */}
      {copyingSubject && (
        <div className="edit-modal">
          <div className="edit-modal-content" style={{ minWidth: '400px' }}>
            <h3>Copy Subject to Another Course</h3>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Copying: <strong>{copyingSubject.name}</strong>
            </p>
            <p style={{ marginBottom: '10px', fontSize: '14px', color: '#888' }}>
              This will copy all chapters, topics, tests, and questions to the selected course.
            </p>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Select Target Course:
            </label>
            <select
              value={targetCourseId}
              onChange={(e) => setTargetCourseId(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                marginBottom: '15px',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}
            >
              <option value="">-- Select Course --</option>
              {courses
                .filter(c => c._id !== selectedCourseId)
                .map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCopySubject}
                disabled={isCopying || !targetCourseId}
                style={{
                  backgroundColor: isCopying ? '#ccc' : '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isCopying ? 'not-allowed' : 'pointer'
                }}
              >
                {isCopying ? 'Copying...' : 'Copy Subject'}
              </button>
              <button 
                onClick={() => {
                  setCopyingSubject(null);
                  setTargetCourseId("");
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CourseContentManager;
