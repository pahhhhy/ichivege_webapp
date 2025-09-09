# ichivege_webapp

<details>
<summary>画面遷移図</summary>

```mermaid
stateDiagram-v2
    direction LR
    
    [*] --> 商品一覧
    
    state "未ログイン" as Unauthenticated {
        商品一覧: 商品一覧 (/)
        商品詳細: 商品詳細 (/product/:id)
        ログイン: ログイン (/login)
        新規登録: 新規登録 (/signup)
        お知らせ: お知らせ (/board)

        商品一覧 --> 商品詳細
        商品一覧 --> ログイン
        商品一覧 --> 新規登録
        商品一覧 --> お知らせ
        商品詳細 --> ログイン : カート追加時
        ログイン --> 新規登録
        新規登録 --> ログイン : 登録後
    }

    state "認証済み" as Authenticated {
        direction LR
        
        state "一般/飲食店ユーザー" as GeneralUser {
            A_商品一覧: 商品一覧 (/)
            A_商品詳細: 商品詳細 (/product/:id)
            カート: カート (/cart)
            注文確認: 注文確認 (/checkout)
            注文完了: 注文完了 (/order-complete)
            マイページ: マイページ (/profile)
            注文履歴: 注文履歴 (/orders)
            チャット: チャット (/chat)
            A_お知らせ: お知らせ (/board)

            A_商品一覧 --> A_商品詳細
            A_商品詳細 --> カート : カート追加
            A_商品一覧 --> カート : ヘッダーから
            カート --> 注文確認
            注文確認 --> 注文完了 : 注文確定
            注文完了 --> A_商品一覧
            注文完了 --> 注文履歴
            
            state "ヘッダー/ナビゲーションから" as Nav {
                [*] -> A_商品一覧
                [*] -> マイページ
                [*] -> 注文履歴
                [*] -> チャット
                [*] -> A_お知らせ
            }
        }
        
        state "農家ユーザー" as ProducerUser {
            P_商品一覧: 商品一覧 (/)
            ダッシュボード: ダッシュボード (/dashboard)
            商品追加: 新規商品追加 (/products/new)
            P_マイページ: マイページ (/profile)

            P_マイページ --> ダッシュボード
            P_マイページ --> 商品追加
        }

        GeneralUser --> ProducerUser : ロールによる分岐
    }
    
    ログイン --> Authenticated: ログイン成功

<details>
<summary>LINE連携フロー図</summary>

```mermaid
sequenceDiagram
    participant ユーザー (ブラウザ)
    participant Next.js Frontend
    participant Next.js API
    participant LINE Platform
    participant Firebase DB

    Note over ユーザー (ブラウザ): プロフィールページ (/profile) を表示中
    
    %% 1. 連携開始
    ユーザー (ブラウザ)->>Next.js Frontend: 「LINEと連携する」ボタンをクリック
    Next.js Frontend->>LINE Platform: 認証ページへリダイレクト<br>(LINEログインチャネルID, state=FirebaseUID を付与)
    
    %% 2. LINEでの認証
    ユーザー (ブラウザ)->>LINE Platform: LINEアカウントでログイン・同意
    
    %% 3. コールバック処理
    LINE Platform-->>ユーザー (ブラウザ): /api/line/callback へリダイレクト<br>(code, state を付与)
    ユーザー (ブラウザ)->>Next.js API: GET /api/line/callback を実行
    
    Next.js API->>LINE Platform: アクセストークンを要求<br>(code, LINEログインチャネルID, チャネルシークレット)
    LINE Platform-->>Next.js API: アクセストークンを返却

    Next.js API->>LINE Platform: プロフィール情報を要求<br>(アクセストークン)
    LINE Platform-->>Next.js API: LINEユーザーIDを返却

    Next.js API->>Firebase DB: LINEユーザーIDをユーザー情報に保存 (updateDoc)
    Firebase DB-->>Next.js API: 保存成功

    Next.js API-->>ユーザー (ブラウザ): プロフィールページへリダイレクト<br>(line_connect=success を付与)

    %% 4. 画面更新
    Note over ユーザー (ブラウザ), Firebase DB: ページ読み込み時に最新の<br>ユーザー情報をDBから取得
    Next.js Frontend->>Next.js Frontend: 画面を再描画し、「連携解除」ボタンを表示

    %% 注文完了通知 (参考)
    Note right of ユーザー (ブラウザ): ---- 注文後の通知フロー ----
    ユーザー (ブラウザ)->>Next.js API: 注文処理を実行 (createOrder)
    Next.js API->>LINE Platform: プッシュメッセージを送信<br>(Messaging APIチャネルのアクセストークン使用)
    LINE Platform->>ユーザー (ブラウザ): LINEアプリに通知が届く
```
</details>
```