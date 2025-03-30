// types/dohjs.d.ts
declare module 'dohjs' {
    export class DNS {
      constructor(config: { baseUrl: string; method?: 'GET' | 'POST' });
      query(
        domain: string,
        type: string
      ): Promise<{
        Status: number;
        TC: boolean;
        RD: boolean;
        RA: boolean;
        AD: boolean;
        CD: boolean;
        Question: {
          name: string;
          type: number;
        }[];
        Answer?: {
          name: string;
          type: number;
          TTL: number;
          data: string;
        }[];
      }>;
    }
  }
  