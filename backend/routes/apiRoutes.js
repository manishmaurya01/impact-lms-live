const express = require('express');
const router = express.Router();

// Middleware
const interviewCtrl = require('../controllers/interviewController');
const authorizeToken = require('../middlewares/authMiddleware');

// Controllers
const mainControllers = require('../controllers/mainControllers');

const authCtrl = mainControllers.authCtrl || {};
const dashboardCtrl = mainControllers.dashboardCtrl || {};
const pedagogyCtrl = mainControllers.pedagogyCtrl || {};
const workspaceCtrl = mainControllers.workspaceCtrl || {};
const evaluationCtrl = mainControllers.evaluationCtrl || {};
const quizCtrl = mainControllers.quizCtrl || {};
const doubtCtrl = mainControllers.doubtCtrl || {};

const fallbackHandler = (req, res) => res.status(501).json({ success: false, message: "Route handler not implemented yet." });

// =========================================================================
// 1. Authentication
// =========================================================================
router.post('/auth/register', authCtrl.register || fallbackHandler);
router.post('/auth/login', authCtrl.login || fallbackHandler);
router.post('/auth/google', authCtrl.googleLogin || fallbackHandler);

// =========================================================================
// 2. Dashboard Analytics
// =========================================================================
router.get('/dashboard/analytics', authorizeToken, dashboardCtrl.getAnalytics || fallbackHandler);

// =========================================================================
// 3. Courses
// =========================================================================
router.get('/courses', authorizeToken, pedagogyCtrl.getCourses || fallbackHandler);
router.post('/courses/generate', authorizeToken, pedagogyCtrl.generateCourse || fallbackHandler);
router.post('/courses/fetch-material', authorizeToken, pedagogyCtrl.fetchMaterial || fallbackHandler);
router.delete('/courses/:id', authorizeToken, pedagogyCtrl.deleteCourse || fallbackHandler);

// =========================================================================
// 4. Notes
// =========================================================================
router.post('/notes/save', authorizeToken, workspaceCtrl.saveNote || fallbackHandler);
router.post('/notes/generate-ai', authorizeToken, workspaceCtrl.generateAINote || fallbackHandler);
router.get('/notes/course/:courseId', authorizeToken, workspaceCtrl.getNotesByCourse || fallbackHandler);
router.delete('/notes/:noteId', authorizeToken, workspaceCtrl.deleteNote || fallbackHandler);

// =========================================================================
// 5. Assignments
// =========================================================================
router.post('/assignment/check-lock', authorizeToken, evaluationCtrl.checkAssignmentLock || fallbackHandler);
router.post('/assignment/submit', authorizeToken, evaluationCtrl.submitAssignment || fallbackHandler);
router.post('/assignment/evaluate-via-ai', authorizeToken, evaluationCtrl.evaluateAssignmentViaAI || fallbackHandler);

// =========================================================================
// 6. Quizzes
// =========================================================================
router.post('/quiz/check-lock-state', authorizeToken, quizCtrl.checkQuizLockState || fallbackHandler);
router.post('/quiz/generate-and-save', authorizeToken, quizCtrl.generateAndSaveQuiz || fallbackHandler);
router.post('/quiz/record-results', authorizeToken, quizCtrl.recordQuizResults || fallbackHandler);

// =========================================================================
// 7. AI Proctored Interview
// =========================================================================
router.get('/interview/dashboard-meta', authorizeToken, interviewCtrl.getInterviewDashboardMeta || fallbackHandler);
router.get('/interview/history-logs', authorizeToken, interviewCtrl.historyLogs || fallbackHandler);
router.get('/interview/session-detail/:interviewId', authorizeToken, interviewCtrl.getInterviewSessionDetail || fallbackHandler);
router.post('/interview/schedule', authorizeToken, interviewCtrl.scheduleInterview || fallbackHandler);
router.post('/interview/start-session', authorizeToken, interviewCtrl.startInterviewSession || fallbackHandler);
router.post('/interview/conversation-step', authorizeToken, interviewCtrl.processConversationStep || fallbackHandler);
router.post('/interview/sync-proctor', authorizeToken, interviewCtrl.syncProctorMetrics || fallbackHandler);

// =========================================================================
// 8. AI Doubt Solver
// =========================================================================
router.post('/doubt/ask', authorizeToken, doubtCtrl.askDoubt || fallbackHandler);

module.exports = router;