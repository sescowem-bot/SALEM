"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { uploadReportPdf } from "@/lib/data/storage";
import { friendlyError } from "@/lib/utils";
type UploadState = { ok?: boolean; error?: string };
export async function uploadStandaloneResultAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const staff = await requireStaff();
  const labReportId=String(formData.get("labReportId")??""), reportTestId=String(formData.get("reportTestId")??""), file=formData.get("file");
  if(!labReportId||!reportTestId)return{error:"Select the report and investigation first."};
  if(!(file instanceof File)||file.size===0)return{error:"Choose a PDF result to upload."};
  if(file.type!=="application/pdf")return{error:"Only PDF files are accepted."};
  if(file.size>15*1024*1024)return{error:"PDF must be 15MB or smaller."};
  try{await uploadReportPdf({labReportId,reportTestId,file,fileName:file.name,actorRole:staff.role,actorId:staff.userId});revalidatePath(`/admin/reports/${labReportId}`);return{ok:true};}catch(err){return{error:friendlyError(err)};}
}
