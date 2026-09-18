import type { Metadata } from "next";
import { AdminShell } from "@/components/salem/AdminShell";
import { requireStaff, can } from "@/lib/auth/session";
import { getAdminNavItems } from "@/lib/auth/nav";
import { listAllReports } from "@/lib/data/labReports";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import { UploadResultForm } from "./UploadResultForm";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Upload Result | Salem Staff Area",robots:{index:false,follow:false}};
export default async function UploadResultsPage(){const staff=await requireStaff();const navItems=getAdminNavItems(staff);if(!can(staff,"reports.edit_draft"))return <AdminShell eyebrow="Results System" title="Upload Result" staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><div className="surface-card p-6 text-sm text-muted-foreground">Your role does not have permission to upload report PDFs.</div></AdminShell>;const reports=await listAllReports(staff.role,{status:"all"});const ids=reports.map(r=>r.id);const supabase=getServiceRoleClient();const{data:rows}=ids.length?await supabase.from("report_tests").select("id, lab_report_id, tests(name)").in("lab_report_id",ids):{data:[]};const reportTests=(rows??[]).map(r=>{const test=Array.isArray(r.tests)?r.tests[0]:r.tests;return{id:r.id,labReportId:r.lab_report_id,testName:test?.name??"Investigation"}});return <AdminShell eyebrow="Results System" title="Upload Result" lead="Upload a signed PDF result to an existing report. The supplied PDF is kept intact." staffName={staff.fullName} staffRole={staff.role} navItems={navItems}><UploadResultForm reports={reports.map(r=>({id:r.id,labNumber:r.lab_number,patientName:r.patient_name_snapshot}))} reportTests={reportTests}/></AdminShell>}
