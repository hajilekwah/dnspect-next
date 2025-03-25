import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import { parse } from 'tldts';

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domainParam = searchParams.get('domain');
  const type = searchParams.get('type') || 'A';

  // Ensure domainParam is non-null before proceeding
  if (!domainParam) {
    return NextResponse.json({ error: 'Missing domain' }, { status: 400 });
  }

  const parsed = parse(domainParam);

  if (!parsed.domain || parsed.isIp) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
  }

  try {
    if (type === 'ALL') {
        const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CAA', 'SOA'];
        const all = await Promise.all(
          recordTypes.map(async (rtype) => {
            try {
              const records = await dns.resolve(domainParam, rtype as any);
              return { type: rtype, records };
            } catch (err: any) {
              const friendlyMessage = formatDnsError(err.code || 'UNKNOWN');
              return { type: rtype, error: friendlyMessage };
            }
          })
        );
        return NextResponse.json({ results: all });
      }
      
      try {
        const records = await dns.resolve(domainParam, type as any);
        return NextResponse.json({ results: [{ type, records }] });
      } catch (err: any) {
        const friendlyMessage = formatDnsError(err.code || 'UNKNOWN');
        return NextResponse.json({ results: [{ type, error: friendlyMessage }] });
      }      
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
