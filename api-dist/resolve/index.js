"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dohjs_1 = require("dohjs");
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
    const domainParam = req.query?.domain ?? '';
    const type = req.query?.type ?? 'A';
    context.log?.('Received request:', { domain: domainParam, type });
    context.res = {
        status: 200,
        body: {
            results: [
                {
                    type,
                    records: [{ name: domainParam, data: 'example.com', TTL: 3600 }]
                }
            ]
        }
    };
};
exports.default = resolve;
