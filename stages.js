import {nextTarget,shuffle} from './core.js';
const words=['灯台','鍵','羽根','窓','雨','貝殻','椅子','月','切符','森','舟','糸','靴','砂','鏡','雲'];
export function createStage(kind,root,act,tone,reduced){
 let score=0,elapsed=0,marked=null,beat=-1,target=0,round=-1,partner=0,nextPartner=800,lastPartner=0,period=900,lastTap=null;
 const errors=[],seen=shuffle(words).slice(0,8); let scene=0,variantIndex=-1,seed=Math.random()*100;
 const set=html=>root.innerHTML=html;
 const bind=(selector,fn)=>root.querySelectorAll(selector).forEach(el=>el.addEventListener('click',()=>act(()=>fn(el))));
 if(kind==='wait')set('<div class="waiting-point" aria-label="静止した白い点"></div>');
 if(kind==='flow'){
  set('<div class="stage-label">FOLLOW THE LIGHT</div><div class="flow-grid">'+Array.from({length:8},(_,i)=>`<button class="flow-node" data-n="${i}" aria-label="${i+1}">${i+1}</button>`).join('')+'</div><div class="trace-line" aria-hidden="true"></div>');
  target=Math.floor(Math.random()*8);const paint=()=>root.querySelectorAll('[data-n]').forEach((el,i)=>{el.classList.toggle('lit',i===target);el.setAttribute('aria-label',`${i+1}${i===target?'、ターゲット':''}`);});paint();
  bind('[data-n]',el=>{if(Number(el.dataset.n)!==target)return;score++;target=nextTarget(target);paint();});
 }
 if(kind==='anticipation'){set('<button class="door" aria-label="予感の扉に触れる"><span></span></button><p class="stage-label">ALMOST.</p>');bind('.door',()=>{score++;root.querySelector('.door').classList.toggle('touched');});}
 if(kind==='count'){set('<div class="count-orbit" aria-hidden="true"></div><button class="mark-button">60秒だと思った印をつける</button><p class="stage-label" id="mark-status">時計は、あなたの中に。</p>');bind('.mark-button',el=>{if(marked!==null)return;marked=elapsed/1000;score=1;el.disabled=true;el.textContent='印をつけました';root.querySelector('#mark-status').textContent='終了まで、そのまま。';});}
 if(kind==='overload'){set('<div class="stage-label">FIND ◎ IN THE ARCHIVE</div><div class="archive-grid"></div>');}
 if(kind==='stillness'){set('<div class="light-field" role="img" aria-label="ゆっくり移ろう光と影"><div></div></div><span class="stage-label">MOVE LIGHT, GENTLY</span>');const field=root.querySelector('.light-field');field.addEventListener('pointermove',ev=>{const r=field.getBoundingClientRect();field.style.setProperty('--x',`${Math.min(90,Math.max(10,(ev.clientX-r.left)/r.width*100))}%`);});}
 if(kind==='memory')set('<div class="memory-frame"><span class="memory-symbol" aria-hidden="true">◇</span><strong class="memory-word"></strong></div><p class="stage-label">LET IT LEAVE A TRACE</p>');
 if(kind==='choice'){set('<div class="choice-path" aria-hidden="true">│</div><div class="choice-pair"><button data-side="0"></button><button data-side="1"></button></div><p class="stage-label">NO RIGHT ANSWER</p>');const pairs=[['海','森'],['残る','進む'],['遠く','近く'],['声','沈黙'],['昨日','明日'],['軽さ','深さ'],['旅','家'],['直感','熟考']];const paint=()=>root.querySelectorAll('[data-side]').forEach((el,i)=>el.textContent=pairs[score%pairs.length][i]);paint();bind('[data-side]',el=>{score++;root.querySelector('.choice-path').textContent=el.dataset.side==='0'?'╱':'╲';paint();});}
 if(kind==='repetition'){set('<div class="stamp-paper" aria-hidden="true"></div><button class="stamp-button">押す</button><p class="stage-label">AGAIN. AGAIN.</p>');bind('.stamp-button',()=>{score++;const mark=document.createElement('span');mark.textContent='一';mark.style.cssText=`left:${8+(score*17)%80}%;top:${8+(score*11)%75}%;transform:rotate(${score%7-3}deg)`;const paper=root.querySelector('.stamp-paper');paper.append(mark);if(paper.children.length>90)paper.firstChild.remove();});}
 const novelty=()=>{scene++;const variants=['rings','type','constellation','stairs','folds','orbit'];variantIndex=(variantIndex+1+Math.floor(Math.random()*5))%6;const variant=variants[variantIndex];root.querySelector('.novel-world').className=`novel-world ${variant}`;root.querySelector('.novel-world').innerHTML=Array.from({length:12},(_,i)=>`<i style="--i:${i};--r:${(i*47+scene*31)%360}deg">${variant==='type'?['今','間','未','然'][i%4]:''}</i>`).join('');root.style.setProperty('--scene-hue',`${(scene*53+seed)%360}`);};
 if(kind==='novelty'){set('<div class="novel-world" aria-hidden="true"></div><button class="novel-button">別の景色</button>');novelty();bind('.novel-button',()=>{score++;novelty();});}
 if(kind==='rhythm'){set('<button class="pulse-pad" aria-label="拍に合わせてタップ"><span></span><b>TOUCH THE BEAT</b></button>');bind('.pulse-pad',()=>{score++;const nearest=Math.round(elapsed/750)*750;errors.push(Math.abs(elapsed-nearest));root.querySelector('.pulse-pad').classList.toggle('tapped');});}
 if(kind==='synchrony'){set('<div class="duet"><div class="partner-disc"><span></span><small>VIRTUAL PARTNER</small></div><button class="self-disc" aria-label="仮想パートナーの拍に合わせる"><span></span><small>YOU</small></button></div><p class="simulation-note">仮想パートナー / 通信なし</p>');bind('.self-disc',()=>{score++;errors.push(Math.min(Math.abs(elapsed-lastPartner),Math.abs(nextPartner-elapsed)));if(lastTap!==null){const interval=elapsed-lastTap;if(interval>450&&interval<1500)period=Math.min(1100,Math.max(650,period*.9+interval*.1));}lastTap=elapsed;root.querySelector('.self-disc').classList.toggle('tapped');});}
 return {
 update(ms){elapsed=ms;
  if(kind==='anticipation'){const amount=.2+.2*Math.sin(ms/4800)+.1*Math.sin(ms/1100);root.querySelector('.door').style.setProperty('--glow',amount);}
  if(kind==='stillness'){const field=root.querySelector('.light-field');field.style.setProperty('--light',`${32+Math.sin(ms/19000)*6}%`);if(!reduced)field.style.setProperty('--drift',`${Math.sin(ms/17000)*9}px`);}
  if(kind==='overload'&&Math.floor(ms/4200)!==round){round=Math.floor(ms/4200);target=Math.floor(Math.random()*30);const grid=root.querySelector('.archive-grid');grid.innerHTML=Array.from({length:30},(_,i)=>`<button data-cell="${i}" aria-label="${i===target?'◎':`記号 ${i+1}`}"><small>${String((round*31+i*17)%997).padStart(3,'0')}</small><b>${i===target?'◎':['△','□','◇','＋','○','∴'][Math.floor(Math.random()*6)]}</b></button>`).join('');bind('[data-cell]',el=>{if(Number(el.dataset.cell)===target&&!el.disabled){score++;el.disabled=true;el.classList.add('found');}});}
  if(kind==='memory'){const i=Math.min(7,Math.floor(ms/7500));if(i!==round){round=i;root.querySelector('.memory-word').textContent=seen[i];root.querySelector('.memory-symbol').textContent=['◇','⌁','◯','△','⋮','□','⊙','∿'][i];}}
  if(kind==='novelty'&&Math.floor(ms/(5100+seed*10))!==round){round=Math.floor(ms/(5100+seed*10));if(ms>100)novelty();}
  if(kind==='rhythm'){const b=Math.floor(ms/750);if(b!==beat){beat=b;tone(330,.06);}root.querySelector('.pulse-pad').style.setProperty('--pulse',Math.max(0,1-(ms%750)/320));}
  if(kind==='synchrony'){if(ms>=nextPartner){lastPartner=nextPartner;nextPartner+=period;partner++;tone(220,.08);}root.querySelector('.partner-disc').style.setProperty('--pulse',Math.max(0,1-(ms-lastPartner)/360));}
 },
 summary(){return {score,mark:marked,seen:kind==='memory'?seen:[],meanError:errors.length?Math.round(errors.reduce((a,b)=>a+b,0)/errors.length):null,partnerBeats:partner};},
 recallOptions:()=>shuffle(words)
 };
}
