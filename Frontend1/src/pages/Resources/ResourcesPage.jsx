import React, { useState, useEffect, useCallback } from 'react'
import "./Resources.css"
import ResourcesPageOne from '../../subpages/ResourcesPageOne/ResourcesPageOne';
import Chatbox from '../../components/Chat/Chatbox';

const videoLinks = [
  "J_QoDDzzbyI",
  "EHBQ3AJ-uEo",
  "IVnBi5uPHW0",
  "6X9qoILmlVs",
  "1x9lbk01Tn4",
  "VJK19CuaI9g"
];

const filters = [
  "CAT 2023 Slot 1, 2, 3 - With Solutions",
  "CAT 2023 Slot 1, 2, 3 - With Solutions",
  "CAT 2022 Slot 1, 2, 3 - With & Without Solutions",
  "CAT 2022 Slot 1, 2, 3 - With & Without Solutions",
  "CAT 2022 Slot 1, 2, 3 - With & Without Solutions",
];

const ResourcesPage = () => {
  const [activeCategory, setActiveCategory] = useState('All Category');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  const categories = ['All Category', 'Study Materials', 'Video Lectures', 'Previous Year Papers'];

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 12
      });
      
      if (activeCategory !== 'All Category') {
        params.append('category', activeCategory);
      }

      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/study-materials/student?${params}`, {
        headers
      });

      const data = await response.json();

      if (data.success) {
        setMaterials(data.data || []);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.pagination.total,
            pages: data.pagination.pages
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, pagination.page]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDownload = async (materialId, fileName) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to download materials');
      return;
    }

    try {
      const response = await fetch(`/api/study-materials/download/${materialId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF': return '\uD83D\uDCC4';
      case 'Video': return '\uD83C\uDFA5';
      case 'Practice Sets': return '\uD83D\uDCDD';
      case 'Notes': return '\uD83D\uDCD6';
      default: return '\uD83D\uDCC1';
    }
  };

  const getCategoryDescription = () => {
    switch (activeCategory) {
      case 'Study Materials':
        return {
          tag: 'STUDY MATERIALS',
          heading: 'Strengthen Your Basics and Master Every Concept',
          description: 'Our comprehensive study material covers all major sections - Quantitative Aptitude, Verbal Ability, Logical Reasoning, and Data Interpretation. Whether you are starting fresh or refining your skills, these materials provide clear explanations, solved examples, and practice sets designed by our expert faculty. Download topic-wise notes and concept sheets to make your learning efficient.'
        };
      case 'Video Lectures':
        return {
          tag: 'VIDEO LECTURES',
          heading: 'Learn from the Best, Anytime and Anywhere',
          description: 'Access our library of video lectures from expert faculty covering all topics in depth. From basic concepts to advanced problem-solving techniques, our video lessons are designed to make complex topics easy to understand.'
        };
      case 'Previous Year Papers':
        return {
          tag: 'PREVIOUS YEAR PAPERS',
          heading: 'Learn from the Past, Excel in the Future',
          description: 'Practice with actual exam papers from CAT, XAT, SNAP, GMAT and other major exams. Each paper comes with detailed solutions and answer keys to help you understand the exam pattern and improve your performance.'
        };
      default:
        return {
          tag: 'ALL RESOURCES',
          heading: 'Everything You Need to Excel',
          description: 'Browse our complete collection of study materials, video lectures, and previous year papers. Filter by category to find exactly what you need for your exam preparation journey.'
        };
    }
  };

  const categoryInfo = getCategoryDescription();

  const filteredMaterials = activeCategory === 'Video Lectures' 
    ? materials.filter(m => m.type === 'Video' || m.category === 'Video Lectures')
    : activeCategory === 'Previous Year Papers'
    ? materials.filter(m => m.category === 'Previous Year Papers')
    : activeCategory === 'Study Materials'
    ? materials.filter(m => m.category === 'Study Materials')
    : materials;

  return (
    <div>
      <div className="tf-resources-section">
        <div className="tf-resources-overlay">
          <div className="tf-resources-content">
            <div className="tf-left-section">
              <h1 className="tf-title">RESOURCES</h1>
              <button className="tf-enroll-btn">Enroll Now</button>
            </div>
            <div className="tf-right-section">
              <p>
                At Tathagat, we believe that the right guidance, the right practice, and the right strategy
                make all the difference. Here, you'll find carefully curated study material, mock tests,
                previous year papers, preparation strategies, video lectures, and much more - everything
                you need to excel in CAT, XAT, SNAP, GMAT, and beyond.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="tf-study-section">
        <div className="tf-top-filters">
          <div className="tf-buttons-left">
            {categories.map((category) => (
              <button
                key={category}
                className={`tf-btn ${activeCategory === category ? 'tf-btn-active' : ''}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="tf-filter-btn">
            <button className="tf-btn tf-icon-btn">Filter <span>&#128269;</span></button>
          </div>
        </div>

        <div className="tf-study-content">
          <div className="tf-left">
            <p className="tf-tag">{categoryInfo.tag}</p>
            <h2 className="tf-heading">{categoryInfo.heading}</h2>
          </div>
          <div className="tf-right">
            <p className="tf-description">{categoryInfo.description}</p>
          </div>
        </div>
      </div>

      <div className="tf-grid-wrapper">
        {loading ? (
          <div className="tf-loading">Loading materials...</div>
        ) : filteredMaterials.length === 0 ? (
          <div className="tf-no-materials">
            <p>No materials found for this category.</p>
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <div className="tf-grid-card" key={material._id}>
              <div className="tf-card-header">
                <div className="tf-icon-circle">{getFileIcon(material.type)}</div>
                <span className="tf-doc-type">{material.type || 'Document'}</span>
              </div>
              <h3 className="tf-doc-title">{material.title}</h3>
              <p className="tf-doc-desc">
                {material.description || 'No description available'}
              </p>
              <button 
                className="tf-download-btn"
                onClick={() => handleDownload(material._id, material.fileName)}
              >
                Download {material.type === 'PDF' ? 'PDF' : 'File'} {material.fileSize || ''} <span className="tf-download-icon">&#11015;&#65039;</span>
              </button>
            </div>
          ))
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="tf-pagination">
          <button 
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            className="tf-page-btn"
          >
            Previous
          </button>
          <span className="tf-page-info">Page {pagination.page} of {pagination.pages}</span>
          <button 
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            className="tf-page-btn"
          >
            Next
          </button>
        </div>
      )}

      {activeCategory === 'All Category' || activeCategory === 'Video Lectures' ? (
        <div className="tf-video-section">
          <div className="tf-video-header">
            <div>
              <h2 className="tf-video-title">Video Lectures</h2>
              <p className="tf-video-subtitle">Learn from the Best, Anytime and Anywhere</p>
            </div>
            <button className="tf-signup-btn">Sign Up</button>
          </div>

          <div className="tf-video-grid">
            {videoLinks.map((id, index) => (
              <a
                key={index}
                href={`https://www.youtube.com/watch?v=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tf-video-card"
              >
                <div className="tf-video-thumb">
                  <img
                    src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                    alt="Video thumbnail"
                  />
                  <div className="tf-play-icon">&#9654;</div>
                </div>
                <div className="tf-video-info">
                  <p className="tf-watch-label">Watch Video</p>
                  <h3 className="tf-video-desc">Why CAT from TathaGat is important?</h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {activeCategory === 'All Category' || activeCategory === 'Previous Year Papers' ? (
        <div className="tf-pyp-section">
          <div className="tf-pyp-heading">
            <h2 className="tf-pyp-title">Previous Year Papers</h2>
            <p className="tf-pyp-subtitle">Learn from the Past, Excel in the Future</p>
          </div>

          <div className="tf-pyp-grid">
            <div className="tf-pyp-filters">
              <h3>Available Papers</h3>
              <div className="tf-pyp-category">
                <div className="tf-category-header">CAT <span className="tf-dropdown-icon">&#8964;</span></div>
                {filters.map((item, idx) => (
                  <label key={idx} className="tf-checkbox">
                    <input type="checkbox" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>

              <div className="tf-pyp-category">XAT <span className="tf-dropdown-icon">&#8964;</span></div>
              <div className="tf-pyp-category">SNAP <span className="tf-dropdown-icon">&#8964;</span></div>
              <div className="tf-pyp-category">GMAT <span className="tf-dropdown-icon">&#8964;</span></div>
            </div>

            <div className="tf-pyp-cards">
              {materials.filter(m => m.category === 'Previous Year Papers').slice(0, 6).map((paper, idx) => (
                <div className="tf-paper-carding" key={paper._id || idx}>
                  <div className="tf-paper-top">
                    <span>{new Date(paper.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="tf-pages">{paper.fileSize || 'PDF'}</span>
                  </div>
                  <h4 className="tf-paper-title">{paper.title}</h4>
                  <div className="tf-tags">
                    {paper.tags && paper.tags.map((tag, index) => (
                      <span key={index} className="tf-tag">{tag}</span>
                    ))}
                    {(!paper.tags || paper.tags.length === 0) && (
                      <span className="tf-tag">{paper.subject || 'General'}</span>
                    )}
                  </div>
                  <div 
                    className="tf-download-icon" 
                    onClick={() => handleDownload(paper._id, paper.fileName)}
                    style={{ cursor: 'pointer' }}
                  >
                    &#11015;&#65039;
                  </div>
                </div>
              ))}
              {materials.filter(m => m.category === 'Previous Year Papers').length === 0 && (
                <div className="tf-no-papers">
                  <p>No previous year papers available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ResourcesPageOne/>
    </div>
  )
}

export default ResourcesPage
