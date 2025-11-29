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
- **Question Management:** Features a robust question builder supporting rich text, image uploads, and bulk CSV uploads with normalization for sections and difficulty levels.
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

**System Design Choices:**
- **Backend:** Node.js/Express API server, using MongoDB Atlas for data storage.
- **Frontend:** React application.
- **Deployment:** Configured for VM deployment, running unified development scripts.
- **Authentication:** JWT-based authentication secures API endpoints.
- **API Proxying:** Frontend proxies all `/api` requests to the backend.

## External Dependencies
- **Database:** MongoDB Atlas
- **Payment Gateway:** Razorpay
- **Live Classes:** Zoom
- **Email Service:** Nodemailer
- **Frontend Libraries:** React, React Router, Axios, Chart.js, PapaParse
- **Rich Text Editor:** React-Quill
- **HTML Sanitization:** DOMPurify