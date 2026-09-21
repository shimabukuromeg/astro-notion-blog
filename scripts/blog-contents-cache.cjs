const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const cliProgress = require('cli-progress');
const { PromisePool } = require('@supercharge/promise-pool');

const notion = new Client({
  auth: process.env.NOTION_API_SECRET,
  timeoutMs: parseInt(process.env.NOTION_API_TIMEOUT_MS || '15000', 10),
});

const getAllPages = async () => {
  const params = {
    database_id: process.env.DATABASE_ID,
    filter: {
      and: [
        {
          property: 'Published',
          checkbox: {
            equals: true,
          },
        },
        {
          property: 'Date',
          date: {
            on_or_before: new Date().toISOString(),
          },
        },
      ],
    },
  };

  let results = [];
  while (true) {
    const res = await notion.databases.query(params);

    results = results.concat(res.results);

    if (!res.has_more) {
      break;
    }

    params['start_cursor'] = res.next_cursor;
  }

  const pages = results.map((result) => {
    return {
      id: result.id,
      last_edited_time: result.last_edited_time,
      slug: result.properties.Slug.rich_text
        ? result.properties.Slug.rich_text[0].plain_text
        : '',
    };
  });

  return pages;
};

(async () => {
  const pages = await getAllPages();

  const concurrency = parseInt(process.env.CACHE_CONCURRENCY || '2', 10);
  const timeout = parseInt(process.env.CACHE_PAGE_TIMEOUT_MS || '300000', 10);
  const cacheDir =
    process.env.NOTION_CACHE_DIR ||
    (process.env.CF_PAGES ? 'node_modules/.astro/notion-cache' : 'tmp');

  fs.mkdirSync(cacheDir, { recursive: true });
  console.log(
    `Caching ${pages.length} Notion page(s) with concurrency ${concurrency}`
  );

  const progressBar = new cliProgress.SingleBar(
    { stopOnComplete: true },
    cliProgress.Presets.shades_classic
  );
  progressBar.start(pages.length, 0);
  let reused = 0;
  let fetched = 0;

  const { errors } = await PromisePool.withConcurrency(concurrency)
    .for(pages)
    .process(async (page) => {
      const cachePath = path.join(cacheDir, `${page.id}.json`);
      const markerPath = path.join(
        cacheDir,
        `${page.id}.last_edited_time`
      );

      if (
        fs.existsSync(cachePath) &&
        fs.existsSync(markerPath) &&
        fs.readFileSync(markerPath, 'utf8') === page.last_edited_time
      ) {
        reused += 1;
        progressBar.increment();
        return;
      }

      return new Promise((resolve, reject) => {
        const args = ['scripts/retrieve-block-children.cjs', page.id];
        const options = {
          env: { ...process.env, NOTION_CACHE_DIR: cacheDir },
          timeout,
        };

        execFile(process.execPath, args, options, (err) => {
          progressBar.increment();
          if (err) {
            reject(
              new Error(
                `Could not cache Notion page ${page.id}: ${err.message}`
              )
            );
            return;
          }
          fs.writeFileSync(markerPath, page.last_edited_time);
          fetched += 1;
          resolve();
        });
      });
    });

  progressBar.stop();
  console.log(`Notion cache complete: ${reused} reused, ${fetched} fetched`);
  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      `Failed to cache ${errors.length} Notion page(s)`
    );
  }
})();
