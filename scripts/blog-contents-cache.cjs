const { execFile } = require('child_process');
const fs = require('fs');
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

  fs.mkdirSync('tmp', { recursive: true });
  console.log(
    `Caching ${pages.length} Notion page(s) with concurrency ${concurrency}`
  );

  const progressBar = new cliProgress.SingleBar(
    { stopOnComplete: true },
    cliProgress.Presets.shades_classic
  );
  progressBar.start(pages.length, 0);

  const { errors } = await PromisePool.withConcurrency(concurrency)
    .for(pages)
    .process(async (page) => {
      return new Promise((resolve, reject) => {
        const args = [
          'nx',
          'run',
          'astro-notion-blog:_fetch-notion-blocks',
          page.id,
          page.last_edited_time,
        ];
        const options = {
          env: { ...process.env, NX_BRANCH: 'main' },
          timeout,
        };

        execFile('npx', args, options, (err) => {
          progressBar.increment();
          if (err) {
            reject(
              new Error(
                `Could not cache Notion page ${page.id}: ${err.message}`
              )
            );
            return;
          }
          resolve();
        });
      });
    });

  progressBar.stop();
  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      `Failed to cache ${errors.length} Notion page(s)`
    );
  }
})();
