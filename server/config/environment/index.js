import path from 'path';
import _ from 'lodash';
import dotenv from 'dotenv';

const root = path.normalize(`${__dirname}/../../..`);
const env = dotenv.config({ path: path.join(root, '.env') });
// All configurations will extend these options
// ============================================
const all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(`${__dirname}/../../..`),

  // Browser-sync port
  browserSyncPort: process.env.BROWSER_SYNC_PORT || 4500,

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  PLAY_URL: process.env.PLAY_URL,
  MSG: process.env.MSG,
  PLIVO_AUTH_ID: process.env.PLIVO_AUTH_ID || 'id',
  PLIVO_AUTH_TOKEN: process.env.PLIVO_AUTH_TOKEN || 'token',
  MYSQL_DB: process.env.MYSQL_DB,
  MYSQL_USER: process.env.MYSQL_USER,
  MYSQL_PASS: process.env.MYSQL_PASS,
  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_TZ: '+05:30',

  OAUTH_SERVER: process.env.OAUTH_SERVER,
  OAUTH_ENDPOINT: process.env.OAUTH_ENDPOINT,
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./shared'),
  env.parsed || env,
  /* eslint import/no-dynamic-require:0 */
  require(`./${process.env.NODE_ENV}.js`) || {});
