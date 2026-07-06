// src/app/pricing/page.js
import Link from "next/link";
import Logo from "@/components/Logo";

const plans = [
  {
    name: "Monthly",
    price: "₹500",
    period: "first month",
    subtitle: "Then ₹300 per month to renew.",
    features: ["Full Dashboard Access", "Unlimited Invoices", "WhatsApp Integration", "Export to CSV"],
    recommended: false,
  },
  {
    name: "3 Months",
    price: "₹1,000",
    period: "for 3 months",
    subtitle: "Save ₹100 compared to monthly.",
    features: ["Full Dashboard Access", "Unlimited Invoices", "WhatsApp Integration", "Export to CSV"],
    recommended: false,
  },
  {
    name: "6 Months Bundle",
    price: "₹1,800",
    period: "for 6 months",
    subtitle: "Best value. Save ₹200.",
    features: ["Full Dashboard Access", "Unlimited Invoices", "WhatsApp Integration", "Export to CSV"],
    recommended: true,
  },
  {
    name: "1 Year Bundle",
    price: "₹3,000",
    period: "for 1 year",
    subtitle: "Massive savings. Save ₹800.",
    features: ["Full Dashboard Access", "Unlimited Invoices", "WhatsApp Integration", "Export to CSV"],
    recommended: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing.</h1>
          <p className="text-lg text-gray-600">
            Every plan starts with a completely free <strong>3-Day Trial</strong>. 
            No credit card required upfront. Pay only when you love it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`bg-white rounded-2xl shadow-sm border flex flex-col ${
                plan.recommended ? "border-blue-500 ring-2 ring-blue-500 relative" : "border-gray-200"
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Recommended
                  </span>
                </div>
              )}
              
              <div className="p-8 flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-6 min-h-[40px]">{plan.subtitle}</p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-8 pt-0 mt-auto">
                <Link
                  href="/login?signup=1"
                  className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition ${
                    plan.recommended 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  Start 3-Day Free Trial
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Need help choosing a plan? Contact us on WhatsApp at <strong>9202216517</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}
