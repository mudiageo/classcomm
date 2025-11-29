<script lang="ts">
  import { page } from '$app/stores';
  import { studentsStore, contactsStore, communicationsStore } from '$lib/db';
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client';
  import { onMount } from 'svelte';
  import type { Student, Contact, Communication } from '$lib/db';
  import { format } from 'date-fns';

  const studentId = $page.params.id;
  
  let activeTab = $state('overview');
  let showAddContact = $state(false);
  let contactForm = $state({
    name: '',
    relationship: 'parent',
    email: '',
    phone: '',
    preferredLanguage: 'en'
  });

  async function handleAddContact() {
    try {
      const session = await authClient.getSession();
      if (!session.data?.user) return;

      await contactsStore.create({
        ...contactForm,
        studentId,
        userId: session.data.user.id,
        createdAt: Date.now(),
        preferredMethod: 'email' // Default
      });
      showAddContact = false;
      // Reset form
      contactForm = {
        name: '',
        relationship: 'parent',
        email: '',
        phone: '',
        preferredLanguage: 'en'
      };
    } catch (error) {
      console.error('Failed to add contact:', error);
      alert('Failed to add contact');
    }
  }

  onMount(() => {
    studentsStore.load();
    contactsStore.load();
    communicationsStore.load();
  });

  const student = $derived(
    studentsStore.data.find((s: Student) => s.id === studentId)
  );

  const contacts = $derived(
    contactsStore.data.filter((c: Contact) => c.studentId === studentId && !c._isDeleted)
  );

  const communications = $derived(
    communicationsStore.data
      .filter((c: Communication) => c.studentId === studentId && !c._isDeleted)
      .sort((a, b) => b.createdAt - a.createdAt)
  );

  async function deleteStudent() {
    if (confirm('Are you sure you want to delete this student?')) {
      await studentsStore.delete(studentId);
      goto('/students');
    }
  }
</script>

{#if student}
  <div class="student-detail p-6 max-w-7xl mx-auto">
    <div class="header flex justify-between items-start mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">{student.firstName} {student.lastName}</h1>
        <p class="text-slate-600 mt-1 text-lg">Grade {student.grade} {student.class ? `• ${student.class}` : ''}</p>
      </div>
      <div class="flex gap-3">
        <button 
          onclick={() => goto(`/compose?studentId=${studentId}`)}
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Message
        </button>
        <button 
          onclick={deleteStudent}
          class="text-red-600 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>

    <div class="tabs flex gap-6 border-b border-slate-200 mb-6">
      <button 
        class="pb-3 px-1 font-medium border-b-2 transition-colors {activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
        onclick={() => activeTab = 'overview'}
      >
        Overview
      </button>
      <button 
        class="pb-3 px-1 font-medium border-b-2 transition-colors {activeTab === 'contacts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
        onclick={() => activeTab = 'contacts'}
      >
        Contacts ({contacts.length})
      </button>
      <button 
        class="pb-3 px-1 font-medium border-b-2 transition-colors {activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
        onclick={() => activeTab = 'history'}
      >
        History ({communications.length})
      </button>
    </div>

    {#if activeTab === 'overview'}
      <div class="overview grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-white p-6 rounded-lg shadow-sm border border-slate-200 col-span-2">
          <h3 class="text-lg font-semibold mb-4">Notes</h3>
          <p class="text-slate-700 whitespace-pre-wrap">{student.notes || 'No notes added.'}</p>
        </div>
        <div class="card bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 class="text-lg font-semibold mb-4">Quick Stats</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-slate-600">Messages Sent</span>
              <span class="font-medium">{communications.filter(c => c.status === 'sent').length}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Last Contact</span>
              <span class="font-medium">
                {communications.length > 0 ? format(communications[0].createdAt, 'MMM d') : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'contacts'}
      <div class="contacts">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Family Contacts</h3>
          <button 
            onclick={() => showAddContact = true}
            class="text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-200 transition-colors"
          >
            + Add Contact
          </button>
        </div>
        
        {#if contacts.length === 0}
          <p class="text-slate-500 italic">No contacts added yet.</p>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each contacts as contact}
              <div class="contact-card bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-semibold text-slate-800">{contact.name}</h4>
                    <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                      {contact.relationship}
                    </span>
                  </div>
                  <div class="text-right text-sm text-slate-500">
                    <p>{contact.preferredLanguage.toUpperCase()}</p>
                  </div>
                </div>
                <div class="mt-3 space-y-1 text-sm text-slate-600">
                  {#if contact.email}
                    <p class="flex items-center gap-2">
                      📧 {contact.email}
                    </p>
                  {/if}
                  {#if contact.phone}
                    <p class="flex items-center gap-2">
                      📞 {contact.phone}
                    </p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'history'}
      <div class="history space-y-4">
        {#if communications.length === 0}
          <p class="text-slate-500 italic">No communication history.</p>
        {:else}
          {#each communications as comm}
            <div class="comm-item bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div class="flex justify-between mb-2">
                <span class="font-medium text-slate-800">{comm.subject}</span>
                <span class="text-sm text-slate-500">{format(comm.createdAt, 'MMM d, yyyy')}</span>
              </div>
              <p class="text-slate-600 text-sm line-clamp-2">{comm.message}</p>
              <div class="mt-2 flex gap-2">
                <span class="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 capitalize">
                  {comm.status}
                </span>
                <span class="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 capitalize">
                  {comm.method || 'email'}
                </span>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  {#if showAddContact}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">Add Contact</h2>
        <form onsubmit={(e) => { e.preventDefault(); handleAddContact(); }} class="space-y-4">
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Name</span>
            <input type="text" bind:value={contactForm.name} required class="mt-1 block w-full px-3 py-2 border rounded-md" />
          </label>
          
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Relationship</span>
            <select bind:value={contactForm.relationship} class="mt-1 block w-full px-3 py-2 border rounded-md">
              <option value="parent">Parent</option>
              <option value="guardian">Guardian</option>
              <option value="emergency">Emergency Contact</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">Email</span>
            <input type="email" bind:value={contactForm.email} class="mt-1 block w-full px-3 py-2 border rounded-md" />
          </label>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">Phone</span>
            <input type="tel" bind:value={contactForm.phone} class="mt-1 block w-full px-3 py-2 border rounded-md" />
          </label>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">Preferred Language</span>
            <select bind:value={contactForm.preferredLanguage} class="mt-1 block w-full px-3 py-2 border rounded-md">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="zh">Chinese</option>
              <option value="vi">Vietnamese</option>
              <option value="ar">Arabic</option>
              <option value="tl">Tagalog</option>
              <option value="fr">French</option>
              <option value="ko">Korean</option>
            </select>
          </label>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" onclick={() => showAddContact = false} class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Contact</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
{:else}
  <div class="p-6 text-center text-slate-500">
    Loading student details...
  </div>
{/if}
