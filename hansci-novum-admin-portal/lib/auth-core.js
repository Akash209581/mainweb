import {scryptSync,createHmac,timingSafeEqual} from 'node:crypto';
export const COOKIE='hn_admin_session';
function equal(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export function verifyPassword(password,stored){try{const [scheme,salt,hex]=stored.split('$');if(scheme!=='scrypt'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(hex))return false;return equal(scryptSync(password,salt,64).toString('hex'),hex)}catch{return false}}
function signature(value,secret){return createHmac('sha256',secret).update(value).digest('base64url')}
export function createSession(email,secret,now=Date.now()){if(!secret||secret.length<32)throw Error('SESSION_SECRET must contain at least 32 characters');const payload=Buffer.from(JSON.stringify({email,expires:now+8*60*60*1000})).toString('base64url');return payload+'.'+signature(payload,secret)}
export function validateSession(token,secret,email,now=Date.now()){try{if(!secret||secret.length<32||!email||!token)return false;const [payload,sig,extra]=token.split('.');if(extra||!payload||!sig||!equal(signature(payload,secret),sig))return false;const d=JSON.parse(Buffer.from(payload,'base64url').toString());return d.email===email&&Number.isFinite(d.expires)&&d.expires>now}catch{return false}}
