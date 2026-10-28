export const TARGET_MS = 60_000;
export const MAX_GAP_MS = 1_500;
export const STORAGE_KEY = '1minutes-results-v4';
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
    return {status:this.status,elapsedMs};
  }
  stop(hidden=false){const s=this.sample(hidden);if(s.status==='running'&&s.elapsedMs>0){this.status='complete';return {...s,status:'complete'};}return s;}
  cancel(){this.status='cancelled';}
}
export function validRecord(r){if(!r||!EXPERIMENTS.includes(r.experiment)||!Number.isFinite(r.actual)||r.actual<=0||!Number.isInteger(r.score)||r.score<0||typeof r.at!=='string'||!Number.isFinite(Date.parse(r.at)))return false;if(r.version===4)return r.method==='production';return [2,3].includes(r.version)&&Number.isFinite(r.felt)&&r.felt>=.1&&r.felt<=3600&&(r.version===2||r.actual>=60&&r.actual<61.5);}
export function readRecords(storage){for(const key of [STORAGE_KEY,'1minutes-results-v3','1minutes-results-v2']){try{const value=JSON.parse(storage.getItem(key)||'null');if(Array.isArray(value))return value.map(r=>key.endsWith('v2')?{...r,version:2}:r).filter(validRecord).slice(-240);}catch{}}return [];}
export function saveRecords(storage,records){try{storage.setItem(STORAGE_KEY,JSON.stringify(records.filter(validRecord).slice(-240)));return true;}catch{return false;}}
export function compareRecords(records){return EXPERIMENTS.map(experiment=>{const rows=records.filter(r=>r.experiment===experiment&&r.version===4&&validRecord(r));return {experiment,n:rows.length,mean:rows.length?rows.reduce((sum,r)=>sum+r.actual-60,0)/rows.length:null};});}
export function nextTarget(previous,random=Math.random){return(previous+1+Math.floor(random()*7))%8;}
export function shuffle(values,random=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
