/**
 * Central site content — contact details, hours, and other business facts.
 *
 * This is the single place to update public business facts used as safe
 * fallbacks when CMS settings are unavailable.
 */

export const siteConfig = {
  name: "Salem Medical Laboratories",
  tagline: "Precision you can trust. Clarity you can understand. Peace you can feel.",

  // Confirmed Salem laboratory address used as the safe public fallback.
  address: {
    line1: "KM 46, Lagos Abeokuta Express, Iyana Cele, Ogun State",
    line2: "Nigeria",
  },

  // Confirmed contact number (used for both calls and WhatsApp).
  phone: {
    primary: "+234 706 937 3993",
    primaryHref: "tel:+2347069373993",
    whatsapp: "+234 706 937 3993",
    whatsappHref: "https://wa.me/2347069373993", // append full international number, no plus/spaces
  },

  // Confirmed contact email (used for both general enquiries and results).
  email: {
    general: "salemlaboratories@gmail.com",
    results: "salemlaboratories@gmail.com",
  },

  // Confirmed public opening hours.
  hours: {
    weekdays: "Mon – Sat, 8am–6pm",
    weekend: "Saturday, 8am–6pm",
  },

  social: {
    instagramHandle: "@salem_medical_laboratory",
    instagramUrl: "https://www.instagram.com/salem_medical_laboratory/",
  },
} as const;
