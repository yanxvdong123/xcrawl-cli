#!/usr/bin/env node

/**
 * xcrawl — CLI tool for XCrawl Web Scraping Proxy
 * 
 * Usage:
 *   xcrawl scrape <url>            Scrape a URL
 *   xcrawl batch <file>            Scrape URLs from a file
 *   xcrawl config                  Show current config
 *   xcrawl config set <key> <val>  Set config
 */

const { program } = require('commander');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.xcrawlrc');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch {}
  return { apiKey: process.env.XCRAWL_API_KEY || '', baseUrl: 'https://api.xcrawl.com/v1' };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`✅ Config saved to ${CONFIG_PATH}`);
}

async function scrapeUrl(url, opts = {}) {
  const config = loadConfig();
  if (!config.apiKey) {
    console.error('❌ No API key. Set XCRAWL_API_KEY env var or run `xcrawl config set apiKey <key>`');
    process.exit(1);
  }

  const format = opts.format || 'markdown';
  const waitFor = opts.wait || 0;

  try {
    const res = await axios.post(`${config.baseUrl}/scrape`, {
      url, format, waitFor,
    }, {
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message);
  }
}

// CLI Setup
program
  .name('xcrawl')
  .description('XCrawl Web Scraping Proxy CLI')
  .version('1.0.0');

program
  .command('scrape <url>')
  .description('Scrape a single URL')
  .option('-f, --format <type>', 'Output format: markdown, json, text, html', 'markdown')
  .option('-w, --wait <ms>', 'Wait time in ms for JS rendering', parseInt, 0)
  .action(async (url, opts) => {
    try {
      const result = await scrapeUrl(url, opts);
      if (opts.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result.content || result.data || JSON.stringify(result));
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('batch <file>')
  .description('Scrape URLs from a text file (one URL per line)')
  .option('-f, --format <type>', 'Output format', 'markdown')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(async (file, opts) => {
    try {
      const urls = fs.readFileSync(file, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
      console.log(`📄 Scraping ${urls.length} URLs...`);

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        process.stdout.write(`[${i + 1}/${urls.length}] ${url} ... `);
        try {
          const result = await scrapeUrl(url, opts);
          const safeName = url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
          const ext = opts.format === 'json' ? 'json' : 'md';
          fs.writeFileSync(path.join(opts.output, `${safeName}.${ext}`), 
            opts.format === 'json' ? JSON.stringify(result, null, 2) : (result.content || ''));
          console.log('✅');
        } catch (err) {
          console.log(`❌ ${err.message}`);
        }
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Show or set config')
  .argument('[action]', 'get, set')
  .argument('[key]', 'Config key')
  .argument('[value]', 'Config value')
  .action((action, key, value) => {
    const config = loadConfig();
    if (!action || action === 'get') {
      console.log(JSON.stringify(config, null, 2));
    } else if (action === 'set') {
      if (key && value) {
        config[key] = value;
        saveConfig(config);
      } else {
        console.error('❌ Usage: xcrawl config set <key> <value>');
      }
    }
  });

program.parse();
