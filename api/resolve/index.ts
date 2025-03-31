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
  const query = req.query ?? {};
  const domainParam = query.domain;
  const type = query.type || 'A';

  context.log?.('Received request:', { domain: domainParam, type });

  if (!domainParam) {
    context.res = {
      status: 400,
      body: { error: 'Missing domain' },
    };
    return;
  }

  const parsed = parse(domainParam);
  context.log?.('Parsed domain:', parsed);

  if (!parsed.domain || parsed.isIp) {
    context.res = {
      status: 400,
      body: { error: 'Invalid domain format' },
    };
    return;
  }

  try {
    if (type === 'ALL') {
      const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CAA', 'SOA'];
      const all = await Promise.all(
        recordTypes.map(async (rtype) => {
          try {
            const result = await dns.query(domainParam, rtype);
            return { type: rtype, records: result.Answer };
          } catch (err: unknown) {
            const errorCode = isErrorWithCode(err) ? err.code : 'UNKNOWN';
            context.log?.(`Error querying ${rtype}:`, err);
            return {
              type: rtype,
              error: formatDnsError(errorCode),
            };
          }
        })
      );

      context.res = {
        status: 200,
        body: { results: all },
      };
      return;
    }

    const result = await dns.query(domainParam, type);
    context.res = {
      status: 200,
      body: {
        results: [{ type, records: result.Answer }],
      },
    };
  } catch (err: unknown) {
    const errorCode = isErrorWithCode(err) ? err.code : 'UNKNOWN';
    context.log?.('General error:', err);

    context.res = {
      status: 500,
      body: {
        results: [{ type, error: formatDnsError(errorCode) }],
      },
    };
  }
};

export default resolve;
