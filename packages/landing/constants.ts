import { 
  Clock, 
  Search, 
  FileX, 
  UserCheck, 
  Zap, 
  WifiOff, 
  ShieldCheck, 
  Server, 
  BrainCircuit,
  Mic,
  FileText,
  ListTodo
} from 'lucide-react';
import { NavItem, ProblemItem, SolutionItem, TrustItem, FeatureItem, StepItem, PersonaItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'problem', href: '#problem' },
  { id: 'solution', href: '#solution' },
  { id: 'trust', href: '#trust' },
];

export const PROBLEM_ITEMS: ProblemItem[] = [
  { id: 'time', icon: Clock },
  { id: 'search', icon: Search },
  { id: 'ignored', icon: FileX },
];

export const SOLUTION_ITEMS: SolutionItem[] = [
  { id: 'personalized', icon: UserCheck },
  { id: 'search', icon: Zap },
  { id: 'offline', icon: WifiOff },
];

export const TRUST_ITEMS: TrustItem[] = [
  { id: 'hosting', icon: Server },
  { id: 'encryption', icon: ShieldCheck },
  { id: 'no_training', icon: BrainCircuit },
];

export const FEATURES_DATA: FeatureItem[] = [
  { id: 'record', icon: Mic },
  { id: 'transcribe', icon: FileText },
  { id: 'search', icon: Search },
  { id: 'action', icon: ListTodo },
];

export const STEPS_DATA: StepItem[] = [
  { id: 'record', number: '01' },
  { id: 'process', number: '02' },
  { id: 'distribute', number: '03' },
];

export const PERSONAS_DATA: PersonaItem[] = [
  { id: 'manager' },
  { id: 'architect' },
  { id: 'client' },
];