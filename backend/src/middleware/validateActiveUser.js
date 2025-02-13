const UserModel = require('../services/db/models/user');
const NodeCache = require('node-cache');
const userCache = new NodeCache({ stdTTL: 60*15, checkperiod: 120 });

async function validateActiveUser(ctx, next) {
  const identityId = ctx.request.headers['x-ms-client-principal-id'];
  const identityName = ctx.request.headers['x-ms-client-principal-name'];
  const provider = ctx.request.headers['x-ms-client-principal-idp'];

  if (!identityId || !identityName || !provider) {
    ctx.status = 401;
    ctx.body = { message: 'Unauthorized' };
    return;
  }

  const cacheKey = `${identityId}-${provider}`;
  let user = userCache.get(cacheKey);
  if (user === undefined) {
    try {
      user = await UserModel.findOne({
        'identity.id': identityId,
        'identity.name': identityName,
        provider: provider
      });
      if (!user) {
        ctx.status = 404;
        ctx.body = { message: 'User not found' };
        return;
      }
      userCache.set(cacheKey, user);
    } catch (error) {
      ctx.status = 500;
      ctx.body = { message: 'Internal server error' };
      return;
    }
  }

  if (!user.activated) {
    ctx.status = 403;
    ctx.body = { message: 'User is not activated' };
    return;
  }

  ctx.state.user = user; // Set the user object on the ctx

  await next();
}

// Invalidate cache on specific route call
const invalidateActiveUserCacheMiddleware = async (ctx, next) => {
  const identityId = ctx.headers['x-ms-client-principal-id'];
  const provider = ctx.headers['x-ms-client-principal-idp'];
  const cacheKey = `${identityId}-${provider}`;
  userCache.del(cacheKey);
  await next();
};

module.exports = { validateActiveUser, invalidateActiveUserCacheMiddleware };
