<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  // データを入れる箱
  let categories: any[] = [];
  let accounts: any[] = [];
  let loading = true;

  // 新規追加用の変数
  let newCategoryName = '';
  let newCategoryType = 'expense'; // 初期値は支出
  let newAccountName = '';
  
  // データの読み込み
  const fetchData = async () => {
    loading = true;
    
    // カテゴリー取得 (ID順に並べる)
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });
    categories = catData || [];

    // 口座取得
    const { data: accData } = await supabase
      .from('accounts')
      .select('*')
      .order('id', { ascending: true });
    accounts = accData || [];
    
    loading = false;
  };

  onMount(fetchData);

  // カテゴリー追加
  const addCategory = async () => {
    if (!newCategoryName) return;
    
    // 1. 自分のユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser();
    
    // 2. DBに追加
    const { error } = await supabase.from('categories').insert({
      user_id: user?.id,
      name: newCategoryName,
      type: newCategoryType
    });

    if (!error) {
      newCategoryName = ''; // 入力欄をクリア
      await fetchData();    // リストを再読み込み
    } else {
      alert('エラー: ' + error.message);
    }
  };

  // カテゴリー削除
  const deleteCategory = async (id: number) => {
    if(!confirm('削除しますか？')) return;
    
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) await fetchData();
  };

  // 口座追加
  const addAccount = async () => {
    if (!newAccountName) return;
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('accounts').insert({
      user_id: user?.id,
      name: newAccountName,
      type: 'bank' // 今回は簡易化のため 'bank' 固定で登録
    });

    if (!error) {
      newAccountName = '';
      await fetchData();
    } else {
      alert('エラー: ' + error.message);
    }
  };

  // 口座削除
  const deleteAccount = async (id: number) => {
    if(!confirm('削除しますか？')) return;
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (!error) await fetchData();
  };
</script>

<div class="space-y-8 pb-10">
  <h2 class="text-2xl font-bold text-gray-800">設定</h2>

  <section class="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
    <h3 class="mb-4 text-lg font-bold flex items-center gap-2">
      📂 カテゴリー設定
    </h3>

    <div class="mb-6 flex gap-2">
      <select bind:value={newCategoryType} class="rounded border-gray-300 py-2 text-sm">
        <option value="expense">支出</option>
        <option value="income">収入</option>
      </select>
      <input
        type="text"
        bind:value={newCategoryName}
        placeholder="費目名 (例: 食費)"
        class="flex-1 rounded border-gray-300 py-2 text-sm"
      />
      <button
        on:click={addCategory}
        disabled={!newCategoryName}
        class="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        追加
      </button>
    </div>

    {#if loading}
      <p class="text-gray-400">Loading...</p>
    {:else if categories.length === 0}
      <p class="text-gray-400 text-sm">登録されたカテゴリーはありません</p>
    {:else}
      <ul class="divide-y divide-gray-100">
        {#each categories as cat}
          <li class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <span class={`text-xs px-2 py-0.5 rounded-full ${cat.type === 'income' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                {cat.type === 'income' ? '収入' : '支出'}
              </span>
              <span>{cat.name}</span>
            </div>
            <button on:click={() => deleteCategory(cat.id)} class="text-gray-400 hover:text-red-500">
              🗑
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
    <h3 class="mb-4 text-lg font-bold flex items-center gap-2">
      🏦 口座・資産設定
    </h3>

    <div class="mb-6 flex gap-2">
      <input
        type="text"
        bind:value={newAccountName}
        placeholder="口座名 (例: A銀行, 財布)"
        class="flex-1 rounded border-gray-300 py-2 text-sm"
      />
      <button
        on:click={addAccount}
        disabled={!newAccountName}
        class="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        追加
      </button>
    </div>

    {#if loading}
      <p class="text-gray-400">Loading...</p>
    {:else if accounts.length === 0}
      <p class="text-gray-400 text-sm">登録された口座はありません</p>
    {:else}
      <ul class="divide-y divide-gray-100">
        {#each accounts as acc}
          <li class="flex items-center justify-between py-2">
            <span>{acc.name}</span>
            <button on:click={() => deleteAccount(acc.id)} class="text-gray-400 hover:text-red-500">
              🗑
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
