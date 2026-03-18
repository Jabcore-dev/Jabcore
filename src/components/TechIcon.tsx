import { memo } from 'react'
import {
  TypescriptOriginal,
  JavascriptOriginal,
  ReactOriginal,
  VuejsOriginal,
  NodejsOriginal,
  CsharpOriginal,
  CapacitorOriginal,
  SwiftOriginal,
  KotlinOriginal,
  GithubactionsOriginal,
  PythonOriginal,
  FigmaOriginal,
  GitOriginal,
  AzureOriginal,
} from 'devicons-react'
import { 
  SiN8N,
  SiGooglegemini,
  SiClaude,
  SiOpenai,
  SiApple,
  SiAndroid,
  SiUbuntu,
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

// DevIcons - tyto ikony mají správné barvy automaticky
const devIcons: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  'TypeScript': TypescriptOriginal,
  'JavaScript': JavascriptOriginal,
  'React': ReactOriginal,
  'Vue.js': VuejsOriginal,
  'Node.js': NodejsOriginal,
  'C#': CsharpOriginal,
  'Capacitor JS': CapacitorOriginal,
  'Swift': SwiftOriginal,
  'Kotlin': KotlinOriginal,
  'CI/CD': GithubactionsOriginal,
  'Python': PythonOriginal,
  'Figma': FigmaOriginal,
  'Git': GitOriginal,
  'Azure': AzureOriginal,
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
  // DevIcons - automaticky barevné
  if (name in devIcons) {
    const IconComponent = devIcons[name]
    return <IconComponent className={className} />
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
