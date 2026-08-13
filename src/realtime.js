/**
 * Realtime Update Broadcasting
 *
 * Lets the admin panel stay live without manual refreshing: whenever a
 * resource changes (a product is created, a testimonial deleted, content
 * published, etc.) we broadcast a lightweight "this resource changed"
 * signal over Socket.IO. Connected admin tabs react by re-fetching that
 * resource's own REST endpoint.
 *
 * The socket carries no actual data — just an event name — so it doesn't
 * need per-connection authentication; the real data still only ever comes
 * back through the existing authenticated/public REST endpoints.
 */

import { Server } from 'socket.io';
import logger from './utils/logger.js';

let io = null;

export const initRealtime = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      // Nothing to clean up — sockets don't hold any per-client state
    });
  });

  logger.info('Realtime (Socket.IO) ready');

  return io;
};

/**
 * Broadcast that a resource changed to every connected admin tab.
 *
 * @param {string} resource - e.g. 'products', 'testimonials', 'content'
 */
export const emitUpdate = (resource) => {
  if (!io) return;
  io.emit(`${resource}:changed`);
};
