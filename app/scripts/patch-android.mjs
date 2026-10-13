import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.join('android','app','src','main','AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.error('Android ainda não foi criado. Rode: npx cap add android');
  process.exit(1);
}
let xml = fs.readFileSync(manifestPath,'utf8');
const permissions = [
  '<uses-permission android:name="android.permission.INTERNET" />',
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />'
];
for (const line of permissions) {
  const name = line.match(/android:name="([^"]+)/)?.[1];
  if (name && !xml.includes(`android:name="${name}"`)) {
    xml = xml.replace(/<manifest([^>]*)>/, m => `${m}\n    ${line}`);
  }
}
xml = xml.replace(/<application\b([^>]*)>/, (m, attrs) => {
  if (/android:usesCleartextTraffic=/.test(attrs)) return m.replace(/android:usesCleartextTraffic="[^"]*"/, 'android:usesCleartextTraffic="false"');
  return `<application${attrs} android:usesCleartextTraffic="false">`;
});
fs.writeFileSync(manifestPath, xml);

const stringsPath = path.join('android','app','src','main','res','values','strings.xml');
if (fs.existsSync(stringsPath)) {
  let s = fs.readFileSync(stringsPath,'utf8');
  s = s.replace(/<string name="app_name">[\s\S]*?<\/string>/, '<string name="app_name">Bivvo</string>');
  s = s.replace(/<string name="title_activity_main">[\s\S]*?<\/string>/, '<string name="title_activity_main">Bivvo</string>');
  s = s.replace(/<string name="custom_url_scheme">[\s\S]*?<\/string>/, '<string name="custom_url_scheme">com.maisbivvo.app</string>');
  fs.writeFileSync(stringsPath,s);
}
console.log('Android patch aplicado: permissões mínimas, cleartext desativado e identidade Bivvo.');
