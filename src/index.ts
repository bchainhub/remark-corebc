import { type Node } from 'unist';
import { visit } from 'unist-util-visit';
import Ican from '@blockchainhub/ican';

interface CorebcOptions {
  /**
   * Enable ICAN check for addresses
   */
  enableIcanCheck?: boolean;
  /**
   * Enable skipping ICAN check with "!" sign
   */
  enableSkippingIcanCheck?: boolean;
  /**
   * Enable linking networks
   */
  linkNetworks?: boolean;
  /**
   * Mainnet explorer URL
   */
  explorerUrl?: string;
  /**
   * Testnet explorer URL
   */
  explorerTestnetUrl?: string;
  /**
   * URL path for addresses
   */
  urlPathAddress?: string;
  /**
   * URL path for block numbers
   */
  urlPathBlockNo?: string;
  /**
   * URL path for block hashes
   */
  urlPathBlockHash?: string;
  /**
   * Enabled checking address
   */
  checkAddress?: boolean;
  /**
   * Enabled checking block number
   */
  checkBlockNumber?: boolean;
  /**
   * Enabled checking block hash
   */
  checkBlockHash?: boolean;
  /**
   * Debug mode
   */
  debug?: boolean;
}

interface ParentNode extends Node {
  children: Node[];
}

interface LinkNode extends Node {
  type: 'link';
  url: string;
  title: string | null;
  children: Array<TextNode>;
}

interface TextNode extends Node {
  type: 'text';
  value: string;
}

interface DefinitionNode extends Node {
  type: 'definition';
  identifier: string;
  label: string;
  url: string;
}

interface ReferenceLinkNode extends Node {
  type: 'paragraph';
  children: Array<TextNode | DefinitionNode>;
}

interface Match {
  type: 'address' | 'blockNumber' | 'blockHash';
  network: string;
  originalText: string;
  transformedText: string;
  originalIndex: number;
  url?: string;
  skipIcanCheck?: boolean;
  length: number;
}

const makeLinkNode = (url: string, text: string, title?: string): LinkNode => ({
  type: 'link',
  url,
  title: title || null,
  children: [{ type: 'text', value: text }],
});

const makeTextNode = (text: string): TextNode => ({
  type: 'text',
  value: text,
});

const makeReferenceLinkNode = (reference: string, text: string): ReferenceLinkNode => ({
  type: 'paragraph',
  children: [
    {
      type: 'text',
      value: `[${text}]`,
    },
    {
      type: 'definition',
      identifier: reference,
      label: text,
      url: reference,
    },
  ],
});

const validateIcan = (address: string): boolean => {
  return Ican.isValid(address, true);
}

const transformName = (originalText: string, network?: string, transformationType?: string, suffix?: boolean): string => {
  let transformedText, networkText: string;
  switch (transformationType) {
    case "address":
      transformedText = originalText.toUpperCase();
      break;
    case "blockHash":
      transformedText = originalText.length > 2 ? originalText.slice(0, 2).toLowerCase() + originalText.slice(2).toUpperCase() : originalText.toUpperCase();
      break;
    default:
      transformedText = originalText;
  }
  networkText = network ? `${network}:${transformedText}` : transformedText;
  return suffix ? `${networkText}@cb` : networkText;
};

const shortenId = (id: string) => `${id.slice(0, 4)}…${id.slice(-4)}`;
const shortenBlock = (block: string) => (block.length > 9) ? `${block.slice(0, 4)}…${block.slice(-4)}` : block;
const shortenHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`;

const slugify = (text: string) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')           // Replace spaces with -
  .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
  .replace(/\-\-+/g, '-')         // Replace multiple - with single -
  .replace(/^-+/, '')             // Trim - from start of text
  .replace(/-+$/, '');            // Trim - from end of text

const isTextNode = (node: Node): node is TextNode => {
  return node.type === 'text';
}

// Function to extract matches from a string
const extractMatches = (text: string, options: CorebcOptions): Match[] => {
  const matches: Match[] = [];
  const addressRegex = /\[(!)?((cb|ab|ce)[0-9]{2}[0-9a-f]{40})@cb\]/gi;
  const blockNumberRegex = /\[((cb|ab|ce):)?(\d+)@cb\]/gi;
  const blockHashRegex = /\[((cb|ab|ce):)?(0x[0-9a-f]{64})@cb\]/gi;
  // Extract ICAN addresses
  for (const match of text.matchAll(addressRegex)) {
    matches.push({
      type: 'address',
      network: match[3]?.toUpperCase() ?? 'CB',
      originalText: match[2],
      transformedText: shortenId(match[2].toUpperCase()),
      url: options.urlPathAddress?.replace('${1}', match[2].toLowerCase()),
      skipIcanCheck: match[1] === '!',
      originalIndex: match.index!,
      length: match[0].length,
    });
  }
  // Extract block numbers
  for (const match of text.matchAll(blockNumberRegex)) {
    matches.push({
      type: 'blockNumber',
      network: match[2]?.toUpperCase() ?? 'CB',
      originalText: match[3],
      transformedText: shortenBlock(match[3]),
      url: options.urlPathBlockNo?.replace('${1}', match[3].toLowerCase()),
      originalIndex: match.index!,
      length: match[0].length,
    });
  }
  // Extract block hashes
  for (const match of text.matchAll(blockHashRegex)) {
    matches.push({
      type: 'blockHash',
      network: match[2]?.toUpperCase() ?? 'CB',
      originalText: match[3],
      transformedText: shortenHash(match[3].substring(0, 2).toLowerCase() + match[3].substring(2, match[3].length).toUpperCase()),
      url: options.urlPathBlockHash?.replace('${1}', match[3].toLowerCase()),
      originalIndex: match.index!,
      length: match[0].length,
    });
  }
  return matches;
};

// Function to transform matches into nodes
const transformMatchesIntoNodes = (matches: Match[], options: CorebcOptions): Node[] => {
  return matches.flatMap(match => {
    let network = match.network;
    let fullName, link;
    let referenceLink = false;
    let explorerUrl = (options.explorerUrl?.endsWith('/') ? options.explorerUrl : options.explorerUrl + '/');
    let explorerTestnetUrl = (options.explorerTestnetUrl?.endsWith('/') ? options.explorerTestnetUrl : options.explorerTestnetUrl + '/');

    if (!options.linkNetworks) {
      fullName = [match.originalText, network];
      link = `${network}-${slugify(match.originalText)}`;
      referenceLink = true;
    } else {
      switch (network) {
        case 'CB': // Mainnet
          fullName = [match.originalText];
          link = explorerUrl + match.url;
          break;
        case 'AB': // Testnet, Devin
          fullName = [match.originalText, network];
          link = explorerTestnetUrl + match.url;
          break;
        case 'CE': // Enterprise, Koliba
          fullName = [match.originalText, network];
          link = `${network}-${slugify(match.originalText)}`;
          referenceLink = true;
          break;
        default: // Other networks
          fullName = [match.originalText, network];
          link = `${network}-${slugify(match.originalText)}`;
          referenceLink = true;
          break;
      }
    }

    // Determine if we should skip ICAN validation based on options and the specific match flag
    let willSkip = options.enableSkippingIcanCheck && match.skipIcanCheck;

    // Perform ICAN validation for address types unless skipping is specified
    if (options.enableIcanCheck && match.type === 'address' && !willSkip && !validateIcan(match.originalText)) {
      // ICAN validation failed; return a strikethrough node
      return makeTextNode(`¬${match.transformedText}@cb`);
    }

    switch (match.type) {
      case 'address': // Wallet address
        if (options.checkAddress) {
          return referenceLink
            ? makeReferenceLinkNode(link, transformName(match.transformedText, undefined, 'address', true))
            : makeLinkNode(link, transformName(match.transformedText, undefined, 'address', true), transformName(fullName[0], undefined, 'address'));
        } else {
          return makeTextNode(match.originalText);
        }
      case 'blockNumber': // Block number
        if (options.checkBlockNumber) {
          return referenceLink
            ? makeReferenceLinkNode(link, transformName(match.transformedText, fullName[1], 'blockNumber', true))
            : makeLinkNode(link, transformName(match.transformedText, fullName[1], 'blockNumber', true), transformName(fullName[0], fullName[1], 'blockNumber'));
        } else {
          return makeTextNode(match.originalText);
        }
      case 'blockHash': // Block hash
        if (options.checkBlockHash) {
          return referenceLink
            ? makeReferenceLinkNode(link, transformName(match.transformedText, fullName[1], 'blockHash', true))
            : makeLinkNode(link, transformName(match.transformedText, fullName[1], 'blockHash', true), transformName(fullName[0], fullName[1], 'blockHash'));
        } else {
          return makeTextNode(match.originalText);
        }
      default: // No match
        return makeTextNode(match.originalText);
    }
  });
};

/**
 * A remark transformer to transform Core Blockchain values (Addresses, Block Numbers, Block Hashes) into links.
 * @param options - Options for the CoreBC plugin.
 * @returns A transformer for the AST.
 */
export default function remarkCorebc(options: CorebcOptions = {}): (ast: Node) => void {
  const finalOptions = {
    enableIcanCheck: true, // Enable ICAN check for addresses
    enableSkippingIcanCheck: true, // Enable skipping ICAN check with "!" sign
    linkNetworks: true, // Enable linking networks
    explorerUrl: 'https://blockindex.net/', // Mainnet explorer URL
    explorerTestnetUrl: 'https://xab.blockindex.net/', // Testnet explorer URL
    urlPathAddress: 'address/${1}', // URL path for addresses
    urlPathBlockNo: 'block/${1}', // URL path for block numbers
    urlPathBlockHash: 'block/${1}', // URL path for block hashes
    checkAddress: true, // Check address
    checkBlockNumber: true, // Check block number
    checkBlockHash: true, // Check block hash
    debug: false, // Debug mode
    ...options,
  };

  const transformer = (ast: Node): void => {
    visit(ast, 'text', (node, index, parent) => {
      if (!isTextNode(node) || !parent || typeof index !== 'number') return;
      const parentNode: ParentNode = parent as ParentNode;
      const textNode: TextNode = node as TextNode;
      let newNodes: Node[] = [];
      let lastIndex = 0;

      const matches = extractMatches(textNode.value, finalOptions);

      matches.forEach(match => {
        // Add the text before the match to the newNodes
        if (match.originalIndex > lastIndex) {
          newNodes.push(makeTextNode(textNode.value.slice(lastIndex, match.originalIndex)));
        }
        // Process the match
        let matchedNodes = transformMatchesIntoNodes([match], finalOptions);
        newNodes.push(...matchedNodes);

        if(finalOptions.debug) {
          console.log('Node:');
          console.dir(matchedNodes, { depth: 3 });
        }

        lastIndex = match.originalIndex + match.length;
      });

      // Add any remaining text after the last match
      if (lastIndex < textNode.value.length) {
        newNodes.push(makeTextNode(textNode.value.slice(lastIndex)));
      }

      // Replace the original node with the new nodes
      parentNode.children.splice(index, 1, ...newNodes);
    });
  };

  return transformer;
}
