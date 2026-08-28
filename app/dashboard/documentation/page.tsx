import { Metadata } from 'next';

import { DocumentationContent } from '@/features/dashboard/components/documentation-content';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Admin, head, and student guides — records, curriculum shift, evaluation, and portal workflows',
};

export default function DocumentationPage() {
  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documentation</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Guides for administrators, department heads, and students using PASS e-Advising:
            master academic records, curriculum shift, Excel import, prerequisite rules,
            term evaluation and approval, and the student portal. Official enrollment remains
            with the registrar.
          </p>
        </div>
        <DocumentationContent />
      </div>
    </div>
  );
}
