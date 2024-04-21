import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
// @ts-ignore
import remarkCorebc from 'remark-corebc';

const processMarkdown = async (markdown: string, options: Record<string, any> = {}) => {
  const result = await unified()
    .use(remarkParse)
    .use(remarkCorebc, options)
    .use(remarkStringify)
    .process(markdown);
  return result.toString();
};

const normalizeString = (str: string) => str.trim();

const CoreBlockchainHandlers = suite('Core Blockchain handlers');

CoreBlockchainHandlers('Transforms CB link defined with round brackets and w/ ican check', async () => {
  const input = '[cb7147879011ea207df5b35a24ca6f0859dcfb145999@cb]';
  const output = await processMarkdown(input);
  const expected = '[CB71…5999@cb](https://blockindex.net/address/cb7147879011ea207df5b35a24ca6f0859dcfb145999 "CB7147879011EA207DF5B35A24CA6F0859DCFB145999")';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlers('Transforms CB link defined with different network', async () => {
  const input = '[ab792215c43fc213c02182c8389f2bc32408e2c50922@cb]';
  const output = await processMarkdown(input);
  const expected = '[AB79…0922@cb](https://xab.blockindex.net/address/ab792215c43fc213c02182c8389f2bc32408e2c50922 "AB792215C43FC213C02182C8389F2BC32408E2C50922")';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlers('Transforms CB link w/ bad checksum and exclamation mark', async () => {
  const input = '[!cb7247879011ea207df5b35a24ca6f0859dcfb145999@cb]';
  const output = await processMarkdown(input);
  const expected = '[CB72…5999@cb](https://blockindex.net/address/cb7247879011ea207df5b35a24ca6f0859dcfb145999 "CB7247879011EA207DF5B35A24CA6F0859DCFB145999")';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlers('Transforms CB link w/ bad checksum', async () => {
  const input = '[cb7247879011ea207df5b35a24ca6f0859dcfb145999@cb]';
  const output = await processMarkdown(input);
  const expected = '¬CB72…5999@cb';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlers('Transforms CB link w/ block number - short', async () => {
  const input = '[5999@cb]';
  const output = await processMarkdown(input);
  const expected = '[5999@cb](https://blockindex.net/block/5999 "5999")';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlers('Transforms CB link w/ block number - long', async () => {
  const input = '[7777777777@cb]';
  const output = await processMarkdown(input);
  const expected = '[7777…7777@cb](https://blockindex.net/block/7777777777 "7777777777")';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlers('Transforms CB link w/ block number at testnet', async () => {
  const input = '[ab:6777777777@cb]';
  const output = await processMarkdown(input);
  const expected = '[AB:6777…7777@cb](https://xab.blockindex.net/block/6777777777 "AB:6777777777")';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlers('Transforms CB link w/ block hash', async () => {
  const input = '[0x28181130d8534b831eb010e1324d1b33586c1daa4e70cca02d5d2f9313d346da@cb]';
  const output = await processMarkdown(input);
  const expected = '[0x2818…46DA@cb](https://blockindex.net/block/0x28181130d8534b831eb010e1324d1b33586c1daa4e70cca02d5d2f9313d346da "0x28181130D8534B831EB010E1324D1B33586C1DAA4E70CCA02D5D2F9313D346DA")';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlers('Transforms CB link w/ block hash at testnet', async () => {
  const input = '[ab:0x8d30917ba18ae937755ca7c26b24f15a661f8fa61a3d5aa0c468034e4906c1d5@cb]';
  const output = await processMarkdown(input);
  const expected = '[AB:0x8D30…C1D5@cb](https://xab.blockindex.net/block/0x8d30917ba18ae937755ca7c26b24f15a661f8fa61a3d5aa0c468034e4906c1d5 "AB:0x8D30917BA18AE937755CA7C26B24F15A661F8FA61A3D5AA0C468034E4906C1D5")';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlers.run();

const CoreBlockchainHandlersCombined = suite('Core Blockchain handlers - combined');

CoreBlockchainHandlersCombined('Transforms combined: link and block number', async () => {
  const input = 'Hello world [cb7147879011ea207df5b35a24ca6f0859dcfb145999@cb] is wallet and this is block [ab:6777777777@cb]';
  const output = await processMarkdown(input);
  const expected = 'Hello world [CB71…5999@cb](https://blockindex.net/address/cb7147879011ea207df5b35a24ca6f0859dcfb145999 "CB7147879011EA207DF5B35A24CA6F0859DCFB145999") is wallet and this is block [AB:6777…7777@cb](https://xab.blockindex.net/block/6777777777 "AB:6777777777")';
  assert.is(normalizeString(output), normalizeString(expected));
});

CoreBlockchainHandlersCombined.run();
