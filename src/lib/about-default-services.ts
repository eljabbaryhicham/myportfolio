import {
  BrainCircuit,
  Clapperboard,
  Code,
  Mic,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import type { AboutService } from '@/lib/about-content';
import type { MultilingualString } from '@/lib/i18n/multilingual';

/** Built-in line icons a card can use instead of a custom image. */
export const BUILTIN_ICONS = [
  'brainstorming',
  'voiceover',
  'contentCreation',
  'socialMedia',
  'webDesign',
] as const;
export type BuiltinIconName = (typeof BUILTIN_ICONS)[number];

export const builtinIconMap: Record<BuiltinIconName, LucideIcon> = {
  brainstorming: BrainCircuit,
  voiceover: Mic,
  contentCreation: Clapperboard,
  socialMedia: Share2,
  webDesign: Code,
};

const bi = (en: string, fr: string): MultilingualString => ({ en, fr });

/**
 * Built-in "What We Provide" cards, shown when the admin has not saved any
 * custom cards. Also used to pre-fill the admin editor so the existing
 * cards can be edited/removed instead of rebuilt from scratch.
 */
export const DEFAULT_SERVICES: AboutService[] = [
  {
    iconName: 'brainstorming',
    title: bi('Brainstorming & Scripting', 'Brainstorming & Scénarisation'),
    description: { en: '', fr: '' },
  },
  {
    iconName: 'voiceover',
    title: bi('Voiceover & Sound', 'Voix-off & Son'),
    description: { en: '', fr: '' },
  },
  {
    iconName: 'contentCreation',
    title: bi(
      'Content Creation, Animation, Video & Graphics',
      'Création de contenu, Animation, Vidéo & Graphisme'
    ),
    description: { en: '', fr: '' },
  },
  {
    iconName: 'socialMedia',
    title: bi('Social Media Management', 'Gestion des réseaux sociaux'),
    description: { en: '', fr: '' },
  },
  {
    iconName: 'webDesign',
    title: bi('Web Design & Development', 'Conception & Développement Web'),
    description: { en: '', fr: '' },
  },
];

/** Deep clone of the defaults with string keys, safe to hand to the form. */
export const cloneDefaultServices = (): AboutService[] =>
  DEFAULT_SERVICES.map((s) => ({
    iconName: s.iconName ?? '',
    iconUrl: '',
    title: { ...s.title },
    description: { ...s.description },
  }));