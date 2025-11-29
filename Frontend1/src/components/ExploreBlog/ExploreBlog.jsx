import React, { useState, useEffect, useRef } from "react";
import "./ExploreBlog.css";
import { FaCalendarAlt, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { useNavigate } from "react-router-dom";
import http from "../../utils/http";

import footerOne from "../../images/footer1.png";
import footerTwo from "../../images/footer2.png";
import footerThree from "../../images/footer3.png";
import footerfour from "../../images/footer4.png";

const fallbackData = [
  { id: 1, image: footerOne, date: "Feb 24, 2025", title: "CUET Prep Guide" },
  { id: 2, image: footerTwo, date: "Feb 25, 2025", title: "CAT Success Story" },
  { id: 3, image: footerThree, date: "Feb 26, 2025", title: "Toppers' Journey" },
  { id: 4, image: footerfour, date: "Feb 27, 2025", title: "MBA Prep Tips" },
];

const categories = ["All", "Top Blogs", "CAT", "IPMAT", "CUET", "MBA", "B-Schools", "Info Exam", "Topper's Journey"];

const categoryMapping = {
  "All": null,
  "Top Blogs": "topOnly",
  "CAT": "CAT",
  "IPMAT": "IPMAT",
  "CUET": "CUET",
  "MBA": "MBA",
  "B-Schools": "B-Schools",
  "Info Exam": "Info Exam",
  "Topper's Journey": "Topper's Journey"
};

const ExploreBlog = () => {
  const [activeTag, setActiveTag] = useState("All");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    fetchBlogs(activeTag);
  }, [activeTag]);

  const fetchBlogs = async (tag = "All") => {
    try {
      setLoading(true);
      let url = "/v5/all?limit=10";
      
      const mapping = categoryMapping[tag];
      if (mapping === "topOnly") {
        url += "&topOnly=true";
      } else if (mapping) {
        url += `&category=${encodeURIComponent(mapping)}`;
      }
      
      const res = await http.get(url);
      if (res.data?.success && res.data.blogs?.length > 0) {
        setBlogs(res.data.blogs);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(300, el.clientWidth * 0.8);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const updateProgress = () => {
    const el = scrollRef.current;
    const fill = progressRef.current;
    if (!el || !fill) return;
    const max = el.scrollWidth - el.clientWidth;
    const pct = max > 0 ? (el.scrollLeft / max) * 100 : 0;
    fill.style.width = `${pct}%`;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateProgress();
    el.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      el.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [activeTag, blogs]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const goToBlog = (slug) => {
    navigate(`/blog/${slug}`);
  };

  const displayBlogs = blogs.length > 0 ? blogs : fallbackData;

  return (
    <section className="tm-blog-slider-wrapper">
      <div className="tme-blog-header">
        <div>
          <p className="tm-headerBlog">Explore our blog</p>
          <h2>
            Unlock Success Through
            <br />
            Knowledge
          </h2>
        </div>
        <div>
          <p>
            Stay informed with the latest articles, tips, and strategies from TathaGat. From exam preparation guides to
            success stories, our blog covers everything you need to excel in CAT, XAT, SNAP, GMAT, CUET, and more.
          </p>
        </div>
      </div>

      <div className="tme-blog-filter-buttons">
        {categories.map((tag) => (
          <button
            key={tag}
            className={activeTag === tag ? "active-filter" : ""}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="tm-blog-cards-container" id="blog-scroll-container" ref={scrollRef}>
        {loading ? (
          <div className="tm-blog-loading">Loading...</div>
        ) : displayBlogs.map((blog) => (
          <div 
            key={blog._id || blog.id} 
            className="tmc-blog-card"
            onClick={() => blog.slug ? goToBlog(blog.slug) : null}
            style={{ cursor: blog.slug ? 'pointer' : 'default' }}
          >
            <LazyLoadImage 
              src={blog.featureImage || blog.image} 
              alt={blog.title} 
              className="tm-blog-image" 
              effect="blur" 
            />
            <div className="tm-blog-info">
              <span className="tm-blog-date">
                <FaCalendarAlt /> {blog.createdAt ? formatDate(blog.createdAt) : blog.date}
              </span>
              <h4>{blog.title}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="tm-blog-footer">
        <button
          className="tm-arrow-button"
          aria-label="Scroll left"
          onClick={() => handleScroll("left")}
        >
          <FaArrowLeft />
        </button>

        <div className="tm-progress-track" aria-hidden="true">
          <div className="tm-progress-fill" ref={progressRef} />
        </div>

        <button
          className="tm-arrow-button"
          aria-label="Scroll right"
          onClick={() => handleScroll("right")}
        >
          <FaArrowRight />
        </button>
      </div>

      <div className="tm-view-all-buttonnn">
        <button onClick={() => navigate('/ourBlog')}>View all</button>
      </div>
    </section>
  );
};

export default ExploreBlog;
