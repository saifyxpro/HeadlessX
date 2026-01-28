import type { MDXComponents } from 'mdx/types';
import { MDXCodeBlock } from '@/components/MDXCodeBlock';

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        // Custom code block component
        pre: ({ children, ...props }) => {
            return <MDXCodeBlock {...props}>{children}</MDXCodeBlock>;
        },
        // Table styling - proper borders
        table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }) => (
            <thead className="bg-slate-100">{children}</thead>
        ),
        tbody: ({ children }) => (
            <tbody className="bg-white divide-y divide-slate-200">{children}</tbody>
        ),
        th: ({ children }) => (
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200 last:border-r-0">
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td className="px-6 py-4 text-sm text-slate-700 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                {children}
            </td>
        ),
        tr: ({ children }) => (
            <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
        ),
        // List styling
        ul: ({ children }) => (
            <ul className="my-4 space-y-2 list-disc list-inside">{children}</ul>
        ),
        li: ({ children }) => (
            <li className="text-slate-600">{children}</li>
        ),
        // Headings
        h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">{children}</h3>
        ),
        // Paragraph
        p: ({ children }) => (
            <p className="text-slate-600 leading-relaxed my-4">{children}</p>
        ),
        // Strong/Bold
        strong: ({ children }) => (
            <strong className="font-bold text-slate-900">{children}</strong>
        ),
        // Inline code
        code: ({ children }) => (
            <code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md text-sm font-mono">
                {children}
            </code>
        ),
        ...components,
    };
}
