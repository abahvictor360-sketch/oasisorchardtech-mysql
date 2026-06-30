import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Wifi, Smartphone, Check, ChevronDown, ChevronUp,
  ArrowRight, Settings, UserCheck, Headphones, ShieldCheck, Globe, Zap,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { usePageSection } from '../../hooks/usePageSection';

// ── Icons for service cards (fixed — not editable) ────────────
const CARD_ICONS = [Phone, Wifi, Globe, ShieldCheck];

// ── Icons for process steps (fixed) ──────────────────────────
const STEP_ICONS = [UserCheck, Settings, Phone, Headphones];

// ── Hardcoded defaults (used until Supabase data loads) ───────
const DEFAULTS = {
  services_hero: {
    title:    'Our Phone Services',
    subtitle: 'Comprehensive communication solutions for home and business.',
  },
  services_cards: [
    { title: 'Business Phone System',  description: 'Full-featured business phone system with auto-attendant, voicemail, call forwarding, and more — all delivered over your existing internet connection.', features: ['Auto-attendant / IVR', 'Voicemail to email', 'Call recording', 'Conference calling'] },
    { title: 'Cloud Phone System',     description: 'Replace your traditional phone system with a fully managed cloud solution. Scale up or down instantly without buying expensive hardware.',               features: ['No on-site hardware needed', 'Unlimited extensions', 'Remote management', 'Instant provisioning'] },
    { title: 'Remote Work Support',    description: 'Keep your team connected wherever they work. Use your business number from any device — desktop phone, laptop, or mobile — with no disruption.',       features: ['Work from anywhere', 'Number porting', 'Toll-free numbers', 'Direct inward dialing'] },
    { title: 'Secure Communications',  description: 'Enterprise-grade security for all voice traffic. End-to-end encryption and fraud monitoring as standard across all plans.',                            features: ['End-to-end encryption', 'Secure call signaling', 'Fraud monitoring', 'Access controls'] },
  ],
  services_home_phone: {
    heading:     'Replace Your Landline — Save Big',
    description: 'Cut the cord on expensive traditional phone lines without sacrificing reliability or call quality. Our home phone service gives you all the features of a traditional phone — plus dozens more — at a fraction of the cost.',
    benefits:    ['Unlimited local and long-distance calls', 'Caller ID, call waiting, call forwarding', 'Voicemail with email delivery', 'No contracts — cancel any time', 'Works with your existing cordless phone system'],
  },
  services_mobile: {
    heading:     'Take Your Office Anywhere',
    description: "With our mobile phone app, your business number travels with you. Make and receive professional calls from your smartphone — whether you're in the office, at home, or on the road.",
    benefits:    ['Make and receive calls from your mobile device', 'Use your business number on the go', 'Full voicemail and call management', 'Works over WiFi or cellular data', 'iOS and Android compatible'],
  },
  services_process: [
    { title: 'Sign Up',    description: 'Create your account and choose the service plan that fits your needs.' },
    { title: 'Configure',  description: "We'll help you set up your phone numbers, extensions, and call routing." },
    { title: 'Connect',    description: "Plug in your wireless phone or install the mobile app — you're ready to go." },
    { title: 'Support',    description: 'Our 24/7 team is always here to help you get the most from your service.' },
  ],
  services_faqs: [
    { question: 'How does wireless phone technology work?',                     answer: 'wireless phone technology converts your voice into digital data and transmits it over the internet, just like email or web browsing. Instead of using traditional phone lines, wireless phones use your existing broadband connection — resulting in significant cost savings and added features like voicemail-to-email, auto-attendant, and more.' },
    { question: 'Do I need special hardware to use an wireless phone service?', answer: 'Not necessarily. You can use our service with a dedicated wireless phone (like our Grandstream models), a softphone application on your computer, or a mobile app on your smartphone. A dedicated wireless phone provides the best audio quality and experience, but the software options work great for getting started quickly.' },
    { question: 'Can I keep my existing phone number?',                   answer: 'Yes! We support number porting, which means we can transfer your existing business or personal phone number to our service at no extra charge. The process typically takes 5-10 business days and your old service continues to work during the transition.' },
    { question: 'What internet speed do I need for wireless phone calls?',      answer: 'wireless phone calls typically use 85-100 kbps per active call. For most home or small business use, a standard broadband connection (10+ Mbps) is more than sufficient. We recommend a stable, wired ethernet connection for the best call quality, though WiFi works well too.' },
    { question: 'Is wireless phone service reliable? What happens if my internet goes down?', answer: 'Modern wireless phone services achieve 99.9%+ uptime. If your internet goes down, calls can be automatically forwarded to a mobile number or another backup line of your choice — so you never miss an important call. Our network infrastructure is redundant and monitored 24/7.' },
  ],
  services_cta: {
    title:   'Ready to Modernize Your Phone System?',
    subtitle: 'Join hundreds of customers who switched to Oasis Orchard Technologies. No contracts, no setup fees.',
    button1: 'Get Started Today',
    button2: 'Talk to an Expert',
  },
};

const ALL_KEYS = Object.keys(DEFAULTS);

export default function Services() {
  const { data } = usePageSection(ALL_KEYS, DEFAULTS);
  const [openFaq, setOpenFaq] = useState(null);

  const hero      = data.services_hero;
  const cards     = data.services_cards     ?? DEFAULTS.services_cards;
  const homePhone = data.services_home_phone ?? DEFAULTS.services_home_phone;
  const mobile    = data.services_mobile     ?? DEFAULTS.services_mobile;
  const process   = data.services_process   ?? DEFAULTS.services_process;
  const faqs      = data.services_faqs      ?? DEFAULTS.services_faqs;
  const cta       = data.services_cta       ?? DEFAULTS.services_cta;

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative py-24" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">{hero.title}</h1>
          <p className="text-blue-100 text-lg sm:text-xl max-w-2xl mx-auto">{hero.subtitle}</p>
        </div>
      </section>

      {/* ── SERVICE CARDS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0a1628] mb-4">Communication Services</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Everything you need for modern business communication — all powered by internet.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => {
              const Icon = CARD_ICONS[i % CARD_ICONS.length];
              return (
                <Card key={i} hover className="p-6 flex flex-col">
                  <div className="w-12 h-12 rounded-full bg-[#1bb0ce]/10 flex items-center justify-center mb-4">
                    <Icon size={24} className="text-[#1bb0ce]" />
                  </div>
                  <h3 className="font-bold text-[#0a1628] mb-2">{card.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">{card.description}</p>
                  <ul className="space-y-1">
                    {(card.features || []).map(f => (
                      <li key={f} className="flex items-center gap-2 text-gray-600 text-xs">
                        <Check size={13} className="text-[#22c55e] shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOME PHONE ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#1bb0ce]/10 text-[#1bb0ce] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                <Phone size={16} /> Home Phone Services
              </div>
              <h2 className="text-3xl font-bold text-[#0a1628] mb-4">{homePhone.heading}</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{homePhone.description}</p>
              <ul className="space-y-4 mb-8">
                {(homePhone.benefits || []).map(b => (
                  <li key={b} className="flex items-center gap-3 text-gray-700">
                    <Check size={18} className="text-[#22c55e] shrink-0" />{b}
                  </li>
                ))}
              </ul>
              <Link to="/pricing"><Button variant="primary">View Home Plans <ArrowRight size={16} /></Button></Link>
            </div>
            <div className="bg-gradient-to-br from-[#0a1628]/5 to-[#1bb0ce]/15 rounded-2xl h-72 flex items-center justify-center border border-[#1bb0ce]/20">
              <Phone size={96} className="text-[#1bb0ce] opacity-40" />
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 bg-gradient-to-br from-[#1bb0ce]/10 to-[#0a1628]/10 rounded-2xl h-72 flex items-center justify-center border border-[#1bb0ce]/20">
              <Smartphone size={96} className="text-[#1bb0ce] opacity-40" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-[#1bb0ce]/10 text-[#1bb0ce] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                <Smartphone size={16} /> Mobile Phone
              </div>
              <h2 className="text-3xl font-bold text-[#0a1628] mb-4">{mobile.heading}</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{mobile.description}</p>
              <ul className="space-y-4 mb-8">
                {(mobile.benefits || []).map(b => (
                  <li key={b} className="flex items-center gap-3 text-gray-700">
                    <Check size={18} className="text-[#22c55e] shrink-0" />{b}
                  </li>
                ))}
              </ul>
              <Link to="/signup"><Button variant="primary">Get Started <ArrowRight size={16} /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0a1628] mb-4">How Our Service Works</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">From signup to your first call — we make the process seamless.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((step, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <div key={i} className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 rounded-full bg-[#1bb0ce] flex items-center justify-center shadow-lg mx-auto">
                      <Icon size={28} className="text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 bg-[#0a1628] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#0a1628] mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0a1628] mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-500">Everything you want to know about our phone service.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <span className="font-semibold text-[#0a1628]">{faq.question}</span>
                    {isOpen
                      ? <ChevronUp size={20} className="text-[#1bb0ce] shrink-0" />
                      : <ChevronDown size={20} className="text-gray-400 shrink-0" />}
                  </button>
                  <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isOpen ? '400px' : '0px' }}>
                    <p className="px-6 pb-5 text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">{cta.title}</h2>
          <p className="text-blue-100 mb-8">{cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {cta.button1 && <Link to="/signup"><Button size="lg" variant="white">{cta.button1}</Button></Link>}
            {cta.button2 && <Link to="/support"><Button size="lg" variant="white-outline">{cta.button2}</Button></Link>}
          </div>
        </div>
      </section>
    </div>
  );
}
