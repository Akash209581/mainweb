const http = require('http');

http.get('http://localhost:3000/ICGIT', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n');
    const iconLines = lines.filter(l => l.includes('rel="icon"') || l.includes('rel="shortcut icon"') || l.includes('rel="apple-touch-icon"') || l.includes('favicon'));
    console.log('Found icon elements in HTML:');
    console.log(iconLines.join('\n'));
  });
});
