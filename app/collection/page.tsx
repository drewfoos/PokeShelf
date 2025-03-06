// app/collection/page.tsx
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from '@/lib/auth';
import CollectionPageClient from './client';

// This page needs to be dynamic since it shows user-specific data
export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  // Get the authenticated user
  const authUser = await getAuthenticatedUser();
  
  // If not authenticated, redirect to sign-in
  if (!authUser) {
    redirect("/sign-in?redirect=/collection");
  }

  // Render the client component
  return <CollectionPageClient />;
}