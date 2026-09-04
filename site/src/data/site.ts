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

  // TODO(owner): replace with the real Google Play developer page URL.
  playDeveloperUrl: '',
} as const;

export const whatsappUrl = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(site.whatsappMessage)}`;
