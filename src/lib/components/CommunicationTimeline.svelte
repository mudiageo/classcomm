<script lang="ts">
  import { communicationsStore, contactsStore, type Communication } from '$lib/db';
  import { format } from 'date-fns';

  interface Props {
    studentId: string;
  }

  let { studentId }: Props = $props();

  const studentCommunications = $derived(
    communicationsStore.data
      .filter((c: Communication) => c.studentId === studentId && !c._isDeleted)
      .sort((a: Communication, b: Communication) => b.createdAt - a.createdAt)
  );

  function getContactName(contactId?: string) {
    if (!contactId) return 'Unknown';
    const contact = contactsStore.data.find(c => c.id === contactId);
    return contact?.name || 'Unknown';
  }

  function getStatusColor(status: string) {
    return {
      draft: 'text-amber-600 bg-amber-50',
      sent: 'text-green-600 bg-green-50',
      scheduled: 'text-blue-600 bg-blue-50'
    }[status] || 'text-slate-600 bg-slate-50';
  }
</script>

<div class="timeline space-y-4">
  <h3 class="text-lg font-semibold text-slate-800">Communication History</h3>

  {#if studentCommunications.length === 0}
    <p class="text-slate-500 italic">No communications yet</p>
  {:else}
    {#each studentCommunications as comm (comm.id)}
      <div class="timeline-item flex gap-4">
        <div class="timeline-date w-24 pt-1 text-right">
          <span class="text-sm font-medium text-slate-500">{format(comm.createdAt, 'MMM d, yyyy')}</span>
        </div>
        
        <div class="timeline-content flex-1 bg-white p-4 rounded-lg shadow-sm border border-slate-200 relative">
          <!-- Connector line -->
          <div class="absolute -left-4 top-4 w-4 h-px bg-slate-200"></div>
          
          <div class="timeline-header flex justify-between items-start mb-2">
            <div>
              <h4 class="font-semibold text-slate-800">{comm.subject}</h4>
              <p class="text-sm text-slate-600">
                To: {getContactName(comm.contactId)} • {comm.method || 'email'}
              </p>
            </div>
            <span class={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(comm.status)}`}>
              {comm.status}
            </span>
          </div>
          
          {#if comm.tags.length > 0}
            <div class="tags flex gap-2 mb-2">
              {#each comm.tags as tag}
                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{tag}</span>
              {/each}
            </div>
          {/if}
          
          <p class="text-slate-600 text-sm line-clamp-3 mb-3">{comm.message}</p>
          
          <div class="timeline-actions flex gap-2">
            <a 
              href="/compose?id={comm.id}" 
              class="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View
            </a>
            {#if comm.status === 'draft'}
              <a 
                href="/compose?id={comm.id}" 
                class="text-sm text-slate-600 hover:text-slate-800 font-medium"
              >
                Edit
              </a>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>
