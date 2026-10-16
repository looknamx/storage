'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import JobOrderForm from '@/components/marketing/JobOrderForm';
import { RefreshCw } from 'lucide-react';

export default function EditTransportJobPage() {
  const params = useParams();
  const id = params?.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/marketing/jobs/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('ไม่พบข้อมูลเที่ยววิ่งนี้');
        return res.json();
      })
      .then((data) => setJob(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        <p className="font-semibold">{error || 'ไม่พบข้อมูลเที่ยววิ่ง'}</p>
      </div>
    );
  }

  return <JobOrderForm initialData={job} isEdit={true} />;
}

