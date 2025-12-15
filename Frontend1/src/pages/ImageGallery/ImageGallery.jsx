import React, { useState, useEffect } from "react";
import "./ImageGallery.css";

import scorecardOne from "../../images/ScoreCardOne.png";
import scorecardTwo from "../../images/ScoreCardTwo.png";
import scorecardThree from "../../images/ScoreCardThree.png";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { useNavigate } from "react-router-dom";
import Chatbox from "../../components/Chat/Chatbox";

const faqs = [
  {
    question: "What courses does TathaGat offer?",
    answer:
      "We offer preparation courses for CAT, XAT, SNAP, GMAT, CUET, and other management entrance exams. Our programs include concept classes, question-solving sessions, workshops, strategy sessions, and extensive doubt discussions.",
  },
  {
    question: "What makes TathaGat different from other coaching institutes?",
    answer:
      "Our personalized mentorship, small batch sizes, and AI-driven analytics set us apart.",
  },
  {
    question: "How can I track my progress at TathaGat?",
    answer:
      "We provide performance tracking tools, mock tests, and analytics to help you track your progress.",
  },
  {
    question: "Does TathaGat offer online classes?",
    answer:
      "Yes, we offer both online and offline classes with the same rigor and effectiveness.",
  },
  {
    question: "How do I enroll at TathaGat?",
    answer:
      "Visit our website or contact our counsellors for enrollment assistance.",
  },
  {
    question: "Can I access recorded lectures of live classes?",
    answer:
      "Yes, recorded lectures are provided to help you revise and catch up.",
  },
];

const defaultTestimonials = [
  { name: "Abishek Kumar", image: "/path-to-image.jpg", scoreImg: scorecardOne },
  { name: "Abishek Kumar", image: "/path-to-image.jpg", scoreImg: scorecardTwo },
  { name: "Abishek Kumar", image: "/path-to-image.jpg", scoreImg: scorecardThree },
];

const ImageGallery = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("Videos");
  const [videos, setVideos] = useState([]);
  const [images, setImages] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const extractVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        const [videosRes, imagesRes, featuredRes] = await Promise.all([
          fetch('/api/gallery/public?type=video'),
          fetch('/api/gallery/public?type=image'),
          fetch('/api/gallery/public/featured')
        ]);

        const videosData = await videosRes.json();
        const imagesData = await imagesRes.json();
        const featuredData = await featuredRes.json();

        if (videosData.success && videosData.data.length > 0) {
          setVideos(videosData.data.map(v => ({
            title: v.title,
            thumbnail: v.thumbnailUrl || `https://img.youtube.com/vi/${extractVideoId(v.youtubeUrl)}/hqdefault.jpg`,
            url: v.youtubeUrl
          })));
        }

        if (imagesData.success && imagesData.data.length > 0) {
          setImages(imagesData.data);
        }

        if (featuredData.success && featuredData.data) {
          setFeaturedVideo(featuredData.data);
        }
      } catch (error) {
        console.error('Error fetching gallery data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryData();
  }, []);

  const toggleIndex = (index) =>
    setOpenIndex((prev) => (prev === index ? null : index));

  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert("Thanks! We'll get back to you soon.");
    setIsFormOpen(false);
  };

  useEffect(() => {
    if (!isFormOpen) return;
    const onEsc = (e) => e.key === "Escape" && setIsFormOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isFormOpen]);

  const getFeaturedVideoId = () => {
    if (featuredVideo && featuredVideo.youtubeUrl) {
      return extractVideoId(featuredVideo.youtubeUrl);
    }
    if (videos.length > 0) {
      return extractVideoId(videos[0].url);
    }
    return "J_QoDDzzbyI";
  };

  return (
    <>
      <div className="tv-wrapper">
        <div className="tv-background">
          <div className="tv-overlay">
            <div className="tv-left">
              <h1>TathaGat</h1>
              <h3 className="tvvleft">HEAR FROM</h3>
              <h3 className="tvvleft">THE ACHIEVERS.</h3>
              <h4 className="tvvvleft">See What Our Students Say about Us....</h4>
            </div>

            <div className="tv-right">
              <div className="tv-video-card">
                <div className="tv-video-label">Our Featured Videos</div>
                <iframe
                  className="tv-video-frame"
                  src={`https://www.youtube.com/embed/${getFeaturedVideoId()}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tv-gallery-wrapper">
        <div className="tv-tabs">
          <button
            className={activeTab === "Videos" ? "tv-tab-active" : "tv-tab"}
            onClick={() => setActiveTab("Videos")}
          >
            Videos
          </button>
          <button
            className={activeTab === "Photos" ? "tv-tab-active" : "tv-tab"}
            onClick={() => setActiveTab("Photos")}
          >
            Photos
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <>
            {activeTab === "Videos" && (
              <div className="tv-video-grid">
                {videos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1/-1' }}>
                    No videos available yet.
                  </div>
                ) : (
                  videos.map((video, index) => (
                    <div className="tv-video-card-grid" key={index}>
                      <a href={video.url} target="_blank" rel="noopener noreferrer">
                        <div className="tv-thumbnail-container">
                          <LazyLoadImage
                            src={video.thumbnail}
                            alt="video"
                            className="tv-thumbnail"
                            effect="blur"
                          />
                          <span className="tv-play-icon">▶</span>
                        </div>
                      </a>
                      <p className="tv-video-title">{video.title}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "Photos" && (
              <div className="tv-scorecard-grid">
                {images.length === 0 ? (
                  defaultTestimonials.map((item, i) => (
                    <div className="tv-scorecard" key={i}>
                      <LazyLoadImage
                        src={item.scoreImg}
                        alt="Scorecard"
                        className="tv-score-img"
                        effect="blur"
                      />
                    </div>
                  ))
                ) : (
                  images.map((item, i) => (
                    <div className="tv-scorecard" key={i}>
                      <LazyLoadImage
                        src={item.imagePath}
                        alt={item.title}
                        className="tv-score-img"
                        effect="blur"
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="tv-testimonial-wrapper">
        <div className="tv-left-box">
          <h2>Why Students Trust TathaGat</h2>
          <p>
            Since 2007, TathaGat has helped thousands crack exams like CAT, XAT,
            GMAT, and SNAP with expert mentors, concept-focused learning, and
            personalized guidance in small batches.
          </p>
          <div className="tv-pill-grid">
            <span className="tv-pill">✅ Personalized Attention</span>
            <span className="tv-pill">✅ Concept- Driven Class</span>
            <span className="tv-pill">✅ Practice Session</span>
            <span className="tv-pill">✅ Doubts And Discussion</span>
            <span className="tv-pill">✅ Mentors With 99+ Percentiles</span>
            <span className="tv-pill">✅ Real-Time Strategy</span>
            <span className="tv-pill">✅ Workshops</span>
          </div>
          <div className="tv-arrow-icon">↗</div>
        </div>

        <div className="tv-right-box">
          <div className="tv-right-header">
            <h3>Top Scorers' Score Cards</h3>
            <button className="tv-view-all" onClick={() => navigate("/score-card")}>
              View all
            </button>
          </div>

          <div className="tv-scorecard-grid">
            {defaultTestimonials.map((item, i) => (
              <div className="tv-scorecard" key={i}>
                <LazyLoadImage
                  src={item.scoreImg}
                  alt="Scorecard"
                  className="tv-score-img"
                  effect="blur"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Chatbox/>
      
      <section className="tv-faq-section">
        <div className="tv-faq-left">
          <h5>GENERAL FAQS</h5>
          <h2>Your Questions,</h2>
          <h2>Answered Clearly and</h2>
          <h2>Concisely</h2>
          <p>
            Find answers to common queries about TathaGat's courses, teaching
            methods, tests, workshops, mentorship, fees, and more in our FAQs.
          </p>

          <button onClick={() => setIsFormOpen(true)}>Ask your question here</button>
        </div>

        <div className="tv-faq-right">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`tv-faq-item ${openIndex === index ? "open" : ""}`}
              onClick={() => toggleIndex(index)}
            >
              <div className="tv-faq-question">
                <span>
                  {index + 1}. {faq.question}
                </span>
                <span className="tv-faq-toggle">
                  {openIndex === index ? "−" : "+"}
                </span>
              </div>
              {openIndex === index && (
                <p className="tv-faq-answer">{faq.answer}</p>
              )}
            </div>
          ))}

          {isFormOpen && (
            <div
              className="tv-modal-backdrop"
              onClick={() => setIsFormOpen(false)}
              role="dialog"
              aria-modal="true"
            >
              <div className="tv-modal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="tv-modal-close"
                  aria-label="Close"
                  onClick={() => setIsFormOpen(false)}
                >
                  ×
                </button>

                <h3 className="tv-modal-title">Ask your question</h3>

                <form className="tv-modal-form" onSubmit={handleFormSubmit}>
                  <label>
                    Name
                    <input type="text" name="name" placeholder="Your name" required />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  <label>
                    Your Question
                    <textarea
                      name="question"
                      rows="4"
                      placeholder="Type your question…"
                      required
                    />
                  </label>

                  <button type="submit" className="tv-modal-submit">
                    Submit
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ImageGallery;
