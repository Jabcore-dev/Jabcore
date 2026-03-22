import { memo } from 'react'
import {
  SiN8N,
  SiGooglegemini,
  SiClaude,
  SiOpenai,
  SiApple,
  SiAndroid,
  SiUbuntu,
  SiCapacitor,
} from 'react-icons/si'
import { FaDocker } from 'react-icons/fa6'
import {
  PiPencilRulerFill,
  PiDevicesFill,
  PiUsersFourFill,
} from 'react-icons/pi'

interface TechIconProps {
  name: string
  className?: string
}

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons'

// DevIcons via CDN - nahrazuje devicons-react (8.9 MB chunk) lightweight <img> tagy
// Každá ikona se načte on-demand z CDN (~1-3 kB), ne z JS bundle
const devIconUrls: Record<string, string> = {
  'TypeScript': `${CDN_BASE}/typescript/typescript-original.svg`,
  'JavaScript': `${CDN_BASE}/javascript/javascript-original.svg`,
  'React': `${CDN_BASE}/react/react-original.svg`,
  'Vue.js': `${CDN_BASE}/vuejs/vuejs-original.svg`,
  'Node.js': `${CDN_BASE}/nodejs/nodejs-original.svg`,
  'C#': `${CDN_BASE}/csharp/csharp-original.svg`,
  'CI/CD': `${CDN_BASE}/githubactions/githubactions-original.svg`,
  'Python': `${CDN_BASE}/python/python-original.svg`,
  'Figma': `${CDN_BASE}/figma/figma-original.svg`,
  'Git': `${CDN_BASE}/git/git-original.svg`,
  'Azure': `${CDN_BASE}/azure/azure-original.svg`,
}

// Simple Icons z react-icons (pro AI služby a platformy)
const simpleIcons: Record<string, {
  icon: React.ComponentType<{ size?: number | string; color?: string; className?: string }>;
  color: string;
}> = {
  'n8n': { icon: SiN8N, color: '#EA4B71' },
  'Gemini': { icon: SiGooglegemini, color: '#8E75B2' },
  'Claude': { icon: SiClaude, color: '#D97757' },
  'OpenAI': { icon: SiOpenai, color: '#A2AAAD' },
  'iOS': { icon: SiApple, color: '#A2AAAD' },
  'Android': { icon: SiAndroid, color: '#3DDC84' },
  'Ubuntu Server': { icon: SiUbuntu, color: '#E95420' },
  'Docker': { icon: FaDocker, color: '#2496ED' },
  'Capacitor JS': { icon: SiCapacitor, color: '#119EFF' },
}

// Speciální ikony pro design/UX služby
const specialIcons: Record<string, {
  icon: React.ComponentType<{ size?: number | string; color?: string; className?: string }>;
  color: string;
}> = {
  'Web Design': { icon: PiPencilRulerFill, color: '#F24E1E' },
  'Prototyping': { icon: PiDevicesFill, color: '#A259FF' },
  'User Testing': { icon: PiUsersFourFill, color: '#1ABCFE' },
}

const TechIcon = memo(function TechIcon({ name, className = "w-6 h-6" }: TechIconProps) {
  // DevIcons - via CDN, žádný JS bundle overhead
  if (name in devIconUrls) {
    return (
      <img
        src={devIconUrls[name]}
        alt={name}
        className={className}
        loading="lazy"
        width={24}
        height={24}
      />
    )
  }

  // Simple Icons (AI služby)
  if (name in simpleIcons) {
    const { icon: IconComponent, color } = simpleIcons[name]
    return <IconComponent className={className} color={color} />
  }

  // Speciální ikony pro design služby
  if (name in specialIcons) {
    const { icon: IconComponent, color } = specialIcons[name]
    return <IconComponent className={className} color={color} />
  }

  return <span className={className}>?</span>
})

export default TechIcon
