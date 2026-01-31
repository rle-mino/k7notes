import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  href: string;
}

export interface BaseItem {
  id: string;
  icon: LucideIcon;
}

export interface ProblemItem extends BaseItem {}
export interface SolutionItem extends BaseItem {}
export interface TrustItem extends BaseItem {}

export interface FeatureItem extends BaseItem {}

export interface StepItem {
  id: string;
  number: string;
}

export interface PersonaItem {
  id: string;
}