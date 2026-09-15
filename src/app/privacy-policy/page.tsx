import type { Metadata } from "next";
import { SiteLayout, PageHeader } from "@/components/salem/SiteLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Salem Medical Laboratories",
  description: "Privacy information for visitors, patients and customers of Salem Medical Laboratories.",
};

export default function PrivacyPolicyPage() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="Privacy" title="Privacy Policy" lead="How Salem Medical Laboratories handles information submitted through this website." />
      <section className="bg-background py-14 lg:py-20">
        <article className="legal-copy mx-auto max-w-4xl px-5 sm:px-6">
          <p>Salem Medical Laboratories respects your privacy and aims to collect only the information needed to provide laboratory, booking, home-collection and support services.</p>
          <h2>Information we may collect</h2>
          <p>This may include your name, phone number, email address, appointment details, home-collection address, test or service requested, messages and information you voluntarily provide when accessing laboratory results.</p>
          <h2>How we use information</h2>
          <p>Information is used to process requests, arrange appointments and home visits, communicate with patients, provide access to results, respond to enquiries, maintain records and improve the website and services.</p>
          <h2>Health information</h2>
          <p>Laboratory and patient information is treated as confidential and should only be accessed by authorised personnel for legitimate service, clinical, administrative or legal purposes.</p>
          <h2>Sharing</h2>
          <p>We do not sell personal information. Information may be disclosed where necessary to provide a requested service, operate essential technology, comply with legal obligations or protect patients, staff and the laboratory.</p>
          <h2>Security and retention</h2>
          <p>We use reasonable administrative and technical safeguards. No internet transmission can be guaranteed to be completely secure, so please avoid submitting unnecessary sensitive information through general contact forms.</p>
          <h2>Your choices</h2>
          <p>You may contact Salem Medical Laboratories to ask questions about information you have submitted, subject to applicable verification, confidentiality and legal requirements.</p>
          <h2>Contact</h2>
          <p>For privacy questions, contact Salem Medical Laboratories through the contact details published on our Contact page.</p>
          <p className="text-sm text-muted-foreground">Last updated: 14 September 2026.</p>
        </article>
      </section>
    </SiteLayout>
  );
}
