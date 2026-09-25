import type { Metadata } from "next";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import type { PackagesContent } from "@/lib/data/websiteContentTypes";
import { defaultPackagesContent, PackagesPageContent } from "@/components/salem/pages";
import { publicMetadata, getSeoContent, getSiteSeoImage } from "@/lib/seo";
export const dynamic="force-dynamic";
export async function generateMetadata():Promise<Metadata>{const seo=await getSeoContent();const c={...defaultPackagesContent,...await getPublishedPageContent<PackagesContent>("packages")};return publicMetadata({title:"Health Packages | Salem Medical Laboratories",description:c.introduction||"Curated health screening packages from Salem Medical Laboratories.",pathname:"/packages",image:await getSiteSeoImage(),noIndex:seo.robotsIndex===false});}
export default async function PackagesPage(){const content=await getPublishedPageContent<PackagesContent>("packages");return <SiteLayout><PackagesPageContent content={content}/></SiteLayout>;}
