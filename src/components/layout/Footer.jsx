import { Link } from 'react-router-dom';
import { Wifi, Phone, Mail, MapPin } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

function FooterLogo({ brand }) {
  if (brand.logoType === 'image' && brand.logoUrl) {
    return (
      <img
        src={brand.logoUrl}
        alt={brand.siteName}
        className="h-8 w-auto object-contain"
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }
  const Icon = brand.logoIcon === 'phone' ? Phone : Wifi;
  const parts = brand.siteName.split(' ');
  const first = parts[0] || 'Oasis';
  const rest  = parts.slice(1).join(' ');
  return (
    <>
      <Icon size={22} className="text-[#1bb0ce]" />
      <span className="text-[#1bb0ce] font-bold text-lg leading-none">
        {first}<span className="text-white">{rest ? ` ${rest}` : ''}</span>
      </span>
    </>
  );
}

const SocialIcon = ({ letter, href, label }) => (
  <a
    href={href}
    aria-label={label}
    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-[#1bb0ce] transition-colors duration-200 text-gray-300 hover:text-white font-bold text-sm"
  >
    {letter}
  </a>
);

export default function Footer() {
  const { brand, footer } = useSiteSettings();

  return (
    <footer className="bg-[#0a1628] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1: Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <FooterLogo brand={brand} />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              {footer.description}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {(footer.socials || []).map(({ letter, href, label }) => (
                <SocialIcon key={label} letter={letter} href={href} label={label} />
              ))}
            </div>
          </div>

          {/* Dynamic link columns */}
          {(footer.columns || []).map((col, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {(col.links || []).map(link => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-400 hover:text-[#1bb0ce] transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              {footer.contact?.phone && (
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <Phone size={15} className="text-[#1bb0ce] mt-0.5 flex-shrink-0" />
                  <a
                    href={`tel:${footer.contact.phone.replace(/\s|\(|\)|-/g, '')}`}
                    className="hover:text-[#1bb0ce] transition-colors duration-150"
                  >
                    {footer.contact.phone}
                  </a>
                </li>
              )}
              {footer.contact?.email && (
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <Mail size={15} className="text-[#1bb0ce] mt-0.5 flex-shrink-0" />
                  <a
                    href={`mailto:${footer.contact.email}`}
                    className="hover:text-[#1bb0ce] transition-colors duration-150 break-all"
                  >
                    {footer.contact.email}
                  </a>
                </li>
              )}
              {footer.contact?.address && (
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <MapPin size={15} className="text-[#1bb0ce] mt-0.5 flex-shrink-0" />
                  <span style={{ whiteSpace: 'pre-line' }}>{footer.contact.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {footer.copyright}
          </p>
          {(footer.payments || []).length > 0 && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>We accept:</span>
              {footer.payments.map(p => (
                <span key={p} className="px-2 py-0.5 bg-white/10 rounded text-gray-400 font-medium text-[11px]">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
