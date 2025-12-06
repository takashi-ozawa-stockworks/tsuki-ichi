<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	type Category = {
		id: number | string;
		name: string;
		type: string;
	};

	let categories: Category[] = [];
	let errorMsg = '';

	onMount(async () => {
		// categoriesテーブルからデータを取得してみる
		const { data, error } = await supabase.from('categories').select('*');

		if (error) {
			errorMsg = error.message;
		} else {
			categories = data || [];
		}
	});
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold mb-4">Supabase接続テスト</h1>

	{#if errorMsg}
		<p class="text-red-500">エラーが発生しました: {errorMsg}</p>
	{:else if categories.length === 0}
		<p>データがありません（接続は成功しています！）</p>
	{:else}
		<ul>
			{#each categories as category (category.id)}
				<li>{category.name} ({category.type})</li>
			{/each}
		</ul>
	{/if}
</div>
