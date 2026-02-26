import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    },
)
Button.displayName = "Button"

export { Button, buttonVariants }

export interface GlassyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    gradientLight?: { from: string; via: string; to: string };
    gradientDark?: { from: string; via: string; to: string };
    size?: "sm" | "md" | "lg";
}

export function GlassyButton({
    icon,
    title,
    description,
    gradientLight = { from: "from-blue-500/20", via: "via-blue-400/10", to: "to-white/5" },
    gradientDark = { from: "from-indigo-600/30", via: "via-blue-500/10", to: "to-transparent" },
    size = "md",
    className,
    ...props
}: GlassyButtonProps) {
    const sizeClasses = {
        sm: "p-2 min-w-[36px] flex items-center justify-center",
        md: "p-4 min-w-[200px]",
        lg: "p-6 min-w-[280px]"
    };

    return (
        <button
            className={`group relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 text-left hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 ${sizeClasses[size]} ${className || ""}`}
            {...props}
        >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradientDark.from} ${gradientDark.via} ${gradientDark.to}`} />
            <div className={`absolute -inset-2 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 bg-gradient-to-br ${gradientLight.from} ${gradientLight.via} ${gradientLight.to}`} />

            <div className="relative z-10 flex items-center gap-3">
                {icon && (
                    <div className="flex-shrink-0 text-white/70 group-hover:text-white transition-colors duration-300 group-hover:scale-110 group-hover:-rotate-3">
                        {icon}
                    </div>
                )}
                {(title || description) && size !== "sm" && (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white/90 group-hover:text-white text-sm tracking-wide">{title}</span>
                        {description && <span className="text-[10px] text-white/50 group-hover:text-white/70 font-medium">{description}</span>}
                    </div>
                )}
            </div>

            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-colors duration-300 pointer-events-none" />
        </button>
    );
}
