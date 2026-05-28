'use client';

import { MapPin, Phone, Mail, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ContactFooter() {
  const t = useTranslations('Student');

  return (
    <footer
      id="contact"
      className="relative bg-slate-950 text-slate-300 pt-24 pb-12 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
              {t('landing.contact.title')}
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-md">{t('landing.contact.desc')}</p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('landing.contact.address')}</h4>
                  <p className="text-slate-400">{t('landing.contact.addressValue')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('landing.contact.phone')}</h4>
                  <p className="text-slate-400">{t('landing.contact.phoneValue')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('landing.contact.email')}</h4>
                  <p className="text-slate-400">{t('landing.contact.emailValue')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-3xl backdrop-blur-md">
            <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('landing.contact.namePlaceholder')}
                </label>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder={t('landing.contact.nameExample')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('landing.contact.phonePlaceholder')}
                </label>
                <input
                  type="tel"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder={t('landing.contact.phoneExample')}
                />
              </div>

              <button
                type="submit"
                className="mt-4 w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                <Send className="w-5 h-5" />
                {t('landing.contact.submit')}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-orange-500 font-bold text-white text-xs">
              L
            </div>
            <span className="font-semibold text-slate-300">{t('landing.contact.brandName')}</span>
          </div>
          <p>{t('landing.contact.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
