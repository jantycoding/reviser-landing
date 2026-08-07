import Logo from '../components/ui/Logo';
import { footer, contacts, navItems, brand } from '../content/site';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-ink px-5 py-stack md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:gap-8">
          <div className="max-w-xs">
            <a href="#top" className="flex items-center gap-3">
              <Logo className="h-9 w-9" />
              <span className="font-display text-h3 font-light tracking-[-0.02em] text-chalk">{brand.name}</span>
            </a>
            <p className="mt-4 text-body text-fog">{footer.tagline}</p>
          </div>

          <nav aria-label="Разделы сайта">
            <div className="mb-4 font-mono text-label font-medium tracking-[0.16em] text-mist uppercase">Разделы</div>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:grid-cols-1">
              {navItems.map(item => (
                <li key={item.href}>
                  <a href={item.href} className="text-body text-fog transition-colors hover:text-chalk">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <div className="mb-4 font-mono text-label font-medium tracking-[0.16em] text-mist uppercase">Контакты</div>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`https://wa.me/${contacts.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body text-fog transition-colors hover:text-chalk"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${contacts.email}`} className="text-body text-fog transition-colors hover:text-chalk">
                  {contacts.email}
                </a>
              </li>
              <li>
                <a
                  href={contacts.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body text-fog transition-colors hover:text-chalk"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-7 text-fine text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.full} · {contacts.legal}
          </p>
          <p>Данные обрабатываются по NDA, подписанному через ЭЦП.</p>
        </div>
      </div>
    </footer>
  );
}
