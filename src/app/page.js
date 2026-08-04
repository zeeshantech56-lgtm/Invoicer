// src/app/page.js
// Public marketing landing page — matches dashboard premium light theme

import Link from "next/link";
import InstallAppButton from "@/components/InstallAppButton";

const features = [
  { icon: "⚡", title: "Invoice in Seconds", desc: "Add products, quantities, and prices — totals calculate instantly. Built for checkout speed.", color: "bg-indigo-50", iconColor: "text-indigo-600", border: "border-indigo-100" },
  { icon: "💬", title: "WhatsApp Delivery", desc: "Every invoice is sent to your customer's WhatsApp — pre-filled, professional, and ready to go.", color: "bg-emerald-50", iconColor: "text-emerald-600", border: "border-emerald-100" },
  { icon: "🔗", title: "Shareable Link", desc: "Each invoice gets its own permanent link your customer can revisit, download, or share anytime.", color: "bg-sky-50", iconColor: "text-sky-600", border: "border-sky-100" },
  { icon: "📊", title: "Live Analytics", desc: "Daily revenue, cash vs online breakdown, and a 6-month trend chart — always on your dashboard.", color: "bg-violet-50", iconColor: "text-violet-600", border: "border-violet-100" },
  { icon: "📦", title: "Inventory Tracking", desc: "Manage stock levels with low-stock alerts. Quick-add items straight to any invoice.", color: "bg-amber-50", iconColor: "text-amber-600", border: "border-amber-100" },
  { icon: "🔒", title: "100% Private Data", desc: "Your shop's data is fully isolated. Only you see your customers, products, and invoice history.", color: "bg-rose-50", iconColor: "text-rose-600", border: "border-rose-100" },
];

const steps = [
  { num: "1", title: "Create your shop", desc: "Sign up in 60 seconds. No credit card needed to start your free trial." },
  { num: "2", title: "Add your products", desc: "Set up inventory once. Then add items to invoices with a single tap." },
  { num: "3", title: "Create the invoice", desc: "Pick your customer, select items, choose payment mode — done in seconds." },
  { num: "4", title: "Send via WhatsApp", desc: "We open WhatsApp with the invoice pre-filled. You just tap Send." },
];

const faqs = [
  { q: "Do I need to download an app?", a: "No. Invoicer works in your browser on any phone or desktop. You can also install it as a home screen app (PWA) for a native app experience." },
  { q: "How does WhatsApp delivery work?", a: "After saving an invoice, we generate a professional message with a secure link and open WhatsApp pre-filled. You just tap Send." },
  { q: "Is there a limit on invoices?", a: "No limits. Create as many invoices as your shop needs — on the free trial or any paid plan." },
  { q: "How do I pay for a subscription?", a: "Pay via UPI to our number. Share the screenshot on WhatsApp and your account upgrades instantly. No automatic charges." },
  { q: "Can my staff use the same account?", a: "Yes. Stay logged in on multiple devices — a checkout tablet and your phone — using the same login." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ══ NAVBAR ══════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/30">
              <span className="text-white font-black text-base leading-none">I</span>
            </div>
            <span className="font-extrabold text-slate-900 text-xl tracking-tight">Invoicer</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="#features" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition">Features</Link>
            <Link href="#how-it-works" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition">How it works</Link>
            <Link href="/pricing" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition">Pricing</Link>
            <Link href="#faq" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition">FAQ</Link>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-indigo-600 transition px-3 py-2">
              Sign in
            </Link>
            <Link href="/pricing"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 whitespace-nowrap">
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#F8FAFC] pt-16 pb-20 sm:pt-24 sm:pb-28 px-5 sm:px-8 overflow-hidden">
        {/* Bg blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-100 rounded-full blur-3xl opacity-40 pointer-events-none translate-y-1/3 -translate-x-1/3" />

        <div className="relative max-w-4xl mx-auto text-center">

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Create invoices fast.{" "}
            <br className="hidden sm:block" />
            <span className="text-indigo-600">Send via WhatsApp.</span>
            <br />
            <span className="text-slate-400 font-medium text-3xl sm:text-4xl lg:text-5xl">Get paid faster.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Invoicer gives every shop owner a professional billing dashboard — create invoices in seconds and deliver them instantly over WhatsApp with a permanent shareable link.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-1 hover:shadow-indigo-500/40 min-h-[60px]">
              Start your free 3-day trial →
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-800 font-bold text-lg px-10 py-5 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg min-h-[60px]">
              Sign in to my account
            </Link>
          </div>

          {/* Trust strips */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {["✓ No credit card required", "✓ Setup in 1 minute", "✓ Cancel anytime", "✓ Only ₹150/month"].map(t => (
              <span key={t} className="text-sm font-semibold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ══════════════════════════════════════════════════ */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
          {[
            { val: "∞", label: "Invoices Created" },
            { val: "₹150", label: "Per Month Only" },
            { val: "3 Days", label: "Free Trial" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600 mb-1">{s.val}</p>
              <p className="text-sm sm:text-base font-semibold text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ═══════════════════════════════════════════════════ */}
      <section id="features" className="bg-[#F8FAFC] py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Built for real Indian shops
            </h2>
            <p className="text-lg text-slate-500">
              Every feature designed around how shop owners actually work — fast, mobile-first, with WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map(f => (
              <div key={f.title}
                className={`bg-white border-2 ${f.border} rounded-2xl p-7 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-default`}>
                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-3xl mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-white py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-3">Simple by design</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              From sale to WhatsApp in 4 steps
            </h2>
            <p className="text-lg text-slate-500">No training needed. Anyone can use Invoicer from day one.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={s.num} className="bg-[#F8FAFC] border-2 border-slate-200 rounded-2xl p-7 text-center hover:border-indigo-300 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-indigo-600 text-white text-2xl font-extrabold rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/30">
                  {s.num}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING CTA ═════════════════════════════════════════════════ */}
      <section className="bg-indigo-600 py-20 sm:py-24 px-5 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-4">Simple Pricing</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-5">
            Start free. Just ₹150/month.
          </h2>
          <p className="text-lg sm:text-xl text-indigo-200 max-w-xl mx-auto mb-10">
            Full 3-day free trial. No credit card required. All features from day one.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-indigo-700 font-extrabold text-lg px-10 py-5 rounded-2xl shadow-xl hover:bg-indigo-50 transition-all hover:-translate-y-1 min-h-[60px]">
              View all plans →
            </Link>
            <Link href="/login?signup=1"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-700/60 hover:bg-indigo-700/80 text-white font-bold text-lg px-10 py-5 rounded-2xl border-2 border-indigo-400/40 transition-all min-h-[60px]">
              Start free trial now
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════════════ */}
      <section id="faq" className="bg-[#F8FAFC] py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-3">Got questions?</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-7 hover:border-indigo-300 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-base font-black shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">{f.q}</h3>
                    <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-8 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-7 shadow-2xl shadow-indigo-500/30">
            I
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
            Ready to upgrade your billing?
          </h2>
          <p className="text-lg sm:text-xl text-slate-500 mb-10">
            Join hundreds of shop owners who save hours every week. Set up your shop in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg px-10 py-5 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all hover:-translate-y-1 min-h-[60px]">
              Create free account →
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold text-lg px-10 py-5 rounded-2xl transition-all hover:shadow-md min-h-[60px]">
              I already have an account
            </Link>
          </div>
          <div className="flex justify-center">
            <InstallAppButton />
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════ */}
      <footer className="bg-[#F8FAFC] border-t border-slate-200 py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
              <span className="text-white font-black text-sm">I</span>
            </div>
            <span className="font-extrabold text-slate-900 text-lg">Invoicer</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
            <Link href="#features" className="hover:text-indigo-600 transition">Features</Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition">Pricing</Link>
            <Link href="#faq" className="hover:text-indigo-600 transition">FAQ</Link>
            <Link href="/login" className="hover:text-indigo-600 transition">Sign in</Link>
            <a href="https://wa.me/919202216517" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition">Support</a>
          </div>
          <p className="text-sm text-slate-400 font-medium">© {new Date().getFullYear()} Invoicer · Built for Indian shops</p>
        </div>
      </footer>

    </div>
  );
}
