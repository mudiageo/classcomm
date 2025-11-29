<script lang="ts">
  import { onMount } from 'svelte';
  import { studentsStore, communicationsStore, templatesStore } from '$lib/db';
  import ReminderWidget from '$lib/components/ReminderWidget.svelte';
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client';

  let user = $state<any>(null);

  onMount(async () => {
    const session = await authClient.getSession();
    user = session.data?.user;

    studentsStore.load();
    communicationsStore.load();
    templatesStore.load();
  });

  const stats = $derived({
    students: studentsStore.data.filter(s => !s._isDeleted).length,
    communications: communicationsStore.data.filter(c => !c._isDeleted).length,
    templates: templatesStore.data.filter(t => !t._isDeleted).length,
    sentThisWeek: communicationsStore.data.filter(c => {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return c.status === 'sent' && c.sentAt && c.sentAt > oneWeekAgo;
    }).length
  });

  const recentActivity = $derived(
    communicationsStore.data
      .filter(c => !c._isDeleted)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
  );

  function getStudentName(studentId: string) {
    const student = studentsStore.data.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  }
</script>

<div class="dashboard max-w-7xl mx-auto p-6">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-800">
      Welcome back, {user?.name || 'Teacher'}! 👋
    </h1>
    <p class="text-slate-600 mt-2">Here's what's happening in your classroom communications.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="stat-card bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Total Students</div>
      <div class="text-3xl font-bold text-slate-800">{stats.students}</div>
    </div>
    <div class="stat-card bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Messages Sent</div>
      <div class="text-3xl font-bold text-slate-800">{stats.communications}</div>
    </div>
    <div class="stat-card bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Sent This Week</div>
      <div class="text-3xl font-bold text-blue-600">{stats.sentThisWeek}</div>
    </div>
    <div class="stat-card bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Templates</div>
      <div class="text-3xl font-bold text-slate-800">{stats.templates}</div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2 space-y-8">
      <div class="quick-actions grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button 
          onclick={() => goto('/compose')}
          class="p-4 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex flex-col items-center gap-2 text-center"
        >
          <span class="text-2xl">✏️</span>
          <span class="font-medium">New Message</span>
        </button>
        <button 
          onclick={() => goto('/students/new')}
          class="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 text-center"
        >
          <span class="text-2xl">🎓</span>
          <span class="font-medium">Add Student</span>
        </button>
        <button 
          onclick={() => goto('/templates')}
          class="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 text-center"
        >
          <span class="text-2xl">📋</span>
          <span class="font-medium">Templates</span>
        </button>
        <button 
          onclick={() => goto('/students')}
          class="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 text-center"
        >
          <span class="text-2xl">👥</span>
          <span class="font-medium">Students</span>
        </button>
      </div>

      <div class="recent-activity bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div class="header p-6 border-b border-slate-100">
          <h3 class="font-semibold text-slate-800">Recent Activity</h3>
        </div>
        <div class="activity-list">
          {#if recentActivity.length === 0}
            <div class="p-8 text-center text-slate-500 italic">
              No recent activity. Start by adding students or sending messages!
            </div>
          {:else}
            {#each recentActivity as activity}
              <div class="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex justify-between items-center">
                <div>
                  <p class="font-medium text-slate-800">{activity.subject}</p>
                  <p class="text-sm text-slate-500">
                    To {getStudentName(activity.studentId)} • {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span class="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded capitalize">
                  {activity.status}
                </span>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <div class="lg:col-span-1">
      <ReminderWidget />
    </div>
  </div>
</div>
