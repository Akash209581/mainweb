export function GET(){return Response.redirect(new URL("/scientific-tracks",process.env.PUBLIC_SITE_URL||'http://localhost:3000'))}
