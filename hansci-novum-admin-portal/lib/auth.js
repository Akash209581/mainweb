import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {COOKIE,validateSession} from './auth-core';
export async function getAdmin(){const c=await cookies(),email=process.env.ADMIN_EMAIL;if(!validateSession(c.get(COOKIE)?.value,process.env.SESSION_SECRET,email))return null;return{userId:'conference',email,displayName:email}}
export async function requireAdmin(returnTo='/admin'){const user=await getAdmin();if(user)return user;redirect('/login?returnTo='+encodeURIComponent(returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/admin'))}
