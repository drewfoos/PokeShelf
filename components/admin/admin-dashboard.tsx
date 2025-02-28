'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { 
  Loader2, 
  RefreshCw, 
  Database, 
  ShieldAlert, 
  Users, 
  Search, 
  Shield,
  Check,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [setId, setSetId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedSet, setSelectedSet] = useState<string>('');
  
  // Popular sets for easy selection
  const popularSets = [
    { id: 'sv4', name: 'Scarlet & Violet—Paradox Rift' },
    { id: 'sv3pt5', name: 'Scarlet & Violet—Paldean Fates' },
    { id: 'sv3', name: 'Scarlet & Violet—Obsidian Flames' },
    { id: 'mcd21', name: 'McDonald\'s Collection 2021' },
    { id: 'mcd22', name: 'McDonald\'s Collection 2022' },
    { id: 'base1', name: 'Base Set' },
    { id: 'gym1', name: 'Gym Heroes' },
    { id: 'neo1', name: 'Neo Genesis' },
    { id: 'swsh10', name: 'Pokémon Go' },
    { id: 'swsh9', name: 'Brilliant Stars' },
  ];

  const handleSyncSets = async () => {
    setLoading('syncSets');
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncSets' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync sets');
      }
      
      setResults(data.result);
      toast.success(`Synced ${data.result.count} sets`);
    } catch (error) {
      console.error('Error syncing sets:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync sets');
    } finally {
      setLoading(null);
    }
  };

  const handleSyncSetCards = async () => {
    // Use either the input field or dropdown selection
    const finalSetId = setId.trim() || selectedSet;
    
    if (!finalSetId) {
      toast.error('Set ID is required');
      return;
    }
    
    setLoading('syncSetCards');
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncSetCards', setId: finalSetId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync set cards');
      }
      
      setResults(data.result);
      toast.success(`Synced ${data.result.count} cards from set ${finalSetId}`);
    } catch (error) {
      console.error('Error syncing set cards:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync set cards');
    } finally {
      setLoading(null);
    }
  };

  const handleSyncMcDonalds = async () => {
    setLoading('syncMcDonalds');
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncSpecificSets', type: 'mcdonalds' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync McDonald\'s sets');
      }
      
      setResults(data.result);
      toast.success('McDonald\'s sets have been synced');
    } catch (error) {
      console.error('Error syncing McDonald\'s sets:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync McDonald\'s sets');
    } finally {
      setLoading(null);
    }
  };

  const handleMakeAdmin = async () => {
    if (!userEmail.trim()) {
      toast.error('User email is required');
      return;
    }
    
    setLoading('makeAdmin');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setAdmin', email: userEmail.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to set user as admin');
      }
      
      toast.success(data.message || 'User is now an admin');
      
      // Clear the input
      setUserEmail('');
      
      // If we're viewing users, refresh the list
      if (searchTerm) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error making user admin:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set user as admin');
    } finally {
      setLoading(null);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSearchUsers = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  // Handler for set selection dropdown
  const handleSetSelection = (value: string) => {
    setSelectedSet(value);
    setSetId(''); // Clear the manual input when using dropdown
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your PokéShelf application and data.
        </p>
      </div>
      
      <Tabs defaultValue="data">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Data Sync
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>
        
        {/* Data Sync Tab */}
        <TabsContent value="data" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync All Sets</CardTitle>
                <CardDescription>
                  Sync all sets from the Pokémon TCG API to your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSyncSets} 
                  disabled={loading === 'syncSets'}
                  className="w-full"
                >
                  {loading === 'syncSets' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync All Sets
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sync Set Cards</CardTitle>
                <CardDescription>
                  Sync cards from a specific set
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select a Set</Label>
                    <Select onValueChange={handleSetSelection} value={selectedSet}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a set" />
                      </SelectTrigger>
                      <SelectContent>
                        {popularSets.map(set => (
                          <SelectItem key={set.id} value={set.id}>
                            {set.name} ({set.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="setId">Or enter Set ID manually</Label>
                    <Input 
                      id="setId" 
                      value={setId}
                      onChange={(e) => {
                        setSetId(e.target.value);
                        if (e.target.value) setSelectedSet(''); // Clear dropdown when using manual input
                      }}
                      placeholder="e.g., sv4"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSyncSetCards} 
                    disabled={loading === 'syncSetCards' || (!setId && !selectedSet)}
                    className="w-full"
                  >
                    {loading === 'syncSetCards' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Set Cards
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sync McDonald&apos;s Sets</CardTitle>
                <CardDescription>
                  Sync McDonald&apos;s promotional sets and cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSyncMcDonalds} 
                  disabled={loading === 'syncMcDonalds'}
                  className="w-full"
                >
                  {loading === 'syncMcDonalds' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync McDonald&apos;s Sets
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Sync Results</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Make User Admin</CardTitle>
                <CardDescription>
                  Grant admin privileges to a user by their email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">User Email</Label>
                    <Input 
                      id="userEmail" 
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <Button 
                    onClick={handleMakeAdmin} 
                    disabled={loading === 'makeAdmin'}
                    className="w-full"
                  >
                    {loading === 'makeAdmin' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Make Admin
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Search Users</CardTitle>
                <CardDescription>
                  Search for users by name or email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchUsers} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchTerm">Search</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="searchTerm" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Name or email"
                      />
                      <Button type="submit" disabled={loadingUsers}>
                        {loadingUsers ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* User Results */}
          {users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Found {users.length} users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <div className="grid grid-cols-4 font-medium bg-muted p-3 border-b">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Admin</div>
                    <div>Created</div>
                  </div>
                  <div className="divide-y">
                    {users.map((user: any) => (
                      <div key={user.id} className="grid grid-cols-4 p-3 items-center">
                        <div className="truncate" title={user.name}>{user.name}</div>
                        <div className="truncate" title={user.email}>{user.email}</div>
                        <div>
                          {user.isAdmin ? (
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" />
                              Yes
                            </div>
                          ) : (
                            <div className="flex items-center text-muted-foreground">
                              <X className="h-4 w-4 mr-1" />
                              No
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>
                Information about admin privileges and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center px-4 py-3 rounded-md bg-primary/10 text-primary border border-primary/20">
                <Shield className="h-5 w-5 mr-2 flex-shrink-0" />
                <div>
                  <p>You are currently signed in as an admin user.</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Admin Privileges Include:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Synchronizing card data from the Pokémon TCG API</li>
                  <li>Managing user accounts and admin access</li>
                  <li>Accessing system configuration and settings</li>
                  <li>Viewing detailed application statistics</li>
                </ul>
              </div>
              
              <div className="pt-2 border-t">
                <h3 className="font-medium mb-2">Security Best Practices:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Limit admin access to only trusted individuals</li>
                  <li>Use strong passwords and enable two-factor authentication</li>
                  <li>Log out when not actively managing the application</li>
                  <li>Regularly review the list of admin users</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}