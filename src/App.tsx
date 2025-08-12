import React, { useState, useEffect, useRef } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Cocable from "./pages/Cocable";
import Upscaler from "./pages/Upscaler";
import BatchRemover from "./pages/BatchRemover";
import ObjectRemover from "./pages/ObjectRemover";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { SessionProvider } from "./contexts/SessionContext";
import { PurchaseModalProvider, usePurchaseModal } from "./contexts/PurchaseModalContext";
import { BuyCreditsModal } from "./components/BuyCreditsModal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Refunds from "./pages/Refunds";
import Contact from "./pages/Contact";
import Creations from "./pages/Creations";
import Admin from "./pages/Admin";
import { CreativeLoader } from "./components/CreativeLoader";
import { gsap } from 'gsap';

const queryClient = new QueryClient();

const AppWithModal = () => {
  const { isModalOpen, closeModal } = usePurchaseModal();
  return <BuyCreditsModal isOpen={isModalOpen} onOpenChange={closeModal} />;
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const appContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) {
      gsap.to(appContentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    }
  }, [isLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        {isLoading && <CreativeLoader onComplete={() => setIsLoading(false)} />}
        <div
          ref={appContentRef}
          style={{ opacity: 0, transform: 'translateY(20px)' }}
        >
          <BrowserRouter>
            <SessionProvider>
              <PurchaseModalProvider>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/cocable" element={<Cocable />} />
                    <Route path="/upscaler" element={<Upscaler />} />
                    <Route path="/batch-remover" element={<BatchRemover />} />
                    <Route path="/object-remover" element={<ObjectRemover />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/creations" element={<Creations />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/refunds" element={<Refunds />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/admin" element={<Admin />} />
                  </Route>
                  <Route path="/login" element={<Login />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <AppWithModal />
              </PurchaseModalProvider>
            </SessionProvider>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;