import { Root } from 'mdast';
interface CorebcOptions {
    enableIcanCheck?: boolean;
    enableSkippingIcanCheck?: boolean;
    linkNetworks?: boolean;
    explorerUrl?: string;
    explorerTestnetUrl?: string;
    urlPathAddress?: string;
    urlPathBlockNo?: string;
    urlPathBlockHash?: string;
    checkAddress?: boolean;
    checkBlockNumber?: boolean;
    checkBlockHash?: boolean;
    debug?: boolean;
}
export default function remarkCorebc(options?: CorebcOptions): (ast: Root) => void;
export {};
