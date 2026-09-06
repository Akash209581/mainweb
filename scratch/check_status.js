const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (err) => resolve({ url, error: err.message }));
  });
}

async function run() {
  const results = await Promise.all([
    check('http://localhost:3000/ICGIT'),
    check('http://localhost:3001/icgit-2026'),
    check('http://localhost:3001/icgit-2026/content'),
    check('http://localhost:3001/icgit-2026/seo')
  ]);
  console.log(JSON.stringify(results, null, 2));
}

run();
