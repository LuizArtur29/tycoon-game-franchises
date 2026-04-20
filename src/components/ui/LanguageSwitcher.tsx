import { useI18n } from '@/i18n/useI18n';
import './Button.css';

export function LanguageSwitcher() {
  const { locale, toggleLocale, t } = useI18n();
  const nextLocale = locale === 'pt-BR' ? 'en' : 'pt-BR';

  return (
    <button
      className="tf-btn tf-btn-secondary tf-btn-sm"
      onClick={toggleLocale}
      title={t('language.switchTo', { language: t(`language.${nextLocale}`) })}
    >
      <span className="tf-btn-content">{t(`language.label.${locale}`)}</span>
    </button>
  );
}

