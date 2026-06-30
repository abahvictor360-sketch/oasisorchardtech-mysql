// JSON-LD schema builders for SEO / AEO
const SITE_URL = 'https://oasisorchardtech.com';
const LOGO_URL = `${SITE_URL}/logo.png`;

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Oasis Orchard Technologies',
  url: SITE_URL,
  logo: LOGO_URL,
  description: 'Authorized VoIP reseller providing wireless phone service for homes and businesses across Canada.',
  telephone: '+19025934442',
  email: 'support@oasisorchard.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1505 Barrington Street, Suite 200',
    addressLocality: 'Halifax',
    addressRegion: 'NS',
    postalCode: 'B3J 3K5',
    addressCountry: 'CA',
  },
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+19025934442',
    contactType: 'customer service',
    areaServed: 'CA',
    availableLanguage: 'English',
  },
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Oasis Orchard Technologies',
  url: SITE_URL,
  logo: LOGO_URL,
  image: LOGO_URL,
  telephone: '+19025934442',
  email: 'support@oasisorchard.com',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1505 Barrington Street, Suite 200',
    addressLocality: 'Halifax',
    addressRegion: 'NS',
    postalCode: 'B3J 3K5',
    addressCountry: 'CA',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 44.6476,
    longitude: -63.5726,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
    opens: '09:00',
    closes: '18:00',
  },
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Oasis Orchard Technologies',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export const homeFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is VoIP phone service?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VoIP (Voice over Internet Protocol) phone service lets you make and receive calls over the internet instead of a traditional phone line. It delivers the same call quality as landlines, often with more features and significantly lower costs — ideal for homes and businesses.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does wireless phone service cost at Oasis Orchard Technologies?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Plans start at $10/month for our Basic Connect plan. The Smart Connect plan is $20/month and Business Connect is $35/month. All plans include unlimited local calls, voicemail, and call display.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a technician to set up the phone?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No technician is needed. Our Grandstream wireless phones are plug-and-play. Simply connect the phone to your internet router and activate your plan online — you can be making calls in under 10 minutes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which areas does Oasis Orchard Technologies serve?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We ship phones and provide phone service across all of Canada, including Nova Scotia, Ontario, British Columbia, Quebec, Alberta, and all other provinces and territories.',
      },
    },
    {
      '@type': 'Question',
      name: 'What phones does Oasis Orchard Technologies sell?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We sell Grandstream wireless VoIP phones, including the GRWP810, GRWP816, GRWP822, and GRWP825. These are WiFi-enabled cordless phones with HD voice quality, suitable for both home and business use.',
      },
    },
  ],
};

export const homeHowToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Get Started with Oasis Orchard Wireless Phone Service',
  description: 'Set up your wireless VoIP phone service in three easy steps.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Choose Your Plan',
      text: 'Select from Basic Connect ($10/mo), Smart Connect ($20/mo), or Business Connect ($35/mo) depending on your needs and budget.',
      url: `${SITE_URL}/pricing`,
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Get Your Phone',
      text: 'Pick a Grandstream wireless phone from our catalog. We ship to all parts of Canada.',
      url: `${SITE_URL}/shop`,
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Start Calling',
      text: 'Plug in your phone, activate your plan, and enjoy crystal-clear calls from day one. No technician required.',
      url: `${SITE_URL}/shop`,
    },
  ],
};

export const pricingFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is included in the Basic Connect plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Basic Connect plan at $10/month includes unlimited local calls, voicemail, call display, and call waiting. It supports 1 phone line and is ideal for individuals and small home offices.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is included in the Smart Connect plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Smart Connect plan at $20/month includes everything in Basic plus 3-way calling, a mobile app, and SMS messaging. It supports up to 3 lines and suits small businesses.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is included in the Business Connect plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Business Connect plan at $35/month includes all Smart Connect features plus multi-device support, priority 24/7 support, a dedicated account manager, and advanced call routing. Ideal for growing teams.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are there any contracts or hidden fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No long-term contracts and no hidden fees. You pay a simple monthly rate. Cancel any time.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I keep my existing phone number?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Number porting is available. Contact our support team to transfer your existing number to Oasis Orchard Technologies.',
      },
    },
  ],
};

export const servicesFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What VoIP services does Oasis Orchard Technologies offer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We offer wireless VoIP phone plans (Basic, Smart, and Business Connect), Grandstream WiFi phones, mobile app calling, and 24/7 customer support. Our service is designed for both residential and business customers across Canada.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the service work during a power outage?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VoIP service requires an active internet connection. During a power outage, calls may be redirected to your mobile number via call forwarding, which is included in our Smart and Business Connect plans.',
      },
    },
    {
      '@type': 'Question',
      name: 'What internet speed do I need for clear VoIP calls?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A minimum of 1 Mbps upload and 1 Mbps download per line is sufficient for HD voice calls. A standard home broadband connection is more than adequate.',
      },
    },
  ],
};

export function productSchema(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDesc,
    sku: product.sku,
    image: `${SITE_URL}${product.image}`,
    brand: { '@type': 'Brand', name: 'Grandstream' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/shop/${product.id}`,
      priceCurrency: 'CAD',
      price: product.price.toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Oasis Orchard Technologies' },
    },
    aggregateRating: product.reviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews,
      bestRating: 5,
    } : undefined,
  };
}

export function productListSchema(products) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Grandstream Wireless VoIP Phones',
    description: 'Shop Grandstream WiFi phones from Oasis Orchard Technologies — authorized Canadian VoIP reseller.',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/shop/${p.id}`,
      name: p.name,
    })),
  };
}
