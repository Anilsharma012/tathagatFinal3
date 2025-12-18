import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import "./CoursePurchase.css";
import one from "../../images/one1.png";
import two from "../../images/two2.png";
import three from "../../images/three3.png";
import review from "../../images/REVIEW5.PNG";
import frame from "../../images/frameCourse.png";

const defaultInstructors = [
  { name: "Rajat Tathagat", expertise: "Quant/LRDI", imageUrl: three },
  { name: "Kumar Abhishek", expertise: "Verbal", imageUrl: two },
  { name: "Niraj Naiyar", expertise: "Quant/LRDI", imageUrl: one },
];

const defaultCurriculumData = [
  { sectionTitle: "Welcome! Course Introduction", sectionSubtitle: "What does the course cover?" },
  { sectionTitle: "Foundation Phase – Concept Building", sectionSubtitle: "" },
  { sectionTitle: "Application Phase – Practice & Assignments", sectionSubtitle: "" },
  { sectionTitle: "iCAT Mock Test Series", sectionSubtitle: "" },
  { sectionTitle: "CAT Crash Course – Final Lap", sectionSubtitle: "" },
];

const isValidObjectId = (id) =>
  typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);

const CoursePurchase = () => {
  const [openCurriculumIndex, setOpenCurriculumIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState(null);
  const [courseData, setCourseData] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();

  const topRef = useRef(null);
  const overviewRef = useRef(null);
  const curriculumRef = useRef(null);
  const instructorRef = useRef(null);
  const reviewsRef = useRef(null);

  const course = location.state || courseData || {
    _id: courseId || "6835a4fcf528e08ff15a566e",
    name: "CAT 2025 Full Course",
    price: 1500,
    description: "Complete CAT preparation course",
    features: [
      "Complete CAT preparation material",
      "Live interactive classes",
      "Mock tests and practice sets",
      "Doubt clearing sessions",
      "Performance analysis",
      "Study materials download",
    ],
    oldPrice: 120000,
  };

  useEffect(() => {
    const fetchContent = async () => {
      const id = courseId || location.state?._id;
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`/api/course-purchase-content/public/${id}`);
        if (res.data.success) {
          if (res.data.content) {
            setPageContent(res.data.content);
          }
          if (res.data.course) {
            setCourseData(res.data.course);
          }
        }
      } catch (error) {
        console.log("Using default content - no custom content configured");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [courseId, location.state]);

  const scrollWithOffset = (element) => {
    if (!element) return;
    const yOffset = -90;
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const handleTabClick = (key) => {
    setActiveTab(key);
    const map = {
      overview: overviewRef.current,
      curriculum: curriculumRef.current,
      instructor: instructorRef.current,
      reviews: reviewsRef.current,
    };
    scrollWithOffset(map[key]);
  };

  useEffect(() => {
    const sections = [
      { key: "overview", el: overviewRef.current },
      { key: "curriculum", el: curriculumRef.current },
      { key: "instructor", el: instructorRef.current },
      { key: "reviews", el: reviewsRef.current },
    ].filter((s) => s.el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          const match = sections.find((s) => s.el === visible.target);
          if (match && match.key !== activeTab) setActiveTab(match.key);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0.1, 0.25, 0.5, 0.75] },
    );

    sections.forEach((s) => observer.observe(s.el));
    return () => observer.disconnect();
  }, [activeTab]);

  const handlePayment = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      alert("Please login first! Use the user button in the top notification bar.");
      return;
    }

    const activeCourseId = courseId || course._id;

    if (!activeCourseId) {
      alert("Course information not available. Please go back and select a course.");
      navigate("/");
      return;
    }

    const validId = isValidObjectId(activeCourseId);

    if (process.env.NODE_ENV === "development") {
      const confirmed = window.confirm("Development Mode: Skip payment and directly unlock course?");

      if (confirmed) {
        try {
          const response = await fetch("/api/user/payment/verify-and-unlock", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: "dev_order_" + Date.now(),
              razorpay_payment_id: "dev_payment_" + Date.now(),
              razorpay_signature: "dev_signature",
              courseId: activeCourseId,
              devMode: true,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              alert("Development course unlock successful!");
              navigate("/student/dashboard", {
                state: { showMyCourses: true, refreshCourses: true },
              });
              return;
            }
          }

          alert("Development unlock failed, proceeding with normal payment...");
        } catch (error) {
          console.error("Development unlock error:", error);
          alert("Development unlock error, proceeding with normal payment...");
        }
      }
    }

    if (!validId) {
      alert("This looks like a demo/mock course. Please select a real published course to purchase.");
      return;
    }

    try {
      const checkRes = await fetch("/api/user/student/my-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (checkRes.ok) {
        try {
          const checkData = await checkRes.json();
          const enrolled = Array.isArray(checkData?.courses) ? checkData.courses : [];

          const alreadyUnlocked = enrolled.some((c) => {
            const enrolledCourseId = (c?.courseId && (c.courseId._id || c.courseId)) || c?._id || c?.id;
            if (!enrolledCourseId) return false;
            return enrolledCourseId.toString() === activeCourseId.toString();
          });

          if (alreadyUnlocked) {
            alert("You have already purchased/unlocked this course.");
            return;
          }
        } catch (e) {}
      }

      const currentPrice = pageContent?.heroSection?.currentPrice || course?.price || 1500;
      let amountInPaise = Math.round(currentPrice * 100);
      let courseName = pageContent?.heroSection?.mainTitle || course?.name || "Course Purchase";

      const orderRes = await fetch("/api/user/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          courseId: activeCourseId,
        }),
      });

      if (!orderRes.ok) {
        const text = await orderRes.text().catch(() => "");
        alert(`Failed to create order: ${orderRes.status} ${orderRes.statusText}\n${text}`);
        return;
      }

      const orderData = await orderRes.json();

      if (!orderData?.success || !orderData?.order?.id) {
        alert("Failed to create order: " + (orderData?.message || "Unknown error"));
        return;
      }

      if (!window.Razorpay) {
        alert("Razorpay SDK not loaded. Please check index.html script include.");
        return;
      }

      const options = {
        key: orderData?.keyId || "rzp_test_JLdFnx7r5NMiBS",
        amount: orderData.order.amount,
        currency: "INR",
        name: "Tathagat Academy",
        description: courseName,
        order_id: orderData.order.id,

        handler: function (response) {
          fetch("/api/user/payment/verify-and-unlock", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: activeCourseId,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                alert("Payment verified & course unlocked!");
                navigate("/student/dashboard", {
                  state: { showMyCourses: true, refreshCourses: true },
                });
              } else {
                alert("Payment verification failed: " + (data.message || "Unknown error"));
              }
            })
            .catch((err) => {
              console.error("Verification error:", err);
              alert("Something went wrong. Please contact support.");
            });
        },

        prefill: {
          name: "Student",
          email: "student@example.com",
          contact: "9999999999",
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.log(response?.error);
        alert("Payment failed: " + (response?.error?.description || "Unknown error"));
      });

      rzp.open();
    } catch (err) {
      console.error("Error in handlePayment:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const toggleCurriculum = (index) => {
    setOpenCurriculumIndex(index === openCurriculumIndex ? null : index);
  };

  const heroSection = pageContent?.heroSection || {};
  const aboutSection = pageContent?.aboutSection || {};
  const infoGrid = pageContent?.infoGrid || {};
  const materialBox = pageContent?.materialBox || {};
  const requirementsBox = pageContent?.requirementsBox || {};
  const reviewsSection = pageContent?.reviewsSection || {};
  const curriculumSections = pageContent?.curriculumSections?.length > 0 
    ? pageContent.curriculumSections 
    : defaultCurriculumData;
  const instructors = pageContent?.instructors?.length > 0 
    ? pageContent.instructors 
    : defaultInstructors;

  const defaultPrice = course?.price || 30000;
  const defaultOldPrice = course?.oldPrice || 120000;
  const displayPrice = (heroSection.currentPrice && heroSection.currentPrice > 0) 
    ? heroSection.currentPrice 
    : defaultPrice;
  const displayOldPrice = (heroSection.originalPrice && heroSection.originalPrice > 0) 
    ? heroSection.originalPrice 
    : defaultOldPrice;
  const displayTitle = heroSection.mainTitle || course?.name || "CAT 2025 Full Course IIM ABC Practice Batch";
  const displayBullets = heroSection.keyBullets?.filter(b => b && b.trim())?.length > 0 
    ? heroSection.keyBullets.filter(b => b && b.trim()) 
    : course?.features || [
        "Complete CAT preparation material",
        "Live interactive classes",
        "Mock tests and practice sets",
        "Doubt clearing sessions",
        "Performance analysis",
        "Study materials download",
      ];

  const videoUrl = heroSection.previewVideoUrl || "https://www.youtube.com/embed/aDXkJwqAiP4?si=gtkt5zJpNyAy7LBS";
  
  const displayInfoGrid = {
    instructorName: infoGrid.instructorName || "Kumar Abhishek",
    category: infoGrid.category || "CAT",
    studentsEnrolled: (infoGrid.studentsEnrolled && infoGrid.studentsEnrolled > 0) ? infoGrid.studentsEnrolled : 200,
    reviewScore: infoGrid.reviewScore || "4.8 (Google)"
  };
  
  const displayRating = {
    averageRating: (reviewsSection.averageRating && reviewsSection.averageRating > 0) ? reviewsSection.averageRating : 4.0,
    totalRatings: (reviewsSection.totalRatings && reviewsSection.totalRatings > 0) ? reviewsSection.totalRatings : 6,
    ratingBreakdown: reviewsSection.ratingBreakdown || { fiveStar: 5, fourStar: 1, threeStar: 0, twoStar: 0, oneStar: 0 }
  };

  if (loading) {
    return (
      <div className="course-page container" style={{ textAlign: "center", padding: "50px" }}>
        <p>Loading course details...</p>
      </div>
    );
  }

  return (
    <div ref={topRef} className="course-page container">
      <div className="row">
        <div className="col-lg-9 left-sections">
          <div className="video-banners">
            <iframe
              width="100%"
              height="600"
              src={videoUrl}
              title="Course Intro Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          <h2 className="course-title">{displayTitle}</h2>

          <div className="info-grid">
            <div className="info-item">
              <span className="icon">👨‍🏫</span>
              <div>
                <div className="label">Instructor</div>
                <div className="value">{displayInfoGrid.instructorName}</div>
              </div>
            </div>
            <div className="info-item">
              <span className="icon">📚</span>
              <div>
                <div className="label">Category</div>
                <div className="value">{displayInfoGrid.category}</div>
              </div>
            </div>
            <div className="info-item">
              <span className="icon">👥</span>
              <div>
                <div className="label">Students Enrolled</div>
                <div className="value">{displayInfoGrid.studentsEnrolled}</div>
              </div>
            </div>
            <div className="info-item">
              <span className="icon">⭐</span>
              <div>
                <div className="label">Reviews</div>
                <div className="value">{displayInfoGrid.reviewScore}</div>
              </div>
            </div>
          </div>

          <div className="course-tabs-section" ref={overviewRef}>
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => handleTabClick("overview")}
              >
                Overview
              </button>
              <button
                className={`tab-btn ${activeTab === "curriculum" ? "active" : ""}`}
                onClick={() => handleTabClick("curriculum")}
              >
                Curriculum
              </button>
              <button
                className={`tab-btn ${activeTab === "instructor" ? "active" : ""}`}
                onClick={() => handleTabClick("instructor")}
              >
                Instructor
              </button>
              <button
                className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
                onClick={() => handleTabClick("reviews")}
              >
                Reviews
              </button>
            </div>

            <div className="tab-content">
              <h3>{aboutSection.aboutTitle || "About The Course"}</h3>
              <p>{aboutSection.aboutDescription || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. The purpose of lorem ipsum is to create a natural looking block of text that doesn't distract from the layout."}</p>
              <p>{aboutSection.learningContent || "The passage experienced a surge in popularity during the 1960s when Letraset used it on their dry-transfer sheets, and again during the 90s as desktop publishers bundled the text with their software."}</p>
              <p><strong>{aboutSection.learningHeading || "OR WHAT WILL YOU LEARN??"}</strong></p>
            </div>
          </div>

          <div className="curriculum-wrapper" ref={curriculumRef}>
            <h3>The Course Curriculum</h3>
            {curriculumSections.map((item, index) => (
              <div
                className={`curriculum-item ${openCurriculumIndex === index ? "active" : ""}`}
                key={index}
                onClick={() => toggleCurriculum(index)}
              >
                <div className="curriculum-title">
                  {item.sectionTitle || item.title}
                  <span className="arrow">{openCurriculumIndex === index ? "▾" : "▸"}</span>
                </div>
                {openCurriculumIndex === index && (item.sectionSubtitle || item.content) && (
                  <div className="curriculum-content">{item.sectionSubtitle || item.content}</div>
                )}
              </div>
            ))}
          </div>

          <div className="instructor-section" ref={instructorRef}>
            <h3>Meet Your Instructor</h3>
            <div className="instructor-grid">
              {instructors.map((ins, index) => (
                <div className="instructor-card" key={index}>
                  <div className="instructor-img">
                    <img 
                      src={ins.imageUrl?.startsWith('/uploads') ? ins.imageUrl : (ins.imageUrl || ins.image || one)} 
                      alt={ins.name} 
                    />
                  </div>
                  <div className="instructor-info">
                    <div><strong>Name -</strong> {ins.name}</div>
                    <div><strong>Expertise -</strong> {ins.expertise}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="review-section" ref={reviewsRef}>
            <h3>Our Valuable Reviews</h3>
            <div className="review-layout">
              <div className="rating-summary">
                <div>
                  <div className="rating-score">{displayRating.averageRating}</div>
                  <div className="rating-stars">★★★★★</div>
                  <p className="total-rating">Total {displayRating.totalRatings} Ratings</p>
                </div>

                <div className="rating-bars">
                  {[5, 4, 3, 2, 1].map((star, index) => {
                    const starKeys = ['fiveStar', 'fourStar', 'threeStar', 'twoStar', 'oneStar'];
                    const count = displayRating.ratingBreakdown[starKeys[index]] || 0;
                    const percentage = displayRating.totalRatings > 0 ? (count / displayRating.totalRatings) * 100 : 0;

                    return (
                      <div className="bar-line" key={index}>
                        <span className="star">☆</span> <span>{star}</span>
                        <div className="bar">
                          <div className="fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="count">{count} Rating</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="review-image-box">
                <img src={review} alt="Review Summary" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 right-section">
          <div className="course-info-box">
            <div className="course-title-box">{displayTitle}</div>

            <div
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#1A237E",
              }}
            >
              Price:{" "}
              <span style={{ color: "#D32F2F" }}>₹{displayPrice}/-</span>
              <del style={{ marginLeft: "8px", color: "#888" }}>₹{displayOldPrice}/-</del>
            </div>

            <div
              className="course-description-box"
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                paddingRight: "5px",
                fontSize: "15px",
                color: "#333",
                lineHeight: "1.6",
              }}
            >
              <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
                {displayBullets.map((feat, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>{feat}</li>
                ))}
              </ul>
            </div>

            <button
              className="buy-btn"
              style={{
                backgroundColor: "#1A237E",
                fontSize: "16px",
                padding: "12px",
                fontWeight: "600",
                borderRadius: "8px",
                marginTop: "15px",
                transition: "0.3s",
              }}
              onClick={handlePayment}
            >
              Buy Now
            </button>
          </div>

          <div className="material-box">
            <h4>{materialBox.materialHeading || "Material Includes"}</h4>
            <ul className="material-list">
              {(materialBox.materialItems?.length > 0 ? materialBox.materialItems : [
                "Certificate of Completion",
                "444 downloadable resource",
                "Full lifetime access",
                "1300+ Hours of Videos",
                "20 Mocks & 45 Sectional Mocks",
              ]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="material-box">
            <h4>{requirementsBox.requirementsHeading || "Requirements"}</h4>
            <ul className="material-list">
              {(requirementsBox.requirementsItems?.length > 0 ? requirementsBox.requirementsItems : [
                "Required minimum graduation score to appear in CAT",
                "50% For General/OBC & 45% For SC/ST/PwD candidates",
                "Final year bachelor's degree candidates or those awaiting their result are also eligible to appear for the CAT exam.",
                "Candidates with professional qualification such as CA/CS/ICWA can also appear for CAT.",
                "10th or 12th scores do not affect the CAT Eligibility",
              ]).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="cat-journey-wrapper">
        <img src={frame} alt="CAT Learning Journey" className="journey-image" />
      </div>
    </div>
  );
};

export default CoursePurchase;
