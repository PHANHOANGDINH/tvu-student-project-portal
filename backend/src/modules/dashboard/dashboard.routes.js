import express from 'express';
import auth from '../../middlewares/auth.middleware.js';
import role from '../../middlewares/role.middleware.js';
import { USER_ROLES as R } from '../../constants/roles.js';
import * as c from './dashboard.controller.js';
import { dataset } from './dashboard-analytics.controller.js';

const build = (userRole, legacy, names) => {
  const router = express.Router();
  router.use(auth, role(userRole));
  router.get('/', legacy);
  names.forEach(([path, name]) => router.get(`/${path}`, dataset(userRole.toLowerCase(), name)));
  return router;
};

export const adminDashboardRoutes = build(R.ADMIN, c.admin, [['summary','summary'],['accounts-by-role','accountsByRole'],['course-classes-by-semester','courseClassesBySemester'],['students-by-faculty','studentsByFaculty'],['topics-by-status','topicsByStatus'],['submissions-over-time','submissionsOverTime'],['course-classes-by-course','courseClassesByCourse'],['recent-activities','recentActivities']]);
export const lecturerDashboardRoutes = build(R.LECTURER, c.lecturer, [['summary','summary'],['group-progress','groupProgress'],['submissions-by-status','submissionsByStatus'],['topics-by-status','topicsByStatus'],['submissions-over-time','submissionsOverTime'],['grade-distribution','gradeDistribution'],['milestone-completion','milestoneCompletion']]);
export const studentDashboardRoutes = build(R.STUDENT, c.student, [['summary','summary'],['project-progress','projectProgress'],['grade-criteria','gradeCriteria'],['upcoming-deadlines','upcomingDeadlines'],['recent-feedback','recentFeedback']]);
