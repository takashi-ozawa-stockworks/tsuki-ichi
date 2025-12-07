<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import PromptDialog from './PromptDialog.svelte';

  export let open = false;
  export let item: { id: number; name: string; type: string } | null = null;
  export let initialValue = 0;

  const dispatch = createEventDispatcher();

  // 入力状態
  let displayValue = '0';
  let pendingValue = 0;
  let operator: '+' | '-' | null = null;
  let showActions = false;

  // ダイアログ状態
  let editDialogOpen = false;
  let deleteDialogOpen = false;

  // モーダルが開いたときに初期値をセット
  $: if (open && item) {
    displayValue = initialValue > 0 ? initialValue.toString() : '0';
    pendingValue = 0;
    operator = null;
    showActions = false;
    editDialogOpen = false;
    deleteDialogOpen = false;
  }

  // 表示用タイプ判定
  $: typeLabel = item?.type === 'income' ? '収入' : item?.type === 'expense' ? '支出' : '資産';
  $: typeColor = item?.type === 'income' ? 'bg-blue-100 text-blue-700' : item?.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';

  // 数値フォーマット
  $: formattedDisplay = Number(displayValue).toLocaleString();

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      displayValue = '0';
      pendingValue = 0;
      operator = null;
    } else if (key === '⌫') {
      displayValue = displayValue.length > 1 ? displayValue.slice(0, -1) : '0';
    } else if (key === '+' || key === '-') {
      const currentVal = Number(displayValue);

      if (operator) {
        // すでに演算子が選択されている場合
        if (displayValue === '0') {
          // まだ数字入力前なら演算子を変更するだけ
          operator = key;
        } else {
          // 数字入力済みなら連続計算を実行
          if (operator === '+') pendingValue += currentVal;
          else if (operator === '-') pendingValue = Math.max(0, pendingValue - currentVal);
          
          operator = key;
          displayValue = '0';
        }
      } else {
        // 初回の演算子選択
        pendingValue = currentVal;
        operator = key;
        displayValue = '0';
      }
    } else if (key === '00') {
      if (displayValue !== '0') {
        displayValue += '00';
      }
    } else {
      // 数字キー
      if (displayValue === '0') {
        displayValue = key;
      } else {
        displayValue += key;
      }
    }
    // 最大桁数制限（10桁）
    if (displayValue.length > 10) {
      displayValue = displayValue.slice(0, 10);
    }
  };

  const handleConfirm = () => {
    let finalValue = Number(displayValue);
    
    if (operator && pendingValue > 0) {
      if (operator === '+') {
        finalValue = pendingValue + finalValue;
      } else if (operator === '-') {
        finalValue = Math.max(0, pendingValue - finalValue);
      }
    }

    dispatch('confirm', { value: finalValue });
    handleClose();
  };

  const handleClose = () => {
    dispatch('close');
  };

  // 編集ダイアログを開く
  const openEditDialog = () => {
    editDialogOpen = true;
  };

  // 編集確定
  const handleEditConfirm = (e: CustomEvent<{ value: string }>) => {
    editDialogOpen = false;
    if (!item) return;
    dispatch('edit', { id: item.id, newName: e.detail.value });
  };

  // 削除ダイアログを開く
  const openDeleteDialog = () => {
    deleteDialogOpen = true;
  };

  // 削除確定
  const handleDeleteConfirm = () => {
    deleteDialogOpen = false;
    if (!item) return;
    dispatch('delete', { id: item.id });
  };

  const keys = [
    ['7', '8', '9', 'C'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '-'],
    ['0', '00', '⌫', '確定']
  ];
</script>

{#if open}
	<!-- Overlay -->
	<div
		class="fixed inset-0 bg-black/50 z-50"
		transition:fade={{ duration: 200 }}
		on:click={handleClose}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		role="button"
		tabindex="-1"
	/>

	<!-- Modal -->
	<div
		class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-w-lg mx-auto"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<!-- Header -->
		<div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
			<button
				on:click={handleClose}
				class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="w-5 h-5 text-gray-500"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<div class="flex items-center gap-2">
				<span class={`text-xs px-2 py-0.5 rounded-full font-bold ${typeColor}`}>
					{typeLabel}
				</span>
				<span class="text-lg font-bold text-gray-800">{item?.name}</span>
			</div>

			<button
				on:click={() => (showActions = !showActions)}
				class="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-5 h-5 text-gray-500"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
					/>
				</svg>
			</button>
		</div>

		<!-- Actions (collapsible) -->
		{#if showActions}
			<div
				class="flex gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50"
				transition:fly={{ y: -10, duration: 150 }}
			>
				<button
					on:click={openEditDialog}
					class="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-4 h-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
						/>
					</svg>
					編集
				</button>
				<button
					on:click={openDeleteDialog}
					class="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-4 h-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
						/>
					</svg>
					削除
				</button>
			</div>
		{/if}

		<!-- Display -->
		<div class="px-4 py-6 text-center">
			{#if operator}
				<div class="text-sm text-gray-400 mb-1">
					{pendingValue.toLocaleString()}
					{operator}
				</div>
			{/if}
			<div class="text-4xl font-bold text-gray-800">
				¥{formattedDisplay}
			</div>
		</div>

		<!-- Keypad -->
		<div class="grid grid-cols-4 gap-1 p-2 pb-6 bg-gray-50">
			{#each keys as row}
				{#each row as key}
					<button
						on:click={() => (key === '確定' ? handleConfirm() : handleKeyPress(key))}
						class={`
              py-4 rounded-xl text-xl font-semibold transition-all active:scale-95
              ${
								key === '確定'
									? 'bg-indigo-600 text-white hover:bg-indigo-700'
									: key === 'C'
										? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
										: key === '+' || key === '-'
											? `bg-amber-100 text-amber-700 hover:bg-amber-200 ${operator === key ? 'ring-2 ring-amber-400' : ''}`
											: 'bg-white text-gray-800 hover:bg-gray-100 shadow-sm'
							}
            `}
					>
						{key}
					</button>
				{/each}
			{/each}
		</div>
	</div>
{/if}

<!-- 編集ダイアログ -->
<PromptDialog
	open={editDialogOpen}
	title={item?.type === 'income' || item?.type === 'expense' ? 'カテゴリー編集' : '口座編集'}
	message="新しい名前を入力してください"
	initialValue={item?.name || ''}
	placeholder="名称"
	maxLength={20}
	confirmText="保存"
	on:confirm={handleEditConfirm}
	on:cancel={() => (editDialogOpen = false)}
/>

<!-- 削除ダイアログ -->
<ConfirmDialog
	open={deleteDialogOpen}
	title="削除確認"
	message={`「${item?.name}」を削除しますか？\n※これまでの入力データも集計されなくなります`}
	confirmText="削除"
	variant="danger"
	on:confirm={handleDeleteConfirm}
	on:cancel={() => (deleteDialogOpen = false)}
/>
