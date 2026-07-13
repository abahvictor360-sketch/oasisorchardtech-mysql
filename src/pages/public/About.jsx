import { Link } from 'react-router-dom';
import { Heart, Shield, Lightbulb, Users, Building2, Award } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { usePageSection } from '../../hooks/usePageSection';
import SEO from '../../components/seo/SEO';
import { organizationSchema } from '../../lib/schemas';

// ── Icons for core values (fixed — not editable) ─────────────
const VALUE_ICONS = [Heart, Shield, Lightbulb, Users];

// ── Defaults ─────────────────────────────────────────────────
const DEFAULTS = {
  about_hero: {
    title:    'About Oasis Orchard Technologies',
    subtitle: "We're passionate about connecting people and businesses with affordable, reliable business phone solutions that just work.",
  },
  about_story: {
    title: 'Our Story',
    body:  'At Oasis Orchard, we believe in keeping people connected with the highest quality home phone services. With years of experience in the telecommunications industry, we provide reliable, affordable, and easy-to-use solutions tailored to meet the needs of our customers. Our mission is to bring you closer to your loved ones and ensure you never miss an important moment or conversation.',
  },
  about_mission_vision: {
    missionText: 'To provide businesses of all sizes with affordable, high-quality business phone communication solutions — making enterprise-level phone service accessible to everyone, not just large corporations.',
    visionText:  'To become the leading authorized wireless phone reseller in North America, known for exceptional customer service, innovative technology, and a commitment to making every call count.',
  },
  about_values: [
    { title: 'Customer First', description: 'Every decision we make starts with one question: how does this serve our customers better?' },
    { title: 'Integrity',      description: 'We operate with complete transparency. Honest pricing, honest support, no hidden agendas.' },
    { title: 'Innovation',     description: 'We stay ahead of the curve, continuously bringing the latest wireless phone technology to our clients.' },
    { title: 'Community',      description: "We're more than a provider — we're a partner invested in the growth of your business and community." },
  ],
  about_team: [
    { name: 'Abiodun Ishioye', role: 'Founder & CEO',           initials: 'AI' },
    { name: 'Victor Abah',     role: 'Head of Operations',       initials: 'VA' },
    { name: 'Soji Ojo',        role: 'Lead Support Engineer',    initials: 'SO' },
    { name: 'Alpha Young',     role: 'Sales & Partnerships',     initials: 'AY' },
  ],
  about_cta: {
    title:   'Join the Oasis Family',
    subtitle: 'Ready to experience the difference? Get started today — no contracts, no surprises.',
    button1: 'Get Started',
  },
};

const ALL_KEYS = Object.keys(DEFAULTS);

export default function About() {
  const { data } = usePageSection(ALL_KEYS, DEFAULTS);

  const hero      = data.about_hero          ?? DEFAULTS.about_hero;
  const story     = data.about_story         ?? DEFAULTS.about_story;
  const mv        = data.about_mission_vision ?? DEFAULTS.about_mission_vision;
  const values    = data.about_values        ?? DEFAULTS.about_values;
  const team      = data.about_team          ?? DEFAULTS.about_team;
  const cta       = data.about_cta           ?? DEFAULTS.about_cta;

  return (
    <>
      <SEO
        title="About Us — Authorized VoIP Reseller in Canada"
        description="Learn about Oasis Orchard Technologies — our mission, values, and team. We are an authorized wireless phone reseller serving businesses and homes across Canada."
        canonical="/about"
        schema={organizationSchema}
      />
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-24" style={{ background: '#0a1628' }}>
        <div className="absolute -left-40 -top-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #1bb0ce 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-[#1bb0ce] text-xs font-bold tracking-[0.18em] uppercase mb-5">Authorized Grandstream Reseller · Canada-Wide</span>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-6" style={{ fontWeight: 560 }}>{hero.title}</h1>
          <p className="text-blue-100/80 text-lg sm:text-xl max-w-2xl mx-auto">{hero.subtitle}</p>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl text-[#0a1628] mb-6" style={{ fontWeight: 560 }}>{story.title}</h2>
              <p className="text-[--ink-soft] leading-relaxed">{story.body}</p>
            </div>
            <div className="rounded-2xl h-80 flex items-center justify-center border" style={{ background: 'var(--paper)', borderColor: 'var(--mist)' }}>
              <Building2 size={96} className="text-[#1bb0ce] opacity-40" />
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="py-20" style={{ background: 'var(--paper)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>Mission &amp; Vision</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8">
              <div className="w-12 h-12 rounded-full bg-[#1bb0ce]/10 flex items-center justify-center mb-4">
                <Award size={24} className="text-[#1bb0ce]" />
              </div>
              <h3 className="text-xl font-bold text-[#0a1628] mb-3">Our Mission</h3>
              <p className="text-[--ink-soft] leading-relaxed">{mv.missionText}</p>
            </Card>
            <Card className="p-8">
              <div className="w-12 h-12 rounded-full bg-[#1bb0ce]/10 flex items-center justify-center mb-4">
                <Lightbulb size={24} className="text-[#1bb0ce]" />
              </div>
              <h3 className="text-xl font-bold text-[#0a1628] mb-3">Our Vision</h3>
              <p className="text-[--ink-soft] leading-relaxed">{mv.visionText}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>What we stand on</h2>
            <p className="text-[--ink-soft] text-lg max-w-xl mx-auto">
              Four principles that guide every interaction, every decision, and every call.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px rounded-2xl overflow-hidden border border-gray-200" style={{ background: '#e5e9eb' }}>
            {values.map((v, i) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
              return (
                <div key={i} className="bg-white p-8 flex gap-5">
                  <div className="shrink-0">
                    <span className="font-mono-num block text-xs text-gray-400 mb-3">LINE {String(i + 1).padStart(2, '0')}</span>
                    <div className="w-12 h-12 rounded-xl bg-[#1bb0ce]/10 flex items-center justify-center">
                      <Icon size={22} className="text-[#1bb0ce]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0a1628] mb-2">{v.title}</h3>
                    <p className="text-[--ink-soft] leading-relaxed">{v.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-20" style={{ background: 'var(--paper)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>Meet the team</h2>
            <p className="text-[--ink-soft] text-lg max-w-xl mx-auto">
              Dedicated professionals passionate about wireless phone technology and customer success.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <Card key={i} hover className="p-6 text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold shadow-md"
                  style={{ background: 'linear-gradient(135deg, #1bb0ce, #0f6f82)' }}
                >
                  {member.initials}
                </div>
                <h3 className="font-bold text-[#0a1628] mb-1">{member.name}</h3>
                <p className="text-sm text-[--ink-soft] opacity-70">{member.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-[#0a1628] mb-4" style={{ fontWeight: 560 }}>Our partners</h2>
            <p className="text-[--ink-soft] text-lg max-w-xl mx-auto">
              We work with industry leaders to bring you the best in wireless phone technology.
            </p>
          </div>
          <div className="flex flex-col items-center gap-6">
            <p className="text-[--ink-soft] text-center max-w-lg">
              Oasis Orchard Technologies is a proud{' '}
              <span className="font-semibold text-[#0a1628]">Authorized Reseller of Grandstream</span>{' '}
              — a global leader in unified communications and wireless phone hardware. This partnership ensures
              every device we sell meets the highest standards of quality and reliability.
            </p>
            <div className="rounded-xl px-16 py-10 flex items-center justify-center border" style={{ background: 'var(--paper)', borderColor: 'var(--mist)' }}>
              <p className="text-gray-400 font-semibold text-xl tracking-wide">Grandstream Networks</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-16 overflow-hidden" style={{ background: '#0a1628' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl text-white mb-4" style={{ fontWeight: 560 }}>{cta.title}</h2>
          <p className="text-blue-100/80 mb-8">{cta.subtitle}</p>
          {cta.button1 && (
            <Link to="/signup"><Button size="lg" variant="white">{cta.button1}</Button></Link>
          )}
        </div>
      </section>
    </div>
    </>
  );
}
