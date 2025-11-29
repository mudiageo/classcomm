<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { studentsStore, contactsStore, communicationsStore } from '$lib/db';
  import type { Student, Contact } from '$lib/db';
  import AIComposer from '$lib/components/AIComposer.svelte';
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client';

  let selectedStudentId = $state($page.url.searchParams.get('studentId') || '');
  let selectedContactId = $state('');
  
  let subject = $state('');
  let message = $state('');
  let status = $state<'draft' | 'sent' | 'scheduled'>('draft');
  let method = $state<'email' | 'phone' | 'note'>('email');

  onMount(() => {
    studentsStore.load();
    contactsStore.load();
  });

  const students = $derived(studentsStore.data.filter(s => !s._isDeleted));
  
  const selectedStudent = $derived(
    students.find(s => s.id === selectedStudentId)
  );

  const contacts = $derived(
    selectedStudentId 
      ? contactsStore.data.filter(c => c.studentId === selectedStudentId && !c._isDeleted)
      : []
  );

  const selectedContact = $derived(
    contacts.find(c => c.id === selectedContactId)
  );

  // Auto-select first contact if only one
  $effect(() => {
    if (contacts.length === 1 && !selectedContactId) {
      selectedContactId = contacts[0].id;
    }
  });

  function handleAIComplete(generated: { subject: string; body: string }) {
    subject = generated.subject;
    message = generated.body;
  }

  async function saveCommunication() {
    if (!selectedStudentId || !message) return;

    try {
      const session = await authClient.getSession();
      if (!session.data?.user) {
        alert('Please log in to save');
        return;
      }

      await communicationsStore.create({
        userId: session.data.user.id,
        studentId: selectedStudentId,
        contactId: selectedContactId || undefined,
        subject,
        message,
        status,
        method,
        tags: [],
        followUpCompleted: false,
        createdAt: Date.now()
      });

      goto(`/students/${selectedStudentId}`);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save communication');
    }
  }
</script>

<div class="compose-page max-w-4xl mx-auto p-6">
  <h1 class="text-2xl font-bold text-slate-800 mb-6">New Communication</h1>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Student</span>
            <select 
              bind:value={selectedStudentId}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Student</option>
              {#each students as student}
                <option value={student.id}>{student.firstName} {student.lastName}</option>
              {/each}
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">Contact</span>
            <select 
              bind:value={selectedContactId}
              disabled={!selectedStudentId}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Select Contact</option>
              {#each contacts as contact}
                <option value={contact.id}>{contact.name} ({contact.relationship})</option>
              {/each}
            </select>
          </label>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Method</span>
            <select 
              bind:value={method}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="email">Email</option>
              <option value="phone">Phone Call</option>
              <option value="note">Note</option>
              <option value="in-person">In Person</option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">Status</span>
            <select 
              bind:value={status}
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </label>
        </div>

        <label class="block">
          <span class="text-sm font-medium text-slate-700">Subject</span>
          <input 
            type="text" 
            bind:value={subject}
            class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-slate-700">Message</span>
          <textarea 
            bind:value={message}
            rows="10"
            class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-sans"
          ></textarea>
        </label>

        <div class="flex justify-end gap-3 pt-4">
          <button 
            onclick={() => goto('/students')}
            class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onclick={saveCommunication}
            disabled={!selectedStudentId || !message}
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Communication
          </button>
        </div>
      </div>
    </div>

    <div class="lg:col-span-1">
      {#if selectedStudent && selectedContact}
        <AIComposer 
          student={selectedStudent} 
          contact={selectedContact} 
          onComplete={handleAIComplete} 
        />
      {:else}
        <div class="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center text-slate-500">
          <p>Select a student and contact to use AI drafting.</p>
        </div>
      {/if}
    </div>
  </div>
</div>
