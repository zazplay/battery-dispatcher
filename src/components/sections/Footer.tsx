import { useT } from '../../i18n';

export function Footer() {
  const { t } = useT();
  return (
    <footer className="wrap">
      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} Azileon · <a href="https://azileon.cz" target="_blank" rel="noreferrer">azileon.cz</a></span>
        <span>{t.footer.tagline}</span>
      </div>
    </footer>
  );
}
