import type { Metadata } from "next";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { PackagesPageContent } from "@/components/salem/ManagedPageContent";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { defaultPackagesContent } from "@/lib/data/websitePageDefaults";
import type { PackagesContent } from "@/lib/data/websiteContentTypes";
import { publicMetadata, getSeoContent, getSiteSeoImage } from "@/lib/seo";
export const dynamic="force-dynamic";
export async function generateMetadata():Promise<Metadata>{const seo=await getSeoContent();const c={...defaultPackagesContent,...await getPublishedPageContent<PackagesContent>("packages")};return publicMetadata({title:c.pageTitle+" | Salem Medical Laboratories",description:c.introduction,pathname:"/packages",image:await getSiteSeoImage(),noIndex:seo.robotsIndex===false});}
export default async function PackagesPage(){const content=await getPublishedPageContent<PackagesContent>("packages");return <SiteLayout><PackagesPageContent content={content}/></SiteLayout>; }
