import {beforeEach,describe,expect,it,vi} from 'vitest';
const {conference,setting,readFile}=vi.hoisted(()=>({conference:vi.fn(),setting:vi.fn(),readFile:vi.fn()}));
vi.mock('@/lib/prisma/client',()=>({prisma:{conference:{findFirst:conference},systemSetting:{findUnique:setting}}}));
vi.mock('fs/promises',()=>({default:{readFile}}));
import {GET} from '../app/api/assets/route';
describe('published document endpoint',()=>{
 beforeEach(()=>{conference.mockReset();setting.mockReset();readFile.mockReset();conference.mockResolvedValue({id:'conference'});readFile.mockResolvedValue(Buffer.from('%PDF-1.7\nPDF fixture'))});
 for(const kind of ['sampleAbstract','brochure'])it('serves uploaded '+kind+' as PDF with its original filename',async()=>{setting.mockResolvedValue({value:{[kind]:{fileName:'Approved conference.pdf',storageKey:'stored-document.pdf'}}});const r=await GET(new Request('https://conference.test/ICGIT/api/assets?kind='+kind));expect(r.status).toBe(200);expect(r.headers.get('content-type')).toBe('application/pdf');expect(r.headers.get('content-disposition')).toContain('filename="Approved conference.pdf"');expect(await r.text()).toBe('%PDF-1.7\nPDF fixture')});
 it('does not fall back to a placeholder TXT file when the uploaded file is unavailable',async()=>{setting.mockResolvedValue({value:{brochure:{fileName:'Approved.pdf',storageKey:'stored.pdf'}}});readFile.mockRejectedValue(new Error('Missing'));const r=await GET(new Request('https://conference.test/ICGIT/api/assets?kind=brochure'));expect(r.status).toBe(404);expect(r.headers.get('content-disposition')).toBeNull()});
 it('rejects traversal without reading a file',async()=>{setting.mockResolvedValue({value:{brochure:{fileName:'Approved.pdf',storageKey:'../outside.pdf'}}});expect((await GET(new Request('https://conference.test/ICGIT/api/assets?kind=brochure'))).status).toBe(404);expect(readFile).not.toHaveBeenCalled()});
});
