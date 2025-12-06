<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import DataLabelsPlugin from 'chartjs-plugin-datalabels';

  // --- 変数定義 ---
  let loading = true;
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1;

  // 集計結果
  let totalAssets = 0;
  let prevTotalAssets = 0; // 前月比用（今回は簡易的に0扱いで実装）
  let totalIncome = 0;
  let totalExpense = 0;
  
  // グラフ切り替え ('expense' | 'assets')
  let activeChart = 'expense';
  let chartInstance: any = null;
  let canvasRef: HTMLCanvasElement;

  // データ保持用
  let expenseData: { label: string, value: number }[] = [];
  let assetsData: { label: string, value: number }[] = [];

  // --- データ読み込み ---
  const loadDashboardData = async () => {
    loading = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // 未ログインは layout で弾かれるのでケア不要

    // 1. 収支データの取得 (Categoriesをjoinして名前も取る)
    const { data: plData } = await supabase
      .from('monthly_category_values')
      .select('amount, category:categories(name, type)')
      .eq('year', year)
      .eq('month', month)
      .eq('user_id', user.id);

    // 2. 資産データの取得 (Accountsをjoin)
    const { data: bsData } = await supabase
      .from('monthly_account_balances')
      .select('balance, account:accounts(name, type)')
      .eq('year', year)
      .eq('month', month)
      .eq('user_id', user.id);

    // --- 集計処理 ---
    totalIncome = 0;
    totalExpense = 0;
    expenseData = [];

    // PL集計
    plData?.forEach((item: any) => {
      const amount = item.amount;
      const type = item.category.type;
      const name = item.category.name;

      if (type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        if (amount > 0) expenseData.push({ label: name, value: amount });
      }
    });

    // BS集計
    totalAssets = 0;
    assetsData = [];
    bsData?.forEach((item: any) => {
      const balance = item.balance;
      const name = item.account.name;
      
      totalAssets += balance;
      if (balance > 0) assetsData.push({ label: name, value: balance });
    });

    loading = false;
    // データ読み込み後にグラフを描画
    setTimeout(renderChart, 0);
  };

  // 年月変更で再読み込み
  $: year, month, loadDashboardData();
  // タブ切り替えでグラフ再描画
  $: activeChart, renderChart();

  // --- グラフ描画ロジック (Chart.js) ---
  const renderChart = () => {
    if (!canvasRef) return;
    if (chartInstance) chartInstance.destroy(); // 前のグラフを消す

    const targetData = activeChart === 'expense' ? expenseData : assetsData;
    const bgColors = [
      '#6366f1', // Indigo-500
      '#ec4899', // Pink-500
      '#8b5cf6', // Violet-500
      '#14b8a6', // Teal-500
      '#f59e0b', // Amber-500
      '#3b82f6', // Blue-500
      '#10b981', // Emerald-500
      '#ef4444', // Red-500
      '#84cc16', // Lime-500
      '#06b6d4', // Cyan-500
      '#d946ef', // Fuchsia-500
      '#f97316', // Orange-500
      '#0ea5e9', // Sky-500
      '#eab308', // Yellow-500
      '#a855f7', // Purple-500
      '#f43f5e', // Rose-500
      '#64748b', // Slate-500
      '#854d0e', // Yellow-800 (Bronze)
      '#1e40af', // Blue-800 (Dark Blue)
      '#15803d', // Green-700 (Dark Green)
    ];

    if (targetData.length === 0) return; // データがない時は描画しない

    chartInstance = new Chart(canvasRef, {
      type: 'doughnut',
      plugins: [DataLabelsPlugin],
      data: {
        labels: targetData.map(d => d.label),
        datasets: [{
          data: targetData.map(d => d.value),
          backgroundColor: bgColors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value, ctx) => {
              // 合計値を計算して % を出すロジック
              let sum = 0;
              let dataArr: any = ctx.chart.data.datasets[0].data;
              dataArr.map((data: number) => {
                sum += data;
              });
              let percentage = (value * 100 / sum).toFixed(0) + "%";
              return percentage;
            }
          }
        }
      }
    });
  };

  onMount(loadDashboardData);
</script>

<div class="space-y-6 pb-24">
  
  <div class="flex items-center justify-between">
    <button class="text-gray-400 hover:text-gray-600 px-2" on:click={() => { month--; if(month<1){month=12; year--} }}>
      &lt; 前月
    </button>
    <h2 class="text-xl font-bold text-gray-800">{year}年 {month}月</h2>
    <button class="text-gray-400 hover:text-gray-600 px-2" on:click={() => { month++; if(month>12){month=1; year++} }}>
      翌月 &gt;
    </button>
  </div>

  <div class="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg">
    <p class="text-sm opacity-80">総資産 (Total Assets)</p>
    <div class="mt-2 flex items-baseline gap-2">
      <span class="text-4xl font-bold">¥ {totalAssets.toLocaleString()}</span>
    </div>
    <div class="mt-4 text-xs opacity-70 text-right">
      ※ 月末時点の資産合計
    </div>
  </div>

  <div class="grid grid-cols-3 gap-3">
    <div class="rounded-lg bg-white p-3 shadow-sm border border-gray-100 text-center">
      <p class="text-xs text-gray-500 mb-1">収入</p>
      <p class="text-sm font-bold text-blue-600">+{totalIncome.toLocaleString()}</p>
    </div>
    <div class="rounded-lg bg-white p-3 shadow-sm border border-gray-100 text-center">
      <p class="text-xs text-gray-500 mb-1">支出</p>
      <p class="text-sm font-bold text-red-500">-{totalExpense.toLocaleString()}</p>
    </div>
    <div class="rounded-lg bg-white p-3 shadow-sm border border-gray-100 text-center">
      <p class="text-xs text-gray-500 mb-1">収支差額</p>
      <p class={`text-sm font-bold ${totalIncome - totalExpense >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
        {(totalIncome - totalExpense).toLocaleString()}
      </p>
    </div>
  </div>

  <div class="rounded-lg bg-white p-4 shadow-sm border border-gray-200 min-h-[300px]">
    <div class="flex border-b border-gray-100 mb-4">
      <button
        class={`flex-1 pb-2 text-sm font-medium ${activeChart === 'expense' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
        on:click={() => activeChart = 'expense'}
      >
        支出の内訳
      </button>
      <button
        class={`flex-1 pb-2 text-sm font-medium ${activeChart === 'assets' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
        on:click={() => activeChart = 'assets'}
      >
        資産ポートフォリオ
      </button>
    </div>

    <div class="h-64 relative">
      {#if (activeChart === 'expense' && expenseData.length === 0) || (activeChart === 'assets' && assetsData.length === 0)}
        <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm">
          <p>データがありません</p>
          <p class="text-xs mt-1">下のボタンから入力してください</p>
        </div>
      {:else}
        <canvas bind:this={canvasRef}></canvas>
      {/if}
    </div>
  </div>

</div>
