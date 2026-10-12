// Single source of truth for business details.
// Change a value here and it updates everywhere on the site.

export const site = {
  name: 'Klica Technologies',
  tagline: 'Your Best Shot for Exam Preparation',
  description:
    'Klica Technologies builds exam preparation apps for JAMB, WAEC, NECO, BECE and Post-UTME, plus mobile, web and digital marketing services for businesses across Africa.',
  domain: 'klicatech.com',
  url: 'https://klicatech.com',

  phone: '+234 913 9079 751',
  phoneHref: 'tel:+2349139079751',

  // TODO(owner): switch to support@klicatech.com once Zoho mailboxes are live.
  email: 'klicatechnologies@gmail.com',

  whatsappNumber: '2349139079751',
  whatsappMessage:
    "Hello! I'm interested in learning more about your exam preparation apps and services. Could you please provide me with more details? Thank you!",

  socials: {
    facebook: 'https://www.facebook.com/KlicaNg',
    twitter: 'https://twitter.com/KlicaNg',
    linkedin: 'https://www.linkedin.com/company/KlicaNg',
    instagram: 'https://www.instagram.com/KlicaNg',
  },

  playDeveloperUrl: 'https://play.google.com/store/apps/dev?id=KLICA+TECHNOLOGIES',
} as const;

// The OneSitting app on every platform.
export const oneSitting = {
  playUrl: 'https://play.google.com/store/apps/details?id=com.onesitting.jambcbtapp',
  // Numeric App Store id of com.onesitting.jambcbtapp. This link opens the listing as soon as
  // Apple approves the app; until then the button explains that it is in review.
  appStoreId: '6810399615',
  appStoreUrl: 'https://apps.apple.com/app/id6810399615',
  // Cloudflare Worker (downloads-worker/) serving desktop installers from R2.
  downloadsApi: 'https://onesitting-downloads.austinemishael.workers.dev',
  // Fallbacks only: the download dialog reads the live version and size from the Worker's /info.
  windowsVersion: '1.0.20',
  windowsSizeBytes: 345401427,
  macReady: false,
} as const;

export const whatsappUrl = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(site.whatsappMessage)}`;
