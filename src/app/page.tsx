'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { format, subDays } from 'date-fns';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MetricCards } from '@/components/MetricCards';
import { MetricsChart } from '@/components/MetricsChart';
import { CampaignTable } from '@/components/CampaignTable';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setIsMounted(true);
  }, []);

  // Avoid fetching with empty dates during SSR/initial render
  const { data, mutate } = useSWR(
    isMounted ? `/api/metrics?startDate=${startDate}&endDate=${endDate}` : null, 
    fetcher, 
    { refreshInterval: 60000 }
  );

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (!isMounted) {
    return <main className="max-w-7xl mx-auto p-4 md:p-8 flex justify-center items-center min-h-screen text-zinc-500">Carregando dashboard...</main>;
  }

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
