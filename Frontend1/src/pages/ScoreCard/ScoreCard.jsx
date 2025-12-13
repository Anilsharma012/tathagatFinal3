import React, { useState, useEffect } from "react";
import "./ScoreCard.css";
import http from "../../utils/http";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

import successtwo from "../../images/success-two.PNG";
import successthree from "../../images/success-three.PNG";
import successfour from "../../images/success-four.PNG";
import successfive from "../../images/success-five.PNG";

import review1 from "../../images/Review/R1.PNG";
import review2 from "../../images/Review/R2.PNG";
import review3 from "../../images/Review/R3.PNG";
import review4 from "../../images/Review/R4.PNG";
import review5 from "../../images/Review/R5.PNG";
import review6 from "../../images/Review/R6.PNG";
import review7 from "../../images/Review/R7.PNG";
import review8 from "../../images/Review/R8.PNG";
import review9 from "../../images/Review/R9.PNG";
import review10 from "../../images/Review/R10.PNG";
import review11 from "../../images/Review/R1.PNG";
import review12 from "../../images/Review/R2.PNG";
import Chatbox from "../../components/Chat/Chatbox";

const testimonials = [
  { name: "Gourav Sharma", score: "CAT 99.8%ile", image: successtwo, message: "I studied at TathaGat back in 2014. TG exceeded my expectations...", author: "Prabhat Ralhan", stars: 5 },
  { name: "Pranjal Malhotra", score: "CAT 99.6%ile", image: successthree, message: "The study materials were comprehensive and well-structured...", author: "Prabhat Ralhan", stars: 5 },
  { name: "Shivam Sharma", score: "CAT 99.7%ile", image: successfour, message: "Faculty were exceptionally knowledgeable and experienced...", author: "Prabhat Ralhan", stars: 5 },
  { name: "Amit Raj", score: "CAT 99.7%ile", image: successfive, message: "Faculty were exceptionally knowledgeable and experienced...", author: "Prabhat Ralhan", stars: 5 },
  { name: "Gourav Sharma", score: "CAT 99.8%ile", image: successtwo, message: "I studied at TathaGat back in 2014. TG exceeded my expectations...", author: "Prabhat Ralhan", stars: 5 },
];

const feedbackImages = [review1, review2, review3, review4, review5, review6, review7, review8, review9, review10, review11, review12];

const ScoreCard = () => {
  const [showAll, setShowAll] = useState(false);
  const visibleImages = showAll ? feedbackImages : feedbackImages.slice(0, 6);

  const [scorecards, setScorecards] = useState([]);
  const [filteredScorecards, setFilteredScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  
  const [demoForm, setDemoForm] = useState({ name: '', email: '', course: 'Quant', date: '' });
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  
  const handleDemoChange = (e) => setDemoForm({ ...demoForm, [e.target.name]: e.target.value });
  
  const submitDemoForm = async (e) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.email) {
      alert('Please enter your name and email');
      return;
    }
    try {
      setDemoSubmitting(true);
      await http.post('/crm/leads/enquiry', {
        name: demoForm.name,
        email: demoForm.email,
        courseInterest: demoForm.course,
        preferredDate: demoForm.date,
        formType: 'demo_reservation',
        page: 'ScoreCard'
      });
      alert('Demo spot reserved! We will contact you soon.');
      setDemoForm({ name: '', email: '', course: 'Quant', date: '' });
    } catch (err) {
      alert('Submission failed. Please try again.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  useEffect(() => {
    fetchScorecards();
  }, []);

  const fetchScorecards = async () => {
    try {
      setLoading(true);
      const res = await http.get("/scorecards/public");
      if (res.data?.success) {
        setScorecards(res.data.scorecards || []);
        setFilteredScorecards(res.data.scorecards || []);
      }
    } catch (error) {
      console.error("Error fetching scorecards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (type) => {
    setActiveFilter(type);
    if (type === "All") {
      setFilteredScorecards(scorecards);
    } else {
      const filtered = scorecards.filter(card => card.percentileCategory === type);
      setFilteredScorecards(filtered);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return url;
  };

  const getScorecardsCount = () => {
    return scorecards.length > 0 ? `${scorecards.length}+ students` : "3000+ students";
  };

  return (
    <>
      <section className="scorecard-wrapper">
        <div className="scorecard-content">
          <div className="scorecard-heading">
            <h1>TathaGat Scorecard Wall</h1>
            <p>
              See how our students have performed in <strong>CAT, XAT, SNAP</strong> & more!
            </p>
          </div>
          <div className="scorecard-cards">
            <div className="card-box">
              <div className="card-title">500+</div>
              <div className="card-text">students scored 99+ percentile in CAT 2024</div>
            </div>
            <div className="card-box">
              <div className="card-title">98%ILE</div>
              <div className="card-text">scored by 90% students from Toppers'Batch of 120+ Toppers</div>
            </div>
          </div>
        </div>
      </section>

      <section className="scorecard-wrapper">
        <div className="scorecard-content">
          <div className="scorecard-filters">
            <button 
              className={activeFilter === "All" ? "active" : ""} 
              onClick={() => handleFilter("All")}
            >
              All
            </button>
            <button 
              className={activeFilter === "99" ? "active" : ""} 
              onClick={() => handleFilter("99")}
            >
              99% +
            </button>
            <button 
              className={activeFilter === "98" ? "active" : ""} 
              onClick={() => handleFilter("98")}
            >
              98% +
            </button>
            <button 
              className={activeFilter === "97" ? "active" : ""} 
              onClick={() => handleFilter("97")}
            >
              97% +
            </button>
            <button 
              className={activeFilter === "95" ? "active" : ""} 
              onClick={() => handleFilter("95")}
            >
              95% +
            </button>
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: "700" }}>{getScorecardsCount()}</p>
          </div>
        </div>

        {loading ? (
          <div className="scorecard-loading">Loading scorecards...</div>
        ) : (
          <div className="scorecard-grid">
            {filteredScorecards.length === 0 ? (
              <div className="no-scorecards">No scorecards found for this category</div>
            ) : (
              filteredScorecards.map((card, index) => (
                <div className="student-card small" key={card._id || index}>
                  <LazyLoadImage 
                    effect="blur" 
                    src={getImageUrl(card.imageUrl)} 
                    alt={card.studentName || `Scorecard ${index + 1}`} 
                    className="student-scorecard" 
                  />
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <div className="tss-demo-wrapper">
        <div className="tss-demo-left">
          <h2 className="tss-demo-heading">
            Attend A Live Demo Class – <br /> For Free!
          </h2>
          <p className="tss-demo-subtext">Experience our teaching style, methods, and mentors before you decide.</p>

          <div className="tss-scrolling-wrapper">
            <div className="tss-scrolling-track">
              {testimonials.map((t, i) => (
                <div key={i} className="tss-testimonial-card">
                  <div className="tss-testimonial-content">
                    <div className="tss-testimonial-header">
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <h4>{t.name}</h4>
                          <span className="tss-score">{t.score}</span>
                        </div>
                        <LazyLoadImage src={t.image} alt={t.name} effect="blur" className="tss-testimonial-image" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tss-demo-right">
          <h3>Reserve Your Demo Spot</h3>
          <form className="tss-demo-form" onSubmit={submitDemoForm}>
            <input type="text" name="name" placeholder="Your Name" value={demoForm.name} onChange={handleDemoChange} required />
            <input type="email" name="email" placeholder="Your Email" value={demoForm.email} onChange={handleDemoChange} required />
            <select name="course" value={demoForm.course} onChange={handleDemoChange} required>
              <option value="Quant">Quant</option>
              <option value="Verbal">Verbal</option>
              <option value="DILR">DILR</option>
            </select>
            <input type="date" name="date" value={demoForm.date} onChange={handleDemoChange} placeholder="Preferred Date" />
            <button type="submit" disabled={demoSubmitting}>{demoSubmitting ? 'Submitting...' : 'Reserve Your Spot'}</button>
          </form>
        </div>
      </div>

      <div className="tgs-wrapper">
        <div className="tgs-inner">
          <div className="tgs-header">
            <h1 className="tg-heading">TathaGat Toppers' Feedback</h1>
            {!showAll && (
              <button className="tgs-btns" onClick={() => setShowAll(true)}>
                View All
              </button>
            )}
          </div>
 
          <div className="tgs-grid">
            {visibleImages.map((src, index) => (
              <div key={index} className="tgs-card">
                <LazyLoadImage src={src} alt={`feedback-${index + 1}`} className="tgs-img" />
              </div>
            ))}
          </div>
        </div>
        <Chatbox/>
      </div>
    </>
  );
};
 
export default ScoreCard;
