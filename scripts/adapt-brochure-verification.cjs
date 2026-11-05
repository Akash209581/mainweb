/** Preserve server verification when a supplied brochure design is imported again. */
function adaptBrochureVerification(jsx){
 if(jsx.includes('payload.captchaToken=captchaToken'))return jsx;
 let result=jsx.replace(' const document=useReferenceDocument();',' const document=useReferenceDocument();\n const [captchaToken,setCaptchaToken]=useState(null);');
 result=result.replace("function refresh(){const n=new Uint32Array(2);crypto.getRandomValues(n);setChallenge([2+n[0]%8,1+n[1]%9]);setData(d=>({...d,captcha:''}));setError('');}","async function refresh(){setChallenge(null);try{const r=await fetch('/api/challenge',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setChallenge([d.a,d.b]);setCaptchaToken(d.token);setData(d=>({...d,captcha:''}));setError('')}catch(e){setError('Unable to load verification. Please try again.')}}");
 result=result.replace('delete payload.captcha;','payload.captchaToken=captchaToken;payload.captchaAnswer=data.captcha;delete payload.captcha;').replace('Preview challenge only. Server-verified protection must be connected before launch.','Solve the verification challenge to continue.');
 if(!result.includes('const [captchaToken')||!result.includes('async function refresh()'))throw Error('The supplied brochure verification code changed. Update the validation adapter before importing.');
 return result;
}
module.exports={adaptBrochureVerification};
