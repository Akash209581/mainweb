import {proxy} from '../../../lib/proxy';export const dynamic='force-dynamic';export function GET(request){return proxy(request,'/api/assets','GET')}
