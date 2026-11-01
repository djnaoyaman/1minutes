export const studies=[
{title:"ACOUSTIC",sub:"432 Hz / PURE TONE",desc:"432Hzの正弦波。音の高さそのものを聴く。",detail:"期待される体験：穏やかな聴き心地やリラックス。研究状況：小規模な研究はありますが、432Hz固有の効果は未確立。仕組み：432Hzは標準的なA4=440Hzより少し低い調律で話題になる数値です。この展示は432Hzの単音で、健康効果を示すものではありません。",type:"pure",freq:432},
{title:"MEDITATION",sub:"6 Hz / BINAURAL",desc:"左右200Hz・206Hz。差6Hzのバイノーラル実験。",detail:"期待される体験：瞑想や気持ちを落ち着ける時間。研究状況：バイノーラルビートの研究結果は一貫していません。仕組み：左右の耳に200Hzと206Hzを別々に届け、6Hzの差を知覚する実験です。6Hzはシータ帯域に相当しますが、脳波を6Hzに誘導する効果は確立していません。",type:"binaural",freq:200,diff:6},
{title:"SLEEP",sub:"2 Hz / BINAURAL",desc:"左右180Hz・182Hz。静かな音量で。",detail:"期待される体験：就寝前のリラックス。研究状況：2Hzの左右差が睡眠を改善するかは未確立。仕組み：180Hzと182Hzの左右差2Hzを使います。2Hzはデルタ帯域に相当しますが、睡眠を促す効果が保証されるものではありません。",type:"binaural",freq:180,diff:2},
{title:"FOCUS",sub:"16 Hz / BINAURAL",desc:"左右220Hz・236Hz。差16Hzの聴取実験。",detail:"期待される体験：作業への集中や覚醒感。研究状況：集中力向上の効果は確立していません。仕組み：220Hzと236Hzの左右差16Hzを使います。16Hzはベータ帯域に相当しますが、集中力の向上を保証するものではありません。",type:"binaural",freq:220,diff:16},
{title:"SAUNA",sub:"LOW DRONE / TEXTURE",desc:"55Hzと110Hzの低音ドローン。温冷の余韻。",detail:"期待される体験：低音の没入感や身体感覚への意識。研究状況：この音源による身体機能の改善は検証されていません。仕組み：55Hzと110Hzを中心に、82.41Hzと164.82Hzを重ねた低音ドローンです。身体に振動を与える機械的振動療法とは異なります。",type:"drone"},
{title:"MUSIC",sub:"528 Hz / HARMONICS",desc:"528Hzと倍音を重ねた音色の実験。",detail:"期待される体験：穏やかな気分やストレス軽減。研究状況：小規模研究はありますが、528Hz固有の健康効果は未確立。仕組み：528Hzを中心に1056Hz・1584Hzの倍音と264Hzを重ねます。528Hzはソルフェジオ周波数として知られますが、固有の治療効果は確立していません。",type:"harmonics",freq:528}
];
// Shared frequency components for FREQUENCY and the HEARTBEAT exhibition.
export function studyTones(study) {
 if(study.type==='binaural')return [[study.freq, .7, -1],[study.freq+study.diff, .7, 1]];
 if(study.type==='harmonics')return [[study.freq,.55,0],[study.freq*2,.2,0],[study.freq*3,.12,0],[study.freq/2,.13,0]];
 if(study.type==='drone')return [[55,.4,0],[110,.3,0],[82.41,.18,0],[164.82,.12,0]];
 return [[study.freq,1,0]];
}
