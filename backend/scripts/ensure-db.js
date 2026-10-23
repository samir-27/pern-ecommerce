import { execSync } from 'child_process';
import net from 'net';

function checkPort(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1200);
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.once('error', () => {
            resolve(false);
        });
        socket.connect(port, host);
    });
}

async function ensureDb() {
    const isUp = await checkPort(5432);
    if (!isUp) {
        console.log('PostgreSQL is not running on port 5432. Launching PostgreSQL...');
        try {
            const pgCtl = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe';
            const dataDir = 'C:\\Program Files\\PostgreSQL\\18\\data';
            execSync(`"${pgCtl}" start -D "${dataDir}"`, { stdio: 'inherit' });
            console.log('✓ PostgreSQL started.');
            // Allow 2 seconds for recovery and socket binding
            await new Promise((r) => setTimeout(r, 2000));
        } catch (e) {
            console.warn('Could not auto-start pg_ctl:', e.message);
        }
    }
}

ensureDb();
