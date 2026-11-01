import { requireChatGPTUser } from '../chatgpt-auth';
import Portal from './portal';
import { getAdmin } from '../admin-access';
export const dynamic = 'force-dynamic';
export default async function Page() { const user = await requireChatGPTUser('/admin'); if (!await getAdmin())
    return <p>Administrator access required.</p>; return <Portal email={user.email}/>; }
