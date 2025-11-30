<script lang="ts">
	import { cn } from "$lib/utils";
	import { onMount } from "svelte";

	let { class: className, children, gradientColor = "#262626", gradientSize = 200, gradientOpacity = 0.8 } = $props();

	let mouseX = $state(0);
	let mouseY = $state(0);
	let cardElement: HTMLDivElement;

	function handleMouseMove(e: MouseEvent) {
		if (!cardElement) return;
		const rect = cardElement.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={cardElement}
	onmousemove={handleMouseMove}
	class={cn(
		"group relative flex size-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow",
		className
	)}
>
	<div class="relative z-10 size-full">
		{@render children?.()}
	</div>
	<div
		class="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		style:background={`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`}
		style:opacity={gradientOpacity}
	></div>
</div>
