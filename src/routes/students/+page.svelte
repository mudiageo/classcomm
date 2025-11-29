<script lang="ts">
  import { onMount } from 'svelte';
  import { studentsStore, type Student } from '$lib/db';
  import { goto } from '$app/navigation';

  let searchQuery = $state('');

  onMount(() => studentsStore.load());

  const filteredStudents = $derived(
    studentsStore.data.filter((s: Student) =>
      !s._isDeleted &&
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  async function addStudent() {
    goto('/students/new');
  }
</script>

<div class="students-page p-6">
  <div class="header flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-slate-800">Students</h1>
    <button 
      onclick={addStudent}
      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Add Student
    </button>
  </div>

  <div class="mb-6">
    <input 
      type="search" 
      bind:value={searchQuery} 
      placeholder="Search students..."
      class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
  </div>

  <div class="student-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each filteredStudents as student (student.id)}
      <a 
        href="/students/{student.id}" 
        class="student-card bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow block"
      >
        <h3 class="text-lg font-semibold text-slate-800">{student.firstName} {student.lastName}</h3>
        <p class="text-slate-600 mt-1">Grade {student.grade} {student.class ? `• ${student.class}` : ''}</p>
      </a>
    {/each}
  </div>
</div>
