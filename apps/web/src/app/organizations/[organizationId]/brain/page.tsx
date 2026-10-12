'use client';

import { use, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadarView } from '@/components/brain/RadarView';
import { CompassView, DEFAULT_EMPLOYEE } from '@/components/brain/CompassView';
import { StoryView } from '@/components/brain/StoryView';

interface PageProps {
  params: Promise<{ organizationId: string }>;
}

export default function BrainPage({ params }: PageProps) {
  const { organizationId } = use(params);
  const [employeeId, setEmployeeId] = useState(DEFAULT_EMPLOYEE);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:pl-20">
      <PageHeader
        title="Compass"
        description="Forgeline's company brain: it watches the market, finds the gaps in our roadmap and code, and shows each person which piece is their promotion."
      />
      <Tabs defaultValue="radar">
        <TabsList>
          <TabsTrigger value="radar">Radar</TabsTrigger>
          <TabsTrigger value="compass">Compass</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
        </TabsList>
        <TabsContent value="radar" className="pt-4">
          <RadarView organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="compass" className="pt-4">
          <CompassView organizationId={organizationId} employeeId={employeeId} onEmployeeChange={setEmployeeId} />
        </TabsContent>
        <TabsContent value="story" className="pt-4">
          <StoryView organizationId={organizationId} employeeId={employeeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
