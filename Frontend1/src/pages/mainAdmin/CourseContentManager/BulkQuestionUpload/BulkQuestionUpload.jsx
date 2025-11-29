import React, { useEffect, useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import { toast } from "react-toastify";
import "./BulkQuestionUpload.css";

const BulkQuestionUpload = () => {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tests, setTests] = useState([]);

  const [course, setCourse] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [test, setTest] = useState("");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    axios.get("/api/courses", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setCourses(res.data.courses || []));
  }, []);

  useEffect(() => {
    if (!course) {
      setSubjects([]);
      return;
    }
    axios.get(`/api/subjects/${course}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setSubjects(res.data.subjects || []));
  }, [course]);

  useEffect(() => {
    if (!subject) {
      setChapters([]);
      return;
    }
    axios.get(`/api/chapters/${subject}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setChapters(res.data.chapters || []));
  }, [subject]);

  useEffect(() => {
    if (!chapter) {
      setTopics([]);
      return;
    }
    axios.get(`/api/topics/${chapter}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setTopics(res.data.topics || []));
  }, [chapter]);

  useEffect(() => {
    if (!topic) {
      setTests([]);
      return;
    }
    axios.get(`/api/tests/${topic}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setTests(res.data.tests || []));
  }, [topic]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Parsed CSV:', results.data);
        setPreview(results.data.slice(0, 5));
      },
      error: (err) => {
        console.error('CSV parse error:', err);
        toast.error('Failed to parse CSV file');
      }
    });
  };

  const downloadDemoCSV = async () => {
    try {
      const response = await axios.get('/api/questions/demo-template', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const csvContent = Papa.unparse(response.data.demoData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'questions_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Demo CSV downloaded!');
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!test) {
      toast.error('Please select a test first');
      return;
    }

    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const questions = results.data.map(row => ({
              questionText: row.questionText || row['Question Text'] || row.question || '',
              optionA: row.optionA || row['Option A'] || row.A || '',
              optionB: row.optionB || row['Option B'] || row.B || '',
              optionC: row.optionC || row['Option C'] || row.C || '',
              optionD: row.optionD || row['Option D'] || row.D || '',
              correctOption: row.correctOption || row['Correct Option'] || row.answer || row.correct || '',
              explanation: row.explanation || row.Explanation || '',
              difficulty: row.difficulty || row.Difficulty || 'Medium',
              marks: row.marks || row.Marks || 2,
              negativeMarks: row.negativeMarks || row['Negative Marks'] || 0.66
            }));

            console.log('Sending questions:', questions);

            const response = await axios.post('/api/questions/bulk-upload', {
              testId: test,
              questions
            }, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
              setUploadResult({
                success: true,
                message: response.data.message,
                count: response.data.count
              });
              toast.success(`${response.data.count} questions uploaded successfully!`);
              setFile(null);
              setPreview([]);
            }
          } catch (err) {
            console.error('Upload error:', err);
            const errorData = err.response?.data;
            setUploadResult({
              success: false,
              message: errorData?.message || 'Upload failed',
              errors: errorData?.errors || []
            });
            toast.error(errorData?.message || 'Upload failed');
          } finally {
            setUploading(false);
          }
        },
        error: (err) => {
          console.error('CSV parse error:', err);
          toast.error('Failed to parse CSV file');
          setUploading(false);
        }
      });
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed');
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview([]);
    setUploadResult(null);
  };

  return (
    <div className="bulk-question-upload">
      <div className="bulk-upload-header">
        <h2>Bulk Question Upload</h2>
        <p>Upload multiple questions at once using a CSV file</p>
      </div>

      <div className="selection-section">
        <div className="form-row">
          <div className="form-group">
            <label>Select Course *</label>
            <select 
              value={course} 
              onChange={(e) => {
                setCourse(e.target.value);
                setSubject('');
                setChapter('');
                setTopic('');
                setTest('');
              }}
            >
              <option value="">-- Select Course --</option>
              {courses.filter(c => c.courseType === 'full_course').map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Subject *</label>
            <select 
              value={subject} 
              onChange={(e) => {
                setSubject(e.target.value);
                setChapter('');
                setTopic('');
                setTest('');
              }}
              disabled={!course}
            >
              <option value="">-- Select Subject --</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Select Chapter *</label>
            <select 
              value={chapter} 
              onChange={(e) => {
                setChapter(e.target.value);
                setTopic('');
                setTest('');
              }}
              disabled={!subject}
            >
              <option value="">-- Select Chapter --</option>
              {chapters.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Topic *</label>
            <select 
              value={topic} 
              onChange={(e) => {
                setTopic(e.target.value);
                setTest('');
              }}
              disabled={!chapter}
            >
              <option value="">-- Select Topic --</option>
              {topics.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Select Test *</label>
            <select 
              value={test} 
              onChange={(e) => setTest(e.target.value)}
              disabled={!topic}
            >
              <option value="">-- Select Test --</option>
              {tests.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="upload-section">
        <div className="template-download">
          <h3>Step 1: Download Template</h3>
          <p>Download the demo CSV file to see the required format</p>
          <button 
            className="btn-download"
            onClick={downloadDemoCSV}
          >
            Download Demo CSV
          </button>
        </div>

        <div className="file-upload">
          <h3>Step 2: Upload Your CSV</h3>
          <p>Select your CSV file with questions data</p>
          
          <div className="file-input-wrapper">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileSelect}
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="file-label">
              {file ? file.name : 'Choose CSV File'}
            </label>
          </div>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="preview-section">
          <h3>Preview (First 5 rows)</h3>
          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Option A</th>
                  <th>Option B</th>
                  <th>Option C</th>
                  <th>Option D</th>
                  <th>Correct</th>
                  <th>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td className="question-cell">{(row.questionText || row['Question Text'] || row.question || '').substring(0, 50)}...</td>
                    <td>{(row.optionA || row['Option A'] || row.A || '').substring(0, 20)}</td>
                    <td>{(row.optionB || row['Option B'] || row.B || '').substring(0, 20)}</td>
                    <td>{(row.optionC || row['Option C'] || row.C || '').substring(0, 20)}</td>
                    <td>{(row.optionD || row['Option D'] || row.D || '').substring(0, 20)}</td>
                    <td>{row.correctOption || row['Correct Option'] || row.answer || row.correct || ''}</td>
                    <td>{row.difficulty || row.Difficulty || 'Medium'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {uploadResult && (
        <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
          <h4>{uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}</h4>
          <p>{uploadResult.message}</p>
          {uploadResult.count && <p>Total questions uploaded: <strong>{uploadResult.count}</strong></p>}
          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="error-list">
              <h5>Errors:</h5>
              <ul>
                {uploadResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="action-buttons">
        <button 
          className="btn-upload"
          onClick={handleUpload}
          disabled={!test || !file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Questions'}
        </button>
        
        <button 
          className="btn-reset"
          onClick={resetForm}
          disabled={uploading}
        >
          Reset
        </button>
      </div>

      <div className="instructions">
        <h3>CSV Format Instructions</h3>
        <div className="instruction-content">
          <p><strong>Required Columns:</strong></p>
          <ul>
            <li><code>questionText</code> - The question text (required)</li>
            <li><code>optionA</code> - Option A text (required)</li>
            <li><code>optionB</code> - Option B text (required)</li>
            <li><code>optionC</code> - Option C text (required)</li>
            <li><code>optionD</code> - Option D text (required)</li>
            <li><code>correctOption</code> - A, B, C, or D (required)</li>
          </ul>
          <p><strong>Optional Columns:</strong></p>
          <ul>
            <li><code>explanation</code> - Explanation for the answer</li>
            <li><code>difficulty</code> - Easy, Medium, or Hard (default: Medium)</li>
            <li><code>marks</code> - Marks for correct answer (default: 2)</li>
            <li><code>negativeMarks</code> - Negative marks for wrong answer (default: 0.66)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BulkQuestionUpload;
