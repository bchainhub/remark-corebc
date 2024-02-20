import { Node } from 'unist';

declare module 'remark-corebc' {
  interface CorebcOptions {
    enableIcanCheck?: boolean;
    enableSkippingIcanCheck?: boolean;
    linkNetworks?: boolean;
  }

  function remarkCorebc(options?: CorebcOptions): (ast: Node) => void;

  export = remarkCorebc;
}
