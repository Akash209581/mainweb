// Standalone deployment uses its own signed administrator session, not ChatGPT headers.
export {getAdmin as getChatGPTUser,requireAdmin as requireChatGPTUser} from '../lib/auth';
