import fsp from 'node:fs/promises';
import path from 'node:path';
import {
  assertExtensionBuild,
  expectSelector,
  expectText,
  extensionBuildDir,
  installBrowserErrorGuards,
  loadEnglishMessages,
  loadPlaywright,
  loadManifest,
  temporaryDir
} from './smoke-lib.mjs';

assertExtensionBuild();

const messages = loadEnglishMessages();
const manifest = loadManifest();
const userDataDir = await temporaryDir('switchyagain-smoke-chromium-');
const extensionPath = path.resolve(extensionBuildDir);
const {chromium} = loadPlaywright();

function messageForKey(key) {
  return messages[key]?.message || '';
}

const context = await chromium.launchPersistentContext(userDataDir, {
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`
  ],
  executablePath: chromium.executablePath(),
  headless: true
});

try {
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', {timeout: 10000});
  }
  const extensionId = new URL(serviceWorker.url()).host;
  if (!extensionId) {
    throw new Error(`Unable to derive extension id from service worker URL: ${serviceWorker.url()}`);
  }

  const optionsPage = await context.newPage();
  const optionsGuard = installBrowserErrorGuards(optionsPage, 'chromium extension options');
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html#/about`, {waitUntil: 'domcontentloaded'});
  await expectText(optionsPage, messageForKey('about_title') || 'About', 'chromium extension options');
  optionsGuard.assertNoErrors();
  console.log(`ok chromium extension options (${manifest.version})`);
  await optionsPage.close();

  const popupPage = await context.newPage();
  const popupGuard = installBrowserErrorGuards(popupPage, 'chromium extension popup');
  await popupPage.goto(`chrome-extension://${extensionId}/popup/index.html`, {waitUntil: 'domcontentloaded'});
  await expectSelector(popupPage, '#js-option', 'chromium extension popup');
  popupGuard.assertNoErrors();
  console.log('ok chromium extension popup');
  await popupPage.close();
} finally {
  await context.close();
  await fsp.rm(userDataDir, {recursive: true, force: true});
}
