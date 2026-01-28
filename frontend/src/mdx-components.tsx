import type { MDXComponents } from 'mdx/types'
import { MDXCodeBlock } from '@/components/MDXCodeBlock';

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        ...components,
        pre: ({ children, className, ...props }) => (
            <MDXCodeBlock className={className} {...props}>
                {children}
            </MDXCodeBlock>
        ),
    }
}
