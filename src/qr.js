import QRCode from 'qrcode';
const select=document.querySelector('#qr-page');
async function draw(){const url='https://friendsofdentondene.org'+select.value;await QRCode.toCanvas(document.querySelector('canvas'),url,{width:320,margin:4});document.querySelector('#qr-url').textContent=url;document.querySelector('#download').href=document.querySelector('canvas').toDataURL();}
select.addEventListener('change',draw);draw();
