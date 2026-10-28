export const exhibits = [
 {id:'wait',name:'WAIT',tag:'余白',color:'#d8d4ca',title:'何も起こらない。',instruction:'白い点と、何もしない時間を。画面に触れても変化しません。',icon:'·'},
 {id:'flow',name:'FLOW',tag:'没頭',color:'#acd7d0',title:'次のひとつ、その次へ。',instruction:'光る数字を押してください。正解するたびに、次の場所へ。',icon:'↗'},
 {id:'anticipation',name:'ANTICIPATION',tag:'予感',color:'#dcc29b',title:'その向こうに、何か。',instruction:'扉の隙間を見つめてください。何かが現れるとは限りません。予感に触れると、光だけが応えます。',icon:'▯'},
 {id:'count',name:'COUNT',tag:'内なる時計',color:'#c9bada',title:'今だ、と感じたら。',instruction:'60秒経ったと思った瞬間に一度だけ印をつけます。印をつけても実験は続き、実時間60秒で終了します。終了まで印がない場合は「60秒内に未回答」と記録します。',icon:'○'},
 {id:'overload',name:'OVERLOAD',tag:'密度',color:'#e8c35e',title:'目に入る、入りきらない。',instruction:'次々に組み替わる情報の中から「◎」を探して押してください。見つからなくても、次へ流れます。',icon:'▦'},
 {id:'stillness',name:'STILLNESS',tag:'微光',color:'#a7bfd3',title:'変わっていない、ようで。',instruction:'光と影のわずかな変化を見つめます。画面をなぞると、光の焦点をそっと移せます。',icon:'◐'},
 {id:'memory',name:'MEMORY',tag:'残像',color:'#c9ab9b',title:'過ぎたものは、どこへ。',instruction:'現れる言葉と印を心に留めてください。60秒後、体感時間を答えてから、見た言葉を選びます。',icon:'▱'},
 {id:'choice',name:'CHOICE',tag:'分岐',color:'#b4caaf',title:'選ぶたび、別の時間。',instruction:'左右の言葉から、その瞬間に近いほうを選んでください。正解はありません。選ぶたびに次の分岐が現れます。',icon:'⑂'},
 {id:'repetition',name:'REPETITION',tag:'反復',color:'#c9c4b5',title:'同じことを、もう一度。',instruction:'同じ印を、好きなペースで押し続けてください。押すたび、紙に痕跡が積もります。',icon:'≡'},
 {id:'novelty',name:'NOVELTY',tag:'未知',color:'#c7a7d8',title:'次は、まだ知らない。',instruction:'規則が変わる小さな世界を眺めてください。「別の景色」に触れると、さらに新しい構図が現れます。速い点滅はありません。',icon:'✳'},
 {id:'rhythm',name:'RHYTHM',tag:'拍',color:'#b8c8e0',title:'時間に、拍を合わせる。',instruction:'一定の拍に合わせて、円をタップしてください。音は任意です。ミュートでも光の拍で体験できます。',icon:'∿'},
 {id:'synchrony',name:'SYNCHRONY',tag:'呼応',color:'#dbb3bd',title:'ひとりで、ふたりの時間。',instruction:'左の仮想パートナーの拍に、右の円をタップして合わせてください。相手はあなたの直前の拍に少し適応するシミュレーションです。実際の他者との通信はありません。',icon:'◌◌'}
];
export const byId=Object.fromEntries(exhibits.map(e=>[e.id,e]));
