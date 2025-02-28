import React from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from "@clerk/nextjs/server";
import { isAdmin } from '@/lib/admin';
import AdminDashboard from '@/components/admin/admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Ensure user is authenticated
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in?redirect=/admin');
  }
  
  // Check if user is an admin
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    redirect('/');
  }
  
  return <AdminDashboard />;
}