<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { dev } from '$app/environment';

  // --- 変数定義 ---
  let categories: any[] = [];
  let accounts: any[] = [];
  let loading = true;
  let processing = false; // 処理中フラグ
  let submitting = false; // 追加処理中のフラグ

  let newCategoryName = '';
  let newCategoryType = 'expense';
  let newAccountName = '';
  
  // --- データ読み込み ---
  const fetchData = async () => {
    loading = true;
    
    const { data: catData } = await supabase.from('categories').select('*').order('id');
    categories = catData || [];

    const { data: accData } = await supabase.from('accounts').select('*').order('id');
    accounts = accData || [];
    
    loading = false;
  };

  onMount(fetchData);

  // 共通バリデーション関数
  const validateInput = (name: string, list: any[], label: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert(`${label}を入力してください`);
      return null;
    }
    if (trimmedName.length > 20) {
      alert(`${label}は20文字以内で入力してください`);
      return null;
    }
    // 重複チェック (既存リストの中に同じ名前があるか)
    const isDuplicate = list.some(item => item.name === trimmedName);
    if (isDuplicate) {
      alert(`「${trimmedName}」は既に登録されています`);
      return null;
    }
    return trimmedName;
  };

  // カテゴリー追加
  const addCategory = async () => {
    // バリデーション実行
    const validName = validateInput(newCategoryName, categories, '費目名');
    if (!validName) return;

    submitting = true; // 連打防止ON
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('categories').insert({
      user_id: user?.id, 
      name: validName, // トリム済みの名前を使う
      type: newCategoryType
    });

    if (!error) { 
      newCategoryName = ''; 
      await fetchData(); 
    } else {
      alert('エラーが発生しました: ' + error.message);
    }
    submitting = false; // 連打防止OFF
  };

  // カテゴリー削除
  const deleteCategory = async (id: number) => {
    if(!confirm('削除しますか？\n※これまでの入力データも集計されなくなります')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) await fetchData();
  };

  // 口座追加
  const addAccount = async () => {
    const validName = validateInput(newAccountName, accounts, '口座名');
    if (!validName) return;

    submitting = true;
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('accounts').insert({
      user_id: user?.id, 
      name: validName, 
      type: 'bank'
    });

    if (!error) { 
      newAccountName = ''; 
      await fetchData(); 
    } else {
      alert('エラーが発生しました: ' + error.message);
    }
    submitting = false;
  };

  // 口座削除
  const deleteAccount = async (id: number) => {
    if(!confirm('削除しますか？\n※残高データも消える可能性があります')) return;
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (!error) await fetchData();
  };

  // ==========================================
  // ★ 開発用: パワーアップしたダミーデータ生成
  // ==========================================
  const generateDummyData = async () => {
    if (!confirm('【注意】1年分の大量のデータを生成します。よろしいですか？')) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    processing = true;

    try {
      // 1. カテゴリーのマスタデータ作成
      const incomeNames = ['給与', 'その他収入'];
      const expenseNames = [
        '食費', '家賃', '水道光熱費', '通信費', '日用品', 
        '交通費', '交際費', '娯楽費', '被服費', '美容費', 
        '医療費', '教育費', '保険料', '書籍代', 'サブスク', 
        'ガソリン代', '雑費'
      ]; // 15個以上用意

      // まとめてInsert
      const { data: newCats } = await supabase.from('categories').insert([
        ...incomeNames.map(name => ({ user_id: user.id, name, type: 'income' })),
        ...expenseNames.map(name => ({ user_id: user.id, name, type: 'expense' }))
      ]).select();

      // 2. 口座のマスタデータ作成
      const accountNames = [
        'メイン銀行', '貯蓄用銀行', '生活費口座', 'タンス預金', '財布', 
        'PayPay', '楽天Edy', 'Suica', 'SBI証券', '楽天証券'
      ]; // 10個

      const { data: newAccs } = await supabase.from('accounts').insert(
        accountNames.map(name => ({ user_id: user.id, name, type: 'bank' }))
      ).select();

      // 3. 1年分(1月〜12月)のデータを生成
      if (newCats && newAccs) {
        const today = new Date();
        const year = today.getFullYear();
        
        let plData = [];
        let bsData = [];

        // 1月から12月までループ
        for (let month = 1; month <= 12; month++) {
          
          // A. 収支データ (PL) 生成
          newCats.forEach(cat => {
            let amount = 0;
            if (cat.type === 'income') {
               // 給与はだいたい固定、その他はランダム
               amount = cat.name === '給与' ? 300000 : Math.floor(Math.random() * 50000);
            } else {
               // 支出はランダム (家賃だけ固定)
               if (cat.name === '家賃') amount = 80000;
               else amount = Math.floor(Math.random() * 30000) + 1000;
            }
            plData.push({ user_id: user.id, year, month, category_id: cat.id, amount });
          });

          // B. 資産データ (BS) 生成
          // 資産は月を追うごとに少し変動させる（リアルっぽく）
          newAccs.forEach(acc => {
            // ベース金額 + 月ごとの変動
            const base = 100000 + (acc.id * 10000); 
            const fluctuation = Math.floor(Math.random() * 50000) - 25000;
            const balance = base + (month * 20000) + fluctuation; // 毎月少し増えていく設定
            bsData.push({ user_id: user.id, year, month, account_id: acc.id, balance });
          });
        }

        // 一括保存 (数が多いので分割せずに投げるが、Supabaseの制限にかかるようなら分割が必要)
        await supabase.from('monthly_category_values').upsert(plData, { onConflict: 'user_id, year, month, category_id' });
        await supabase.from('monthly_account_balances').upsert(bsData, { onConflict: 'user_id, year, month, account_id' });
      }

      await fetchData();
      alert('完了: 1年分のダミーデータを投入しました！');

    } catch (e: any) {
      alert('エラー: ' + e.message);
    } finally {
      processing = false;
    }
  };

  // ★ 開発用: 全データ削除 (リセット)
  const handleDeleteAll = async () => {
    if (!confirm('【警告】本当に全てのデータを削除しますか？\nカテゴリー、口座、入力データが全て消えます。')) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    processing = true;

    // カテゴリーと口座を消せば、Cascade設定により紐づく収支・資産データも自動で消えるはずだが
    // 念の為、子テーブルから消していくのが安全
    await supabase.from('monthly_category_values').delete().eq('user_id', user.id);
    await supabase.from('monthly_account_balances').delete().eq('user_id', user.id);
    await supabase.from('categories').delete().eq('user_id', user.id);
    await supabase.from('accounts').delete().eq('user_id', user.id);

    await fetchData();
    alert('全データを削除しました。まっさらな状態です。');
    processing = false;
  };
</script>

<div class="space-y-8 pb-10">
  <h2 class="text-2xl font-bold text-gray-800">設定</h2>

  <section class="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
    <h3 class="mb-4 text-lg font-bold flex items-center gap-2">📂 カテゴリー設定</h3>
    <div class="mb-6 flex gap-2">
      <select bind:value={newCategoryType} class="rounded border-gray-300 py-2 text-sm">
        <option value="expense">支出</option>
        <option value="income">収入</option>
      </select>
      <input type="text" bind:value={newCategoryName} placeholder="費目名（20文字以内）" class="flex-1 rounded border-gray-300 py-2 text-sm" />
      <button on:click={addCategory} disabled={!newCategoryName || submitting} class="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{submitting ? '追加中...' : '追加'}</button>
    </div>
    {#if loading}
      <p class="text-gray-400">Loading...</p>
    {:else if categories.length === 0}
      <p class="text-gray-400 text-sm">データなし</p>
    {:else}
      <ul class="divide-y divide-gray-100">
        {#each categories as cat}
          <li class="flex items-center justify-between py-3">
            <div class="flex items-center gap-3">
              <span class={`text-xs px-2 py-0.5 rounded-full font-bold ${cat.type === 'income' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                {cat.type === 'income' ? '収入' : '支出'}
              </span>
              <span class="text-gray-700">{cat.name}</span>
            </div>
            <button 
              on:click={() => deleteCategory(cat.id)} 
              class="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="削除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
    <h3 class="mb-4 text-lg font-bold flex items-center gap-2">🏦 口座・資産設定</h3>
    <div class="mb-6 flex gap-2">
      <input type="text" bind:value={newAccountName} placeholder="口座名（20文字以内）" class="flex-1 rounded border-gray-300 py-2 text-sm" />
      <button on:click={addAccount} disabled={!newAccountName || submitting} class="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{submitting ? '追加中...' : '追加'}</button>
    </div>
    {#if loading}
      <p class="text-gray-400">Loading...</p>
    {:else if accounts.length === 0}
      <p class="text-gray-400 text-sm">データなし</p>
    {:else}
      <ul class="divide-y divide-gray-100">
        {#each accounts as acc}
          <li class="flex items-center justify-between py-3">
            <span class="text-gray-700">{acc.name}</span>
            <button 
              on:click={() => deleteAccount(acc.id)} 
              class="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="削除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if dev}
    <section class="rounded-lg border-2 border-dashed border-gray-300 p-6 bg-gray-50">
      <h3 class="mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">Development Tool</h3>
      <p class="text-sm text-gray-600 mb-4">
        開発用のテストデータを操作します。<br>
        <span class="text-xs text-red-500">※ Vercel等の本番環境では表示されません。</span>
      </p>
      
      <div class="grid grid-cols-2 gap-4">
        <button
          on:click={generateDummyData}
          disabled={processing}
          class="rounded bg-gray-800 px-4 py-3 text-white hover:bg-gray-900 disabled:opacity-50"
        >
          {processing ? '処理中...' : '🧪 ダミーデータ生成 (1年分)'}
        </button>
        
        <button
          on:click={handleDeleteAll}
          disabled={processing}
          class="rounded bg-red-600 px-4 py-3 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {processing ? '処理中...' : '🗑 全データ削除'}
        </button>
      </div>
    </section>
  {/if}
</div>

