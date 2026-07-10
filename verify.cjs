const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  await page.goto('https://tradingview-web-one.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  const panels = ['chart','watchlist','scanner','ai','market','portfolio','orderbook','strategy','backtest','alerts','news','terminal'];
  
  console.log('=== MOBILE TEST (390x844) — AFTER FIX ===\n');
  
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    // Navigate via drawer
    if (i >= 5) {
      await page.click('.header-menu-btn').catch(()=>{});
      await page.waitForTimeout(500);
      const items = await page.$$('.drawer-item');
      if (items[i]) {
        await items[i].click();
        await page.waitForTimeout(2500);
      }
    } else {
      const navBtns = await page.$$('.mobile-nav-btn');
      if (navBtns[i]) {
        await navBtns[i].click();
        await page.waitForTimeout(2500);
      }
    }
    
    const m = await page.evaluate(() => {
      const main = document.querySelector('.main-content');
      const panel = document.querySelector('.panel') || document.querySelector('.chart-panel');
      return {
        vw: innerWidth,
        mainW: main?.offsetWidth,
        mainScrollW: main?.scrollWidth,
        panelW: panel?.offsetWidth,
        bodyScrollW: document.body.scrollWidth,
        bodyClientW: document.body.clientWidth,
        overflow: document.body.scrollWidth > document.body.clientWidth + 2,
      };
    });
    
    const fits = m.mainW <= m.vw && !m.overflow ? '✅ FITS' : '❌ OVERFLOW';
    console.log(`${p.padEnd(12)} ${fits}  viewport=${m.vw} main=${m.mainW} body=${m.bodyScrollW}/${m.bodyClientW}`);
    
    await page.screenshot({ path: `/home/z/my-project/screenshots/FIXED-${p}.png` });
  }
  
  // Also test landscape
  console.log('\n=== LANDSCAPE (667x375) ===');
  await context.close();
  const lctx = await browser.newContext({
    viewport: { width: 667, height: 375 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  const lpage = await lctx.newPage();
  await lpage.goto('https://tradingview-web-one.vercel.app/', { waitUntil: 'networkidle' });
  await lpage.waitForTimeout(3000);
  const lm = await lpage.evaluate(() => ({
    vw: innerWidth,
    mainW: document.querySelector('.main-content')?.offsetWidth,
    overflow: document.body.scrollWidth > document.body.clientWidth,
  }));
  console.log(`Landscape: viewport=${lm.vw} main=${lm.mainW} overflow=${lm.overflow}`);
  await lpage.screenshot({ path: '/home/z/my-project/screenshots/FIXED-landscape.png' });
  
  await browser.close();
  console.log('\n✅ Done');
})();
