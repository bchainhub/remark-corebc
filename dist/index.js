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
const makeReferenceLinkNode = (reference, text) => ({
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
const makeStrikethroughNode = (text) => ({
    type: 'text',
    value: `~~${text}~~`,
});
const validateIcan = (address) => {
    return Ican.isValid(address, true);
};
const transformName = (originalText, network, transformationType, suffix) => {
    let transformedText, networkText;
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
const shortenId = (id) => `${id.slice(0, 4)}…${id.slice(-4)}`;
const shortenBlock = (block) => (block.length > 9) ? `${block.slice(0, 4)}…${block.slice(-4)}` : block;
const shortenHash = (hash) => `${hash.slice(0, 6)}…${hash.slice(-4)}`;
const slugify = (text) => text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
const isTextNode = (node) => {
    return node.type === 'text';
};
const extractMatches = (text, options) => {
    const matches = [];
    const addressRegex = /\[(!)?((cb|ab|ce)[0-9]{2}[0-9a-f]{40})@cb\]/gi;
    const blockNumberRegex = /\[((cb|ab|ce):)?(\d+)@cb\]/gi;
    const blockHashRegex = /\[((cb|ab|ce):)?(0x[0-9a-f]{64})@cb\]/gi;
    for (const match of text.matchAll(addressRegex)) {
        matches.push({
            type: 'address',
            network: match[3]?.toUpperCase() ?? 'CB',
            originalText: match[2],
            transformedText: shortenId(match[2].toUpperCase()),
            url: options.urlPathAddress?.replace('${1}', match[2].toLowerCase()),
            skipIcanCheck: match[1] === '!',
            originalIndex: match.index,
            length: match[0].length,
        });
    }
    for (const match of text.matchAll(blockNumberRegex)) {
        matches.push({
            type: 'blockNumber',
            network: match[2]?.toUpperCase() ?? 'CB',
            originalText: match[3],
            transformedText: shortenBlock(match[3]),
            url: options.urlPathBlockNo?.replace('${1}', match[3].toLowerCase()),
            originalIndex: match.index,
            length: match[0].length,
        });
    }
    for (const match of text.matchAll(blockHashRegex)) {
        matches.push({
            type: 'blockHash',
            network: match[2]?.toUpperCase() ?? 'CB',
            originalText: match[3],
            transformedText: shortenHash(match[3].substring(0, 2).toLowerCase() + match[3].substring(2, match[3].length).toUpperCase()),
            url: options.urlPathBlockHash?.replace('${1}', match[3].toLowerCase()),
            originalIndex: match.index,
            length: match[0].length,
        });
    }
    return matches;
};
const transformMatchesIntoNodes = (matches, options) => {
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
        }
        else {
            switch (network) {
                case 'CB':
                    fullName = [match.originalText];
                    link = explorerUrl + match.url;
                    break;
                case 'AB':
                    fullName = [match.originalText, network];
                    link = explorerTestnetUrl + match.url;
                    break;
                case 'CE':
                    fullName = [match.originalText, network];
                    link = `${network}-${slugify(match.originalText)}`;
                    referenceLink = true;
                    break;
                default:
                    fullName = [match.originalText, network];
                    link = `${network}-${slugify(match.originalText)}`;
                    referenceLink = true;
                    break;
            }
        }
        let willSkip = options.enableSkippingIcanCheck && match.skipIcanCheck;
        if (options.enableIcanCheck && match.type === 'address' && !willSkip && !validateIcan(match.originalText)) {
            return makeStrikethroughNode(`${match.transformedText}@cb`);
        }
        switch (match.type) {
            case 'address':
                if (options.checkAddress) {
                    return referenceLink
                        ? makeReferenceLinkNode(link, transformName(match.transformedText, undefined, 'address', true))
                        : makeLinkNode(link, transformName(match.transformedText, undefined, 'address', true), transformName(fullName[0], undefined, 'address'));
                }
                else {
                    return makeTextNode(match.originalText);
                }
            case 'blockNumber':
                if (options.checkBlockNumber) {
                    return referenceLink
                        ? makeReferenceLinkNode(link, transformName(match.transformedText, fullName[1], 'blockNumber', true))
                        : makeLinkNode(link, transformName(match.transformedText, fullName[1], 'blockNumber', true), transformName(fullName[0], fullName[1], 'blockNumber'));
                }
                else {
                    return makeTextNode(match.originalText);
                }
            case 'blockHash':
                if (options.checkBlockHash) {
                    return referenceLink
                        ? makeReferenceLinkNode(link, transformName(match.transformedText, fullName[1], 'blockHash', true))
                        : makeLinkNode(link, transformName(match.transformedText, fullName[1], 'blockHash', true), transformName(fullName[0], fullName[1], 'blockHash'));
                }
                else {
                    return makeTextNode(match.originalText);
                }
            default:
                return makeTextNode(match.originalText);
        }
    });
};
export default function remarkCorebc(options = {}) {
    const finalOptions = {
        enableIcanCheck: true,
        enableSkippingIcanCheck: true,
        linkNetworks: true,
        explorerUrl: 'https://blockindex.net/',
        explorerTestnetUrl: 'https://xab.blockindex.net/',
        urlPathAddress: 'address/${1}',
        urlPathBlockNo: 'block/${1}',
        urlPathBlockHash: 'block/${1}',
        checkAddress: true,
        checkBlockNumber: true,
        checkBlockHash: true,
        debug: false,
        ...options,
    };
    const transformer = (ast) => {
        visit(ast, 'text', (node, index, parent) => {
            if (!isTextNode(node) || !parent || typeof index !== 'number')
                return;
            const parentNode = parent;
            const textNode = node;
            let newNodes = [];
            let lastIndex = 0;
            const matches = extractMatches(textNode.value, finalOptions);
            matches.forEach(match => {
                if (match.originalIndex > lastIndex) {
                    newNodes.push(makeTextNode(textNode.value.slice(lastIndex, match.originalIndex)));
                }
                let matchedNodes = transformMatchesIntoNodes([match], finalOptions);
                newNodes.push(...matchedNodes);
                if (finalOptions.debug) {
                    console.log('Node:');
                    console.dir(matchedNodes, { depth: 3 });
                }
                lastIndex = match.originalIndex + match.length;
            });
            if (lastIndex < textNode.value.length) {
                newNodes.push(makeTextNode(textNode.value.slice(lastIndex)));
            }
            parentNode.children.splice(index, 1, ...newNodes);
        });
    };
    return transformer;
}
