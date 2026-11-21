import 'dotenv/config';
import { app } from './app.js';
import { env } from './lib/env.js';

app.listen(env.PORT, () => {
  console.info(`Itsuki Studio API listening on http://localhost:${env.PORT}`);
});
