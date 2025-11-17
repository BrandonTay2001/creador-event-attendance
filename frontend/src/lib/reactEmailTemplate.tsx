import React from 'react';
import { render } from '@react-email/render';
import { Html } from '@react-email/html';
import { Body } from '@react-email/body';
import { Container } from '@react-email/container';
import { Section } from '@react-email/section';
import { Text } from '@react-email/text';

interface EmailTemplateProps {
  subject?: string;
  bodyHtml: string; // HTML string (already contains cid: references for inline images)
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({ subject, bodyHtml }) => {
  return (
    <Html>
      <Body>
        <Container>
          {subject && (
            <Section>
              <Text style={{ fontSize: '20px', fontWeight: 600 }}>{subject}</Text>
            </Section>
          )}

          <Section>
            {/* Insert pre-rendered HTML body. It may contain cid: references for inline images. */}
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export const renderEmail = (bodyHtml: string, subject?: string): string => {
  return render(<EmailTemplate subject={subject} bodyHtml={bodyHtml} />);
};
