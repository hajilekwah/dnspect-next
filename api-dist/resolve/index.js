"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resolve = async (context, req) => {
    const domain = req.query?.domain;
    const type = req.query?.type || 'A';
    if (!domain) {
        context.res = {
            status: 400,
            body: { error: 'Missing domain parameter' },
        };
        return;
    }
    try {
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`, {
            headers: {
                'Accept': 'application/dns-json',
            },
        });
        if (!response.ok) {
            context.log?.(`Cloudflare DoH query failed: ${response.statusText}`);
            context.res = {
                status: 502,
                body: { error: 'Upstream DNS query failed' },
            };
            return;
        }
        const data = await response.json();
        context.res = {
            status: 200,
            body: {
                results: [
                    {
                        type,
                        records: data.Answer ?? [],
                        question: data.Question ?? [],
                        status: data.Status,
                    },
                ],
            },
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        context.log?.('Unexpected error occurred:', message);
        context.res = {
            status: 500,
            body: { error: `Unexpected error occurred while querying DNS: ${message}` },
        };
    }
};
// help
exports.default = resolve;
