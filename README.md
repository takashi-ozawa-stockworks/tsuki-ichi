# Tsuki-Ichi (ツキイチ)

**「毎日のレシート入力」から解放される、個人開発の家計簿アプリ。**

Tsuki-Ichiは、日々の細かい支出履歴（Flow）を追うことをやめ、「月単位の収支」と「資産残高（Stock）」の定点観測に特化した、ミニマルな資産管理ツールです。

## 💡 コンセプト

* **毎日の入力からの解放 (No More Daily Inputs)**
    * コンビニで買ったジュースや日々の買い物を記録する必要はありません。
* **月イチの一括入力 (Monthly Batch)**
    * 月に一度、クレジットカードの明細や銀行残高を見て、まとめて「今月の合計」を入力するだけです。
* **収支(PL)と資産(BS)の分離**
    * 「いくら使ったか（収支）」と「いくら持っているか（資産）」を独立して管理します。使途不明金があっても気にしません。
* **モバイルファースト**
    * スマホのブラウザからサクサク入力・閲覧できるUI設計です。

## 🛠 技術スタック

コストをかけず、モダンな開発体験を重視した構成です。

* **Frontend:** SvelteKit (TypeScript)
* **Database:** Supabase (PostgreSQL)
* **Styling:** Tailwind CSS
* **Deployment:** Vercel (Hobbyプラン)

## 📱 機能一覧

### 1. ダッシュボード
アプリを開いてすぐに「今の自分のお金」を可視化します。
* **総資産サマリー:** 全口座の合計金額と、先月からの増減を表示。
* **月次収支:** 今月の「収入 - 支出」の結果（黒字/赤字）を表示。
* **グラフ分析:**
    * **支出円グラフ:** 今月何にお金を使ったかの割合。
    * **資産円グラフ:** 現金・銀行・投資信託などの資産ポートフォリオ。

### 2. 一括入力機能
Excelのようなリスト形式で、数値を直接入力・編集します。履歴データは作成しません。
* **収支入力 (PL):** カテゴリーごとの月間合計額を入力（例: 食費 30,000円）。
* **資産入力 (BS):** 月末時点の口座残高を直接入力（例: A銀行 1,200,000円）。

### 3. 設定 (マスタ管理)
* **カテゴリー編集:** 「食費」「給与」などの費目追加・編集。
* **口座編集:** 「三井住友銀行」「PayPay」「財布」などの口座追加・編集。

## 🗄 データベース設計

このアプリは、一般的な家計簿アプリのような「取引履歴（Transactions）」テーブルを持ちません。
代わりに「月ごとのスナップショット」を保存します。

### マスタテーブル
* `categories`: 費目マスタ (Type: 収入 / 支出)
* `accounts`: 口座マスタ (Type: 現金 / 銀行 / 証券 など)

### 実績テーブル (月次スナップショット)
* `monthly_category_values`: **PL (損益)**
    * ある月(Year/Month)の、あるカテゴリー(Category)の合計金額。
* `monthly_account_balances`: **BS (資産)**
    * ある月(Year/Month)の、ある口座(Account)の月末残高。

## 🚀 開発の始め方

### 前提条件
* Node.js がインストールされていること
* Supabase のアカウントがあり、プロジェクトを作成済みであること

### セットアップ手順

1.  **リポジトリのクローン**
    ```bash
    git clone [https://github.com/your-username/tsuki-ichi.git](https://github.com/your-username/tsuki-ichi.git)
    cd tsuki-ichi
    ```

2.  **依存関係のインストール**
    ```bash
    npm install
    ```

3.  **環境変数の設定**
    ルートディレクトリに `.env` ファイルを作成し、Supabaseのキーを設定してください。
    ```env
    PUBLIC_SUPABASE_URL=your_supabase_project_url
    PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **ローカルサーバーの起動**
    ```bash
    npm run dev
    ```

## License

This project is for personal use.
