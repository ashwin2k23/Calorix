import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default:     "bg-[#12266e] text-white hover:bg-[#0a1c52] shadow-sm hover:shadow-md",
    destructive: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    outline:     "bg-transparent text-[#12266e] border-2 border-[#c8d8f8] hover:bg-[#e8effe]",
    secondary:   "bg-[#e8effe] text-[#12266e] hover:bg-[#d4e6f8]",
    ghost:       "bg-transparent text-[#5a6478] hover:bg-[#f4f6fa] hover:text-[#12266e]",
    link:        "bg-transparent text-[#3456c8] underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-10 px-5 py-2 text-sm",
    sm:      "h-8 px-4 py-1.5 text-xs",
    lg:      "h-12 px-7 py-3 text-base",
    icon:    "h-10 w-10",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3456c8] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 gap-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
