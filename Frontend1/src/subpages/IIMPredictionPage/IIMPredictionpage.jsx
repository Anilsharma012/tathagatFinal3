import React, { useState, useEffect } from "react";
import axios from "axios";
import "./IIMPredictionpage.css";

import graphIIM from "../../images/graphIIM.png"

const fallbackData = {
  noSectionalCutOffs: [
    { name: "FMS Delhi", highestPackage: "120 Lakh", avgPackage: "34.1 Lakh", exams: "CAT" },
    { name: "DMS IIT Delhi", highestPackage: "41.1 Lakh", avgPackage: "25.8 Lakh", exams: "CAT" },
    { name: "SIBM Pune", highestPackage: "35.05 Lakh", avgPackage: "26.77 Lakh", exams: "SNAP" },
    { name: "VGSoM IIT Kharagpur", highestPackage: "43.37 Lakh", avgPackage: "22.13 Lakh", exams: "CAT" },
    { name: "MHRM IIT Kharagpur", highestPackage: "13.21 Lakh", avgPackage: "13.21 Lakh", exams: "CAT" },
  ],
  lessAcadsWeightage: [
    { name: "XLRI Jamshedpur", highestPackage: "78.2 Lakh", avgPackage: "32.7 Lakh", exams: "XAT" },
    { name: "FMS Delhi", highestPackage: "120 Lakh", avgPackage: "34.1 Lakh", exams: "CAT" },
    { name: "MDI Gurgaon", highestPackage: "60 Lakh", avgPackage: "27.67 Lakh", exams: "CAT" },
  ],
  bSchoolsViaXAT: [
    { name: "XLRI Jamshedpur", highestPackage: "78.2 Lakh", avgPackage: "32.7 Lakh", exams: "XAT" },
    { name: "XLRI Delhi", highestPackage: "78.2 Lakh", avgPackage: "32.7 Lakh", exams: "XAT" },
  ],
};


const contentData = {
    whatIsMBA: {
      title: "What is an MBA?",
      description: "MBA or Masters of Business Administration is a Postgraduate degree highly valued in the market. An MBA programme aims to impart a holistic knowledge in the field of Management under Finance, Marketing, Human Resources, Operations and several other domains.",
      points: ["Industry Knowledge", "Higher Earnings", "Personality Development", "Better Job Profile", "Networking", "Career Switch"]
    },
    whatIsCAT: {
      title: "Common Admission Test (CAT)",
      description: "Conducting Body: IIMs. Institutes Accepting CAT Score: 20 IIMs, FMS, MDI, SPJIMR & 1200+ other B-schools.",
      points: ["Top IIMs (Rotational Basis)", "B-Schools Packages: 36+ LPA for IIMs", "CAT is mandatory for most top B-Schools"]
    },
    examPattern: {
      title: "CAT Exam Pattern",
      description: "The CAT Exam is divided into 3 sections, spanning 40 minutes each, making it a 2-hour exam.",
      points: ["Quantitative Ability (22 Questions - 40 min)", "Verbal Ability & Reading Comprehension (24 Questions - 40 min)", "Logical Reasoning & Data Interpretation (20 Questions - 40 min)"]
    },
    eligibility: {
      title: "CAT Eligibility",
      description: "Required minimum graduation score to appear in CAT",
      points: ["General/OBC: 50%", "SC/ST/PwD: 45%", "Final year students can apply", "Professional courses (CA/CS/ICWA) are eligible"]
    },
    pastPapers: {
      title: "CAT Past Papers",
      description: "Past CAT Papers with detailed solutions in all required formats.",
      points: ["Topic-wise Past CAT Questions", "Year-wise Past CAT Questions", "Take Past CAT as a Mock"]
    }
  };



  const contentDataStyle = {
    quantSection: {
      title: "CAT Quant Syllabus & Weightage",
      image: "https://tse4.mm.bing.net/th?id=OIP.3rie0I0tdDl1V2qSJaUd3wHaEt&pid=Api&P=0&h=180",
      topics: [
        { topic: "Arithmetic", questions: "8 - 9" },
        { topic: "Algebra", questions: "5 - 6" },
        { topic: "Geometry", questions: "5 - 6" },
        { topic: "Numbers", questions: "1 - 3" },
        { topic: "Series, Logs, P and C", questions: "3 - 4" },
        { topic: "Miscellaneous", questions: "1 - 2" },
      ],
    },
    lrdiSection: {
      title: "LRDI Syllabus & Weightage",
      image:"https://tse4.mm.bing.net/th?id=OIP.KUtAAeZCe7ZwePt2n6k4EAHaEh&pid=Api&P=0&h=180",
      topics: {
        "Data Interpretation (DI)": ["Tables", "Line & Bar Graphs", "Pie Charts", "Quant Based DI"],
        "Logical Reasoning (LR)": [
          "Cubes",
          "Linear Arrangements",
          "Circular Arrangements",
          "Venn Diagrams",
          "Distribution",
          "Selection",
          "Binary Logics",
          "Games & Tournaments",
          "Network Flow Diagrams",
        ],
      },
    },
    varcSection: {
      title: "VARC Syllabus & Weightage",
      image:"https://tse1.mm.bing.net/th?id=OIP.jXDXYOJ6xRPmdyQgTKnxggHaEu&pid=Api&P=0&h=180",
      topics: {
        "Reading Comprehension Genre": [
          "Science & Tech.",
          "Business & Economics",
          "Arts, Society & Culture",
          "History & Politics",
          "Philosophy & Psychology",
          "Mixed",
        ],
        "Verbal Ability": [
          "Para Summary",
          "Para Completion",
          "Odd One Out",
          "Para Jumbles",
        ],
        "Weightage": [
          "RCs - 16 Questions (4 sets)",
          "Para Summary - 3 Questions",
          "Para Jumbles - 3 Questions",
          "Odd One Out - 2 Questions",
        ],
      },
    },
  };


 
  



  const scoreData = { // ✅ Changed Variable Name
    overall: {
      graph: graphIIM, // Graph image for Overall
      table: "https://media.iquanta.in/ui_images/score-vs-percentile-small.jpeg", // Table image for Overall
    },
    varc: {
      graph: graphIIM,
      table: "https://media.iquanta.in/ui_images/score-vs-percentile-small.jpeg",
    },
    lrdi: {
      graph: graphIIM,
      table: "https://media.iquanta.in/ui_images/score-vs-percentile-small.jpeg",
    },
    quant: {
      graph: graphIIM,
      table: "https://media.iquanta.in/ui_images/score-vs-percentile-small.jpeg",
    },
  };





const paidResources = [
  "Conceptual live Stream Classes 70+",
  "Live Application Classes 100+",
  "Conceptual lives Stream Classes 70+",
  "Mentor Driven Practice session (Weekly 4)",
  "iQuanta Exclusive Material (Per Topic 50 | Total 5000 Questions)",
  "iCAT Mocks: 20 Full | 45 Sectional",
  "IIM ABC Practice Batch 7500 Qs 500 RC SETS | 500 LRDI SETS | 2500 QA",
  "CAT Crash Course Rigorous Practice | Shortcuts | Live Marathons",
  "24×7 Doubt Solving",
  "Special Initiatives by Indrajeet Singh iQuanta 250 QA | LRDI 70 by Indra | RC 60 by Indra",
];

const freeResources = [
  { name: "CAT Past Year Papers", action: "CHECK NOW" },
  { name: "CAT Sectional Resources", action: "CHECK NOW" },
  { name: "CAT Doubt Solving Group", action: "JOIN NOW" },
  { name: "CAT LRDI Resources", action: "CHECK NOW" },
  { name: "Download Formula Book", action: "DOWNLOAD" },
  { name: "Download CAT Brochure", action: "DOWNLOAD" },
  { name: "Download MBA Brochure", action: "DOWNLOAD" },
  { name: "CAT Before CAT", action: "CHECK NOW" },
  { name: "iCAT Mocks", action: "ATTEMPT NOW" },
  { name: "120 QA Qs. Playlist", action: "CHECK NOW" },
  { name: "100 LRDI Qs. Playlist", action: "CHECK NOW" },
];





const IIMPredictionpage = () => {
  const [selectedCategory, setSelectedCategory] = useState("noSectionalCutOffs");
  const [visibleRows, setVisibleRows] = useState(5);
  const [selectedTab, setSelectedTab] = useState("whatIsMBA");
  const [activeTab, setActiveTab] = useState("quantSection");
  const [activeCategory, setActiveCategory] = useState("overall");
  const [bschoolsData, setBschoolsData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBSchools = async () => {
      try {
        const response = await axios.get("/api/bschools");
        if (response.data.success && response.data.schools) {
          const schools = response.data.schools;
          const mergedData = {
            noSectionalCutOffs: (schools.noSectionalCutOffs && schools.noSectionalCutOffs.length > 0) 
              ? schools.noSectionalCutOffs 
              : fallbackData.noSectionalCutOffs,
            lessAcadsWeightage: (schools.lessAcadsWeightage && schools.lessAcadsWeightage.length > 0) 
              ? schools.lessAcadsWeightage 
              : fallbackData.lessAcadsWeightage,
            bSchoolsViaXAT: (schools.bSchoolsViaXAT && schools.bSchoolsViaXAT.length > 0) 
              ? schools.bSchoolsViaXAT 
              : fallbackData.bSchoolsViaXAT,
          };
          setBschoolsData(mergedData);
        }
      } catch (error) {
        console.error("Error fetching B-Schools:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBSchools();
  }, []);

  const handleLoadMore = () => {
    setVisibleRows((prev) => prev + 5);
  };

  const handleLoadLess = () => {
    setVisibleRows(5);
  };

  const currentData = bschoolsData[selectedCategory] || [];

  return (
    <div>
    <div className="container" style={{ marginTop: '100px' }}>
      <h2>IIMS & TOP B-SCHOOLS VIA CAT</h2>
      <div className="button-group">
        <button className="btn btn-success " style={{fontSize:"20px"}} onClick={() => { setSelectedCategory("noSectionalCutOffs"); setVisibleRows(5); }}>No Sectional Cut Offs</button>
        <button  className="btn btn-info" style={{fontSize:"20px"}}  onClick={() => { setSelectedCategory("lessAcadsWeightage"); setVisibleRows(5); }}>Less Acads Weightage</button>
        <button  className="btn btn-primary " style={{fontSize:"20px"}}  onClick={() => { setSelectedCategory("bSchoolsViaXAT"); setVisibleRows(5); }}>B-Schools via XAT</button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Highest Package</th>
                <th>Avg. Package</th>
                <th>Exams</th>
              </tr>
            </thead>
            <tbody>
              {currentData.slice(0, visibleRows).map((item, index) => (
                <tr key={item._id || index}>
                  <td>{item.name}</td>
                  <td>{item.highestPackage}</td>
                  <td>{item.avgPackage}</td>
                  <td>{item.exams}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="load-buttons">
            {visibleRows < currentData.length && (
              <button onClick={handleLoadMore}>Load More</button>
            )}
            {visibleRows > 5 && <button onClick={handleLoadLess}>Load Less</button>}
          </div>
        </>
      )}
    </div>

    <div className="cat-container-unique">
      <h1 className="title-unique">Everything about CAT 2025</h1>
      <div className="button-group-unique">
        <button className={selectedTab === "whatIsMBA" ? "active" : ""} onClick={() => setSelectedTab("whatIsMBA")}>What is MBA?</button>
        <button className={selectedTab === "whatIsCAT" ? "active" : ""} onClick={() => setSelectedTab("whatIsCAT")}>What is CAT?</button>
        <button className={selectedTab === "examPattern" ? "active" : ""} onClick={() => setSelectedTab("examPattern")}>CAT Exam Pattern</button>
        
        <button className={selectedTab === "eligibility" ? "active" : ""} onClick={() => setSelectedTab("eligibility")}>CAT Eligibility</button>
        <button className={selectedTab === "pastPapers" ? "active" : ""} onClick={() => setSelectedTab("pastPapers")}>CAT Past Papers</button>
      </div>
      <div className="content-box-unique">
        <h2>{contentData[selectedTab].title}</h2>
        <p>{contentData[selectedTab].description}</p>
        <ul>
          {contentData[selectedTab].points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>
    </div>  



    <div className="cat-prep-container">
      <h1 className="cat-prep-title">How to Begin Preparation</h1>

      <div className="cat-prep-buttons">
        <button
          className={activeTab === "quantSection" ? "active-tab" : ""}
          onClick={() => setActiveTab("quantSection")}
        >
          QUANT
        </button>
        <button
          className={activeTab === "lrdiSection" ? "active-tab" : ""}
          onClick={() => setActiveTab("lrdiSection")}
        >
          LRDI
        </button>
        <button
          className={activeTab === "varcSection" ? "active-tab" : ""}
          onClick={() => setActiveTab("varcSection")}
        >
          VARC
        </button>
      </div>

      <div className="cat-prep-content">
        <div className="cat-prep-image">
          <img src={contentDataStyle[activeTab].image} alt={activeTab} />
        </div>
        <div className="cat-prep-details">
          <h2>{contentDataStyle[activeTab].title}</h2>

          {activeTab === "quantSection" ? (
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Questions</th>
                </tr>
              </thead>
              <tbody>
                {contentDataStyle.quantSection.topics.map((item, index) => (
                  <tr key={index}>
                    <td>{item.topic}</td>
                    <td>{item.questions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            Object.entries(contentDataStyle[activeTab].topics).map(([key, value], index) => (
              <div key={index} className="cat-prep-topic-section">
                <h3>{key}</h3>
                <ul>
                  {value.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>




    <div className="cat-score-container">
  <h1 className="cat-score-heading">CAT Score vs Percentile in 2025</h1>
  <p className="cat-score-description">
    <strong>CAT Score:</strong> The total marks obtained by a candidate in the CAT exam.
  </p>
  <p className="cat-score-description">
    <strong>CAT Percentile:</strong> The relative position of a candidate as compared to all other test takers.
  </p>
  <p className="cat-score-text">
    The final CAT result consists of both CAT score and CAT percentile. For admissions, all MBA colleges consider CAT percentile. Your score is the determinant of percentile.
    Score Vs Percentile information is an important aspect considering the increasing competition in CAT.
  </p>

  <div className="cat-score-buttons">
    <button className={activeCategory === "overall" ? "active" : ""} onClick={() => setActiveCategory("overall")}>Overall</button>
    <button className={activeCategory === "varc" ? "active" : ""} onClick={() => setActiveCategory("varc")}>VARC</button>
    <button className={activeCategory === "lrdi" ? "active" : ""} onClick={() => setActiveCategory("lrdi")}>LRDI</button>
    <button className={activeCategory === "quant" ? "active" : ""} onClick={() => setActiveCategory("quant")}>Quant</button>
  </div>

  <div className="cat-score-content">
    <div className="cat-score-graph">
      <img src={scoreData[activeCategory]?.graph} alt="Graph" className="graph-transition" />
    </div>
    <div className="cat-score-table">
      <img src={scoreData[activeCategory]?.table} alt="Score Table" className="table-transition" />
    </div>
  </div>
</div>






<div className="cat-resources-container">
      <h1 className="cat-resources-heading">IQUANTA'S CAT RESOURCES</h1>

      {/* Paid & Free Sections */}
      <div className="cat-resources-section">
        {/* Paid Section */}
        <div className="resource-box paid-section">
          <h2 className="resource-title">PAID</h2>
          <ul className="resource-list">
            {paidResources.map((resource, index) => (
              <li key={index} className="resource-item">
                <span className="resource-number">{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                <span>{resource}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Free Section */}
        <div className="resource-box free-section">
          <h2 className="resource-title" style={{ color: "green" }}>FREE</h2>
          <ul className="resource-list">
            {freeResources.map((resource, index) => (
              <li key={index} className="resource-item">
                <span className="resource-number">{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                <span>{resource.name}</span>
                <button className="resource-button">{resource.action}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Enroll Now Section */}
      <div className="enroll-container">
        <p className="enroll-text">Everything Included in CAT Full Course just buy IIM ABC as an addon.</p>
        <button className="enroll-button">ENROL NOW</button>
      </div>
    </div>





    </div>
  );
};

export default  IIMPredictionpage;
