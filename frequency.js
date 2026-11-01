const studies=[
{title:"ACOUSTIC",sub:"432 Hz / PURE TONE",desc:"432Hzの正弦波。音の高さそのものを聴く。",detail:"期待される体験：穏やかな聴き心地やリラックス。研究状況：小規模な研究はありますが、432Hz固有の効果は未確立。仕組み：432Hzは標準的なA4=440Hzより少し低い調律で話題になる数値です。この展示は432Hzの単音で、健康効果を示すものではありません。",type:"pure",freq:432},
{title:"MEDITATION",sub:"6 Hz / BINAURAL",desc:"左右200Hz・206Hz。差6Hzのバイノーラル実験。",detail:"期待される体験：瞑想や気持ちを落ち着ける時間。研究状況：バイノーラルビートの研究結果は一貫していません。仕組み：左右の耳に200Hzと206Hzを別々に届け、6Hzの差を知覚する実験です。6Hzはシータ帯域に相当しますが、脳波を6Hzに誘導する効果は確立していません。",type:"binaural",freq:200,diff:6},
{title:"SLEEP",sub:"2 Hz / BINAURAL",desc:"左右180Hz・182Hz。静かな音量で。",detail:"期待される体験：就寝前のリラックス。研究状況：2Hzの左右差が睡眠を改善するかは未確立。仕組み：180Hzと182Hzの左右差2Hzを使います。2Hzはデルタ帯域に相当しますが、睡眠を促す効果が保証されるものではありません。",type:"binaural",freq:180,diff:2},
{title:"FOCUS",sub:"16 Hz / BINAURAL",desc:"左右220Hz・236Hz。差16Hzの聴取実験。",detail:"期待される体験：作業への集中や覚醒感。研究状況：集中力向上の効果は確立していません。仕組み：220Hzと236Hzの左右差16Hzを使います。16Hzはベータ帯域に相当しますが、集中力の向上を保証するものではありません。",type:"binaural",freq:220,diff:16},
{title:"SAUNA",sub:"LOW DRONE / TEXTURE",desc:"55Hzと110Hzの低音ドローン。温冷の余韻。",detail:"期待される体験：低音の没入感や身体感覚への意識。研究状況：この音源による身体機能の改善は検証されていません。仕組み：55Hzと110Hzを中心に、82.41Hzと164.82Hzを重ねた低音ドローンです。身体に振動を与える機械的振動療法とは異なります。",type:"drone"},
{title:"MUSIC",sub:"528 Hz / HARMONICS",desc:"528Hzと倍音を重ねた音色の実験。",detail:"期待される体験：穏やかな気分やストレス軽減。研究状況：小規模研究はありますが、528Hz固有の健康効果は未確立。仕組み：528Hzを中心に1056Hz・1584Hzの倍音と264Hzを重ねます。528Hzはソルフェジオ周波数として知られますが、固有の治療効果は確立していません。",type:"harmonics",freq:528}
];
const root=document.getElementById("tracks");
const lengths=[1,2,3,4,5,10,15,20,30,45,60];
const genres=[
["pure","周波数のみ"],["organ","PIPE ORGAN"],["violin","VIOLIN"],["piano","PIANO"],["chiptune","8-BIT"],["techno","TECHNO"],["ambient","AMBIENT"],["lofi","LO-FI HIP HOP"],["house","DEEP HOUSE"]
];
const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(Math.floor(s%60)).padStart(2,"0");
let ctx=null,active=null;
studies.forEach((s,i)=>{
 const el=document.createElement("article");el.className="track";
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
  const v=s.type==="binaural"?.19:.16;
  if(s.type==="binaural"){sound(s.freq,now,3601,v,"sine",-1);sound(s.freq+s.diff,now,duration+.1,v,"sine",1)}
  else if(s.type==="drone"){sound(55,now,3601,.16);sound(110,now,3601,.06);sound(82.41,now,3601,.045)}
  else {sound(s.freq,now,3601,.12);if(s.type==="harmonics")sound(1056,now,3601,.025)}
 }
 // For repeating sessions, the continuous carrier is restarted at each session boundary.
 base();
 const tempo={organ:80,violin:80,piano:100,ambient:80,techno:120,chiptune:150,lofi:100,house:120}[genre]||120;
 const stepDur=60/tempo/4;
 const rootMidi=[48,45,41,43][i%4];
 const tuning=s.type==="pure"?432:s.type==="harmonics"?528:440;
 const pitch=m=>tuning*2**((m-(s.type==="pure"?69:s.type==="harmonics"?72:69))/12);
 const scale=[0,3,5,7,10,12,15,17];
 function tick(step,t){
  if(genre==="pure")return;
  const st=step%16,bar=Math.floor(step/16),rootNote=rootMidi+[0,-2,-5,-2][bar%4];
  const melodic=[0,2,4,5,7,5,4,2,3,5,7,4,2,3,1,0][(st+bar%4)%16];
  if(genre==="ambient"||genre==="organ"||genre==="violin"||genre==="piano"){
   if(st===0){const kind=genre==="organ"?"sawtooth":genre==="violin"?"sawtooth":genre==="piano"?"triangle":"sine";const level=genre==="organ"?.032:genre==="violin"?.022:.065;sound(pitch(rootNote+12),t,Math.min(3.8,stepDur*15),level,kind,-.25);sound(pitch(rootNote+19),t,Math.min(3.8,stepDur*15),level*.5,kind,.3)}
   if(genre==="piano"&&st%4===0)sound(pitch(rootNote+24+scale[melodic%8]),t,stepDur*3,.048,"triangle",.2);else if(genre==="violin"&&st%4===0)sound(pitch(rootNote+24+scale[melodic%8]),t,stepDur*4,.018,"sawtooth",.2);else if(st%8===4)sound(pitch(rootNote+24+scale[melodic%8]),t,stepDur*7,.028,genre==="organ"?"sine":"sine",.2);
  }else{
   if(st%4===0&&(genre==="techno"||genre==="house"||genre==="minimal")){
    sound(58,t,.13,.18,"sine");sound(41,t,.18,.08,"triangle");
   }
   if(st%4===2&&(genre==="lofi"||genre==="house"||genre==="techno")){
    sound(170,t,.055,.035,"triangle");
   }
   if(st%2===0&&genre!=="minimal")sound(1800,t,.025,.012,"square",st%4===0?-.35:.35);
   if(st%4===0||genre==="chiptune"&&st%2===0)
    sound(pitch(rootNote),t,stepDur*(genre==="ambient"?3:2.4),.075,genre==="chiptune"?"triangle":"sine",-.15);
   const playLead=genre==="chiptune"||genre==="techno"&&st%2===0||genre==="house"&&st%4===3||genre==="lofi"&&st%4===0;
   if(playLead)sound(pitch(rootNote+24+scale[melodic%8]),t,stepDur*(genre==="chiptune"?.85:2.5),genre==="chiptune"?.06:.035,genre==="chiptune"?"square":"triangle",.25);
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
