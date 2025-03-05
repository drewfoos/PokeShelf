import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import AdminDashboard from '@/components/admin/admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Use our auth helper to check if the user is authenticated
  const authUser = await getAuthenticatedUser();
  
  // If not authenticated, redirect to sign-in
  if (!authUser) {
    redirect('/sign-in?redirect=/admin');
  }
  
  // Check if user is an admin
  const userIsAdmin = await isAdmin();
  
  // If not an admin, redirect to home
  if (!userIsAdmin) {
    redirect('/');
  }
  
  return <AdminDashboard />;
}