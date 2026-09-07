'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format, subDays } from 'date-fns';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MetricCards } from '@/components/MetricCards';
import { MetricsChart } from '@/components/MetricsChart';
import { CampaignTable } from '@/components/CampaignTable';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Dashboard() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, mutate } = useSWR(`/api/metrics?startDate=${startDate}&endDate=${endDate}`, fetcher, {
    refreshInterval: 60000 // auto refresh every minute
  });

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8">
      <DashboardHeader 
        startDate={startDate} 
        endDate={endDate} 
        onDateChange={handleDateChange} 
        onSync={() => mutate()} 
      />
      
      <MetricCards global={data?.global} />
      
      <MetricsChart global={data?.global} />
      
      <CampaignTable campaigns={data?.campaigns} />
      
    </main>
  );
}
