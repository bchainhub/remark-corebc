import { Node } from 'unist';

declare module 'remark-corebc' {
  interface CorebcOptions {
    enableIcanCheck?: boolean;
    enableSkippingIcanCheck?: boolean;
    linkNetworks?: boolean;
    explorerUrl?: string;
    explorerTestnetUrl?: string;
    urlPathAddress?: string;
    urlPathBlockNo?: string;
    urlPathBlockHash?: string;
    checkAddress?: (address: string) => Promise<boolean>;
    checkBlockNo?: (blockNo: string) => Promise<boolean>;
    checkBlockHash?: (blockHash: string) => Promise<boolean>;
    debug?: boolean;
  }

  function remarkCorebc(options?: CorebcOptions): (ast: Node) => void;

  export default remarkCorebc;
}
