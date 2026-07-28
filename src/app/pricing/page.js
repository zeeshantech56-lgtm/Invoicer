// src/app/pricing/page.js
import Link from "next/link";

const plans = [
  {
    name: "Monthly",
    price: "₹150",
    period: "/month",
    subtitle: "Cancel anytime",
    savings: null,
    features: ["Full Dashboard Access", "Unlimited Invoices", "WhatsApp Delivery", "CSV Export", "Inventory Tracking", "Sales Analytics"],
    recommended: false,
    cta: "Start Free Trial",
  },
  {
    name: "3 Months",
    price: "₹400",
    period: "/3 months",
    subtitle: "₹133/month",
    savings: "Save ₹50",
    features: ["Full Dashboard Access", "Unlimited Invoices", "WhatsApp Delivery", "CSV Export", "Inventory Tracking", "Sales Analytics"],
    recommended: false,
    cta: "Start Free Trial",
  },
  {
    name: "6 Months",
    price: "₹750",
    period: "/6 months",
    subtitle: "₹125/month",
    savings: "1 month FREE",
    features: ["Full Dashboard Access", "Unlimited Invoices", "WhatsApp Delivery", "CSV Export", "Inventory Tracking", "Sales Analytics", "Priority Support"],
    recommended: true,
    cta: "Start Free Trial",
  },
  {
    name: "1 Year",
    price: "₹1,200",
    period: "/year",
    subtitle: "₹100/month",
    savings: "4 months FREE",
    features: ["Full Dashboard Access", "Unlimited Invoices", "WhatsApp Delivery", "CSV Export", "Inventory Tracking", "Sales Analytics", "Priority Support"],
    recommended: false,
    cta: "Start Free Trial",
  },
];

const included = [
  { icon: "⚡", label: "Unlimited invoices" },
  { icon: "💬", label: "WhatsApp delivery" },
  { icon: "📊", label: "Sales analytics" },
  { icon: "📦", label: "Inventory management" },
  { icon: "📄", label: "CSV export" },
  { icon: "🔗", label: "Shareable invoice links" },
  { icon: "📱", label: "Mobile & PWA ready" },
  { icon: "🔒", label: "Secure & private data" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-500/40">
              <span className="text-white font-black text-sm">I</span>
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Invoicer</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition">Home</Link>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition">Sign in</Link>
            <Link href="/login?signup=1" className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-500/25 transition whitespace-nowrap">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          3-day free trial included with every plan
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Every plan starts with a completely free 3-day trial. No credit card required. Pay only when you love it.
        </p>
      </div>

      {/* ── Plans grid ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border transition-all ${
                plan.recommended
                  ? "bg-indigo-600 border-indigo-600 shadow-2xl shadow-indigo-500/30 scale-[1.02]"
                  : "bg-white border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full shadow-sm whitespace-nowrap">
                    ⭐ Best Value
                  </span>
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                {/* Plan name + savings */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className={`font-bold text-base ${plan.recommended ? "text-indigo-100" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  {plan.savings && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide ${plan.recommended ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"}`}>
                      {plan.savings}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-1">
                  <span className={`text-4xl font-extrabold tracking-tight ${plan.recommended ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm font-medium ml-1 ${plan.recommended ? "text-indigo-200" : "text-slate-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-xs font-semibold mb-6 ${plan.recommended ? "text-indigo-200" : "text-slate-400"}`}>
                  {plan.subtitle}
                </p>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.recommended ? "text-indigo-100" : "text-slate-600"}`}>
                      <svg className={`w-4 h-4 shrink-0 ${plan.recommended ? "text-white" : "text-emerald-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/login?signup=1"
                  className={`block w-full text-center py-3.5 px-4 rounded-xl font-bold text-sm transition-all ${
                    plan.recommended
                      ? "bg-white text-indigo-700 hover:bg-indigo-50 shadow-md"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20"
                  }`}
                >
                  {plan.cta}
                </Link>
                <p className={`text-center text-[11px] mt-2 ${plan.recommended ? "text-indigo-300" : "text-slate-400"}`}>
                  No credit card required
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trial banner */}
        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl shrink-0 mx-auto sm:mx-0">🎁</div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">Free 3-Day Trial on all plans</p>
            <p className="text-sm text-slate-500 mt-0.5">Start using Invoicer today. No credit card needed. Upgrade only when you&apos;re ready.</p>
          </div>
          <Link href="/login?signup=1" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-sm shadow-emerald-500/20 whitespace-nowrap">
            Start for free →
          </Link>
        </div>
      </div>

      {/* ── What's included ─────────────────────────────────────── */}
      <div className="bg-white border-t border-b border-slate-100 py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-10 tracking-tight">Everything included in every plan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {included.map(i => (
              <div key={i.label} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                <span className="text-xl">{i.icon}</span>
                <span className="text-sm font-semibold text-slate-700">{i.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payment info ────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-sm font-bold text-amber-800 mb-2">💳 How Payment Works</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            We keep it simple — pay directly via <strong>UPI</strong> to our business number{" "}
            <strong>9202216517</strong>. Share your payment screenshot on WhatsApp and your account upgrades instantly.
            No payment gateways. No hidden fees. No subscriptions charged automatically.
          </p>
          <a
            href="https://wa.me/919202216517"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-black text-[10px]">I</span>
            </div>
            <span className="font-semibold text-slate-600">Invoicer</span>
          </div>
          <p>© {new Date().getFullYear()} Invoicer · Built for Indian shops</p>
          <Link href="/" className="hover:text-slate-900 transition">← Back to Home</Link>
        </div>
      </footer>
    </div>
  );
}
