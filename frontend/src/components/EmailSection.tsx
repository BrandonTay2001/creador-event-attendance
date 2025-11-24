import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Mail, Users, Loader2, QrCode } from 'lucide-react';
import { Person } from '../lib/eventData';
import { Editor } from '@tinymce/tinymce-react';
import QRCode from 'qrcode';
import { uploadImageToStorage } from '../lib/supabaseStorage';

interface EmailSectionProps {
  selectedAttendees: Person[];
  eventId: string;
  onEmailSend: (subject: string, content: string, recipients: Person[], attachments?: { [email: string]: { name: string; base64: string } }) => Promise<void>;
}

export function EmailSection({ selectedAttendees, eventId, onEmailSend }: EmailSectionProps) {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const editorRef = useRef<any>(null);

  // TinyMCE init configuration
  const tinymceInit = {
    menubar: false,
    plugins: ['link', 'image', 'code', 'lists', 'paste'],
    toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | code',
    paste_data_images: true,
    automatic_uploads: true,
    images_upload_handler: (blobInfo: any) => {
      return new Promise<string>(async (resolve, reject) => {
        try {
          const blob = blobInfo.blob();
          const fileName = blobInfo.filename();
  
          const publicUrl = await uploadImageToStorage(blob, {
            fileName,
            contentType: blob.type
          });
  
          resolve(publicUrl);
        } catch (err) {
          console.error('Image upload handler failed:', err);
          reject(err instanceof Error ? err.message : 'Image upload failed');
        }
      });
    }
  };

  // Generate QR code for a specific attendee as attachment
  const generateQRCodeForAttendee = async (attendee: Person): Promise<{ name: string; base64: string }> => {
    const qrData = {
      group_id: attendee.groupId,
      event_id: eventId
    };
    
    try {
      // Generate QR code as data URL (base64 image)
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Extract base64 data (remove the data:image/png;base64, prefix)
      const base64Data = qrCodeDataURL.split(',')[1];
      
      // Generate filename for this QR code
      const fileName = `QR-Code-${attendee.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      
      return {
        name: fileName,
        base64: base64Data
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      return;
    }

    setIsSending(true);
    try {
      let qrAttachments: { [email: string]: { name: string; base64: string } } = {};
      
      // Generate QR code attachments for each attendee
      for (const attendee of selectedAttendees) {
        try {
          const qrAttachment = await generateQRCodeForAttendee(attendee);
          qrAttachments[attendee.email] = qrAttachment;
        } catch (error) {
          console.error(`Failed to generate QR code for ${attendee.email}:`, error);
          // Continue without QR code for this attendee
        }
      }

      // Send the HTML as-is (contains embedded data URL images). No cid attachments conversion.
      const contentToSend = emailContent;
      await onEmailSend(emailSubject, contentToSend, selectedAttendees, qrAttachments);
      
      // Clear the form after successful sending
      setEmailSubject('');
      setEmailContent('');
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Email sending failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Selected Attendees
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compose and send an email to {selectedAttendees.length} selected attendee{selectedAttendees.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-subject">Subject</Label>
          <Input
            id="email-subject"
            placeholder="Enter email subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-content">Email Content</Label>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <QrCode className="w-3 h-3" />
              QR codes will be attached automatically
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
            <div className="flex items-start gap-2">
              <QrCode className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-green-800">
                <strong>QR Code Attachments</strong>
                <p className="mt-1 text-green-700">
                  Each recipient will receive a personalized QR code as an email attachment. 
                  The QR code contains their group_id and event_id for check-in purposes.
                </p>
              </div>
            </div>
          </div>
          <div className="border rounded-md">
            <Editor
              tinymceScriptSrc='/tinymce/tinymce.min.js'
              licenseKey='gpl'
              // apiKey='9c0hsld025el5g5wjkgdhxjw0avf1ncn0ikzbzf41guw1h9k'
              onInit={(_: any, editor: any) => (editorRef.current = editor)}
              value={emailContent}
              onEditorChange={(content: string) => setEmailContent(content)}
              init={tinymceInit}
            />
          </div>
        </div>

        {selectedAttendees.length > 0 && (
          <div className="space-y-2">
            <Label>Recipients ({selectedAttendees.length})</Label>
            <div className="bg-muted/50 rounded-md p-3 max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {selectedAttendees.map((attendee) => (
                  <span
                    key={attendee.id}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                  >
                    <Users className="w-3 h-3" />
                    {attendee.name} ({attendee.email})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSendEmail}
            disabled={selectedAttendees.length === 0 || !emailSubject.trim() || !emailContent.trim() || isSending}
            className="flex-1"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {isSending ? 'Sending Email...' : `Email Selected Attendees (${selectedAttendees.length})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}