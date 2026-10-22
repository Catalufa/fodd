import {mkdir,copyFile} from 'node:fs/promises';
import {build} from 'esbuild';
await mkdir('public/vendor',{recursive:true});
await copyFile('node_modules/quill/dist/quill.js','public/vendor/quill.js');
await copyFile('node_modules/quill/dist/quill.snow.css','public/vendor/quill.snow.css');
await build({entryPoints:['src/qr.js'],bundle:true,minify:true,outfile:'public/qr.js',platform:'browser'});
