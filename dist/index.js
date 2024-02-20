import { visit } from 'unist-util-visit';
import Ican from '@blockchainhub/ican';
const makeLinkNode = (url, text, title) => ({
    type: 'link',
    url,
    title: title || null,
    children: [{ type: 'text', value: text }],
});
const makeTextNode = (text) => ({
    type: 'text',
    value: text,
});
const makeStrikethroughNode = (text) => {
    return {
        type: 'text',
        value: `~~${text}~~`,
    };
};
const makeReferenceLinkNode = (reference, text) => {
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
const chooseNetwork = (network) => {
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
const slugify = (text) => text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
const shortenId = (id) => `${id.slice(0, 4)}…${id.slice(-4)}`;
const shortenBlock = (block) => (block.length > 9) ? `${block.slice(0, 4)}…${block.slice(-4)}` : block;
const shortenHash = (hash) => `${hash.slice(0, 6)}…${hash.slice(-4)}`;
const cbPattern = /\[(!)?((cb|ab|ce)[0-9]{2}[0-9a-f]{40})@cb\]|\b((cb|ab|ce):)?(\d+)\b|((cb|ab|ce):)?(0x[0-9a-f]{64})@cb\]/gi;
function isTextNode(node) {
    return node.type === 'text';
}
export default function remarkCorebc(options = {}) {
    const defaults = {
        enableIcanCheck: true,
        enableSkippingIcanCheck: true,
        linkNetworks: true,
    };
    const finalOptions = { ...defaults, ...options };
    const transformer = (ast) => {
        visit(ast, 'text', (node, index, parent) => {
            if (!isTextNode(node) || !parent || typeof index !== 'number')
                return;
            const parentNode = parent;
            let newNodes = [];
            let lastIndex = 0;
            const textNode = node;
            textNode.value.replace(cbPattern, (match, skip, id, net0, net1dp, net1, blockNo, net2dp, net2, blockHash, offset) => {
                if (offset > lastIndex) {
                    newNodes.push(makeTextNode(textNode.value.slice(lastIndex, offset)));
                }
                let network = chooseNetwork(net0 || net1 || net2);
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
                }
                else if (blockNo !== '' && blockNo !== undefined) {
                    id = blockNo;
                    displayName = shortenBlock(blockNo);
                    typeLink = 'block';
                }
                else if (blockHash !== '' && blockHash !== undefined) {
                    id = blockHash;
                    displayName = shortenHash(blockHash.substring(0, 2) + blockHash.substring(2, blockHash.length).toUpperCase());
                    typeLink = 'block';
                }
                if (valid && network === 'cb' && finalOptions.linkNetworks) {
                    link = `https://blockindex.net/${typeLink}/${id}`;
                }
                else if (valid && network === 'ab' && finalOptions.linkNetworks) {
                    link = `https://xab.blockindex.net/${typeLink}/${id}`;
                    displayName = `${network}:${displayName}`;
                }
                else if (valid) {
                    slugifiedName = slugify(network + '-' + displayName);
                    displayName = `${network}:${displayName}`;
                }
                if (valid && link) {
                    newNodes.push(makeLinkNode(link, `${displayName}@cb`, displayName));
                }
                else if (valid) {
                    newNodes.push(makeReferenceLinkNode(slugifiedName, `${displayName}@cb`));
                }
                else if (!valid) {
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
