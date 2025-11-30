<script lang="ts">
  import { onMount } from 'svelte';
  import { initDB, syncEngine } from '$lib/db';
  import { browser } from '$app/environment';
 import { ModeWatcher } from "mode-watcher";
 import SunIcon from "@lucide/svelte/icons/sun";
 import MoonIcon from "@lucide/svelte/icons/moon";
 
 import { toggleMode } from "mode-watcher";
 import { Button } from "$lib/components/ui/button/index.js";
  import '../app.css';

  const { children } = $props();

  let syncState = $state({ isSyncing: false });

  onMount(() => {
      initDB();
            
      return () => {
        syncEngine.destroy();
      };
  });
</script>

<ModeWatcher />
<div class="app min-h-screen bg-backgrond">
  <header class="bg-background shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center">
    <h1 class="text-xl font-bold text-slate-800">ClassComm</h1>
    {#if syncState.isSyncing}
      <div class="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
        <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
        Syncing...
      </div>
    {/if}
     
<Button onclick={toggleMode} variant="outline" size="icon">
 <SunIcon
  class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 !transition-all dark:-rotate-90 dark:scale-0"
 />
 <MoonIcon
  class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 !transition-all dark:rotate-0 dark:scale-100"
 />
 <span class="sr-only">Toggle theme</span>
</Button>
  </header>
  
  <main class="p-6 max-w-7xl mx-auto">
    {@render children()}
  </main>
</div>
