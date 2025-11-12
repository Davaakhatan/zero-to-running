// Deep link-related type definitions

export interface DeepLinkParams {
  projectId?: string;
  canvasId?: string;
  userId?: string;
  action?: string;
  [key: string]: string | undefined;
}

export interface DeepLinkResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface DeepLinkOptions {
  openInNewTab?: boolean;
  fallbackUrl?: string;
  timeout?: number;
}

export interface DeepLinkHandler {
  canHandle: (url: string) => boolean;
  handle: (url: string, options?: DeepLinkOptions) => Promise<DeepLinkResult>;
}
