<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import DataLabelsPlugin from 'chartjs-plugin-datalabels';
  import MonthPicker from '$lib/components/MonthPicker.svelte';

  // --- 変数定義 ---
  let loading = true;
  const today = new Date();
  
  // 現在の年月（未来制限用）
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // 選択中の年月
  let year = currentYear;
  let month = currentMonth;

  // MonthPicker change handler
  const handleMonthChange = (e: CustomEvent<{ year: number; month: number }>) => {
    year = e.detail.year;
    month = e.detail.month;
  };

  // 集計結果
  let totalAssets = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  
  // 分析用
  let avgExpense = 0;
  let trendStatus = 'nodata'; // 'up' | 'down' | 'same' | 'nodata'
  let diffAmount = 0;
  let prevTotalAssets = 0;
  let assetDiff = 0;
  let assetGrowthRate = 0;
  let nextMilestone = 0;
  let toMilestone = 0;
  
  // 変動要因分析用
  let topMoverName = '';
  let topMoverDiff = 0;
  let topMoverType = ''; // 'increase' | 'decrease'
  
  // グラフ用
  let activeChart = 'expense';
  let chartInstance: any = null;
  let canvasRef: HTMLCanvasElement;
  let expenseData: { label: string, value: number }[] = [];
  let assetsData: { label: string, value: number }[] = [];

  const loadDashboardData = async () => {
    loading = true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. 今月のPL
    const { data: plData } = await supabase
      .from('monthly_category_values')
      .select('amount, category_id, category:categories(name, type)')
      .eq('year', year).eq('month', month).eq('user_id', user.id);

    // 2. 今月のBS
    const { data: bsData } = await supabase
      .from('monthly_account_balances')
      .select('balance, account:accounts(name, type)')
      .eq('year', year).eq('month', month).eq('user_id', user.id);

    // 3. 過去トレンド用
    const { data: historyData } = await supabase
      .from('monthly_category_values')
      .select('year, month, amount, category:categories(type)')
      .eq('user_id', user.id);

    // 4. 先月のデータ（BS比較 & PL変動分析用）
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;

    const { data: prevBsData } = await supabase
      .from('monthly_account_balances')
      .select('balance')
      .eq('year', prevYear).eq('month', prevMonth).eq('user_id', user.id);

    const { data: prevPlData } = await supabase
      .from('monthly_category_values')
      .select('amount, category_id, category:categories(name, type)')
      .eq('year', prevYear).eq('month', prevMonth).eq('user_id', user.id);

    // --- 集計 ---
    totalIncome = 0;
    totalExpense = 0;
    expenseData = [];
    plData?.forEach((item: any) => {
      if (item.category.type === 'income') totalIncome += item.amount;
      else {
        totalExpense += item.amount;
        if (item.amount > 0) expenseData.push({ label: item.category.name, value: item.amount });
      }
    });
    expenseData.sort((a, b) => b.value - a.value);

    totalAssets = 0;
    assetsData = [];
    bsData?.forEach((item: any) => {
      totalAssets += item.balance;
      if (item.balance > 0) assetsData.push({ label: item.account.name, value: item.balance });
    });
    assetsData.sort((a, b) => b.value - a.value);

    // --- 分析ロジック ---

    // A. 支出トレンド & 変動要因
    topMoverName = ''; // リセット
    
    if (historyData) {
      const monthlyTotals: Record<string, number> = {};
      historyData.forEach((item: any) => {
        if (item.category.type === 'expense' && !(item.year === year && item.month === month)) {
          const key = `${item.year}-${item.month}`;
          monthlyTotals[key] = (monthlyTotals[key] || 0) + item.amount;
        }
      });
      const totalsArray = Object.values(monthlyTotals);
      
      // 平均計算
      if (totalsArray.length > 0) {
        const sumHistory = totalsArray.reduce((a, b) => a + b, 0);
        avgExpense = Math.round(sumHistory / totalsArray.length);
        diffAmount = totalExpense - avgExpense;
        if (totalExpense > avgExpense * 1.05) trendStatus = 'up';
        else if (totalExpense < avgExpense * 0.95) trendStatus = 'down';
        else trendStatus = 'same';
      } else {
        trendStatus = 'nodata';
      }

      // 変動要因分析 (今月 vs 先月)
      if (prevPlData) {
        let maxIncrease = -1;
        let maxDecrease = 1;
        let maxIncName = '';
        let maxDecName = '';

        const prevMap: Record<number, number> = {};
        prevPlData.forEach((item: any) => {
          if (item.category.type === 'expense') prevMap[item.category_id] = item.amount;
        });

        plData?.forEach((item: any) => {
          if (item.category.type === 'expense') {
            const prevAmount = prevMap[item.category_id] || 0;
            const diff = item.amount - prevAmount;
            if (diff > maxIncrease) { maxIncrease = diff; maxIncName = item.category.name; }
            if (diff < maxDecrease) { maxDecrease = diff; maxDecName = item.category.name; }
          }
        });

        // 全体傾向に合わせて表示する要因を決める
        // 使いすぎ傾向なら「増加要因」、節約傾向なら「減少要因」を優先
        if (totalExpense >= (avgExpense || totalExpense)) {
           if (maxIncrease > 0) { topMoverName = maxIncName; topMoverDiff = maxIncrease; topMoverType = 'increase'; }
        } else {
           if (maxDecrease < 0) { topMoverName = maxDecName; topMoverDiff = maxDecrease; topMoverType = 'decrease'; }
        }
        // フォールバック: どちらかしか無い場合
        if (!topMoverName && maxIncrease > 0) { topMoverName = maxIncName; topMoverDiff = maxIncrease; topMoverType = 'increase'; }
      }
    }

    // B. 資産分析
    prevTotalAssets = 0;
    prevBsData?.forEach((item: any) => prevTotalAssets += item.balance);
    if (prevTotalAssets > 0) {
      assetDiff = totalAssets - prevTotalAssets;
      assetGrowthRate = parseFloat(((assetDiff / prevTotalAssets) * 100).toFixed(1));
    } else {
      assetDiff = 0;
      assetGrowthRate = 0;
    }

    const unit = 1000000;
    nextMilestone = Math.ceil((totalAssets + 1) / unit) * unit;
    toMilestone = nextMilestone - totalAssets;

    loading = false;
    setTimeout(renderChart, 0);
  };

  $: year, month, loadDashboardData();
  $: activeChart, renderChart();

  const renderChart = () => {
    if (!canvasRef) return;
    if (chartInstance) chartInstance.destroy();

    const targetData = activeChart === 'expense' ? expenseData : assetsData;
    const baseColors = [
      '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#84cc16', '#06b6d4',
      '#d946ef', '#f97316', '#0ea5e9', '#eab308', '#a855f7', '#f43f5e', '#64748b', '#854d0e', '#1e40af', '#15803d',
    ];
    if (targetData.length === 0) return;
    const bgColors = targetData.map((_, index) => baseColors[index % baseColors.length]);

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
          // 凡例を下に配置、スタイル調整
          legend: { 
            position: 'bottom', 
            align: 'start', 
            labels: { boxWidth: 12, font: { size: 11 }, padding: 15 } 
          },
          datalabels: {
            color: '#fff',
            font: { weight: 'bold', size: 12 },
            formatter: (value, ctx) => {
              let sum = 0;
              let dataArr: any = ctx.chart.data.datasets[0].data;
              dataArr.map((data: number) => { sum += data; });
              return (value * 100 / sum).toFixed(0) + "%";
            }
          }
        }
      }
    });
  };

  onMount(loadDashboardData);
</script>

<div class="space-y-6 pb-24">
	<MonthPicker
		bind:year
		bind:month
		maxYear={currentYear}
		maxMonth={currentMonth}
		on:change={handleMonthChange}
	/>

	<div class="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg">
		<p class="text-sm opacity-80">総資産 (Total Assets)</p>
		<div class="mt-2 flex items-baseline gap-2">
			<span class="text-4xl font-bold">¥ {totalAssets.toLocaleString()}</span>
		</div>
		<div class="mt-4 text-xs opacity-70 text-right">※ 月末時点の資産合計</div>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		{#if trendStatus !== 'nodata' && totalExpense > 0}
			<div class="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
				<p class="text-xs text-gray-500 mb-2">支出トレンド (vs 平均)</p>
				<div class="flex items-center justify-between">
					<div>
						{#if trendStatus === 'up'}
							<div class="flex items-baseline gap-1">
								<span class="text-lg font-bold text-red-500">⚠ 使いすぎ</span>
								<span class="text-xs text-red-400 font-bold">+{diffAmount.toLocaleString()}</span>
							</div>
						{:else if trendStatus === 'down'}
							<div class="flex items-baseline gap-1">
								<span class="text-lg font-bold text-green-600">✨ 節約中</span>
								<span class="text-xs text-green-500 font-bold">{diffAmount.toLocaleString()}</span>
							</div>
						{:else}
							<span class="text-lg font-bold text-gray-600">ー 平均的</span>
						{/if}
					</div>
					<div class="text-right">
						<span class="text-xs text-gray-400 block">平均支出</span>
						<span class="text-sm text-gray-600">¥ {avgExpense.toLocaleString()}</span>
					</div>
				</div>

				{#if topMoverName}
					<div class="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
						<span class="text-gray-500">
							{topMoverType === 'increase' ? '主な増加要因' : '主な節約要因'}:
						</span>
						<div class="flex items-center gap-1 font-bold">
							<span>{topMoverName}</span>
							<span class={topMoverType === 'increase' ? 'text-red-500' : 'text-green-600'}>
								({topMoverDiff > 0 ? '+' : ''}{topMoverDiff.toLocaleString()})
							</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if prevTotalAssets > 0}
			<div class="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
				<p class="text-xs text-gray-500 mb-2">資産成長 (vs 先月)</p>
				<div class="flex items-center justify-between mb-3">
					<div>
						{#if assetDiff >= 0}
							<div class="flex items-baseline gap-1">
								<span class="text-lg font-bold text-blue-600">↗ 増えた</span>
								<span class="text-xs text-blue-500 font-bold">+{assetDiff.toLocaleString()}</span>
							</div>
						{:else}
							<div class="flex items-baseline gap-1">
								<span class="text-lg font-bold text-red-500">↘ 減った</span>
								<span class="text-xs text-red-400 font-bold">{assetDiff.toLocaleString()}</span>
							</div>
						{/if}
					</div>
					<div class="text-right">
						<span class="text-xs text-gray-400 block">成長率</span>
						<span class={`text-sm font-bold ${assetDiff >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
							{assetDiff > 0 ? '+' : ''}{assetGrowthRate}%
						</span>
					</div>
				</div>
				<div class="mt-2 pt-2 border-t border-gray-100">
					<div class="flex justify-between text-xs mb-1">
						<span class="text-gray-500">次の {nextMilestone / 10000}万 まで</span>
						<span class="font-bold text-indigo-600">あと {toMilestone.toLocaleString()} 円</span>
					</div>
					<div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
						<div
							class="h-full bg-indigo-500 rounded-full transition-all duration-500"
							style={`width: ${(1 - toMilestone / 1000000) * 100}%`}
						></div>
					</div>
				</div>
			</div>
		{/if}
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
			<p
				class={`text-sm font-bold ${totalIncome - totalExpense >= 0 ? 'text-gray-800' : 'text-red-600'}`}
			>
				{(totalIncome - totalExpense).toLocaleString()}
			</p>
		</div>
	</div>

	<div class="rounded-lg bg-white p-4 shadow-sm border border-gray-200 min-h-[300px]">
		<div class="flex border-b border-gray-100 mb-4">
			<button
				class={`flex-1 pb-2 text-sm font-medium ${activeChart === 'expense' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
				on:click={() => (activeChart = 'expense')}
			>
				支出の内訳
			</button>
			<button
				class={`flex-1 pb-2 text-sm font-medium ${activeChart === 'assets' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
				on:click={() => (activeChart = 'assets')}
			>
				資産ポートフォリオ
			</button>
		</div>

		<div class="h-96 relative">
			{#if (activeChart === 'expense' && expenseData.length === 0) || (activeChart === 'assets' && assetsData.length === 0)}
				<div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
					<div class="mb-4 text-gray-300">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-12 h-12 mx-auto"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
							/>
						</svg>
					</div>
					<p class="text-gray-500 font-bold mb-1">データがありません</p>
					<p class="text-xs text-gray-400 mb-4">まだこの月の記録がありません。</p>

					<a
						href="/input?year={year}&month={month}"
						class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-6 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="w-4 h-4"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
							/>
						</svg>
						データを入力する
					</a>
				</div>
			{:else}
				<canvas bind:this={canvasRef}></canvas>
			{/if}
		</div>
	</div>
</div>
