import React from 'react';
import { useTranslation } from 'react-i18next';
import { SOLUTION_ITEMS } from '../constants';
import { CheckCircle2 } from 'lucide-react';

const Solution: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="solution" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 tracking-tight">
            {t('solution.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {SOLUTION_ITEMS.map((item, index) => (
            <div key={index} className="flex flex-col items-start p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-purple/20 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <div className="text-sm font-bold uppercase tracking-wider text-green-700">
                    {index === 0 ? 'Personnalisé' : index === 1 ? 'Instantané' : 'Mobile'}
                 </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t(`solution.items.${item.id}.title`)}
              </h3>
              
              <p className="text-gray-600 text-lg">
                {t(`solution.items.${item.id}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solution;