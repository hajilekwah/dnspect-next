"use strict";
const fetch = require('node-fetch');
const resolve = async (context, req) => {
    const domain = req.query?.domain;
    const type = req.query?.type || 'A';
    context.log?.('DNS request received', { domain, type });
    if (!domain) {
        context.res = {
            status: 400,
            body: { error: 'Missing domain parameter' },
        };
        return;
    }
    try {
        const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;
        context.log?.('Querying Cloudflare DoH endpoint:', url);
        const response = await fetch(url, {
            headers: {
                Accept: 'application/dns-json',
            },
        });
        if (!response.ok) {
            context.log?.(`Cloudflare DoH query failed: ${response.status} ${response.statusText}`);
            context.res = {
                status: 502,
                body: { error: 'Upstream DNS query failed' },
            };
            return;
        }
        const data = await response.json();
        context.log?.('DNS response:', data);
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
module.exports = resolve;
