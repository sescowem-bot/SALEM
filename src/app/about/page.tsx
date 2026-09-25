import type { Metadata } from "next";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { AboutPageContent } from "@/components/salem/ManagedPageContent";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { defaultAboutContent } from "@/lib/data/websitePageDefaults";
import type { AboutContent } from "@/lib/data/websiteContentTypes";
import { publicMetadata, getSeoContent, getSiteSeoImage } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { const [about, seo] = await Promise.all([getPublishedPageContent<AboutContent>("about"), getSeoContent()]); const c={...defaultAboutContent,...about}; return publicMetadata({title:seo.aboutTitle||c.pageTitle,description:seo.aboutDescription||c.introduction,pathname:"/about",image:await getSiteSeoImage(),noIndex:seo.robotsIndex===false}); }
export default async function AboutPage(){ const content=await getPublishedPageContent<AboutContent>("about"); return <SiteLayout><AboutPageContent content={content}/></SiteLayout>; }
