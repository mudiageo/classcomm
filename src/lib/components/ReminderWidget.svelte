<script lang="ts">
  import { remindersStore, communicationsStore, studentsStore, type Reminder } from '$lib/db';
  import { format, isPast, isToday, isTomorrow } from 'date-fns';
  import { goto } from '$app/navigation';

  onMount(() => {
    remindersStore.load();
    communicationsStore.load();
    studentsStore.load();
  });

  import { onMount } from 'svelte';

  const pendingReminders = $derived(
    remindersStore.data
      .filter((r: Reminder) => !r.completed && !r._isDeleted)
      .sort((a: Reminder, b: Reminder) => a.dueDate - b.dueDate)
  );

  function getReminderContext(reminder: Reminder) {
    const comm = communicationsStore.data.find(c => c.id === reminder.communicationId);
    if (!comm) return 'Unknown Context';
    
    const student = studentsStore.data.find(s => s.id === comm.studentId);
    return student ? `Follow up: ${student.firstName} ${student.lastName}` : 'Follow up';
  }

  function getDateLabel(timestamp: number) {
    const date = new Date(timestamp);
    if (isPast(date) && !isToday(date)) return 'Overdue';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  }

  function getDateColor(timestamp: number) {
    const date = new Date(timestamp);
    if (isPast(date) && !isToday(date)) return 'text-red-600 bg-red-50';
    if (isToday(date)) return 'text-amber-600 bg-amber-50';
    return 'text-blue-600 bg-blue-50';
  }

  async function completeReminder(reminder: Reminder) {
    await remindersStore.update(reminder.id, {
      completed: true,
      completedAt: Date.now()
    });
  }
</script>

<div class="reminder-widget bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
  <div class="header p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
    <h3 class="font-semibold text-slate-800">Reminders</h3>
    <span class="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
      {pendingReminders.length}
    </span>
  </div>

  <div class="reminders-list max-h-[300px] overflow-y-auto">
    {#if pendingReminders.length === 0}
      <div class="p-6 text-center text-slate-500 italic">
        No pending reminders.
      </div>
    {:else}
      {#each pendingReminders as reminder (reminder.id)}
        <div class="reminder-item p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 items-start group">
          <button 
            onclick={() => completeReminder(reminder)}
            class="mt-1 w-5 h-5 rounded-full border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 transition-colors flex-shrink-0"
            aria-label="Complete reminder"
          ></button>
          
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-800 truncate">{reminder.description}</p>
            <p class="text-xs text-slate-500 truncate">{getReminderContext(reminder)}</p>
          </div>

          <span class={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${getDateColor(reminder.dueDate)}`}>
            {getDateLabel(reminder.dueDate)}
          </span>
        </div>
      {/each}
    {/if}
  </div>
  
  <div class="footer p-3 bg-slate-50 border-t border-slate-100 text-center">
    <a href="/reminders" class="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</a>
  </div>
</div>
