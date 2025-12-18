import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
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

  const getSeoData = () => {
    if (!blog) return {};
    const siteUrl = window.location.origin;
    const blogUrl = `${siteUrl}/blog/${blog.slug}`;
    const imageUrl = blog.ogImage || blog.featureImage;
    const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`;
    
    return {
      title: blog.seoTitle || blog.title || 'TathaGat Blog',
      description: blog.seoDescription || blog.excerpt || 'Read the latest articles on CAT, MBA, and competitive exam preparation.',
      keywords: Array.isArray(blog.seoKeywords) ? blog.seoKeywords.join(', ') : (blog.seoKeywords || 'CAT, MBA, IIM, exam preparation'),
      canonicalUrl: blog.canonicalUrl || blogUrl,
      ogImage: fullImageUrl,
      author: blog.authorName || 'TathaGat Faculty',
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt
    };
  };

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

  const seo = getSeoData();

  return (
    <div className="blog-view-page">
      <Helmet>
        <title>{seo.title} | TathaGat</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords} />
        <meta name="author" content={seo.author} />
        <link rel="canonical" href={seo.canonicalUrl} />
        
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:image" content={seo.ogImage} />
        <meta property="og:url" content={seo.canonicalUrl} />
        <meta property="og:site_name" content="TathaGat" />
        <meta property="article:published_time" content={seo.publishedTime} />
        <meta property="article:modified_time" content={seo.modifiedTime} />
        <meta property="article:author" content={seo.author} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        <meta name="twitter:image" content={seo.ogImage} />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": seo.title,
            "description": seo.description,
            "image": seo.ogImage,
            "author": {
              "@type": "Person",
              "name": seo.author
            },
            "publisher": {
              "@type": "Organization",
              "name": "TathaGat",
              "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/logo.png`
              }
            },
            "datePublished": seo.publishedTime,
            "dateModified": seo.modifiedTime,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": seo.canonicalUrl
            },
            "keywords": seo.keywords
          })}
        </script>
      </Helmet>
      
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
