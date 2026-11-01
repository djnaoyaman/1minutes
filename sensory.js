const modes=[
["HEARTBEAT","心拍を、見る。入力したBPMで光が脈動します。",["BPM",60,40,180]],
["ILLUSION","脳を、疑う。幾何学模様の錯視を観察します。",["密度",16,6,30]],
["RESONANCE","共鳴を、見る。2つの波が干渉します。",["周波数差",4,0,12]],
["MANDALA","60秒の瞑想画。対称的な模様が生まれます。",["対称軸",12,4,24]],
["COLOR","色に、浸る。色相がゆっくり変化します。",["色相",190,0,360]],
["GROWTH","成長を、眺める。樹皮や葉の陰影を描く植物の生成アート。",["葉の密度",75,20,100]],
["RIPPLE","波紋を、つくる。画面をタップして波を重ねます。",["波の速さ",6,2,12]],
["RHYTHM","リズムに、支配される。光に合わせてタップします。",["BPM",120,40,200]]
];
const $=x=>document.getElementById(x),cv=$("canvas"),g=cv.getContext("2d");let index=0,running=false,begin=0,elapsed=0,raf=0,ripples=[],errors=[];
const W=()=>cv.clientWidth,H=()=>cv.clientHeight,V=()=>Number($("parameter").value);
function resize(){let d=Math.min(devicePixelRatio||1,2);cv.width=W()*d;cv.height=H()*d;g.setTransform(d,0,0,d,0,0)}
function select(i){index=i;running=false;elapsed=0;ripples=[];errors=[];const m=modes[i];$("number").textContent=String(i+1).padStart(2,"0")+" / 08";$("name").textContent=m[0];$("desc").textContent=m[1];$("controls").innerHTML='<label>'+m[2][0]+' <output id="value">'+m[2][1]+'</output><input id="parameter" type="range" value="'+m[2][1]+'" min="'+m[2][2]+'" max="'+m[2][3]+'"></label>';$("parameter").oninput=()=>{$("value").textContent=V();draw(elapsed)};document.querySelectorAll(".chooser button").forEach((b,n)=>b.setAttribute("aria-pressed",String(n===i)));$("start").textContent="START 60 SEC";$("status").textContent="READY";$("bar").style.width="0%";draw(0)}
modes.forEach((m,i)=>{let b=document.createElement("button");b.textContent=String(i+1).padStart(2,"0")+" "+m[0];b.onclick=()=>select(i);$("chooser").append(b)});
$("start").onclick=()=>{if(running){running=false;$("start").textContent="START 60 SEC";return}running=true;begin=performance.now()-elapsed*1000;$("start").textContent="STOP";requestAnimationFrame(frame)};
$("save").onclick=()=>{let a=document.createElement("a");a.download="1minutes-"+modes[index][0].toLowerCase()+".png";a.href=cv.toDataURL("image/png");a.click()};
$("stage").onpointerdown=e=>{const r=cv.getBoundingClientRect();if(index===6)ripples.push([e.clientX-r.left,e.clientY-r.top,performance.now()/1000]);if(index===7&&running){let beat=60/V(),off=(elapsed-Math.round(elapsed/beat)*beat)*1000;errors.push(off);$("status").textContent="差 "+Math.round(off)+"ms / 平均 "+Math.round(errors.reduce((a,b)=>a+Math.abs(b),0)/errors.length)+"ms"}draw(elapsed)};
function frame(now){if(!running)return;elapsed=Math.min(60,(now-begin)/1000);$("bar").style.width=elapsed/60*100+"%";if(index!==7)$("status").textContent=(60-elapsed).toFixed(1)+" SEC";draw(elapsed);if(elapsed>=60){running=false;$("start").textContent="REPLAY";$("status").textContent="60 SEC COMPLETE"}else raf=requestAnimationFrame(frame)}
function draw(t){let w=W(),h=H(),x=w/2,y=h/2;g.clearRect(0,0,w,h);g.fillStyle="#0b1218";g.fillRect(0,0,w,h);let v=V();
if(index===0){let pulse=Math.exp(-Math.pow(((t* v/60)%1-.12)/.13,2));let r=Math.min(w,h)*(.2+.08*pulse);g.shadowBlur=55;g.shadowColor="#e8798d";g.strokeStyle="#f4a3ae";g.lineWidth=3+pulse*5;g.beginPath();g.arc(x,y,r,0,7);g.stroke();g.shadowBlur=0;g.fillStyle="white";g.textAlign="center";g.font="32px sans-serif";g.fillText(v+" BPM",x,y+10)}
if(index===1){let n=v,sz=w/n;for(let j=0;j<Math.ceil(h/sz);j++)for(let i=0;i<n;i++){g.fillStyle=(i+j)%2?"#e6e6e6":"#181818";g.fillRect(i*sz,j*sz,sz,sz);g.strokeStyle=(i+j)%2?"#718f9a":"#e8aab0";g.lineWidth=2;g.beginPath();g.arc((i+.5)*sz,(j+.5)*sz,sz*.21,0,Math.PI);g.stroke()}}
if(index===2){for(let k=0;k<3;k++){g.beginPath();for(let a=0;a<w;a+=2){let z=a/w*3,aa=Math.sin(2*Math.PI*(4*z-t*.4)),bb=Math.sin(2*Math.PI*((4+v)*z-t*.4));let yy=y+(k-1)*h*.22+(k===0?aa:k===1?bb:(aa+bb)/2)*h*.12;a?g.lineTo(a,yy):g.moveTo(a,yy)}g.strokeStyle=["#8ad7ec","#efb7a6","#d6b8f3"][k];g.lineWidth=2;g.stroke()}}
if(index===3){g.save();g.translate(x,y);for(let i=0;i<v;i++){g.save();g.rotate(i*2*Math.PI/v);for(let k=1;k<=12;k++){g.strokeStyle="hsla("+((k*25+t*5)%360)+",65%,72%,.7)";g.lineWidth=1.2;g.beginPath();g.ellipse(k*w/65,0,k*w/170,k*w/340,Math.sin(t*.05+k),0,7);g.stroke()}g.restore()}g.restore()}
if(index===4){let hue=(v+t*3)%360,grad=g.createLinearGradient(0,0,w,h);grad.addColorStop(0,"hsl("+hue+",70%,65%)");grad.addColorStop(1,"hsl("+((hue+55)%360)+",80%,35%)");g.fillStyle=grad;g.fillRect(0,0,w,h)}
if(index===5){g.fillStyle="#17241d";g.fillRect(0,0,w,h);let depth=Math.min(9,Math.floor(3+t/10));function branch(a,b,len,ang,d){let nx=a+Math.sin(ang)*len,ny=b-Math.cos(ang)*len;g.strokeStyle="hsl(27,35%,"+(22+d*3)+"%)";g.lineWidth=Math.max(.6,d*1.5);g.lineCap="round";g.beginPath();g.moveTo(a,b);g.quadraticCurveTo((a+nx)/2+len*.08,(b+ny)/2,nx,ny);g.stroke();if(d<=0){if(Math.sin(a*12+b*4)*50+50>v)return;g.fillStyle="hsl("+(95+Math.sin(a+b)*18)+",45%,"+(28+Math.sin(a)*13)+"%)";g.beginPath();g.ellipse(nx,ny,4,10,ang,0,7);g.fill();return}branch(nx,ny,len*.72,ang-.38,d-1);branch(nx,ny,len*.72,ang+.38,d-1)}branch(x,h*.95,h*.23,0,depth)}
if(index===6){g.fillStyle="#122b35";g.fillRect(0,0,w,h);let now=performance.now()/1000;ripples=ripples.filter(r=>now-r[2]<8);for(let r of ripples)for(let j=0;j<4;j++){let rad=(now-r[2])*v*13-j*24;if(rad<=0)continue;g.strokeStyle="rgba(165,220,236,"+(Math.max(0,1-(now-r[2])/8)*.55)+")";g.lineWidth=2;g.beginPath();g.arc(r[0],r[1],rad,0,7);g.stroke()}}
if(index===7){let p=(t*V()/60)%1,r=Math.min(w,h)*(.14+.06*Math.exp(-p*18));g.strokeStyle="#b7e2e7";g.lineWidth=4;g.beginPath();g.arc(x,y,r,0,7);g.stroke();g.fillStyle="#e5eff0";g.font="34px sans-serif";g.textAlign="center";g.fillText(v+" BPM",x,y+12);g.font="15px sans-serif";g.fillText("TAP THE CIRCLE",x,y+50)}
}
window.addEventListener("resize",()=>{resize();draw(elapsed)});resize();select(0);
