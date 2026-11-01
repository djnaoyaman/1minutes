const studies=[
{title:"ACOUSTIC",sub:"432 Hz / PURE TONE",desc:"432Hzの正弦波。音の高さそのものを聴く。",type:"pure",freq:432},
{title:"MEDITATION",sub:"6 Hz / BINAURAL",desc:"左右200Hz・206Hz。差6Hzのバイノーラル実験。",type:"binaural",freq:200,diff:6},
{title:"SLEEP",sub:"2 Hz / BINAURAL",desc:"左右180Hz・182Hz。静かな音量で。",type:"binaural",freq:180,diff:2},
{title:"FOCUS",sub:"16 Hz / BINAURAL",desc:"左右220Hz・236Hz。差16Hzの聴取実験。",type:"binaural",freq:220,diff:16},
{title:"SAUNA",sub:"LOW DRONE / TEXTURE",desc:"55Hzと110Hzの低音ドローン。温冷の余韻。",type:"drone"},
{title:"MUSIC",sub:"528 Hz / HARMONICS",desc:"528Hzと倍音を重ねた音色の実験。",type:"harmonics",freq:528}
];
const root=document.getElementById("tracks");let ctx=null,active=null,raf=0;
studies.forEach((s,i)=>{const el=document.createElement("article");el.className="track";el.innerHTML='<small>'+String(i+1).padStart(2,"0")+' / '+s.sub+'</small><h2>'+s.title+'</h2><p>'+s.desc+'</p><button type="button" aria-label="'+s.title+'を再生">PLAY 60 SEC</button><div class="progress"><span></span></div><small class="time">01:00</small>';root.append(el);el.querySelector("button").onclick=()=>play(i,el)});
function stop(){cancelAnimationFrame(raf);if(active){try{active.nodes.forEach(n=>n.stop())}catch(e){}active.button.textContent="PLAY 60 SEC";active.button.classList.remove("active");active=null}}
function play(i,el){if(active&&active.i===i){stop();return}stop();const AC=window.AudioContext||window.webkitAudioContext;if(!AC){alert("このブラウザはWeb Audioに対応していません");return}ctx=ctx||new AC();ctx.resume();const s=studies[i],now=ctx.currentTime,duration=60;const master=ctx.createGain();master.gain.setValueAtTime(0.00001,now);master.gain.linearRampToValueAtTime(.12,now+2);master.gain.setValueAtTime(.12,now+56);master.gain.linearRampToValueAtTime(0.00001,now+60);master.connect(ctx.destination);const nodes=[];
function osc(freq,level,pan=0,type="sine"){const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();o.type=type;o.frequency.value=freq;g.gain.value=level;p.pan.value=pan;o.connect(g).connect(p).connect(master);o.start(now);o.stop(now+duration);nodes.push(o)}
if(s.type==="pure")osc(s.freq,1);
if(s.type==="binaural"){osc(s.freq,.7,-1);osc(s.freq+s.diff,.7,1)}
if(s.type==="drone"){osc(55,.55);osc(110,.2);osc(82.41,.18);osc(164.82,.08)}
if(s.type==="harmonics"){osc(528,.65);osc(1056,.2);osc(1584,.1);osc(264,.12)}
const button=el.querySelector("button"),bar=el.querySelector(".progress span"),time=el.querySelector(".time");button.textContent="STOP";button.classList.add("active");active={i,nodes,button};function frame(){if(!active||active.i!==i)return;const t=Math.min(60,Math.max(0,ctx.currentTime-now));bar.style.width=t/60*100+"%";time.textContent="00:"+String(Math.ceil(60-t)).padStart(2,"0");if(t>=60){active=null;button.textContent="REPLAY 60 SEC";button.classList.remove("active");return}raf=requestAnimationFrame(frame)}frame()}
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop()});