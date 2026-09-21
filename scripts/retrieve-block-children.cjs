const fs = require('fs');
const path = require('path');
const { setTimeout } = require('timers/promises');
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_SECRET,
  timeoutMs: parseInt(process.env.NOTION_API_TIMEOUT_MS || '15000', 10),
});

// Two cache workers with this delay stay below Notion's average request limit.
const requestDuration = parseInt(
  process.env.CACHE_REQUEST_DELAY_MS || '700',
  10
);
const cacheDir =
  process.env.NOTION_CACHE_DIR ||
  (process.env.CF_PAGES ? 'node_modules/.astro/notion-cache' : 'tmp');

fs.mkdirSync(cacheDir, { recursive: true });

const cachePath = (blockId) => path.join(cacheDir, `${blockId}.json`);

const retry = async (maxRetries, fn) => {
  try {
    return await fn();
  } catch (err) {
    if (maxRetries <= 0) {
      throw err;
    }
    await setTimeout(requestDuration);
    return retry(maxRetries - 1, fn);
  }
};

const retrieveAndWriteBlockChildren = async (blockId) => {
  const params = { block_id: blockId };

  let results = [];

  while (true) {
    // For Notion API Requests limits
    // See https://developers.notion.com/reference/request-limits
    await setTimeout(requestDuration);

    const res = await retry(3, () => notion.blocks.children.list(params));

    results = results.concat(res.results);

    if (!res.has_more) {
      break;
    }

    params['start_cursor'] = res.next_cursor;
  }

  fs.writeFileSync(cachePath(blockId), JSON.stringify(results));

  for (const block of results) {
    if (
      block.type === 'synced_block' &&
      block.synced_block.synced_from &&
      block.synced_block.synced_from.block_id
    ) {
      try {
        await retrieveAndWriteBlock(block.synced_block.synced_from.block_id);
      } catch (err) {
        console.log(
          `Could not retrieve the original synced_block. error: ${err}`
        );
        throw err;
      }
    } else if (block.has_children) {
      await retrieveAndWriteBlockChildren(block.id);
    }
  }
};

const retrieveAndWriteBlock = async (blockId) => {
  const params = { block_id: blockId };

  // For Notion API Requests limits
  // See https://developers.notion.com/reference/request-limits
  await setTimeout(requestDuration);

  const block = await retry(3, () => notion.blocks.retrieve(params));

  fs.writeFileSync(cachePath(blockId), JSON.stringify(block));

  if (block.has_children) {
    await retrieveAndWriteBlockChildren(block.id);
  }
};

(async () => {
  const blockId = process.argv[2];
  await retrieveAndWriteBlockChildren(blockId);
})();
