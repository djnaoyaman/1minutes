const methods={coherent:{name:"COHERENT",desc:"5秒吸って、5秒吐く。穏やかな呼吸リズムを練習します。",steps:[["吸う",5],["吐く",5]]},box:{name:"BOX BREATHING",desc:"4秒ずつ、吸う・止める・吐く・止める。息止めは無理のない範囲で。",steps:[["吸う",4],["止める",4],["吐く",4],["止める",4]]},relax:{name:"4–6 BREATHING",desc:"4秒吸い、6秒かけてゆっくり吐く。",steps:[["吸う",4],["吐く",6]]},"478":{name:"4–7–8 BREATHING",desc:"4秒吸う、7秒止める、8秒吐く。苦しければ自然な呼吸へ。",steps:[["吸う",4],["止める",7],["吐く",8]]},simple:{name:"NATURAL",desc:"3秒吸って3秒吐く。呼吸を無理に深くしないでください。",steps:[["吸う",3],["吐く",3]]}};
const $=id=>document.getElementById(id),method=$("method"),length=$("length"),start=$("start"),orb=$("orb"),phase=$("phase"),count=$("count"),music=$("music");
let running=false,origin=0,raf=0,ctx=null,nodes=[],audioTimer=0,audioStep=0,nextAudio=0;
const fmt=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(Math.ceil(n%60)).padStart(2,"0");
function updateMethod(){const m=methods[method.value];$("methodTitle").textContent=m.name;$("description").textContent=m.desc;if(!running)count.textContent=fmt(Number(length.value)*60)}
method.onchange=()=>{reset();updateMethod()};length.onchange=()=>{reset();updateMethod()};updateMethod();
music.onchange=()=>{$("genreWrap").hidden=!music.checked;$("frequencyWrap").hidden=!music.checked;if(running){stopAudio();if(music.checked)startAudio()}};
$("genre").onchange=()=>{if(running&&music.checked){stopAudio();startAudio()}};
$("frequency").onchange=()=>{if(running&&music.checked){stopAudio();startAudio()}};
function stopAudio(){clearInterval(audioTimer);audioTimer=0;for(const n of nodes){try{n.stop()}catch(e){}}nodes=[]}
function note(freq,time,duration,volume,type="sine"){
 const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.00001,time);g.gain.linearRampToValueAtTime(volume,time+.02);g.gain.setValueAtTime(volume,time+Math.max(.03,duration-.09));g.gain.exponentialRampToValueAtTime(.00001,time+duration);o.connect(g).connect(ctx.destination);o.start(time);o.stop(time+duration+.01);nodes.push(o)
}
function startAudio(){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=ctx||new AC();ctx.resume();
 const genre=$("genre").value,base=Number($("frequency").value),tempo={ambient:80,piano:100,organ:80,violin:80,chiptune:150,techno:120,lofi:100,house:120}[genre],stepDur=60/tempo/4;
 const root=[0,-5,-2,-7],chord=[0,3,7,10],wave=genre==="organ"||genre==="violin"?"sawtooth":genre==="chiptune"?"square":genre==="piano"?"triangle":"sine";
 const f=m=>base*2**((m-72)/12);
 audioStep=0;nextAudio=ctx.currentTime+.1;
 function schedule(){while(nextAudio<ctx.currentTime+.3){const st=audioStep%16,bar=Math.floor(audioStep/16),m=48+root[Math.floor(bar/2)%4];if(st===0)chord.forEach((v,j)=>note(f(m+12+v),nextAudio,Math.min(3.8,stepDur*15),genre==="organ"?.014:.02,wave));if(st%4===0)note(f(m+24+chord[(st/4+bar)%4]),nextAudio,stepDur*2.8,.025,wave);if((genre==="techno"||genre==="house")&&st%4===0)note(58,nextAudio,.16,.12);if(genre==="chiptune"&&st%2===0)note(f(m+24+chord[st%4]),nextAudio,stepDur*.8,.018,"square");audioStep++;nextAudio+=stepDur}}
 audioTimer=setInterval(schedule,60);schedule()
}
function reset(){running=false;cancelAnimationFrame(raf);stopAudio();start.textContent="START";phase.textContent="READY";orb.style.transform="scale(1)";$("progress").style.width="0%";$("remaining").textContent="残り "+fmt(Number(length.value)*60);count.textContent=fmt(Number(length.value)*60)}
$("reset").onclick=reset;
start.onclick=()=>{if(running){reset();return}running=true;origin=performance.now();start.textContent="STOP";if(music.checked)startAudio();frame()};
function frame(){if(!running)return;const duration=Number(length.value)*60,elapsed=(performance.now()-origin)/1000,repeat=$("repeat").checked;if(elapsed>=duration&&!repeat){reset();phase.textContent="COMPLETE";count.textContent="00:00";$("remaining").textContent="完了";$("progress").style.width="100%";return}
 const t=repeat?elapsed%duration:elapsed;const m=methods[method.value];const cycle=m.steps.reduce((sum,x)=>sum+x[1],0);let within=t%cycle,idx=0;while(within>=m.steps[idx][1]){within-=m.steps[idx][1];idx++}
 const [name,span]=m.steps[idx],p=within/span;
 let scale=1;if(name==="吸う")scale=.75+.85*(p*p*(3-2*p));else if(name==="吐く")scale=1.6-.85*(p*p*(3-2*p));else scale=idx>0&&m.steps[idx-1][0]==="吸う"?1.6:.75;
 orb.style.transform="scale("+scale+")";phase.textContent=name;count.textContent=(span-within).toFixed(1)+"秒";$("remaining").textContent="残り "+fmt(Math.max(0,duration-t));$("progress").style.width=(t/duration*100)+"%";raf=requestAnimationFrame(frame)}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running)reset()});