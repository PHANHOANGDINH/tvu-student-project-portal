// src/modules/admin/admin.routes.js
import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import roleMiddleware from '../../middlewares/role.middleware.js';

import adminUsersRoutes from './admin.users.routes.js';
import adminClassesRoutes from './admin.classes.routes.js';
import adminProjectsRoutes from './admin.projects.routes.js';

import { getUserStats } from './admin.users.model.js';
import { getClassStats } from './admin.classes.model.js';
import {
  getProjectStats,
  getRegistrationStats,
} from '../project/project.model.js';
import { getReportStats } from '../report/report.model.js';

const router = express.Router();

router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware('Admin'),
  async (req, res) => {
    try {
      const [
        userStats,
        classStats,
        projectStats,
        registrationStats,
        reportStats,
      ] = await Promise.all([
        getUserStats(),
        getClassStats(),
        getProjectStats(),
        getRegistrationStats(),
        getReportStats(),
      ]);

      return res.json({
        message: 'Truy cập Admin Dashboard thành công',
        user: req.user,
        data: {
          users: {
            total: userStats.TotalUsers || 0,
            admins: userStats.TotalAdmins || 0,
            teachers: userStats.TotalTeachers || 0,
            students: userStats.TotalStudents || 0,
            active: userStats.TotalActiveUsers || 0,
            inactive: userStats.TotalInactiveUsers || 0,
            deleted: userStats.TotalDeletedUsers || 0,
          },
          classes: {
            total: classStats.TotalClasses || 0,
            active: classStats.TotalActiveClasses || 0,
            inactive: classStats.TotalInactiveClasses || 0,
            deleted: classStats.TotalDeletedClasses || 0,
          },
          projects: {
            total: projectStats.TotalProjects || 0,
            draft: projectStats.TotalDraftProjects || 0,
            pending: projectStats.TotalPendingProjects || 0,
            approved: projectStats.TotalApprovedProjects || 0,
            rejected: projectStats.TotalRejectedProjects || 0,
            closed: projectStats.TotalClosedProjects || 0,
            deleted: projectStats.TotalDeletedProjects || 0,
          },
          registrations: {
            total: registrationStats.TotalRegistrations || 0,
            pending: registrationStats.TotalPendingRegistrations || 0,
            approved: registrationStats.TotalApprovedRegistrations || 0,
            rejected: registrationStats.TotalRejectedRegistrations || 0,
            cancelled: registrationStats.TotalCancelledRegistrations || 0,
          },
          progressReports: {
            total: reportStats.progressReports.TotalProgressReports || 0,
            submitted:
              reportStats.progressReports.TotalSubmittedProgressReports || 0,
            reviewed:
              reportStats.progressReports.TotalReviewedProgressReports || 0,
          },
          finalSubmissions: {
            total: reportStats.finalSubmissions.TotalFinalSubmissions || 0,
            submitted:
              reportStats.finalSubmissions.TotalSubmittedFinalSubmissions || 0,
            reviewed:
              reportStats.finalSubmissions.TotalReviewedFinalSubmissions || 0,
          },
        },
      });
    } catch (error) {
      console.error('Lỗi Admin Dashboard:', error);

      return res.status(500).json({
        message: 'Lỗi server khi lấy dữ liệu dashboard',
      });
    }
  }
);

router.use('/users', adminUsersRoutes);
router.use('/classes', adminClassesRoutes);
router.use('/projects', adminProjectsRoutes);

export default router;