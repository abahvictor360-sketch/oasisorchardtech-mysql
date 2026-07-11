import { useState, useEffect, useCallback } from 'react';
import {
  Save, RotateCcw, ChevronDown, ChevronUp, Globe, Loader,
  ArrowUp, ArrowDown, Eye, EyeOff, Plus, Trash2, FilePlus, Layout,
  Palette, Menu, AlignLeft, Wifi, Phone,
} from 'lucide-react';
import { content as contentApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { DEFAULT_LAYOUT, saveHomeLayout } from '../../hooks/useHomeLayout';
import {
  saveKey, DEFAULT_BRAND, DEFAULT_NAV, DEFAULT_FOOTER, useSiteSettings,
} from '../../context/SiteSettingsContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

// ── Default content ──────────────────────────────────────────
const DEFAULTS = {
  home_hero: { title: 'Welcome to\nOasis Orchard', subtitle: 'Stay connected anytime, anywhere with our advanced wireless phone service from an authorized reseller. Enjoy crystal-clear local calls and unmatched reliability at an affordable price. Designed for seamless communication, our service offers the latest technology with user-friendly features, making every call a smooth experience. Whether for personal or business use, we deliver high-quality connections at a competitive price that fits your budget.', cta1: 'Shop Phones', cta2: 'View Plans' },
  home_stats: [{ label: 'Customers', value: '500+' }, { label: 'Uptime', value: '99.9%' }, { label: 'Starting Price', value: '$10/mo' }, { label: 'Phone Models', value: '7+' }],
  home_why: [{ title: 'Crystal Clear Audio', desc: 'HD voice quality on every call, powered by the latest IP codecs.' }, { title: 'Easy Setup', desc: 'Up and running in minutes. Plug in, configure, and start calling.' }, { title: 'Affordable Plans', desc: 'Plans starting at $10/month with no hidden fees or contracts.' }, { title: '24/7 Support', desc: 'Our team is always here when you need help with your service.' }],
  home_how: [
    { number: '01', title: 'Choose Your Plan',  description: 'Select from Basic, Smart, or Business Connect depending on your needs and budget.' },
    { number: '02', title: 'Get Your Phone',    description: 'Pick a Grandstream wireless phone from our catalog — we ship to all parts of Canada.' },
    { number: '03', title: 'Start Calling',     description: 'Plug in your phone, activate your plan, and enjoy crystal-clear calls from day one.' },
  ],
  home_cta: { title: 'Ready to Get Started?', subtitle: 'Join hundreds of satisfied customers enjoying crystal-clear service.', button: 'Get Started Today' },
  plans_basic:    { name: 'Basic Connect',    price: 10, features: ['Unlimited local calls', 'Voicemail', 'Caller ID', 'Call waiting', 'Basic support'] },
  plans_smart:    { name: 'Smart Connect',    price: 15, features: ['Everything in Basic', 'Unlimited long-distance', '3-way calling', 'Auto-attendant', 'Priority support', 'Mobile app'] },
  plans_business: { name: 'Business Connect', price: 25, features: ['Everything in Smart', '5 lines included', 'Advanced analytics', 'Custom caller ID', 'SLA guarantee', '24/7 dedicated support', 'API access'] },
  about_hero:  { title: 'About Oasis Orchard Technologies', subtitle: 'Your trusted authorized wireless phone reseller since 2020.' },
  about_story: { title: 'Our Story', body: 'At Oasis Orchard, we believe in keeping people connected with the highest quality home phone services. With years of experience in the telecommunications industry, we provide reliable, affordable, and easy-to-use solutions tailored to meet the needs of our customers. Our mission is to bring you closer to your loved ones and ensure you never miss an important moment or conversation.' },
  about_mission_vision: { missionText: 'To provide businesses of all sizes with affordable, high-quality business phone communication solutions — making enterprise-level phone service accessible to everyone, not just large corporations.', visionText: 'To become the leading authorized wireless phone reseller in North America, known for exceptional customer service, innovative technology, and a commitment to making every call count.' },
  about_values: [{ title: 'Customer First', description: 'Every decision we make starts with one question: how does this serve our customers better?' }, { title: 'Integrity', description: 'We operate with complete transparency. Honest pricing, honest support, no hidden agendas.' }, { title: 'Innovation', description: 'We stay ahead of the curve, continuously bringing the latest wireless phone technology to our clients.' }, { title: 'Community', description: "We're more than a provider — we're a partner invested in the growth of your business and community." }],
  about_team: [{ name: 'Abiodun Ishioye', role: 'Founder & CEO', initials: 'AI' }, { name: 'Victor Abah', role: 'Head of Operations', initials: 'VA' }, { name: 'Soji Ojo', role: 'Lead Support Engineer', initials: 'SO' }, { name: 'Alpha Young', role: 'Sales & Partnerships', initials: 'AY' }],
  about_cta: { title: 'Join the Oasis Family', subtitle: 'Ready to experience the difference? Get started today — no contracts, no surprises.', button1: 'Get Started' },
  services_hero: { title: 'Our Phone Services', subtitle: 'Comprehensive communication solutions for home and business.' },
  services_cards: [{ title: 'Business Phone System', description: 'Full-featured business phone system with auto-attendant, voicemail, call forwarding, and more.', features: ['Auto-attendant / IVR', 'Voicemail to email', 'Call recording', 'Conference calling'] }, { title: 'Cloud Phone System', description: 'Replace your traditional phone system with a fully managed cloud solution.', features: ['No on-site hardware needed', 'Unlimited extensions', 'Remote management', 'Instant provisioning'] }, { title: 'Remote Work Support', description: 'Keep your team connected wherever they work from any device.', features: ['Work from anywhere', 'Number porting', 'Toll-free numbers', 'Direct inward dialing'] }, { title: 'Secure Communications', description: 'Enterprise-grade security for all voice traffic. End-to-end encryption as standard.', features: ['End-to-end encryption', 'Secure call signaling', 'Fraud monitoring', 'Access controls'] }],
  services_home_phone: { heading: 'Replace Your Landline — Save Big', description: 'Cut the cord on expensive traditional phone lines without sacrificing reliability or call quality. Our home phone service gives you all the features of a traditional phone — plus dozens more — at a fraction of the cost.', benefits: ['Unlimited local and long-distance calls', 'Caller ID, call waiting, call forwarding', 'Voicemail with email delivery', 'No contracts — cancel any time', 'Works with your existing cordless phone system'] },
  services_mobile: { heading: 'Take Your Office Anywhere', description: "With our mobile phone app, your business number travels with you. Make and receive professional calls from your smartphone — whether you're in the office, at home, or on the road.", benefits: ['Make and receive calls from your mobile device', 'Use your business number on the go', 'Full voicemail and call management', 'Works over WiFi or cellular data', 'iOS and Android compatible'] },
  services_process: [{ title: 'Sign Up', description: 'Create your account and choose the service plan that fits your needs.' }, { title: 'Configure', description: "We'll help you set up your phone numbers, extensions, and call routing." }, { title: 'Connect', description: "Plug in your wireless phone or install the mobile app — you're ready to go." }, { title: 'Support', description: 'Our 24/7 team is always here to help you get the most from your service.' }],
  services_faqs: [{ question: 'How does wireless phone technology work?', answer: 'wireless phone technology converts your voice into digital data and transmits it over the internet, just like email or web browsing. Instead of using traditional phone lines, wireless phones use your existing broadband connection.' }, { question: 'Do I need special hardware?', answer: 'Not necessarily. You can use our service with a dedicated wireless phone, a softphone application on your computer, or a mobile app on your smartphone.' }, { question: 'Can I keep my existing phone number?', answer: 'Yes! We support number porting, which means we can transfer your existing business or personal phone number to our service at no extra charge.' }, { question: 'What internet speed do I need?', answer: 'wireless phone calls typically use 85-100 kbps per active call. For most home or small business use, a standard broadband connection (10+ Mbps) is more than sufficient.' }, { question: 'Is wireless phone service reliable?', answer: 'Modern wireless phone services achieve 99.9%+ uptime. If your internet goes down, calls can be automatically forwarded to a mobile number of your choice.' }],
  services_cta: { title: 'Ready to Modernize Your Phone System?', subtitle: 'Join hundreds of customers who switched to Oasis Orchard Technologies. No contracts, no setup fees.', button1: 'Get Started Today', button2: 'Talk to an Expert' },
  pricing_hero:  { title: 'Simple, Transparent Pricing', subtitle: 'No hidden fees. No contracts. Cancel anytime.' },
  contact_info:  { phone: '+1 (902) 593-4442', email: 'support@oasisorchard.com', address: '61 Rue Bastarache, Dieppe NB E1A 6Y6, Canada' },
  shop_tabs: [
    { key: 'all',        label: 'All Phones', icon: 'PhoneCall' },
    { key: 'mobile',     label: 'Mobile',     icon: 'Smartphone' },
    { key: 'home-phone', label: 'Home Phone', icon: 'PhoneCall' },
  ],
};

const CONTENT_SECTIONS = [
  { page: 'Plans (all pages)', sections: [
    { key: 'plans_basic',    label: 'Basic Connect Plan',    type: 'plan' },
    { key: 'plans_smart',    label: 'Smart Connect Plan',    type: 'plan' },
    { key: 'plans_business', label: 'Business Connect Plan', type: 'plan' },
  ]},
  { page: 'Home Page Text', sections: [
    { key: 'home_hero',  label: 'Hero Banner Text', type: 'hero'      },
    { key: 'home_stats', label: 'Stats Bar',        type: 'stats'     },
    { key: 'home_why',   label: 'Why Choose Us',    type: 'features'  },
    { key: 'home_how',   label: 'How It Works',     type: 'how_steps' },
    { key: 'home_cta',   label: 'CTA Banner Text',  type: 'cta'       },
  ]},
  { page: 'About Page', sections: [
    { key: 'about_hero',           label: 'Hero Banner',    type: 'simple_hero'    },
    { key: 'about_story',          label: 'Our Story',      type: 'story'          },
    { key: 'about_mission_vision', label: 'Mission & Vision', type: 'mission_vision' },
    { key: 'about_values',         label: 'Core Values',    type: 'values'         },
    { key: 'about_team',           label: 'Team Members',   type: 'team'           },
    { key: 'about_cta',            label: 'Bottom CTA',     type: 'page_cta'       },
  ]},
  { page: 'Services Page', sections: [
    { key: 'services_hero',       label: 'Hero Banner',            type: 'simple_hero'    },
    { key: 'services_cards',      label: 'Service Cards (4)',      type: 'service_cards'  },
    { key: 'services_home_phone', label: 'Home Phone Section',     type: 'two_col_section'},
    { key: 'services_mobile',     label: 'Mobile Section',         type: 'two_col_section'},
    { key: 'services_process',    label: 'How It Works (4 steps)', type: 'process_steps'  },
    { key: 'services_faqs',       label: 'FAQ Section',            type: 'faqs'           },
    { key: 'services_cta',        label: 'Bottom CTA',             type: 'page_cta'       },
  ]},
  { page: 'Pricing Page', sections: [
    { key: 'pricing_hero', label: 'Hero Banner', type: 'simple_hero' },
  ]},
  { page: 'Shop Page', sections: [
    { key: 'shop_tabs', label: 'Category Tabs', type: 'shop_tabs' },
  ]},
  { page: 'Global', sections: [
    { key: 'contact_info', label: 'Contact Information', type: 'contact' },
  ]},
];

// ── DB helpers ───────────────────────────────────────────────
async function fetchContent(key) {
  try {
    const { data } = await contentApi.get(key);
    return data ?? DEFAULTS[key];
  } catch { return DEFAULTS[key]; }
}
async function saveContent(key, value) {
  const { error } = await contentApi.save(key, value);
  if (error) throw new Error(error.message);
}

// ── Section editors ──────────────────────────────────────────
function Field({ label, value, onChange, multiline }) {
  const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40';
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {multiline
        ? <textarea rows={3} value={value||''} onChange={e=>onChange(e.target.value)} className={cls+' resize-y'} />
        : <input value={value||''} onChange={e=>onChange(e.target.value)} className={cls} />}
    </div>
  );
}

function HeroEditor({ v, set }) {
  return <div className="space-y-3">{[['title','Headline (\\n = line break)'],['subtitle','Subtitle'],['cta1','Button 1 Text'],['cta2','Button 2 Text']].map(([k,l])=><Field key={k} label={l} value={v[k]} onChange={val=>set({...v,[k]:val})} />)}</div>;
}
function SimpleHeroEditor({ v, set }) {
  return <div className="space-y-3">{[['title','Title'],['subtitle','Subtitle']].map(([k,l])=><Field key={k} label={l} value={v[k]} onChange={val=>set({...v,[k]:val})} />)}</div>;
}
function CtaEditor({ v, set }) {
  return <div className="space-y-3">{[['title','Title'],['subtitle','Subtitle'],['button','Button Text']].map(([k,l])=><Field key={k} label={l} value={v[k]} onChange={val=>set({...v,[k]:val})} />)}</div>;
}
function StatsEditor({ v, set }) {
  const upd=(i,f,val)=>{const n=[...v];n[i]={...n[i],[f]:val};set(n);};
  return <div className="grid sm:grid-cols-2 gap-3">{v.map((s,i)=><div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2"><label className="text-xs font-medium text-gray-500">Stat {i+1}</label><input value={s.value||''} onChange={e=>upd(i,'value',e.target.value)} placeholder="e.g. 500+" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"/><input value={s.label||''} onChange={e=>upd(i,'label',e.target.value)} placeholder="e.g. Customers" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"/></div>)}</div>;
}
function FeaturesEditor({ v, set }) {
  const upd=(i,f,val)=>{const n=[...v];n[i]={...n[i],[f]:val};set(n);};
  return <div className="space-y-3">{v.map((f,i)=><div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2"><label className="text-xs font-medium text-gray-500">Feature {i+1}</label><input value={f.title||''} onChange={e=>upd(i,'title',e.target.value)} placeholder="Title" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"/><input value={f.desc||''} onChange={e=>upd(i,'desc',e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"/></div>)}</div>;
}
function PlanEditor({ v, set }) {
  const updF=(i,val)=>{const n=[...(v.features||[])];n[i]=val;set({...v,features:n});};
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Plan Name" value={v.name} onChange={val=>set({...v,name:val})} />
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Price ($/month)</label><input type="number" min="0" value={v.price||''} onChange={e=>set({...v,price:parseFloat(e.target.value)||0})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/></div>
      </div>
      <div><label className="block text-xs font-medium text-gray-600 mb-2">Features</label>
        <div className="space-y-2">{(v.features||[]).map((f,i)=><div key={i} className="flex gap-2"><input value={f} onChange={e=>updF(i,e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/><button onClick={()=>set({...v,features:v.features.filter((_,j)=>j!==i)})} className="px-2 text-red-400 hover:text-red-600 text-sm">✕</button></div>)}</div>
        <button onClick={()=>set({...v,features:[...(v.features||[]),''],})} className="mt-2 text-sm text-[#1bb0ce] hover:underline">+ Add Feature</button>
      </div>
    </div>
  );
}
function ContactEditor({ v, set }) {
  return <div className="space-y-3">{[['phone','Phone'],['email','Email'],['address','Address']].map(([k,l])=><Field key={k} label={l} value={v[k]} onChange={val=>set({...v,[k]:val})} />)}</div>;
}
function StoryEditor({ v, set }) {
  return <div className="space-y-3"><Field label="Section Title" value={v.title} onChange={val=>set({...v,title:val})} /><Field label="Body" value={v.body} onChange={val=>set({...v,body:val})} multiline /></div>;
}
function ServiceCardsEditor({ v, set }) {
  const upd  = (i,k,val) => { const n=[...v]; n[i]={...n[i],[k]:val}; set(n); };
  const updF = (i,fi,val) => { const n=[...v]; const f=[...n[i].features]; f[fi]=val; n[i]={...n[i],features:f}; set(n); };
  const remF = (i,fi) => { const n=[...v]; n[i]={...n[i],features:n[i].features.filter((_,j)=>j!==fi)}; set(n); };
  const addF = (i) => { const n=[...v]; n[i]={...n[i],features:[...(n[i].features||[]),'New feature']}; set(n); };
  return <div className="space-y-4">{v.map((card,i)=>(
    <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase">Card {i+1}</p>
      <input value={card.title} onChange={e=>upd(i,'title',e.target.value)} placeholder="Card title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
      <textarea rows={2} value={card.description} onChange={e=>upd(i,'description',e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 resize-none"/>
      <div className="space-y-1.5">{(card.features||[]).map((f,fi)=>(
        <div key={fi} className="flex gap-2">
          <input value={f} onChange={e=>updF(i,fi,e.target.value)} className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
          <button onClick={()=>remF(i,fi)} className="text-red-400 px-1 text-sm">✕</button>
        </div>
      ))}<button onClick={()=>addF(i)} className="text-xs text-[#1bb0ce] hover:underline">+ Add feature</button></div>
    </div>
  ))}</div>;
}
function TwoColSectionEditor({ v, set }) {
  return <div className="space-y-3">
    <Field label="Heading" value={v.heading} onChange={val=>set({...v,heading:val})} />
    <Field label="Description" value={v.description} onChange={val=>set({...v,description:val})} multiline />
    <div><label className="block text-xs font-medium text-gray-600 mb-1">Benefits / Features</label>
      <div className="space-y-1.5">{(v.benefits||[]).map((b,i)=>(
        <div key={i} className="flex gap-2">
          <input value={b} onChange={e=>{const n=[...v.benefits];n[i]=e.target.value;set({...v,benefits:n});}} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
          <button onClick={()=>set({...v,benefits:v.benefits.filter((_,j)=>j!==i)})} className="text-red-400 px-1">✕</button>
        </div>
      ))}<button onClick={()=>set({...v,benefits:[...(v.benefits||[]),'New benefit']})} className="text-xs text-[#1bb0ce] hover:underline mt-1 block">+ Add benefit</button></div>
    </div>
  </div>;
}
function HowStepsEditor({ v, set }) {
  const upd = (i, k, val) => { const n = [...v]; n[i] = { ...n[i], [k]: val }; set(n); };
  return (
    <div className="space-y-3">
      {v.map((step, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
          <label className="text-xs font-medium text-gray-500">Step {step.number}</label>
          <input value={step.title} onChange={e => upd(i, 'title', e.target.value)} placeholder="Title" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
          <textarea rows={2} value={step.description} onChange={e => upd(i, 'description', e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 resize-none" />
        </div>
      ))}
    </div>
  );
}
function ProcessStepsEditor({ v, set }) {
  const upd=(i,k,val)=>{ const n=[...v]; n[i]={...n[i],[k]:val}; set(n); };
  return <div className="grid sm:grid-cols-2 gap-3">{v.map((step,i)=>(
    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
      <label className="text-xs font-medium text-gray-500">Step {i+1}</label>
      <input value={step.title} onChange={e=>upd(i,'title',e.target.value)} placeholder="Title" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
      <input value={step.description} onChange={e=>upd(i,'description',e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
    </div>
  ))}</div>;
}
function FaqsEditor({ v, set }) {
  const upd=(i,k,val)=>{ const n=[...v]; n[i]={...n[i],[k]:val}; set(n); };
  return <div className="space-y-3">
    {v.map((faq,i)=>(
      <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between"><label className="text-xs font-medium text-gray-500">FAQ {i+1}</label>
          <button onClick={()=>set(v.filter((_,j)=>j!==i))} className="text-red-400 text-xs hover:text-red-600">Remove</button></div>
        <input value={faq.question} onChange={e=>upd(i,'question',e.target.value)} placeholder="Question" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
        <textarea rows={2} value={faq.answer} onChange={e=>upd(i,'answer',e.target.value)} placeholder="Answer" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 resize-none"/>
      </div>
    ))}
    <button onClick={()=>set([...v,{question:'New question?',answer:'Answer here.'}])} className="text-sm text-[#1bb0ce] hover:underline">+ Add FAQ</button>
  </div>;
}
function PageCtaEditor({ v, set }) {
  return <div className="space-y-3">
    <Field label="Title" value={v.title} onChange={val=>set({...v,title:val})} />
    <Field label="Subtitle" value={v.subtitle} onChange={val=>set({...v,subtitle:val})} multiline />
    {v.button1 !== undefined && <Field label="Button 1 Text" value={v.button1} onChange={val=>set({...v,button1:val})} />}
    {v.button2 !== undefined && <Field label="Button 2 Text" value={v.button2} onChange={val=>set({...v,button2:val})} />}
  </div>;
}
function MissionVisionEditor({ v, set }) {
  return <div className="space-y-3">
    <Field label="Mission Text" value={v.missionText} onChange={val=>set({...v,missionText:val})} multiline />
    <Field label="Vision Text"  value={v.visionText}  onChange={val=>set({...v,visionText:val})}  multiline />
  </div>;
}
function ValuesEditor({ v, set }) {
  const upd=(i,k,val)=>{ const n=[...v]; n[i]={...n[i],[k]:val}; set(n); };
  return <div className="grid sm:grid-cols-2 gap-3">{v.map((item,i)=>(
    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
      <label className="text-xs font-medium text-gray-500">Value {i+1}</label>
      <input value={item.title} onChange={e=>upd(i,'title',e.target.value)} placeholder="Title" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
      <input value={item.description} onChange={e=>upd(i,'description',e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
    </div>
  ))}</div>;
}
function TeamEditor({ v, set }) {
  const upd=(i,k,val)=>{ const n=[...v]; n[i]={...n[i],[k]:val}; set(n); };
  return <div className="space-y-2">
    {v.map((m,i)=>(
      <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
        <input value={m.name}     onChange={e=>upd(i,'name',e.target.value)}     placeholder="Name"    className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
        <input value={m.role}     onChange={e=>upd(i,'role',e.target.value)}     placeholder="Role"    className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
        <input value={m.initials} onChange={e=>upd(i,'initials',e.target.value)} placeholder="AB" maxLength={3} className="w-14 border border-gray-200 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
        <button onClick={()=>set(v.filter((_,j)=>j!==i))} className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-400"/></button>
      </div>
    ))}
    <button onClick={()=>set([...v,{name:'New Member',role:'Role',initials:'NM'}])} className="text-sm text-[#1bb0ce] hover:underline">+ Add Member</button>
  </div>;
}

function ShopTabsEditor({ v, set }) {
  const upd = (i, k, val) => { const n = [...v]; n[i] = { ...n[i], [k]: val }; set(n); };
  return (
    <div className="space-y-3">
      {v.map((tab, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase">Tab {i + 1}</label>
            <button onClick={() => set(v.filter((_, j) => j !== i))} className="text-red-400 text-xs hover:text-red-600">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Label</label>
              <input value={tab.label} onChange={e => upd(i, 'label', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category Key</label>
              <input value={tab.key} onChange={e => upd(i, 'key', e.target.value)} placeholder="e.g. mobile" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Icon</label>
            <select value={tab.icon} onChange={e => upd(i, 'icon', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40 bg-white">
              <option value="PhoneCall">Phone Call</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Monitor">Monitor / Desk</option>
            </select>
          </div>
        </div>
      ))}
      <button onClick={() => set([...v, { key: 'new-tab', label: 'New Tab', icon: 'PhoneCall' }])} className="text-sm text-[#1bb0ce] hover:underline">+ Add Tab</button>
      <p className="text-xs text-gray-400 mt-1">Tip: use key <code className="bg-gray-100 px-1 rounded">all</code> to show all products. Other keys match the product category field.</p>
    </div>
  );
}

function renderEditor(type, v, set) {
  if (!v) return null;
  switch (type) {
    case 'hero':        return <HeroEditor v={v} set={set} />;
    case 'simple_hero': return <SimpleHeroEditor v={v} set={set} />;
    case 'cta':         return <CtaEditor v={v} set={set} />;
    case 'stats':       return <StatsEditor v={v} set={set} />;
    case 'features':    return <FeaturesEditor v={v} set={set} />;
    case 'plan':        return <PlanEditor v={v} set={set} />;
    case 'contact':         return <ContactEditor v={v} set={set} />;
    case 'story':           return <StoryEditor v={v} set={set} />;
    case 'service_cards':   return <ServiceCardsEditor v={v} set={set} />;
    case 'two_col_section': return <TwoColSectionEditor v={v} set={set} />;
    case 'how_steps':        return <HowStepsEditor v={v} set={set} />;
    case 'process_steps':   return <ProcessStepsEditor v={v} set={set} />;
    case 'faqs':            return <FaqsEditor v={v} set={set} />;
    case 'page_cta':        return <PageCtaEditor v={v} set={set} />;
    case 'mission_vision':  return <MissionVisionEditor v={v} set={set} />;
    case 'values':          return <ValuesEditor v={v} set={set} />;
    case 'team':            return <TeamEditor v={v} set={set} />;
    case 'shop_tabs':       return <ShopTabsEditor v={v} set={set} />;
    default: return null;
  }
}

// ── Section panel ────────────────────────────────────────────
function SectionPanel({ section }) {
  const { addToast } = useApp();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const load = useCallback(async()=>{ setLoading(true); const c=await fetchContent(section.key); setValue(c); setLoading(false); setDirty(false); },[section.key]);
  useEffect(()=>{ if(open&&value===null) load(); },[open]);
  const handleSave=async()=>{ setSaving(true); try{ await saveContent(section.key,value); addToast(`"${section.label}" saved!`,'success'); setDirty(false); } catch{ addToast('Save failed.','error'); } finally{ setSaving(false); } };
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <Globe size={15} className="text-[#1bb0ce]" />
          <span className="font-medium text-[#0a1628] text-sm">{section.label}</span>
          {dirty && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">Unsaved</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
          {loading ? <div className="flex justify-center py-6"><Spinner /></div> : (
            <>
              {renderEditor(section.type, value, v=>{ setValue(v); setDirty(true); })}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button onClick={handleSave} loading={saving} size="sm"><Save size={13} className="mr-1"/>Save</Button>
                <Button variant="ghost" onClick={()=>{ setValue(DEFAULTS[section.key]); setDirty(true); }} size="sm"><RotateCcw size={13} className="mr-1"/>Reset</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Home Page Layout Manager ─────────────────────────────────
const SECTION_TEMPLATES = [
  { type: 'custom_text',   label: 'Text Block',     desc: 'A section with a title and body text.' },
  { type: 'custom_cta',    label: 'CTA Banner',     desc: 'A gradient call-to-action with a button.' },
  { type: 'custom_banner', label: 'Custom Banner',  desc: 'A coloured banner with title and optional button.' },
];

const DEFAULT_CUSTOM_CONTENT = {
  custom_text:   { title: 'New Section Title', body: 'Add your content here.' },
  custom_cta:    { title: 'Call to Action', subtitle: 'Subtitle text here.', button: 'Click Here', link: '/signup' },
  custom_banner: { title: 'Banner Title', subtitle: 'Banner subtitle', bg: '#f0f9ff', textColor: '#0a1628', button: '', link: '/' },
};

function HomeLayoutManager() {
  const { addToast } = useApp();
  const [layout, setLayout] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [newType, setNewType] = useState('custom_text');
  const [newLabel, setNewLabel] = useState('');
  const [editingCustom, setEditingCustom] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await contentApi.get('home_layout');
        setLayout(data?.length ? data : DEFAULT_LAYOUT);
      } catch { setLayout(DEFAULT_LAYOUT); }
    }
    load();
  }, []);

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= layout.length) return;
    const next = [...layout];
    [next[i], next[j]] = [next[j], next[i]];
    setLayout(next); setDirty(true);
  };

  const toggle = (i) => {
    const next = [...layout];
    next[i] = { ...next[i], visible: !next[i].visible };
    setLayout(next); setDirty(true);
  };

  const remove = (i) => {
    setLayout(prev => prev.filter((_,j)=>j!==i));
    setDirty(true);
  };

  const addSection = () => {
    const id = `custom_${Date.now()}`;
    const tmpl = SECTION_TEMPLATES.find(t=>t.type===newType);
    const section = {
      key: id,
      label: newLabel.trim() || tmpl.label,
      visible: true,
      type: newType,
      content: { ...DEFAULT_CUSTOM_CONTENT[newType] },
    };
    setLayout(prev=>[...prev, section]);
    setDirty(true);
    setAddModal(false);
    setNewLabel('');
    setNewType('custom_text');
  };

  const updateCustomContent = (i, content) => {
    const next = [...layout];
    next[i] = { ...next[i], content };
    setLayout(next); setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await saveHomeLayout(layout); addToast('Home page layout saved!','success'); setDirty(false); }
    catch { addToast('Save failed.','error'); }
    finally { setSaving(false); }
  };

  if (!layout) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-3">
      {layout.map((section, i) => (
        <div key={section.key} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${section.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
          <div className="flex flex-col gap-0.5">
            <button disabled={i===0} onClick={()=>move(i,-1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Move up"><ArrowUp size={14} className="text-gray-500"/></button>
            <button disabled={i===layout.length-1} onClick={()=>move(i,1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Move down"><ArrowDown size={14} className="text-gray-500"/></button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0a1628] truncate">{section.label}</p>
            <p className="text-xs text-gray-400">{section.type === 'builtin' ? 'Built-in section' : section.type.replace('_',' ')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {section.type !== 'builtin' && (
              <button onClick={()=>setEditingCustom({ index: i, section })} className="text-xs text-[#1bb0ce] hover:underline font-medium px-2 py-1 rounded hover:bg-blue-50">Edit</button>
            )}
            <button onClick={()=>toggle(i)} title={section.visible?'Hide':'Show'} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
              {section.visible ? <Eye size={15} className="text-green-500"/> : <EyeOff size={15} className="text-gray-400"/>}
            </button>
            {section.type !== 'builtin' && (
              <button onClick={()=>remove(i)} title="Remove" className="p-1.5 rounded hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-red-400"/></button>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button onClick={handleSave} loading={saving} disabled={!dirty} size="sm">
          <Save size={13} className="mr-1"/>Save Layout
        </Button>
        <Button variant="outline" size="sm" onClick={()=>setAddModal(true)}>
          <Plus size={13} className="mr-1"/>Add Section
        </Button>
        <Button variant="ghost" size="sm" onClick={()=>{ setLayout(DEFAULT_LAYOUT); setDirty(true); }}>
          <RotateCcw size={13} className="mr-1"/>Reset to Default
        </Button>
        {dirty && <Badge variant="warning" size="sm">Unsaved changes</Badge>}
      </div>

      <Modal isOpen={addModal} onClose={()=>setAddModal(false)} title="Add Section"
        footer={<><Button variant="ghost" onClick={()=>setAddModal(false)}>Cancel</Button><Button onClick={addSection}>Add Section</Button></>}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section Type</label>
            <div className="space-y-2">
              {SECTION_TEMPLATES.map(t=>(
                <label key={t.type} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${newType===t.type?'border-[#1bb0ce] bg-[#1bb0ce]/5':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="sectionType" value={t.type} checked={newType===t.type} onChange={()=>setNewType(t.type)} className="mt-0.5 accent-[#1bb0ce]"/>
                  <div><p className="font-medium text-sm text-[#0a1628]">{t.label}</p><p className="text-xs text-gray-500">{t.desc}</p></div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Name (optional)</label>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder={SECTION_TEMPLATES.find(t=>t.type===newType)?.label}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingCustom} onClose={()=>setEditingCustom(null)} title={`Edit: ${editingCustom?.section?.label}`} size="lg"
        footer={<><Button variant="ghost" onClick={()=>setEditingCustom(null)}>Close</Button></>}>
        {editingCustom && (
          <div className="space-y-3">
            <CustomSectionEditor
              section={editingCustom.section}
              onChange={content=>{ updateCustomContent(editingCustom.index, content); setEditingCustom(prev=>({...prev, section:{...prev.section, content}})); }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function CustomSectionEditor({ section, onChange }) {
  const { type, content = {} } = section;
  const f = (k, v) => onChange({ ...content, [k]: v });

  if (type === 'custom_text') {
    return (
      <div className="space-y-3">
        <Field label="Title" value={content.title} onChange={v=>f('title',v)} />
        <Field label="Body Text" value={content.body} onChange={v=>f('body',v)} multiline />
      </div>
    );
  }
  if (type === 'custom_cta') {
    return (
      <div className="space-y-3">
        <Field label="Heading" value={content.title} onChange={v=>f('title',v)} />
        <Field label="Subtitle" value={content.subtitle} onChange={v=>f('subtitle',v)} />
        <Field label="Button Text" value={content.button} onChange={v=>f('button',v)} />
        <Field label="Button Link (e.g. /signup)" value={content.link} onChange={v=>f('link',v)} />
      </div>
    );
  }
  if (type === 'custom_banner') {
    return (
      <div className="space-y-3">
        <Field label="Title" value={content.title} onChange={v=>f('title',v)} />
        <Field label="Subtitle" value={content.subtitle} onChange={v=>f('subtitle',v)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={content.bg||'#f0f9ff'} onChange={e=>f('bg',e.target.value)} className="w-9 h-9 rounded border border-gray-200 cursor-pointer p-0.5"/>
              <input value={content.bg||'#f0f9ff'} onChange={e=>f('bg',e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={content.textColor||'#0a1628'} onChange={e=>f('textColor',e.target.value)} className="w-9 h-9 rounded border border-gray-200 cursor-pointer p-0.5"/>
              <input value={content.textColor||'#0a1628'} onChange={e=>f('textColor',e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
            </div>
          </div>
        </div>
        <Field label="Button Text (leave blank to hide)" value={content.button} onChange={v=>f('button',v)} />
        <Field label="Button Link" value={content.link} onChange={v=>f('link',v)} />
      </div>
    );
  }
  return null;
}

// ── Custom Pages Manager ─────────────────────────────────────
function PagesManager() {
  const { addToast } = useApp();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newPage, setNewPage] = useState({ title:'', slug:'', subtitle:'', body:'' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await contentApi.listByPrefix('custom_page_');
      setPages((data||[]).map(r=>({ slug: r.section_key.replace('custom_page_',''), ...r.content })));
    } catch {}
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  const handleAdd = async () => {
    if (!newPage.title.trim()) { addToast('Title is required','error'); return; }
    const slug = newPage.slug.trim() || slugify(newPage.title);
    setSaving(true);
    try {
      await saveContent(`custom_page_${slug}`, { title: newPage.title, subtitle: newPage.subtitle, body: newPage.body, blocks: [] });
      addToast('Page created!','success');
      setAddModal(false);
      setNewPage({ title:'', slug:'', subtitle:'', body:'' });
      load();
    } catch { addToast('Failed to create page.','error'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await saveContent(`custom_page_${editModal.slug}`, { title: editModal.title, subtitle: editModal.subtitle, body: editModal.body, blocks: editModal.blocks||[] });
      addToast('Page saved!','success');
      setEditModal(null);
      load();
    } catch { addToast('Save failed.','error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('Delete this page?')) return;
    await contentApi.remove(`custom_page_${slug}`);
    addToast('Page deleted.','success');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{pages.length} custom page{pages.length!==1?'s':''}</p>
        <Button size="sm" onClick={()=>setAddModal(true)}><Plus size={13} className="mr-1"/>New Page</Button>
      </div>

      {loading ? <div className="flex justify-center py-8"><Spinner/></div> : pages.length===0 ? (
        <div className="text-center py-10 text-gray-400">
          <FilePlus size={32} className="mx-auto mb-3 opacity-40"/>
          <p className="text-sm">No custom pages yet. Click <strong>New Page</strong> to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map(page=>(
            <div key={page.slug} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0a1628]">{page.title}</p>
                <a href={`/p/${page.slug}`} target="_blank" rel="noreferrer" className="text-xs text-[#1bb0ce] hover:underline">/p/{page.slug}</a>
              </div>
              <button onClick={()=>setEditModal({...page})} className="text-xs text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50 font-medium">Edit</button>
              <button onClick={()=>handleDelete(page.slug)} className="p-1.5 rounded hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-red-400"/></button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={addModal} onClose={()=>setAddModal(false)} title="Create New Page"
        footer={<><Button variant="ghost" onClick={()=>setAddModal(false)}>Cancel</Button><Button onClick={handleAdd} loading={saving}>Create Page</Button></>}>
        <div className="space-y-3">
          <Field label="Page Title *" value={newPage.title} onChange={v=>{setNewPage(p=>({...p,title:v,slug:p.slug||slugify(v)}));}} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL Slug (auto-generated from title)</label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 shrink-0">/p/</span>
              <input value={newPage.slug} onChange={e=>setNewPage(p=>({...p,slug:slugify(e.target.value)}))}
                placeholder="my-page" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40"/>
            </div>
          </div>
          <Field label="Subtitle (optional)" value={newPage.subtitle} onChange={v=>setNewPage(p=>({...p,subtitle:v}))} />
          <Field label="Body Content" value={newPage.body} onChange={v=>setNewPage(p=>({...p,body:v}))} multiline />
        </div>
      </Modal>

      <Modal isOpen={!!editModal} onClose={()=>setEditModal(null)} title={`Edit: ${editModal?.title}`} size="lg"
        footer={<><Button variant="ghost" onClick={()=>setEditModal(null)}>Cancel</Button><Button onClick={handleUpdate} loading={saving}>Save Page</Button></>}>
        {editModal && (
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">URL: <a href={`/p/${editModal.slug}`} target="_blank" rel="noreferrer" className="text-[#1bb0ce] hover:underline">/p/{editModal.slug}</a></label></div>
            <Field label="Title" value={editModal.title} onChange={v=>setEditModal(p=>({...p,title:v}))} />
            <Field label="Subtitle" value={editModal.subtitle} onChange={v=>setEditModal(p=>({...p,subtitle:v}))} />
            <Field label="Body Content" value={editModal.body} onChange={v=>setEditModal(p=>({...p,body:v}))} multiline />
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Branding Manager ─────────────────────────────────────────
function BrandingManager() {
  const { reload } = useSiteSettings();
  const { addToast } = useApp();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await contentApi.get('site_brand');
        setForm(data ?? DEFAULT_BRAND);
      } catch { setForm(DEFAULT_BRAND); }
    }
    load();
  }, []);

  const set = (update) => { setForm(f => ({ ...f, ...update })); setDirty(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveKey('site_brand', form);
      await reload();
      addToast('Branding saved!', 'success');
      setDirty(false);
    } catch { addToast('Save failed.', 'error'); }
    finally { setSaving(false); }
  };

  if (!form) return <div className="flex justify-center py-8"><Spinner /></div>;

  const nameParts = form.siteName.split(' ');
  const nameFirst = nameParts[0] || 'Oasis';
  const nameRest  = nameParts.slice(1).join(' ');

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Site Name" value={form.siteName} onChange={v => set({ siteName: v })} />
        <Field label="Tagline" value={form.tagline} onChange={v => set({ tagline: v })} />
      </div>

      {/* Logo type */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Logo Type</label>
        <div className="flex gap-3">
          {[['icon', 'Icon + Text'], ['image', 'Image / URL']].map(([val, lbl]) => (
            <label key={val} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${form.logoType === val ? 'border-[#1bb0ce] bg-[#1bb0ce]/5' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="logoType" value={val} checked={form.logoType === val} onChange={() => set({ logoType: val })} className="accent-[#1bb0ce]" />
              <span className="text-sm font-medium">{lbl}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Icon choice */}
      {form.logoType === 'icon' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Logo Icon</label>
          <div className="flex gap-3">
            {[['wifi', 'Wifi'], ['phone', 'Phone']].map(([val, lbl]) => (
              <label key={val} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${form.logoIcon === val ? 'border-[#1bb0ce] bg-[#1bb0ce]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="logoIcon" value={val} checked={form.logoIcon === val} onChange={() => set({ logoIcon: val })} className="accent-[#1bb0ce]" />
                {val === 'wifi' ? <Wifi size={16} className="text-[#1bb0ce]" /> : <Phone size={16} className="text-[#1bb0ce]" />}
                <span className="text-sm font-medium">{lbl}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Image URL */}
      {form.logoType === 'image' && (
        <div className="space-y-2">
          <Field label="Logo Image URL (PNG, SVG, etc.)" value={form.logoUrl} onChange={v => set({ logoUrl: v })} />
          <p className="text-xs text-gray-400">Host the image on a CDN or paste a direct link. It will be scaled to 32px tall.</p>
        </div>
      )}

      {/* Favicon */}
      <div className="space-y-2">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Favicon URL (browser tab icon)" value={form.faviconUrl || ''} onChange={v => set({ faviconUrl: v })} />
          </div>
          {(form.faviconUrl || form.logoUrl) && (
            <img
              src={form.faviconUrl || form.logoUrl}
              alt="favicon preview"
              className="w-8 h-8 object-contain border border-gray-200 rounded-lg p-1 bg-white"
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
        <p className="text-xs text-gray-400">
          Square image works best (32×32 or 64×64 PNG/SVG). Leave empty to use the logo image above; if both are empty the default icon is used.
        </p>
      </div>

      {/* Live preview */}
      <div className="p-4 bg-[#0a1628] rounded-xl">
        <p className="text-xs text-gray-400 mb-3">Navbar preview:</p>
        <div className="flex items-center gap-2">
          {form.logoType === 'image' && form.logoUrl ? (
            <img src={form.logoUrl} alt={form.siteName} className="h-8 w-auto object-contain" onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <>
              {form.logoIcon === 'phone'
                ? <Phone size={24} className="text-[#1bb0ce]" />
                : <Wifi size={24} className="text-[#1bb0ce]" />
              }
              <span className="text-[#1bb0ce] font-bold text-lg leading-none">
                {nameFirst}<span className="text-white">{nameRest ? ` ${nameRest}` : ''}</span>
              </span>
            </>
          )}
        </div>
        {form.tagline && <p className="text-xs text-gray-400 mt-2 italic">{form.tagline}</p>}
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <Button onClick={handleSave} loading={saving} disabled={!dirty} size="sm"><Save size={13} className="mr-1" />Save Branding</Button>
        <Button variant="ghost" size="sm" onClick={() => { setForm(DEFAULT_BRAND); setDirty(true); }}><RotateCcw size={13} className="mr-1" />Reset</Button>
        {dirty && <Badge variant="warning" size="sm">Unsaved changes</Badge>}
      </div>
    </div>
  );
}

// ── Navigation Manager ───────────────────────────────────────
function NavigationManager() {
  const { reload } = useSiteSettings();
  const { addToast } = useApp();
  const [links, setLinks] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await contentApi.get('site_nav');
        setLinks(data ?? DEFAULT_NAV);
      } catch { setLinks(DEFAULT_NAV); }
    }
    load();
  }, []);

  const update = (next) => { setLinks(next); setDirty(true); };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveKey('site_nav', links);
      await reload();
      addToast('Navigation saved!', 'success');
      setDirty(false);
    } catch { addToast('Save failed.', 'error'); }
    finally { setSaving(false); }
  };

  if (!links) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Use any route (e.g. <code className="bg-gray-100 px-1 rounded">/about</code>) or external URL (e.g. <code className="bg-gray-100 px-1 rounded">https://…</code>).</p>

      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <button disabled={i === 0} onClick={() => move(i, -1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"><ArrowUp size={13} className="text-gray-500" /></button>
            <button disabled={i === links.length - 1} onClick={() => move(i, 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"><ArrowDown size={13} className="text-gray-500" /></button>
          </div>
          <input value={link.label}
            onChange={e => update(links.map((l, j) => j === i ? { ...l, label: e.target.value } : l))}
            placeholder="Label (e.g. Home)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
          <input value={link.to}
            onChange={e => update(links.map((l, j) => j === i ? { ...l, to: e.target.value } : l))}
            placeholder="/path"
            className="w-36 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
          <button onClick={() => update(links.filter((_, j) => j !== i))} className="p-1.5 rounded hover:bg-red-50 transition-colors">
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      ))}

      <button onClick={() => update([...links, { label: 'New Link', to: '/' }])}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-[#1bb0ce] hover:text-[#1bb0ce] transition-colors">
        <Plus size={15} /> Add Link
      </button>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <Button onClick={handleSave} loading={saving} disabled={!dirty} size="sm"><Save size={13} className="mr-1" />Save Navigation</Button>
        <Button variant="ghost" size="sm" onClick={() => { setLinks(DEFAULT_NAV); setDirty(true); }}><RotateCcw size={13} className="mr-1" />Reset</Button>
        {dirty && <Badge variant="warning" size="sm">Unsaved changes</Badge>}
      </div>
    </div>
  );
}

// ── Footer Manager ───────────────────────────────────────────
function FooterManager() {
  const { reload } = useSiteSettings();
  const { addToast } = useApp();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeSection, setActiveSection] = useState('contact');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await contentApi.get('site_footer');
        setForm(data ?? DEFAULT_FOOTER);
      } catch { setForm(DEFAULT_FOOTER); }
    }
    load();
  }, []);

  const set = (update) => { setForm(f => ({ ...f, ...update })); setDirty(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveKey('site_footer', form);
      await reload();
      addToast('Footer saved!', 'success');
      setDirty(false);
    } catch { addToast('Save failed.', 'error'); }
    finally { setSaving(false); }
  };

  if (!form) return <div className="flex justify-center py-8"><Spinner /></div>;

  const updSocial    = (i, k, v) => { const n = [...form.socials]; n[i] = { ...n[i], [k]: v }; set({ socials: n }); };
  const updColTitle  = (ci, v) => { const n = [...form.columns]; n[ci] = { ...n[ci], title: v }; set({ columns: n }); };
  const updColLink   = (ci, li, k, v) => { const n = [...form.columns]; const ln = [...n[ci].links]; ln[li] = { ...ln[li], [k]: v }; n[ci] = { ...n[ci], links: ln }; set({ columns: n }); };
  const addColLink   = (ci) => { const n = [...form.columns]; n[ci] = { ...n[ci], links: [...n[ci].links, { label: 'New Link', to: '/' }] }; set({ columns: n }); };
  const removeColLink= (ci, li) => { const n = [...form.columns]; n[ci] = { ...n[ci], links: n[ci].links.filter((_, j) => j !== li) }; set({ columns: n }); };
  const addCol       = () => set({ columns: [...form.columns, { title: 'New Column', links: [] }] });
  const removeCol    = (ci) => set({ columns: form.columns.filter((_, j) => j !== ci) });

  const subTabs = [
    ['contact',     'Contact Info'],
    ['description', 'Description & Socials'],
    ['columns',     'Link Columns'],
    ['payments',    'Copyright & Payments'],
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {subTabs.map(([key, label]) => (
          <button key={key} onClick={() => setActiveSection(key)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeSection === key ? 'border-[#1bb0ce] text-[#1bb0ce]' : 'border-transparent text-gray-500 hover:text-[#0a1628]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Contact */}
      {activeSection === 'contact' && (
        <div className="space-y-3">
          <Field label="Phone" value={form.contact.phone} onChange={v => set({ contact: { ...form.contact, phone: v } })} />
          <Field label="Email" value={form.contact.email} onChange={v => set({ contact: { ...form.contact, email: v } })} />
          <Field label="Address (line breaks supported)" value={form.contact.address} onChange={v => set({ contact: { ...form.contact, address: v } })} multiline />
        </div>
      )}

      {/* Description & Socials */}
      {activeSection === 'description' && (
        <div className="space-y-4">
          <Field label="Footer Description" value={form.description} onChange={v => set({ description: v })} multiline />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Social Links</label>
              <button onClick={() => set({ socials: [...form.socials, { letter: '?', href: '#', label: 'New Social' }] })}
                className="text-xs text-[#1bb0ce] hover:underline font-medium">+ Add</button>
            </div>
            <div className="space-y-2">
              {form.socials.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={s.letter} onChange={e => updSocial(i, 'letter', e.target.value)}
                    placeholder="f" title="Icon letter / symbol"
                    className="w-12 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
                  <input value={s.label} onChange={e => updSocial(i, 'label', e.target.value)}
                    placeholder="Facebook"
                    className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
                  <input value={s.href} onChange={e => updSocial(i, 'href', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
                  <button onClick={() => set({ socials: form.socials.filter((_, j) => j !== i) })} className="p-1.5 rounded hover:bg-red-50 transition-colors">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">The "letter" is displayed as the icon (e.g. "f" for Facebook, "in" for LinkedIn, "▶" for YouTube).</p>
          </div>
        </div>
      )}

      {/* Link Columns */}
      {activeSection === 'columns' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">The footer shows up to 2 columns by default. Add more columns if needed — they will wrap on small screens.</p>
          {form.columns.map((col, ci) => (
            <div key={ci} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <input value={col.title} onChange={e => updColTitle(ci, e.target.value)}
                  placeholder="Column title"
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
                <button onClick={() => removeCol(ci)} className="p-1 rounded hover:bg-red-50 transition-colors">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
              <div className="px-4 py-3 space-y-2">
                {col.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2">
                    <input value={link.label} onChange={e => updColLink(ci, li, 'label', e.target.value)}
                      placeholder="Link label"
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
                    <input value={link.to} onChange={e => updColLink(ci, li, 'to', e.target.value)}
                      placeholder="/path"
                      className="w-36 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1bb0ce]/40" />
                    <button onClick={() => removeColLink(ci, li)} className="p-1 rounded hover:bg-red-50 transition-colors">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addColLink(ci)} className="text-xs text-[#1bb0ce] hover:underline font-medium">+ Add Link</button>
              </div>
            </div>
          ))}
          <button onClick={addCol}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-[#1bb0ce] hover:text-[#1bb0ce] transition-colors">
            <Plus size={15} /> Add Column
          </button>
        </div>
      )}

      {/* Copyright & Payments */}
      {activeSection === 'payments' && (
        <div className="space-y-4">
          <Field label="Copyright Text (current year is prepended automatically)" value={form.copyright} onChange={v => set({ copyright: v })} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Payment Methods</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.payments.map((p, i) => (
                <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                  <input value={p}
                    onChange={e => { const n = [...form.payments]; n[i] = e.target.value; set({ payments: n }); }}
                    className="bg-transparent text-sm font-medium w-16 focus:outline-none" />
                  <button onClick={() => set({ payments: form.payments.filter((_, j) => j !== i) })}
                    className="text-red-400 hover:text-red-600 leading-none text-xs font-bold">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => set({ payments: [...form.payments, 'New'] })}
              className="text-xs text-[#1bb0ce] hover:underline font-medium">+ Add Payment Method</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <Button onClick={handleSave} loading={saving} disabled={!dirty} size="sm"><Save size={13} className="mr-1" />Save Footer</Button>
        <Button variant="ghost" size="sm" onClick={() => { setForm(DEFAULT_FOOTER); setDirty(true); }}><RotateCcw size={13} className="mr-1" />Reset</Button>
        {dirty && <Badge variant="warning" size="sm">Unsaved changes</Badge>}
      </div>
    </div>
  );
}

// ── Page Group (existing content sections) ───────────────────
function PageGroup({ group }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <h3 className="font-semibold text-[#0a1628]">{group.page}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{group.sections.length} section{group.sections.length!==1?'s':''}</span>
          {open ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
        </div>
      </button>
      {open && <div className="border-t border-gray-100 px-5 py-4 space-y-3">{group.sections.map(s=><SectionPanel key={s.key} section={s}/>)}</div>}
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function Content() {
  const [activeTab, setActiveTab] = useState('layout');

  const TABS = [
    { key: 'layout',   label: 'Home Layout',   icon: Layout },
    { key: 'branding', label: 'Branding',       icon: Palette },
    { key: 'nav',      label: 'Navigation',     icon: Menu },
    { key: 'footer',   label: 'Footer',         icon: AlignLeft },
    { key: 'content',  label: 'Edit Text',      icon: Globe },
    { key: 'pages',    label: 'Custom Pages',   icon: FilePlus },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0a1628]">Page Content Editor</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage branding, navigation, footer, home layout, and all page text.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={['px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap', activeTab === key ? 'border-[#1bb0ce] text-[#1bb0ce]' : 'border-transparent text-gray-500 hover:text-[#0a1628]'].join(' ')}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Home Layout tab */}
      {activeTab === 'layout' && (
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0a1628] mb-1">Home Page Sections</h3>
            <p className="text-sm text-gray-500">Reorder sections, toggle visibility, or add new custom sections.</p>
          </div>
          <HomeLayoutManager />
        </Card>
      )}

      {/* Branding tab */}
      {activeTab === 'branding' && (
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0a1628] mb-1">Site Branding</h3>
            <p className="text-sm text-gray-500">Set your logo, site name, and tagline. Changes appear instantly in the navbar and footer.</p>
          </div>
          <BrandingManager />
        </Card>
      )}

      {/* Navigation tab */}
      {activeTab === 'nav' && (
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0a1628] mb-1">Navigation Menu</h3>
            <p className="text-sm text-gray-500">Add, remove, and reorder links in the top navbar (desktop &amp; mobile).</p>
          </div>
          <NavigationManager />
        </Card>
      )}

      {/* Footer tab */}
      {activeTab === 'footer' && (
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0a1628] mb-1">Footer Content</h3>
            <p className="text-sm text-gray-500">Edit contact info, social links, link columns, copyright, and payment badges.</p>
          </div>
          <FooterManager />
        </Card>
      )}

      {/* Edit Text tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <strong>Note:</strong> Changes require the <code className="bg-amber-100 px-1 rounded">page_content</code> table in your Supabase database.
          </div>
          {CONTENT_SECTIONS.map(g => <PageGroup key={g.page} group={g} />)}
        </div>
      )}

      {/* Custom Pages tab */}
      {activeTab === 'pages' && (
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-[#0a1628] mb-1">Custom Pages</h3>
            <p className="text-sm text-gray-500">Create standalone pages accessible at <code className="bg-gray-100 px-1 rounded">/p/your-slug</code>. Great for Terms, FAQ, Announcements, etc.</p>
          </div>
          <PagesManager />
        </Card>
      )}
    </div>
  );
}
