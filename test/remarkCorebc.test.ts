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

const CoreBlockchainHandlers = suite('Core Blockchain handlers');

CoreBlockchainHandlers('Transforms CB link defined with round brackets and w/ ican check', async () => {
  const input = '[cb7147879011ea207df5b35a24ca6f0859dcfb145999@cb]';
  const output = await processMarkdown(input);
  assert.match(output, /^\[CB71…5999@cb\]\(https:\/\/blockindex.net\/address\/cb7147879011ea207df5b35a24ca6f0859dcfb145999 "CB71…5999"\)$/);
});

CoreBlockchainHandlers('Transforms CB link defined with different network', async () => {
  const input = '[ab792215c43fc213c02182c8389f2bc32408e2c50922@cb]';
  const output = await processMarkdown(input);
  assert.match(output, /^\[AB79…0922@cb\]\(https:\/\/xab.blockindex.net\/address\/ab792215c43fc213c02182c8389f2bc32408e2c50922 "AB79…0922"\)$/);
});

CoreBlockchainHandlers('Transforms CB link w/ bad checksum and exclamation mark', async () => {
  const input = '[!cb7247879011ea207df5b35a24ca6f0859dcfb145999@cb]';
  const output = await processMarkdown(input);
  assert.match(output, /^\[CB72…5999@cb\]\(https:\/\/blockindex.net\/address\/cb7247879011ea207df5b35a24ca6f0859dcfb145999 "CB72…5999"\)$/);
});

CoreBlockchainHandlers('Transforms CB link w/ bad checksum', async () => {
  const input = '[cb7247879011ea207df5b35a24ca6f0859dcfb145999@cb]';
  const output = await processMarkdown(input);
  assert.match(output, /^~~CB72…5999@cb~~$/);
});

CoreBlockchainHandlers('Transforms CB link w/ block number - short', async () => {
  const input = '[5999@cb]';
  const output = await processMarkdown(input);
  assert.match(output, /^\[5999@cb\]\(https:\/\/blockindex.net\/block\/5999\ "5999"\)$/);
});

CoreBlockchainHandlers('Transforms CB link w/ block number - long', async () => {
  const input = '[7777777777@cb]';
  const output = await processMarkdown(input);
  assert.match(output, /^\[7777…7777@cb\]\(https:\/\/blockindex.net\/block\/7777777777\ "7777…7777"\)$/);
});

CoreBlockchainHandlers('Transforms CB link w/ block number at testnet', async () => {
  const input = '[ab:6777777777@cb]';
  const output = await processMarkdown(input);
  assert.match(output, /^\[ab:6777…7777@cb\]\(https:\/\/xab.blockindex.net\/block\/6777777777 "ab:6777…7777"\)$/);
});

CoreBlockchainHandlers('Transforms CB link w/ block hash', async () => {
  const input = '[0x28181130d8534b831eb010e1324d1b33586c1daa4e70cca02d5d2f9313d346da@cb]';
  const output = await processMarkdown(input);
  assert.match(output, /^\[0x2818…46DA@cb\]\(https:\/\/blockindex.net\/block\/0x28181130d8534b831eb010e1324d1b33586c1daa4e70cca02d5d2f9313d346da "0x2818…46DA"\)$/);
});

CoreBlockchainHandlers('Transforms CB link w/ block hash at testnet', async () => {
  const input = '[ab:0x8d30917ba18ae937755ca7c26b24f15a661f8fa61a3d5aa0c468034e4906c1d5@cb]';
  const output = await processMarkdown(input);
  assert.match(output, /^\[ab:0x8D30…C1D5@cb\]\(https:\/\/xab.blockindex.net\/block\/0x8d30917ba18ae937755ca7c26b24f15a661f8fa61a3d5aa0c468034e4906c1d5 "ab:0x8D30…C1D5"\)$/);
});

CoreBlockchainHandlers.run();
