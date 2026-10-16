// Single place for business details shown on the site and used by payments.
// Contact details come from env so they can change without a code edit.

export const site = {
  name: "Deepak Gupta",
  product: "D2C Growth Audit",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  // Price in paise. The server always uses this value, never one sent by the browser.
  priceInPaise: 299900,
  currency: "INR",
  monthlySlots: 4,
  supportDays: 15,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "", // digits with country code, e.g. 919876543210
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL || "",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "Deepak Gupta",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
};

export const priceLabel = `₹${(site.priceInPaise / 100).toLocaleString("en-IN")}`;
