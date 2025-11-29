<script lang="ts">
  import { onMount } from 'svelte';
  import { templatesStore, type Template } from '$lib/db';
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client';

  let selectedCategory = $state<string>('all');
  let searchQuery = $state('');
  let previewTemplate = $state<Template | null>(null);

  onMount(() => templatesStore.load());

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'academic', label: 'Academic' },
    { value: 'behavior', label: 'Behavior' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'celebration', label: 'Celebration' },
    { value: 'concern', label: 'Concern' },
    { value: 'general', label: 'General' }
  ];

  const filteredTemplates = $derived(
    templatesStore.data.filter((t: Template) => {
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && !t._isDeleted;
    }).sort((a: Template, b: Template) => b.usageCount - a.usageCount)
  );

  async function useTemplate(template: Template) {
    // Increment usage count
    await templatesStore.update(template.id, {
      usageCount: template.usageCount + 1
    });
    
    // Navigate to compose with template
    goto(`/compose?templateId=${template.id}`);
  }

  async function deleteTemplate(template: Template) {
    if (template.isDefault) {
      alert('Cannot delete default templates');
      return;
    }
    
    if (confirm(`Delete template "${template.name}"?`)) {
      await templatesStore.delete(template.id);
    }
  }

  async function createTemplate() {
    const name = prompt('Template Name:');
    if (!name) return;
    
    const session = await authClient.getSession();
    if (!session.data?.user) {
        alert('Please log in');
        return;
    }

    await templatesStore.create({
        userId: session.data.user.id,
        name,
        category: 'general',
        subject: '',
        body: '',
        usageCount: 0,
        isDefault: false,
        createdAt: Date.now()
    });
  }
</script>

<div class="templates-page max-w-7xl mx-auto p-6">
  <div class="header flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-slate-800">Template Library</h1>
    <button 
      onclick={createTemplate}
      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Create Template
    </button>
  </div>

  <div class="filters flex gap-4 mb-6">
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Search templates..."
      class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />

    <select 
      bind:value={selectedCategory}
      class="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    >
      {#each categories as category}
        <option value={category.value}>{category.label}</option>
      {/each}
    </select>
  </div>

  <div class="template-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredTemplates as template (template.id)}
      <div class="template-card bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col h-full">
        <div class="template-header flex justify-between items-start mb-4">
          <div>
            <h3 class="font-semibold text-slate-800 text-lg">{template.name}</h3>
            <span class="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full capitalize mt-1">
              {template.category}
            </span>
          </div>
          {#if template.usageCount > 0}
            <span class="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
              Used {template.usageCount}x
            </span>
          {/if}
        </div>

        <p class="text-sm font-medium text-slate-700 mb-1">Subject: {template.subject}</p>
        <p class="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">{template.body}</p>

        <div class="template-actions flex gap-2 pt-4 border-t border-slate-100">
          <button 
            onclick={() => previewTemplate = template}
            class="flex-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
          >
            Preview
          </button>
          <button 
            onclick={() => useTemplate(template)}
            class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors font-medium"
          >
            Use
          </button>
          {#if !template.isDefault}
            <button 
              class="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              onclick={() => deleteTemplate(template)}
            >
              Delete
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

{#if previewTemplate}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={() => previewTemplate = null}>
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onclick={(e) => e.stopPropagation()}>
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-xl font-bold text-slate-800">{previewTemplate.name}</h2>
        <button onclick={() => previewTemplate = null} class="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      
      <div class="space-y-4 mb-6">
        <div>
          <span class="text-sm font-medium text-slate-500 uppercase tracking-wider">Category</span>
          <p class="capitalize">{previewTemplate.category}</p>
        </div>
        <div>
          <span class="text-sm font-medium text-slate-500 uppercase tracking-wider">Subject</span>
          <p class="font-medium">{previewTemplate.subject}</p>
        </div>
        <div>
          <span class="text-sm font-medium text-slate-500 uppercase tracking-wider">Body</span>
          <div class="bg-slate-50 p-4 rounded-md mt-1">
            <pre class="whitespace-pre-wrap font-sans text-slate-700">{previewTemplate.body}</pre>
          </div>
        </div>
        <p class="text-sm text-slate-500 italic">
          Variables like {'{{studentName}}'}, {'{{grade}}'}, {'{{teacherName}}'} will be replaced with actual values when used.
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <button 
          onclick={() => previewTemplate = null}
          class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Close
        </button>
        <button 
          onclick={() => useTemplate(previewTemplate!)}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Use Template
        </button>
      </div>
    </div>
  </div>
{/if}
