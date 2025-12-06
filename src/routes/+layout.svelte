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

        <div class="flex items-center gap-4">
          <a href="/settings" class="text-sm font-medium text-gray-600 hover:text-indigo-600">
            ⚙️ 設定
          </a>
          <span class="text-xs text-gray-500 hidden sm:inline">{session.user.email}</span>
          <button 
            on:click={handleLogout}
            class="text-sm font-medium text-gray-600 hover:text-red-500"
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
