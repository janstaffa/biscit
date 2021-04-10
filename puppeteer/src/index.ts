import puppeteer from 'puppeteer';

const main = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', {
    waitUntil: 'networkidle2',
  });
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });
  const username = await page.$('[name="usernameOrEmail"]');
  await username?.type('TEST_USER');
  const password = await page.$('[name="password"]');
  await password?.type('test123');
  await page.click('button#login_button');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

  await page.screenshot({ path: '../assets/current_state.jpg' });
  await browser.close();
};

main().catch((err) => console.error(err));