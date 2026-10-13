import {readFileSync,existsSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function restoreBinaryAssets(root=path.resolve('.')) {
 const manifestPath=path.join(root,'assets/binary-assets.json');if(!existsSync(manifestPath))return;
 const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
 const resolve=relative=>{const file=path.resolve(root,relative);if(!file.startsWith(path.resolve(root)+path.sep))throw Error('Caminho de asset inválido');return file;};
 for(const asset of manifest.files){
  const target=resolve(asset.path);
  if(existsSync(target)){const raw=readFileSync(target);if(raw.length!==asset.bytes||hash(raw)!==asset.sha256)throw Error('Asset existente difere da versão preservada: '+asset.path);continue;}
  const parts=asset.parts.map(part=>{const bytes=readFileSync(resolve(part.path));if(bytes.length!==part.bytes||hash(bytes)!==part.sha256)throw Error('Parte de asset inválida: '+part.path);return bytes;});
  const bytes=Buffer.concat(parts);if(bytes.length!==asset.bytes||hash(bytes)!==asset.sha256)throw Error('Asset reconstituído inválido: '+asset.path);
  mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,bytes);
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))restoreBinaryAssets();
