<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';
  let isError = false;
  let isSignUp = false;

  // ログイン処理
  const handleLogin = async () => {
    loading = true;
    message = '';
    isError = false;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      goto('/');
    } catch (error: any) {
      isError = true;
      message = error.message;
    } finally {
      loading = false;
    }
  };

  // 新規登録処理
  const handleSignUp = async () => {
    loading = true;
    message = '';
    isError = false;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      isError = false;
      message = '確認メールを送信しました。メール内のリンクをクリックしてください！';
    } catch (error: any) {
      isError = true;
      message = error.message;
    } finally {
      loading = false;
    }
  };
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
  
  <div class="mb-8 text-center">
    <h1 class="text-4xl font-extrabold tracking-tight text-indigo-600">
      Tsuki-Ichi
    </h1>
    <p class="mt-2 text-sm text-gray-500">
      月イチ管理で、資産を育てる。
    </p>
  </div>

  <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-xl ring-1 ring-gray-100">
    <h2 class="mb-6 text-center text-xl font-bold text-gray-800">
      {isSignUp ? 'アカウント作成' : 'ログイン'}
    </h2>

    {#if message}
      <div class={`mb-4 rounded p-3 text-sm ${
        isError
          ? 'bg-red-50 text-red-700 border border-red-100'
          : 'bg-blue-50 text-blue-700 border border-blue-100'
      }`}>
        {message}
      </div>
    {/if}

    <div class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700" for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          class="mt-1 block w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700" for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          class="mt-1 block w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="••••••••"
        />
      </div>

      <button
        on:click={isSignUp ? handleSignUp : handleLogin}
        disabled={loading}
        class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {#if loading}
          Processing...
        {:else}
          {isSignUp ? '登録する' : 'ログイン'}
        {/if}
      </button>

      <div class="text-center text-sm">
        <button
          class="text-indigo-600 hover:text-indigo-500 hover:underline"
          on:click={() => {
            isSignUp = !isSignUp;
            message = '';
            isError = false;
          }}
        >
          {isSignUp
            ? 'すでにアカウントをお持ちですか？ ログイン'
            : 'アカウントをお持ちでないですか？ 新規登録'}
        </button>
      </div>
    </div>
  </div>
  
  <div class="mt-8 text-xs text-gray-400">
    &copy; 2025 Tsuki-Ichi Personal App
  </div>
</div>