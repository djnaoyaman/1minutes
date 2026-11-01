const methods={coherent:{name:"COHERENT",desc:"5秒吸って、5秒吐く。穏やかな呼吸リズムを練習します。",steps:[["吸う",5],["吐く",5]]},box:{name:"BOX BREATHING",desc:"4秒ずつ、吸う・止める・吐く・止める。息止めは無理のない範囲で。",steps:[["吸う",4],["止める",4],["吐く",4],["止める",4]]},relax:{name:"4–6 BREATHING",desc:"4秒吸い、6秒かけてゆっくり吐く。",steps:[["吸う",4],["吐く",6]]},"478":{name:"4–7–8 BREATHING",desc:"4秒吸う、7秒止める、8秒吐く。苦しければ自然な呼吸へ。",steps:[["吸う",4],["止める",7],["吐く",8]]},simple:{name:"NATURAL",desc:"3秒吸って3秒吐く。呼吸を無理に深くしないでください。",steps:[["吸う",3],["吐く",3]]}};
const additionalMethods={
diaphragm:{name:"DIAPHRAGMATIC / 腹式呼吸",desc:"横隔膜を意識して穏やかに呼吸。お腹が自然に動く様子を観察します。",steps:[["吸う",4],["吐く",6]]},
pursed:{name:"PURSED-LIP / 口すぼめ呼吸",desc:"鼻から吸い、口をすぼめてゆっくり吐く。呼気を長めにする練習です。",steps:[["吸う",2],["吐く",4]]},
sama:{name:"SAMA VRITTI / 等間隔呼吸",desc:"ヨガに由来する、吸う時間と吐く時間をそろえる練習。",steps:[["吸う",4],["吐く",4]]},
ujjayi:{name:"UJJAYI / ウジャイ",desc:"ヨガで用いられる喉の穏やかな音を伴う呼吸。無理に喉を締めないでください。",steps:[["吸う",4],["吐く",4]]},
nadi:{name:"NADI SHODHANA / 片鼻呼吸",desc:"ヨガの交互鼻孔呼吸。左右の鼻を交互に使う手順を学びます。鼻を無理にふさがないでください。",steps:[["左から吸う",4],["右から吐く",4],["右から吸う",4],["左から吐く",4]]},
zen:{name:"SUSOKUKAN / 数息観",desc:"禅で行われる呼吸の観察。呼吸を無理に制御せず、数を数えることに注意を向けます。",steps:[["自然に吸う",4],["自然に吐く",6]]},
buteyko:{name:"BUTeyKO / ブテイコ",desc:"鼻呼吸と穏やかな呼吸への注意を学ぶ入門。息苦しさを我慢する訓練は行いません。",steps:[["鼻から吸う",3],["鼻から吐く",4]]},
resonance:{name:"RESONANCE / 6回毎分",desc:"1分に約6回のゆっくりした呼吸。自分に合った無理のない速さを優先します。",steps:[["吸う",4],["吐く",6]]},
physiological:{name:"CYCLIC SIGHING / サイクリック・サイ",desc:"小さく追加で吸い、ゆっくり吐く呼吸のパターン。強く吸い込みすぎないでください。",steps:[["吸う",2],["少し追加で吸う",1],["ゆっくり吐く",6]]},
triangle:{name:"TRIANGLE / 三角呼吸",desc:"吸う・止める・吐くを等間隔に。息止めが苦しければ別の方法を選んでください。",steps:[["吸う",4],["止める",4],["吐く",4]]},
wimhof:{name:"WIM HOF / ヴィム・ホフ",desc:"学習モード。速く深い呼吸と息止めを組み合わせる方法の歴史と注意点を紹介します。過換気や失神の危険があるため、この展示では自動誘導しません。水中・入浴中・サウナ・運転中は絶対に行わないでください。",educational:true,steps:[["自然に吸う",4],["自然に吐く",6]]},
kapalabhati:{name:"KAPALABHATI / カパーラバーティ",desc:"学習モード。ヨガの速い呼気を伴う伝統的技法。めまいや過換気の危険があるため自動誘導は行いません。",educational:true,steps:[["自然に吸う",4],["自然に吐く",6]]},
bhastrika:{name:"BHASTRIKA / バストリカ",desc:"学習モード。力強い吸気と呼気を伴うヨガの呼吸法。自動誘導は行いません。",educational:true,steps:[["自然に吸う",4],["自然に吐く",6]]},
tummo:{name:"TUMMO / トゥンモ",desc:"学習モード。チベット仏教に伝わる修行体系の一部で、呼吸だけでなく瞑想や観想を含みます。この展示では実践を自動誘導しません。",educational:true,steps:[["自然に吸う",4],["自然に吐く",6]]}
};
Object.assign(methods,additionalMethods);
const $=id=>document.getElementById(id),method=$("method"),length=$("length"),start=$("start"),orb=$("orb"),phase=$("phase"),count=$("count"),music=$("music");
let running=false,origin=0,raf=0,ctx=null,nodes=[],audioTimer=0,audioStep=0,nextAudio=0;
const fmt=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(Math.ceil(n%60)).padStart(2,"0");
function updateMethod(){const m=methods[method.value];start.disabled=!!m.educational;start.title=m.educational?"学習専用。自動誘導は提供していません。":"";$("methodTitle").textContent=m.name;$("description").textContent=m.desc;if(!running)count.textContent=fmt(Number(length.value)*60)}
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
function reset(){running=false;cancelAnimationFrame(raf);stopAudio();start.textContent="START";phase.textContent="READY";orb.style.transform="scale(1)";orb.style.background="radial-gradient(circle at 38% 35%,#d9e5e4,#70969d 55%,#3c5763)";$("progress").style.width="0%";$("remaining").textContent="残り "+fmt(Number(length.value)*60);count.textContent=fmt(Number(length.value)*60)}
$("reset").onclick=reset;
start.onclick=()=>{if(running){reset();return}running=true;origin=performance.now();start.textContent="STOP";if(music.checked)startAudio();frame()};
function frame(){if(!running)return;const duration=Number(length.value)*60,elapsed=(performance.now()-origin)/1000,repeat=$("repeat").checked;if(elapsed>=duration&&!repeat){reset();phase.textContent="COMPLETE";count.textContent="00:00";$("remaining").textContent="完了";$("progress").style.width="100%";return}
 const t=repeat?elapsed%duration:elapsed;const m=methods[method.value];const cycle=m.steps.reduce((sum,x)=>sum+x[1],0);let within=t%cycle,idx=0;while(within>=m.steps[idx][1]){within-=m.steps[idx][1];idx++}
 const [name,span]=m.steps[idx],p=within/span;
 let scale=1;if(name==="吸う")scale=.75+.85*(p*p*(3-2*p));else if(name==="吐く")scale=1.6-.85*(p*p*(3-2*p));else scale=idx>0&&m.steps[idx-1][0]==="吸う"?1.6:.75;
 orb.style.transform="scale("+scale+")";const stage=name.includes("吸う")?"inhale":name.includes("吐く")?"exhale":"hold";orb.dataset.stage=stage;orb.style.background=stage==="inhale"?"radial-gradient(circle at 38% 35%,#c9f1fa,#3facc8 55%,#176079)":stage==="exhale"?"radial-gradient(circle at 38% 35%,#ffe6c5,#e8a86d 55%,#96582c)":"radial-gradient(circle at 38% 35%,#e5d7ff,#9b83d2 55%,#5d498b)";phase.textContent=name;count.textContent=(span-within).toFixed(1)+"秒";$("remaining").textContent="残り "+fmt(Math.max(0,duration-t));$("progress").style.width=(t/duration*100)+"%";raf=requestAnimationFrame(frame)}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running)reset()});
const atlasData={"478":["アンドルー・ワイル医師が普及","4秒吸い、7秒止め、8秒吐くリズム。","ワイル医師はリラックスのための呼吸法として紹介しています。","寝る前に習慣化する愛好者がいますが、睡眠効果には個人差があります。"],"coherent":["現代の呼吸生理学","ゆっくりした一定の呼吸リズムに注目する方法。","呼吸ペースを整えることで落ち着きや心拍変動への影響が期待されると紹介されています。","愛好者には、気持ちを切り替えやすいという声があります。個人の感想です。"],"box":["現代のストレスマネジメント","吸う・止める・吐く・止めるを四角形のように等間隔で進めます。","緊張する場面で注意を呼吸に戻す実践として紹介されています。","仕事やスポーツ前のルーティンとして取り入れる人がいます。"],"relax":["現代のリラクゼーション","吐く時間を長くする、覚えやすい呼吸リズムです。","ゆっくり吐くことがリラックスに役立つと考えられています。","就寝前や休憩時に取り入れやすいという意見があります。"],"simple":["日常の呼吸観察","呼吸に意識を向けるための入門用パターンです。","特定の提唱者による治療法ではなく、呼吸を観察する練習です。","初めてでも取り組みやすいことが魅力です。"],"diaphragm":["呼吸リハビリテーション","横隔膜の動きを意識し、お腹の自然な動きを観察します。","呼吸の効率や落ち着きに着目した練習として使われています。","姿勢や身体の緊張に気づきやすいという実践者の意見があります。"],"pursed":["呼吸リハビリテーション","鼻から吸い、口をすぼめてゆっくり吐きます。","息切れに対処するための呼吸技法として医療現場でも案内されています。","息を急いで吐かずに済むという実践者の声があります。"],"sama":["インドのヨガ伝統","サマ・ヴリッティは吸う時間と吐く時間をそろえる呼吸です。","ヨガでは呼吸の均衡と注意の安定を重視します。","一定のテンポが瞑想に入りやすいという愛好者の意見があります。"],"ujjayi":["インドのヨガ伝統","喉の奥を軽く狭め、波のような小さな音を伴う呼吸です。","ヨガの指導者は呼吸音を動作と注意の目印として用います。","動きと呼吸がつながる感覚を好む実践者がいます。"],"nadi":["インドのヨガ伝統","左右の鼻孔を交互に使う呼吸です。","伝統的には気の流れを整えると説明されますが、これは文化的な解釈です。","左右を切り替える動作が集中の助けになるという意見があります。"],"zen":["日本の禅仏教","数息観は自然な呼吸を数えて注意を保つ瞑想法です。","禅の実践では、呼吸を操作するより観察する姿勢が重視されます。","雑念に気づきやすくなると語る実践者がいます。"],"buteyko":["コンスタンチン・ブテイコ","鼻呼吸や呼吸量への意識を重視する方法です。","提唱者は過度な呼吸を見直す重要性を説きました。医学的主張のすべてが確立したわけではありません。","日常の鼻呼吸を意識するきっかけになったという意見があります。"],"resonance":["現代の呼吸研究・バイオフィードバック","1分に約6回のゆっくりした呼吸を目安にします。","研究者は心拍変動と呼吸の関係に注目しています。最適な速さは人により異なります。","心拍の動きと呼吸のつながりを感じることを楽しむ人もいます。"],"physiological":["現代の呼吸研究","短い追加吸気と長い呼気を組み合わせます。","研究者はストレスや気分との関係を調べています。","短時間で気持ちを切り替えられると感じる人もいます。"],"triangle":["現代の呼吸トレーニング","吸う・止める・吐くを同じ長さで行います。","一定の区切りを作り、呼吸への注意を保つ方法として紹介されています。","リズムが覚えやすいという愛好者の意見があります。"],"wimhof":["ヴィム・ホフ／オランダ","深く速い呼吸と息止め、寒冷曝露などを組み合わせるメソッドです。","ホフ氏は心身の強さや寒さへの適応を強調しています。主張の全体が医学的に立証されたわけではありません。","実践者は覚醒感や達成感を語りますが、過換気による失神の危険があります。水中・入浴中・サウナでは行わないでください。"],"kapalabhati":["インドのヨガ伝統","力強い呼気を反復する技法です。","伝統的なヨガでは浄化や活力と結びつけて説明されます。","爽快感を挙げる実践者もいますが、めまいや過換気の危険があるため本展示では自動誘導しません。"],"bhastrika":["インドのヨガ伝統","ふいごのような力強い吸気・呼気を特徴とします。","伝統的には活力を高める実践として紹介されます。","熱感や覚醒感を語る人もいますが、効果は個人差があり、自動誘導は行いません。"],"tummo":["チベット仏教の修行伝統","呼吸に加え観想・瞑想を含む複合的な修行です。","伝統では内なる熱の修行として位置づけられています。単なる呼吸タイマーには還元できません。","身体の温かさや集中を語る実践者がいますが、ここでは文化的背景の学習にとどめます。"]};
const atlas=document.getElementById("breath-atlas");
if(atlas){for(const [key,values] of Object.entries(atlasData)){const m=methods[key];const article=document.createElement("article");article.style.cssText="padding:22px 0;border-top:1px solid #444";const heading=document.createElement("h3");heading.textContent=m.name;heading.style.fontWeight="500";article.append(heading);for(const [label,value] of [["由来・提唱者",values[0]],["どんな呼吸法か",values[1]],["提唱者・伝統の考え方",values[2]],["実践者の受け止め方",values[3]]]){const p=document.createElement("p");const strong=document.createElement("strong");strong.textContent=label+" — ";p.append(strong,document.createTextNode(value));article.append(p)}atlas.append(article)}}
