<script lang="ts">
  // ここにダッシュボードのロジックを後で書きます
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <button class="text-gray-400 hover:text-gray-600">
      &lt; 前月
    </button>
    <h2 class="text-xl font-bold">2024年 5月</h2>
    <button class="text-gray-400 hover:text-gray-600">
      翌月 &gt;
    </button>
  </div>

  <div class="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
    <p class="text-sm opacity-80">総資産</p>
    <div class="mt-1 flex items-baseline gap-2">
      <span class="text-3xl font-bold">¥ ---,---</span>
      <span class="text-sm font-medium text-green-300">(前月比 +---)</span>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
      <p class="text-xs text-gray-500">今月の収入</p>
      <p class="text-lg font-bold text-gray-800">¥ ---</p>
    </div>
    <div class="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
      <p class="text-xs text-gray-500">今月の支出</p>
      <p class="text-lg font-bold text-red-500">¥ ---</p>
    </div>
  </div>

  <div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
    <p class="text-gray-500">ここに円グラフが表示されます</p>
    <p class="mt-2 text-sm text-gray-400">
      まずは設定画面でカテゴリーと口座を作りましょう
    </p>
  </div>
  
</div>
