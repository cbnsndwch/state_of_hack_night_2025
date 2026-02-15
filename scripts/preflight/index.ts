/**
 * `pnpm doctor` — pre-flight check for local dev infrastructure.
 *
 * Verifies that all supporting services required by the app are reachable
 * before you waste time staring at a broken `pnpm dev`.
 *
 * Checks:
 *  1. Docker daemon is running
 *  2. Postgres container is healthy and accepting connections (port 5433)
 *  3. Zero Cache is reachable (port 4848)
 *  4. Required environment variables are set
 */

import { execSync } from 'node:child_process';
import net from 'node:net';

// ── Helpers ───────────────────────────────────────────────────────────

const PASS = '\x1b[32m✔\x1b[0m';
const FAIL = '\x1b[31m✘\x1b[0m';
const WARN = '\x1b[33m⚠\x1b[0m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface CheckResult {
    name: string;
    ok: boolean;
    detail?: string;
}

function tcpProbe(host: string, port: number, timeoutMs = 2000): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeoutMs);
        socket
            .once('connect', () => {
                socket.destroy();
                resolve(true);
            })
            .once('timeout', () => {
                socket.destroy();
                resolve(false);
            })
            .once('error', () => {
                socket.destroy();
                resolve(false);
            })
            .connect(port, host);
    });
}

function commandExists(cmd: string): boolean {
    try {
        execSync(`${process.platform === 'win32' ? 'where' : 'which'} ${cmd}`, {
            stdio: 'ignore',
        });
        return true;
    } catch {
        return false;
    }
}

function dockerRunning(): boolean {
    try {
        execSync('docker info', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function containerStatus(name: string): { running: boolean; healthy: boolean } {
    try {
        const raw = execSync(
            `docker inspect --format="{{.State.Status}}" ${name}`,
            { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] },
        ).trim().replace(/"/g, '');

        const running = raw === 'running';
        if (!running) return { running: false, healthy: false };

        // Health may not exist for all containers
        try {
            const health = execSync(
                `docker inspect --format="{{.State.Health.Status}}" ${name}`,
                { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] },
            ).trim().replace(/"/g, '');
            return { running: true, healthy: health === 'healthy' };
        } catch {
            // No healthcheck defined — treat running as healthy enough
            return { running: true, healthy: true };
        }
    } catch {
        return { running: false, healthy: false };
    }
}

// ── Checks ────────────────────────────────────────────────────────────

async function checkDocker(): Promise<CheckResult> {
    if (!commandExists('docker')) {
        return { name: 'Docker CLI', ok: false, detail: 'docker command not found — install Docker Desktop' };
    }
    if (!dockerRunning()) {
        return { name: 'Docker daemon', ok: false, detail: 'Docker daemon is not running — start Docker Desktop' };
    }
    return { name: 'Docker daemon', ok: true };
}

async function checkPostgres(): Promise<CheckResult> {
    const container = containerStatus('hello_miami_postgres');
    if (!container.running) {
        return {
            name: 'Postgres (hello_miami_postgres)',
            ok: false,
            detail: 'Container not running — run: docker compose up -d postgres',
        };
    }
    if (!container.healthy) {
        return {
            name: 'Postgres (hello_miami_postgres)',
            ok: false,
            detail: 'Container running but not healthy yet — give it a few seconds and retry',
        };
    }

    const reachable = await tcpProbe('127.0.0.1', 5433);
    if (!reachable) {
        return {
            name: 'Postgres TCP (localhost:5433)',
            ok: false,
            detail: 'Container healthy but port 5433 not reachable on host',
        };
    }

    return { name: 'Postgres (localhost:5433)', ok: true };
}

async function checkZeroCache(): Promise<CheckResult> {
    const container = containerStatus('hello_miami_zero_cache');
    if (!container.running) {
        return {
            name: 'Zero Cache (hello_miami_zero_cache)',
            ok: false,
            detail: 'Container not running — run: docker compose up -d zero-cache',
        };
    }

    const reachable = await tcpProbe('127.0.0.1', 4848);
    if (!reachable) {
        return {
            name: 'Zero Cache (localhost:4848)',
            ok: false,
            detail: 'Container running but port 4848 not reachable — check logs: docker logs hello_miami_zero_cache',
        };
    }

    return { name: 'Zero Cache (localhost:4848)', ok: true };
}

function checkEnvVars(): CheckResult[] {
    const required: Array<{ key: string; hint: string }> = [
        { key: 'DATABASE_URL', hint: 'Postgres connection string' },
        { key: 'VITE_CLERK_PUBLISHABLE_KEY', hint: 'Clerk publishable key from dashboard' },
        { key: 'CLERK_SECRET_KEY', hint: 'Clerk secret key from dashboard' },
    ];

    const optional: Array<{ key: string; hint: string }> = [
        { key: 'LUMA_API_KEY', hint: 'Luma API key (needed for auth / event sync)' },
        { key: 'RESEND_API_KEY', hint: 'Resend API key (needed for notifications)' },
        { key: 'VITE_ZERO_CACHE_URL', hint: 'Zero Cache URL (defaults to http://localhost:4848)' },
    ];

    const results: CheckResult[] = [];

    for (const { key, hint } of required) {
        const val = process.env[key];
        if (!val || val.startsWith('your-') || val.startsWith('pk_test_your') || val.startsWith('sk_test_your')) {
            results.push({ name: `env ${key}`, ok: false, detail: hint });
        } else {
            results.push({ name: `env ${key}`, ok: true });
        }
    }

    for (const { key, hint } of optional) {
        const val = process.env[key];
        if (!val || val.startsWith('your-') || val.startsWith('re_your')) {
            results.push({ name: `env ${key} (optional)`, ok: true, detail: `${WARN} not set — ${hint}` });
        } else {
            results.push({ name: `env ${key}`, ok: true });
        }
    }

    return results;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n${BOLD}🩺 hello_miami doctor${RESET}\n`);

    const results: CheckResult[] = [];

    // Infrastructure checks (run in parallel where possible)
    const [docker, postgres, zero] = await Promise.all([
        checkDocker(),
        checkPostgres(),
        checkZeroCache(),
    ]);
    results.push(docker, postgres, zero);

    // Env var checks (sync)
    results.push(...checkEnvVars());

    // Print results
    let failures = 0;
    for (const r of results) {
        const icon = r.ok ? PASS : FAIL;
        if (!r.ok) failures++;

        const suffix = r.detail ? `  → ${r.detail}` : '';
        console.log(`  ${icon} ${r.name}${suffix}`);
    }

    console.log('');
    if (failures > 0) {
        console.log(`${FAIL} ${failures} issue(s) found. Fix the above and re-run: ${BOLD}pnpm preflight${RESET}\n`);
        process.exit(1);
    } else {
        console.log(`${PASS} All checks passed — you're good to go! Run: ${BOLD}pnpm dev${RESET}\n`);
    }
}

main().catch((err) => {
    console.error('Doctor script failed unexpectedly:', err);
    process.exit(1);
});
