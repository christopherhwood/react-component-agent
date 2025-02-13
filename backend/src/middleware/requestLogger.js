async function requestLogger(ctx, next) {
  ctx.id = Math.random().toString(36).substring(7);
  console.log('Incoming Request:', ctx.method, ctx.url, ctx.id);
  await next();
  console.log('Outgoing Response:', ctx.method, ctx.url, ctx.id, ctx.status, JSON.stringify(ctx.body));
}

module.exports = requestLogger;