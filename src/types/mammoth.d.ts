declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: any[];
  }
  export function extractRawText(options: { buffer: Buffer }): Promise<MammothResult>;
  const mammoth: {
    extractRawText(options: { buffer: Buffer }): Promise<MammothResult>;
  };
  export default mammoth;
}

