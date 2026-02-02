import React from 'react';
import { useTranslation } from 'react-i18next';
import { TRUST_ITEMS } from '../constants';

const Trust: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="trust" className="py-20 bg-arch-black text-white relative overflow-hidden">
      {/* Abstract Grid Background */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-12">
          {t('trust.title')}
        </h2>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {TRUST_ITEMS.map((item, index) => (
            <div key={index} className="flex flex-col items-center gap-4 group">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                <item.icon className="w-8 h-8 text-blue-300" />
              </div>
              <span className="font-medium text-lg text-gray-200 max-w-[200px]">
                {t(`trust.items.${item.id}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Trust;