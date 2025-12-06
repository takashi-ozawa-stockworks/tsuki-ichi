<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // --- 1. 状態管理 ---
  let loading = true;
  let saving = false;
  let activeTab: 'pl' | 'bs' = 'pl';

  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1;

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
      if (error) alert('保存失敗: ' + error.message);
      else alert('収支データを保存しました！');

    } else {
      const upsertData = accounts.map(acc => ({
        user_id: user.id, year, month, account_id: acc.id,
        balance: accountBalances[acc.id] || 0
      }));
      const { error } = await supabase.from('monthly_account_balances').upsert(upsertData, { onConflict: 'user_id, year, month, account_id' });
      if (error) alert('保存失敗: ' + error.message);
      else alert('資産残高を保存しました！');
    }
    saving = false;
  };

  // ★追加: 金額入力のハンドリング（カンマ処理・バリデーション）
  const updateAmount = (e: Event, id: number, type: 'category' | 'account') => {
    const input = e.target as HTMLInputElement;
    
    // 1. カンマと数字以外を除去（バリデーション）
    const rawValue = input.value.replace(/,/g, '').replace(/\D/g, '');
    const numValue = rawValue === '' ? 0 : parseInt(rawValue, 10);

    // 2. 状態を更新（画面表示はSvelteのリアクティブ性により自動でカンマが付く）
    if (type === 'category') {
      categoryValues[id] = numValue;
    } else {
      accountBalances[id] = numValue;
    }
  };
</script>

<div class="space-y-6 pb-32">
  
  <div class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
    <button class="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded" on:click={() => { month--; if(month<1){month=12; year--} }}>◀</button>
    <h2 class="text-xl font-bold text-gray-800">{year}年 {month}月</h2>
    <button class="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded" on:click={() => { month++; if(month>12){month=1; year++} }}>▶</button>
  </div>

  <div class="flex rounded-lg bg-gray-200 p-1">
    <button
      class={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${activeTab === 'pl' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      on:click={() => activeTab = 'pl'}
    >
      収支入力 (PL)
    </button>
    <button
      class={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${activeTab === 'bs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      on:click={() => activeTab = 'bs'}
    >
      資産入力 (BS)
    </button>
  </div>

  {#if loading}
    <div class="p-10 text-center text-gray-400">Loading...</div>
  {:else}
    
    {#if activeTab === 'pl'}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800">収入 (Income)</div>
        {#each categories.filter(c => c.type === 'income') as cat}
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0">
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
        {#each categories.filter(c => c.type === 'expense') as cat}
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0">
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

    {#if activeTab === 'bs'}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-green-50 px-4 py-2 text-xs font-bold text-green-800">口座残高 (Balance)</div>
        {#each accounts as acc}
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0">
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

  <div class="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/90 backdrop-blur-sm p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
    <div class="mx-auto max-w-4xl">
      <button
        on:click={handleSave}
        disabled={saving}
        class="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        {#if saving}保存中...{:else}保存する{/if}
      </button>
    </div>
  </div>

</div>
