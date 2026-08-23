import { env } from './config/env.js';
import app from './app.js';

app.listen(env.port, () => {
  console.log(`[Server] Running on port ${env.port}`);
  console.log(`[Server] Environment: ${env.nodeEnv}`);
});
