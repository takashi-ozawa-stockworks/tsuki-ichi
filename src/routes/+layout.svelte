<script lang="ts">
  import '../app.css'; // Tailwind CSSを読み込む
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let session: any = null;
  let loading = true;

  onMount(async () => {
    // 1. 現在のセッション（ログイン状態）を取得
    const { data } = await supabase.auth.getSession();
    session = data.session;

    // 2. ログイン状態の変化を監視する（ログアウト時など）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      session = _session;
      
      // ログインしておらず、かつ現在「ログイン画面」にいないなら、ログイン画面へ飛ばす
      if (!session && $page.url.pathname !== '/login') {
        goto('/login');
      }
    });

    // 初回チェック: ログインしていないならログイン画面へ
    if (!session && $page.url.pathname !== '/login') {
      goto('/login');
    }

    loading = false;

    return () => subscription.unsubscribe();
  });

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    goto('/login'); // ログアウトしたらログイン画面へ
  };
</script>

<div class="min-h-screen bg-gray-50 text-gray-900">
  
  {#if session && $page.url.pathname !== '/login'}
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <h1 class="text-xl font-bold tracking-tight text-indigo-600">
          <a href="/">Tsuki-Ichi</a>
        </h1>

        <div class="flex items-center gap-1 sm:gap-2">
          
          <a
            href="/input"
            class="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
            title="入力画面へ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </a>

          <a
            href="/settings"
            class="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
            title="設定"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </a>
          
          <div class="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>

          <span class="text-xs text-gray-500 hidden sm:inline mr-2">{session.user.email}</span>
          <button 
            on:click={handleLogout}
            class="text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-300 rounded px-2 py-1"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  {/if}

  <main class="mx-auto max-w-4xl p-4">
    {#if loading}
      <div class="flex h-64 items-center justify-center text-gray-400">
        Loading...
      </div>
    {:else}
      <slot />
    {/if}
  </main>

</div>
