/**
 * Sentry Instrumentation
 *
 * Must be imported before any other module in the app (see the very first
 * line of server.js). ES module imports are evaluated before the importing
 * file's own top-level code runs, so importing this file first guarantees
 * Sentry.init() has already executed by the time express, mongoose, routes,
 * etc. load and start doing work that could throw.
 *
 * Loads dotenv itself (rather than relying on server.js to have done it
 * already) so SENTRY_DSN is available from .env in local dev too — without
 * this, server.js's own dotenv.config() call wouldn't run until after this
 * file's imports are evaluated.
 *
 * If SENTRY_DSN isn't set (e.g. local dev without a Sentry project), Sentry
 * stays uninitialized and all Sentry.* calls elsewhere become no-ops.
 */

import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });
}

export { Sentry };
