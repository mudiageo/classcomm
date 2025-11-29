<script lang="ts">
  import { getAIProvider } from '$lib/ai/factory';
  import type { MessageParams } from '$lib/ai/types';
  import type { Student, Contact } from '$lib/db';

  interface Props {
    student: Student;
    contact: Contact;
    onComplete: (message: { subject: string; body: string }) => void;
  }

  let { student, contact, onComplete }: Props = $props();

  let scenario = $state('');
  let tone = $state<'professional' | 'empathetic' | 'firm' | 'celebratory'>('professional');
  let method = $state<'email' | 'phone' | 'note'>('email');
  let generatedMessage = $state<{ subject: string; body: string } | null>(null);
  let isGenerating = $state(false);
  let error = $state('');

  async function generate() {
    if (!scenario.trim()) return;

    isGenerating = true;
    error = '';

    try {
      const params: MessageParams = {
        scenario,
        tone,
        method,
        studentName: student.firstName,
        grade: student.grade,
        contactName: contact.name,
        additionalContext: student.notes
      };

      const provider = getAIProvider();
      generatedMessage = await provider.generateMessage(params);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to generate message';
      console.error(err);
    } finally {
      isGenerating = false;
    }
  }

  function useMessage() {
    if (generatedMessage) {
      onComplete(generatedMessage);
    }
  }
</script>

<div class="ai-composer bg-slate-50 p-6 rounded-lg border border-slate-200">
  <h3 class="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
    ✨ AI Message Drafting
  </h3>

  <div class="space-y-4">
    <label class="block">
      <span class="text-sm font-medium text-slate-700">Describe the situation</span>
      <textarea 
        bind:value={scenario}
        placeholder="Example: Student hasn't turned in homework for 2 weeks, need to discuss support strategies"
        rows="4"
        class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      ></textarea>
    </label>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="block">
        <span class="text-sm font-medium text-slate-700">Tone</span>
        <select 
          bind:value={tone}
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="professional">Professional</option>
          <option value="empathetic">Empathetic</option>
          <option value="firm">Firm</option>
          <option value="celebratory">Celebratory</option>
        </select>
      </label>

      <label class="block">
        <span class="text-sm font-medium text-slate-700">Method</span>
        <select 
          bind:value={method}
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="email">Email</option>
          <option value="phone">Phone Script</option>
          <option value="note">Written Note</option>
        </select>
      </label>
    </div>

    <button 
      onclick={generate} 
      disabled={isGenerating || !scenario.trim()}
      class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
    >
      {#if isGenerating}
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        Generating...
      {:else}
        Generate Message
      {/if}
    </button>

    {#if error}
      <div class="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
        {error}
      </div>
    {/if}

    {#if generatedMessage}
      <div class="generated-message bg-white p-4 rounded-lg border border-slate-200 mt-4">
        {#if method === 'email'}
          <div class="mb-4">
            <h4 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Subject</h4>
            <p class="text-slate-800 font-medium">{generatedMessage.subject}</p>
          </div>
        {/if}

        <div class="mb-4">
          <h4 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Message</h4>
          <pre class="text-slate-700 whitespace-pre-wrap font-sans text-base">{generatedMessage.body}</pre>
        </div>

        <div class="flex gap-3 pt-2 border-t border-slate-100">
          <button 
            onclick={useMessage}
            class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Use This Message
          </button>
          <button 
            onclick={generate}
            class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Regenerate
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
