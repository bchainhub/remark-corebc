import { Root } from 'mdast';

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

  export default function remarkCorebc(options?: CorebcOptions): (ast: Root) => void;
}
