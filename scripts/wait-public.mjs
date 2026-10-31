import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export const MIN_REQUEST_GAP_MS=65000;
export const PUBLIC_FILES=['index.html','app.js','core.js','stages.js','experiments.js','style.css','research.json','icons.js','assets/brand-reverse.svg','assets/favicon.svg','assets/og.png','assets/apple-touch-icon.png'];
const hash=b=>createHash('sha256').update(b).digest('hex');
// No parallel public requests. Browser interaction coverage runs against localhost
// in the PR workflow; this stage establishes exact published asset bytes.
export async function verifyPublic({fetchFn=fetch,read=readFile,now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms)),log=console.log,files=PUBLIC_FILES}={}){
 const expected=new Map();for(const file of files)expected.set(file,hash(await read(file)));
 const pending=[...files],deadline=now()+20*60000;let lastRequest=null,requests=0;
 while(pending.length&&requests<18){
  if(lastRequest!==null){const delay=Math.max(0,MIN_REQUEST_GAP_MS-(now()-lastRequest));if(now()+delay>=deadline)break;await sleep(delay);}
  if(now()>=deadline)break;
  const file=pending.shift();lastRequest=now();requests++;
  log(`PUBLIC_REQUEST ${new Date(lastRequest).toISOString()} ${file}`);
  try{
   const response=await fetchFn('https://djnaoyaman.github.io/1minutes/'+file,{signal:AbortSignal.timeout(10000),cache:'no-store',redirect:'error'});
   if(response.status===401||response.status===403){log(`PUBLIC_DENIED ${response.status} ${file}`);throw Object.assign(new Error(`Public verification denied (${response.status}) for ${file}; no retry`),{denied:true});}
   if(response.ok&&hash(Buffer.from(await response.arrayBuffer()))===expected.get(file)){log(`PUBLIC_MATCH ${file}`);continue;}
   log(`PUBLIC_PENDING ${response.status} ${file}`);pending.push(file);
  }catch(error){if(error.denied)throw error;log(`PUBLIC_PENDING network-error ${file}: ${error.message}`);pending.push(file);}
 }
 log(`PUBLIC_LAST_REQUEST ${lastRequest===null?'none':new Date(lastRequest).toISOString()}`);
 if(pending.length)throw new Error(`Published assets did not match within the bounded verification window: ${pending.join(', ')}`);
 log(`PUBLIC_COMPLETE ${requests} serial requests; ${files.length} assets match checkout`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await verifyPublic();
