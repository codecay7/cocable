import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';

interface User {
  id: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface RecentUsersTableProps {
  users: User[];
  isLoading: boolean;
}

export const RecentUsersTable: React.FC<RecentUsersTableProps> = ({ users, isLoading }) => (
    <Card>
        <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>The last 5 users who created an account.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Joined</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : (
                        users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar_url ?? undefined} />
                                            <AvatarFallback>{user.first_name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-0.5">
                                            <p className="font-medium leading-tight">{user.first_name || 'N/A'} {user.last_name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user.id}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);