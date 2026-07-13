import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Phone, Mic2, Zap, DollarSign, Headphones,
  ChevronRight, Star, Check, ArrowRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { TestimonialsColumn } from '../../components/ui/TestimonialsColumn';
import { products, servicePlans } from '../../data/products';
import { useHomeLayout } from '../../hooks/useHomeLayout';
import { usePageSection } from '../../hooks/usePageSection';
import SEO from '../../components/seo/SEO';
import { organizationSchema, localBusinessSchema, websiteSchema, homeFaqSchema, homeHowToSchema } from '../../lib/schemas';

const whyChooseUs = [
  { icon: Mic2,       line: '01', title: 'Crystal Clear Audio',  description: 'HD voice on every call. Our wireless phones deliver studio-grade clarity that makes a call feel like an in-person conversation.' },
  { icon: Zap,        line: '02', title: 'Easy Setup',            description: 'Plug into your existing internet and go. Most customers are making calls in under ten minutes — no technician visit required.' },
  { icon: DollarSign, line: '03', title: 'Affordable Plans',      description: 'Business-quality phone service from $10/month. Save up to 60% versus traditional providers, with no hidden fees.' },
  { icon: Headphones, line: '04', title: '24/7 Support',          description: 'Real people, always available — by phone, email, or live chat, whenever a call needs troubleshooting.' },
];

const DEFAULT_HOW_STEPS = [
  { number: '01', title: 'Choose Your Plan',  description: 'Select from Basic, Smart, or Business Connect depending on your needs and budget.' },
  { number: '02', title: 'Get Your Phone',    description: 'Pick a Grandstream wireless phone from our catalog — we ship to all parts of Canada.' },
  { number: '03', title: 'Start Calling',     description: 'Plug in your phone, activate your plan, and enjoy crystal-clear calls from day one.' },
];

// NOTE: placeholder testimonials — swap in real, verifiable customer quotes
// before leaning on any of these (especially the dollar-savings claims) for
// marketing purposes.
const testimonials = [
  { text: 'Switching to Oasis Orchard Technologies saved our company over $200 a month on phone bills. The call quality is outstanding and setup took under 10 minutes!', name: 'Maria Gonzalez', role: 'Small Business Owner' },
  { text: "The Smart Connect plan is perfect for our distributed team. The 3-way calling and mobile app keep everyone connected. Best decision we've made this year.", name: 'James Okafor', role: 'Remote Team Manager' },
  { text: 'I was skeptical about wireless phones at first, but Oasis made it so simple. Their support team walked me through everything. Five stars without hesitation!', name: 'Sandra Liu', role: 'Office Administrator' },
  { text: 'Our shop lost calls constantly on the old landline. Since switching to a Grandstream phone and the Basic plan, we haven’t missed a single customer call.', name: 'Devon Marsh', role: 'Retail Store Owner' },
  { text: 'I show properties all day, so call forwarding to my mobile is everything. Oasis set it up in one phone call and it just works.', name: 'Priya Nair', role: 'Real Estate Agent' },
  { text: 'My father is 78 and was intimidated by "wireless" anything. The phone was so simple to plug in that he had it running before I could finish explaining it.', name: 'Robert Chen', role: 'Home User' },
  { text: 'As a nonprofit, every dollar counts. Business Connect gave our whole team real phone lines for less than we paid for one landline before.', name: 'Aisha Bello', role: 'Nonprofit Program Director' },
  { text: 'I’m on job sites more than I’m at a desk. Having my business line ring straight to my cell without customers knowing the difference has been huge.', name: 'Marcus Webb', role: 'General Contractor' },
  { text: 'I’ve set up VoIP for a dozen clients now. Oasis is the first provider where the hardware and the plan setup both just worked on the first try.', name: 'Grace Lindqvist', role: 'IT Consultant' },
];

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={16} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
      ))}
    </div>
  );
}

// ── Signature motif: a live waveform, used in the hero and CTA ──
function Waveform({ bars = 14, color = '#1bb0ce', height = 40, className = '' }) {
  return (
    <div className={`flex items-center gap-[3px] ${className}`} style={{ height }} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="waveform-bar rounded-full"
          style={{
            width: 3,
            height: '100%',
            background: color,
            animationDelay: `${(i % 7) * 0.09}s`,
            opacity: 0.55 + (0.45 * Math.abs(Math.sin(i))),
          }}
        />
      ))}
    </div>
  );
}

// ── Signature element: a live "call in progress" card ────────────
function CallCard() {
  const [seconds, setSeconds] = useState(7);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(s => (s >= 172 ? 0 : s + 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="relative w-full max-w-sm">
      <div
        className="relative rounded-[28px] p-6 shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0f2038 0%, #0a1628 65%)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-emerald-300 text-xs font-semibold tracking-wide uppercase">Connected</span>
          </div>
          <span className="font-mono-num text-white/70 text-sm">{mm}:{ss}</span>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1bb0ce, #0f6f82)' }}>
            <Phone size={24} className="text-white" />
          </div>
          <div>
            <p className="font-display text-white text-xl leading-none" style={{ fontWeight: 560 }}>Oasis Orchard</p>
            <p className="text-blue-200/70 text-sm mt-1">Wireless line · HD Voice</p>
          </div>
        </div>

        <Waveform bars={22} color="#1bb0ce" height={44} />

        <p className="text-blue-200/50 text-xs mt-5 text-center">Live call quality, every time.</p>
      </div>

      {/* Floating signal badge */}
      <div className="absolute -right-4 -top-4 bg-white rounded-2xl shadow-xl px-3.5 py-2.5 flex items-center gap-2">
        <div className="flex items-end gap-[2px] h-3.5">
          {[0.4, 0.65, 0.85, 1].map((h, i) => (
            <div key={i} className="w-[3px] rounded-full bg-[#1bb0ce]" style={{ height: `${h * 100}%` }} />
          ))}
        </div>
        <span className="text-[#0a1628] text-xs font-bold">HD</span>
      </div>
    </div>
  );
}

// ── Built-in section components ────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#0a1628' }}>
      {/* Soft ambient glow, static — not a spinner */}
      <div className="absolute -right-40 -top-40 w-[560px] h-[560px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #1bb0ce 0%, transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 text-center lg:text-left z-10">
          <span className="inline-block text-[#1bb0ce] text-xs font-bold tracking-[0.18em] uppercase mb-5">
            Authorized Grandstream Reseller · Canada-Wide
          </span>
          <h1 className="font-display text-white leading-[1.05] mb-6 text-4xl sm:text-5xl lg:text-[3.4rem]" style={{ fontWeight: 560 }}>
            Calls that sound like<br />you're in the room.
          </h1>
          <p className="text-blue-100/80 text-lg max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed">
            Wireless business phones and monthly plans from $10 — no contracts, no technician,
            no dropped calls. Plug in, dial out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link to="/shop"><Button size="lg" variant="primary" className="shadow-lg shadow-[#1bb0ce]/40">Shop Phones <ArrowRight size={18} /></Button></Link>
            <Link to="/pricing"><Button size="lg" variant="white-outline">See Plans</Button></Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center z-10">
          <CallCard />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-14 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: '500+',  label: 'Businesses connected' },
    { value: '99.9%', label: 'Network uptime' },
    { value: '$10',   label: 'Starting price /mo' },
    { value: '7',     label: 'Phone models' },
  ];
  return (
    <section className="bg-[#0a1628] py-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] tracking-[0.2em] uppercase text-blue-300/50 font-semibold mb-8">Network Status</p>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={['text-center px-4', i > 0 ? 'border-l border-white/10' : ''].join(' ')}>
              <p className="font-mono-num text-3xl sm:text-4xl font-bold text-[#1bb0ce]">{s.value}</p>
              <p className="text-blue-200/60 mt-1.5 text-xs sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section className="py-20" style={{ background: 'var(--paper)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>Simple, transparent pricing</h2>
          <p className="text-[--ink-soft] text-lg max-w-xl mx-auto">Pick the plan that fits. No contracts. No hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {servicePlans.map(plan => (
            <div key={plan.id} className={['relative rounded-2xl p-8 flex flex-col transition-transform duration-200', plan.popular ? 'bg-white border-2 border-[#1bb0ce] shadow-2xl scale-105 z-10' : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'].join(' ')}>
              {plan.popular && (
                <span className="absolute -top-3 left-8 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide shadow-lg -rotate-2" style={{ background: 'var(--dial)' }}>
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl text-[#0a1628] mb-2" style={{ fontWeight: 560 }}>{plan.name}</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="font-mono-num text-4xl font-bold text-[#1bb0ce]">${plan.price}</span>
                <span className="text-gray-400 mb-1">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.slice(0,3).map(f => (
                  <li key={f} className="flex items-center gap-2 text-gray-700 text-sm"><Check size={16} className="text-[#22c55e] shrink-0" />{f}</li>
                ))}
              </ul>
              <Link to="/signup"><Button fullWidth variant={plan.popular ? 'primary' : 'outline'} className={plan.popular ? 'shadow-lg shadow-[#1bb0ce]/30' : ''}>Get Started</Button></Link>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/pricing" className="inline-flex items-center gap-1 text-[#1bb0ce] font-semibold hover:underline">View all plans <ChevronRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl sm:text-4xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>Shop wireless phones</h2>
          <p className="text-[--ink-soft] text-lg max-w-xl mx-auto">Grandstream hardware built for crystal-clear communication, at home or in the office.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.slice(0, 4).map(product => (
            <Card key={product.id} hover className="overflow-hidden group border-[--mist]">
              <div className="h-48 flex items-center justify-center group-hover:bg-gray-100 transition-colors" style={{ background: 'var(--mist)' }}>
                {product.image
                  ? <img src={product.image} alt={product.name} className="h-full w-full object-contain p-4" onError={e => { e.target.style.display='none'; }} />
                  : <Phone size={64} className="text-gray-400" />}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[#0a1628] text-base mb-1">{product.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Stars rating={Math.round(product.rating)} />
                  <span className="text-gray-400 text-xs">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono-num text-xl font-bold text-[#1bb0ce]">${product.price.toFixed(2)}</span>
                  {product.onSale && <span className="font-mono-num text-xs line-through text-gray-400">${product.originalPrice.toFixed(2)}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/shop"><Button size="lg" variant="primary">View All Products <ArrowRight size={18} /></Button></Link>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="py-20" style={{ background: 'var(--paper)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>Not your average dial tone</h2>
          <p className="text-[--ink-soft] text-lg max-w-xl mx-auto">Four things we get right, on every line we activate.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px rounded-2xl overflow-hidden border border-gray-200" style={{ background: '#e5e9eb' }}>
          {whyChooseUs.map(({ icon: Icon, line, title, description }) => (
            <div key={title} className="bg-white p-8 flex gap-5">
              <div className="shrink-0">
                <span className="font-mono-num block text-xs text-gray-400 mb-3">LINE {line}</span>
                <div className="w-12 h-12 rounded-xl bg-[#1bb0ce]/10 flex items-center justify-center">
                  <Icon size={22} className="text-[#1bb0ce]" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0a1628] mb-2">{title}</h3>
                <p className="text-[--ink-soft] leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowSection() {
  const { data: steps } = usePageSection('home_how', DEFAULT_HOW_STEPS);
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>How it works</h2>
          <p className="text-[--ink-soft] text-lg max-w-xl mx-auto">Three steps, in order, to world-class phone service.</p>
        </div>
        <div className="flex flex-col lg:flex-row items-center relative">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex flex-col lg:flex-row items-center flex-1">
              <div className="text-center flex-1 px-6">
                <div className="w-16 h-16 rounded-2xl bg-[#0a1628] text-[#1bb0ce] flex items-center justify-center font-mono-num text-xl font-bold mx-auto mb-4">{step.number}</div>
                <h3 className="text-xl font-bold text-[#0a1628] mb-2">{step.title}</h3>
                <p className="text-[--ink-soft] text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center shrink-0"><ArrowRight size={28} className="text-[#1bb0ce] opacity-40" /></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonialColumn1 = testimonials.slice(0, 3);
const testimonialColumn2 = testimonials.slice(3, 6);
const testimonialColumn3 = testimonials.slice(6, 9);

function TestimonialsSection() {
  return (
    <section className="py-20 relative overflow-hidden" style={{ background: 'var(--paper)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center max-w-xl mx-auto mb-4"
        >
          <span className="inline-block text-[#1bb0ce] border border-[#1bb0ce]/30 bg-[#1bb0ce]/5 text-xs font-bold tracking-[0.14em] uppercase px-4 py-1.5 rounded-full mb-5">
            Testimonials
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>What people say after they switch</h2>
          <p className="text-[--ink-soft] text-lg">Real accounts from businesses now running on Oasis.</p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[700px] overflow-hidden">
          <TestimonialsColumn testimonials={testimonialColumn1} duration={16} />
          <TestimonialsColumn testimonials={testimonialColumn2} duration={20} className="hidden md:block" />
          <TestimonialsColumn testimonials={testimonialColumn3} duration={18} className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="relative py-20 overflow-hidden" style={{ background: '#0a1628' }}>
      <div className="absolute inset-x-0 top-0 opacity-30 flex justify-center pt-8">
        <Waveform bars={40} color="#1bb0ce" height={28} />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl sm:text-4xl text-white mb-4" style={{ fontWeight: 560 }}>
          Your first crystal-clear call is minutes away.
        </h2>
        <p className="text-blue-100/80 text-lg mb-8 max-w-xl mx-auto">
          Join hundreds of businesses already saving money on phone service. No contracts required.
        </p>
        <Link to="/signup"><Button size="lg" variant="white">Get Started Today <ArrowRight size={20} /></Button></Link>
      </div>
    </section>
  );
}

// ── Custom sections (added by admin) ──────────────────────────

function CustomTextSection({ content = {} }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {content.title && <h2 className="font-display text-3xl sm:text-4xl text-[#0a1628] mb-6" style={{ fontWeight: 560 }}>{content.title}</h2>}
        {content.body && <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{content.body}</p>}
      </div>
    </section>
  );
}

function CustomCtaSection({ content = {} }) {
  return (
    <section className="py-16" style={{ background: content.bg || 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {content.title    && <h2 className="font-display text-3xl text-white mb-3" style={{ fontWeight: 560 }}>{content.title}</h2>}
        {content.subtitle && <p className="text-blue-100 text-lg mb-8">{content.subtitle}</p>}
        {content.button   && (
          <Link to={content.link || '/signup'}>
            <Button size="lg" variant="white">{content.button}</Button>
          </Link>
        )}
      </div>
    </section>
  );
}

function CustomBannerSection({ content = {} }) {
  return (
    <section className="py-12" style={{ background: content.bg || '#f9fafb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {content.title    && <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: content.textColor || '#0a1628' }}>{content.title}</h2>}
        {content.subtitle && <p className="text-lg mb-6 opacity-80" style={{ color: content.textColor || '#374151' }}>{content.subtitle}</p>}
        {content.button   && (
          <Link to={content.link || '/'}>
            <Button variant="primary">{content.button}</Button>
          </Link>
        )}
      </div>
    </section>
  );
}

// ── Section registry ───────────────────────────────────────────

const SECTION_MAP = {
  hero:         HeroSection,
  stats:        StatsSection,
  plans:        PlansSection,
  products:     ProductsSection,
  why:          WhySection,
  how:          HowSection,
  testimonials: TestimonialsSection,
  cta:          CtaSection,
};

const CUSTOM_MAP = {
  custom_text:   CustomTextSection,
  custom_cta:    CustomCtaSection,
  custom_banner: CustomBannerSection,
};

// ── Home page ──────────────────────────────────────────────────

export default function Home() {
  const { layout, loading } = useHomeLayout();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1bb0ce] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Crystal-Clear Wireless Phone Service in Canada"
        description="Oasis Orchard Technologies — authorized VoIP reseller offering Grandstream wireless phones and phone plans from $10/month. Easy setup, HD audio, Canada-wide."
        canonical="/"
        schema={[organizationSchema, localBusinessSchema, websiteSchema, homeFaqSchema, homeHowToSchema]}
      />
    <div className="min-h-screen">
      {layout
        .filter(s => s.visible !== false)
        .map(section => {
          if (section.type === 'builtin') {
            const Component = SECTION_MAP[section.key];
            return Component ? <Component key={section.key} /> : null;
          }
          const CustomComp = CUSTOM_MAP[section.type];
          return CustomComp
            ? <CustomComp key={section.key} content={section.content || {}} />
            : null;
        })
      }
    </div>
    </>
  );
}
