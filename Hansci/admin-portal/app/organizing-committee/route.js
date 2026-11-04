export function GET(){return Response.redirect(new URL("/organizing-committee",process.env.PUBLIC_SITE_URL||'http://localhost:3000'))}
