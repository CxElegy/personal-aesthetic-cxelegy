// 小红书扫码登录（只为了看评论区；正文和视频不登录也能抓）
//   XHS_HEADLESS=1 node tools/xhs/login.js [二维码截图路径]
// 打开登录页 → 把二维码截图存下来（发给用户用手机小红书扫）→ 等用户扫码确认（最多 5 分钟）→ 登录状态存在 ~/.cache/rednote-profile
const {chromium}=require('playwright');const path=require('path'),os=require('os');
const PROFILE=process.env.XHS_PROFILE||path.join(os.homedir(),'.cache','rednote-profile');
const QR=process.argv[2]||'/tmp/xhs-qr.png';
(async()=>{
  const ctx=await chromium.launchPersistentContext(PROFILE,{headless:process.env.XHS_HEADLESS==='1',viewport:{width:1280,height:900},locale:'zh-CN'});
  const p=ctx.pages()[0]||await ctx.newPage();
  const logged=async()=>(await ctx.cookies()).some(c=>c.name==='web_session'&&c.value.length>20)&&!(await p.$('.login-container, .qrcode-img'));
  await p.goto('https://www.rednote.com/login',{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(5000);
  if(await logged()){console.log('ALREADY_LOGGED_IN');await ctx.close();return}
  const btn=await p.$('#login-btn, .login-btn, button:has-text("登录"), button:has-text("Log in")');if(btn)await btn.click().catch(()=>{});
  await p.waitForTimeout(3000);
  const q=await p.$('.qrcode-img, img[class*="qrcode"], canvas[class*="qrcode"]');
  if(q){const box=await q.boundingBox();await p.screenshot({path:QR,clip:{x:box.x-40,y:box.y-60,width:box.width+80,height:box.height+120}})}else await p.screenshot({path:QR});
  console.log('QR_READY',QR);
  const t0=Date.now();
  while(Date.now()-t0<5*60e3){await p.waitForTimeout(3000);
    if((Date.now()-t0)%60000<3000){const q2=await p.$('.qrcode-img, img[class*="qrcode"]');if(q2){const b=await q2.boundingBox();if(b)await p.screenshot({path:QR,clip:{x:b.x-40,y:b.y-60,width:b.width+80,height:b.height+120}})}}
    if(await logged()){console.log('LOGGED_IN');await ctx.close();return}}
  console.log('TIMEOUT');await ctx.close();
})();
