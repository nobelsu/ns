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
]
