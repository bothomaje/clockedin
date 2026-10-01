import { Career } from '../../../../../profile/models/career';

const richExperience: Career['experience'] = [
  {
    id: 'exp-1',
    company: 'Nimbus Retail Systems',
    role: 'Software Engineer',
    location: 'Johannesburg, South Africa',
    employmentType: 'Full-time',
    startDate: new Date('2023-02-01'),
    endDate: null,
    description: 'Build and maintain customer-facing checkout and inventory tooling.',
    skillIds: ['skill-ts', 'skill-angular', 'skill-node', 'skill-postgres'],
    domains: ['e-commerce', 'fintech'],
    evidence: [
      {
        id: 'ev-1a',
        text: 'Rebuilt the checkout flow in Angular, cutting average checkout time by 35% and reducing cart-abandonment support tickets.',
        skillIds: ['skill-ts', 'skill-angular'],
      },
      {
        id: 'ev-1b',
        text: 'Designed a Postgres schema and Node API for real-time inventory sync across 12 store locations.',
        skillIds: ['skill-node', 'skill-postgres'],
      },
    ],
  },
  {
    id: 'exp-2',
    company: 'Lightbeam Studio',
    role: 'Frontend Developer',
    location: 'Remote',
    employmentType: 'Contract',
    startDate: new Date('2021-06-01'),
    endDate: new Date('2023-01-31'),
    description: 'Built interactive marketing sites and internal design-system components.',
    skillIds: ['skill-js', 'skill-react', 'skill-css', 'skill-figma'],
    domains: ['marketing', 'design systems'],
    evidence: [
      {
        id: 'ev-2a',
        text: 'Shipped a React component library adopted by 4 client teams, reducing new-page build time by roughly half.',
        skillIds: ['skill-react', 'skill-css'],
      },
    ],
  },
  {
    id: 'exp-3',
    company: 'Solace Interactive',
    role: 'Creative Developer',
    location: 'Cape Town, South Africa',
    employmentType: 'Full-time',
    startDate: new Date('2019-08-01'),
    endDate: new Date('2021-05-31'),
    description: 'Built WebGL experiences and generative visuals for brand campaigns.',
    skillIds: ['skill-threejs', 'skill-webgl', 'skill-js'],
    domains: ['creative technology', 'advertising'],
    evidence: [
      {
        id: 'ev-3a',
        text: 'Built a Three.js product configurator used in 3 international ad campaigns, reaching over 2 million sessions.',
        skillIds: ['skill-threejs', 'skill-webgl'],
      },
    ],
  },
  {
    id: 'exp-4',
    company: 'Kestrel QA Labs',
    role: 'Junior Test Engineer',
    location: 'Johannesburg, South Africa',
    employmentType: 'Full-time',
    startDate: new Date('2018-01-01'),
    endDate: new Date('2019-07-31'),
    description: 'Validated enterprise platform releases and built CI test tooling.',
    skillIds: ['skill-python', 'skill-git'],
    domains: ['quality assurance'],
    evidence: [
      {
        id: 'ev-4a',
        text: 'Wrote a Python regression suite that cut manual release testing time from 3 days to 4 hours.',
        skillIds: ['skill-python'],
      },
    ],
  },
];

const richEducation: Career['education'] = [
  {
    id: 'edu-1',
    institution: 'University of Johannesburg',
    qualification: 'BSc Computer Science',
    field: 'Computer Science',
    startDate: new Date('2014-02-01'),
    endDate: new Date('2017-12-01'),
    description: 'Focus on software engineering and human-computer interaction.',
    achievements: ["Dean's list, final year"],
  },
];

const richProjects: Career['projects'] = [
  {
    id: 'proj-1',
    name: 'Orbitfolio',
    description:
      'A Three.js-based interactive portfolio site with a 3D scene as the primary navigation.',
    technologies: ['Three.js', 'WebGL', 'TypeScript'],
    skillIds: ['skill-threejs', 'skill-webgl', 'skill-ts'],
    domains: ['creative technology'],
    evidence: [
      {
        id: 'proj-ev-1a',
        text: 'Optimised the render loop to hold 60fps on mid-range mobile GPUs, down from an initial 20fps.',
        skillIds: ['skill-threejs'],
      },
    ],
  },
  {
    id: 'proj-2',
    name: 'Shelfwise',
    description:
      'A FastAPI + Postgres service for small-business stock tracking, with a React dashboard.',
    technologies: ['Python', 'FastAPI', 'PostgreSQL', 'React'],
    skillIds: ['skill-python', 'skill-fastapi', 'skill-postgres', 'skill-react'],
    domains: ['e-commerce'],
  },
  {
    id: 'proj-3',
    name: 'clockedin',
    description:
      'This application — an Angular + Firebase job-application tracker with AI-assisted document generation.',
    technologies: ['Angular', 'Firebase', 'TypeScript'],
    skillIds: ['skill-angular', 'skill-ts'],
    domains: ['career tooling'],
  },
];

const richSkills: Career['skills'] = [
  { id: 'skill-js', name: 'JavaScript', category: 'Languages' },
  { id: 'skill-ts', name: 'TypeScript', category: 'Languages' },
  { id: 'skill-python', name: 'Python', category: 'Languages' },
  { id: 'skill-react', name: 'React', category: 'Frameworks' },
  { id: 'skill-angular', name: 'Angular', category: 'Frameworks' },
  { id: 'skill-node', name: 'Node.js', category: 'Frameworks' },
  { id: 'skill-fastapi', name: 'FastAPI', category: 'Frameworks' },
  { id: 'skill-threejs', name: 'Three.js', category: 'Frameworks' },
  { id: 'skill-webgl', name: 'WebGL', category: 'Frameworks' },
  { id: 'skill-css', name: 'CSS', category: 'Languages' },
  { id: 'skill-figma', name: 'Figma', category: 'Design / Creative' },
  { id: 'skill-postgres', name: 'PostgreSQL', category: 'Databases' },
  { id: 'skill-docker', name: 'Docker', category: 'DevOps' },
  { id: 'skill-git', name: 'Git', category: 'Tools' },
];

const richCareerProfiles: Career['careerProfiles'] = [
  {
    id: 'profile-swe',
    name: 'Software Engineering',
    description: 'General-purpose backend/full-stack software engineering roles.',
    skillIds: ['skill-ts', 'skill-node', 'skill-python', 'skill-fastapi', 'skill-postgres'],
    domains: ['e-commerce', 'fintech'],
  },
  {
    id: 'profile-creative-tech',
    name: 'Creative Technology',
    description: 'WebGL/interactive/brand-experience roles.',
    skillIds: ['skill-threejs', 'skill-webgl', 'skill-js'],
    domains: ['creative technology', 'advertising'],
  },
];

/** Full, realistic career — multi-role history, education, projects, 2 career profiles. Base for most cases. */
export const richCareer: Career = {
  experience: richExperience,
  education: richEducation,
  projects: richProjects,
  skills: richSkills,
  careerProfiles: richCareerProfiles,
};

/** Minimal career: one short recent role, no education/projects, few skills, no career profile. */
export const sparseCareer: Career = {
  experience: [
    {
      id: 'exp-sparse-1',
      company: 'Fernwell Co-op',
      role: 'Junior Developer',
      startDate: new Date('2025-01-01'),
      endDate: null,
      description: 'First developer role, working on internal tools.',
      skillIds: ['skill-js'],
      evidence: [
        {
          id: 'ev-sparse-1a',
          text: 'Built a small internal tool to track stock deliveries.',
          skillIds: ['skill-js'],
        },
      ],
    },
  ],
  education: [],
  projects: [],
  skills: [{ id: 'skill-js', name: 'JavaScript', category: 'Languages' }],
  careerProfiles: [],
};

/** Same rich history, but the user hasn't set up any career profile lens yet. */
export const noCareerProfileCareer: Career = {
  ...richCareer,
  careerProfiles: [],
};

/** Rich history, but most optional metadata fields left blank — tests robustness, not just happy-path data. */
export const missingOptionalFieldsCareer: Career = {
  experience: [
    {
      startDate: new Date('2022-01-01'),
      endDate: null,
      company: 'Unnamed Startup',
      role: 'Developer',
      // no location, employmentType, description, evidence, skillIds, domains
    },
  ],
  education: [
    {
      institution: 'Open University',
      // no qualification, field, dates, description, achievements
    },
  ],
  projects: [
    {
      name: 'Untitled Project',
      // no description, technologies, links, evidence, skillIds, domains
    },
  ],
  skills: [{ name: 'JavaScript' }], // no id, no category
  careerProfiles: [],
};

export const CAREER_FIXTURES = {
  sparse: sparseCareer,
  rich: richCareer,
  noProfile: noCareerProfileCareer,
  missingOptionalFields: missingOptionalFieldsCareer,
} as const;

export type CareerFixtureName = keyof typeof CAREER_FIXTURES;
