export interface BrandFeature {
  n: string;
  title: string;
  text: string;
}

export interface WizardBrand {
  headline: string;
  description: string;
  features: BrandFeature[];
}

export const AUTH_DESCRIPTION =
  'A calm, focused workspace for keeping track of applications, interviews, opportunities and offers.';

export const AUTH_FEATURES: BrandFeature[] = [
  {
    n: '01',
    title: 'Everything in one place',
    text: 'Keep your applications, job details, contacts, notes and important documents organised and easy to find.',
  },
  {
    n: '02',
    title: 'Know what comes next',
    text: 'Keep track of follow-ups, interviews, deadlines and the next step for every application.',
  },
  {
    n: '03',
    title: 'Make every application count',
    text: 'Keep your professional information organised so you can create tailored CVs and cover letters without starting from scratch.',
  },
];

export const AUTH_DEFAULT_HEADLINE = 'Welcome back.';

export const AUTH_HEADLINES: { prefix: string; headline: string }[] = [
  { prefix: '/signup', headline: 'Take control of your job search.' },
  { prefix: '/forgot-password', headline: "Let's get you back in." },
  { prefix: '/verify-email', headline: 'Almost there.' },
  { prefix: '/auth/error', headline: 'Access issues happen.' },
];

// Index = onboarding step
export const ONBOARDING_BRAND: WizardBrand[] = [
  {
    headline: 'Your job search, organised in one calm space.',
    description: 'Keep your job search organised without the clutter.',
    features: [
      {
        n: '01',
        title: 'Build your profile',
        text: 'Add your experience, skills and other details once. Keep them ready for future applications.',
      },
      {
        n: '02',
        title: 'Ready when you need it',
        text: 'Build your profile at your own pace and come back anytime to add more detail.',
      },
    ],
  },
  {
    headline: 'Start with the basics.',
    description:
      'This information forms the foundation of your profile and helps us tailor your job search tools to you.',
    features: [
      {
        n: '01',
        title: 'Profile basics',
        text: 'Add a few details about yourself so your profile is ready to use across your job search.',
      },
      {
        n: '02',
        title: 'Add more later',
        text: "Your profile doesn't need to be perfect yet. You can come back anytime to add details and refine your information.",
      },
    ],
  },
  {
    headline: 'Experience & skills.',
    description:
      'Add your skills and a recent role to give us a clearer picture of your experience. You can add more detail later.',
    features: [
      {
        n: '01',
        title: 'Recent experience',
        text: "Start with one recent role. You don't need to add your entire work history right now.",
      },
      {
        n: '02',
        title: 'Your skills',
        text: 'Add the skills you want to highlight in your job search. You can update them whenever your goals change.',
      },
    ],
  },
  {
    headline: 'Education & learning.',
    description:
      "Add your education, training or other learning experiences that you'd like to include in your profile.",
    features: [
      {
        n: '01',
        title: 'Your background',
        text: "Keep the education and training that's relevant to the opportunities you're looking for.",
      },
      {
        n: '02',
        title: 'Add what matters',
        text: 'Include formal qualifications, courses, certifications or other learning experiences that help tell your story.',
      },
    ],
  },
  {
    headline: "You're ready to go.",
    description:
      'Your profile is set up and ready to support your job search. You can keep adding detail as your search develops.',
    features: [
      {
        n: '01',
        title: 'Profile ready',
        text: 'Your experience, skills, and background are organised in one place and ready to build on.',
      },
      {
        n: '02',
        title: 'Start your search',
        text: 'Add your first application, keep track of what happens next, and keep your job search moving.',
      },
    ],
  },
];
