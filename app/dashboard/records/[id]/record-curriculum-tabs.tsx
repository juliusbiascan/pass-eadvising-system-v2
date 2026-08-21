'use client';

import type { ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PriorTab = {
  id: string;
  label: string;
  content: ReactNode;
};

interface RecordCurriculumTabsProps {
  currentLabel: string;
  current: ReactNode;
  prior: PriorTab[];
}

export default function RecordCurriculumTabs({
  currentLabel,
  current,
  prior,
}: RecordCurriculumTabsProps) {
  if (prior.length === 0) {
    return current;
  }

  return (
    <Tabs defaultValue="current" className="gap-4">
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="current">{currentLabel}</TabsTrigger>
        {prior.map((item) => (
          <TabsTrigger key={item.id} value={item.id}>
            Prior · {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="current" className="space-y-4">
        {current}
      </TabsContent>
      {prior.map((item) => (
        <TabsContent key={item.id} value={item.id} className="space-y-4">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
