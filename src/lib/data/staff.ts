import "server-only";
import { getServiceRoleClient } from "@/lib/supabase/service-client";
import type { Database } from "@/lib/supabase/database.types";
import { hasPermission, type StaffRole } from "@/lib/auth/permissions";
import { logAudit } from "./audit";

type StaffProfile = Database["public"]["Tables"]["staff_profiles"]["Row"];
type Department = Database["public"]["Tables"]["departments"]["Row"];
export interface StaffDirectoryMember extends StaffProfile { roles: StaffRole[]; department_name: string | null; }
const assertManage = (role: StaffRole) => { if (!hasPermission(role, "staff.manage")) throw new Error(`Forbidden: role "${role}" cannot manage staff accounts.`); };

export async function listDepartments(actorRole: StaffRole): Promise<Department[]> {
  if (actorRole !== "super_admin" && actorRole !== "admin") throw new Error("Forbidden: cannot view departments.");
  const { data, error } = await getServiceRoleClient().from("departments").select("*").order("name"); if (error) throw error; return data ?? [];
}
export async function createDepartment(name: string, description: string | null, actorRole: StaffRole) {
  assertManage(actorRole); const { data, error } = await getServiceRoleClient().from("departments").insert({ name: name.trim(), description }).select().single(); if (error) throw error;
  await logAudit({ action: "STAFF_UPDATED", entityType: "departments", entityId: data.id, actorRole, metadata: { action: "department_created", name: data.name } }); return data;
}
export async function createStaffAccount(input: { email:string; password:string; fullName:string; role:StaffRole; roles?:StaffRole[]; departmentId?:string|null; qualification?:string; designation?:string; phone?:string; actorRole:StaffRole }): Promise<StaffProfile> {
  assertManage(input.actorRole); const supabase=getServiceRoleClient(); const {data:created,error:createError}=await supabase.auth.admin.createUser({email:input.email,password:input.password,email_confirm:true}); if(createError)throw createError; if(!created.user)throw new Error("Failed to create staff auth user.");
  const {data:profile,error:profileError}=await supabase.from("staff_profiles").insert({id:created.user.id,full_name:input.fullName,role:input.role,department_id:input.departmentId??null,qualification:input.qualification,designation:input.designation,phone:input.phone}).select().single();
  if(profileError){await supabase.auth.admin.deleteUser(created.user.id);throw profileError;}
  const roles=Array.from(new Set([input.role,...(input.roles??[])])); const {error:roleError}=await supabase.from("staff_role_assignments").insert(roles.map(role=>({staff_id:profile.id,role,is_primary:role===input.role}))); if(roleError){await supabase.auth.admin.deleteUser(created.user.id);throw roleError;}
  await logAudit({action:"STAFF_CREATED",entityType:"staff_profiles",entityId:profile.id,actorRole:input.actorRole,metadata:{role:input.role,roles,departmentId:input.departmentId??null,fullName:input.fullName}}); return profile;
}
export async function updateStaffProfile(staffId:string,input:Partial<Pick<StaffProfile,"full_name"|"role"|"qualification"|"designation"|"phone"|"department_id">>,actorRole:StaffRole):Promise<StaffProfile>{
  assertManage(actorRole); const supabase=getServiceRoleClient(); const {data,error}=await supabase.from("staff_profiles").update(input).eq("id",staffId).select().single(); if(error)throw error; if(input.role)await assignStaffRoles(staffId,[input.role],actorRole,input.role); await logAudit({action:"STAFF_UPDATED",entityType:"staff_profiles",entityId:staffId,actorRole,metadata:{updated:Object.keys(input)}}); return data;
}
export async function assignStaffRoles(staffId:string,roles:StaffRole[],actorRole:StaffRole,primaryRole?:StaffRole):Promise<void>{
  assertManage(actorRole); const clean=Array.from(new Set(roles)); if(!clean.length)throw new Error("At least one role is required."); const primary=primaryRole&&clean.includes(primaryRole)?primaryRole:clean[0]; const supabase=getServiceRoleClient();
  const {error:del}=await supabase.from("staff_role_assignments").delete().eq("staff_id",staffId); if(del)throw del; const {error}=await supabase.from("staff_role_assignments").insert(clean.map(role=>({staff_id:staffId,role,is_primary:role===primary}))); if(error)throw error;
  await logAudit({action:"STAFF_UPDATED",entityType:"staff_profiles",entityId:staffId,actorRole,metadata:{action:"roles_assigned",roles:clean,primaryRole:primary}});
}
export async function deactivateStaffAccount(staffId:string,actorRole:StaffRole){assertManage(actorRole);const {error}=await getServiceRoleClient().from("staff_profiles").update({is_active:false}).eq("id",staffId);if(error)throw error;await logAudit({action:"STAFF_DEACTIVATED",entityType:"staff_profiles",entityId:staffId,actorRole});}
export async function reactivateStaffAccount(staffId:string,actorRole:StaffRole){assertManage(actorRole);const {error}=await getServiceRoleClient().from("staff_profiles").update({is_active:true}).eq("id",staffId);if(error)throw error;await logAudit({action:"STAFF_REACTIVATED",entityType:"staff_profiles",entityId:staffId,actorRole});}
export async function countActiveStaff(actorRole:StaffRole){if(!hasPermission(actorRole,"staff.manage")&&actorRole!=="admin")throw new Error(`Forbidden: role "${actorRole}" cannot view the staff directory.`);const {count,error}=await getServiceRoleClient().from("staff_profiles").select("id",{count:"exact",head:true}).eq("is_active",true);if(error)throw error;return count??0;}
export async function listStaffProfiles(actorRole:StaffRole):Promise<StaffDirectoryMember[]>{
  if(!hasPermission(actorRole,"staff.manage")&&actorRole!=="admin")throw new Error(`Forbidden: role "${actorRole}" cannot view the staff directory.`); const supabase=getServiceRoleClient(); const {data,error}=await supabase.from("staff_profiles").select("*, departments(name)").order("full_name"); if(error)throw error; const rows=data??[]; const ids=rows.map(r=>r.id); const {data:assignments,error:roleError}=ids.length?await supabase.from("staff_role_assignments").select("staff_id, role, is_primary").in("staff_id",ids):{data:[],error:null}; if(roleError)throw roleError;
  return rows.map(row=>({...row,roles:(assignments??[]).filter(a=>a.staff_id===row.id).sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)).map(a=>a.role as StaffRole),department_name:Array.isArray(row.departments)?row.departments[0]?.name??null:row.departments?.name??null}));
}
