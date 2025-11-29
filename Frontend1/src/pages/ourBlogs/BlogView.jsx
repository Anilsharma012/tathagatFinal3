import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaArrowLeft, FaUser, FaEye } from "react-icons/fa";
import http from "../../utils/http";
import LazyImage from "../../components/LazyImage/LazyImage";
import FAQ from "../../components/FAQ/FAQ";
import "./BlogView.css";

const BlogView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await http.get(`/v5/slug/${slug}`);
        if (res.data?.success) {
          setBlog(res.data.blog);
          fetchRelatedBlogs(res.data.blog.category);
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedBlogs = async (category) => {
      try {
        const res = await http.get(`/v5/all?category=${category}&limit=4`);
        if (res.data?.success) {
          const filtered = res.data.blogs.filter(b => b.slug !== slug).slice(0, 3);
          setRelatedBlogs(filtered);
        }
      } catch (error) {
        console.error("Error fetching related blogs:", error);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="blog-view-loading">
        <div className="loader"></div>
        <p>Loading blog...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-view-error">
        <h2>Blog not found</h2>
        <p>The blog you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate("/ourBlog")} className="back-btn">
          <FaArrowLeft /> Back to Blogs
        </button>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="blog-view-page">
      <section className="blog-view-hero">
        <LazyImage src={blog.featureImage} alt={blog.title} className="hero-image" />
        <div className="hero-overlay">
          <div className="hero-content">
            <span className="category-tag">{blog.category}</span>
            <h1>{blog.title}</h1>
            <div className="blog-meta">
              <span><FaUser /> {blog.authorName || "TathaGat Faculty"}</span>
              <span><FaCalendarAlt /> {formatDate(blog.createdAt)}</span>
              <span><FaEye /> {blog.views || 0} views</span>
            </div>
          </div>
        </div>
      </section>

      <div className="blog-view-container">
        <button onClick={() => navigate("/ourBlog")} className="back-link">
          <FaArrowLeft /> Back to all blogs
        </button>

        <article className="blog-content">
          <div dangerouslySetInnerHTML={{ __html: blog.content }} />
        </article>

        {relatedBlogs.length > 0 && (
          <section className="related-blogs">
            <h3>Related Articles</h3>
            <div className="related-grid">
              {relatedBlogs.map(b => (
                <div 
                  key={b._id} 
                  className="related-card"
                  onClick={() => navigate(`/blog/${b.slug}`)}
                >
                  <LazyImage src={b.featureImage} alt={b.title} />
                  <div className="related-info">
                    <span className="related-category">{b.category}</span>
                    <h4>{b.title}</h4>
                    <p>{b.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <FAQ />
    </div>
  );
};

export default BlogView;
