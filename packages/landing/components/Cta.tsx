import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

const Cta: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="contact" className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-display font-bold text-arch-black mb-6">
          {t('cta.title')}
        </h2>
        <p className="text-xl text-gray-600 mb-10 font-light">
          {t('cta.subtitle')}
        </p>
        
        <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder={t('cta.placeholder')}
            className="flex-1 appearance-none border border-gray-300 rounded-md px-5 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-arch-black focus:border-transparent"
          />
          <Button variant="secondary">
            {t('cta.button')}
          </Button>
        </form>
        <p className="mt-4 text-xs text-gray-400">
          {t('cta.note')}
        </p>
      </div>
    </section>
  );
};

export default Cta;