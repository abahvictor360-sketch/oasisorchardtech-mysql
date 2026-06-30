import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { servicePlans } from '../../data/products';
import SEO from '../../components/seo/SEO';
import { pricingFaqSchema } from '../../lib/schemas';

const featureComparison = [
  { feature: 'Unlimited Local Calls', basic: true, smart: true, business: true },
  { feature: 'Voicemail', basic: true, smart: true, business: true },
  { feature: 'Caller ID & Call Waiting', basic: true, smart: true, business: true },
  { feature: 'Unlimited Long-Distance', basic: false, smart: true, business: true },
  { feature: '3-Way / Conference Calling', basic: false, smart: true, business: true },
  { feature: 'Auto-Attendant (IVR)', basic: false, smart: true, business: true },
  { feature: 'Mobile App', basic: false, smart: true, business: true },
  { feature: 'Multiple Lines (5 included)', basic: false, smart: false, business: true },
  { feature: 'Advanced Analytics', basic: false, smart: false, business: true },
  { feature: 'SLA Guarantee', basic: false, smart: false, business: true },
  { feature: '24/7 Dedicated Support', basic: false, smart: false, business: true },
  { feature: 'API Access', basic: false, smart: false, business: true },
];

const pricingFaqs = [
  {
    question: 'Can I change my plan at any time?',
    answer:
      'Yes! You can upgrade or downgrade your plan at any time from your dashboard. Changes take effect on your next billing cycle. No penalties, no hassle.',
  },
  {
    question: 'Is there a setup fee or contract?',
    answer:
      'No setup fees and no long-term contracts. Our plans are month-to-month, so you only pay for what you use. Annual billing is available at a 17% discount (equivalent to 2 months free).',
  },
  {
    question: 'How does annual billing work?',
    answer:
      'With annual billing, you pay for 10 months and get 12 — saving roughly 2 months of service. You\'re billed once for the full year upfront. Annual plans can be cancelled for a prorated refund within 30 days.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover). We also support ACH bank transfers for business accounts. All payments are processed securely via Stripe.',
  },
];

function CheckOrX({ value }) {
  return value ? (
    <Check size={18} className="text-[#22c55e] mx-auto" />
  ) : (
    <X size={18} className="text-gray-300 mx-auto" />
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const getPrice = (monthlyPrice) => {
    if (annual) return (monthlyPrice * 10).toFixed(0);
    return monthlyPrice;
  };

  const getPeriodLabel = () => (annual ? '/yr' : '/mo');

  return (
    <>
      <SEO
        title="Phone Plans & Pricing — From $10/Month"
        description="Compare Oasis Orchard Technologies VoIP phone plans: Basic Connect $10/mo, Smart Connect $20/mo, Business Connect $35/mo. No contracts, no hidden fees."
        canonical="/pricing"
        schema={pricingFaqSchema}
      />
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section
        className="relative py-24"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            No hidden fees. No contracts. Just great service at an unbeatable price.
          </p>

          {/* Billing toggle */}
          <div className="flex flex-wrap justify-center items-center gap-4 bg-white/10 backdrop-blur rounded-full px-6 py-3">
            <span className={`text-sm font-semibold ${!annual ? 'text-white' : 'text-blue-300'}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual((a) => !a)}
              className={[
                'relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none',
                annual ? 'bg-[#1bb0ce]' : 'bg-white/30',
              ].join(' ')}
              aria-label="Toggle annual billing"
            >
              <span
                className={[
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                  annual ? 'translate-x-6' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
            <span className={`text-sm font-semibold ${annual ? 'text-white' : 'text-blue-300'}`}>
              Annual
              <span className="ml-2 bg-[#22c55e] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                2 months free
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ── PLAN CARDS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {servicePlans.map((plan) => (
              <div
                key={plan.id}
                className={[
                  'relative rounded-2xl p-8 flex flex-col transition-all duration-200',
                  plan.popular
                    ? 'bg-white border-2 border-[#1bb0ce] shadow-2xl scale-105 z-10'
                    : 'bg-white border border-gray-200 shadow-sm hover:shadow-md',
                ].join(' ')}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1bb0ce] text-white text-xs font-bold px-5 py-1.5 rounded-full uppercase tracking-wide shadow">
                    Most Popular
                  </span>
                )}

                <h3 className="text-xl font-bold text-[#0a1628] mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">
                  {plan.id === 'basic' && 'Perfect for individuals and small teams.'}
                  {plan.id === 'smart' && 'The most popular choice for growing businesses.'}
                  {plan.id === 'business' && 'Advanced features for established businesses.'}
                </p>

                <div className="flex items-end gap-1 mb-8">
                  <span className="text-5xl font-extrabold text-[#1bb0ce]">
                    ${getPrice(plan.price)}
                  </span>
                  <span className="text-gray-400 mb-1.5">{getPeriodLabel()}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-gray-700 text-sm">
                      <Check size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/signup">
                  <Button
                    fullWidth
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="lg"
                    className={plan.popular ? 'shadow-lg shadow-[#1bb0ce]/30' : ''}
                  >
                    Get Started
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0a1628] mb-4">Full Feature Comparison</h2>
            <p className="text-gray-500">See exactly what's included in each plan.</p>
          </div>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="bg-[#0a1628] text-white">
                  <th className="text-left px-6 py-4 font-semibold w-1/2">Feature</th>
                  <th className="text-center px-4 py-4 font-semibold">Basic</th>
                  <th className="text-center px-4 py-4 font-semibold text-[#1bb0ce]">Smart</th>
                  <th className="text-center px-4 py-4 font-semibold">Business</th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-6 py-3 text-gray-700 text-sm font-medium">{row.feature}</td>
                    <td className="px-4 py-3 text-center">
                      <CheckOrX value={row.basic} />
                    </td>
                    <td className="px-4 py-3 text-center bg-[#1bb0ce]/5">
                      <CheckOrX value={row.smart} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CheckOrX value={row.business} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0a1628] mb-4">Pricing FAQs</h2>
            <p className="text-gray-500">Common questions about billing and plans.</p>
          </div>
          <div className="space-y-3">
            {pricingFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                >
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <span className="font-semibold text-[#0a1628]">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp size={20} className="text-[#1bb0ce] shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400 shrink-0" />
                    )}
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? '300px' : '0px' }}
                  >
                    <p className="px-6 pb-5 text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="py-16"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Start Saving Today
          </h2>
          <p className="text-blue-100 mb-8">
            No hidden fees, no contracts. Join hundreds of customers already enjoying
            crystal-clear service.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="white">
              Get Started Free
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}
