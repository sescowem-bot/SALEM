export interface HomepageContent {
  heroImagePath?: string;
  heroEyebrow?: string;
  heroHeadline?: string;
  heroDescription?: string;
  heroCtaLabel?: string;
  heroCtaHref?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaHref?: string;
  heroTrustStatement?: string;
  aboutPreviewHeading?: string;
  aboutPreviewDescription?: string;
  aboutPreviewCtaLabel?: string;
  aboutPreviewCtaHref?: string;
  servicesHeading?: string;
  servicesDescription?: string;
  trustHeading?: string;
  trustDescription?: string;
  trustQualityStatement?: string;
  trustProfessionalStandards?: string;
  ctaHeading?: string;
  ctaDescription?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface AboutContent {
  approachEyebrow?: string;
  approachHeading?: string;
  qualityHeading?: string;
  professionalStandardsHeading?: string;
  aboutImagePath?: string;
  aboutImageAlt?: string;
  aboutSecondaryImagePath?: string;
  aboutSecondaryImageAlt?: string;
  pageTitle?: string;
  introduction?: string;
  whoWeAre?: string;
  mission?: string;
  vision?: string;
  values?: string;
  qualityStatement?: string;
  professionalStandards?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface FaqItem { id: string; question: string; answer: string; }
export interface FaqGroup { id: string; heading: string; items: FaqItem[]; }
export interface FaqContent { pageTitle?: string; introduction?: string; groups?: FaqGroup[]; ctaHeading?: string; ctaDescription?: string; }
export interface PackageItem { id: string; name: string; description: string; featured?: boolean; tests: string[]; ctaLabel?: string; }
export interface PackagesContent { pageTitle?: string; introduction?: string; pricingNote?: string; packages?: PackageItem[]; }
export interface BookingContent { pageTitle?: string; introduction?: string; bookingNotice?: string; confirmationTitle?: string; confirmationMessage?: string; }
export interface ResultsContent { pageTitle?: string; introduction?: string; accessInstructions?: string; helpMessage?: string; }

export interface ContactContent {
  pageHeading?: string;
  introduction?: string;
  mapEmbedUrl?: string;
  mapDirectionsUrl?: string;
  ctaLabel?: string;
}

export interface FooterContent {
  description?: string;
  copyrightText?: string;
}

export interface SeoContent {
  defaultTitle?: string;
  defaultDescription?: string;
  robotsIndex?: boolean;
  googleSiteVerification?: string;
  orgDescription?: string;
  homepageTitle?: string;
  homepageDescription?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  servicesTitle?: string;
  servicesDescription?: string;
  contactTitle?: string;
  contactDescription?: string;
  googleAnalyticsId?: string;
  seoKeywords?: string;
  organizationAreaServed?: string;
}
