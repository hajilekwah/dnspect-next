"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dohjs_1 = require("dohjs");
const tldts_1 = require("tldts");
const dns = new dohjs_1.DNS({
    baseUrl: 'https://cloudflare-dns.com/dns-query',
    method: 'POST',
});
function formatDnsError(code) {
    switch (code) {
        case 'ENODATA':
            return 'No DNS records found for this type.';
        case 'ENOTFOUND':
            return 'Domain not found.';
        case 'ETIMEOUT':
            return 'DNS query timed out.';
        case 'SERVFAIL':
            return 'DNS server failed to complete the request.';
        case 'REFUSED':
            return 'DNS query was refused by the server.';
        default:
            return `DNS lookup error: ${code}`;
    }
}
function isErrorWithCode(err) {
    return typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string';
}
const resolve = async (context, req) => {
    context.log?.('--- DNSpect Azure Function Triggered ---');
    const query = req.query ?? {};
    const domainParam = query.domain;
    const type = query.type || 'A';
    context.log?.('Received request params:', { domain: domainParam, type });
    if (!domainParam) {
        context.log?.('Missing domain in query');
        context.res = {
            status: 400,
            body: { error: 'Missing domain' },
        };
        return;
    }
    const parsed = (0, tldts_1.parse)(domainParam);
    context.log?.('Parsed domain result:', parsed);
    if (!parsed.domain || parsed.isIp) {
        context.log?.('Invalid domain format');
        context.res = {
            status: 400,
            body: { error: 'Invalid domain format' },
        };
        return;
    }
    try {
        if (type === 'ALL') {
            const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CAA', 'SOA'];
            const all = await Promise.all(recordTypes.map(async (rtype) => {
                try {
                    const result = await dns.query(domainParam, rtype);
                    context.log?.(`Resolved ${rtype} for ${domainParam}`);
                    return { type: rtype, records: result.Answer };
                }
                catch (err) {
                    const errorCode = isErrorWithCode(err) ? err.code : 'UNKNOWN';
                    context.log?.(`Error querying ${rtype}:`, err);
                    return {
                        type: rtype,
                        error: formatDnsError(errorCode),
                    };
                }
            }));
            context.res = {
                status: 200,
                body: { results: all },
            };
            context.log?.('Returning ALL results');
            return;
        }
        const result = await dns.query(domainParam, type);
        context.log?.(`Resolved ${type} for ${domainParam}:`, result.Answer);
        context.res = {
            status: 200,
            body: {
                results: [{ type, records: result.Answer }],
            },
        };
    }
    catch (err) {
        const errorCode = isErrorWithCode(err) ? err.code : 'UNKNOWN';
        context.log?.('General DNS query error:', err);
        context.res = {
            status: 500,
            body: {
                results: [{ type, error: formatDnsError(errorCode) }],
            },
        };
    }
    context.log?.('--- DNSpect Azure Function Complete ---');
};
exports.default = resolve;
