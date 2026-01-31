import React from 'react';
import { useTranslation } from 'react-i18next';
import { PROBLEM_ITEMS } from '../constants';

const Problem: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="problem" className="py-24 bg-arch-gray relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 tracking-tight">
            {t('problem.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROBLEM_ITEMS.map((item, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
                <item.icon className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4 font-display">
                {t(`problem.items.${item.id}.title`)}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {t(`problem.items.${item.id}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;