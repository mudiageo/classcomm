<script lang="ts">
  import { studentsStore } from '$lib/db';
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client';

  let form = $state({
    firstName: '',
    lastName: '',
    grade: '',
    class: '',
    notes: ''
  });

  let isSubmitting = $state(false);

  async function handleSubmit() {
    isSubmitting = true;
    try {
      const session = await authClient.getSession();
      if (!session.data?.user) {
        alert('You must be logged in to add a student');
        return;
      }

      await studentsStore.create({
        ...form,
        userId: session.data.user.id,
        createdAt: Date.now()
      });
      goto('/students');
    } catch (error) {
      console.error('Failed to add student:', error);
      alert('Failed to add student. Please try again.');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="max-w-2xl mx-auto p-6">
  <h1 class="text-2xl font-bold text-slate-800 mb-6">Add Student</h1>
  
  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <label class="block">
        <span class="text-slate-700 font-medium">First Name</span>
        <input 
          type="text" 
          bind:value={form.firstName} 
          required 
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </label>

      <label class="block">
        <span class="text-slate-700 font-medium">Last Name</span>
        <input 
          type="text" 
          bind:value={form.lastName} 
          required 
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </label>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <label class="block">
        <span class="text-slate-700 font-medium">Grade</span>
        <select 
          bind:value={form.grade} 
          required
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select grade</option>
          <option value="K">Kindergarten</option>
          {#each Array.from({ length: 12 }, (_, i) => i + 1) as grade}
            <option value={grade}>{grade}</option>
          {/each}
        </select>
      </label>

      <label class="block">
        <span class="text-slate-700 font-medium">Class</span>
        <input 
          type="text" 
          bind:value={form.class} 
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </label>
    </div>

    <label class="block">
      <span class="text-slate-700 font-medium">Notes</span>
      <textarea 
        bind:value={form.notes}
        rows="4"
        class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      ></textarea>
    </label>

    <div class="flex justify-end gap-4 pt-4">
      <button 
        type="button" 
        onclick={() => goto('/students')}
        class="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        Cancel
      </button>
      <button 
        type="submit" 
        disabled={isSubmitting}
        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving...' : 'Save Student'}
      </button>
    </div>
  </form>
</div>
