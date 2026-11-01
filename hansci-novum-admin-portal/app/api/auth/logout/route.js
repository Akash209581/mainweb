import {NextResponse} from 'next/server';
import {COOKIE} from '../../../../lib/auth-core';
export async function GET(request){const r=NextResponse.redirect(new URL('/login',request.url));r.cookies.set(COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});return r}
