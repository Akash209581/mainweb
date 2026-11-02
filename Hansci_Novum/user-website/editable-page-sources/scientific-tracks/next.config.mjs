import {fileURLToPath} from 'node:url';
export default {output:'export',trailingSlash:true,basePath:'/scientific-tracks',turbopack:{root:fileURLToPath(new URL('.',import.meta.url))}};
