import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage, User } from '@/types';
import { todayIso } from '@/lib/date';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Hash, 
  Send, 
  Search, 
  Plus, 
  Sparkles, 
  CheckCheck, 
  Users, 
  Paperclip, 
  Smile, 
  Flame, 
  ThumbsUp, 
  Heart,
  Lock,
  Globe
} from 'lucide-react';

interface ChannelItem {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
}

const INITIAL_CHANNELS: ChannelItem[] = [
  { id: '#general', name: 'general-announcements', description: 'Company-wide announcements & sprint updates', memberIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9'] },
  { id: '#voice-agent', name: 'voice-agent-squad', description: 'Voice AI Engine project team chat', memberIds: ['user-1', 'user-2', 'user-3', 'user-5', 'user-6'] },
  { id: '#markeee', name: 'markeee-creative', description: 'Markeee design & copy team chat', memberIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-7', 'user-8'] },
  { id: '#bizbrain', name: 'bizbrain-reporting', description: 'Bizbrain reporting engine dev chat', memberIds: ['user-1', 'user-2', 'user-4', 'user-9'] }
];

const EMOJI_PACKS = [
  {
    category: '🔥 Popular & Reactions',
    emojis: ['👍', '❤️', '🔥', '🚀', '✅', '🎉', '👏', '💯', '⭐', '🙌', '💪', '🙏', '👀', '✨', '👌']
  },
  {
    category: '😄 Smileys & Expressions',
    emojis: ['😀', '😂', '😎', '🥳', '🤔', '😍', '🤩', '😇', '🧐', '🤓', '🙃', '😏', '😜', '🤗', '🥳']
  },
  {
    category: '💼 Work & Productivity',
    emojis: ['💻', '⚡', '📈', '📌', '🎯', '🛠️', '📝', '💡', '📅', '🏆', '📊', '💼', '📦', '🔍', '🚀']
  },
  {
    category: '🤖 Tech & AI Squad',
    emojis: ['🤖', '🚀', '🧠', '💻', '⚙️', '📡', '🔒', '🌐', '🎨', '✨', '🔮', '🛡️', '⚡', '💾', '📱']
  },
  {
    category: '🍕 Break & Celebrations',
    emojis: ['☕', '🍕', '🎂', '🍔', '🍩', '🍹', '🍿', '🍦', '🎈', '🍾', '🎉', '🎊', '🎁', '🍰', '🧃']
  }
];

export const TeamChatView: React.FC = () => {
  const { currentUser, users, chatMessages, attendanceRecords, sendChatMessage } = useAuth();
  
  const [channels, setChannels] = useState<ChannelItem[]>(INITIAL_CHANNELS);
  const [activeTab, setActiveTab] = useState<'channels' | 'direct'>('channels');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('#general');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [messageReactions, setMessageReactions] = useState<{ [msgId: string]: string[] }>({});
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Create Channel Dialog State
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState<boolean>(false);
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [newChannelDesc, setNewChannelDesc] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  if (!currentUser) return null;

  const isDirectChat = selectedRecipientId !== null;
  const activeRecipient = isDirectChat ? users.find(u => u.id === selectedRecipientId) : null;
  const activeChannel = !isDirectChat ? channels.find(c => c.id === selectedChannelId) : null;

  // Filter messages for current chat target
  const visibleMessages = chatMessages.filter(msg => {
    if (isDirectChat) {
      return (
        (msg.senderId === currentUser.id && msg.recipientId === selectedRecipientId) ||
        (msg.senderId === selectedRecipientId && msg.recipientId === currentUser.id)
      );
    } else {
      return msg.channelId === selectedChannelId;
    }
  });

  // Auto-scroll to bottom on new visible message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length, selectedChannelId, selectedRecipientId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    await sendChatMessage({
      text: messageText.trim(),
      channelId: isDirectChat ? null : selectedChannelId,
      recipientId: isDirectChat ? selectedRecipientId : null
    });

    setMessageText('');
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    const existing = messageReactions[msgId] || [];
    setMessageReactions({
      ...messageReactions,
      [msgId]: [...existing, emoji]
    });
  };

  const handleOpenCreateChannel = () => {
    setNewChannelName('');
    setNewChannelDesc('');
    setSelectedMembers(users.map(u => u.id));
    setIsCreateChannelOpen(true);
  };

  const handleToggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleCreateChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const formattedName = newChannelName.toLowerCase().replace(/\s+/g, '-');
    const channelId = `#${formattedName}`;

    const newChan: ChannelItem = {
      id: channelId,
      name: formattedName,
      description: newChannelDesc.trim() || 'Custom group channel',
      memberIds: selectedMembers
    };

    setChannels([...channels, newChan]);
    setSelectedChannelId(channelId);
    setSelectedRecipientId(null);
    setIsCreateChannelOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const filteredUsers = users.filter(u => 
    u.id !== currentUser.id && 
    (u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.title.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-140px)] min-h-[620px] bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* Left Navigation Sidebar */}
      <div className="w-full md:w-72 border-r border-purple-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950 flex flex-col justify-between shrink-0">
        
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-210px)]">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">Team Messages</h3>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider block">Live WebSockets</span>
              </div>
            </div>

            {activeTab === 'channels' && (
              <Button size="icon" variant="ghost" onClick={handleOpenCreateChannel} className="h-7 w-7 text-purple-700 hover:bg-purple-100 rounded-lg">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Group Channels vs Direct DMs Tab Switcher */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('channels');
                setSelectedRecipientId(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'channels' 
                  ? 'bg-white dark:bg-slate-900 text-purple-950 dark:text-purple-300 shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Group Channels ({channels.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('direct');
                if (!selectedRecipientId && filteredUsers[0]) {
                  setSelectedRecipientId(filteredUsers[0].id);
                }
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'direct' 
                  ? 'bg-white dark:bg-slate-900 text-purple-950 dark:text-purple-300 shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Direct DMs
            </button>
          </div>

          {/* Render Active Tab List */}
          {activeTab === 'channels' ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 pb-1">
                <span>Public Channels</span>
              </div>

              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChannelId(ch.id);
                    setSelectedRecipientId(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    !isDirectChat && selectedChannelId === ch.id 
                      ? 'bg-purple-600 text-white shadow-xs font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Hash className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="truncate">{ch.name}</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-80 shrink-0">
                    {ch.memberIds.length} members
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <Input 
                  placeholder="Filter team member..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                {filteredUsers.map(user => {
                  const isCheckedIn = attendanceRecords.some(r => r.userId === user.id && r.date === todayIso() && r.status === 'checked_in');

                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedRecipientId(user.id)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                        isDirectChat && selectedRecipientId === user.id 
                          ? 'bg-purple-600 text-white shadow-xs font-bold' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 font-medium'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-7 w-7 border border-purple-200">
                          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName} /> : null}
                          <AvatarFallback className="bg-purple-600 text-white text-[10px] font-bold">
                            {getInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        {isCheckedIn && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Checked In & Active" />
                        )}
                      </div>

                      <div className="truncate text-left flex-1">
                        <div className="flex items-center justify-between">
                          <span className="block truncate leading-tight">{user.fullName}</span>
                        </div>
                        <span className={`text-[10px] block truncate ${isDirectChat && selectedRecipientId === user.id ? 'text-purple-100' : 'text-slate-400'}`}>
                          {user.title} {isCheckedIn ? '• Online' : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Logged In User Footer Profile Card */}
        <div className="p-3 border-t border-purple-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2.5">
          <Avatar className="h-8 w-8 border border-purple-300">
            {currentUser.avatarUrl ? <AvatarImage src={currentUser.avatarUrl} alt={currentUser.fullName} /> : null}
            <AvatarFallback className="bg-purple-600 text-white font-bold text-xs">
              {getInitials(currentUser.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="truncate flex-1">
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">{currentUser.fullName}</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active WebSocket
            </span>
          </div>
        </div>

      </div>

      {/* Right Main Live Chat Window */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
        
        {/* Top Chat Window Header */}
        <div className="h-14 px-5 border-b border-purple-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            {isDirectChat ? (
              <div className="relative">
                <Avatar className="h-8 w-8 border border-purple-300">
                  {activeRecipient?.avatarUrl ? <AvatarImage src={activeRecipient.avatarUrl} alt={activeRecipient.fullName} /> : null}
                  <AvatarFallback className="bg-purple-600 text-white font-bold text-xs">
                    {getInitials(activeRecipient?.fullName || 'U')}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="p-2 bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 rounded-xl">
                <Hash className="w-4 h-4" />
              </div>
            )}

            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {isDirectChat ? activeRecipient?.fullName : `#${activeChannel?.name}`}
                {isDirectChat && attendanceRecords.some(r => r.userId === activeRecipient?.id && r.date === todayIso() && r.status === 'checked_in') && (
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    ● Online
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 font-normal">
                {isDirectChat ? activeRecipient?.title : activeChannel?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="purple" className="text-[10px] font-bold">
              {isDirectChat ? '1-on-1 Direct DM' : `# ${activeChannel?.name}`}
            </Badge>
          </div>
        </div>

        {/* Scrollable Message Feed Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
          {visibleMessages.length === 0 ? (
            <div className="py-24 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-slate-800 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto shadow-2xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No messages in {isDirectChat ? activeRecipient?.fullName : `#${activeChannel?.name}`} yet.
              </p>
              <p className="text-xs text-slate-400 font-normal">
                Send a real-time message below to start team collaboration.
              </p>
            </div>
          ) : (
            visibleMessages.map(msg => {
              const sender = users.find(u => u.id === msg.senderId);
              const isOwnMessage = msg.senderId === currentUser.id;
              const reactions = messageReactions[msg.id] || [];

              return (
                <div 
                  key={msg.id} 
                  className={`flex space-x-3 max-w-[80%] group ${isOwnMessage ? 'ml-auto flex-row-reverse space-x-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8 border border-purple-200 shrink-0 mt-1">
                    {sender?.avatarUrl ? <AvatarImage src={sender.avatarUrl} alt={sender?.fullName} /> : null}
                    <AvatarFallback className="bg-purple-600 text-white text-[10px] font-bold">
                      {getInitials(sender?.fullName || 'U')}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`space-y-1 ${isOwnMessage ? 'items-end text-right' : ''}`}>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{sender?.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-2xs relative ${
                      isOwnMessage 
                        ? 'bg-purple-600 text-white rounded-tr-xs' 
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-slate-700'
                    }`}>
                      {msg.text}

                      {/* Quick Emoji Reaction Pill on Hover (Positioned Above Bubble) */}
                      <div className="absolute -top-8 right-2 opacity-0 group-hover:opacity-100 transition-all flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-purple-200 dark:border-slate-700 shadow-md z-20">
                        <button type="button" onClick={() => handleAddReaction(msg.id, '👍')} className="hover:scale-130 transition-transform text-sm cursor-pointer" title="Thumbs Up">👍</button>
                        <button type="button" onClick={() => handleAddReaction(msg.id, '❤️')} className="hover:scale-130 transition-transform text-sm cursor-pointer" title="Love">❤️</button>
                        <button type="button" onClick={() => handleAddReaction(msg.id, '🔥')} className="hover:scale-130 transition-transform text-sm cursor-pointer" title="Fire">🔥</button>
                        <button type="button" onClick={() => handleAddReaction(msg.id, '🚀')} className="hover:scale-130 transition-transform text-sm cursor-pointer" title="Rocket">🚀</button>
                        <button type="button" onClick={() => handleAddReaction(msg.id, '✅')} className="hover:scale-130 transition-transform text-sm cursor-pointer" title="Done">✅</button>
                        <button type="button" onClick={() => handleAddReaction(msg.id, '🎉')} className="hover:scale-130 transition-transform text-sm cursor-pointer" title="Celebrate">🎉</button>
                      </div>
                    </div>

                    {/* Reactions Display */}
                    {reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {reactions.map((r, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded-full">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Interactive Rich Emoji Picker Popover */}
        {isEmojiPickerOpen && (
          <div className="absolute bottom-16 right-6 z-50 w-80 p-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 shadow-2xl rounded-2xl space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-purple-600" /> Emoji Collection Packs
              </span>
              <button 
                type="button" 
                onClick={() => setIsEmojiPickerOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
              {EMOJI_PACKS.map((pack, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveEmojiCategory(idx)}
                  className={`px-2 py-1 rounded-lg font-semibold truncate shrink-0 ${
                    activeEmojiCategory === idx ? 'bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {pack.category.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-5 gap-1.5 p-1 max-h-44 overflow-y-auto">
              {EMOJI_PACKS[activeEmojiCategory].emojis.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setMessageText(prev => prev + emoji);
                    setIsEmojiPickerOpen(false);
                  }}
                  className="h-9 w-9 text-lg flex items-center justify-center hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Rich Floating Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-purple-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2 shrink-0 relative">
          <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-purple-600 transition-all">
            <Input 
              placeholder={isDirectChat ? `Message ${activeRecipient?.fullName}...` : `Message #${activeChannel?.name}...`}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs bg-transparent p-0 h-8 font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button 
              type="button" 
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="text-slate-400 hover:text-purple-600 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Open Emoji Collection Packs"
            >
              <Smile className="w-4 h-4 text-purple-600" />
            </button>
          </div>

          <Button type="submit" disabled={!messageText.trim()} className="h-9 px-4 font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md gap-1.5">
            <span>Send</span> <Send className="w-3.5 h-3.5" />
          </Button>
        </form>

      </div>

      {/* Create Channel Dialog */}
      <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 pr-6">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 rounded-xl">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Create Group Channel
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-normal">
                  Create a public channel for project teams or topic discussions.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateChannelSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Channel Name</Label>
              <Input 
                placeholder="e.g. ai-research-squad"
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">Channel Description</Label>
              <Input 
                placeholder="e.g. Discussions on Voice AI model fine-tuning"
                value={newChannelDesc}
                onChange={e => setNewChannelDesc(e.target.value)}
                className="h-9 text-xs border-slate-300 dark:border-slate-700 rounded-xl font-normal"
              />
            </div>

            {/* Invitee Member Selection */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Channel Members ({selectedMembers.length} selected)
              </Label>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {users.map(u => (
                  <label key={u.id} className="flex items-center space-x-2 p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 text-xs">
                    <input 
                      type="checkbox"
                      checked={selectedMembers.includes(u.id)}
                      onChange={() => handleToggleMember(u.id)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{u.fullName} ({u.title})</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateChannelOpen(false)} className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-300">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newChannelName.trim()} className="h-9 px-5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                Create Channel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};
