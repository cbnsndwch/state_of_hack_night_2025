import type { LoaderFunctionArgs } from 'react-router';

/**
 * Lightweight proxy to check whether an external link appears to exist.
 * Uses a HEAD request with a short timeout so it's fast and non-invasive.
 *
 * GET /api/verify-link?url=<encoded_url>
 * Returns { exists: boolean }
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url).searchParams.get('url');

    if (!url) {
        return Response.json(
            { exists: false, error: 'Missing url parameter' },
            { status: 400 }
        );
    }

    // Basic safety check — only allow http(s) URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return Response.json(
            { exists: false, error: 'Invalid URL scheme' },
            { status: 400 }
        );
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const resp = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'HelloMiami-LinkVerifier/1.0',
            },
        });

        clearTimeout(timeout);

        // Treat 2xx and 3xx as "exists"
        const exists = resp.status >= 200 && resp.status < 400;
        return Response.json({ exists });
    } catch {
        // Timeout, DNS failure, connection refused, etc.
        return Response.json({ exists: false });
    }
}
