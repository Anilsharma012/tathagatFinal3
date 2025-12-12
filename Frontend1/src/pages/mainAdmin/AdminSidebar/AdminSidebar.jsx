import React from "react";
import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaBookOpen, FaUsers, FaUserGraduate, FaChalkboardTeacher, FaUserCircle, FaSignOutAlt, FaClipboardList, FaFileAlt, FaBullhorn, FaComments, FaGraduationCap, FaUniversity, FaBlog, FaYoutube, FaTrophy, FaFileInvoice, FaDownload, FaStar } from "react-icons/fa";
import logo from "../../../images/tgLOGO.png"
import "./AdminSidebar.css";

const AdminSidebar = () => {
  return (
    <div className="admin-sidebar">
      <div className="admin-logo"> 
        <img src={logo} alt="" />
      </div>
      <nav className="admin-nav">
        <NavLink to="/admin/dashboard" className="admin-link">
          <FaTachometerAlt className="admin-icon" /> Dashboard
        </NavLink>
        <NavLink to="/admin/add-courses" className="admin-link">
          <FaBookOpen className="admin-icon" /> Add Courses
        </NavLink>
        <NavLink to="/admin/course-content-manager" className="admin-link">
  <FaBookOpen className="admin-icon" /> Manage Subjects
</NavLink>

        <NavLink to="/admin/view-courses" className="admin-link">
          <FaBookOpen className="admin-icon" /> View Courses
        </NavLink>
        <NavLink to="/admin/practice-tests" className="admin-link">
          <FaClipboardList className="admin-icon" /> Practice Tests
        </NavLink>
        <NavLink to="/admin/mock-tests" className="admin-link">
          <FaGraduationCap className="admin-icon" /> Mock Tests
        </NavLink>
        <NavLink to="/admin/mock-test-feedback" className="admin-link">
          <FaComments className="admin-icon" /> Test Feedback
        </NavLink>
        <NavLink to="/admin/iim-colleges" className="admin-link">
          <FaUniversity className="admin-icon" /> IIM Predictor
        </NavLink>
        <NavLink to="/admin/response-sheet-submissions" className="admin-link">
          <FaFileInvoice className="admin-icon" /> Response Sheets
        </NavLink>
        <NavLink to="/admin/bschools" className="admin-link">
          <FaUniversity className="admin-icon" /> B-Schools
        </NavLink>
        <NavLink to="/admin/study-materials" className="admin-link">
          <FaFileAlt className="admin-icon" /> Study Materials
        </NavLink>
        <NavLink to="/admin/announcements" className="admin-link">
          <FaBullhorn className="admin-icon" /> Announcements
        </NavLink>
        <NavLink to="/admin/popup-announcements" className="admin-link">
          <FaBullhorn className="admin-icon" /> Homepage Popups
        </NavLink>
        <NavLink to="/admin/discussions" className="admin-link">
          <FaComments className="admin-icon" /> Discussions
        </NavLink>
        <NavLink to="/admin/blogs" className="admin-link">
          <FaBlog className="admin-icon" /> Blog Management
        </NavLink>
        <NavLink to="/admin/demo-videos" className="admin-link">
          <FaYoutube className="admin-icon" /> Demo Videos
        </NavLink>
        <NavLink to="/admin/downloads" className="admin-link">
          <FaDownload className="admin-icon" /> Downloads
        </NavLink>
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

        <div className="admin-group-title">Analytics</div>
        <NavLink to="/admin/evaluate-answers" className="admin-link">Evaluate Answers (OCR)</NavLink>
        <NavLink to="/admin/reports" className="admin-link">Reports</NavLink>

        <div className="admin-group-title">CRM</div>
        <NavLink to="/admin/enquiries" className="admin-link">New Enquiries</NavLink>
        <NavLink to="/admin/crm/leads" className="admin-link">CRM Leads</NavLink>
        <NavLink to="/admin/crm/leads/new" className="admin-link">Create Lead</NavLink>
        <NavLink to="/admin/crm/pipeline" className="admin-link">Pipeline</NavLink>
        <NavLink to="/admin/crm/invoices" className="admin-link">Invoices</NavLink>
        <NavLink to="/admin/payments" className="admin-link">Payments</NavLink>
        <NavLink to="/admin/crm/settings" className="admin-link">Settings</NavLink>

        <div className="admin-group-title">Live Classes</div>
        <NavLink to="/admin/live-batches" className="admin-link">Live Batches</NavLink>
        <NavLink to="/admin/live-classes" className="admin-link">Quick Classes</NavLink>

        <NavLink to="/admin/all-users" className="admin-link">
          <FaUsers className="admin-icon" /> All Users
        </NavLink>
        <NavLink to="/admin/all-students" className="admin-link">
          <FaUserGraduate className="admin-icon" /> All Students
        </NavLink>
        <NavLink to="/admin/all-teachers" className="admin-link">
          <FaChalkboardTeacher className="admin-icon" /> All Teachers
        </NavLink>
        <NavLink to="/admin/profile" className="admin-link">
          <FaUserCircle className="admin-icon" /> Profile
        </NavLink>
        <NavLink to="/" className="admin-link">
          <FaSignOutAlt className="admin-icon" /> Logout
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;
