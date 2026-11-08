/** Keep the approved HTML layout while replacing browser-only arithmetic with a signed server challenge. */
export function validatedReferenceScript(script: string) {
  let result = "let submissionCaptchaToken=null;\nconst challengeEndpoint='/ICGIT/api/challenge';\n" + script;
  result = result.replace(
    /function newCaptcha\(\)\{[^\n]+?document\.getElementById\('captcha-error'\)\.hidden=true\}/,
    `async function newCaptcha(){captchaAnswer.disabled=true;try{const r=await fetch(challengeEndpoint,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);captchaTotal=d.a+d.b;submissionCaptchaToken=d.token;document.getElementById('captcha-question').textContent=d.a+' + '+d.b;captchaAnswer.value='';captchaAnswer.setCustomValidity('');document.getElementById('captcha-error').hidden=true}catch(e){captchaAnswer.setCustomValidity('Unable to load verification. Request a new challenge.')}finally{captchaAnswer.disabled=false}}`
  );
  result = result.replace(
    /function challenge\(\)\{[^\n]+?document\.getElementById\('captcha-error'\)\.hidden=true\}/,
    `async function challenge(){form.elements.captcha.disabled=true;try{const r=await fetch(challengeEndpoint,{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);total=d.a+d.b;submissionCaptchaToken=d.token;document.getElementById('challenge').textContent=d.a+' + '+d.b;form.elements.captcha.value='';form.elements.captcha.setCustomValidity('');document.getElementById('captcha-error').hidden=true}catch(e){form.elements.captcha.setCustomValidity('Unable to load verification. Request a new challenge.')}finally{form.elements.captcha.disabled=false}}`
  );
  result = result.replaceAll(
    "delete payload.captcha;",
    "payload.captchaToken=submissionCaptchaToken;payload.captchaAnswer=form.elements.captcha.value;delete payload.captcha;"
  );
  return result.replaceAll(
    "delete p.captcha;",
    "p.captchaToken=submissionCaptchaToken;p.captchaAnswer=form.elements.captcha.value;delete p.captcha;"
  );
}
