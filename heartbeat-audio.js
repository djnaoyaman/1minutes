// Two damped low-frequency impacts form one synthetic heartbeat.
export function scheduleHeartbeat(context, destination, at, hz, voices = new Set()) {
 for (const [offset, level, duration] of [[0, .95, .18], [.22, .72, .14]]) {
  const start = at + offset;
  const tones = Array.isArray(hz) ? hz : [[hz,1,0]];
  for(const [frequency, amplitude, pan] of tones){
  const voice = context.createOscillator();
  const envelope = context.createGain();
  voice.type = 'sine';
  voice.frequency.setValueAtTime(frequency, start);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level * amplitude, start + .008);
  envelope.gain.exponentialRampToValueAtTime(.001, start + duration);
  envelope.gain.linearRampToValueAtTime(0, start + duration + .015);
  const panner=pan ? context.createStereoPanner() : null;
  if(panner)panner.pan.value=pan;
  voice.connect(envelope);
  if(panner)envelope.connect(panner).connect(destination);else envelope.connect(destination);
  voices.add(voice);
  voice.onended = () => { voices.delete(voice); voice.disconnect(); envelope.disconnect(); panner?.disconnect(); };
  voice.start(start); voice.stop(start + duration + .02);
  }
 }
}

export class HeartbeatAudio {
 constructor() { this.voices = new Set(); this.generation = 0; }
 async start({bpm, hz, volume, elapsed}) {
  this.stop();
  const generation = this.generation;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) throw new Error('このブラウザは心音の再生に対応していません。');
  if (!this.context) {
   this.context = new Audio();
   this.master = this.context.createGain();
   const limiter = this.context.createDynamicsCompressor();
   limiter.threshold.value = -6; limiter.knee.value = 6;
   limiter.ratio.value = 12; limiter.attack.value = .003; limiter.release.value = .12;
   this.master.connect(limiter).connect(this.context.destination);
  }
  await this.context.resume();
  if (generation !== this.generation) return;
  this.bpm = bpm; this.hz = hz;
  this.setVolume(volume);
  this.origin = this.context.currentTime + .03 - elapsed;
  this.nextBeat = Math.ceil((elapsed - .001) / (60 / bpm)) * (60 / bpm);
  const schedule = () => {
   const now = this.context.currentTime;
   const period = 60 / this.bpm;
   // A delayed/background timer must never replay a backlog of beats.
   if (this.origin + this.nextBeat < now) this.nextBeat = Math.ceil((now - this.origin) / period) * period;
   while (this.origin + this.nextBeat < now + .12 && this.nextBeat < 60) {
    scheduleHeartbeat(this.context, this.master, this.origin + this.nextBeat, this.hz, this.voices);
    this.nextBeat += period;
   }
  };
  schedule(); this.timer = setInterval(schedule, 25);
 }
 setVolume(value) {
  if (this.master) this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), this.context.currentTime, .015);
 }
 stop() {
  this.generation++;
  clearInterval(this.timer);
  if (this.master) this.master.gain.setValueAtTime(0, this.context.currentTime);
  for (const voice of this.voices) { try { voice.stop(); } catch {} }
  this.voices.clear();
 }
}
