import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShieldCheck, History, Search, FileText, Lock } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { currentUser, auditLogs } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (currentUser?.roleTier !== 'admin') {
    return null;
  }

  const filteredLogs = auditLogs.filter(log => 
    log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-xl border border-border/80 shadow-2xs">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Enterprise Compliance & Audit Logs
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Immutable audit record tracking every security event, deadline modification, role change, and task approval.
          </p>
        </div>

        <div className="relative w-full sm:w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input 
            placeholder="Search audit logs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="border border-border/80 shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/70 text-xs">
                <TableHead className="w-[170px] py-3.5 px-5 font-bold">Timestamp</TableHead>
                <TableHead className="w-[180px] py-3.5 px-4 font-bold">Actor</TableHead>
                <TableHead className="w-[160px] py-3.5 px-4 font-bold">Event Action</TableHead>
                <TableHead className="w-[200px] py-3.5 px-4 font-bold">Target Entity</TableHead>
                <TableHead className="py-3.5 px-5 font-bold">Compliance Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60 text-xs font-medium">
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No matching audit entries found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(log => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3.5 px-5 font-mono text-[11px] text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 font-semibold text-foreground">
                      <div>{log.actorName}</div>
                      <span className="text-[10px] text-muted-foreground font-normal capitalize">Role: {log.actorRole}</span>
                    </TableCell>

                    <TableCell className="py-3.5 px-4 font-mono font-bold text-primary text-[11px]">
                      {log.action}
                    </TableCell>

                    <TableCell className="py-3.5 px-4 font-semibold text-foreground">
                      {log.target}
                    </TableCell>

                    <TableCell className="py-3.5 px-5 text-muted-foreground text-xs">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};
