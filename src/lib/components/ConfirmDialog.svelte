<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  export let open = false;
  export let title = '確認';
  export let message = '';
  export let confirmText = '確定';
  export let cancelText = 'キャンセル';
  export let variant: 'danger' | 'default' = 'default';

  const dispatch = createEventDispatcher();

  const handleConfirm = () => {
    dispatch('confirm');
  };

  const handleCancel = () => {
    dispatch('cancel');
  };

  // ESCキーでキャンセル
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleCancel();
  };
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- Overlay -->
	<div
		class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
		transition:fade={{ duration: 150 }}
		on:click={handleCancel}
		role="dialog"
		aria-modal="true"
	>
		<!-- Dialog -->
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
			transition:fly={{ y: 20, duration: 200 }}
			on:click|stopPropagation
			role="document"
		>
			<!-- Header -->
			<div class="px-6 pt-6 pb-2">
				<h3 class="text-lg font-bold text-gray-900">{title}</h3>
			</div>

			<!-- Body -->
			<div class="px-6 pb-4">
				<p class="text-sm text-gray-600 whitespace-pre-line">{message}</p>
			</div>

			<!-- Actions -->
			<div class="flex border-t border-gray-100">
				<button
					on:click={handleCancel}
					class="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
				>
					{cancelText}
				</button>
				<button
					on:click={handleConfirm}
					class={`flex-1 py-3 text-sm font-bold transition-colors ${
						variant === 'danger'
							? 'text-red-600 hover:bg-red-50'
							: 'text-indigo-600 hover:bg-indigo-50'
					}`}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
