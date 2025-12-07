<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  export let open = false;
  export let title = '入力';
  export let message = '';
  export let initialValue = '';
  export let placeholder = '';
  export let maxLength = 20;
  export let confirmText = '保存';
  export let cancelText = 'キャンセル';

  const dispatch = createEventDispatcher();

  let inputValue = '';
  let inputElement: HTMLInputElement;

  // ダイアログが開いた時に初期値をセット＆フォーカス
  $: if (open) {
    inputValue = initialValue;
    // 次のフレームでフォーカス
    setTimeout(() => inputElement?.focus(), 50);
  }

  const handleConfirm = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    dispatch('confirm', { value: trimmed });
  };

  const handleCancel = () => {
    dispatch('cancel');
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'Enter') handleConfirm();
  };

  const handleInputKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
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
				{#if message}
					<p class="text-sm text-gray-600 mb-3">{message}</p>
				{/if}
				<input
					bind:this={inputElement}
					bind:value={inputValue}
					type="text"
					{placeholder}
					maxlength={maxLength}
					on:keydown={handleInputKeydown}
					class="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
				/>
				<p class="text-xs text-gray-400 mt-1 text-right">{inputValue.length}/{maxLength}</p>
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
					disabled={!inputValue.trim()}
					class="flex-1 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
