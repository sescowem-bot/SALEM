import "server-only";
import { can, type CurrentStaff } from "@/lib/auth/session";
import { listDraftReports, listReviewQueue, getReportStatusCounts } from "./labReports";
import { listAppointmentRequests } from "./appointments";
import { listHomeCollectionRequests } from "./homeCollection";
import { countPatients, listPatients } from "./patients";
import { countUnreadContactMessages, listContactSubmissions } from "./communications";
import { listActiveTests } from "./testCatalog";
import { countActiveStaff } from "./staff";
import { listAuditLogs } from "./audit";

/**
 * Single aggregation point for the admin Overview dashboard (Advanced 1
 * §2). Every number here comes from a real query against the existing
 * data layer — nothing is invented, and each stat is only fetched if the
 * signed-in staff member actually holds the permission that guards the
 * underlying table, so a role with no access to (say) staff records simply
 * doesn't see that tile rather than getting a Forbidden error.
 */
export async function getDashboardStats(staff: CurrentStaff) {
  const canReports = can(staff, "reports.view");
  const canReview = can(staff, "reports.review");
  const canAppointments = can(staff, "appointments.manage");
  const canHomeCollection = can(staff, "home_collection.manage") || can(staff, "home_collection.view_assigned");
  const canPatients = can(staff, "patients.view");
  const canEnquiries = can(staff, "enquiries.manage");
  const canCatalogue = can(staff, "catalogue.manage");
  const canStaff = can(staff, "staff.manage") || staff.role === "admin";
  const canAudit = can(staff, "audit.view");

  const [
    draftReports,
    reviewQueue,
    reportStatusCounts,
    appointments,
    homeCollection,
    patientCount,
    recentPatients,
    unreadMessages,
    recentMessages,
    activeTests,
    activeStaffCount,
    recentAudit,
  ] = await Promise.all([
    canReports ? listDraftReports() : Promise.resolve([]),
    canReview ? listReviewQueue() : Promise.resolve([]),
    canReports ? getReportStatusCounts() : Promise.resolve(null),
    canAppointments ? listAppointmentRequests(staff.role) : Promise.resolve([]),
    canHomeCollection ? listHomeCollectionRequests(staff.role, staff.userId) : Promise.resolve([]),
    canPatients ? countPatients(staff.role) : Promise.resolve(0),
    canPatients ? listPatients(staff.role, { limit: 5 }) : Promise.resolve([]),
    canEnquiries ? countUnreadContactMessages(staff.role) : Promise.resolve(0),
    canEnquiries ? listContactSubmissions(staff.role) : Promise.resolve([]),
    canCatalogue ? listActiveTests() : Promise.resolve([]),
    canStaff ? countActiveStaff(staff.role) : Promise.resolve(0),
    canAudit ? listAuditLogs({ limit: 8 }) : Promise.resolve([]),
  ]);

  return {
    permissions: {
      canReports,
      canReview,
      canAppointments,
      canHomeCollection,
      canPatients,
      canEnquiries,
      canCatalogue,
      canStaff,
      canAudit,
    },
    draftReportsCount: draftReports.length,
    reviewQueueCount: reviewQueue.length,
    reportStatusCounts,
    pendingAppointments: appointments.filter((a) => a.status === "new").length,
    totalAppointments: appointments.length,
    recentAppointments: appointments.slice(0, 5),
    pendingHomeCollection: homeCollection.filter((h) => h.status === "pending").length,
    totalHomeCollection: homeCollection.length,
    patientCount,
    recentPatients,
    unreadMessages,
    totalMessages: recentMessages.length,
    recentMessages: recentMessages.slice(0, 5),
    activeServicesCount: activeTests.length,
    activeStaffCount,
    recentAudit,
  };
}
