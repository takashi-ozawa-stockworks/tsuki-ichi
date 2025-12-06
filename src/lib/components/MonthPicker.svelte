<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let year: number;
	export let month: number;
	export let maxYear: number;
	export let maxMonth: number;

	const dispatch = createEventDispatcher<{ change: { year: number; month: number } }>();

	// モーダル開閉状態
	let isOpen = false;
	let pickerYear = year;

	$: pickerValue = `${year}-${String(month).padStart(2, '0')}`;
	$: maxDateStr = `${maxYear}-${String(maxMonth).padStart(2, '0')}`;
	$: isNextDisabled = pickerValue >= maxDateStr;

	const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

	const prevMonth = () => {
		if (month === 1) {
			year--;
			month = 12;
		} else {
			month--;
		}
		dispatch('change', { year, month });
	};

	const nextMonth = () => {
		if (isNextDisabled) return;
		if (month === 12) {
			year++;
			month = 1;
		} else {
			month++;
		}
		dispatch('change', { year, month });
	};

	const openPicker = () => {
		pickerYear = year;
		isOpen = true;
	};

	const closePicker = () => {
		isOpen = false;
	};

	const selectMonth = (selectedMonth: number) => {
		year = pickerYear;
		month = selectedMonth;
		dispatch('change', { year, month });
		closePicker();
	};

	const isMonthDisabled = (m: number): boolean => {
		if (pickerYear > maxYear) return true;
		if (pickerYear === maxYear && m > maxMonth) return true;
		return false;
	};

	const prevYear = () => {
		pickerYear--;
	};

	const nextYear = () => {
		if (pickerYear < maxYear) {
			pickerYear++;
		}
	};

	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			closePicker();
		}
	};
</script>

<div class="flex items-center justify-between">
	<button
		class="text-gray-400 hover:text-gray-600 px-2 rounded-full hover:bg-gray-100 h-10 w-10 flex items-center justify-center transition-colors"
		on:click={prevMonth}
		type="button"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			class="w-5 h-5"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
		</svg>
	</button>

	<button
		class="relative group flex-1 text-center focus:outline-none"
		on:click={openPicker}
		type="button"
	>
		<div
			class="inline-flex items-center gap-2 px-4 py-2 rounded-lg group-hover:bg-gray-100 transition-colors cursor-pointer"
		>
			<h2 class="text-xl font-bold text-gray-800 tracking-tight select-none">
				{year}年 {month}月
			</h2>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-5 h-5 text-gray-400"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
			</svg>
		</div>
	</button>

	<button
		class="text-gray-400 hover:text-gray-600 px-2 rounded-full hover:bg-gray-100 h-10 w-10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
		on:click={nextMonth}
		disabled={isNextDisabled}
		type="button"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			class="w-5 h-5"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
		</svg>
	</button>
</div>

<!-- 月選択モーダル -->
{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[100] h-[100dvh] w-screen flex items-center justify-center bg-black/30 backdrop-blur-sm touch-none"
		on:click={handleBackdropClick}
	>
		<div class="bg-white rounded-xl shadow-2xl p-4 w-72 mx-4">
			<!-- 年選択ヘッダー -->
			<div class="flex items-center justify-between mb-4">
				<button
					class="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
					on:click={prevYear}
					type="button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-5 h-5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
					</svg>
				</button>
				<span class="text-lg font-bold text-gray-800">{pickerYear}年</span>
				<button
					class="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
					on:click={nextYear}
					disabled={pickerYear >= maxYear}
					type="button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-5 h-5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</button>
			</div>

			<!-- 月グリッド -->
			<div class="grid grid-cols-3 gap-2">
				{#each monthNames as name, i}
					{@const m = i + 1}
					{@const disabled = isMonthDisabled(m)}
					{@const selected = pickerYear === year && m === month}
					<button
						class="py-2 px-3 rounded-lg text-sm font-medium transition-all
							{selected ? 'bg-indigo-600 text-white shadow-md' : ''}
							{disabled
							? 'text-gray-300 cursor-not-allowed'
							: selected
								? ''
								: 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}"
						on:click={() => !disabled && selectMonth(m)}
						{disabled}
						type="button"
					>
						{name}
					</button>
				{/each}
			</div>

			<!-- 閉じるボタン -->
			<button
				class="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
				on:click={closePicker}
				type="button"
			>
				閉じる
			</button>
		</div>
	</div>
{/if}
