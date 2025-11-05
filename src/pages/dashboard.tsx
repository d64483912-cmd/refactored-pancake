import { authClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Ban,
  Search,
  MoreVertical,
  UserCog,
  ShieldCheck,
  ShieldOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason?: string;
  banExpires?: string;
  createdAt: string;
}

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;

  // Usage dialog state
  const [usageUser, setUsageUser] = useState<User | null>(null);
  const openUsage = (user: User) => {
    setUsageUser(user);
  };

  const usageQuery = useQuery({
    queryKey: ["admin-usage", usageUser?.id],
    enabled: !!usageUser?.id,
    queryFn: async () => {
      if (!usageUser) return null;
      const res = await apiClient.admin.usage[":userId"].$get({ param: { userId: usageUser.id } });
      const json = await res.json();
      if (!res.ok) throw new Error("Failed to load usage");
      return json as { usage: { messages: number; apiCalls: number }; limits?: { messages?: number; apiCalls?: number } };
    },
  });

  // Edit user dialog state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  // Ban user dialog state
  const [banningUser, setBanningUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("7");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const response = await authClient.admin.listUsers({
        query: { limit: pageSize, offset },
      });
      
      if (response.data) {
        setUsers(response.data.users as User[]);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSetRole = async (userId: string, newRole: "user" | "admin") => {
    try {
      await authClient.admin.setRole({ userId, role: newRole });
      fetchUsers();
    } catch (error) {
      console.error("Failed to set role:", error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await authClient.admin.updateUser({
        userId: editingUser.id,
        data: { name: editName, role: editRole },
      });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleBanUser = async () => {
    if (!banningUser) return;
    try {
      const banExpiresIn = parseInt(banDays) * 24 * 60 * 60; // Convert days to seconds
      await authClient.admin.banUser({
        userId: banningUser.id,
        banReason: banReason || "No reason provided",
        banExpiresIn,
      });
      setBanningUser(null);
      setBanReason("");
      setBanDays("7");
      fetchUsers();
    } catch (error) {
      console.error("Failed to ban user:", error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await authClient.admin.unbanUser({ userId });
      fetchUsers();
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await authClient.admin.removeUser({ userId });
      fetchUsers();
    } catch (error) {
      console.error("Failed to remove user:", error);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q)
        );
      }),
    [users, searchQuery]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">A clear view of your users.</p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-semibold tabular-nums">{total}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">{users.filter((u) => u.role === "admin").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Banned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">{users.filter((u) => u.banned).length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">Users</CardTitle>
              <CardDescription>Manage roles and access with ease.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mb-3" />
                  <p className="text-sm">Loading users…</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.banned ? (
                              <div className="inline-flex items-center gap-2 text-destructive">
                                <span className="h-2 w-2 rounded-full bg-destructive" />
                                Banned
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 text-green-600">
                                <span className="h-2 w-2 rounded-full bg-green-600" />
                                Active
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openUsage(user)}>
                              View
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingUser(user);
                                    setEditName(user.name);
                                    setEditRole(user.role);
                                  }}
                                >
                                  <UserCog className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSetRole(
                                      user.id,
                                      user.role === "admin" ? "user" : "admin"
                                    )
                                  }
                                >
                                  {user.role === "admin" ? (
                                    <>
                                      <ShieldOff className="mr-2 h-4 w-4" /> Remove admin
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="mr-2 h-4 w-4" /> Make admin
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.banned ? (
                                  <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                                    <ShieldOff className="mr-2 h-4 w-4" /> Unban
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setBanningUser(user)}>
                                    <Ban className="mr-2 h-4 w-4" /> Ban
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete user</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete {user.name}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemoveUser(user.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span> to {" "}
                      <span className="font-medium text-foreground">{Math.min(page * pageSize, total)}</span> of {" "}
                      <span className="font-medium text-foreground">{total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </Button>
                      <span className="text-sm text-muted-foreground">Page {page} of {totalPages || 1}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages}
                        className="gap-1"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Input
                id="edit-role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                placeholder="user, admin, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Dialog */}
      <Dialog open={!!usageUser} onOpenChange={() => setUsageUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Usage</DialogTitle>
            <DialogDescription>
              {usageUser ? `${usageUser.name || usageUser.email}` : ''}
            </DialogDescription>
          </DialogHeader>
          {usageQuery.isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : usageQuery.isError ? (
            <div className="text-sm text-destructive">{(usageQuery.error as Error)?.message || 'Unable to load usage'}</div>
          ) : usageQuery.data ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">Messages</div>
                <div className="text-sm font-medium">
                  {usageQuery.data.usage.messages.toLocaleString()}
                  {usageQuery.data.limits?.messages ? (
                    <span className="text-muted-foreground"> / {usageQuery.data.limits.messages.toLocaleString()}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">API Calls</div>
                <div className="text-sm font-medium">
                  {usageQuery.data.usage.apiCalls.toLocaleString()}
                  {usageQuery.data.limits?.apiCalls ? (
                    <span className="text-muted-foreground"> / {usageQuery.data.limits.apiCalls.toLocaleString()}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No usage data</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={!!banningUser} onOpenChange={() => setBanningUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Temporarily ban {banningUser?.name} from accessing the application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ban-reason">Reason</Label>
              <Input
                id="ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Spamming, inappropriate behavior, etc."
              />
            </div>
            <div>
              <Label htmlFor="ban-days">Ban Duration (days)</Label>
              <Input
                id="ban-days"
                type="number"
                value={banDays}
                onChange={(e) => setBanDays(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanningUser(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
