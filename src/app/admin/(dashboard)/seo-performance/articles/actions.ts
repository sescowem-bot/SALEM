"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { upsertArticle, setArticleStatus } from "@/lib/data/seoArticles";
export async function saveArticleAction(formData: FormData){const staff=await requireStaff();const id=String(formData.get("id")||"")||undefined;await upsertArticle({id,title:String(formData.get("title")||""),slug:String(formData.get("slug")||""),excerpt:String(formData.get("excerpt")||"")||null,content:String(formData.get("content")||""),seo_title:String(formData.get("seo_title")||"")||null,seo_description:String(formData.get("seo_description")||"")||null,status:(String(formData.get("status")||"draft") as any),featured_image_url:null,published_at:null,updated_at:new Date().toISOString(),created_by:null,updated_by:null},staff.role,staff.userId);revalidatePath("/admin/seo-performance/articles");revalidatePath("/blog");}
export async function publishArticleAction(formData:FormData){const staff=await requireStaff();await setArticleStatus(String(formData.get("id")),"published",staff.role,staff.userId);revalidatePath("/blog");}
