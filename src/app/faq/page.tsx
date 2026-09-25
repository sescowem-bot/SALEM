import type { Metadata } from "next";
import { SiteLayout } from "@/components/salem/SiteLayout";
import { getPublishedPageContent } from "@/lib/data/websitePages";
import type { FaqContent } from "@/lib/data/websiteContentTypes";
import { defaultFaqContent, FaqPageContent } from "@/components/salem/pages";
import { publicMetadata, getSeoContent, getSiteSeoImage, canonical } from "@/lib/seo";
export const dynamic="force-dynamic";
export async function generateMetadata():Promise<Metadata>{const seo=await getSeoContent();const c={...defaultFaqContent,...await getPublishedPageContent<FaqContent>("faq")};return publicMetadata({title:"FAQs | Salem Medical Laboratories",description:c.introduction||"Answers to common questions about Salem Medical Laboratories.",pathname:"/faq",image:await getSiteSeoImage(),noIndex:seo.robotsIndex===false});}
export default async function FaqPage(){const content=await getPublishedPageContent<FaqContent>("faq");const c={...defaultFaqContent,...content};const faqSchema={"@context":"https://schema.org","@type":"FAQPage",mainEntity:c.groups.flatMap(g=>g.items).map(item=>({"@type":"Question",name:item.question,acceptedAnswer:{"@type":"Answer",text:item.answer}})),url:canonical("/faq")};return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema)}}/><SiteLayout><FaqPageContent content={content}/></SiteLayout></>;}
