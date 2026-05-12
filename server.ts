import './src/instrumentation';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, resolve } from 'node:path';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import bootstrap from './src/main.server';
import logger from './src/logger';

interface ServerPaths {
  readonly browserDistFolder: string;
  readonly indexHtml: string;
}

/**
 * Resolves the Angular server and browser distribution paths from this bundle.
 */
function resolveServerPaths(): ServerPaths {
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));

  return {
    browserDistFolder: resolve(serverDistFolder, '../browser'),
    indexHtml: join(serverDistFolder, 'index.server.html'),
  };
}

/**
 * Returns true when the URL points to a static asset instead of an Angular route.
 */
function isStaticAssetPath(pathname: string): boolean {
  return /\.[^/]+$/.test(pathname);
}

/**
 * Resolves a browser asset path while preventing directory traversal.
 */
function resolveBrowserAssetPath(browserDistFolder: string, pathname: string): string | null {
  const relativePath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const filePath = normalize(join(browserDistFolder, relativePath));

  return filePath.startsWith(browserDistFolder) ? filePath : null;
}

/**
 * Sends a browser bundle asset through Node's HTTP response API.
 */
async function sendBrowserAsset(
  browserDistFolder: string,
  pathname: string,
  response: ServerResponse,
): Promise<void> {
  const filePath = resolveBrowserAssetPath(browserDistFolder, pathname);

  if (!filePath) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=UTF-8' });
    response.end('Not Found');
    return;
  }

  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=UTF-8' });
    response.end('Not Found');
    return;
  }

  response.writeHead(200, {
    'content-type': file.type || 'application/octet-stream',
    'content-length': file.size,
  });
  response.end(Buffer.from(await file.arrayBuffer()));
}

// The Hono app is exported so that it can be used by serverless Functions.
export function app(): Hono {
  const server = new Hono();
  const { browserDistFolder, indexHtml } = resolveServerPaths();

  const commonEngine = new CommonEngine();

  // Logger middleware - "Percepção" para ver as requisições
  server.use('*', async (c, next) => {
    logger.info(`[${c.req.method}] ${c.req.url}`);
    await next();
  });

  // Serve static files from /browser - Only for paths with extensions
  server.get('*.*', serveStatic({ 
    root: browserDistFolder,
  }));

  // All regular routes use the Angular engine
  server.get('*', async (c) => {
    try {
      const html = await commonEngine.render({
        bootstrap,
        documentFilePath: indexHtml,
        url: c.req.url,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
      });
      
      return c.html(html);
    } catch (err) {
      logger.error('SSR Rendering Error', { error: err, url: c.req.url });
      return c.text('Internal Server Error', 500);
    }
  });

  // Fallback handler to ensure a Response is always returned
  server.notFound((c) => {
    return c.text('Not Found', 404);
  });

  return server;
}

function run(): void {
  const port = Number(process.env['SSR_PORT'] || 4000);
  const { browserDistFolder, indexHtml } = resolveServerPaths();
  const commonEngine = new CommonEngine();

  logger.info(`Bun Hono server listening on http://localhost:${port}`);

  createServer((request: IncomingMessage, response: ServerResponse) => {
    void handleNodeRequest(request, response, commonEngine, indexHtml, browserDistFolder);
  }).listen(port);
}

/**
 * Handles SSR and static assets using Node's HTTP API while still running on Bun.
 */
async function handleNodeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  commonEngine: CommonEngine,
  indexHtml: string,
  browserDistFolder: string,
): Promise<void> {
  const host = request.headers.host ?? `localhost:${process.env['SSR_PORT'] || 4000}`;
  const requestUrl = new URL(request.url ?? '/', `http://${host}`).toString();

  logger.info(`[${request.method ?? 'GET'}] ${requestUrl}`);

  try {
    const url = new URL(requestUrl);

    if (isStaticAssetPath(url.pathname)) {
      await sendBrowserAsset(browserDistFolder, url.pathname, response);
      return;
    }

    const html = await commonEngine.render({
      bootstrap,
      documentFilePath: indexHtml,
      url: requestUrl,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
    });

    response.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
    response.end(html);
  } catch (error: unknown) {
    logger.error('Node HTTP handler error', { error, url: requestUrl });
    response.writeHead(500, { 'content-type': 'text/plain; charset=UTF-8' });
    response.end('Internal Server Error');
  }
}

run();
