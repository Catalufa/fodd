// Read a password from stdin; never put it in shell arguments or committed files.
import {pbkdf2Sync,randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
let password='';for await(const chunk of process.stdin)password+=chunk;password=password.trim();
if(password.length<8||password.length>128)throw new Error('Password must be 8 to 128 characters.');
const salt=randomBytes(32).toString('hex'),hash=pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex');
await writeFile('bootstrap.private.sql',`INSERT INTO users(username,salt,password_hash) VALUES('admin','${salt}','${hash}') ON CONFLICT(username) DO UPDATE SET salt=excluded.salt,password_hash=excluded.password_hash; DELETE FROM sessions;\n`,{mode:0o600});
console.log('Hashed credentials written to ignored bootstrap.private.sql.');
