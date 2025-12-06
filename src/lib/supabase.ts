import { createClient } from '@supabase/supabase-js';

// .envから環境変数を読み込む
// $env/static/public はSvelteKitの機能で、環境変数を安全に読み込めます
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Supabaseクライアントを作成してエクスポート
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
