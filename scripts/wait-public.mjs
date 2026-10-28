import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=['index.html','app.js','core.js','stages.js','experiments.js','style.css','research.json'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const expected=Object.fromEntries(await Promise.all(files.map(async f=>[f,hash(await readFile(f))])));
const base='https://djnaoyaman.github.io/1minutes/';
let matched=false;const deadline=Date.now()+300000;
for(let attempt=0;attempt<20&&Date.now()<deadline;attempt++){
 const results=await Promise.all(files.map(async file=>{try{const r=await fetch(base+file,{signal:AbortSignal.timeout(10000),cache:'no-store'});return r.ok&&hash(Buffer.from(await r.arrayBuffer()))===expected[file];}catch{return false;}}));
 console.log(`Public asset check ${attempt+1}: ${results.filter(Boolean).length}/${files.length} match deployed checkout`);
 if(results.every(Boolean)){matched=true;break;}
 if(attempt<19)await new Promise(resolve=>setTimeout(resolve,Math.min(15000,Math.max(0,deadline-Date.now()))));
}
if(!matched)throw new Error('Public assets did not match this checkout within the deployment observation window');
