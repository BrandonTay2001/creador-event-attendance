/**
 * Microsoft Graph API utility functions
 * 
 * This module provides functions to interact with Microsoft Graph API
 * using the stored access token from OAuth authentication.
 */

export interface EmailAttachment {
  name: string;
  contentBytes: string; // Base64 encoded
  contentType: string;
}

export interface EmailMessage {
  subject: string;
  body: {
    contentType: 'Text' | 'HTML';
    content: string;
  };
  toRecipients: {
    emailAddress: {
      address: string;
      name?: string;
    };
  }[];
  ccRecipients?: {
    emailAddress: {
      address: string;
      name?: string;
    };
  }[];
  attachments?: EmailAttachment[];
}

/**
 * Send an email using Microsoft Graph API
 */
export async function sendEmail(accessToken: string, message: EmailMessage): Promise<boolean> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Microsoft Graph API error:', response.status, errorText);
      return false;
    }

    console.log('Email sent successfully via Microsoft Graph');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Get user profile information
 */
export async function getUserProfile(accessToken: string): Promise<any> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Check if the access token is valid
 */
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error validating access token:', error);
    return false;
  }
}

/**
 * Create a QR code attachment for email
 */
export function createQRCodeAttachment(qrCodeDataUrl: string, fileName: string = 'qr-code.png'): EmailAttachment {
  // Remove data URL prefix to get just the base64 data
  const base64Data = qrCodeDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
  
  return {
    name: fileName,
    contentBytes: base64Data,
    contentType: 'image/png'
  };
}

/**
 * Generate HTML email template for event attendance with QR code
 */
export function generateAttendanceEmailHTML(
  eventName: string, 
  eventDate: string, 
  eventLocation: string, 
  attendeeName: string,
  qrCodeDataUrl?: string
): string {
  const qrCodeSection = qrCodeDataUrl ? `
    <div style="text-align: center; margin: 20px 0;">
      <img src="${qrCodeDataUrl}" alt="QR Code for Check-in" style="max-width: 200px; height: auto;" />
      <p style="margin-top: 10px; color: #666; font-size: 14px;">
        Present this QR code at the event for quick check-in
      </p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Registration Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">Event Registration Confirmed</h1>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #3498db; margin-bottom: 20px;">Event Details</h2>
                <p><strong>Event:</strong> ${eventName}</p>
                <p><strong>Date:</strong> ${eventDate}</p>
                <p><strong>Location:</strong> ${eventLocation}</p>
                <p><strong>Attendee:</strong> ${attendeeName}</p>
            </div>

            ${qrCodeSection}

            <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Important Information</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Please arrive 15 minutes before the event starts</li>
                    <li>Bring a valid ID for verification</li>
                    <li>Keep this email for your records</li>
                    ${qrCodeDataUrl ? '<li>Show the QR code above at check-in for faster processing</li>' : ''}
                </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 14px;">
                    If you have any questions, please contact the event organizers.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}