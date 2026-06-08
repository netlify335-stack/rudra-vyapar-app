"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Spline from "@splinetool/react-spline";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Receipt, BookOpen, Package, Pill, ChevronRight, ArrowRight, CheckCircle2 } from "lucide-react";

// --- Vibrant Liquid Mesh Background ---
const LiquidMeshBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Super bright animated color blobs */}
      <motion.div
        animate={{
          x: ["0vw", "30vw", "-10vw", "0vw"],
          y: ["0vh", "-30vh", "20vh", "0vh"],
          scale: [1, 1.3, 0.8, 1],
          rotate: [0, 90, 180, 360],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#FF2E93] opacity-60 blur-[120px] mix-blend-screen"
      />
      <motion.div
        animate={{
          x: ["0vw", "-30vw", "20vw", "0vw"],
          y: ["0vh", "30vh", "-20vh", "0vh"],
          scale: [1, 1.4, 0.9, 1],
          rotate: [0, -90, -180, -360],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-[#00F0FF] opacity-50 blur-[130px] mix-blend-screen"
      />
      <motion.div
        animate={{
          x: ["0vw", "20vw", "-20vw", "0vw"],
          y: ["0vh", "20vh", "-20vh", "0vh"],
          scale: [0.8, 1.5, 0.8],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[30%] w-[50vw] h-[50vw] rounded-full bg-[#7000FF] opacity-60 blur-[100px] mix-blend-screen"
      />
      
      {/* Solid dark base so text remains readable */}
      <div className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-[50px]" />
      
      {/* Grid overlay for tech look */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />
    </div>
  );
};

// --- Glassmorphism Card ---
const GlassCard = ({ children, className }: any) => {
  return (
    <div className={`relative group p-8 rounded-3xl bg-white/5 hover:bg-white/10 backdrop-blur-3xl border border-white/20 hover:border-white/40 transition-all duration-500 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${className}`}>
      {/* Internal highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};


// --- Main Page ---

const features = [
  { icon: Receipt, title: "Lightning-Fast GST Billing", desc: "Create a GST-compliant invoice in under 20 seconds. Thermal printer & WhatsApp sharing built-in.", size: "col-span-1 md:col-span-2" },
  { icon: BookOpen, title: "Digital Khata", desc: "Automated payment reminders with a single tap.", size: "col-span-1" },
  { icon: Package, title: "Smart Inventory", desc: "Low-stock alerts & expiry tracking.", size: "col-span-1" },
  { icon: Pill, title: "Pharmacy Ready", desc: "Schedule-H flagging & batch-wise FIFO.", size: "col-span-1 md:col-span-2" },
];

export default function HomePage() {
  const [splineLoaded, setSplineLoaded] = useState(false);

  return (
    <main className="min-h-screen text-white font-sans selection:bg-[#00F0FF]/30 bg-[#0a0a0a]">
      <LiquidMeshBackground />

      {/* Luxury Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-6 flex justify-center">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center justify-between w-full max-w-[1200px]"
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              <span className="font-bold text-xl">V</span>
            </div>
            <span className="text-xl font-bold tracking-tight">VYAPARONE</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 bg-black/40 backdrop-blur-2xl px-8 py-3.5 rounded-full border border-white/20">
            <a href="#" className="text-sm font-medium hover:text-[#00F0FF] transition-colors">Home</a>
            <a href="#features" className="text-sm font-medium hover:text-[#00F0FF] transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium hover:text-[#00F0FF] transition-colors">Pricing</a>
          </div>

          <Link
            href="/dashboard"
            className="rounded-full bg-gradient-to-r from-[#00F0FF] to-[#FF2E93] px-7 py-3 text-sm font-bold shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-105 transition-transform"
          >
            Open Dashboard
          </Link>
        </motion.div>
      </nav>

      {/* Massive 3D Hero Section */}
      <section className="relative z-10 min-h-screen px-6 flex flex-col items-center justify-center pt-20 overflow-hidden">
        
        {/* Spline 3D Scene - Takes up massive space, fully interactive */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-80 mix-blend-screen scale-[1.5] md:scale-125">
           <Spline 
              scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" 
              onLoad={() => setSplineLoaded(true)}
              className="w-full h-full"
            />
        </div>

        {/* Loading skeleton for 3D graphic */}
        <AnimatePresence>
          {!splineLoaded && (
            <motion.div 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center"
            >
              <div className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative z-20 mx-auto max-w-5xl text-center flex flex-col items-center pointer-events-none"
        >
          <div className="rounded-full bg-black/40 border border-white/20 px-6 py-2 text-sm font-bold text-white mb-8 tracking-[0.2em] uppercase backdrop-blur-xl shadow-2xl flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
            Next-Gen Billing System
          </div>
          
          <h1 className="text-[60px] md:text-[100px] font-bold tracking-tighter leading-[1] mb-6 drop-shadow-2xl">
            Digitize Your <br/>
            <span className="bg-gradient-to-r from-[#00F0FF] to-[#FF2E93] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.5)]">
              Business.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl font-light mb-10 drop-shadow-lg">
            VyaparOne brings AI automation, GST billing, and digital khata to your fingertips. Interact with the 3D graphic above!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pointer-events-auto">
            <Link
              href="/dashboard"
              className="rounded-full bg-white text-black px-10 py-5 text-lg font-bold shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform flex items-center gap-3"
            >
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-20 py-40 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white drop-shadow-xl">Intelligent Tools.</h2>
            <p className="text-2xl text-white/70 max-w-2xl mx-auto font-light drop-shadow-md">Built for speed, scale, and simplicity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <GlassCard key={i} className={f.size}>
                <div className="flex flex-col justify-between h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF]/30 to-[#FF2E93]/30 border border-white/30 flex items-center justify-center mb-8 text-white shadow-[0_0_30px_rgba(0,240,255,0.3)] backdrop-blur-xl">
                    <f.icon className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-white drop-shadow-md">{f.title}</h3>
                  <p className="text-white/70 leading-relaxed font-light text-xl drop-shadow-sm">{f.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-20 py-40 px-6">
        <div className="mx-auto max-w-[1200px] flex flex-col items-center">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-xl">Simple Pricing.</h2>
          </div>
          
          <GlassCard className="w-full max-w-[600px] !p-16 !bg-black/40">
            <div className="text-[#00F0FF] text-sm font-bold mb-6 tracking-[0.2em] uppercase flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_15px_#00F0FF]" />
              Enterprise
            </div>
            <div className="text-7xl font-bold mb-4 tracking-tight text-white drop-shadow-xl">Custom</div>
            <p className="text-white/70 text-xl mb-12 font-light drop-shadow-md">Tailored architecture for scaling operations.</p>
            
            <ul className="space-y-6 mb-16">
              {[
                "Unlimited Stores & Branches", 
                "Full Pharmacy Module", 
                "WhatsApp API Integrations", 
                "Dedicated Account Manager"
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-5 text-white text-lg font-medium drop-shadow-md">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#FF2E93] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>
            
            <Link
              href="https://wa.me/917070692077?text=i%20want%20the%20pro%20version%20of%20VyaparOne"
              target="_blank"
              className="block w-full py-6 rounded-2xl bg-white text-black font-bold text-xl hover:scale-[1.02] transition-transform text-center shadow-[0_0_50px_rgba(255,255,255,0.4)]"
            >
              Contact Sales
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/20 bg-black/60 backdrop-blur-3xl py-20 px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-20">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                <span className="font-bold text-2xl">V</span>
              </div>
              <span className="text-3xl font-bold tracking-tight text-white drop-shadow-md">VYAPARONE</span>
            </div>
            
            <div className="flex gap-8">
              <a href="https://wa.me/917070692077" className="text-white hover:text-[#00F0FF] transition-colors text-xl font-medium drop-shadow-md">
                +91 7070692077
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
