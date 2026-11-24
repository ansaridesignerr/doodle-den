const express=require('express'),http=require('http'),{Server}=require('socket.io');
const app=express();app.use(express.static(__dirname+'/public'));
const srv=http.createServer(app),io=new Server(srv,{maxHttpBufferSize:1e5});
// words: "easy|medium|hard" per category
const C={
objects:'chair,table,cup,bottle,clock,umbrella,phone,laptop,camera,key,book,bag,shoe,mirror,fan,lamp,scissors,watch,guitar,piano,drum,balloon,gift|toothbrush,backpack,telescope,microscope,headphones,calculator,candle,ladder,hammer,suitcase|binoculars,compass,hourglass,typewriter,chandelier,treasure chest',
animals:'cat,dog,lion,tiger,elephant,giraffe,monkey,rabbit,snake,turtle,horse,cow,sheep,bear,panda,fox,wolf,pig,frog,bee,spider,fish|crocodile,goat,kangaroo,zebra,camel,dolphin,shark,octopus,butterfly,squirrel|hedgehog,seahorse,jellyfish,scorpion,chameleon,rhinoceros',
birds:'duck,hen,owl,swan,crow|eagle,parrot,peacock,pigeon,sparrow,chicken,penguin,flamingo,rooster|ostrich,woodpecker,pelican,toucan,hummingbird',
food:'pizza,burger,cake,apple,banana,mango,egg,carrot,corn,pear,bread,cookie|sandwich,ice cream,watermelon,strawberry,grapes,orange,pineapple,coconut,donut,french fries,potato,popcorn,cupcake|broccoli,pomegranate,spaghetti,hot dog,sushi,taco,pancakes',
vehicles:'car,bus,boat,ship,train,truck|bicycle,motorcycle,airplane,helicopter,tractor,scooter,rocket,hot air balloon,ambulance|submarine,ferry,cable car,fire truck,sailboat,skateboard',
places:'house,school,park,beach,bank,shop,farm,tent|hospital,airport,restaurant,mosque,mountain,bridge,castle,hotel,stadium,lighthouse,tower,train station,igloo|aquarium,windmill,ferris wheel,pyramid,circus,library,zoo,museum',
nature:'sun,moon,star,cloud,rainbow,rain,snow,tree,flower,leaf|volcano,cactus,waterfall,river,ocean,desert,forest,lightning,island|tornado,iceberg,cave,coral reef,palm tree',
sports:'football,cricket,tennis,golf,boxing|basketball,badminton,swimming,skateboarding,bowling,baseball,volleyball|archery,surfing,skiing,weightlifting,gymnastics,fencing',
household:'bed,door,plate,spoon,fork,knife,pillow,bucket,broom,window,sofa|refrigerator,washing machine,oven,television,curtain,dustbin,toaster,blender,vacuum cleaner|fireplace,bunk bed,chimney,bathtub,sink',
clothing:'shirt,hat,cap,dress,socks,ring,tie,belt,crown|t-shirt,jeans,sunglasses,jacket,gloves,necklace,scarf,sandals|sweater,tuxedo,high heels,raincoat,top hat',
jobs:'doctor,teacher,chef,farmer,pilot,painter|police officer,firefighter,astronaut,photographer,barber,mechanic,fisherman,nurse|construction worker,magician,detective,scientist,clown,musician',
fantasy:'robot,ghost,dragon,king,queen,pirate|dinosaur,mermaid,alien,superhero,snowman,santa claus,wizard,unicorn|vampire,genie,zombie,knight,fairy,viking'};
const seen=new Set(),WORDS=[];
for(const[c,s]of Object.entries(C))s.split('|').forEach((g,d)=>g.split(',').forEach(w=>{w=w.trim();if(!seen.has(w)){seen.add(w);WORDS.push({w,c,d})}}));
const rooms=new Map(),DIFF={easy:0,medium:1,hard:2};
const rid=()=>Math.random().toString(36).slice(2,10),cn=n=>String(n||'').replace(/[<>&"'`]/g,'').trim().slice(0,14);
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim(),cl=v=>Math.min(1,Math.max(0,+v||0));
const lev=(a,b)=>{const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]};
const code=()=>{let c;do{c=Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random()*24|0]).join('')}while(rooms.has(c));return c};
const pk=(v,a,d)=>a.includes(+v)?+v:d;
const cfg=d=>({name:cn(d.rn)||'Doodle Den',max:Math.min(8,Math.max(2,+d.max||8)),rounds:pk(d.rounds,[3,5,7,10],3),time:pk(d.time,[60,80,100,120],80),diff:DIFF[d.diff]!==undefined?d.diff:'easy',hints:d.hints!==false,showCat:!!d.showCat,cats:Array.isArray(d.cats)&&d.cats.length?d.cats.filter(c=>C[c]):Object.keys(C),custom:String(d.custom||'').split(',').map(x=>norm(x)).filter(Boolean).slice(0,100)});
const mk=(n,a)=>({tok:rid()+rid(),id:rid(),name:n,avatar:String(a||'🐱').slice(0,4),ready:false,score:0,hits:0,gain:0,on:true,sock:null});
const say=(r,text,k)=>io.to(r.code).emit('chat',{t:'sys',text,k});
function view(r,p){const a=r.turn&&r.turn.tok,isA=p.tok===a,res=r.phase==='result'||r.phase==='final';
return{code:r.code,settings:r.s,phase:r.phase,round:r.turn?r.turn.round:0,left:r.left,me:p.id,isArtist:isA,hint:r.hint,
players:[...r.players.values()].map(q=>({id:q.id,name:q.name,avatar:q.avatar,ready:q.ready,score:q.score,on:q.on,hits:q.hits,gain:q.gain,ok:r.ok.has(q.tok),art:q.tok===a,host:q.tok===r.host})),
choices:isA&&r.phase==='picking'?r.choices:null,word:(isA||res||r.ok.has(p.tok))?r.word:null,
cat:(r.s.showCat||isA||res)&&r.phase!=='picking'?r.cat:null,order:r.phase==='result'?r.order.map(o=>({n:(r.players.get(o.tok)||{}).name,pts:o.pts})):[]}}
function push(r){for(const p of r.players.values())if(p.sock)io.to(p.sock).emit('state',view(r,p))}
function words(r){const d=DIFF[r.s.diff];let pool=WORDS.filter(x=>r.s.cats.includes(x.c)&&x.d===d&&!r.used.has(x.w));
r.s.custom.forEach(w=>!r.used.has(w)&&pool.push({w,c:'custom',d}));
if(pool.length<3){r.used.clear();pool=WORDS.filter(x=>x.d===d)}
for(let i=pool.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[pool[i],pool[j]]=[pool[j],pool[i]]}return pool.slice(0,3)}
function hint(r){r.hint=[...r.word].map((c,i)=>c===' '?'/':!/[a-z]/i.test(c)?c:r.rev.has(i)?c.toUpperCase():'_').join(' ')}
function reveal(r){const idx=[...r.word].map((c,i)=>i).filter(i=>/[a-z]/i.test(r.word[i])&&!r.rev.has(i));
if(!idx.length||r.rev.size>=Math.ceil(r.word.replace(/[^a-z]/gi,'').length/3))return;r.rev.add(r.rev.size?idx[Math.random()*idx.length|0]:idx[0]);hint(r)}
function run(r){clearInterval(r.iv);r.iv=setInterval(()=>{r.left--;tick(r);push(r)},1000)}
function tick(r){const ph=r.phase;
if(ph==='drawing'&&r.s.hints&&(r.left===Math.floor(r.total*.6)||r.left===Math.floor(r.total*.3)))reveal(r);
if(r.left>0)return;
if(ph==='countdown'||ph==='result')next(r);else if(ph==='picking')pick(r,r.choices[Math.random()*r.choices.length|0]);else if(ph==='drawing')endTurn(r)}
function begin(r){const on=[...r.players.values()].filter(x=>x.on);
r.players.forEach((x,k)=>{if(!x.on)r.players.delete(k);x.score=x.hits=x.gain=0;x.ready=false});
r.turns=[];for(let i=1;i<=r.s.rounds;i++)on.forEach(x=>r.turns.push({tok:x.tok,round:i}));
r.ti=-1;r.turn=null;r.ok=new Set();r.order=[];r.word=r.hint=r.cat=null;r.used=new Set();r.strokes=[];r.phase='countdown';r.left=3;run(r);push(r)}
function next(r){let t;do{r.ti++;t=r.turns[r.ti]}while(t&&!(r.players.get(t.tok)||{}).on);
if(!t){r.phase='final';r.turn=null;clearInterval(r.iv);return}
r.turn=t;r.phase='picking';r.choices=words(r);r.word=r.hint=r.cat=null;r.ok=new Set();r.order=[];r.strokes=[];
r.players.forEach(x=>x.gain=0);r.left=15;io.to(r.code).emit('redraw',[]);say(r,r.players.get(t.tok).name+' is choosing a word…')}
function pick(r,w){r.word=w.w;r.cat=w.c;r.used.add(w.w);r.rev=new Set();r.phase='drawing';r.total=r.left=r.s.time;hint(r);say(r,r.players.get(r.turn.tok).name+' is drawing!')}
function endTurn(r){if(r.phase!=='drawing')return;r.phase='result';r.left=6;say(r,'The word was '+r.word.toUpperCase(),'ok')}
function toLobby(r){clearInterval(r.iv);r.phase='lobby';r.turn=null;r.strokes=[];r.players.forEach((x,k)=>{x.ready=false;if(!x.on)r.players.delete(k)});io.to(r.code).emit('redraw',[])}
function drop(r,tok){const p=r.players.get(tok);if(!p)return;r.players.delete(tok);say(r,p.name+' left');check(r)}
function check(r){const on=[...r.players.values()].filter(x=>x.on);
if(!on.length){setTimeout(()=>{if(![...r.players.values()].some(x=>x.on)){clearInterval(r.iv);rooms.delete(r.code)}},12e4);return}
const h=r.players.get(r.host);if(!h||!h.on)r.host=on[0].tok;
const g=r.phase!=='lobby'&&r.phase!=='final';
if(g&&on.length<2){toLobby(r);say(r,'Not enough players — back to the lobby')}
else if(g&&r.turn&&!(r.players.get(r.turn.tok)||{}).on){if(r.phase==='drawing')endTurn(r);else if(r.phase==='picking')next(r)}
else if(r.phase==='drawing'&&r.ok.size>=on.filter(x=>x.tok!==r.turn.tok).length)endTurn(r);
push(r)}

io.on('connection',s=>{
let r=null,p=null;const rl={};
const rate=(k,ms)=>{const n=Date.now();if(n-(rl[k]||0)<ms)return false;rl[k]=n;return true};
const live=()=>r&&p&&r.players.get(p.tok)===p,host=()=>live()&&p.tok===r.host,art=()=>live()&&r.phase==='drawing'&&r.turn.tok===p.tok;
const attach=(room,pl)=>{r=room;p=pl;pl.sock=s.id;pl.on=true;clearTimeout(pl.dt);s.join(r.code);s.emit('redraw',r.strokes);push(r)};
s.on('create',(d,cb)=>{d=d||{};if(typeof cb!=='function'||!rate('c',1000))return;const n=cn(d.name);if(!n)return cb({err:'Enter a nickname'});
const room={code:code(),s:cfg(d),players:new Map(),phase:'lobby',strokes:[],ok:new Set(),order:[],used:new Set(),left:0};rooms.set(room.code,room);
const pl=mk(n,d.avatar);room.players.set(pl.tok,pl);room.host=pl.tok;attach(room,pl);cb({ok:1,tok:pl.tok,code:room.code})});
s.on('join',(d,cb)=>{d=d||{};cb=typeof cb==='function'?cb:()=>{};if(!rate('j',500))return;
const room=rooms.get(String(d.code||'').toUpperCase().slice(0,5));if(!room)return cb({err:'Room not found or expired'});
let pl=room.players.get(d.tok);
if(!pl){if(room.phase!=='lobby')return cb({err:'That game has already started'});if(room.players.size>=room.s.max)return cb({err:'Room is full'});
const n=cn(d.name);if(!n)return cb({err:'Enter a nickname'});pl=mk(n,d.avatar);room.players.set(pl.tok,pl);say(room,n+' joined')}
attach(room,pl);cb({ok:1,tok:pl.tok,code:room.code})});
s.on('ready',()=>{if(live()&&r.phase==='lobby'){p.ready=!p.ready;push(r)}});
s.on('kick',id=>{if(!host()||r.phase!=='lobby')return;const q=[...r.players.values()].find(x=>x.id===id);
if(q&&q.tok!==r.host){if(q.sock){io.to(q.sock).emit('kicked');const k=io.sockets.sockets.get(q.sock);k&&k.leave(r.code)}drop(r,q.tok)}});
s.on('start',(d,cb)=>{cb=typeof cb==='function'?cb:()=>{};if(!host()||r.phase!=='lobby')return;const on=[...r.players.values()].filter(x=>x.on);
if(on.length<2)return cb({err:'Need at least 2 players'});if(on.some(x=>x.tok!==r.host&&!x.ready))return cb({err:'Waiting for everyone to be ready'});begin(r)});
s.on('again',()=>{if(host()&&r.phase==='final'){[...r.players.values()].filter(x=>x.on).length>1?begin(r):toLobby(r);push(r)}});
s.on('lobby',()=>{if(host()&&r.phase==='final'){toLobby(r);push(r)}});
s.on('pick',i=>{if(live()&&r.phase==='picking'&&r.turn.tok===p.tok&&r.choices[i]){pick(r,r.choices[i]);push(r)}});
s.on('ss',k=>{if(!art()||!k||!rate('ss',5)||r.strokes.length>400)return;
const st={id:String(k.id).slice(0,12),c:/^#[0-9a-f]{6}$/i.test(k.c)?k.c:'#000000',s:Math.min(60,Math.max(1,+k.s||6)),p:[[cl(k.p&&k.p[0]&&k.p[0][0]),cl(k.p&&k.p[0]&&k.p[0][1])]]};
r.strokes.push(st);s.to(r.code).emit('ss',st)});
s.on('sp',d=>{if(!art()||!d||!Array.isArray(d.p)||!rate('sp',10))return;const k=r.strokes[r.strokes.length-1];if(!k||k.id!==String(d.id).slice(0,12)||k.p.length>4000)return;
const pts=d.p.slice(0,200).map(q=>[cl(q&&q[0]),cl(q&&q[1])]);k.p.push(...pts);s.to(r.code).emit('sp',{id:k.id,p:pts})});
s.on('undo',()=>{if(art()&&rate('u',150)){r.strokes.pop();io.to(r.code).emit('redraw',r.strokes)}});
s.on('clear',()=>{if(art()&&rate('u',150)){r.strokes=[];io.to(r.code).emit('redraw',[])}});
s.on('guess',t=>{if(!live()||!rate('g',400))return;t=String(t||'').slice(0,60).trim();if(!t)return;
if(r.phase!=='drawing')return io.to(r.code).emit('chat',{n:p.name,a:p.avatar,x:t});
if(r.turn.tok===p.tok)return;
if(r.ok.has(p.tok)){for(const q of r.players.values())if(q.sock&&(r.ok.has(q.tok)||q.tok===r.turn.tok))io.to(q.sock).emit('chat',{n:p.name,a:p.avatar,x:t,g:1});return}
const g=norm(t),w=norm(r.word);
if(g===w){const n=r.ok.size,pts=Math.round([100,80,60,40][Math.min(n,3)]*(.4+.6*r.left/r.total)),a=r.players.get(r.turn.tok),ag=Math.round(pts*.4);
p.score+=pts;p.gain=pts;p.hits++;r.ok.add(p.tok);r.order.push({tok:p.tok,pts});a.score+=ag;a.gain+=ag;say(r,p.name+' guessed the word! (+'+pts+')','ok');
if(r.ok.size>=[...r.players.values()].filter(x=>x.on&&x.tok!==a.tok).length){a.score+=30;a.gain+=30;endTurn(r)}
push(r);return}
if(w.length>3&&lev(g,w)===1)s.emit('chat',{t:'sys',text:'So close!'});
io.to(r.code).emit('chat',{n:p.name,a:p.avatar,x:t})});
s.on('leave',()=>{if(!live())return;const pl=p,rm=r;s.leave(rm.code);r=p=null;drop(rm,pl.tok)});
s.on('disconnect',()=>{if(!live()||p.sock!==s.id)return;const pl=p,rm=r;pl.on=false;pl.sock=null;say(rm,pl.name+' disconnected');
if(rm.phase==='lobby')pl.dt=setTimeout(()=>{if(!pl.on)drop(rm,pl.tok)},2e4);check(rm)});
});
const PORT=process.env.PORT||3000;srv.listen(PORT,()=>console.log('Doodle Den running on http://localhost:'+PORT));
