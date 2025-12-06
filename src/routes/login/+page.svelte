<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';
  let isError = false;
  let isSignUp = false;
  
  // パスワード表示切り替え用フラグ
  let showPassword = false;

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

  // デモログイン処理
  const handleDemoLogin = async () => {
    loading = true;
    message = '';
    isError = false;

    try {
      // 事前に作成したデモ用アカウントの情報をハードコード
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@stockworks.dev',
        password: 'demopassword',
      });
      if (error) throw error;
      goto('/');
    } catch (error: any) {
      isError = true;
      message = 'デモログインに失敗しました: ' + error.message;
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
        <div class="relative mt-1">
          <input
            type={showPassword ? 'text' : 'password'} 
            id="password"
            bind:value={password}
            class="block w-full rounded-lg border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="••••••••"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            on:click={() => showPassword = !showPassword}
            tabindex="-1"
          >
            {#if showPassword}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            {/if}
          </button>
        </div>
      </div>

      <button
        on:click={isSignUp ? handleSignUp : handleLogin}
        disabled={loading}
        class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 mt-5 font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
            showPassword = false; // モード切替時にパスワード表示もリセット
          }}
        >
          {isSignUp
            ? 'すでにアカウントをお持ちですか？ ログイン'
            : 'アカウントをお持ちでないですか？ 新規登録'}
        </button>
      </div>

      <div class="relative flex py-1 items-center">
        <div class="flex-grow border-t border-gray-200"></div>
        <span class="flex-shrink-0 mx-2 text-gray-400 text-xs">または</span>
        <div class="flex-grow border-t border-gray-200"></div>
      </div>

      <button
        on:click={handleDemoLogin}
        disabled={loading}
        class="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-bold text-white shadow hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        ゲストとして試す
      </button>
    </div>
  </div>
  
  <div class="mt-8 text-xs text-gray-400">
    &copy; 2025 Tsuki-Ichi Personal App
  </div>
</div>