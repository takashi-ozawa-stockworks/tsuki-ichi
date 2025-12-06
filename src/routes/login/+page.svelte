<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';
  let isSignUp = false; // ログインか登録かの切り替え

  // ログイン処理
  const handleLogin = async () => {
    try {
      loading = true;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      goto('/'); // 成功したらトップページへ
    } catch (error: any) {
      message = error.message;
    } finally {
      loading = false;
    }
  };

  // 新規登録処理
  const handleSignUp = async () => {
    try {
      loading = true;
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      message = '確認メールを送信しました。メール内のリンクをクリックしてください！';
    } catch (error: any) {
      message = error.message;
    } finally {
      loading = false;
    }
  };
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 p-4">
  <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
    <h1 class="mb-6 text-center text-2xl font-bold text-gray-800">
      {isSignUp ? 'アカウント作成' : 'ログイン'}
    </h1>

    {#if message}
      <div class="mb-4 rounded bg-blue-100 p-3 text-sm text-blue-700">
        {message}
      </div>
    {/if}

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700" for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          class="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700" for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          class="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
          placeholder="••••••••"
        />
      </div>

      <button
        on:click={isSignUp ? handleSignUp : handleLogin}
        disabled={loading}
        class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {#if loading}
          処理中...
        {:else}
          {isSignUp ? '登録する' : 'ログイン'}
        {/if}
      </button>

      <div class="text-center text-sm">
        <button
          class="text-indigo-600 hover:text-indigo-500"
          on:click={() => {
            isSignUp = !isSignUp;
            message = '';
          }}
        >
          {isSignUp
            ? 'すでにアカウントをお持ちですか？ ログイン'
            : 'アカウントをお持ちでないですか？ 新規登録'}
        </button>
      </div>
    </div>
  </div>
</div>
