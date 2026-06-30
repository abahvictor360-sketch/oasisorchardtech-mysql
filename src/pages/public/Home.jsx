import { Link } from 'react-router-dom';
import {
  Phone, Signal, Mic2, Zap, DollarSign, Headphones,
  ChevronRight, Star, Check, ArrowRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { products, servicePlans } from '../../data/products';
import { useHomeLayout } from '../../hooks/useHomeLayout';
import { usePageSection } from '../../hooks/usePageSection';
import SEO from '../../components/seo/SEO';
import { organizationSchema, localBusinessSchema, websiteSchema, homeFaqSchema, homeHowToSchema } from '../../lib/schemas';

const whyChooseUs = [
  { icon: Mic2,       title: 'Crystal Clear Audio',  description: 'Experience HD voice quality on every call. Our wireless phone technology delivers studio-grade clarity that makes every conversation feel like an in-person meeting.' },
  { icon: Zap,        title: 'Easy Setup',            description: 'Get up and running in minutes, not days. Our plug-and-play phones connect to your existing internet — no technician required.' },
  { icon: DollarSign, title: 'Affordable Plans',      description: 'Business-quality phone service starting at just $10/month. Save up to 60% compared to traditional phone providers with no hidden fees.' },
  { icon: Headphones, title: '24/7 Support',          description: 'Our expert support team is always available when you need us. Get help via phone, email, or live chat — any time, day or night.' },
];

const DEFAULT_HOW_STEPS = [
  { number: '01', title: 'Choose Your Plan',  description: 'Select from Basic, Smart, or Business Connect depending on your needs and budget.' },
  { number: '02', title: 'Get Your Phone',    description: 'Pick a Grandstream wireless phone from our catalog — we ship to all parts of Canada.' },
  { number: '03', title: 'Start Calling',     description: 'Plug in your phone, activate your plan, and enjoy crystal-clear calls from day one.' },
];

const testimonials = [
  { name: 'Maria Gonzalez', role: 'Small Business Owner',    rating: 5, quote: 'Switching to Oasis Orchard Technologies saved our company over $200 a month on phone bills. The call quality is outstanding and setup took under 10 minutes!' },
  { name: 'James Okafor',   role: 'Remote Team Manager',     rating: 5, quote: "The Smart Connect plan is perfect for our distributed team. The 3-way calling and mobile app keep everyone connected. Best decision we've made this year." },
  { name: 'Sandra Liu',     role: 'Office Administrator',    rating: 5, quote: 'I was skeptical about wireless phones at first, but Oasis made it so simple. Their support team walked me through everything. Five stars without hesitation!' },
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

// ── Built-in section components ────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2040 50%, #1bb0ce 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Welcome to<br />
            <span style={{ color: '#1bb0ce' }}>Oasis Orchard</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mb-8 leading-relaxed">
            Stay connected anytime, anywhere with our advanced wireless phone service from an authorized reseller. Enjoy crystal-clear local calls and unmatched reliability at an affordable price. Designed for seamless communication, our service offers the latest technology with user-friendly features, making every call a smooth experience. Whether for personal or business use, we deliver high-quality connections at a competitive price that fits your budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link to="/shop"><Button size="lg" variant="primary" className="shadow-lg shadow-[#1bb0ce]/40">Shop Phones <ArrowRight size={18} /></Button></Link>
            <Link to="/pricing"><Button size="lg" variant="white-outline">View Plans</Button></Link>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center z-10">
          <div className="relative w-64 h-64 lg:w-80 lg:h-80">
            <div className="absolute inset-0 rounded-full opacity-20 animate-ping" style={{ background: '#1bb0ce' }} />
            <div className="absolute inset-4 rounded-full opacity-30 animate-ping" style={{ background: '#1bb0ce', animationDelay: '0.3s' }} />
            <div className="absolute inset-8 rounded-full flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #1bb0ce, #0a1628)' }}>
              <Phone size={80} className="text-white drop-shadow-lg" />
            </div>
            {[0,72,144,216,288].map((deg, i) => (
              <div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ transform: `translate(-50%,-50%) rotate(${deg}deg) translateX(120px) rotate(-${deg}deg)` }}>
                <Signal size={22} className="text-[#1bb0ce] opacity-80" />
              </div>
            ))}
          </div>
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
    { value: '500+', label: 'Customers' },
    { value: '99.9%', label: 'Uptime' },
    { value: '$10/mo', label: 'Starting Price' },
    { value: '7+', label: 'Phone Models' },
  ];
  return (
    <section className="bg-[#0a1628] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#1bb0ce]">{s.value}</p>
              <p className="text-blue-300 mt-1 text-sm sm:text-base">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0a1628] mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Pick the plan that fits your needs. No contracts. No hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {servicePlans.map(plan => (
            <div key={plan.id} className={['relative rounded-2xl p-8 flex flex-col transition-transform duration-200', plan.popular ? 'bg-white border-2 border-[#1bb0ce] shadow-2xl scale-105 z-10' : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'].join(' ')}>
              {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1bb0ce] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide shadow">Most Popular</span>}
              <h3 className="text-xl font-bold text-[#0a1628] mb-2">{plan.name}</h3>
              <div className="flex items-end gap-1 mb-6"><span className="text-4xl font-extrabold text-[#1bb0ce]">${plan.price}</span><span className="text-gray-400 mb-1">/mo</span></div>
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
          <Link to="/pricing" className="inline-flex items-center gap-1 text-[#1bb0ce] font-semibold hover:underline">View All Plans <ChevronRight size={16} /></Link>
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
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0a1628] mb-4">Shop Business Phones</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Browse our selection of Grandstream wireless phones built for crystal-clear communication.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.slice(0, 4).map(product => (
            <Card key={product.id} hover className="overflow-hidden group">
              <div className="bg-gray-100 h-48 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
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
                  <span className="text-xl font-bold text-[#1bb0ce]">${product.price.toFixed(2)}</span>
                  {product.onSale && <span className="text-xs line-through text-gray-400">${product.originalPrice.toFixed(2)}</span>}
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
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0a1628] mb-4">Why Choose Us</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">We're committed to delivering the best phone experience — from hardware to support.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {whyChooseUs.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white rounded-2xl p-8 flex gap-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="shrink-0 w-14 h-14 rounded-full bg-[#1bb0ce]/10 flex items-center justify-center">
                <Icon size={28} className="text-[#1bb0ce]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0a1628] mb-2">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{description}</p>
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
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0a1628] mb-4">How It Works</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Three simple steps to world-class phone service.</p>
        </div>
        <div className="flex flex-col lg:flex-row items-center relative">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex flex-col lg:flex-row items-center flex-1">
              <div className="text-center flex-1 px-6">
                <div className="w-16 h-16 rounded-full bg-[#1bb0ce] text-white flex items-center justify-center text-2xl font-extrabold mx-auto mb-4 shadow-lg">{step.number}</div>
                <h3 className="text-xl font-bold text-[#0a1628] mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center shrink-0"><ArrowRight size={32} className="text-[#1bb0ce] opacity-50" /></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0a1628] mb-4">What Our Customers Say</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Don't take our word for it — hear directly from businesses that switched to Oasis.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(t => (
            <Card key={t.name} hover className="p-6 flex flex-col gap-4">
              <Stars rating={t.rating} />
              <p className="text-gray-600 italic leading-relaxed flex-1">"{t.quote}"</p>
              <div>
                <p className="font-bold text-[#0a1628]">{t.name}</p>
                <p className="text-sm text-gray-400">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-20" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          Join hundreds of businesses already saving money and enjoying crystal-clear calls. Sign up today — no contracts required.
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
        {content.title && <h2 className="text-3xl sm:text-4xl font-bold text-[#0a1628] mb-6">{content.title}</h2>}
        {content.body && <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{content.body}</p>}
      </div>
    </section>
  );
}

function CustomCtaSection({ content = {} }) {
  return (
    <section className="py-16" style={{ background: content.bg || 'linear-gradient(135deg, #0a1628 0%, #1bb0ce 100%)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {content.title    && <h2 className="text-3xl font-extrabold text-white mb-3">{content.title}</h2>}
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
