import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ShieldCheck, Download, Search, Hash, Lock, Flag } from 'lucide-react';

export const ChatLogsViewer: React.FC = () => {
  const { chatMessages, users } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'channels' | 'direct'>('all');

  const filteredMessages = chatMessages.filter(msg => {
    const sender = users.find(u => u.id === msg.senderId);
    const textMatch = msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (sender && sender.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!textMatch) return false;

    if (selectedFilter === 'channels') return msg.channelId !== null && msg.channelId !== undefined;
    if (selectedFilter === 'direct') return msg.recipientId !== null && msg.recipientId !== undefined;
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Message ID', 'Timestamp', 'Sender Name', 'Sender Role', 'Channel / Recipient', 'Message Content'];
    const rows = filteredMessages.map(msg => {
      const sender = users.find(u => u.id === msg.senderId);
      const recipient = msg.recipientId ? users.find(u => u.id === msg.recipientId) : null;
      const channelOrRecipient = msg.channelId ? msg.channelId : recipient ? `@${recipient.fullName}` : 'N/A';

      return [
        msg.id,
        msg.timestamp,
        `"${sender?.fullName || 'Unknown'}"`,
        sender?.roleTier || '',
        `"${channelOrRecipient}"`,
        `"${msg.text.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chat_compliance_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 bg-white border border-purple-100 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Admin Chat Compliance & Audit Logs</h2>
              <p className="text-xs text-slate-500 font-normal">Monitor team group channels and 1-on-1 direct message compliance.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              className="text-xs h-9 px-3.5 font-medium gap-1.5 border-purple-200 text-purple-950 hover:bg-purple-50 rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" /> Export Chat Logs (CSV)
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-purple-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <Input 
              placeholder="Search chat content or sender..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-purple-200 rounded-xl"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === 'all' ? 'bg-white text-purple-950 shadow-2xs' : 'text-slate-500'
              }`}
            >
              All Messages ({chatMessages.length})
            </button>
            <button
              onClick={() => setSelectedFilter('channels')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === 'channels' ? 'bg-white text-purple-950 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Group Channels
            </button>
            <button
              onClick={() => setSelectedFilter('direct')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === 'direct' ? 'bg-white text-purple-950 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Direct DMs
            </button>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <Card className="border border-purple-100 bg-white shadow-2xs rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-purple-50/50 border-b border-purple-100">
              <TableRow className="border-b border-purple-100">
                <TableHead className="py-3 px-4 font-bold text-xs text-purple-950 uppercase tracking-wider">Timestamp</TableHead>
                <TableHead className="py-3 px-4 font-bold text-xs text-purple-950 uppercase tracking-wider">Sender</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-purple-950 uppercase tracking-wider">Channel / Recipient</TableHead>
                <TableHead className="py-3 px-4 font-bold text-xs text-purple-950 uppercase tracking-wider">Message Content</TableHead>
                <TableHead className="py-3 px-3 font-bold text-xs text-purple-950 uppercase tracking-wider text-right">Compliance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-purple-50">
              {filteredMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-slate-400 text-xs font-normal">
                    No chat log entries match the search filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMessages.map(msg => {
                  const sender = users.find(u => u.id === msg.senderId);
                  const recipient = msg.recipientId ? users.find(u => u.id === msg.recipientId) : null;
                  const isChannel = msg.channelId !== null && msg.channelId !== undefined;

                  return (
                    <TableRow key={msg.id} className="hover:bg-purple-50/30 transition-colors">
                      
                      <TableCell className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(msg.timestamp).toLocaleString()}
                      </TableCell>

                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <Avatar className="h-7 w-7 border border-purple-200">
                            {sender?.avatarUrl ? <AvatarImage src={sender.avatarUrl} alt={sender.fullName} /> : null}
                            <AvatarFallback className="bg-purple-600 text-white font-bold text-[10px]">
                              {getInitials(sender?.fullName || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">{sender?.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{sender?.title}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 px-3">
                        {isChannel ? (
                          <Badge variant="purple" className="text-[10px] font-bold gap-1">
                            <Hash className="w-3 h-3" /> {msg.channelId}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            @{recipient?.fullName}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5 px-4">
                        <p className="text-xs font-normal text-slate-800 leading-relaxed max-w-md">{msg.text}</p>
                      </TableCell>

                      <TableCell className="py-3.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Compliant
                        </span>
                      </TableCell>

                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};
