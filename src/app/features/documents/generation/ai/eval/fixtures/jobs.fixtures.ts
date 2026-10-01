import { Job } from '../../../../../jobs/models/job';

function job(overrides: Partial<Job> & Pick<Job, 'jobDescription'>): Job {
  return { jobUpdates: [], ...overrides };
}

export const juniorSoftwareEngineerJob = job({
  company: 'Fernbridge Systems',
  role: 'Junior Software Engineer',
  jobDescription: `We're looking for a Junior Software Engineer to join our platform team.
You'll work on our internal tooling and customer-facing APIs under the guidance of senior engineers.

Requirements:
- 0-2 years professional experience, or strong personal/academic projects
- Comfortable with JavaScript or TypeScript
- Familiarity with REST APIs and relational databases
- Eagerness to learn Git-based workflows and code review

Nice to have:
- Exposure to Node.js or Python backends
- Any experience with PostgreSQL

You'll write and test backend endpoints, fix bugs, and pair with senior engineers on small features.`,
});

export const frontendEngineerJob = job({
  company: 'Willowmere Digital',
  role: 'Frontend Engineer',
  jobDescription: `Willowmere Digital is hiring a Frontend Engineer to build our customer dashboard.

Requirements:
- 2+ years building production web applications
- Strong TypeScript and either React or Angular
- Experience with component-driven UI and design systems
- Solid CSS fundamentals

Preferred:
- Experience with Figma-to-code handoff
- Familiarity with accessibility (WCAG) requirements

Responsibilities: own frontend architecture decisions for the dashboard, build reusable components, collaborate with design on the component library, and review other engineers' frontend PRs.`,
});

export const uxEngineerJob = job({
  company: 'Northgate Health',
  role: 'UX Engineer',
  jobDescription: `Northgate Health is looking for a UX Engineer to bridge design and frontend development for our patient portal.

Requirements:
- Strong frontend skills (React, Vue, or Angular)
- Working knowledge of Figma and design systems
- Understanding of usability and accessibility principles
- Comfortable prototyping interactions in code, not just static mockups

You will translate Figma designs into accessible, responsive components, build and maintain a shared design system, and run lightweight usability reviews with the design team.`,
});

export const creativeTechnologyJob = job({
  company: 'Solstice Collective',
  role: 'Creative Technologist',
  jobDescription: `Solstice Collective, a digital experience studio, is hiring a Creative Technologist for brand and campaign work.

Requirements:
- Experience building interactive/WebGL experiences (Three.js, PixiJS, or similar)
- Strong JavaScript/TypeScript fundamentals
- A portfolio of shipped interactive or generative work
- Comfortable working directly with designers and creative directors

You'll prototype and ship interactive web experiences for advertising campaigns, optimise for performance across devices, and collaborate closely with motion and visual designers.`,
});

export const unrelatedRoleJob = job({
  company: 'Harrow & Vance Logistics',
  role: 'Warehouse Operations Supervisor',
  jobDescription: `Harrow & Vance Logistics is hiring a Warehouse Operations Supervisor for our regional distribution centre.

Requirements:
- 3+ years supervising warehouse or logistics staff
- Experience with inventory management systems and forklift-certified staff scheduling
- Strong understanding of health and safety compliance in a warehouse environment
- Ability to manage shift rosters and KPIs for a team of 15-20

Responsibilities: supervise daily warehouse operations, enforce safety procedures, manage stock accuracy audits, and report performance metrics to the regional operations manager.`,
});

export const manyMatchingTechnologiesJob = job({
  company: 'Cobalt Path Technologies',
  role: 'Full-Stack Engineer',
  jobDescription: `Cobalt Path Technologies is hiring a Full-Stack Engineer for our core platform team.

Requirements:
- Strong TypeScript across frontend and backend
- Production experience with React or Angular
- Node.js or Python backend experience (FastAPI a plus)
- PostgreSQL or another relational database
- Comfortable with Docker-based local development
- Git-based code review workflow

Nice to have:
- Experience with design systems or component libraries
- Any exposure to WebGL/Three.js for data visualisation

You'll build features end-to-end across our TypeScript/Node/Postgres stack, contribute to our React component library, and help evolve our Docker-based dev environment.`,
});

/**
 * Deliberately long and repetitive — a real over-written posting, not
 * hand-crafted prose — to exercise prepareJobDescription's truncation at
 * MAX_JOB_DESCRIPTION_CHARS (12000) and any provider context-window limits.
 */
export const longJobDescriptionJob = job({
  company: 'Meridian Group',
  role: 'Senior Software Engineer',
  jobDescription:
    `Meridian Group is a large, multi-division technology company hiring a Senior Software Engineer for our platform organisation. ` +
    `This is a comprehensive posting covering our team structure, engineering values, technical requirements, and benefits in detail.\n\n` +
    Array.from(
      { length: 40 },
      (_, i) =>
        `Section ${i + 1}: Our engineering teams value TypeScript, React, Node.js, PostgreSQL, Docker, and strong Git workflows. ` +
        `Engineers at this level are expected to lead design discussions, mentor junior engineers, review pull requests thoroughly, ` +
        `write comprehensive tests, and communicate clearly with cross-functional stakeholders across product, design, and data teams. ` +
        `We value clear documentation, incremental delivery, and a strong bias toward measuring the impact of shipped work.\n`,
    ).join('\n') +
    `\n\nRequirements: 5+ years professional software engineering experience, strong TypeScript, experience with at least one major frontend framework, and comfort working in a large, multi-team codebase.`,
});

export const JOB_FIXTURES = {
  juniorSoftwareEngineer: juniorSoftwareEngineerJob,
  frontendEngineer: frontendEngineerJob,
  uxEngineer: uxEngineerJob,
  creativeTechnology: creativeTechnologyJob,
  unrelatedRole: unrelatedRoleJob,
  manyMatchingTechnologies: manyMatchingTechnologiesJob,
  longJobDescription: longJobDescriptionJob,
} as const;

export type JobFixtureName = keyof typeof JOB_FIXTURES;
