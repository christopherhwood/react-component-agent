const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const errorCatcher = require('./middleware/errorCatcher');
const requestLogger = require('./middleware/requestLogger');
const serve = require('koa-static');
const send = require('koa-send');
const path = require('path');

const configuredRouter = require('./router');
const buildPath = path.join(__dirname, 'build');

const app = new Koa();
app.use(cors({ origin: (ctx) => {
  if (process.env.NODE_ENV !== 'production') {
    return ctx.request.header.origin; // Reflect the request origin, as it is allowed
  }
  const allowedOrigins = ['http://qckfx.com', 'https://qckfx.com', 'http://www.qckfx.com', 'https://www.qckfx.com'];
  if (allowedOrigins.includes(ctx.request.header.origin)) {
    return ctx.request.header.origin; // Reflect the request origin, as it is allowed
  }
  return false;
}}));
app.use(errorCatcher);
app.use(requestLogger);
app.use(bodyParser());
app.use(configuredRouter.routes()).use(configuredRouter.allowedMethods());
app.use(serve(buildPath));
app.use(async ctx => {
  // Catch all GET requests that aren't prefaced with /api
  if (ctx.method === 'GET' && !ctx.url.startsWith('/api')) {
    await send(ctx, 'index.html', { root: buildPath });
  }
});



module.exports = app;
