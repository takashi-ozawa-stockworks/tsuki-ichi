<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { fade, fly, slide } from 'svelte/transition';
  import MonthPicker from '$lib/components/MonthPicker.svelte';

  // --- 1. 状態管理 ---
  let loading = true;
  let saving = false;
  let activeTab: 'pl' | 'bs' = 'pl';

  // 日付管理
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  let year = Number($page.url.searchParams.get('year')) || currentYear;
  let month = Number($page.url.searchParams.get('month')) || currentMonth;

  // トースト通知管理
  let toastMessage = '';
  let toastType: 'success' | 'error' = 'success';
  let toastTimeout: any;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    toastMessage = msg;
    toastType = type;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastMessage = '';
    }, 3000);
  };

  const handleMonthChange = (e: CustomEvent<{ year: number; month: number }>) => {
    year = e.detail.year;
    month = e.detail.month;
    
    const url = new URL(window.location.href);
    url.searchParams.set('year', String(year));
    url.searchParams.set('month', String(month));
    goto(url.toString(), { replaceState: true, keepFocus: true, noScroll: true });
  };

  let categories: any[] = [];
  let accounts: any[] = [];
  let categoryValues: Record<number, number> = {}; 
  let accountBalances: Record<number, number> = {};

  // --- 2. データ読み込み ---
  const loadData = async () => {
    loading = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return goto('/login');

    const { data: catData } = await supabase.from('categories').select('*').order('id');
    const { data: accData } = await supabase.from('accounts').select('*').order('id');
    
    categories = catData || [];
    accounts = accData || [];

    const { data: valData } = await supabase.from('monthly_category_values').select('category_id, amount').eq('year', year).eq('month', month);
    const { data: balData } = await supabase.from('monthly_account_balances').select('account_id, balance').eq('year', year).eq('month', month);

    categoryValues = {};
    valData?.forEach(v => categoryValues[v.category_id] = v.amount);
    
    accountBalances = {};
    balData?.forEach(b => accountBalances[b.account_id] = b.balance);

    loading = false;
  };

  $: year, month, loadData();

  // ★追加: 保存ボタンを無効化するかどうかの判定ロジック
  $: isSaveDisabled = saving || 
                      (activeTab === 'pl' && categories.length === 0) || 
                      (activeTab === 'bs' && accounts.length === 0);

  // --- 3. 保存処理 ---
  const handleSave = async () => {
    saving = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (activeTab === 'pl') {
      const upsertData = categories.map(cat => ({
        user_id: user.id, year, month, category_id: cat.id,
        amount: categoryValues[cat.id] || 0
      }));
      const { error } = await supabase.from('monthly_category_values').upsert(upsertData, { onConflict: 'user_id, year, month, category_id' });
      
      if (error) showToast('保存失敗: ' + error.message, 'error');
      else showToast('収支データを保存しました！', 'success');

    } else {
      const upsertData = accounts.map(acc => ({
        user_id: user.id, year, month, account_id: acc.id,
        balance: accountBalances[acc.id] || 0
      }));
      const { error } = await supabase.from('monthly_account_balances').upsert(upsertData, { onConflict: 'user_id, year, month, account_id' });
      
      if (error) showToast('保存失敗: ' + error.message, 'error');
      else showToast('資産残高を保存しました！', 'success');
    }
    saving = false;
  };

  const updateAmount = (e: Event, id: number, type: 'category' | 'account') => {
    const input = e.target as HTMLInputElement;
    const rawValue = input.value.replace(/,/g, '').replace(/\D/g, '');
    const numValue = rawValue === '' ? 0 : parseInt(rawValue, 10);

    if (type === 'category') {
      categoryValues[id] = numValue;
    } else {
      accountBalances[id] = numValue;
    }
  };

</script>

<div class="space-y-6 pb-32">
	<div class="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
		<MonthPicker
			bind:year
			bind:month
			maxYear={currentYear}
			maxMonth={currentMonth}
			on:change={handleMonthChange}
		/>
	</div>

	<div class="flex rounded-lg bg-gray-200 p-1">
		<button
			class={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${activeTab === 'pl' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
			on:click={() => (activeTab = 'pl')}>収支入力 (PL)</button
		>
		<button
			class={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${activeTab === 'bs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
			on:click={() => (activeTab = 'bs')}>資産入力 (BS)</button
		>
	</div>

	{#if loading}
		<div class="p-10 text-center text-gray-400">Loading...</div>
	{:else}
		{#if activeTab === 'pl'}
			{#if categories.length === 0}
				<div class="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center" in:fade>
					<p class="text-gray-500 mb-2 font-bold">カテゴリーがありません</p>
					<p class="text-sm text-gray-400 mb-4">
						まずは設定画面で費目（食費など）を追加してください。
					</p>
					<a
						href="/settings"
						class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-6 py-2 text-sm font-bold text-indigo-600 hover:bg-gray-200 transition-colors"
					>
						⚙️ 設定画面へ
					</a>
				</div>
			{:else}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
					<div class="bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800">収入 (Income)</div>
					{#each categories.filter((c) => c.type === 'income') as cat}
						<div
							transition:slide
							class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0"
						>
							<label class="text-sm font-medium text-gray-700">{cat.name}</label>
							<div class="relative w-32">
								<input
									type="text"
									inputmode="numeric"
									value={(categoryValues[cat.id] || 0).toLocaleString()}
									on:input={(e) => updateAmount(e, cat.id, 'category')}
									on:focus={(e) => e.currentTarget.select()}
									class="w-full rounded border-gray-300 py-1 pl-2 pr-8 text-right text-sm focus:border-blue-500 focus:ring-blue-500"
								/>
								<span class="absolute right-3 top-1.5 text-xs text-gray-400">円</span>
							</div>
						</div>
					{/each}

					<div class="bg-red-50 px-4 py-2 text-xs font-bold text-red-800">支出 (Expense)</div>
					{#each categories.filter((c) => c.type === 'expense') as cat}
						<div
							transition:slide
							class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0"
						>
							<label class="text-sm font-medium text-gray-700">{cat.name}</label>
							<div class="relative w-32">
								<input
									type="text"
									inputmode="numeric"
									value={(categoryValues[cat.id] || 0).toLocaleString()}
									on:input={(e) => updateAmount(e, cat.id, 'category')}
									on:focus={(e) => e.currentTarget.select()}
									class="w-full rounded border-gray-300 py-1 pl-2 pr-8 text-right text-sm focus:border-red-500 focus:ring-red-500"
								/>
								<span class="absolute right-3 top-1.5 text-xs text-gray-400">円</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		{#if activeTab === 'bs'}
			{#if accounts.length === 0}
				<div class="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center" in:fade>
					<p class="text-gray-500 mb-2 font-bold">口座が登録されていません</p>
					<p class="text-sm text-gray-400 mb-4">銀行や財布などの資産管理先を追加してください。</p>
					<a
						href="/settings"
						class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-6 py-2 text-sm font-bold text-indigo-600 hover:bg-gray-200 transition-colors"
					>
						⚙️ 設定画面へ
					</a>
				</div>
			{:else}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
					<div class="bg-green-50 px-4 py-2 text-xs font-bold text-green-800">
						口座残高 (Balance)
					</div>
					{#each accounts as acc}
						<div
							transition:slide
							class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0"
						>
							<label class="text-sm font-medium text-gray-700">{acc.name}</label>
							<div class="relative w-40">
								<input
									type="text"
									inputmode="numeric"
									value={(accountBalances[acc.id] || 0).toLocaleString()}
									on:input={(e) => updateAmount(e, acc.id, 'account')}
									on:focus={(e) => e.currentTarget.select()}
									class="w-full rounded border-gray-300 py-1 pl-2 pr-8 text-right text-sm focus:border-green-500 focus:ring-green-500"
								/>
								<span class="absolute right-3 top-1.5 text-xs text-gray-400">円</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	{/if}

	<div
		class="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/90 backdrop-blur-sm p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
	>
		<div class="mx-auto max-w-4xl">
			<button
				on:click={handleSave}
				disabled={isSaveDisabled}
				class="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
			>
				{#if saving}保存中...{:else}保存する{/if}
			</button>
		</div>
	</div>

	{#if toastMessage}
		<div
			transition:fly={{ y: 20, duration: 300 }}
			class={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-medium z-50 text-sm whitespace-nowrap ${
				toastType === 'success' ? 'bg-gray-800' : 'bg-red-500'
			}`}
		>
			{toastMessage}
		</div>
	{/if}
</div>
