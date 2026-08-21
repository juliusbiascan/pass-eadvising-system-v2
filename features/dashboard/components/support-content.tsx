'use client';

import Link from 'next/link';
import { useState } from 'react';
import { HelpCircle, Mail, MapPin, Clock } from 'lucide-react';

import { supportContact, supportFaqs } from '@/config/support';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function SupportContent() {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const mailtoHref = (() => {
    const params = new URLSearchParams();
    const fullSubject = subject.trim()
      ? `[PASS e-Advising] ${subject.trim()}`
      : '[PASS e-Advising] Support request';
    params.set('subject', fullSubject);
    const bodyLines = [
      message.trim(),
      '',
      '---',
      name.trim() ? `From: ${name.trim()}` : 'From: (not provided)',
      'Sent via PASS e-Advising Support',
    ].filter(Boolean);
    params.set('body', bodyLines.join('\n'));
    return `mailto:${supportContact.email}?${params.toString()}`;
  })();

  const canSend = message.trim().length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently asked questions
          </CardTitle>
          <CardDescription>Common issues for students and staff.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {supportFaqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-sm">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-4 text-sm text-muted-foreground">
            More detail in{' '}
            <Link href="/dashboard/documentation" className="font-medium text-primary underline-offset-4 hover:underline">
              Documentation
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>Reach the team during office hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <a
                  href={`mailto:${supportContact.email}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {supportContact.email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Office</p>
                <p className="text-muted-foreground">{supportContact.office}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Hours</p>
                <p className="text-muted-foreground">{supportContact.hours}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
            <CardDescription>
              Opens your email app with a pre-filled message to {supportContact.email}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-name">Your name (optional)</Label>
              <Input
                id="support-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-subject">Subject</Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Cannot submit evaluation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-message">Message</Label>
              <Textarea
                id="support-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue, including your student ID if applicable."
                rows={5}
                required
              />
            </div>
            {canSend ? (
              <Button asChild>
                <a href={mailtoHref}>
                  <Mail className="mr-2 h-4 w-4" />
                  Open in email app
                </a>
              </Button>
            ) : (
              <Button type="button" disabled>
                <Mail className="mr-2 h-4 w-4" />
                Open in email app
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
