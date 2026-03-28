import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './config.js';
import { jiraRouter } from './routes/jira.routes.js';
import { sessionRouter } from './routes/session.routes.js';
import { registerSessionHandlers } from './sockets/session.socket.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:4200', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.use('/api/jira', jiraRouter);
app.use('/api/sessions', sessionRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);
  registerSessionHandlers(io, socket);
  socket.on('disconnect', () => console.log(`[socket] disconnected: ${socket.id}`));
});

httpServer.listen(config.port, () => {
  console.log(`[server] running on http://localhost:${config.port}`);
});
