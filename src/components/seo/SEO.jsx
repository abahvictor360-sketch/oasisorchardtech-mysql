import { Helmet } from 'react-helmet-async';

const SITE_NAME  = 'Oasis Orchard Technologies';
const SITE_URL   = 'https://oasisorchardtech.com';
const LOGO_URL   = `${SITE_URL}/logo.png`;
const TWITTER    = '@OasisOrchardTech';

export default function SEO({
  title,
  description,
  canonical,
  image,
  type = 'website',
  schema,          // single schema object OR array
  noindex = false,
}) {
  const fullTitle   = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Crystal-Clear Calls. Unbeatable Price.`;
  const metaDesc    = description || 'Oasis Orchard Technologies — Your authorized VoIP reseller. Business-quality wireless phone service starting at $10/month across Canada.';
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;
  const ogImage     = image || LOGO_URL;

  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  return (
    <Helmet>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image"       content={ogImage} />
      <meta property="og:site_name"   content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content={TWITTER} />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image"       content={ogImage} />

      {/* JSON-LD structured data */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
