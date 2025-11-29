<script lang="ts">
  import { onMount } from 'svelte';
  import { initDB, syncEngine } from '$lib/db';
  import { browser } from '$app/environment';
  import '../app.css';

  const { children } = $props();

  let syncState = $state({ isSyncing: false });

  onMount(() => {
      initDB();
      
      // Subscribe to sync state
      const unsubscribe = syncEngine.subscribe(state => {
        syncState = state;
      });
      
      return () => {
        unsubscribe();
        syncEngine.destroy();
      };
  });
</script>

<div class="app min-h-screen bg-slate-50">
  <header class="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center">
    <h1 class="text-xl font-bold text-slate-800">ClassComm</h1>
    {#if syncState.isSyncing}
      <div class="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
        <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
        Syncing...
      </div>
    {/if}
  </header>
  
  <main class="p-6 max-w-7xl mx-auto">
    {@render children()}
  </main>
</div>
