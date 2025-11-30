<script lang="ts">
	import { onMount } from "svelte";
	import { cn } from "$lib/utils";
    import { fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

	let { class: className, children, boxColor = "#5046e6", duration = 0.5, width = "fit-content" } = $props();

    let isVisible = $state(false);

    onMount(() => {
        isVisible = true;
    });
</script>

<div class={cn("relative overflow-hidden", className)} style:width>
    {#if isVisible}
        <div in:fly={{ y: 75, duration: duration * 1000, easing: cubicOut }}>
            {@render children?.()}
        </div>
        
        <div
            class="absolute inset-0 z-20"
            style:background={boxColor}
            style:animation={`reveal ${duration}s ease-in forwards`}
        ></div>
    {/if}
</div>

<style>
    @keyframes reveal {
        0% {
            left: 0;
            width: 100%;
        }
        50% {
            left: 0;
            width: 100%;
        }
        100% {
            left: 100%;
            width: 0%;
        }
    }
</style>
