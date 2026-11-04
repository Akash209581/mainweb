import {fileURLToPath} from 'node:url';
export default {turbopack:{root:fileURLToPath(new URL('.',import.meta.url))},async redirects(){const base=(process.env.PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,'');return ['index.html','abstract.html'].map(slug=>({source:'/'+slug,destination:base+'/'+slug,permanent:false}))}};
