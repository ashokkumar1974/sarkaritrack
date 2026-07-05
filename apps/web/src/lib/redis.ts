let _redis: any = null;

function getRedis() {
  if (_redis) return _redis;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    !process.env.UPSTASH_REDIS_REST_URL.includes("localhost")
  ) {
    const { Redis } = require("@upstash/redis");
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return _redis;
  }
  _redis = {
    get: async () => null,
    set: async () => "OK",
    del: async () => 1,
    expire: async () => 1,
    incr: async () => 1,
  };
  return _redis;
}

export { getRedis as redis };
