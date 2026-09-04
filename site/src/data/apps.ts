// The Klica app catalogue.
//
// Every exam below now ships inside a single consolidated Android app, so all
// Android cards link to the same Play Store listing. The categories still matter
// as a way for students to find the exam they are sitting.
//
// Desktop apps are still per-exam. `desktopUrl` is empty for now, so those cards
// render a "Coming soon" state rather than a link that goes nowhere.
//
// TODO(owner): fill in desktopUrl for each app once the downloads are hosted.

/** The consolidated Android app that covers every exam in this catalogue. */
export const ANDROID_APP_URL =
  'https://play.google.com/store/apps/details?id=com.onesitting.jambcbtapp';

export type Platform = 'android' | 'desktop';

export interface App {
  name: string;
  subtitle: string;
  /** Full institution / exam name, spelled out for search engines. */
  fullName: string;
  desktopUrl?: string;
  platforms: Platform[];
}

export interface Category {
  slug: string;
  title: string;
  blurb: string;
  apps: App[];
}

const postUtme = (abbr: string, fullName: string): App => ({
  name: abbr,
  subtitle: 'Post UTME',
  fullName: `${fullName} Post UTME`,
  platforms: ['android', 'desktop'],
});

export const categories: Category[] = [
  {
    slug: 'utme',
    title: 'UTME',
    blurb:
      'UTME stands for Unified Tertiary Matriculation Examination. It is written yearly by students seeking admission into higher institutions.',
    apps: [
      {
        name: 'JAMB',
        subtitle: 'CBT Practice',
        fullName: 'JAMB UTME CBT Practice',
        platforms: ['android', 'desktop'],
      },
    ],
  },
  {
    slug: 'senior-school',
    title: 'Senior School',
    blurb:
      'Organised in five West African countries, WASSCE tests senior students on their knowledge of core subjects.',
    apps: [
      {
        name: 'WAEC',
        subtitle: 'Literature',
        fullName: 'WAEC Literature in English',
        platforms: ['android', 'desktop'],
      },
      {
        name: 'WAEC',
        subtitle: 'Questions',
        fullName: 'WAEC Past Questions and Answers',
        platforms: ['android', 'desktop'],
      },
    ],
  },
  {
    slug: 'junior-school',
    title: 'Junior School',
    blurb:
      'Entrance examinations for junior secondary school students seeking admission into senior secondary school.',
    apps: [
      { name: 'BECE', subtitle: 'JHS', fullName: 'BECE Junior High School', platforms: ['android', 'desktop'] },
      { name: 'BECE', subtitle: 'NECO', fullName: 'BECE NECO Junior School', platforms: ['android', 'desktop'] },
    ],
  },
  {
    slug: 'post-utme',
    title: 'Post UTME',
    blurb:
      'Organised by higher institutions for students seeking admission into those institutions.',
    apps: [
      postUtme('ABSU', 'Abia State University'),
      postUtme('ABU', 'Ahmadu Bello University Zaria'),
      postUtme('BUK', 'Bayero University Kano'),
      postUtme('DELSU', 'Delta State University'),
      postUtme('ESUT', 'Enugu State University of Science and Technology'),
      postUtme('FUNAAB', 'Federal University of Agriculture Abeokuta'),
      postUtme('FUTA', 'Federal University of Technology Akure'),
      postUtme('FUTMINNA', 'Federal University of Technology Minna'),
      postUtme('FUTO', 'Federal University of Technology Owerri'),
      postUtme('IMSU', 'Imo State University'),
      postUtme('NDA', 'Nigerian Defence Academy'),
      postUtme('OAU', 'Obafemi Awolowo University'),
      postUtme('RSUST', 'Rivers State University of Science and Technology'),
      postUtme('UI', 'University of Ibadan'),
      postUtme('UNIABUJA', 'University of Abuja'),
      postUtme('UNIBEN', 'University of Benin'),
      postUtme('UNICAL', 'University of Calabar'),
      postUtme('UNIJOS', 'University of Jos'),
      postUtme('UNILAG', 'University of Lagos'),
      postUtme('UNILORIN', 'University of Ilorin'),
      postUtme('UNIPORT', 'University of Port Harcourt'),
      postUtme('UNIZIK', 'Nnamdi Azikiwe University Awka'),
      postUtme('UNN', 'University of Nigeria Nsukka'),
    ],
  },
  {
    slug: 'tertiary',
    title: 'Tertiary Exams',
    blurb:
      'First-year examinations organised by higher institutions for newly admitted students, assessing readiness for the academic challenges ahead.',
    apps: [],
  },
];

export const forPlatform = (p: Platform): Category[] =>
  categories.map((c) => ({ ...c, apps: c.apps.filter((a) => a.platforms.includes(p)) }));

export const totalApps = categories.reduce((n, c) => n + c.apps.length, 0);
