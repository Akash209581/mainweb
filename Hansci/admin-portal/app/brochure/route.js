export function GET(){return Response.redirect(new URL("/brochure",process.env.PUBLIC_SITE_URL||'http://localhost:3000'))}
