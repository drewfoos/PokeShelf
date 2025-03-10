'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  X,
  DollarSign,
  Clock,
  AlertTriangle
} from 'lucide-react';


interface SyncResult {
  success: boolean;
  count?: number;
  total?: number;
  failed?: number;
  failedCardIds?: string[];
  setCount?: number;
  successfulSets?: number;
  failedSets?: number;
  totalCards?: number;
  phase?: string;
  progress?: number;
  sets?: Array<{
    id: string;
    name?: string;
    count?: number;
    error?: unknown;
    success?: boolean;
  }>;
  error?: unknown;
}

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<SyncResult | null>(null);
  const [setId, setSetId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [operationStartTime, setOperationStartTime] = useState<number | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

  // Function to start the progress animation
  const startProgressAnimation = () => {
    // Clear any existing interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    // Reset progress
    setProgressValue(0);
    
    // Create a new interval that increments the progress
    const interval = setInterval(() => {
      setProgressValue((prev) => {
        // Slowly increment up to 90% (the last 10% is when we get the response)
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        // Slower increment as we get higher
        const increment = Math.max(0.5, 5 * (1 - prev / 100));
        return Math.min(90, prev + increment);
      });
    }, 500);
    
    setProgressInterval(interval);
    return interval;
  };

  // Function to stop the progress animation and complete it
  const completeProgressAnimation = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
    setProgressValue(100);
    
    // Reset after a delay
    setTimeout(() => {
      setProgressValue(0);
    }, 1000);
  };

  // Helper to format duration from milliseconds
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleSyncSets = async () => {
    setLoading('syncSets');
    setOperationStartTime(Date.now());
    startProgressAnimation();
    
    try {
      toast.info('Starting synchronization of all sets...');
      
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
      
      // Calculate the duration
      const duration = data.executionTimeMs || (Date.now() - (operationStartTime || Date.now()));
      
      toast.success(`Synced ${data.result.count} sets in ${formatDuration(duration)}`);
    } catch (error) {
      console.error('Error syncing sets:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync sets');
    } finally {
      setLoading(null);
      completeProgressAnimation();
    }
  };

  const handleSyncSetCards = async () => {
    // Use the input field
    const finalSetId = setId.trim();
    
    if (!finalSetId) {
      toast.error('Set ID is required');
      return;
    }
    
    setLoading('syncSetCards');
    setOperationStartTime(Date.now());
    startProgressAnimation();
    
    try {
      toast.info(`Starting sync for set: ${finalSetId}. This may take a few minutes...`);
      
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
      
      // Calculate the duration
      const duration = data.executionTimeMs || (Date.now() - (operationStartTime || Date.now()));
      
      if (data.result.success) {
        toast.success(
          `Synced ${data.result.count} cards from set ${finalSetId} in ${formatDuration(duration)}`
        );
        
        if (data.result.failed && data.result.failed > 0) {
          toast.warning(`${data.result.failed} cards failed to sync. See results for details.`);
        }
      } else {
        toast.error(`Failed to sync cards from set ${finalSetId}`);
      }
    } catch (error) {
      console.error('Error syncing set cards:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync set cards');
    } finally {
      setLoading(null);
      completeProgressAnimation();
    }
  };

  const handleSyncSetsAndCards = async () => {
    setLoading('syncSetsAndCards');
    setOperationStartTime(Date.now());
    startProgressAnimation();
    
    try {
      toast.info("Starting comprehensive sync of all sets and their cards. This will take a long time...");
      
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncSetsAndCards' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to sync sets and cards");
      }
      
      setResults(data.result);
      
      // Calculate the duration
      const duration = data.executionTimeMs || (Date.now() - (operationStartTime || Date.now()));
      
      if (data.result.success) {
        toast.success(
          `Comprehensive sync completed: ${data.result.successfulSets}/${data.result.setCount} sets with ${data.result.totalCards} cards in ${formatDuration(duration)}`
        );
        
        if (data.result.failedSets && data.result.failedSets > 0) {
          toast.warning(`${data.result.failedSets} sets failed to sync. See results for details.`);
        }
      } else {
        toast.error(`Failed to complete comprehensive sync: ${data.result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error in comprehensive sync:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync sets and cards");
    } finally {
      setLoading(null);
      completeProgressAnimation();
    }
  };

  const handleUpdatePrices = async () => {
    setLoading('updatePrices');
    setOperationStartTime(Date.now());
    startProgressAnimation();
    
    try {
      toast.info("Starting price update. This may take several minutes...");
      
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePrices' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update card prices");
      }
      
      setResults(data.result);
      
      // Calculate the duration
      const duration = data.executionTimeMs || (Date.now() - (operationStartTime || Date.now()));
      
      toast.success(
        `Updated prices for ${data.result.count || 0} cards in ${formatDuration(duration)}`
      );
    } catch (error) {
      console.error("Error updating prices:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update card prices");
    } finally {
      setLoading(null);
      completeProgressAnimation();
    }
  };

  const handleCheckNewSets = async () => {
    setLoading('checkNewSets');
    setOperationStartTime(Date.now());
    startProgressAnimation();
    
    try {
      toast.info("Checking for new sets...");
      
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkNewSets' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to check for new sets");
      }
      
      setResults(data.result);
      
      // Calculate the duration
      const duration = data.executionTimeMs || (Date.now() - (operationStartTime || Date.now()));
      
      if (data.result.count && data.result.count > 0 && data.result.importedSets) {
        const sets = data.result.importedSets as Array<{id: string; name: string; cardCount: number}>;
        const totalCards = sets.reduce((sum, set) => sum + (set.cardCount || 0), 0);
        
        toast.success(
          `Found and imported ${data.result.count} new sets with ${totalCards} cards in ${formatDuration(duration)}`
        );
      } else {
        toast.success(`No new sets to import - database is up to date`);
      }
    } catch (error) {
      console.error("Error checking for new sets:", error);
      toast.error(error instanceof Error ? error.message : "Failed to check for new sets");
    } finally {
      setLoading(null);
      completeProgressAnimation();
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
        void fetchUsers();
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
    void fetchUsers();
  };

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

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
                <CardTitle>Sync Sets</CardTitle>
                <CardDescription>
                  Sync all sets from the Pokémon TCG API to your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={handleSyncSets} 
                    disabled={loading !== null}
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
                  
                  <Button 
                    onClick={handleCheckNewSets} 
                    disabled={loading !== null}
                    className="w-full"
                    variant="outline"
                  >
                    {loading === 'checkNewSets' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Check for New Sets
                      </>
                    )}
                  </Button>
                </div>
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
                    <Label htmlFor="setId">Enter Set ID</Label>
                    <Input 
                      id="setId" 
                      value={setId}
                      onChange={(e) => setSetId(e.target.value)}
                      placeholder="e.g., sv4"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSyncSetCards} 
                    disabled={loading !== null || !setId}
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
                <CardTitle>Comprehensive Sync</CardTitle>
                <CardDescription>
                  Sync all sets and their cards in one operation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleSyncSetsAndCards} 
                  disabled={loading !== null}
                  className="w-full"
                >
                  {loading === 'syncSetsAndCards' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing All Sets & Cards...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync All Sets & Cards
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleUpdatePrices} 
                  disabled={loading !== null}
                  className="w-full"
                  variant="outline"
                >
                  {loading === 'updatePrices' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Prices...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Update Card Prices
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Operation Progress */}
          {loading && (
            <Card>
              <CardContent className="py-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {loading === 'syncSets' && 'Syncing all sets...'}
                      {loading === 'syncSetCards' && 'Syncing set cards...'}
                      {loading === 'syncSetsAndCards' && 'Syncing all sets and their cards...'}
                      {loading === 'updatePrices' && "Updating card prices..."}
                      {loading === 'checkNewSets' && "Checking for new sets..."}
                    </span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  
                  <Progress value={progressValue} className="h-2" />
                  
                  <p className="text-xs text-muted-foreground">
                    {operationStartTime && (
                      <>Operation running for {formatDuration(Date.now() - operationStartTime)}</>
                    )}
                    {' '}This may take several minutes depending on the operation.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Results */}
          {results && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Sync Results</CardTitle>
                {results.success !== undefined && (
                  <Badge 
                    variant="outline" 
                    className={
                      results.success 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {results.success ? 'Success' : 'Failed'}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Success Stats Summary */}
                {results.success && (
                  <div className="space-y-4">
                    {results.count !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Items processed:</span>
                        <span className="font-bold">{results.count}</span>
                      </div>
                    )}
                    
                    {results.total !== undefined && results.failed !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Success rate:</span>
                        <span className="font-bold">
                          {results.total > 0 
                            ? `${Math.round(((results.total - results.failed) / results.total) * 100)}%` 
                            : 'N/A'}
                        </span>
                      </div>
                    )}

                    {/* Comprehensive sync results */}
                    {results.setCount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total sets:</span>
                        <span className="font-bold">{results.setCount}</span>
                      </div>
                    )}

                    {results.successfulSets !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Successful sets:</span>
                        <span className="font-bold">{results.successfulSets}</span>
                      </div>
                    )}

                    {results.failedSets !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Failed sets:</span>
                        <span className="font-bold">{results.failedSets}</span>
                      </div>
                    )}

                    {results.totalCards !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total cards synced:</span>
                        <span className="font-bold">{results.totalCards}</span>
                      </div>
                    )}
                    
                    {results.sets && results.sets.length > 0 && (
                      <>
                        <div className="font-medium">Processed sets:</div>
                        <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
                          {results.sets.map((set, idx) => (
                            <div key={idx} className="p-2 flex justify-between items-center">
                              <div>
                                <span className="font-medium">{set.id}</span>
                                {set.name && (
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    ({set.name})
                                  </span>
                                )}
                              </div>
                              
                              {set.error || !set.success ? (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              ) : (
                                <span className="font-medium">{set.count || 0} cards</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* Failed Cards List */}
                    {Array.isArray(results.failedCardIds) && results.failedCardIds.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-medium text-red-600">
                          Failed Cards ({results.failedCardIds.length})
                        </div>
                        <div className="max-h-40 overflow-y-auto p-2 border rounded-md bg-red-50 text-sm">
                          {results.failedCardIds.map((cardId, idx) => (
                            <div key={idx} className="mb-1">
                              {String(cardId)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Error Details */}
                    {!results.success && results.error && (
                      <div className="p-4 border rounded-md bg-red-50 text-red-700 overflow-x-auto">
                        <div className="font-medium mb-2">Error:</div>
                        <div className="text-sm font-mono">
                          {typeof results.error === 'string'
                            ? results.error
                            : JSON.stringify(results.error, null, 2)}
                        </div>
                      </div>
                    )}
                    
                    {/* Full Raw Results */}
                    <div className="space-y-2">
                      <details>
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                          Show raw results
                        </summary>
                        <pre className="mt-2 bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                          {JSON.stringify(results, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}
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
                    {users.map((user) => (
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