const allowedDomains = (process.env.ALLOWED_DOMAINS ?? '').split(',').filter((s) => !!s);

exports.handler = async function handler(event) {
  if (allowedDomains.length == 0) return event;

  const userEmailDomain = event.request.userAttributes.email.split('@')[1];
  if (!allowedDomains.includes(userEmailDomain)) {
    throw new Error(`Invalid email domain: ${userEmailDomain}`);
  }
  return event;
};
