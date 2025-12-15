# Tathagat - CAT Exam Preparation Platform

## Overview
Tathagat is a full-stack educational platform designed for CAT (Common Admission Test) preparation. It offers comprehensive course management, mock tests, live classes, and student progress tracking. The platform aims to provide an engaging and effective learning experience to help students excel in the CAT exam, with the ambition to capture a significant share of the online test preparation market. Key capabilities include student dashboards, an extensive mock test system, live class integration, and an administrative panel for content management.

## User Preferences
No specific user preferences were provided.

## System Architecture
The platform utilizes a decoupled frontend and backend architecture.

**UI/UX Decisions:**
- The frontend is developed using React, emphasizing a dynamic and responsive user experience.
- React-Quill is integrated for rich text editing, supporting custom toolbars and image uploads.
- The mock test interface is designed to meticulously replicate the actual CAT exam experience.
- Custom CSS with a teal/green theme is applied for a professional aesthetic, especially within the admin panel.
- DOMPurify is used to sanitize HTML content displayed to students, preventing XSS vulnerabilities while enabling rich text and images.

**Technical Implementations:**
- **Content Management:** Supports various content types like "Full Course," "Recorded Classes," and "Mock Tests" with full CRUD functionality, video ordering, topic organization, and granular access control (free/paid).
- **Mock Test System:** Unified admin interface for managing mock tests, including test series configuration, section-wise duration, and question counts.
- **Question Management:** Features a robust question builder with rich text, image uploads, and bulk CSV upload capabilities, including section and difficulty normalization.
- **Access Control:** Database-level filtering ensures authorized access to content based on user enrollment.
- **Partial Updates:** APIs support partial modifications for courses to prevent data loss.
- **Exam and B-School Management:** Infrastructure to filter exams by category, year, and slot. Includes CRUD for B-Schools with categories and inline editing.
- **Bulk Question Upload:** Dedicated API and frontend for bulk CSV question uploads with validation and error reporting.
- **Copy Subject Feature:** Allows deep copying of subjects and their hierarchical content across courses using transactional integrity.
- **Live Batch Classes:** Comprehensive system for managing live batches and sessions, including scheduling, notifications (in-app and email), and personalized student schedules.
- **IIM Predictor:** Evaluates student profiles against `IIMCollege` cutoffs, calculating bucket percentiles and applying category/gender bonuses. Includes admin oversight for submissions.
- **Homepage Announcements:** Promotional popup system with image uploads, customizable text/links, and date scheduling.
- **Blog Management:** Full-featured blog platform with admin CRUD, public display, category filtering, auto-slug generation, rich text, image uploads, and view tracking.
- **Demo Video Management:** Admin-controlled system for managing demo videos on course-details pages, supporting YouTube URLs and categorizations.
- **Response Sheet Submissions:** Automatically extracts and saves student details from IIM response sheets for administrative viewing and export.
- **Downloads Management:** Dynamic system for managing previous years' papers and topic-wise questions, with PDF upload, status management, and public API access.
- **Top Performers:** Admin-managed display of student success stories with photos, percentiles, and ordering.
- **Dynamic Course Purchase Page:** Fully dynamic course purchase and detail pages with admin-controlled content for hero sections, about, curriculum, materials, instructors, and reviews.
- **Student Mock Test Analytics:** Comprehensive student dashboard with performance trends, section-wise analysis, and a complete test history with leaderboards.
- **Mock Test Feedback System:** CAT-style feedback form for students post-test, with admin management and statistics.
- **Free Mock Tests System:** Allows creation and management of free mock tests accessible to all students without course enrollment.
- **Inquiry Management:** Centralized system for capturing and managing leads from all website forms, with categorization, admin filtering, and CSV export.
- **Course Scheduling:** Admins can set start and end dates for courses, controlling content access and displaying course status.
- **Image Gallery Management:** Admin-managed gallery for images and videos, supporting YouTube URLs, direct image uploads, and featured content.
- **PDF Tax Invoice System:** Generates professional, GST-compliant PDF tax invoices for student purchases, with configurable company details, automated tax calculation (CGST/SGST/IGST), and signature uploads.

**System Design Choices:**
- **Backend:** Node.js/Express.js.
- **Frontend:** React.js.
- **Database:** MongoDB Atlas.
- **Deployment:** Configured for VM deployment.
- **Authentication:** JWT-based authentication with auto-login detection and token verification.
- **API Proxying:** Frontend proxies `/api` requests to the backend.

## External Dependencies
- **Database:** MongoDB Atlas
- **Payment Gateway:** Razorpay
- **Live Classes:** Zoom
- **Email Service:** Nodemailer
- **Frontend Libraries:** React, React Router, Axios, Chart.js, PapaParse
- **Rich Text Editor:** React-Quill
- **HTML Sanitization:** DOMPurify
- **PDF Generation:** Puppeteer (used with Handlebars templating)