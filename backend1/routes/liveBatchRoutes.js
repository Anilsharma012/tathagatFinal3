const express = require('express');
const router = express.Router();
const { authMiddleware, adminAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/LiveBatchController');

router.get('/subjects', adminAuth, ctrl.listSubjectsForBatches);
router.get('/courses', adminAuth, ctrl.getAllCoursesForLinking);
router.get('/course-subject-map', adminAuth, ctrl.getCourseSubjectMap);

router.post('/batches', adminAuth, ctrl.createBatch);
router.get('/batches', adminAuth, ctrl.listBatches);
router.get('/batches/:id', adminAuth, ctrl.getBatch);
router.put('/batches/:id', adminAuth, ctrl.updateBatch);
router.delete('/batches/:id', adminAuth, ctrl.deleteBatch);

router.post('/sessions', adminAuth, ctrl.createSession);
router.get('/sessions', adminAuth, ctrl.listSessions);
router.get('/sessions/:id', adminAuth, ctrl.getSession);
router.put('/sessions/:id', adminAuth, ctrl.updateSession);
router.delete('/sessions/:id', adminAuth, ctrl.deleteSession);

router.post('/batches/attach-courses', adminAuth, ctrl.attachCourses);
router.delete('/batches/:liveBatchId/courses/:courseId', adminAuth, ctrl.detachCourse);
router.get('/batches/:liveBatchId/courses', adminAuth, ctrl.getLinkedCourses);

router.get('/student/schedule', authMiddleware, ctrl.getStudentSchedule);

module.exports = router;
