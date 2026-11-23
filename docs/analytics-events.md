# GA4 イベント定義

測定ID `G-L3X8XHP35G`。2026-11-23追加。

| イベント | 発火条件 | パラメータ |
|---|---|---|
| experience_start | 展示が実際に開始。MUSEUMは時計・ステージの準備後、BREATHは誘導開始後、FREQUENCYは実行中の音声時計が再生開始時刻へ到達、SENSORYは新しい60秒体験の開始 | experience_type, content_id |
| experience_complete | MUSEUMは結果表示後（記憶展示は回答後）、BREATH/FREQUENCYは設定時間を完了、SENSORYは60秒完了。中断・一時停止・別展示への移動を除外 | experience_type, content_id |
| share | 端末の共有APIが正常終了、または公開URLのコピー成功 | method=native/copy_link, content_type=exhibition, item_id |

experience_type は museum / breath / frequency / sensory。content_id は公開展示IDのみ。呼吸法の選択、BPM、周波数設定、入力値、時間知覚の結果、正答・記憶内容、個別の測定値は送らない。BREATHは全方法を breath へまとめる。繰り返し再生は1セッションで最初の完了を1回だけ送る。SENSORYの一時停止・再開は同じセッションとして数える。

共有の取消・失敗・手動コピー案内は成功に含めない。native はAPIの正常終了であり、相手の受領を保証しない。新しいイベントにはURLクエリ・フラグメント・リファラーを含めない。既存のGoogleタグ・config・page_viewは増やさず、送信先をこの測定IDに固定してga-disable設定を尊重する。追加イベントは本番の4展示URLだけで有効とし、localhost・プレビュー・その他のパスからは送らない。

サイト側実装とGA4管理画面の登録・受信確認は別工程。イベントは送信によって収集される。展示ごとの分析用カスタムディメンション候補は experience_type、content_id。キーイベントの指定は別途行う。
