import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaBookOpen, FaUsers, FaUserGraduate, FaChalkboardTeacher, FaUserCircle, FaSignOutAlt, FaClipboardList, FaFileAlt, FaBullhorn, FaComments, FaGraduationCap, FaUniversity, FaBlog, FaYoutube, FaTrophy, FaFileInvoice, FaDownload, FaStar, FaCog, FaFilePdf, FaImages, FaUserShield } from "react-icons/fa";
import logo from "../../../images/tgLOGO.png"
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const [permissions, setPermissions] = useState({});
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedPermissions = localStorage.getItem("adminPermissions");
      const storedUser = localStorage.getItem("adminUser");
      
      if (storedPermissions) {
        setPermissions(JSON.parse(storedPermissions));
      }
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserType(user.userType);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
    }
  }, []);

  const hasPermission = (module, action = "view") => {
    if (userType === "superadmin") return true;
    return permissions[module]?.[action] === true;
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminPermissions");
    navigate("/admin");
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-logo"> 
        <img src={logo} alt="" />
      </div>
      <nav className="admin-nav">
        {hasPermission("dashboard") && (
          <NavLink to="/admin/dashboard" className="admin-link">
            <FaTachometerAlt className="admin-icon" /> Dashboard
          </NavLink>
        )}
        
        {hasPermission("courses") && (
          <>
            <NavLink to="/admin/add-courses" className="admin-link">
              <FaBookOpen className="admin-icon" /> Add Courses
            </NavLink>
            <NavLink to="/admin/course-content-manager" className="admin-link">
              <FaBookOpen className="admin-icon" /> Manage Subjects
            </NavLink>
            <NavLink to="/admin/view-courses" className="admin-link">
              <FaBookOpen className="admin-icon" /> View Courses
            </NavLink>
          </>
        )}
        
        {hasPermission("practiceTests") && (
          <NavLink to="/admin/practice-tests" className="admin-link">
            <FaClipboardList className="admin-icon" /> Practice Tests
          </NavLink>
        )}
        
        {hasPermission("mockTests") && (
          <>
            <NavLink to="/admin/mock-tests" className="admin-link">
              <FaGraduationCap className="admin-icon" /> Mock Tests
            </NavLink>
            <NavLink to="/admin/mock-test-feedback" className="admin-link">
              <FaComments className="admin-icon" /> Test Feedback
            </NavLink>
          </>
        )}
        
        {hasPermission("iimPredictor") && (
          <>
            <NavLink to="/admin/iim-colleges" className="admin-link">
              <FaUniversity className="admin-icon" /> IIM Predictor
            </NavLink>
            <NavLink to="/admin/response-sheet-submissions" className="admin-link">
              <FaFileInvoice className="admin-icon" /> Response Sheets
            </NavLink>
          </>
        )}
        
        {hasPermission("bschools") && (
          <NavLink to="/admin/bschools" className="admin-link">
            <FaUniversity className="admin-icon" /> B-Schools
          </NavLink>
        )}
        
        {hasPermission("studyMaterials") && (
          <>
            <NavLink to="/admin/study-materials" className="admin-link">
              <FaFileAlt className="admin-icon" /> Study Materials
            </NavLink>
            <NavLink to="/admin/pdf-management" className="admin-link">
              <FaFilePdf className="admin-icon" /> PDF Management
            </NavLink>
          </>
        )}
        
        {hasPermission("announcements") && (
          <>
            <NavLink to="/admin/announcements" className="admin-link">
              <FaBullhorn className="admin-icon" /> Announcements
            </NavLink>
            <NavLink to="/admin/popup-announcements" className="admin-link">
              <FaBullhorn className="admin-icon" /> Homepage Popups
            </NavLink>
          </>
        )}
        
        {hasPermission("discussions") && (
          <NavLink to="/admin/discussions" className="admin-link">
            <FaComments className="admin-icon" /> Discussions
          </NavLink>
        )}
        
        {hasPermission("blogs") && (
          <NavLink to="/admin/blogs" className="admin-link">
            <FaBlog className="admin-icon" /> Blog Management
          </NavLink>
        )}
        
        {hasPermission("courses") && (
          <NavLink to="/admin/demo-videos" className="admin-link">
            <FaYoutube className="admin-icon" /> Demo Videos
          </NavLink>
        )}
        
        {hasPermission("gallery") && (
          <NavLink to="/admin/image-gallery" className="admin-link">
            <FaImages className="admin-icon" /> Image Gallery
          </NavLink>
        )}
        
        {hasPermission("downloads") && (
          <NavLink to="/admin/downloads" className="admin-link">
            <FaDownload className="admin-icon" /> Downloads
          </NavLink>
        )}
        
        {hasPermission("courses") && (
          <>
            <NavLink to="/admin/scorecard-management" className="admin-link">
              <FaTrophy className="admin-icon" /> Score Cards
            </NavLink>
            <NavLink to="/admin/success-stories" className="admin-link">
              <FaTrophy className="admin-icon" /> Success Stories
            </NavLink>
            <NavLink to="/admin/top-performers" className="admin-link">
              <FaStar className="admin-icon" /> Best Results
            </NavLink>
            <NavLink to="/admin/course-purchase-content" className="admin-link">
              <FaFileAlt className="admin-icon" /> Course Page Content
            </NavLink>
          </>
        )}

        {hasPermission("reports") && (
          <>
            <div className="admin-group-title">Analytics</div>
            <NavLink to="/admin/evaluate-answers" className="admin-link">Evaluate Answers (OCR)</NavLink>
            <NavLink to="/admin/reports" className="admin-link">Reports</NavLink>
          </>
        )}

        {(hasPermission("leads") || hasPermission("crm") || hasPermission("payments")) && (
          <>
            <div className="admin-group-title">CRM</div>
            {hasPermission("leads") && (
              <>
                <NavLink to="/admin/inquiries" className="admin-link">All Inquiries</NavLink>
                <NavLink to="/admin/enquiries" className="admin-link">New Enquiries</NavLink>
              </>
            )}
            {hasPermission("crm") && (
              <>
                <NavLink to="/admin/crm/leads" className="admin-link">CRM Leads</NavLink>
                <NavLink to="/admin/crm/leads/new" className="admin-link">Create Lead</NavLink>
                <NavLink to="/admin/crm/pipeline" className="admin-link">Pipeline</NavLink>
                <NavLink to="/admin/crm/invoices" className="admin-link">Invoices</NavLink>
              </>
            )}
            {hasPermission("payments") && (
              <NavLink to="/admin/payments" className="admin-link">Payments</NavLink>
            )}
            {hasPermission("billing") && (
              <NavLink to="/admin/billing-settings" className="admin-link"><FaCog className="admin-icon" /> Billing Settings</NavLink>
            )}
            {hasPermission("crm") && (
              <NavLink to="/admin/crm/settings" className="admin-link">Settings</NavLink>
            )}
          </>
        )}

        {hasPermission("liveClasses") && (
          <>
            <div className="admin-group-title">Live Classes</div>
            <NavLink to="/admin/live-batches" className="admin-link">Live Batches</NavLink>
            <NavLink to="/admin/live-classes" className="admin-link">Quick Classes</NavLink>
          </>
        )}

        {hasPermission("students") && (
          <>
            <NavLink to="/admin/all-users" className="admin-link">
              <FaUsers className="admin-icon" /> All Users
            </NavLink>
            <NavLink to="/admin/all-students" className="admin-link">
              <FaUserGraduate className="admin-icon" /> All Students
            </NavLink>
          </>
        )}
        
        {hasPermission("faculty") && (
          <NavLink to="/admin/all-teachers" className="admin-link">
            <FaChalkboardTeacher className="admin-icon" /> All Teachers
          </NavLink>
        )}

        <div className="admin-group-title">Settings</div>
        {hasPermission("roleManagement") && (
          <NavLink to="/admin/role-management" className="admin-link">
            <FaUserShield className="admin-icon" /> Role Management
          </NavLink>
        )}
        <NavLink to="/admin/profile" className="admin-link">
          <FaUserCircle className="admin-icon" /> Profile
        </NavLink>
        <button onClick={handleLogout} className="admin-link admin-logout-btn">
          <FaSignOutAlt className="admin-icon" /> Logout
        </button>
      </nav>
    </div>
  );
};

export default AdminSidebar;
