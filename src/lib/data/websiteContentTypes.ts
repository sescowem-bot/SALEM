export interface HomepageContent {
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
  pageTitle?: string;
  introduction?: string;
  whoWeAre?: string;
  mission?: string;
  vision?: string;
  values?: string;
  qualityStatement?: string;
  professionalStandards?: string;
  aboutImagePath?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

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
