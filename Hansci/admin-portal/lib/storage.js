// Server-only local persistent storage. Deploy on a Node host with a persistent volume.
import {DatabaseSync} from 'node:sqlite';
import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.env.DATA_DIR||'./data');let connection;
function db(){if(!connection){mkdirSync(root,{recursive:true});connection=new DatabaseSync(path.join(root,'conference.sqlite'));connection.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS conference_records(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,kind TEXT NOT NULL,status TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT,organisation TEXT,payload TEXT NOT NULL,file_key TEXT,file_name TEXT,notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS records_owner_created ON conference_records(owner_id,created_at);
CREATE TABLE IF NOT EXISTS site_settings(id TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL);`)}return connection}
export const DB = {
 prepare(sql) {
  return {
   bind(...values) {
    const params = values.map(v => v === undefined ? null : v);
    return {
     async all() { return { results: db().prepare(sql).all(...params) }; },
     async first() { return db().prepare(sql).get(...params) || null; },
     async run() { const r = db().prepare(sql).run(...params); return { meta: { changes: Number(r.changes) } }; }
    };
   }
  };
 }
};
function filePath(key){if(typeof key!=='string'||!key||key.split('/').some(p=>p==='..'||p==='.'||!p)||key.includes('\\'))throw Error('Invalid file key');const p=path.resolve(root,'files',key);if(!p.startsWith(path.join(root,'files')+path.sep))throw Error('Invalid file key');return p}
export const BUCKET={async put(key,bytes){const p=filePath(key);await mkdir(path.dirname(p),{recursive:true});await writeFile(p,Buffer.from(bytes))},async get(key){try{return{body:new Uint8Array(await readFile(filePath(key)))}}catch(e){if(e.code==='ENOENT')return null;throw e}},async delete(key){try{await unlink(filePath(key))}catch(e){if(e.code!=='ENOENT')throw e}}};
export const env={DB,BUCKET};
