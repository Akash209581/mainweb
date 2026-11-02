export async function proxy(request,path,method='GET'){
 if(!process.env.ADMIN_API_URL||!process.env.FORM_API_KEY)return Response.json({error:'Website connection is not configured.'},{status:503});
 const origin=request.headers.get('origin');
 if(method==='POST'&&origin){try{if(new URL(origin).host!==request.headers.get('host'))return Response.json({error:'Invalid origin'},{status:403})}catch{return new Response(null,{status:403})}}
 try{
 const headers={'x-form-api-key':process.env.FORM_API_KEY};let body;
 if(method==='POST') {if(Number(request.headers.get('content-length')||0)>12*1024*1024)return new Response('Upload too large',{status:413});body=await request.arrayBuffer();if(body.byteLength>12*1024*1024)return new Response('Upload too large',{status:413});headers['Content-Type']=request.headers.get('content-type')||'application/octet-stream'}
 const target=new URL(path,process.env.ADMIN_API_URL);target.search=new URL(request.url).search;
 const r=await fetch(target,{method,headers,body,cache:'no-store',signal:AbortSignal.timeout(30000)});const h=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});for(const key of ['content-type','content-disposition'])if(r.headers.has(key))h.set(key,r.headers.get(key));return new Response(r.body,{status:r.status,headers:h});
 }catch{return Response.json({error:'Conference service unavailable. Please try again.'},{status:502})}
}
