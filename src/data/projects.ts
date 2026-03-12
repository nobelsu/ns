export interface Project {
  id: number
  slug: string
  title: string
  type: string
  year: string
  image: string
  skills: string[]
  description: string
  techStack: string[]
  github?: string
  live?: string
  featured?: boolean
  inProgress?: boolean
}

export const projects: Project[] = [
  {
    id: 1,
    slug: 'zestify',
    title: 'Zestify',
    type: 'Mobile App',
    year: '2023',
    image: 'linear-gradient(135deg, #0d1a0d, #1a3d20)',
    skills: ['react-native', 'expo', 'js', 'node'],
    description: `Zestify is a food waste reduction app inspired by Too Good To Go, built with React Native and published on the App Store.

The app connects users with local restaurants and cafes offering surplus food at reduced prices, reducing waste while saving money. The focus was on a frictionless purchase flow and real-time availability updates.

One of the more interesting challenges was handling location-based filtering efficiently on the client side while keeping the backend lightweight. The app is live on the App Store.`,
    techStack: ['React Native', 'Expo', 'JavaScript', 'Node.js'],
    github: 'https://github.com/nobelsu/Zestify',
    featured: true,
  },
  {
    id: 2,
    slug: 'designer-agent',
    title: 'Designer Agent',
    type: 'AI',
    year: '2026',
    image: 'linear-gradient(135deg, #0f1c2e, #1e3a5f)',
    skills: ['ts', 'react', 'expo', 'convex', 'vercel', 'python'],
    description: `An autonomous AI designer agent that generates live app previews deployed on Vercel Sandboxes — built with Convex for real-time state and Expo for the frontend.

The agent takes a natural language brief and iteratively generates, deploys, and refines UI components in sandboxed environments, giving users a live preview URL within seconds. The system uses a multi-agent loop with feedback cycles to improve output quality.

Built in a weekend as an exploration of agentic design workflows.`,
    techStack: ['TypeScript', 'React', 'Expo', 'Convex', 'Vercel Sandboxes', 'Python', 'FastAPI'],
    github: 'https://github.com/nobelsu/designer-agent',
    live: 'https://designer-agent-six.vercel.app/',
    featured: true,
  },
  {
    id: 3,
    slug: 'agentic-predictions',
    title: 'Agentic Predictions',
    type: 'AI Research',
    year: '2025',
    image: 'linear-gradient(135deg, #1a0d1a, #2d1a2d)',
    skills: ['python', 'fastapi'],
    description: `An autonomous, self-optimising agentic pipeline for predicting startup success, built using the mcp-agent library.

The system retrieves and synthesises data from multiple sources — funding databases, founder backgrounds, market signals — then runs a multi-agent reasoning loop that refines its own predictions over time without human intervention.

The pipeline experiments with agent memory, tool use, and iterative self-critique as mechanisms for improving forecast accuracy.`,
    techStack: ['Python', 'MCP Agent', 'FastAPI'],
    github: 'https://github.com/nobelsu/agentic-predictions',
    featured: true,
  },
  {
    id: 4,
    slug: 'closedclaw',
    title: 'ClosedClaw',
    type: 'Systems',
    year: '2026',
    image: 'linear-gradient(135deg, #1a1206, #2d1e0a)',
    skills: ['ts', 'electron', 'docker'],
    description: `An Electron GUI for automated, use-case-based Docker container hardening — built for Oxbridge Varsity Hacks 2026.

ClosedClaw analyses running containers and applies targeted security policies based on the detected workload type, reducing the attack surface without manual configuration. The tool generates audit reports and can apply changes non-destructively.

Built in 24 hours at the hackathon with a focus on developer experience — making container security accessible without deep systems knowledge.`,
    techStack: ['TypeScript', 'Electron', 'Docker'],
    github: 'https://github.com/nobelsu/ClosedClaw',
    featured: true,
  },
  {
    id: 5,
    slug: '3d-website',
    title: '3D Website',
    type: 'Web',
    year: '2026',
    image: 'linear-gradient(135deg, hsl(351 40% 18%), hsl(36 45% 22%))',
    skills: [],
    description: 'No description provided on GitHub.',
    techStack: [],
    github: 'https://github.com/nobelsu/3d-website',
  },
  {
    id: 6,
    slug: 'blocker-extension',
    title: 'Blocker Extension',
    type: 'Browser Extension',
    year: '2026',
    image: 'linear-gradient(135deg, hsl(236 40% 18%), hsl(281 45% 22%))',
    skills: ['html'],
    description: 'A simple Chrome extension for blocking keywords',
    techStack: ['HTML'],
    github: 'https://github.com/nobelsu/blocker-extension',
  },
  {
    id: 7,
    slug: 'designer-backend',
    title: 'Designer Backend',
    type: 'Backend',
    year: '2026',
    image: 'linear-gradient(135deg, hsl(90 40% 18%), hsl(135 45% 22%))',
    skills: ['python'],
    description: 'A FastAPI backend for designer-agent to interact with Vercel Sandboxes',
    techStack: ['Python'],
    github: 'https://github.com/nobelsu/designer-backend',
    live: 'https://designer-backend.vercel.app',
  },
  {
    id: 8,
    slug: 'jurni-landing',
    title: 'Jurni Landing Page',
    type: 'Web',
    year: '2026',
    image: 'linear-gradient(135deg, hsl(188 40% 18%), hsl(233 45% 22%))',
    skills: ['typescript'],
    description: 'Landing page for Jurni',
    techStack: ['TypeScript'],
    github: 'https://github.com/nobelsu/jurni-landing',
    live: 'https://jurni-landing.vercel.app',
  },
  {
    id: 9,
    slug: 'jurni-trial',
    title: 'Jurni',
    type: 'Mobile App',
    year: '2026',
    image: 'linear-gradient(135deg, hsl(51 40% 18%), hsl(96 45% 22%))',
    skills: ['typescript'],
    description:
      'A light-weight ride-hailing app built with React Native and managed by Expo. Built as a trial task for Jurni Ride.',
    techStack: ['TypeScript'],
    github: 'https://github.com/nobelsu/jurni-trial',
    inProgress: true,
  },
  {
    id: 10,
    slug: 'lock-in',
    title: 'Ruby',
    type: 'Project',
    year: '2026',
    image: 'linear-gradient(135deg, hsl(287 40% 18%), hsl(332 45% 22%))',
    skills: ['typescript'],
    description: 'Screen-time gamified.',
    techStack: ['TypeScript'],
    github: 'https://github.com/nobelsu/lock-in',
    inProgress: true,
  },
  {
    id: 11,
    slug: 'next-chatbot',
    title: 'Next Chatbot',
    type: 'AI',
    year: '2025',
    image: 'linear-gradient(135deg, hsl(133 40% 18%), hsl(178 45% 22%))',
    skills: ['python'],
    description: 'A basic RAG chatbot built with Python and Next.js',
    techStack: ['Python'],
    github: 'https://github.com/nobelsu/next-chatbot',
    live: 'https://next-chatbot-ten.vercel.app',
  },
  {
    id: 12,
    slug: 'sqlite-browser',
    title: 'SQLite Browser',
    type: 'Web',
    year: '2025',
    image: 'linear-gradient(135deg, hsl(271 40% 18%), hsl(316 45% 22%))',
    skills: ['javascript'],
    description: 'A simple web-based UI for browsing SQLite databases',
    techStack: ['JavaScript'],
    github: 'https://github.com/nobelsu/sqlite-browser',
  },
  {
    id: 13,
    slug: 'justeachit',
    title: 'Justeach.it',
    type: 'Web App',
    year: '2022',
    image: 'linear-gradient(135deg, hsl(240 40% 18%), hsl(285 45% 22%))',
    skills: ['css'],
    description:
      'Justeach.it is a website to help teachers and students arrange tutoring sessions or meetings. It has a built-in calendar to show the availability of both teachers and students. Chat integration is in the works to make communication more convenient.',
    techStack: ['CSS'],
    github: 'https://github.com/nobelsu/justeachit',
  },
  {
    id: 14,
    slug: 'jet',
    title: 'Just Enough Tasks',
    type: 'Web App',
    year: '2021',
    image: 'linear-gradient(135deg, hsl(353 40% 18%), hsl(38 45% 22%))',
    skills: ['html'],
    description: 'CS50 Final Project',
    techStack: ['HTML'],
    github: 'https://github.com/nobelsu/jet',
  },
  {
    id: 15,
    slug: 'snipe',
    title: 'Snipe Bot',
    type: 'Bot',
    year: '2021',
    image: 'linear-gradient(135deg, hsl(243 40% 18%), hsl(288 45% 22%))',
    skills: ['python'],
    description: 'SnipeBot is a discord.py bot that snipes messages, similar to Dank Memer\'s "pls snipe" feature.',
    techStack: ['Python'],
    github: 'https://github.com/nobelsu/snipe',
  },
  {
    id: 16,
    slug: 'utilities',
    title: 'Utilities Bot',
    type: 'Bot',
    year: '2021',
    image: 'linear-gradient(135deg, hsl(314 40% 18%), hsl(359 45% 22%))',
    skills: ['python'],
    description: 'Built with discord.py, Utilities Bot was meant to assist users to setup their servers quickly.',
    techStack: ['Python'],
    github: 'https://github.com/nobelsu/utilities',
  },
]
