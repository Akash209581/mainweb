const fs = require('fs');
const path = 'c:/Users/banda/Desktop/mainweb/app/globals.css';
let existing = fs.readFileSync(path, 'utf8');
const header = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Hide Next.js dev overlay indicator bubble */
nextjs-portal,
#nextjs-dev-overlay-bubble,
[data-nextjs-dev-overlay-bubble],
[data-nextjs-toast],
div[data-nextjs-dev-overlay-bubble] {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

:root,
[data-theme="tech-ai"] {
  --font-outfit: Georgia, "Times New Roman", serif;
  --font-inter: "Trebuchet MS", Verdana, sans-serif;
  --color-background: 255 254 251;
  --color-surface: 250 248 244;
  --color-card: 255 255 255;
  --color-border: 216 207 194;
  --color-text-primary: 21 25 48;
  --color-text-secondary: 83 86 111;
  --color-primary: 43 32 101;
  --color-secondary: 54 43 121;
  --color-accent: 194 145 54;
  --color-glow: 229 214 188;
  --color-success: 34 197 94;
  --color-warning: 245 158 11;
  --color-danger: 248 113 113;
  --color-hover: 255 255 255;
}

[data-theme="health-bio"] {
  --color-background: 3 24 22;
  --color-surface: 8 44 39;
  --color-card: 13 58 51;
`;

fs.writeFileSync(path, header + existing, 'utf8');
console.log('Fixed mainweb globals.css successfully');
