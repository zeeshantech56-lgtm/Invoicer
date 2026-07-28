// src/app/page.js
// Public marketing landing page — premium light theme

import Link from "next/link";
import InstallAppButton from "@/components/InstallAppButton";

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  {
    icon: "⚡",
    title: "Invoice in Seconds",
    desc: "Add products, set quantities and prices — totals calculate automatically. Built for checkout-counter speed.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: "💬",
    title: "WhatsApp Delivery",
    desc: "Every invoice is sent straight to your customer's WhatsApp — pre-filled, professional, and ready to go.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: "🔗",
    title: "Shareable Invoice Link",
    desc: "Each invoice gets a permanent link your customer can revisit, download, or share anytime.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: "📊",
    title: "Sales Analytics",
    desc: "Live dashboard with daily revenue, payment breakdowns, and a 6-month trend chart always in view.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: "🔒",
    title: "Your Data, Isolated",
    desc: "Every shop's data is fully private. You only ever see your own customers, products, and invoice history.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: "📦",
    title: "Inventory Tracking",
    desc: "Manage stock levels with low-stock alerts. Quick-add products directly from your inventory to any invoice.",
    color: "bg-rose-50 text-rose-600",
  },
];

const steps = [
  { num: "01", title: "Create your shop", desc: "Sign up in under 60 seconds. No credit card needed to start your free trial." },
  { num: "02", title: "Add products", desc: "Set up your inventory once. From then on, add items to invoices with a single tap." },
  { num: "03", title: "Bill your customer", desc: "Fill in customer details, add items, choose payment mode, and hit Save." },
  { num: "04", title: "Send via WhatsApp", desc: "We open WhatsApp with the invoice message pre-filled. You press Send. Done." },
];

const faqs = [
  {
    q: "Do I need to download any app?",
    a: "No. Invoicer runs entirely in your browser — phone, tablet, or desktop. You can install it as a PWA (home screen icon) for an app-like experience.",
  },
  {
    q: "How does the WhatsApp delivery work?",
    a: "After saving an invoice, we generate a beautifully formatted message containing a secure link to the digital receipt. It opens WhatsApp pre-filled — just tap Send.",
  },
  {
    q: "Is there a limit on invoices?",
    a: "No. Whether you're on the free trial or a paid plan, you get unlimited invoice creation.",
  },
  {
    q: "How do I pay for my subscription?",
    a: "We keep it simple — pay via UPI directly to our business number. Your account upgrades instantly after confirmation.",
  },
  {
    q: "Can my staff use the same account?",
    a: "Yes. You can stay logged in on multiple devices simultaneously using the same login — perfect for a checkout tablet and your personal phone.",
  },
];

const testimonials = [
  { name: "Ramesh K.", shop: "Kiran Medical Store", quote: "I used to write bills in a notebook. Now I send professional invoices on WhatsApp in 30 seconds.", avatar: "R" },
  { name: "Priya S.", shop: "Fashion Hub", quote: "My customers love getting the invoice link. They always refer back to it when returning items.", avatar: "P" },
  { name: "Abdul M.", shop: "Electronics Zone", quote: "The inventory alerts have saved me from overselling multiple times. Worth every rupee.", avatar: "A" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-500/40">
              <span className="text-white font-black text-sm">I</span>
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Invoicer</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="#features" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition">Features</Link>
            <Link href="#how-it-works" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition">How it works</Link>
            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition">Pricing</Link>
            <Link href="#faq" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition">FAQ</Link>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition">
              Sign in
            </Link>
            <Link href="/pricing" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-500/25 transition-all hover:shadow-indigo-500/35 whitespace-nowrap">
              Start free trial
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-violet-100 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            Trusted by 500+ shop owners across India
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Bill smarter.{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 text-indigo-600">Send via WhatsApp.</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none" aria-hidden>
                <path d="M2 9C100 3 200 0 398 9" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
              </svg>
            </span>
            <br />
            <span className="text-slate-400 font-light">Get paid faster.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Invoicer gives every shop owner their own dashboard to create professional invoices in seconds and deliver them straight to your customer&apos;s WhatsApp — with a permanent shareable link.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/40">
              Start your free 3-day trial
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-base px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md">
              Sign in to dashboard
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-400">
            {["✓ No credit card required", "✓ Setup in under 1 minute", "✓ Cancel anytime", "✓ Only ₹150/month after trial"].map(t => (
              <span key={t} className="font-medium">{t}</span>
            ))}
          </div>
        </div>

        {/* Hero image / mockup */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 mt-16">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/80 overflow-hidden">
            {/* Fake browser chrome */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 max-w-xs mx-auto">
                  <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span className="text-[11px] text-slate-400 font-medium">invoicer.app/dashboard</span>
                </div>
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 min-h-[340px] flex flex-col gap-4">
              {/* Stat row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Today's Bills", val: "12", color: "border-indigo-100 text-indigo-700 bg-white" },
                  { label: "Revenue", val: "₹18,450", color: "border-emerald-100 text-emerald-700 bg-white" },
                  { label: "Cash", val: "₹12,200", color: "border-amber-100 text-amber-700 bg-white" },
                  { label: "Online", val: "₹6,250", color: "border-sky-100 text-sky-700 bg-white" },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border-2 ${s.color} p-3`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-lg font-extrabold ${s.color.split(" ")[1]} tracking-tight`}>{s.val}</p>
                  </div>
                ))}
              </div>
              {/* Content row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {/* Invoice form preview */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Invoice</p>
                  <div className="h-8 bg-slate-100 rounded-lg" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-slate-100 rounded-lg" />
                    <div className="h-8 bg-slate-100 rounded-lg" />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                    <div className="h-6 bg-slate-100 rounded" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-6 bg-slate-100 rounded" />
                      <div className="h-6 bg-slate-100 rounded" />
                      <div className="h-6 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="bg-indigo-600 rounded-xl h-10 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/40" />
                    <div className="h-2.5 w-28 bg-white/60 rounded-full" />
                  </div>
                </div>
                {/* Chart preview */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sales Trend</p>
                  <div className="flex-1 flex items-end gap-2 pt-2">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end">
                        <div className="bg-indigo-500/20 rounded-t-md" style={{ height: `${h}%` }}>
                          <div className="bg-indigo-600 rounded-t-md h-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["bhik","Priya","Arjun"].map((n,i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-2 py-1.5">
                        <span className="text-[10px] font-semibold text-slate-600 truncate">{n}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${i===2?"bg-rose-100 text-rose-700":i===1?"bg-amber-100 text-amber-700":"bg-emerald-100 text-emerald-700"}`}>{i===2?"unpaid":i===1?"partial":"paid"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-300/20 blur-2xl rounded-full pointer-events-none" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SOCIAL PROOF / LOGOS STRIP
      ══════════════════════════════════════════════════════════ */}
      <section className="border-y border-slate-100 bg-slate-50/70 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Loved by shop owners across India</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-bold text-slate-400">
            {["Medical Stores","Clothing Shops","Electronics","Grocery Stores","Restaurants","Service Centers"].map(c => (
              <span key={c} className="hover:text-slate-600 transition cursor-default">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for real shops,<br />not corporate offices.
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Every feature is designed around how Indian shop owners actually work — fast, on mobile, with WhatsApp.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map(f => (
              <div key={f.title} className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/6 transition-all duration-200 hover:-translate-y-1">
                <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center text-xl mb-4`}>{f.icon}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Simple by design</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From sale to WhatsApp<br />in 4 easy steps
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(100%-0px)] w-full h-px border-t-2 border-dashed border-slate-200 z-0" />
                )}
                <div className="relative z-10 bg-white border border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-indigo-600 text-white font-extrabold text-lg rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-500/25">
                    {s.num}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Real reviews</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Shop owners love Invoicer
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-slate-400">{t.shop}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING TEASER
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-4">Simple Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Start free. Pay only ₹150/month.
          </h2>
          <p className="text-indigo-200 text-lg max-w-xl mx-auto mb-8">
            Full 3-day free trial. No credit card required. Unlimited invoices, all features included from day one.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold text-base px-8 py-4 rounded-2xl shadow-xl hover:bg-indigo-50 transition-all hover:-translate-y-0.5">
              See all plans
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/login?signup=1"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-700/50 hover:bg-indigo-700/70 text-white font-semibold text-base px-8 py-4 rounded-2xl border border-indigo-400/30 transition-all">
              Start free trial now
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 sm:py-32 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Got questions?</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 transition-all">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-start gap-3">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {f.q}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed pl-9">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            I
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Ready to modernize your billing?
          </h2>
          <p className="text-lg text-slate-500 mb-10">
            Join hundreds of shop owners who save hours every week with Invoicer. Set up your shop in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5">
              Create your free account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-slate-200 text-slate-700 font-semibold text-base px-8 py-4 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all">
              Already have an account?
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <InstallAppButton />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">I</span>
              </div>
              <span className="font-bold text-slate-900">Invoicer</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <Link href="#features" className="hover:text-slate-900 transition">Features</Link>
              <Link href="/pricing" className="hover:text-slate-900 transition">Pricing</Link>
              <Link href="#faq" className="hover:text-slate-900 transition">FAQ</Link>
              <Link href="/login" className="hover:text-slate-900 transition">Sign in</Link>
              <a href="https://wa.me/919202216517" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition">Support</a>
            </div>
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} Invoicer · Built for Indian shops</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
