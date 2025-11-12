// Routing-related type definitions

import type { ComponentType } from 'react';

export interface RouteConfig {
  path: string;
  component: ComponentType<any>;
  exact?: boolean;
  strict?: boolean;
  sensitive?: boolean;
  meta?: RouteMeta;
  guards?: RouteGuard[];
}

export interface RouteMeta {
  title?: string;
  description?: string;
  requiresAuth?: boolean;
  requiresPermission?: string;
  requiresRole?: string;
  layout?: string;
  breadcrumb?: string;
  icon?: string;
  order?: number;
  hidden?: boolean;
}

export interface RouteGuard {
  name: string;
  check: (context: RouteContext) => Promise<boolean>;
  redirect?: string;
  message?: string;
}

export interface RouteContext {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  user?: any;
  project?: any;
  canvas?: any;
}

export interface RouteMatch {
  path: string;
  url: string;
  isExact: boolean;
  params: Record<string, string>;
}

export interface RouteLocation {
  pathname: string;
  search: string;
  hash: string;
  state?: any;
  key?: string;
}

export interface RouteHistory {
  push: (path: string, state?: any) => void;
  replace: (path: string, state?: any) => void;
  go: (n: number) => void;
  goBack: () => void;
  goForward: () => void;
  block: (prompt: any) => () => void;
  listen: (listener: (location: RouteLocation, action: string) => void) => () => void;
}
