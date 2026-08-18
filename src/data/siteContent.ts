/**
 * Central site content — contact details, hours, and other business facts.
 *
 * This is the single place to update these values. The physical address and
 * opening hours have not yet been confirmed by the client, so they use a
 * clean generic label rather than invented specifics — update `address` and
 * `hours` here once those details are finalised. Do not invent a street
 * address, phone number, or email that hasn't been supplied.
 */

export const siteConfig = {
  name: "Salem Medical Laboratories",
  tagline: "Precision you can trust. Clarity you can understand. Peace you can feel.",

  // Final street address not yet confirmed — generic location label only.
  address: {
    line1: "Lagos / Ogun State",
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

  // Opening hours not yet confirmed by the client.
  hours: {
    weekdays: "Contact us for opening hours",
    weekend: "Contact us for opening hours",
  },

  social: {
    instagramHandle: "@salem_medical_laboratory",
    instagramUrl: "https://www.instagram.com/salem_medical_laboratory/",
  },
} as const;
