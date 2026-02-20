import { ThemeToggle } from "@/components/ui/theme-toggle"
import { GooeyText } from "@/components/ui/gooey-text-morphing"

function DefaultToggle() {
    return (
        <div className="space-y-2 text-center">
            <div className="flex justify-center">
                <ThemeToggle />
            </div>
        </div>
    )
}

function GooeyTextDemo() {
    return (
        <div className="h-[200px] flex items-center justify-center bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800">
            <GooeyText
                texts={["Design", "Engineering", "Is", "Awesome"]}
                morphTime={1}
                cooldownTime={0.25}
                className="font-bold text-brand"
                textClassName="text-6xl md:text-8xl"
            />
        </div>
    );
}

export { DefaultToggle, GooeyTextDemo }
