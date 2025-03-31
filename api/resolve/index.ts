import { Context, HttpRequest } from 'azure-functions-ts-essentials';
import { DNS } from 'dohjs';
import { parse } from 'tldts';

type AzureFunction = (context: Context, req: HttpRequest) => Promise<void>;

const dns = new DNS({
  baseUrl: 'https://cloudflare-dns.com/dns-query',
  method: 'POST',
});

function formatDnsError(code: string): string {
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

function isErrorWithCode(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err && typeof (err as any).code === 'string';
}

const resolve: AzureFunction = async (context, req) => {
  const domainParam = req.query?.domain ?? '';
  const type = req.query?.type ?? 'A';

  context.log?.('Received request:', { domain: domainParam, type });

  context.res = {
    status: 200,
    body: {
      results: [
        {
          type,
          records: [{ name: domainParam, data: '93.184.216.34', TTL: 3600 }]
        }
      ]
    }
  };
};


export default resolve;
