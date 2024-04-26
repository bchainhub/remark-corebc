# Remark CoreBC

This Remark plugin, "remark-corebc," transforms Core Blockchain notations into Markdown links (when positively checked) and negated text (when negatively checked), enhancing documents with blockchain data integrations. It features ICAN validation, customizable links to blockchain explorers, and formatting options for various blockchain identifiers.

## About Blockchain

Blockchain is a decentralized, distributed ledger technology that records transactions across a network of computers. It provides transparency, security, and immutability for data storage and transfer. Core Blockchain is a blockchain platform that offers a scalable, secure, and efficient infrastructure for decentralized applications and digital assets.

The main aim is to support [ICAN-based](https://cip.coreblockchain.net/sk-SK/cip/cbc/cip-100) blockchains, such as:

- [Core Blockchain](https://coreblockchain.net/)
  - Network Mainnet: [BlockIndex](https://blockindex.net/)
  - Network Testnet `Devín`: [BlockIndex](https://xab.blockindex.net/)
  - Network Enterprise `Koliba`

## Installation

Install the plugin using npm or yarn:

```bash
npm install remark-corebc
```

Or:

```bash
yarn add remark-corebc
```

## Usage

To automatically convert Core Blockchain notations into clickable links or text definition and optionally validate ICAN identifiers:

```typescript
import remark from 'remark';
import remarkCorebc from 'remark-corebc';

(async () => {
  try {
    const file = await remark()
      .use(remarkCorebc, { enableIcanCheck: true })
      .process('Your markdown text here');
    console.log(String(file));
  } catch (err) {
    throw err;
  }
})();
```

The plugin recognizes notations such as [cb1234...@cb] and [!cb1234...@cb], converting them to links and optionally validating ICAN identifiers, displaying invalid items as text.

## Options

Configure the plugin with the following options:

- enableIcanCheck: Enable ICAN validation (default: true).
- enableSkippingIcanCheck: Skip ICAN validation with "!" prefix (default: true).
- linkNetworks: Link to specific blockchain networks (default: true).
- explorerUrl: Mainnet explorer URL for constructing links (default: `https://blockindex.net/`).
- explorerTestnetUrl: Testnet explorer URL for constructing links (default: `https://xab.blockindex.net/`).
- urlPathAddress: URL path for address links, appended to explorerUrl or explorerTestnetUrl. Use `${1}` as a placeholder for the address (e.g., `address/${1}`).
- urlPathBlockNo: URL path for block number links, appended to explorerUrl or explorerTestnetUrl. Use `${1}` as a placeholder for the block number (e.g., `block/${1}`).
- urlPathBlockHash: URL path for block hash links, appended to explorerUrl or explorerTestnetUrl. Use `${1}` as a placeholder for the block hash (e.g., `block/${1}`).
- checkAddress: Transform blockchain addresses (default: true).
- checkBlockNumber: Transform block numbers (default: true).
- checkBlockHash: Transform block hashes (default: true).
- debug: Print transformation details to console (default: false).

## Features

- ICAN Validation: Validates ICAN identifiers for reliability.
- Link Customization: Customizes links to mainnet and testnet explorers for direct blockchain data access.
- Data Transformation: Formats blockchain addresses, numbers, and hashes into clickable links.
- Configuration Flexibility: Tailors behavior with a variety of options.
- Seamless Integration: Fits into Remark pipelines, enhancing documents with blockchain integrations.

## Contributing

Contributions are welcome! Please submit pull requests or open issues to improve the plugin.

## License

Licensed under the [CORE License](LICENSE).
