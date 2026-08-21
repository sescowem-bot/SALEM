import { siteConfig } from "@/data/siteContent";

export function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.04 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.47 1.73 6.41L3.2 28.8l6.57-1.72a12.75 12.75 0 0 0 6.27 1.62h.01c7.05 0 12.79-5.74 12.79-12.8 0-3.42-1.33-6.63-3.75-9.05a12.7 12.7 0 0 0-9.05-3.65Zm0 23.1h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4 1.05 1.07-3.9-.25-.4a10.57 10.57 0 0 1-1.62-5.64c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.87-4.77 10.6-10.67 10.6Zm5.83-7.94c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.25-.19.21-.37.24-.68.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.18-.32-.02-.49.14-.65.15-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.73-.98-2.36-.26-.62-.52-.54-.71-.55l-.6-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.15-1.52.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}

export function FloatingWhatsApp() {
  return (
    <a
      href={`${siteConfig.phone.whatsappHref}?text=Hello%20Salem%20Medicals%2C%20I%20would%20like%20to%20make%20an%20enquiry.`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Salem Medicals on WhatsApp"
      className="pulse-ring fixed bottom-6 right-5 z-50 flex items-center gap-3 rounded-full bg-whatsapp px-4 py-3.5 text-sm font-semibold text-white shadow-lift transition-transform hover:scale-[1.04] sm:bottom-8 sm:right-8"
    >
      <WhatsAppIcon className="h-6 w-6 shrink-0" />
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}
