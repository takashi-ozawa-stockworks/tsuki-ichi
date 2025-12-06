<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // --- 1. 状態管理 ---
  let loading = true;
  let saving = false;
  let activeTab: 'pl' | 'bs' = 'pl'; // 'pl'=収支, 'bs'=資産

  // 日付管理 (初期値は今日)
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1;

  // データを入れる箱
  let categories: any[] = []; // マスタ
  let accounts: any[] = [];   // マスタ
  
  // 入力値の保管場所 { ID: 金額 } の形
  let categoryValues: Record<number, number> = {}; 
  let accountBalances: Record<number, number> = {};

  // --- 2. データ読み込み ---
  const loadData = async () => {
    loading = true;
    
    // A. 自分のユーザーID取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return goto('/login');

    // B. マスタデータの取得
    const { data: catData } = await supabase.from('categories').select('*').order('id');
    const { data: accData } = await supabase.from('accounts').select('*').order('id');
    
    categories = catData || [];
    accounts = accData || [];

    // C. 今月のデータを取得 (PL: 収支)
    const { data: valData } = await supabase
      .from('monthly_category_values')
      .select('category_id, amount')
      .eq('year', year)
      .eq('month', month);

    // D. 今月のデータを取得 (BS: 資産)
    const { data: balData } = await supabase
      .from('monthly_account_balances')
      .select('account_id, balance')
      .eq('year', year)
      .eq('month', month);

    // E. 取得したデータを使いやすい形(Map)に変換
    categoryValues = {};
    valData?.forEach(v => categoryValues[v.category_id] = v.amount);
    
    accountBalances = {};
    balData?.forEach(b => accountBalances[b.account_id] = b.balance);

    loading = false;
  };

  // 年月が変わったら再読み込み
  $: year, month, loadData();

  // --- 3. 保存処理 ---
  const handleSave = async () => {
    saving = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (activeTab === 'pl') {
      // --- 収支(PL)の保存 ---
      // 入力された値を配列に変換
      const upsertData = categories.map(cat => ({
        user_id: user.id,
        year,
        month,
        category_id: cat.id,
        amount: categoryValues[cat.id] || 0 // 空欄なら0
      }));

      // 一括保存 (Upsert: あれば更新、なければ作成)
      const { error } = await supabase.from('monthly_category_values').upsert(upsertData, { onConflict: 'user_id, year, month, category_id' });
      if (error) alert('保存失敗: ' + error.message);
      else alert('収支データを保存しました！');

    } else {
      // --- 資産(BS)の保存 ---
      const upsertData = accounts.map(acc => ({
        user_id: user.id,
        year,
        month,
        account_id: acc.id,
        balance: accountBalances[acc.id] || 0
      }));

      const { error } = await supabase.from('monthly_account_balances').upsert(upsertData, { onConflict: 'user_id, year, month, account_id' });
      if (error) alert('保存失敗: ' + error.message);
      else alert('資産残高を保存しました！');
    }
    
    saving = false;
  };
</script>

<div class="space-y-6 pb-20">
  
  <div class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
    <button class="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded" on:click={() => { month--; if(month<1){month=12; year--} }}>
      ◀
    </button>
    <h2 class="text-xl font-bold text-gray-800">{year}年 {month}月</h2>
    <button class="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded" on:click={() => { month++; if(month>12){month=1; year++} }}>
      ▶
    </button>
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
                type="number"
                bind:value={categoryValues[cat.id]}
                placeholder="0"
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
                type="number"
                bind:value={categoryValues[cat.id]}
                placeholder="0"
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
                type="number"
                bind:value={accountBalances[acc.id]}
                placeholder="0"
                class="w-full rounded border-gray-300 py-1 pl-2 pr-8 text-right text-sm focus:border-green-500 focus:ring-green-500"
              />
              <span class="absolute right-3 top-1.5 text-xs text-gray-400">円</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}

  {/if}

  <div class="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg sm:static sm:border-0 sm:bg-transparent sm:shadow-none">
    <button
      on:click={handleSave}
      disabled={saving}
      class="w-full max-w-4xl mx-auto block rounded-lg bg-indigo-600 py-3 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
    >
      {#if saving}保存中...{:else}保存する{/if}
    </button>
  </div>

</div>
