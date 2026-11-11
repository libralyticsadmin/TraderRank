import React, { useState, useRef } from 'react';
import { X, Check, Save, User, ShieldCheck, Camera, Upload, Instagram, Trash2, Dice5 } from 'lucide-react';
import { useAuth, UserProfile } from '../context/AuthContext.tsx';
import { Broker } from '../../../shared/src/types.ts';
import {
  TraderAvatar,
  INSTITUTIONAL_ANIMAL_PRESETS,
  getRandomTraderAvatar,
  AnimalAvatarPreset,
} from './TraderAvatar.tsx';
import { CURATED_12_AVATARS } from './avatarCatalog.ts';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';

const AVATAR_SYMBOLS: Array<{ id: string; label: Record<'en' | 'ja' | 'zh', string> }> = [
  { id: 'zap', label: { en: 'Flash (Lightning)', ja: 'フラッシュ (稲妻)', zh: '闪电 (极速)' } },
  { id: 'crown', label: { en: 'Crown (King)', ja: 'クラウン (王者)', zh: '皇冠 (王者)' } },
  { id: 'target', label: { en: 'Target (Sniper)', ja: 'ターゲット (狙撃)', zh: '准星 (狙击手)' } },
  { id: 'shield', label: { en: 'Shield (Vault)', ja: 'シールド (堅牢)', zh: '护盾 (稳健)' } },
  { id: 'gem', label: { en: 'Diamond (Gem)', ja: 'ダイヤモンド', zh: '钻石 (精锐)' } },
  { id: 'flame', label: { en: 'Flame (Alpha)', ja: 'フレイム (アルファ)', zh: '烈焰 (Alpha)' } },
  { id: 'EURUSD', label: { en: 'EUR / USD', ja: 'EUR / USD', zh: 'EUR / USD' } },
  { id: 'XAUUSD', label: { en: 'Gold (XAU)', ja: 'ゴールド (XAU)', zh: '黄金 (XAU)' } },
  { id: 'BTCUSD', label: { en: 'Bitcoin (BTC)', ja: 'ビットコイン (BTC)', zh: '比特币 (BTC)' } },
];

const ANIMAL_CREST_I18N: Record<string, { ja: { label: string; badge: string }; zh: { label: string; badge: string } }> = {
  bull: { ja: { label: 'ゴールデンブル', badge: 'マクロ' }, zh: { label: '黄金公牛', badge: '宏观突破' } },
  wolf: { ja: { label: 'ティファニーウルフ', badge: 'アルファ' }, zh: { label: '蒂芙尼苍狼', badge: '头狼领航' } },
  bear: { ja: { label: 'クリムゾンベア', badge: 'ショート' }, zh: { label: '绯红巨熊', badge: '空头猎手' } },
  lion: { ja: { label: 'インペリアルライオン', badge: '王者' }, zh: { label: '帝国雄狮', badge: '主权皇冠' } },
  viper: { ja: { label: 'エメラルドバイパー', badge: '精密' }, zh: { label: '翡翠毒蛇', badge: '高频剥头皮' } },
  falcon: { ja: { label: 'ソーラーファルコン', badge: '高速' }, zh: { label: '烈阳猎鹰', badge: '极速动量' } },
  panther: { ja: { label: 'ステルパンサー', badge: 'ステルス' }, zh: { label: '暗影黑豹', badge: '暗池执行' } },
  shark: { ja: { label: 'アビサルシャーク', badge: 'クジラ' }, zh: { label: '深渊巨鲨', badge: '巨鲸订单流' } },
  fox: { ja: { label: 'サイバー九尾', badge: 'アルゴ' }, zh: { label: '赛博九尾狐', badge: '算法套利' } },
  owl: { ja: { label: 'クオンタムアウル', badge: 'クオンツ' }, zh: { label: '量子猫头鹰', badge: '夜盘量化' } },
  dragon: { ja: { label: 'ジェイドドラゴン', badge: 'アジア覇者' }, zh: { label: '翡翠神龙', badge: '亚盘主宰' } },
  tiger: { ja: { label: 'ブレイズタイガー', badge: 'ボラ撃破' }, zh: { label: '烈焰猛虎', badge: '波动率猎手' } },
};

export const ProfileEditModal: React.FC = () => {
  const { user, isProfileModalOpen, closeProfileModal, updateProfile } = useAuth();
  const { language } = useTranslation();

  const [username, setUsername] = useState(user?.username || '');
  const [traderTitle, setTraderTitle] = useState(user?.traderTitle || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [tradingStyle, setTradingStyle] = useState<UserProfile['tradingStyle']>(user?.tradingStyle || 'SCALPER');
  const [primaryBroker, setPrimaryBroker] = useState<Broker>(user?.primaryBroker || 'Exness');
  const [avatarSymbol, setAvatarSymbol] = useState(user?.avatarSymbol || 'zap');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [country, setCountry] = useState(user?.country || 'United States');
  const [telegramHandle, setTelegramHandle] = useState(user?.telegramHandle || '');
  const [discordHandle, setDiscordHandle] = useState(user?.discordHandle || '');
  const [twitterHandle, setTwitterHandle] = useState(user?.twitterHandle || '');
  const [instagramHandle, setInstagramHandle] = useState(user?.instagramHandle || '');
  const [techRatio, setTechRatio] = useState(user?.methodology?.technical ?? 40);
  const [fundRatio, setFundRatio] = useState(user?.methodology?.fundamental ?? 10);
  const [intuitionRatio, setIntuitionRatio] = useState(user?.methodology?.intuition ?? 50);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [displayedChoices, setDisplayedChoices] = useState<AnimalAvatarPreset[]>(() => {
    const list = [...CURATED_12_AVATARS];
    const initialPreset = INSTITUTIONAL_ANIMAL_PRESETS.find(p => p.url === user?.avatarUrl);
    if (initialPreset && !list.some(p => p.id === initialPreset.id)) {
      return [initialPreset, ...list.slice(0, 11)];
    }
    return list;
  });

  const handleRollRandomAvatar = () => {
    let pick = getRandomTraderAvatar();
    // Ensure we never roll the exact same avatar twice in a row
    let attempts = 0;
    while (pick.url === avatarUrl && attempts < 10) {
      pick = getRandomTraderAvatar();
      attempts++;
    }
    setAvatarUrl(pick.url);
    setSavedSuccess(false);
    // Put the newly rolled avatar at the front of the displayed choices
    setDisplayedChoices(prev => {
      const rest = prev.filter(p => p.id !== pick.id);
      return [pick, ...rest.slice(0, 11)];
    });
  };

  // Sync state whenever modal opens or user updates
  React.useEffect(() => {
    if (user) {
      setUsername(user.username);
      setTraderTitle(user.traderTitle || '');
      setBio(user.bio || '');
      setTradingStyle(user.tradingStyle || 'SCALPER');
      setPrimaryBroker(user.primaryBroker || 'Exness');
      setAvatarSymbol(user.avatarSymbol || 'zap');
      setAvatarUrl(user.avatarUrl || '');
      setCountry(user.country || 'United States');
      setTelegramHandle(user.telegramHandle || '');
      setDiscordHandle(user.discordHandle || '');
      setTwitterHandle(user.twitterHandle || '');
      setInstagramHandle(user.instagramHandle || '');
      setTechRatio(user.methodology?.technical ?? 40);
      setFundRatio(user.methodology?.fundamental ?? 10);
      setIntuitionRatio(user.methodology?.intuition ?? 50);
      setCustomUrlInput(
        user.avatarUrl && !user.avatarUrl.startsWith('data:image/')
          ? user.avatarUrl
          : ''
      );
      setUploadError(null);
      // Keep curated 12 presets visible, preserving active user preset if customized
      const list = [...CURATED_12_AVATARS];
      const currentPreset = INSTITUTIONAL_ANIMAL_PRESETS.find(p => p.url === user.avatarUrl);
      if (currentPreset && !list.some(p => p.id === currentPreset.id)) {
        setDisplayedChoices([currentPreset, ...list.slice(0, 11)]);
      } else {
        setDisplayedChoices(list);
      }
    }
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen || !user) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(
        language === 'ja'
          ? '画像サイズは5MB以下にしてください'
          : language === 'zh'
          ? '图片大小不能超过 5MB'
          : 'Image must be under 5MB'
      );
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatarUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const finalUser = username.trim() || user.username;
    const finalAvatar = avatarUrl.trim();

    try {
      const existingAvatarsRaw = localStorage.getItem('traderank_account_avatars_v1');
      const avatarMap = existingAvatarsRaw ? JSON.parse(existingAvatarsRaw) : {};
      if (finalUser) avatarMap[finalUser.toLowerCase()] = finalAvatar;
      if (user.id) avatarMap[user.id] = finalAvatar;
      if (user.accountNumber) avatarMap[user.accountNumber] = finalAvatar;
      avatarMap['72423906'] = finalAvatar;
      localStorage.setItem('traderank_account_avatars_v1', JSON.stringify(avatarMap));
    } catch {
      // ignore storage error
    }

    try {
      const existingUsernamesRaw = localStorage.getItem('traderank_account_usernames_v1');
      const usernameMap = existingUsernamesRaw ? JSON.parse(existingUsernamesRaw) : {};
      if (finalUser) {
        if (user.id) usernameMap[user.id] = finalUser;
        if (user.accountNumber) usernameMap[user.accountNumber] = finalUser;
        usernameMap['72423906'] = finalUser;
        localStorage.setItem('traderank_account_usernames_v1', JSON.stringify(usernameMap));
      }
    } catch {
      // ignore storage error
    }

    await updateProfile({
      username: finalUser,
      traderTitle: traderTitle.trim(),
      bio: bio.trim(),
      tradingStyle,
      primaryBroker,
      avatarSymbol,
      avatarUrl: finalAvatar,
      country: country.trim(),
      telegramHandle: telegramHandle.trim(),
      discordHandle: discordHandle.trim(),
      twitterHandle: twitterHandle.trim(),
      instagramHandle: instagramHandle.trim(),
      methodology: {
        technical: techRatio,
        fundamental: fundRatio,
        intuition: intuitionRatio,
      },
    });

    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      closeProfileModal();
    }, 700);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 8px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={closeProfileModal}
    >
      <div
        className="card-panel profile-modal-content"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '94vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: 'linear-gradient(180deg, #101927 0%, #090e18 100%)',
          border: '1px solid rgba(10, 186, 181, 0.4)',
          borderRadius: '20px',
          padding: '22px 18px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(10, 186, 181, 0.15)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls: Language Selector & Close Button */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LanguageSelector variant="compact" />
          <button
            onClick={closeProfileModal}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px', paddingRight: '88px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(10, 186, 181, 0.25), rgba(0, 240, 255, 0.15))',
              border: '1px solid rgba(10, 186, 181, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={22} color="#0abab5" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>
              {language === 'ja'
                ? 'トレーダープロフィール編集'
                : language === 'zh'
                ? '编辑交易员实盘档案'
                : 'Edit Trader Profile'}
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#848E9C' }}>
              {language === 'ja'
                ? 'ランキング・大会・約定速報に表示される認証アカウント情報をカスタマイズします'
                : language === 'zh'
                ? '自定义您的实盘认证账户在排行榜、锦标赛及交割速报中的展示形象'
                : 'Customize how your verified account appears across leaderboards, tournaments, and bulletins'}
            </p>
          </div>
        </div>

        {/* Real-Time Live Preview Card */}
        <div
          style={{
            background: 'rgba(5, 12, 18, 0.85)',
            border: '1px solid rgba(10, 186, 181, 0.25)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <TraderAvatar username={username || user.username} symbol={avatarSymbol} avatarUrl={avatarUrl} size={56} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={
                  language === 'ja'
                    ? 'プロフィール写真をアップロード'
                    : language === 'zh'
                    ? '点击上传头像照片'
                    : 'Click to upload profile photo'
                }
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-3px',
                  background: 'linear-gradient(135deg, #0abab5, #00f0ff)',
                  color: '#080b11',
                  border: '2px solid #090e18',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  padding: 0,
                }}
              >
                <Camera size={11} />
              </button>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '16px', color: '#ffffff' }}>{username || user.username}</strong>
                <BrokerSymbol broker={primaryBroker} size={16} />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    background: 'rgba(10, 186, 181, 0.15)',
                    color: '#0abab5',
                    border: '1px solid rgba(10, 186, 181, 0.3)',
                  }}
                >
                  Lv. {user.level} Pro
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {traderTitle ||
                  (language === 'ja'
                    ? '認証プロトレーダー'
                    : language === 'zh'
                    ? '实盘认证机构交易员'
                    : 'Verified Institutional Trader')}{' '}
                • {tradingStyle}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '11px',
                color: '#34d399',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={13} />{' '}
              {language === 'ja'
                ? 'MetaApi 閲覧専用・認証済'
                : language === 'zh'
                ? 'MetaApi 只读实盘认证'
                : 'MetaApi Read-Only Verified'}
            </span>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {language === 'ja'
                ? `世界ランキング #${user.rank || 12} • ${user.xp} XP`
                : language === 'zh'
                ? `全球排名 #${user.rank || 12} • ${user.xp} XP`
                : `Rank #${user.rank || 12} Global • ${user.xp} XP`}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Display Name */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                {language === 'ja' ? '表示ユーザー名' : language === 'zh' ? '显示用户名' : 'Display Username'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Trader Title */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                {language === 'ja'
                  ? '肩書き・トレーダー称号'
                  : language === 'zh'
                  ? '交易员头衔 / 专长标签'
                  : 'Trader Title / Headline'}
              </label>
              <input
                type="text"
                placeholder={
                  language === 'ja'
                    ? '例: ゴールドスキャルパー＆ロンドンブレイク'
                    : language === 'zh'
                    ? '例如：黄金剥头皮 & 伦敦盘突破猎手'
                    : 'e.g. Gold Scalper & Session Breakouts'
                }
                value={traderTitle}
                onChange={(e) => setTraderTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Profile Picture Customizer (Upload, URL & Presets) */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(10, 186, 181, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                  <Camera size={14} color="#0abab5" />{' '}
                  {language === 'ja'
                    ? 'プロフィール画像・アバター設定'
                    : language === 'zh'
                    ? '个人头像与专属图腾设置'
                    : 'Profile Picture & Avatar Photo'}
                </label>
                <span style={{ fontSize: '11px', color: '#848E9C' }}>
                  {language === 'ja'
                    ? '端末からの画像アップロード、12種類の動物エンブレム、または画像URLを指定できます'
                    : language === 'zh'
                    ? '支持从设备上传照片、选择 12 款机构级动物图腾，或直接粘贴图片链接'
                    : 'Upload a photo from your device, choose from verified presets, or enter an image URL'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(10, 186, 181, 0.2), rgba(0, 240, 255, 0.15))',
                    border: '1px solid rgba(10, 186, 181, 0.45)',
                    color: '#00F0FF',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={13} />{' '}
                  {language === 'ja' ? '写真をアップロード' : language === 'zh' ? '上传照片' : 'Upload Photo'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => { setAvatarUrl(''); setCustomUrlInput(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#f87171',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title={
                      language === 'ja'
                        ? 'デフォルトに戻す'
                        : language === 'zh'
                        ? '移除自定义图片并恢复默认'
                        : 'Remove custom photo and reset to default'
                    }
                  >
                    <Trash2 size={12} /> {language === 'ja' ? 'リセット' : language === 'zh' ? '重置' : 'Reset'}
                  </button>
                )}
              </div>
            </div>

            {uploadError && (
              <div style={{ fontSize: '11px', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                {uploadError}
              </div>
            )}

            {/* Dynamic 124+ Preset Animal Crests & Random Avatar Engine */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {language === 'ja'
                      ? 'プロ仕様アニマル・クレスト（124種類以上）'
                      : language === 'zh'
                      ? '机构级交易员动物图腾 (124+ 款独立设计)'
                      : 'Institutional Avatar Generator (124+ Unique Crests)'}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#00f0ff',
                      fontWeight: 800,
                      background: 'rgba(0, 240, 255, 0.12)',
                      border: '1px solid rgba(0, 240, 255, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {language === 'ja'
                      ? '厳選12種選択 • ランダム全124+種'
                      : language === 'zh'
                      ? '精选12款 • 随机全124+款'
                      : 'Curated 12 • Random 124+ Pool'}
                  </span>
                </div>

                {/* Randomize Action Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleRollRandomAvatar}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0abab5 0%, #00f0ff 100%)',
                      color: '#060d11',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 12px rgba(0, 240, 255, 0.35)',
                    }}
                    title="Roll a random avatar from the complete 124+ designs pool"
                  >
                    <Dice5 size={14} />
                    <span>
                      {language === 'ja'
                        ? 'ランダム抽選 (全124+種)'
                        : language === 'zh'
                        ? '随机抽取 (全124+款)'
                        : 'Random Avatar (124+ Pool)'}
                    </span>
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
                  gap: '8px',
                }}
              >
                {displayedChoices.map((p) => {
                  const isSelected = avatarUrl === p.url;
                  const crestI18n = ANIMAL_CREST_I18N[p.id];
                  const displayLabel =
                    language === 'ja' && crestI18n
                      ? crestI18n.ja.label
                      : language === 'zh' && crestI18n
                      ? crestI18n.zh.label
                      : p.label;
                  const displayBadge =
                    language === 'ja' && crestI18n
                      ? crestI18n.ja.badge
                      : language === 'zh' && crestI18n
                      ? crestI18n.zh.badge
                      : p.archetype.split(' ')[0];

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAvatarUrl(p.url)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '8px 6px',
                        borderRadius: '12px',
                        background: isSelected
                          ? `linear-gradient(160deg, ${p.accentColor}28 0%, rgba(9, 14, 24, 0.95) 100%)`
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? `1.5px solid ${p.accentColor}`
                          : `1px solid ${p.accentColor}33`,
                        boxShadow: isSelected
                          ? `0 0 16px ${p.accentColor}4d, inset 0 0 10px ${p.accentColor}22`
                          : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                      title={`${displayLabel} — ${p.archetype}`}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '46px',
                          height: '46px',
                          borderRadius: '11px',
                          overflow: 'hidden',
                          border: `1.5px solid ${p.accentColor}88`,
                          boxShadow: `0 2px 10px ${p.accentColor}33`,
                        }}
                      >
                        <img
                          src={p.url}
                          alt={displayLabel}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '3px',
                              right: '3px',
                              width: '15px',
                              height: '15px',
                              borderRadius: '50%',
                              background: p.accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.7)',
                            }}
                          >
                            <Check size={10} color="#060d11" strokeWidth={3.5} />
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                          lineHeight: 1.15,
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}
                      >
                        {displayLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 700,
                          color: p.accentColor,
                          lineHeight: 1,
                          textAlign: 'center',
                          opacity: 0.9,
                        }}
                      >
                        {displayBadge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Image URL input */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={
                  language === 'ja'
                    ? 'または画像URLを貼り付け (https://...)'
                    : language === 'zh'
                    ? '或直接粘贴图片 URL (https://...)'
                    : 'Or paste an image URL (https://...)'
                }
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '11px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customUrlInput.trim()) {
                    setAvatarUrl(customUrlInput.trim());
                  }
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {language === 'ja' ? 'URL適用' : language === 'zh' ? '应用链接' : 'Apply URL'}
              </button>
            </div>
          </div>

          {/* Avatar Icon Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              {language === 'ja'
                ? 'アバターバッジ・シンボルマーク'
                : language === 'zh'
                ? '头像徽章与品种标识'
                : 'Avatar Symbol & Mark'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '8px' }}>
              {AVATAR_SYMBOLS.map((sym) => {
                const isSelected = avatarSymbol === sym.id;
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => setAvatarSymbol(sym.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--tiffany, #0abab5)' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(10, 186, 181, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sym.label[language] || sym.label.en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Primary Broker */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                {language === 'ja' ? 'メイン利用ブローカー' : language === 'zh' ? '主用经纪商' : 'Primary Broker'}
              </label>
              <select
                value={primaryBroker}
                onChange={(e) => setPrimaryBroker(e.target.value as Broker)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#131e2d',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="Exness">Exness</option>
                <option value="XM">XM Global</option>
                <option value="Axiory">Axiory</option>
                <option value="Vantage">Vantage</option>
                <option value="IC_MARKETS">IC Markets</option>
              </select>
            </div>

            {/* Trading Style */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                {language === 'ja' ? 'トレードスタイル' : language === 'zh' ? '交易风格' : 'Trading Style'}
              </label>
              <select
                value={tradingStyle}
                onChange={(e) => setTradingStyle(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#131e2d',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="SCALPER">
                  {language === 'ja'
                    ? 'スキャルパー (1分〜5分足)'
                    : language === 'zh'
                    ? '超短线剥头皮 (M1-M5)'
                    : 'Scalper (Minutes / M1-M5)'}
                </option>
                <option value="DAY_TRADER">
                  {language === 'ja'
                    ? 'デイトレーダー (15分〜1時間足)'
                    : language === 'zh'
                    ? '日内波段交易 (M15-H1)'
                    : 'Day Trader (Intraday M15-H1)'}
                </option>
                <option value="SWING_TRADER">
                  {language === 'ja'
                    ? 'スイングトレーダー (4時間〜日足)'
                    : language === 'zh'
                    ? '中长线趋势交易 (H4-D1)'
                    : 'Swing Trader (Multi-Day H4-D1)'}
                </option>
                <option value="ALGORITHMIC">
                  {language === 'ja'
                    ? 'アルゴリズム / 自動売買 EA'
                    : language === 'zh'
                    ? '量化算法 / 自动 EA'
                    : 'Algorithmic / Automated EA'}
                </option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              {language === 'ja'
                ? '自己紹介・トレード哲学'
                : language === 'zh'
                ? '自我介绍与交易理念'
                : 'Trader Bio & Philosophy'}
            </label>
            <textarea
              rows={2}
              placeholder={
                language === 'ja'
                  ? '得意な通貨ペアやトレード手法、資金管理ルールなどを入力してください...'
                  : language === 'zh'
                  ? '描述您的交易优势、擅长品种（如黄金伦敦盘突破）与风控原则...'
                  : 'Describe your edge, favorite setups (e.g. London breakout on Gold), risk management rules...'
              }
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Trading Methodology Donut Ratio */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                {language === 'ja'
                  ? 'トレード手法の比率'
                  : language === 'zh'
                  ? '交易流派占比配置'
                  : 'Trading Methodology Mix'}
              </label>
              <span style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)' }}>
                {language === 'ja'
                  ? `テクニカル ${techRatio}% • ファンダ ${fundRatio}% • 感覚 ${intuitionRatio}%`
                  : language === 'zh'
                  ? `技术面 ${techRatio}% • 基本面 ${fundRatio}% • 盘感 ${intuitionRatio}%`
                  : `Tech ${techRatio}% • Fund ${fundRatio}% • Price Action/Intuition ${intuitionRatio}%`}
              </span>
            </div>

            {/* Visual Ratio Bar */}
            <div
              style={{
                display: 'flex',
                height: '8px',
                borderRadius: '999px',
                overflow: 'hidden',
                marginBottom: '12px',
                background: '#0f172a',
              }}
            >
              <div style={{ width: `${techRatio}%`, background: '#2b9af3', transition: 'width 0.2s' }} />
              <div style={{ width: `${fundRatio}%`, background: '#10b981', transition: 'width 0.2s' }} />
              <div style={{ width: `${intuitionRatio}%`, background: '#ec4899', transition: 'width 0.2s' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#2b9af3', fontWeight: 700 }}>
                    ● {language === 'ja' ? 'テクニカル' : language === 'zh' ? '技术面' : 'Technical'}
                  </span>
                  <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{techRatio}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={techRatio}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const rem = Math.max(0, 100 - val);
                    const newFund = Math.min(fundRatio, rem);
                    setTechRatio(val);
                    setFundRatio(newFund);
                    setIntuitionRatio(Math.max(0, rem - newFund));
                  }}
                  style={{ width: '100%', accentColor: '#2b9af3', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>
                    ● {language === 'ja' ? 'ファンダメンタル' : language === 'zh' ? '基本面' : 'Fundamental'}
                  </span>
                  <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{fundRatio}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={fundRatio}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const rem = Math.max(0, 100 - val);
                    const newTech = Math.min(techRatio, rem);
                    setFundRatio(val);
                    setTechRatio(newTech);
                    setIntuitionRatio(Math.max(0, rem - newTech));
                  }}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#ec4899', fontWeight: 700 }}>
                    ● {language === 'ja' ? '感覚・PA' : language === 'zh' ? '盘感/价格行为' : 'Intuition / PA'}
                  </span>
                  <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{intuitionRatio}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={intuitionRatio}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const rem = Math.max(0, 100 - val);
                    const newTech = Math.min(techRatio, rem);
                    setIntuitionRatio(val);
                    setTechRatio(newTech);
                    setFundRatio(Math.max(0, rem - newTech));
                  }}
                  style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Social Handles */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              {language === 'ja'
                ? 'SNS・コミュニティアカウント連携'
                : language === 'zh'
                ? '社交与社区主页绑定'
                : 'Social & Community Profiles'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  Telegram
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  Discord
                </label>
                <input
                  type="text"
                  placeholder="handle#0000"
                  value={discordHandle}
                  onChange={(e) => setDiscordHandle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  X / Twitter
                </label>
                <input
                  type="text"
                  placeholder="@handle"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#e1306c', marginBottom: '4px' }}>
                  <Instagram size={12} color="#e1306c" /> Instagram
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(225, 48, 108, 0.05)',
                    border: '1px solid rgba(225, 48, 108, 0.35)',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={closeProfileModal}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {language === 'ja' ? 'キャンセル' : language === 'zh' ? '取消' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: savedSuccess
                  ? '#10b981'
                  : 'linear-gradient(135deg, #0abab5, #00f0ff)',
                color: savedSuccess ? '#ffffff' : '#041c1b',
                border: 'none',
                fontWeight: 900,
                fontSize: '13px',
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(10, 186, 181, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              {savedSuccess ? (
                <>
                  <Check size={16} />{' '}
                  {language === 'ja' ? '保存完了！' : language === 'zh' ? '已保存！' : 'Saved!'}
                </>
              ) : (
                <>
                  <Save size={16} />{' '}
                  {saving
                    ? language === 'ja'
                      ? '保存中...'
                      : language === 'zh'
                      ? '保存中...'
                      : 'Saving...'
                    : language === 'ja'
                    ? 'プロフィール変更を保存'
                    : language === 'zh'
                    ? '保存档案修改'
                    : 'Save Profile Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
