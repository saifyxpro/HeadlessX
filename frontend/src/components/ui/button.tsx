import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "focus-visible:ring-ring/30 focus-visible:ring-[3px] text-sm font-medium outline-none aria-invalid:ring-destructive/20 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 group/button select-none active:scale-[0.98] duration-200",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow-md hover:shadow-lg shadow-primary/20 hover:bg-primary/90",
                outline: "border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-sm",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
                ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-500",
                destructive: "bg-destructive text-white shadow-md shadow-destructive/20 hover:bg-destructive/90",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 rounded-xl px-4 py-2",
                sm: "h-9 rounded-lg px-3",
                lg: "h-12 rounded-2xl px-8 text-base",
                icon: "h-10 w-10 rounded-xl",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

function Button({
    className,
    variant = "default",
    size = "default",
    ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
    return (
        <ButtonPrimitive
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export type ButtonProps = React.ComponentProps<typeof ButtonPrimitive> & VariantProps<typeof buttonVariants>

export { Button, buttonVariants }
