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
