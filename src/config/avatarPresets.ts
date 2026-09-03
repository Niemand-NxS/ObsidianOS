export interface AvatarPreset {
  id: string;
  name: string;
  category: 'portrait' | 'cyberpunk' | '3d_render' | 'minimal' | 'nature';
  url: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'avatar-portrait-tech',
    name: 'Tech Leader',
    category: 'portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-portrait-creative',
    name: 'Modern Creative',
    category: 'portrait',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-portrait-dev',
    name: 'Software Engineer',
    category: 'portrait',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-portrait-analyst',
    name: 'Data Architect',
    category: 'portrait',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-cyber-neon',
    name: 'Neon Cyberpunk',
    category: 'cyberpunk',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-astronaut-space',
    name: 'Deep Space Astronaut',
    category: '3d_render',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-abstract-mesh',
    name: 'Quantum Sphere',
    category: '3d_render',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-portrait-designer',
    name: 'Product Designer',
    category: 'portrait',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-minimal-shadow',
    name: 'Monochrome Noir',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-portrait-artist',
    name: 'Visual Artist',
    category: 'portrait',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-nature-explorer',
    name: 'Mountain Explorer',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'avatar-aurora-glow',
    name: 'Cosmic Traveler',
    category: '3d_render',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80',
  },
];
