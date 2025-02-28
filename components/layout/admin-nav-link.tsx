'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // Create a simple endpoint to check admin status
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdminStatus();
  }, []);

  // Only show the link if user is confirmed to be an admin
  if (isLoading || !isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="text-sm font-medium transition-colors hover:text-primary"
    >
      <div className="flex items-center gap-1">
        <Shield className="h-4 w-4" />
        <span>Admin</span>
      </div>
    </Link>
  );
}