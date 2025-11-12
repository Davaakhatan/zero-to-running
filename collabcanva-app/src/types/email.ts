// Email-related type definitions

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables?: string[];
  category: 'invitation' | 'notification' | 'reminder' | 'system';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, any>;
  attachments?: EmailAttachment[];
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: Date;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  cid?: string;
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'mock';
  apiKey?: string;
  apiSecret?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface EmailService {
  send: (message: EmailMessage) => Promise<EmailResult>;
  sendTemplate: (templateId: string, to: string, variables?: Record<string, any>) => Promise<EmailResult>;
  sendBulk: (messages: EmailMessage[]) => Promise<EmailResult[]>;
  sendTransferRequestEmail: (data: TransferRequestEmailData) => Promise<EmailResult>;
  sendTransferStatusEmail: (data: TransferStatusEmailData) => Promise<EmailResult>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface TransferRequestEmailData {
  to: string;
  projectName: string;
  fromUserName: string;
  toUserName: string;
  message?: string;
  expiresAt: Date;
}

export interface TransferStatusEmailData {
  to: string;
  projectName: string;
  status: 'accepted' | 'declined' | 'cancelled';
  fromUserName: string;
  toUserName: string;
  message?: string;
}
