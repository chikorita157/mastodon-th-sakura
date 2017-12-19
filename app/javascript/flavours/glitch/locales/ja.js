import inherited from 'mastodon/locales/ja.json';

const messages = {
  'getting_started.open_source_notice': 'Glitchsocは{Mastodon}によるフリーなオープンソースソフトウェアです。誰でもGitHub（{github}）から開発に參加したり、問題を報告したりできます。',
  'layout.auto': '自動',
  'layout.current_is': 'あなたの現在のレイアウト:',
  'layout.desktop': 'Desktop',
  'layout.mobile': 'Mobile',
  'navigation_bar.app_settings': 'アプリ設定',
  'getting_started.onboarding': '解説を表示',
  'onboarding.page_one.federation': '{domain}はMastodonのインスタンスです。Mastodonとは、独立したサーバが連携して作るソーシャルネットワークです。これらのサーバーをインスタンスと呼びます。',
  'onboarding.page_one.welcome': '{domain}へようこそ！',
  'onboarding.page_six.github': '{domain}はGlitchsocを使用しています。Glitchsocは{Mastodon}のフレンドリーな{fork}で、どんなMastodonアプリやインスタンスとも互換性があります。Glitchsocは完全に無料で、オープンソースです。{github}でバグ報告や機能要望あるいは貢獻をすることが可能です。',
  'settings.auto_collapse': '自動折りたたみ',
  'settings.auto_collapse_all': 'すべて',
  'settings.auto_collapse_lengthy': '長いトゥート',
  'settings.auto_collapse_media': 'メディア付きトゥート',
  'settings.auto_collapse_notifications': '通知',
  'settings.auto_collapse_reblogs': 'ブースト',
  'settings.auto_collapse_replies': '返信',
  'settings.close': '閉じる',
  'settings.collapsed_statuses': 'トゥート',
  'settings.enable_collapsed': 'トゥート折りたたみを有効にする',
  'settings.general': '一般',
  'settings.image_backgrounds': '画像背景',
  'settings.image_backgrounds_media': '折りたまれたメディア付きトゥートをプレビュー',
  'settings.image_backgrounds_users': '折りたまれたトゥートの背景を変更する',
  'settings.media': 'メディア',
  'settings.media_letterbox': 'メディアをレターボックス式で表示',
  'settings.media_fullwidth': '全幅メディアプレビュー',
  'settings.preferences': 'ユーザー設定',
  'settings.wide_view': 'ワイドビュー(Desktopレイアウトのみ)',
  'settings.navbar_under': 'ナビを画面下部に移動させる(Mobileレイアウトのみ)',
  'settings.compose_box_opts': 'コンポーズボックス設定',
  'settings.side_arm': 'セカンダリートゥートボタン',
  'settings.layout': 'レイアウト',
  'status.collapse': '折りたたむ',
  'status.uncollapse': '折りたたみを解除',

  'favourite_modal.combo': '次からは {combo} を押せば、これをスキップできます。',

  'home.column_settings.show_direct': 'DMを表示',

  'notification.markForDeletion': '選択',
  'notifications.clear': '通知を全てクリアする',
  'notifications.marked_clear_confirmation': '削除した全ての通知を完全に削除してもよろしいですか？',
  'notifications.marked_clear': '選択した通知を削除する',

  'notification_purge.btn_all': 'すべて\n選択',
  'notification_purge.btn_none': '選択\n解除',
  'notification_purge.btn_invert': '選択を\n反転',
  'notification_purge.btn_apply': '選択したものを\n削除',

  'compose.attach.upload': 'ファイルをアップロード',
  'compose.attach.doodle': '落書きをする',
  'compose.attach': 'アタッチ...',

  'advanced-options.local-only.short': 'ローカル限定',
  'advanced-options.local-only.long': '他のインスタンスには投稿されません',
  'advanced_options.icon_title': '高度な設定',
};

export default Object.assign({}, inherited, messages);
