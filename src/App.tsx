import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const SplashScreen = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent animate-gradient">
    <div className="text-center animate-fade-in">
      <img 
        src="https://cdn.poehali.dev/projects/6576c960-0058-4fa0-a117-1b051088e659/files/5385a37d-cdb4-46f1-8c60-c4d6084b4486.jpg" 
        alt="Польза" 
        className="w-32 h-32 mx-auto rounded-3xl shadow-2xl mb-6 animate-scale-in"
      />
      <h1 className="text-4xl font-bold text-white mb-2">Польза</h1>
      <p className="text-white/80 text-lg">Полезные мероприятия</p>
    </div>
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen />}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;