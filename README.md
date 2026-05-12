# xcrawl-cli

CLI tool for XCrawl Web Scraping Proxy.

## Install

```bash
npm install -g xcrawl-cli
```

Or run with npx directly:

```bash
npx xcrawl-cli scrape https://example.com
```

## Quick Start

```bash
# Set your API key
xcrawl config set apiKey YOUR_API_KEY

# Scrape a URL
xcrawl scrape https://example.com

# Scrape as JSON
xcrawl scrape https://example.com -f json

# Batch scrape from file
echo "https://example.com" > urls.txt
echo "https://example.org" >> urls.txt
xcrawl batch urls.txt -f markdown -o ./output
```

## Commands

| Command | Description |
|---------|-------------|
| `scrape <url>` | Scrape a single URL |
| `batch <file>` | Scrape URLs from a file |
| `config` | Show current config |
| `config set <key> <value>` | Set config value |

## Environment Variables

- `XCRAWL_API_KEY` — API key (fallback if not in config file)

## Config File

Saved to `~/.xcrawlrc`

## Publish to npm

```bash
npm login
npm publish
```
