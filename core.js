export const TARGET_MS = 60_000;
export const MAX_GAP_MS = 1_500;
export const STORAGE_KEY = '1minutes-results-v3';
export const EXPERIMENTS = ['wait','flow','anticipation','count','overload','stillness','memory','choice','repetition','novelty','rhythm','synchrony'];
export class SessionClock {
  constructor(kind, now = () => performance.now(), wall = () => Date.now()) {
    if (!EXPERIMENTS.includes(kind)) throw new TypeError('Unknown experiment');
    Object.assign(this,{kind,now,wall,started:now(),wallStarted:wall(),status:'running'});
    this.previous=this.started;
  }
  sample(hidden=false) {
    if(this.status!=='running') return {status:this.status};
    const current=this.now(),elapsedMs=current-this.started,gap=current-this.previous;
    const drift=Math.abs(this.wall()-this.wallStarted-elapsedMs); this.previous=current;
    const reason=hidden?'hidden':!Number.isFinite(elapsedMs)||elapsedMs<0||gap<0?'clock':gap>MAX_GAP_MS||drift>MAX_GAP_MS?'timing':null;
    if(reason){this.status='interrupted';return {status:this.status,reason,elapsedMs};}
    if(elapsedMs>=TARGET_MS)this.status='complete';
    return {status:this.status,elapsedMs};
  }
  cancel(){this.status='cancelled';}
}
export function validEstimate(value){if(typeof value!=='string'||!value.trim())return null;const n=Number(value);return Number.isFinite(n)&&n>=.1&&n<=3600?Math.round(n*10)/10:null;}
export function validRecord(r){return r&&EXPERIMENTS.includes(r.experiment)&&Number.isFinite(r.actual)&&r.actual>0&&r.actual<=300&&Number.isFinite(r.felt)&&r.felt>=.1&&r.felt<=3600&&Number.isInteger(r.score)&&r.score>=0&&r.score<=100000&&typeof r.at==='string'&&Number.isFinite(Date.parse(r.at))&&(r.version===2||(r.version===3&&r.actual>=60&&r.actual<61.5));}
export function readRecords(storage){try{const value=JSON.parse(storage.getItem(STORAGE_KEY)||'null');if(Array.isArray(value))return value.filter(validRecord).slice(-240);const old=JSON.parse(storage.getItem('1minutes-results-v2')||'[]');return Array.isArray(old)?old.map(r=>({...r,version:2})).filter(validRecord).slice(-100):[];}catch{return [];}}
export function saveRecords(storage,records){try{storage.setItem(STORAGE_KEY,JSON.stringify(records.filter(validRecord).slice(-240)));return true;}catch{return false;}}
export function compareRecords(records){return EXPERIMENTS.map(experiment=>{const rows=records.filter(r=>r.experiment===experiment&&r.version===3);return {experiment,n:rows.length,mean:rows.length?rows.reduce((sum,r)=>sum+r.felt-60,0)/rows.length:null};});}
export function nextTarget(previous,random=Math.random){return(previous+1+Math.floor(random()*7))%8;}
export function shuffle(values,random=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
