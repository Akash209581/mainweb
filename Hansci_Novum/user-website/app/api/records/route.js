import {proxy} from '../../../lib/proxy';export const dynamic='force-dynamic';export function POST(request){return proxy(request,'/api/records','POST')}
