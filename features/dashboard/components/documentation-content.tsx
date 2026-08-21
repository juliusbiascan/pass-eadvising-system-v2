import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';

import {
  documentationQuickLinks,
  documentationSections,
} from '@/config/documentation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function DocumentationContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick links
          </CardTitle>
          <CardDescription>Jump to common areas of the application.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {documentationQuickLinks.map((link) => (
            <Button key={link.href} variant="outline" size="sm" asChild>
              <Link href={link.href}>{link.title}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={['overview', 'admin']} className="space-y-4">
        {documentationSections.map((section) => (
          <Card key={section.id}>
            <AccordionItem value={section.id} className="border-0">
              <CardHeader className="pb-2">
                <AccordionTrigger className="py-0 hover:no-underline">
                  <div className="text-left">
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription className="mt-1 font-normal">
                      {section.description}
                    </CardDescription>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-6 pt-0">
                  {section.guides.map((guide) => (
                    <div key={guide.title} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{guide.title}</h3>
                        {guide.href ? (
                          <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                            <Link href={guide.href}>
                              Open
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{guide.summary}</p>
                      <ol className="list-decimal space-y-1 pl-5 text-sm">
                        {guide.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>

      <p className="text-xs text-muted-foreground">
        Covers implemented modules: dashboard, students, records, curriculum import,
        reports, terms, settings, student portal, and evaluation engine. Product scope
        is defined in{' '}
        <Badge variant="outline" className="mx-1">
          prd.md
        </Badge>
        .
      </p>
    </div>
  );
}
