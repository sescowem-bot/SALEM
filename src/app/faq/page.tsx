import type { Metadata } from "next";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { FaqPageContent } from "@/components/salem/ManagedPageContent";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import { defaultFaqContent } from "@/lib/data/websitePageDefaults";
import type { FaqContent } from "@/lib/data/websiteContentTypes";
import { publicMetadata, getSeoContent, getSiteSeoImage, canonical } from "@/lib/seo";
export const dynamic="force-dynamic";
export async function generateMetadata():Promise<Metadata>{const seo=await getSeoContent();const c={...defaultFaqContent,...await getPublishedPageContent<FaqContent>("faq")};return publicMetadata({title:c.pageTitle+" | Salem Medical Laboratories",description:c.introduction,pathname:"/faq",image:await getSiteSeoImage(),noIndex:seo.robotsIndex===false});}
export default async function FaqPage(){const content=await getPublishedPageContent<FaqContent>("faq");const c={...defaultFaqContent,...content,groups:content.groups?.length?content.groups:defaultFaqContent.groups};const schema={"@context":"https://schema.org","@type":"FAQPage",mainEntity:c.groups.flatMap(g=>g.items).map(i=>({"@type":"Question",name:i.question,acceptedAnswer:{"@type":"Answer",text:i.answer}})),url:canonical("/faq")};return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><SiteLayout><FaqPageContent content={content}/></SiteLayout></>; }
