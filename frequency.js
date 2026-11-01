import {studies, studyTones} from './sound-studies.js?v=1';

const root=document.getElementById("tracks");
const lengths=[1,2,3,4,5,10,15,20,30,45,60];
const genres=[
["pure","周波数のみ"],["organ","PIPE ORGAN"],["violin","VIOLIN"],["piano","PIANO"],["chiptune","8-BIT"],["techno","TECHNO"],["ambient","AMBIENT"],["lofi","LO-FI HIP HOP"],["house","DEEP HOUSE"]
];
const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(Math.floor(s%60)).padStart(2,"0");
let ctx=null,active=null;
studies.forEach((s,i)=>{
 const el=document.createElement("article");el.className="track";el.id="study-"+s.title.toLowerCase();
 el.innerHTML='<small>'+String(i+1).padStart(2,"0")+' / '+s.sub+'</small><h2>'+s.title+'</h2><p>'+s.desc+'</p><p class="detail">'+s.detail+'</p><div class="controls"><label>音楽 <select class="genre" aria-label="音楽ジャンル">'+genres.map(([v,n])=>'<option value="'+v+'">'+n+'</option>').join("")+'</select></label><label>長さ <select class="length" aria-label="再生時間">'+lengths.map(n=>'<option value="'+n+'">'+n+'分</option>').join("")+'</select></label><label><input class="repeat" type="checkbox"> リピート</label></div><p class="caveat">各ジャンルはオリジナルの60秒ループ。選択した周波数の音を重ねて再生します。</p><button type="button">PLAY</button><div class="progress"><span></span></div><small class="time">01:00</small>';
 root.append(el);el.querySelector("button").onclick=()=>play(i,el);
 for(const c of el.querySelectorAll("select"))c.onchange=()=>{if(active&&active.i===i)stop();el.querySelector(".time").textContent=fmt(Number(el.querySelector(".length").value)*60)};
});
function stop(){
 if(!active)return;const a=active;active=null;clearInterval(a.timer);cancelAnimationFrame(a.raf);
 try{a.master.gain.setTargetAtTime(0,ctx.currentTime,.015)}catch(e){}
 setTimeout(()=>{try{a.sources.forEach(n=>n.stop());a.master.disconnect()}catch(e){}},120);
 a.button.textContent="PLAY";a.button.classList.remove("active");a.bar.style.width="0%";a.time.textContent=fmt(Number(a.el.querySelector(".length").value)*60);
}
function play(i,el){
 if(active&&active.i===i){stop();return}stop();
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC){alert("Web Audio非対応のブラウザです");return}
 ctx=ctx||new AC();
 ctx.resume().then(()=>{
 if(active)return;
 const s=studies[i],genre=el.querySelector(".genre").value,duration=Number(el.querySelector(".length").value)*60;
 const now=ctx.currentTime+.05,master=ctx.createGain(),sources=[];
 master.gain.setValueAtTime(.00001,now);master.gain.linearRampToValueAtTime(.75,now+.8);master.connect(ctx.destination);
 const a={i,el,master,sources,button:el.querySelector("button"),bar:el.querySelector(".progress span"),time:el.querySelector(".time"),start:now,duration,next:now,step:0,raf:0,timer:0};
 active=a;a.button.textContent="STOP";a.button.classList.add("active");
 function sound(freq,t,dur,vol,kind="sine",pan=0){
  if(t>=a.start+duration&&!el.querySelector(".repeat").checked)return;
  const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();
  o.type=kind;o.frequency.setValueAtTime(freq,t);p.pan.value=pan;
  g.gain.setValueAtTime(.00001,t);g.gain.linearRampToValueAtTime(vol,t+.008);
  g.gain.setValueAtTime(vol,t+Math.max(.009,dur-.045));g.gain.exponentialRampToValueAtTime(.00001,t+dur);
  o.connect(g).connect(p).connect(master);o.start(t);o.stop(t+dur+.005);sources.push(o);
 }
 function base(){
  // Preserve the scientifically defined binaural difference, while harmonizing other carriers.
  const carrierDur=3601;
  const level=s.type==='binaural'?.157:.14;
  for(const [frequency, amplitude, pan] of studyTones(s))sound(frequency,now,carrierDur,amplitude*level,'sine',pan);
 }
 // For repeating sessions, the continuous carrier is restarted at each session boundary.
 base();
 const tempo={organ:80,violin:80,piano:100,ambient:80,techno:120,chiptune:150,lofi:100,house:120}[genre]||120;
 const stepDur=60/tempo/4;
 const rootMidi=[48,45,41,43][i%4];
 const tuning=(s.type==="pure"||s.type==="harmonics")?s.freq:440;
 const pitch=m=>tuning*2**((m-(s.type==="pure"?69:s.type==="harmonics"?72:69))/12);
 const scale=[0,3,5,7,10,12,15,17];
 function tick(step,t){
  if(genre==="pure")return;
  const st=step%16,bar=Math.floor(step/16);
  const progression=[0,-5,-2,-7];
  const rootNote=rootMidi+progression[Math.floor(bar/2)%4];
  const chord=[0,3,7,10];
  const chordKind=genre==="organ"?"sawtooth":genre==="violin"?"sawtooth":genre==="chiptune"?"square":genre==="piano"?"triangle":"sine";
  const beatLen=stepDur*4;
  // Every genre now has an actual four-note harmonic bed rather than isolated notes.
  if(st===0){
   const durationChord=beatLen*3.95;
   const volume=genre==="organ"?.019:genre==="violin"?.013:genre==="ambient"?.025:.021;
   chord.forEach((n,j)=>sound(pitch(rootNote+12+n),t,durationChord,volume,chordKind,(j-1.5)*.28));
  }
  if(genre==="ambient"||genre==="organ"||genre==="violin"||genre==="piano"){
   if(st%4===0){
    const arp=[0,7,3,10][(st/4+bar)%4];
    sound(pitch(rootNote+24+arp),t,stepDur*(genre==="violin"?4:2.8),genre==="piano"?.047:.025,chordKind,.25);
   }
  }else{
   if((genre==="techno"||genre==="house")&&st%4===0){
    sound(58,t,.13,.15,"sine");
    sound(41,t,.17,.05,"triangle");
   }
   if((genre==="techno"||genre==="house"||genre==="lofi")&&st%4===2)sound(170,t,.05,.025,"triangle");
   if(st%2===0)sound(1800,t,.025,.008,"square",st%4===0?-.35:.35);
   if(st%4===0||genre==="chiptune"&&st%2===0)sound(pitch(rootNote),t,stepDur*2.4,.06,genre==="chiptune"?"triangle":"sine",-.15);
   const lead=genre==="chiptune"||genre==="techno"&&st%2===0||genre==="house"&&st%4===3||genre==="lofi"&&st%4===0;
   if(lead){
    const arp=[0,7,3,10,7,3,10,12][st%8];
    sound(pitch(rootNote+24+arp),t,stepDur*(genre==="chiptune"?.85:2),genre==="chiptune"?.045:.028,genre==="chiptune"?"square":"triangle",.25);
   }
  }
 }
 // 60-second exact pattern repeats; independent of playback length.
 // 60s is a whole number of bars for all five tempi (80, 88, 120, 150 BPM).
 function schedule(){
  if(active!==a)return;
  const limit=ctx.currentTime+.18;
  while(a.next<limit&&(el.querySelector(".repeat").checked||a.next<a.start+duration+.01)){
   if(a.next>=a.start)tick(a.step,a.next);
   a.step++;a.next=a.start+a.step*stepDur;
  }
 }
 a.timer=setInterval(schedule,45);schedule();
 function frame(){
  if(active!==a)return;
  const elapsed=Math.max(0,ctx.currentTime-a.start);
  const repeat=el.querySelector(".repeat").checked;
  if(elapsed>=duration&&!repeat){stop();a.button.textContent="REPLAY";return}
  const e=repeat?elapsed%duration:elapsed;
  a.bar.style.width=Math.min(100,e/duration*100)+"%";a.time.textContent=fmt(Math.max(0,Math.ceil(duration-e)));
  a.raf=requestAnimationFrame(frame);
 }frame();
 });
}
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop()});
