import { Tracking } from "@/components/Tracking";
import { CheckoutProvider } from "@/components/Checkout";
import { ConsentBanner } from "@/components/ConsentBanner";

// Public pages: tracking, checkout modal and consent notice. Admin pages live outside this group.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CheckoutProvider>
      <Tracking />
      {children}
      <ConsentBanner />
    </CheckoutProvider>
  );
}
