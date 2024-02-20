import { Node, Literal } from 'unist';
import { visit } from 'unist-util-visit';
import Ican from '@blockchainhub/ican';

interface CorebcOptions {
  enableIcanCheck?: boolean;
  enableSkippingIcanCheck?: boolean;
  linkNetworks?: boolean;
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
  children: Array<Literal | DefinitionNode>;
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

const makeStrikethroughNode = (text: string): TextNode => {
  return {
    type: 'text',
    value: `~~${text}~~`,
  };
};

const makeReferenceLinkNode = (reference: string, text: string): ReferenceLinkNode => {
  return {
    type: 'paragraph',
    children: [
      {
        type: 'text',
        value: `[${text}]`
      },
      {
        type: 'definition',
        identifier: reference,
        label: `${text}`,
        url: reference,
      }
    ]
  };
};

const chooseNetwork = (network?: string) => {
  if (!network) {
    return 'cb';
  }
  switch (network.toLowerCase()) {
    case 'cb':
      return 'cb';
    case 'ab':
      return 'ab';
    case 'ce':
      return 'ce';
    default:
      return 'cb';
  }
};

const slugify = (text: string) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')           // Replace spaces with -
  .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
  .replace(/\-\-+/g, '-')         // Replace multiple - with single -
  .replace(/^-+/, '')             // Trim - from start of text
  .replace(/-+$/, '');            // Trim - from end of text

const shortenId = (id: string) => `${id.slice(0, 4)}…${id.slice(-4)}`;
const shortenBlock = (block: string) => (block.length > 9) ? `${block.slice(0, 4)}…${block.slice(-4)}` : block;
const shortenHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`;

const cbPattern = /\[(!)?((cb|ab|ce)[0-9]{2}[0-9a-f]{40})@cb\]|\b((cb|ab|ce):)?(\d+)\b|((cb|ab|ce):)?(0x[0-9a-f]{64})@cb\]/gi;

function isTextNode(node: Node): node is TextNode {
  return node.type === 'text';
}

export default function remarkCorebc(options: CorebcOptions = {}): (ast: Node) => void {
  const defaults: CorebcOptions = {
    enableIcanCheck: true, // Enable Ican check for CorePass
    enableSkippingIcanCheck: true, // Enable skipping Ican check with sign "!"
    linkNetworks: true, // Enable link networks
  };
  const finalOptions = { ...defaults, ...options };

  const transformer = (ast: Node): void => {
    visit(ast, 'text', (node, index, parent) => {
      if (!isTextNode(node) || !parent || typeof index !== 'number') return;
      const parentNode: ParentNode = parent as ParentNode;
      let newNodes: Node[] = [];
      let lastIndex = 0;

      const textNode: TextNode = node as TextNode;

      textNode.value.replace(cbPattern, (
        match: string,
        skip: string,
        id: string,
        net0: string,
        net1dp: string,
        net1: string,
        blockNo: string,
        net2dp: string,
        net2: string,
        blockHash: string,
        offset: number
      ) => {
        if (offset > lastIndex) {
          newNodes.push(makeTextNode(textNode.value.slice(lastIndex, offset)));
        }
        let network = chooseNetwork(net0 as string || net1 as string || net2 as string);
        let willSkip = (finalOptions.enableSkippingIcanCheck) ? ((skip === '!') ? true : false) : false;
        let displayName, link, typeLink;
        let slugifiedName = '';
        let valid = true;
        if (id !== '' && id !== undefined) {
          displayName = shortenId(id.toUpperCase());
          typeLink = 'address';
          if (finalOptions.enableIcanCheck && !willSkip && !Ican.isValid(id, true)) {
            valid = false;
          }
        } else if (blockNo !== '' && blockNo !== undefined) {
          id = blockNo;
          displayName = shortenBlock(blockNo);
          typeLink = 'block';
        } else if (blockHash !== '' && blockHash !== undefined) {
          id = blockHash;
          displayName = shortenHash(blockHash.substring(0, 2) + blockHash.substring(2, blockHash.length).toUpperCase());
          typeLink = 'block';
        }

        if (valid && network === 'cb' && finalOptions.linkNetworks) {
          link = `https://blockindex.net/${typeLink}/${id}`;
        } else if (valid && network === 'ab' && finalOptions.linkNetworks) {
          link = `https://xab.blockindex.net/${typeLink}/${id}`;
          displayName = `${network}:${displayName}`;
        } else if (valid) {
          slugifiedName = slugify(network + '-' + displayName);
          displayName = `${network}:${displayName}`;
        }

        if (valid && link) {
          newNodes.push(makeLinkNode(link, `${displayName}@cb`, displayName));
        } else if (valid) {
          newNodes.push(makeReferenceLinkNode(slugifiedName, `${displayName}@cb`));
        } else if (!valid) {
          newNodes.push(makeStrikethroughNode(`${displayName}@cb`));
        }

        lastIndex = offset + match.length;
        return '';
      });

      if (lastIndex < textNode.value.length) {
        newNodes.push(makeTextNode(textNode.value.slice(lastIndex)));
      }
      if (newNodes.length > 0) {
        parentNode.children.splice(index, 1, ...newNodes);
      }
    });
  };
  return transformer;
}
