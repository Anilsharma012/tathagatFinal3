# Tathagat - CAT Exam Preparation Platform

## Overview
Tathagat is a full-stack educational platform for CAT (Common Admission Test) preparation, offering course management, mock tests, live classes, and student progress tracking. It aims to provide a robust and engaging learning experience to effectively prepare students for the CAT exam, with aspirations to secure a significant share of the online test preparation market. Key features include student dashboards, a comprehensive mock test system, live class integration, and an administrative panel for content management.

## User Preferences
No specific user preferences were provided.

## System Architecture
The platform employs a decoupled frontend and backend architecture.

**UI/UX Decisions:**
- The frontend is built with React, focusing on a dynamic and responsive user interface.
- React-Quill provides rich text editing for course content and questions, featuring custom toolbars and image upload capabilities.
- The mock test student experience precisely replicates the CAT exam flow: Instructions → Declaration → Test Start.
- Custom CSS styling ensures a professional aesthetic, incorporating a teal/green theme for specific admin panel features.
- HTML content displayed to students is securely sanitized using DOMPurify to prevent XSS attacks while supporting rich text and images.

**Technical Implementations:**
- **Course Management:** Supports "Full Course," "Recorded Classes," and "Mock Tests" content types with full CRUD for videos, serial ordering, topic organization, and granular free/paid access control.
- **Unified Mock Test Management:** Admin interface allows selecting a "Mock Tests" type course, managing test series within it, and adding tests. This integrates course-specific mock tests into a central management system.
- **Test Configuration:** Admins can configure section-wise duration and question counts for all test types.
- **Question Management:** Features a robust question builder supporting rich text, image uploads, and bulk CSV uploads with normalization for sections and difficulty levels. Questions are displayed in section-wise groups (VARC → DILR → QA → GENERAL) with colored headers and accurate per-section counts. Section normalization handles variant names (e.g., 'Quant' → 'QA', 'Verbal' → 'VARC').
- **Video Access Control:** Database-level filtering ensures only authorized users can access paid video content based on enrollment status.
- **Partial Updates:** Course update APIs support partial modifications, preventing unintended data loss.
- **Exam Hierarchy:** Backend infrastructure supports filtering exams by category, year, and slot.
- **B-Schools Admin Management:** Includes a BSchool model with categories and CRUD APIs for administration. The frontend provides a dedicated management page for B-Schools with category tabs and inline editing.
- **Bulk Question Upload:** A dedicated API and frontend interface allow bulk uploading of questions via CSV, including validation, error reporting, and a demo template.
- **Copy Subject Feature:** An API allows deep copying a subject and its entire hierarchy (chapters, topics, tests, questions) to another course, ensuring data integrity through transactions and ID remapping.
- **Live Batch Classes:** A comprehensive system for managing live batches and sessions, including `LiveBatch`, `LiveSession`, `CourseLiveBatch`, and `Notification` models. It supports admin CRUD operations, course attachment, and student notifications (in-app and email) for upcoming sessions. Student APIs provide a personalized live schedule based on enrollment and visibility.
- **IIM Predictor:** Features an `IIMCollege` model with cutoffs and target percentiles. Admin CRUD APIs manage colleges, while a public evaluation API calculates bucket percentiles, academics, and work experience scores, applying category/gender bonuses. The frontend displays detailed results, including eligibility, and an admin interface to view student submissions.
- **Homepage Popup Announcements:** A promotional announcement system with image uploads, customizable text/links, and date scheduling. Includes a `PopupAnnouncement` model, admin CRUD APIs at `/api/popup-announcements`, and a frontend popup component with 24-hour dismissal via localStorage. Images are stored in `backend1/uploads/popups/` and served via `/uploads` proxy.
- **Blog Management System:** Complete blog platform with admin CRUD at `/admin/blogs`, public display at `/ourBlog`, and full blog view at `/blog/:slug`. Features include category filtering (CAT, IPMAT, CUET, MBA, B-Schools, Info Exam, Topper's Journey), Top Blogs flagging, auto-slug generation, excerpt creation, rich text content with image uploads, and view tracking. Backend APIs at `/api/v5` with Blog model supporting all CRUD operations. ExploreBlog component on homepage shows latest blogs with category filtering.
- **Demo Video Management:** Admin-managed demo video system for the course-details page. Features include DemoVideo model with YouTube URL, title, category (All/QUANT/VARC/LRDI), order, and active status fields. Admin CRUD at `/admin/demo-videos` with add/edit/delete functionality. Public API at `/api/demo-videos/public` fetches active videos for display on the CourseDetails page with category filtering. Videos are dynamically loaded from the backend instead of hardcoded.
- **Response Sheet Submissions Tracking:** When students check their IIM response sheet via the IIM Predictor, their details (Application No, Candidate Name, Roll No, Subject, Test Date/Time) are automatically extracted from the HTML and saved to the database. Admin management page at `/admin/response-sheet-submissions` allows viewing, searching, and deleting submissions with CSV export functionality. Uses `ResponseSheetSubmission` model with API routes at `/api/v3/admin/submissions`.
- **Downloads Management System:** Dynamic admin-controlled system for managing Previous Years' Papers and Topic-Wise Previous Years' Questions. Uses `DownloadCategory` and `DownloadTest` models with two content types: PREVIOUS_YEAR and TOPIC_WISE. Admin CRUD at `/admin/downloads` with tabs, PDF upload capability, status management (COMING_SOON/PUBLISHED), and display ordering. Public APIs at `/api/downloads/public/categories` and `/api/downloads/public/tests` feed the `/mock-test` page. MockTest.jsx fetches dynamic data from the API instead of using hardcoded arrays. Login-gated functionality redirects unauthenticated users to login before attempting tests.
- **Best Results in the Industry (Top Performers):** Admin-managed system for displaying student success stories on the homepage. Uses `TopPerformer` model with name, percentile, photo upload, display order, and active status fields. Admin CRUD at `/admin/top-performers` with photo upload, ordering controls, and status toggle. Public API at `/api/top-performers/public` fetches active performers for display on ThirdPage.jsx. Photos are stored in `backend1/uploads/top-performers/` and served via `/uploads` proxy.
- **Dynamic Course Purchase Page:** Fully dynamic course purchase/detail pages with admin-controlled content. Uses `CoursePurchaseContent` model with comprehensive fields for hero section (video URL, title, prices, key bullets), about section, curriculum sections, material includes, requirements, instructors, and reviews. Admin CRUD at `/admin/course-purchase-content` with course selector dropdown. Public API at `/api/course-purchase-content/public/:courseId` fetches content for dynamic rendering. Frontend route `/course-purchase/:courseId` loads course-specific content while maintaining the same design. "Enroll Now" buttons across the app redirect to dynamic URLs with courseId. Supports fallback to default content when no custom content is configured.
- **Student Mock Test Analytics & Reports:** Comprehensive analysis dashboard for students at `/student/reports` showing test performance. Features include:
  - Stats cards displaying total tests taken, average score, best score, and average time
  - Performance trend line chart using Chart.js showing score progression over tests
  - Section-wise doughnut chart and accuracy bar chart for VARC/DILR/QA breakdown
  - Section stats cards with average scores, accuracy percentages, and time spent
  - Complete test history table with individual attempt details
  - Per-test leaderboard modal showing top 10 students with current user's rank highlighted
  - Backend APIs at `/api/mock-tests/reports/summary`, `/api/mock-tests/reports/:testId/leaderboard`, and `/api/mock-tests/reports/section-analysis`
- **Mock Test Feedback System:** CAT-style candidate feedback form shown after test submission. Students rate exam support, digital experience, center facilities, and overall satisfaction. Feedback stored in `MockTestFeedback` model with admin management at `/admin/mock-test-feedback` including CSV export, search, and statistics overview.
- **Free Mock Tests System:** Admin can create mock tests that are not linked to any specific course using the "Free Mock Tests" toggle in Mock Test Management. These tests use `isFree: true` flag with no courseId/seriesId. Students can access all published free tests in the "Free Tests" tab of their Mock Tests page without needing course enrollment. Backend APIs support CRUD operations via `courseId=free` query parameter.
- **Inquiry Management System:** Centralized lead capture and management from all website forms. Uses `CRMLead` model with `formType` field categorizing inquiries as 'contact', 'demo_reservation', 'guide_form', 'faq_question', or 'other'. Public endpoint at `/api/crm/leads/enquiry` accepts form submissions with formType. Admin-only endpoints `/api/crm/leads/by-type/:formType` and `/api/crm/leads/form-type-counts` enable filtered viewing and statistics. Frontend forms (ScoreCard, SuccessStory, MockTest, GetInTouch, FAQ) submit leads with appropriate formType. Admin management at `/admin/inquiries` provides filter buttons for each form type, search functionality, and CSV export. Integrated into admin sidebar under CRM section.
- **Course Scheduling System:** Admins can set Start Date and End Date for courses via the Add/Edit Course form. Features include:
  - Start Date: Content is locked until this date arrives. Students can purchase and enroll but cannot access videos, tests, or materials until start date.
  - End Date (optional): Course can optionally expire. `keepAccessAfterEnd` setting controls whether content remains accessible after end date.
  - Status Badges: Course cards in admin panel show Upcoming (yellow), Active (green), or Expired (red) badges based on current date.
  - Student Lock UI: When students try to access content before start date, they see a friendly "Course Starting Soon" message with the start date displayed.
  - Server-side Access Control: `checkCourseAccess` function in StudentCourseController validates date-based access before serving any content.
  - Backward Compatibility: Existing courses without startDate are treated as already started (content accessible immediately after publish).

**System Design Choices:**
- **Backend:** Node.js/Express API server, using MongoDB Atlas for data storage.
- **Frontend:** React application.
- **Deployment:** Configured for VM deployment, running unified development scripts.
- **Authentication:** JWT-based authentication secures API endpoints. Auto-login detection redirects already logged-in users directly to dashboard without re-entering OTP. Token verification endpoint at `/api/auth/verify-token` validates existing sessions.
- **API Proxying:** Frontend proxies all `/api` requests to the backend.

## External Dependencies
- **Database:** MongoDB Atlas
- **Payment Gateway:** Razorpay
- **Live Classes:** Zoom
- **Email Service:** Nodemailer
- **Frontend Libraries:** React, React Router, Axios, Chart.js, PapaParse
- **Rich Text Editor:** React-Quill
- **HTML Sanitization:** DOMPurify