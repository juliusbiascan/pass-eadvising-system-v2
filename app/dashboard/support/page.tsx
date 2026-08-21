import { Metadata } from 'next';

import { SupportContent } from '@/features/dashboard/components/support-content';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Help, FAQs, and contact for PASS e-Advising',
};

export default function SupportPage() {
  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Support</h2>
          <p className="text-sm text-muted-foreground">
            FAQs and contact options for technical or academic advising issues.
          </p>
        </div>
        <SupportContent />
      </div>
    </div>
  );
}
