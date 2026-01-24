import { util } from '@aws-appsync/utils';

/**
 * Allow subscription only for the channels that
 * 1. begin with /public
 * 2. begin with /user/<userId>
 * https://docs.aws.amazon.com/appsync/latest/eventapi/channel-namespace-handlers.html
 */
export function onSubscribe(ctx) {
  if (ctx.identity.accountId) {
    // allow any when IAM auth is used.
    return;
  }
  if (ctx.info.channel.path.startsWith(`/event-bus/public`)) {
    return;
  }
  if (ctx.info.channel.path.startsWith(`/event-bus/user`)) {
    if (ctx.info.channel.path.startsWith(`/event-bus/user/${ctx.identity.username}`)) {
      return;
    }
    util.unauthorized();
  }
  util.unauthorized();
}
