declare var before: (callback: () => unknown) => unknown;
declare var after: (callback: () => unknown) => unknown;
declare var describe: (name: string, callback: () => unknown) => unknown;
declare var it: (name: string, callback: (done?: () => void) => unknown) => unknown;

declare module 'chai' {
  const value: any;
  export default value;
}

declare module 'lolex' {
  const value: any;
  export default value;
}

interface Object {
  should: any;
}

interface String {
  should: any;
}

interface Number {
  should: any;
}

interface Boolean {
  should: any;
}
