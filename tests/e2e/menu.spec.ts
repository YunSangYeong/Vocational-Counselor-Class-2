import { test, expect, type Page } from '@playwright/test';
async function swipe(page:Page,up:boolean){
 const cdp=await page.context().newCDPSession(page);
 const start=up?260:110, end=up?90:280;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:125,y:start}]});
 for(let i=1;i<=12;i++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:125,y:start+(end-start)*i/12}]});
  await page.waitForTimeout(18);
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForTimeout(220);await cdp.detach();
}
for(const viewport of [{width:390,height:480},{width:740,height:360}]){
 for(const input of ['wheel','touch'] as const){
  test(`${viewport.width}x${viewport.height} ${input}: 하단 백업·초기화와 상단 대시보드 실제 입력 접근`,async({browser})=>{
   const context=await browser.newContext({viewport,hasTouch:true,isMobile:true});
   const page=await context.newPage();await page.goto('/Vocational-Counselor-Class-2/');
   await page.getByRole('button',{name:'메뉴 열기'}).click();await page.waitForTimeout(400);
   const side=page.locator('.sidebar');
   expect(await side.evaluate(e=>e.scrollHeight>e.clientHeight)).toBe(true);
   const move=async(down:boolean)=>{if(input==='touch')await swipe(page,down);else{await page.mouse.move(125,180);await page.mouse.wheel(0,down?400:-400);await page.waitForTimeout(180);}};
   for(let i=0;i<5;i++)await move(true);
   expect(await side.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
   const backup=page.getByRole('button',{name:'학습 기록 백업',exact:true});
   const reset=page.getByRole('button',{name:'데이터 초기화',exact:true});
   await expect(backup).toBeInViewport();await expect(reset).toBeInViewport();
   const pending=page.waitForEvent('download');await backup.click();expect((await pending).suggestedFilename()).toBe('vocational-counselor-2-study-backup.json');
   await reset.click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'돌아가기',exact:true}).click();
   for(let i=0;i<6;i++)await move(false);
   const home=page.getByRole('navigation').getByRole('button',{name:'학습 대시보드',exact:true});
   await expect(home).toBeInViewport();await home.click();
   await expect(page.getByRole('heading',{name:'직업상담사2급 필기 CBT',exact:true})).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await context.close();
  });
 }
}
test('글자 확대와 뷰포트 높이 변경 후 메뉴 휠 접근',async({page})=>{
 await page.setViewportSize({width:390,height:480});await page.goto('');
 await page.addStyleTag({content:'.sidebar nav button { font-size: 22px; min-height: 62px } .sidebar-bottom button {font-size:20px}'});
 await page.getByRole('button',{name:'메뉴 열기'}).click();await page.waitForTimeout(400);
 await page.setViewportSize({width:390,height:360});await page.mouse.move(125,180);await page.mouse.wheel(0,1700);await page.waitForTimeout(250);
 await expect(page.getByRole('button',{name:'데이터 초기화',exact:true})).toBeInViewport();
 await page.mouse.wheel(0,-1700);await page.waitForTimeout(250);await expect(page.getByRole('navigation').getByRole('button',{name:'학습 대시보드',exact:true})).toBeInViewport();
});
test('전체 화면 안내 배너 부재와 저장 실패 경고 유지',async({page})=>{
 await page.goto('');
 const labels=['실전 모의시험','랜덤 문제풀이','오답노트','북마크','학습 통계','문제은행 관리'];
 for(const label of labels){
  if(await page.getByRole('button',{name:'메뉴 열기'}).isVisible())await page.getByRole('button',{name:'메뉴 열기'}).click();
  await page.getByRole('navigation').getByRole('button',{name:label,exact:true}).click();
  await expect(page.locator('.criteria-note')).toHaveCount(0);
  if(label!=='문제은행 관리')await expect(page.locator('main > .notice').filter({hasText:/비공식|잠정 규칙|공식 출제기준 대조 대기/})).toHaveCount(0);
 }
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')};});
 await page.getByRole('button',{name:'메뉴 열기'}).isVisible().then(async mobile=>{if(mobile)await page.getByRole('button',{name:'메뉴 열기'}).click();});
 await page.getByRole('navigation').getByRole('button',{name:'학습 대시보드',exact:true}).click();
 await page.getByRole('button',{name:'문제풀이 시작하기'}).click();
 await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');
});
