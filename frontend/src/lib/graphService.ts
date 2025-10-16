import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

// Custom authentication provider that uses the existing Microsoft token from Supabase auth
class SupabaseAuthProvider implements AuthenticationProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No Microsoft access token available. Please sign in with Microsoft.');
    }
    return this.accessToken;
  }
}

export class GraphEmailService {
  private graphClient: Client | null = null;

  constructor(accessToken: string) {
    if (accessToken) {
      const authProvider = new SupabaseAuthProvider(accessToken);
      this.graphClient = Client.initWithMiddleware({ authProvider });
    }
  }

  async sendEmail(recipients: string[], subject: string, htmlContent: string, attachments?: { name: string; base64: string }[]): Promise<void> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized. Microsoft access token may be missing.');
    }

    // Convert recipients to the format expected by Graph API
    const toRecipients = recipients.map(email => ({
      emailAddress: {
        address: email,
      },
    }));

    const mail = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlContent,
        },
        toRecipients: toRecipients,
        attachments: attachments ? attachments.map(att => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: att.name,
          contentType: 'image/png',
          contentBytes: att.base64
        })) : []
      },
      saveToSentItems: true,
    };

    try {
      await this.graphClient.api('/me/sendMail').post(mail);
      console.log('Email sent successfully to:', recipients.join(', '));
    } catch (error) {
      console.error('Failed to send email:', error);
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.graphClient) {
      return false;
    }

    try {
      const user = await this.graphClient.api('/me').get();
      console.log('Graph API connection successful. User:', user.displayName || user.mail);
      return true;
    } catch (error) {
      console.error('Graph API connection failed:', error);
      return false;
    }
  }

  async getUserProfile(): Promise<any> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized');
    }

    try {
      const user = await this.graphClient.api('/me').get();
      return user;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }
}

// Helper function to create a service instance
export const createGraphEmailService = (accessToken: string | null): GraphEmailService | null => {
  if (!accessToken) {
    console.warn('No Microsoft access token provided');
    return null;
  }
  return new GraphEmailService(accessToken);
};