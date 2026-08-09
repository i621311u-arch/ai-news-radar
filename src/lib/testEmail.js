import dotenv from 'dotenv';
import { sendDailyDigest } from './email.js';

dotenv.config();

console.log('Sending test daily briefing email to i621311@gmail.com...');
sendDailyDigest(true).then(res => {
  console.log('RESULT:', res);
  process.exit(0);
}).catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
