// 每个复刻演示的操作剧本：模仿原视频里的人在做什么，并在关键时刻截图（shot）。
// window：原视频里对应这段操作的时间范围（0–1 的比例），用来抽原作的帧。
const w=ms=>new Promise(r=>setTimeout(r,ms));
module.exports={
  'glow-button':{viewport:{width:540,height:400},run:async(p,shot)=>{for(let i=0;i<6;i++){await shot();await w(600)}}},
  // 第 2 版（canvas 骨骼猫）。原作取样窗口 0–62%：约 2s 侧身搭鼠标、7s 被摸、11/16/20s 打字、25s 搭鼠标 + 打字
  'typing-cat':{viewport:{width:540,height:720},window:[0,.62],run:async(p,shot)=>{
    for(let i=0;i<10;i++){await p.mouse.move(150+i*10,560-i*4);await w(40)}await w(500);await shot();
    const h=await p.evaluate(()=>({x:OX+curHead.x*SC,y:OY+(curHead.y-30)*SC}));
    for(let i=0;i<8;i++){await p.mouse.move(h.x-20+i*5,h.y);await w(50)}await w(450);await shot();
    await p.mouse.move(530,10);await w(2500);
    await p.keyboard.type('HDSA',{delay:90});await shot();await p.keyboard.type('FEJ',{delay:90});await shot();await p.keyboard.type('KN',{delay:90});await shot();
    for(let i=0;i<5;i++){await p.mouse.move(400+i*6,250);await w(40)}await p.keyboard.type('EA',{delay:100});await shot()}},
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
  'power-beam':{viewport:{width:1146,height:720},window:[.25,.55],run:async(p,shot)=>{
    await shot();await p.click('#send');await w(260);await shot();await w(500);await shot();await w(550);await shot();await w(1200);await shot();await w(900);await shot()}},
  'burger-layers':{viewport:{width:1280,height:760},window:[.1,.9],run:async(p,shot)=>{for(let i=0;i<6;i++){await p.evaluate(i=>scrollTo(0,i*innerHeight),i);await w(1400);await shot()}}},
};
