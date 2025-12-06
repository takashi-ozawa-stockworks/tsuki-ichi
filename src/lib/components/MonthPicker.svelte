<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import flatpickr from 'flatpickr';
  import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
  import { Japanese } from 'flatpickr/dist/l10n/ja.js';
  import 'flatpickr/dist/flatpickr.min.css';
  import 'flatpickr/dist/plugins/monthSelect/style.css';

  // Props
  export let year: number;
  export let month: number;
  export let maxYear: number;
  export let maxMonth: number;

  const dispatch = createEventDispatcher<{ change: { year: number; month: number } }>();

  let pickerInput: HTMLInputElement;
  let picker: flatpickr.Instance;

  $: pickerValue = `${year}-${String(month).padStart(2, '0')}`;
  $: maxDateStr = `${maxYear}-${String(maxMonth).padStart(2, '0')}`;
  $: isNextDisabled = pickerValue >= maxDateStr;

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
    picker?.open();
  };

  onMount(() => {
    picker = flatpickr(pickerInput, {
      locale: Japanese,
      plugins: [
        monthSelectPlugin({
          shorthand: true,
          dateFormat: 'Y-m',
          altFormat: 'Y年m月',
        })
      ],
      defaultDate: new Date(year, month - 1, 1),
      maxDate: new Date(maxYear, maxMonth - 1, 28),
      onChange: (selectedDates) => {
        if (selectedDates[0]) {
          year = selectedDates[0].getFullYear();
          month = selectedDates[0].getMonth() + 1;
          dispatch('change', { year, month });
        }
      }
    });
  });

  onDestroy(() => {
    picker?.destroy();
  });

  // Reactively update picker when props change externally
  $: if (picker) {
    picker.setDate(new Date(year, month - 1, 1), false);
  }
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

	<!-- flatpickr用の隠しinput（ボタン外に配置してタッチ干渉を防止） -->
	<input
		bind:this={pickerInput}
		type="text"
		readonly
		tabindex="-1"
		class="absolute -top-[9999px] -left-[9999px] w-px h-px opacity-0 pointer-events-none"
	/>

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

<style>
  :global(.flatpickr-calendar) {
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }
  :global(.flatpickr-monthSelect-month) {
    border-radius: 0.5rem;
    font-weight: 500;
  }
  :global(.flatpickr-monthSelect-month:hover) {
    background: #eef2ff !important;
  }
  :global(.flatpickr-monthSelect-month.selected) {
    background: #6366f1 !important;
    color: white !important;
  }
  :global(.flatpickr-current-month) {
    font-weight: 700;
    color: #1f2937;
  }
  :global(.flatpickr-prev-month, .flatpickr-next-month) {
    color: #6b7280;
  }
  :global(.flatpickr-prev-month:hover, .flatpickr-next-month:hover) {
    color: #6366f1;
  }
</style>
