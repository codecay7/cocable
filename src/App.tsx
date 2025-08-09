import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ClearCut from "./pages/ClearCut";
import Upscaler from "./pages/Upscaler";
import BatchRemover from "./pages/BatchRemover";
import ObjectRemover from "./pages/ObjectRemover";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { SessionProvider } from "./contexts/SessionContext";
import { PurchaseModalProvider, usePurchaseModal } from "./contexts/PurchaseModalContext";
import { BuyCreditsModal } from "./components/BuyCreditsModal";

const queryClient = new QueryClient();

const AppWithModal = () => {
  const { isModalOpen, closeModal } = usePurchaseModal();
  return <BuyCreditsModal isOpen={isModalOpen} onOpenChange={closeModal} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <PurchaseModalProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/clearcut" element={<ClearCut />} />
                <Route path="/upscaler" element={<Upscaler />} />
                <Route path="/batch-remover" element={<BatchRemover />} />
                <Route path="/object-remover" element={<ObjectRemover />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="/login" element={<Login />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AppWithModal />
          </PurchaseModalProvider>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;