import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Mail, Users, Loader2 } from 'lucide-react';
import { Person } from '../lib/eventData';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EmailSectionProps {
  selectedAttendees: Person[];
  onEmailSend: (subject: string, content: string, recipients: Person[]) => Promise<void>;
}

export function EmailSection({ selectedAttendees, onEmailSend }: EmailSectionProps) {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ReactQuill modules configuration with toolbar options
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'blockquote', 'code-block', 'link', 'image'
  ];

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await onEmailSend(emailSubject, emailContent, selectedAttendees);
      
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
          <Label htmlFor="email-content">Email Content</Label>
          <div className="border rounded-md">
            <ReactQuill
              theme="snow"
              value={emailContent}
              onChange={setEmailContent}
              modules={modules}
              formats={formats}
              placeholder="Write your email message here..."
              style={{ minHeight: '200px' }}
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