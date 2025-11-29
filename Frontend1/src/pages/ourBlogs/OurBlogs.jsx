import React, { useState, useRef, useEffect } from "react";
import "./ourBlog.css";
import ourBlogTwo from "../../images/ourBlogTwo.png";
import ourBlogThree from "../../images/ourBlogThree.png";
import ourTeam from "../../images/contactTeams.png";
import LazyImage from "../../components/LazyImage/LazyImage";
import FAQ from "../../components/FAQ/FAQ";
import { FaSearch, FaRegCalendarAlt } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import http from "../../utils/http";

const categories = [
  "All", "Top Blogs", "Topper's Journey", "MBA",
  "CAT", "IPMAT", "CUET", "Info Exam", "B-Schools"
];

const teamImages = [ourTeam, ourTeam, ourTeam];

const OurBlogs = () => {
  const [index, setIndex] = useState(0);
  const [activeChip, setActiveChip] = useState(0);
  const [blogs, setBlogs] = useState([]);
  const [featuredBlog, setFeaturedBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const gridRef = useRef(null);

  useEffect(() => {
    fetchBlogs();
    fetchFeaturedBlog();
  }, []);

  const fetchBlogs = async (category = null, search = null) => {
    try {
      setLoading(true);
      let url = "/v5/all?limit=50";
      
      if (category && category !== "All" && category !== "Top Blogs") {
        url += `&category=${encodeURIComponent(category)}`;
      }
      if (category === "Top Blogs") {
        url += "&topOnly=true";
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const res = await http.get(url);
      if (res.data?.success) {
        setBlogs(res.data.blogs || []);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedBlog = async () => {
    try {
      const res = await http.get("/v5/featured");
      if (res.data?.success && res.data.blog) {
        setFeaturedBlog(res.data.blog);
      }
    } catch (error) {
      console.error("Error fetching featured blog:", error);
    }
  };

  const handleChipClick = (i) => {
    setActiveChip(i);
    const selectedCategory = categories[i];
    fetchBlogs(selectedCategory, searchTerm);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length >= 2 || value.length === 0) {
      fetchBlogs(categories[activeChip], value);
    }
  };

  const goToBlog = (slug) => {
    navigate(`/blog/${slug}`);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div>
      <section className="our-blog-section">
        <div className="overlay"></div>
        <div className="blog-contenting">
          <h1 className="blog-ti">Dive Deeper Into TathaGat</h1>
          <p>
            Stay updated with powerful tips, real stories, and expert advice on
            preparation, motivation and results. Explore articles designed to help
            you grow, and achieve.
          </p>
          <button className="enquire-btn" onClick={() => navigate('/AboutUs')}>Know About Us</button>
        </div>
      </section>

      <div className="blog-filter-container">
        <div className="category-buttons">
          {categories.map((cat, i) => (
            <button
              key={i}
              className={`chip ${activeChip === i ? "active" : ""}`}
              onClick={() => handleChipClick(i)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {featuredBlog && (
        <section className="latest-post-wrapper">
          <h2 className="latest-title">Latest Posts</h2>
          <div className="latest-card" onClick={() => goToBlog(featuredBlog.slug)} style={{cursor: 'pointer'}}>
            <LazyImage 
              src={featuredBlog.featureImage} 
              alt={featuredBlog.title} 
              className="post-image" 
            />
            <div className="post-details">
              <h3 className="post-title">{featuredBlog.title}</h3>
              <p className="post-desc">
                {featuredBlog.excerpt || featuredBlog.content?.replace(/<[^>]*>/g, '').substring(0, 200)}...
              </p>
              <div className="post-footer">
                <div className="author">
                  <LazyImage src={ourBlogThree} alt="TG" className="author-logo" />
                  <div>
                    <p className="author-name">By {featuredBlog.authorName || "TathaGat Faculty"}</p>
                    <p className="author-date">Published: {formatDate(featuredBlog.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="blog-grid-wrapper" ref={gridRef}>
        {loading ? (
          <div className="blog-loading">
            <div className="loader"></div>
            <p>Loading blogs...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="no-blogs">
            <p>No blogs found. Check back later!</p>
          </div>
        ) : (
          <div className="blog-grid-container">
            {blogs.map((blog) => (
              <div className="tb-blog-card" key={blog._id}>
                <LazyImage
                  src={blog.featureImage}
                  alt={blog.title}
                  className="blog-card-image"
                  onClick={() => goToBlog(blog.slug)}
                  style={{cursor: 'pointer', width: '100%', height: '220px', objectFit: 'cover', display: 'block'}}
                />
                <div className="card-footer">
                  <span className="date">
                    <FaRegCalendarAlt className="icon" />
                    {formatDate(blog.createdAt)}
                  </span>
                  <h4 className="title">{blog.title}</h4>
                  <div
                    className="arrow"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open blog: ${blog.title}`}
                    onClick={() => goToBlog(blog.slug)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToBlog(blog.slug);
                      }
                    }}
                  >
                    <FiArrowUpRight />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ts-blog-team-wrapper">
        <div className="ts-blog-team-left">
          <h2 className="ts-blog-team-heading">
            Don't Just Dream It. Crack It <br />
            with TathaGat!
          </h2>
          <button
            className="ts-blog-contact-btn"
            onClick={() => navigate("/GetInTouch")}
          >
            Contact Now
          </button>
        </div>
        <div className="ts-blog-team-right">
          <div className="ts-blog-team-header">
            <span style={{ fontSize: "24px", fontWeight: "700", color: "black" }}>
              Meet the team
            </span>
            <button onClick={() => navigate("/team")} className="ts-blog-view-all-btn">
              View all
            </button>
          </div>
          <div className="ts-blog-team-box">
            <LazyImage src={teamImages[index]} alt="Team" className="ts-blog-team-image" />
          </div>
        </div>
      </div>

      <FAQ />

      <div className="floating-chat">
        <div className="chat-options">
          <a
            href="https://wa.me/919205534439"
            target="_blank"
            rel="noopener noreferrer"
            className="chat-option whatsapp"
          >
            Chat on WhatsApp
          </a>
          <a
            href="https://t.me/freecatprep"
            target="_blank"
            rel="noopener noreferrer"
            className="chat-option telegram"
          >
            Chat on Telegram
          </a>
          <a href="tel:9205534439" className="chat-option call">
            Make a call
          </a>
        </div>
        <button className="chat-toggle">&#9742;</button>
      </div>
    </div>
  );
};

export default OurBlogs;
