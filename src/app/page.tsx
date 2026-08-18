import { SiteLayout } from "@/components/salem/SiteLayout";
import { Hero } from "@/components/salem/Hero";
import { Services } from "@/components/salem/Services";
import { Trust } from "@/components/salem/Trust";
import { HomeService } from "@/components/salem/HomeService";
import { Results } from "@/components/salem/Results";
import { BookingCta, Contact } from "@/components/salem/BookingContact";

export default function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <Services />
      <Trust />
      <HomeService />
      <Results />
      <BookingCta />
      <Contact />
    </SiteLayout>
  );
}
