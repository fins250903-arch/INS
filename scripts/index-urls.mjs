import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const SITEMAP_PATH = './dist/sitemap-0.xml';

async function indexUrls() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`Sitemap not found at ${SITEMAP_PATH}. Please run npm run build first.`);
    process.exit(1);
  }

  const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

  console.log(`Found ${urls.length} URLs in sitemap.`);

  const credentialsJson = process.env.GOOGLE_INDEXING_CREDENTIALS;
  if (!credentialsJson) {
    console.error('GOOGLE_INDEXING_CREDENTIALS environment variable is not set.');
    process.exit(1);
  }

  const credentials = JSON.parse(credentialsJson);
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/indexing'],
    null
  );

  const indexing = google.indexing('v3');

  for (const url of urls) {
    console.log(`Notifying Google about URL: ${url}`);
    try {
      const res = await indexing.urlNotifications.publish({
        auth,
        requestBody: {
          url: url,
          type: 'URL_UPDATED',
        },
      });
      console.log(`Success: ${res.statusText}`);
    } catch (err) {
      console.error(`Error indexing ${url}:`, err.message);
    }
  }
}

indexUrls().catch(console.error);
