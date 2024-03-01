# Remark CoreBC

This Remark plugin, "remark-corebc," transforms Core Blockchain notations into markdown links, enhancing documents with blockchain data integrations. It features ICAN validation, customizable links to blockchain explorers, and formatting options for various blockchain identifiers.

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

To automatically convert Core Blockchain notations into clickable links and optionally validate ICAN identifiers:

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

The plugin recognizes notations like [cb1234...@cb] and [!cb1234...@cb], converting them to links and optionally validating ICAN identifiers.

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
