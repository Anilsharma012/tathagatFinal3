import React, { useState, useEffect, useRef } from "react";
import "./BlogManagement.css";
import { FaPlus, FaEdit, FaTrash, FaEye, FaStar, FaRegStar, FaSearch, FaTimes } from "react-icons/fa";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import http from "../../../utils/http";

const categories = ["CAT", "IPMAT", "CUET", "MBA", "B-Schools", "Info Exam", "Topper's Journey", "Other"];

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "CAT",
    content: "",
    excerpt: "",
    authorName: "TathaGat Faculty",
    isTopBlog: false,
    isPublished: true,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await http.get("/v5/admin/all");
      if (res.data?.success) {
        setBlogs(res.data.blogs || []);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleContentChange = (value) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "CAT",
      content: "",
      excerpt: "",
      authorName: "TathaGat Faculty",
      isTopBlog: false,
      isPublished: true,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: ""
    });
    setImageFile(null);
    setImagePreview("");
    setEditingBlog(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || "",
      category: blog.category || "CAT",
      content: blog.content || "",
      excerpt: blog.excerpt || "",
      authorName: blog.authorName || "TathaGat Faculty",
      isTopBlog: blog.isTopBlog || false,
      isPublished: blog.isPublished !== false,
      seoTitle: blog.seoTitle || "",
      seoDescription: blog.seoDescription || "",
      seoKeywords: Array.isArray(blog.seoKeywords) ? blog.seoKeywords.join(", ") : (blog.seoKeywords || "")
    });
    setImagePreview(blog.featureImage ? `${blog.featureImage}` : "");
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.content) {
      alert("Please fill title, category and content");
      return;
    }

    if (!editingBlog && !imageFile) {
      alert("Please select a feature image");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("category", formData.category);
      data.append("content", formData.content);
      data.append("excerpt", formData.excerpt);
      data.append("authorName", formData.authorName);
      data.append("isTopBlog", formData.isTopBlog);
      data.append("isPublished", formData.isPublished);
      data.append("seoTitle", formData.seoTitle);
      data.append("seoDescription", formData.seoDescription);
      data.append("seoKeywords", formData.seoKeywords);
      
      if (imageFile) {
        data.append("featureImage", imageFile);
      }

      let res;
      if (editingBlog) {
        res = await http.put(`/v5/update/${editingBlog._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        res = await http.post("/v5/create", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (res.data?.success) {
        alert(editingBlog ? "Blog updated successfully!" : "Blog created successfully!");
        setShowModal(false);
        resetForm();
        fetchBlogs();
      } else {
        alert(res.data?.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving blog:", error);
      alert(error.response?.data?.message || "Failed to save blog");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    
    try {
      const res = await http.delete(`/v5/delete/${id}`);
      if (res.data?.success) {
        alert("Blog deleted successfully!");
        fetchBlogs();
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog");
    }
  };

  const togglePublish = async (id) => {
    try {
      const res = await http.patch(`/v5/toggle-publish/${id}`);
      if (res.data?.success) {
        fetchBlogs();
      }
    } catch (error) {
      console.error("Error toggling publish:", error);
    }
  };

  const toggleTopBlog = async (id) => {
    try {
      const res = await http.patch(`/v5/toggle-top/${id}`);
      if (res.data?.success) {
        fetchBlogs();
      }
    } catch (error) {
      console.error("Error toggling top blog:", error);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || blog.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"]
    ]
  };

  return (
    <div className="blog-management">
      <div className="blog-header">
        <h1>Blog Management</h1>
        <button className="add-blog-btn" onClick={openCreateModal}>
          <FaPlus /> Add New Blog
        </button>
      </div>

      <div className="blog-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="category-filter"
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading blogs...</div>
      ) : (
        <div className="blog-table-container">
          <table className="blog-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th>Top Blog</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">No blogs found</td>
                </tr>
              ) : (
                filteredBlogs.map(blog => (
                  <tr key={blog._id}>
                    <td>
                      <img 
                        src={blog.featureImage} 
                        alt={blog.title} 
                        className="blog-thumb"
                        onError={(e) => { e.target.src = "/placeholder-blog.png"; }}
                      />
                    </td>
                    <td className="blog-title-cell">
                      <span className="blog-title-text">{blog.title}</span>
                    </td>
                    <td><span className="category-badge">{blog.category}</span></td>
                    <td>{blog.authorName || "TathaGat"}</td>
                    <td>
                      <button 
                        className={`status-btn ${blog.isPublished ? 'published' : 'draft'}`}
                        onClick={() => togglePublish(blog._id)}
                      >
                        {blog.isPublished ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td>
                      <button 
                        className="star-btn"
                        onClick={() => toggleTopBlog(blog._id)}
                        title={blog.isTopBlog ? "Remove from Top Blogs" : "Mark as Top Blog"}
                      >
                        {blog.isTopBlog ? <FaStar className="star-active" /> : <FaRegStar />}
                      </button>
                    </td>
                    <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button className="action-btn view" onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}>
                        <FaEye />
                      </button>
                      <button className="action-btn edit" onClick={() => openEditModal(blog)}>
                        <FaEdit />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(blog._id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="blog-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="blog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBlog ? "Edit Blog" : "Create New Blog"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="blog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter blog title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Author Name</label>
                  <input
                    type="text"
                    name="authorName"
                    value={formData.authorName}
                    onChange={handleInputChange}
                    placeholder="Author name"
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isTopBlog"
                      checked={formData.isTopBlog}
                      onChange={handleInputChange}
                    />
                    Mark as Top Blog
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={formData.isPublished}
                      onChange={handleInputChange}
                    />
                    Published
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Excerpt (Short Description)</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Brief summary of the blog (max 300 chars)"
                  maxLength={300}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Feature Image {!editingBlog && "*"}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                )}
              </div>

              <div className="form-group">
                <label>Content *</label>
                <ReactQuill
                  value={formData.content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  placeholder="Write your blog content here..."
                  className="content-editor"
                />
              </div>

              <div className="seo-section">
                <h3 className="seo-header">SEO Settings</h3>
                <p className="seo-description">Optimize your blog for search engines</p>
                
                <div className="form-group">
                  <label>SEO Title (max 70 characters)</label>
                  <input
                    type="text"
                    name="seoTitle"
                    value={formData.seoTitle}
                    onChange={handleInputChange}
                    placeholder="SEO optimized title for search engines"
                    maxLength={70}
                  />
                  <span className="char-count">{formData.seoTitle.length}/70</span>
                </div>

                <div className="form-group">
                  <label>SEO Description (max 160 characters)</label>
                  <textarea
                    name="seoDescription"
                    value={formData.seoDescription}
                    onChange={handleInputChange}
                    placeholder="Meta description for search engine results"
                    maxLength={160}
                    rows={3}
                  />
                  <span className="char-count">{formData.seoDescription.length}/160</span>
                </div>

                <div className="form-group">
                  <label>SEO Keywords (comma separated)</label>
                  <input
                    type="text"
                    name="seoKeywords"
                    value={formData.seoKeywords}
                    onChange={handleInputChange}
                    placeholder="CAT exam, MBA preparation, IIM admission"
                  />
                  <span className="seo-hint">Enter keywords separated by commas</span>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? "Saving..." : (editingBlog ? "Update Blog" : "Create Blog")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;
