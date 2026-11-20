// 每个复刻演示的操作剧本：模仿原视频里的人在做什么，并在关键时刻截图（shot）。
// window：原视频里对应这段操作的时间范围（0–1 的比例），用来抽原作的帧。
const w=ms=>new Promise(r=>setTimeout(r,ms));
module.exports={
  'glow-button':{viewport:{width:540,height:400},run:async(p,shot)=>{for(let i=0;i<6;i++){await shot();await w(600)}}},
  'typing-cat':{viewport:{width:540,height:720},window:[0,.6],run:async(p,shot)=>{
    await p.mouse.move(80,120);await w(400);await shot();
    const h=await p.locator('#head').boundingBox();await p.mouse.move(h.x+h.width/2,h.y+h.height/3);await w(400);await shot();
    await p.mouse.move(470,90);await w(400);await shot();
    await p.keyboard.type('JDF',{delay:50});await shot();await p.keyboard.type('NEA',{delay:50});await shot();await w(300);await shot()}},
  'hold-to-delete':{viewport:{width:480,height:360},run:async(p,shot)=>{
    const press=async(i,ms)=>{const b=await p.locator('.bin').nth(i).boundingBox();await p.mouse.move(b.x+18,b.y+18);await p.mouse.down();await w(ms)};
    await shot();await press(1,450);await shot();await w(700);await p.mouse.up();await w(400);await shot();
    await press(0,1200);await p.mouse.up();await w(400);await press(0,1200);await p.mouse.up();await w(500);await shot();
    await p.click('#back');await w(300);await shot()}},
  'glass-dashboard':{viewport:{width:1100,height:640},window:[.1,.6],run:async(p,shot)=>{await w(150);await shot();await w(450);await shot();await w(600);await shot();await w(900);await shot();await p.hover('.stat.red');await w(400);await shot()}},
  'liquid-tab':{viewport:{width:640,height:520},run:async(p,shot)=>{
    const s=await p.locator('#svg').boundingBox();const sc=s.width/560;const tx=s.x+(60+55)*sc,ty=s.y+(120-16)*sc;
    await shot();await p.mouse.move(tx,ty);await p.mouse.down();await p.mouse.move(tx,ty-25*sc,{steps:6});await w(100);await shot();
    await p.mouse.move(tx,ty-60*sc,{steps:8});await w(100);await shot();await p.mouse.up();await w(160);await shot();await w(600);await shot();
    await p.mouse.click(s.x+(60+118+55)*sc,ty);await w(120);await shot()}},
  'holo-pack':{viewport:{width:720,height:560},run:async(p,shot)=>{
    await p.mouse.move(520,200);await w(200);await shot();await p.click('#pack');await w(500);await shot();await w(400);await shot();await w(500);await shot();await w(700);await shot();await w(900);await shot()}},
};
