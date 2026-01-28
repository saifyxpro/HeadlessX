import remarkGfm from 'remark-gfm';

/** @type {import('@mdx-js/loader').Options} */
const mdxConfig = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [],
};

export default mdxConfig;
