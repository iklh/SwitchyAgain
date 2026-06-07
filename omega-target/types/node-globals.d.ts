declare var OmegaPac: unknown;

declare module 'bluebird' {
  const value: unknown;
  export default value;
}

declare module 'buffer' {
  export const Buffer: {
    from(value: string, encoding?: string): {
      toString(encoding?: string): string;
    };
  };
}

declare module 'jsondiffpatch' {
  const value: unknown;
  export default value;
}

declare module 'limiter' {
  const value: unknown;
  export default value;
}

declare module 'omega-pac' {
  const value: unknown;
  export default value;
}
