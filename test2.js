const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/NOTION_TOKEN=(.*)/)[1];
const { Client } = require('@notionhq/client');
const client = new Client({ auth: token });

async function run() {
  try {
    // resolve slug 'silent-steps-series' roughly
    let blocks = [];
    let cursor;
    console.log("Fetching blocks for 1d1392488fe580ea834ae3c6a21590a7...");
    // Let's first test a valid page id to ensure the script works.
    let response = await client.blocks.children.list({ block_id: '1d1392488fe580ea834ae3c6a21590a7' });
    console.log("Found blocks:", response.results.length);
  } catch (e) {
    console.error(e);
  }
}
run();
