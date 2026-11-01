import { fileURLToPath } from 'node:url';
// Remove basePath for deployment at your domain root; rebuild afterwards.
export default { output: 'export', trailingSlash: true, basePath: '/brochure', turbopack: { root: fileURLToPath(new URL('.',import.meta.url)) } };
