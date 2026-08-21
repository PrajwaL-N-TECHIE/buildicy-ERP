const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Production State (Synced with Firebase erp-buildicy)
let users = [
  { id: 'user-1', fullName: 'Prajwal N', email: 'prajwal@company.com', title: 'Founder / CEO', roleTier: 'admin', active: true },
  { id: 'user-2', fullName: 'Mayur P', email: 'mayur@company.com', title: 'Co Founder / CTO', roleTier: 'admin', active: true },
  { id: 'user-3', fullName: 'Mizbha Fathima M', email: 'mizbha@company.com', title: 'Creative Lead', roleTier: 'reviewer', active: true },
  { id: 'user-4', fullName: 'Lathika J', email: 'lathika@company.com', title: 'CSL', roleTier: 'reviewer', active: true },
  { id: 'user-5', fullName: 'Shivasakthivel L', email: 'shiva@company.com', title: 'AI Engineer Intern', roleTier: 'contributor', active: true },
  { id: 'user-6', fullName: 'Rajeshwari M', email: 'rajeshwari@company.com', title: 'SDE Intern', roleTier: 'contributor', active: true },
  { id: 'user-7', fullName: 'Mohamed Parishkhan K', email: 'parish@company.com', title: 'AI Engineer Intern', roleTier: 'contributor', active: true },
  { id: 'user-8', fullName: 'Bhuvana Sree S', email: 'bhuvana@company.com', title: 'SDE Intern', roleTier: 'contributor', active: true },
  { id: 'user-9', fullName: 'Jamuna Rani', email: 'jamuna@company.com', title: 'SDE Intern', roleTier: 'contributor', active: true }
];

let projects = [
  { id: 'proj-1', name: 'Voice Agent', memberIds: ['user-1', 'user-2', 'user-3', 'user-5', 'user-6'], active: true, deadline: { dueDate: '2026-09-15', note: 'Voice AI Engine Sprint' } },
  { id: 'proj-2', name: 'Markeee', memberIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-7', 'user-8'], active: true, deadline: { dueDate: '2026-09-01', note: 'Marketing Launch Deck' } },
  { id: 'proj-3', name: 'Bizbrain', memberIds: ['user-1', 'user-2', 'user-4', 'user-9'], active: true, deadline: { dueDate: '2026-08-30', note: 'Reporting Engine MVP' } }
];

let tasks = [
  {
    id: 'task-1',
    contributorId: 'user-5',
    assignedBy: 'user-3',
    projectId: 'proj-1',
    taskDate: '2026-08-21',
    dueDate: '2026-08-20',
    description: 'Optimize WebRTC audio streaming latencies in Voice Agent handler',
    hours: 5,
    priority: 'low',
    status: 'In Progress',
    deliverableUrl: 'https://github.com/org/voice-agent/pull/42',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let auditLogs = [
  {
    id: 'audit-1',
    timestamp: new Date().toISOString(),
    actorId: 'user-1',
    actorName: 'Prajwal N',
    actorRole: 'admin',
    action: 'SYSTEM_INITIALIZED',
    target: 'ERP Backend WebSocket Server',
    details: 'Node.js Express & WebSocket Real-Time Server initialized.'
  }
];

// Live WebSocket Chat Messages Store
let chatMessages = [];

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Task Tracker Mini-ERP Backend Server with WebSockets',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeWebSockets: wss ? wss.clients.size : 0
  });
});

// User API Routes
app.get('/api/users', (req, res) => {
  res.json({ success: true, data: users });
});

// Project API Routes
app.get('/api/projects', (req, res) => {
  res.json({ success: true, data: projects });
});

// Tasks API Routes
app.get('/api/tasks', (req, res) => {
  res.json({ success: true, data: tasks });
});

// Analytics Summary API
app.get('/api/analytics/summary', (req, res) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const pendingReview = tasks.filter(t => t.status === 'Submitted' || t.status === 'Pending Admin').length;
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date('2026-08-21') && t.status !== 'Completed').length;
  const totalHours = tasks.reduce((sum, t) => sum + (t.hours || 0), 0);

  res.json({
    success: true,
    data: {
      totalTasks: total,
      completedTasks: completed,
      pendingReviewTasks: pendingReview,
      overdueTasks: overdue,
      totalHoursLogged: totalHours,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  });
});

// System Audit Logs API
app.get('/api/audit-logs', (req, res) => {
  res.json({ success: true, data: auditLogs });
});

// Create HTTP & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket Connection Handler
wss.on('connection', (ws, req) => {
  console.log('⚡ [WebSocket] New client connected to ERP Live Real-Time Chat Engine.');

  // Send current message history on connect
  ws.send(JSON.stringify({
    type: 'INIT_CHAT_HISTORY',
    messages: chatMessages
  }));

  ws.on('message', (data) => {
    try {
      const payload = JSON.parse(data.toString());
      
      if (payload.type === 'CHAT_MESSAGE') {
        const msg = {
          id: 'ws-msg-' + Date.now(),
          senderId: payload.senderId,
          channelId: payload.channelId || null,
          recipientId: payload.recipientId || null,
          text: payload.text,
          timestamp: new Date().toISOString()
        };
        chatMessages.push(msg);

        // Broadcast to all connected clients in real-time via WebSockets
        const broadcastData = JSON.stringify({
          type: 'NEW_CHAT_MESSAGE',
          message: msg
        });

        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastData);
          }
        });
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    console.log('⚡ [WebSocket] Client disconnected.');
  });
});

server.listen(PORT, () => {
  console.log(`🚀 ERP Backend Server with WebSockets listening on port ${PORT}`);
});
