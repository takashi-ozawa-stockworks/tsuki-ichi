import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// 管理者権限を持つSupabaseクライアントを作成
const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export const DELETE = async ({ request }) => {
  // 1. リクエストしてきた人が「ログイン中の本人か」確認する
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'No authorization header' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  // 管理者クライアントを使って、トークンの持ち主（ユーザー）を特定
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return json({ error: 'Invalid token' }, { status: 401 });
  }

  // 2. 本人確認ができたら、管理者権限でユーザーを削除 (Authテーブルから消す)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id
  );

  if (deleteError) {
    return json({ error: deleteError.message }, { status: 500 });
  }

  return json({ success: true });
};