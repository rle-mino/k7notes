import React from 'react';
import { useTranslation } from 'react-i18next';
import { FEATURES_DATA } from '../constants';

const Features: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-pastel-purple rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute bottom-[10%] right-[5%] w-64 h-64 bg-pastel-blue rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-24 max-w-3xl">
          <h2 className="text-sm font-bold text-brand-purple tracking-widest uppercase mb-3 bg-purple-50 inline-block px-3 py-1 rounded-full">
            {t('features.eyebrow')}
          </h2>
          <p className="text-4xl md:text-5xl font-display font-bold tracking-tight text-gray-900 mb-6">
            {t('features.title_start')} <span className="text-gray-400">{t('features.title_end')}</span>
          </p>
          <p className="text-xl text-gray-500 leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="space-y-24 md:space-y-32">
          {FEATURES_DATA.map((feature, index) => {
             // Define colors based on index to match the visual language
             const colors = [
               { bg: 'bg-purple-100', text: 'text-brand-purple', iconBg: 'bg-purple-50' },
               { bg: 'bg-orange-100', text: 'text-safety-orange', iconBg: 'bg-orange-50' },
               { bg: 'bg-blue-100', text: 'text-blueprint-blue', iconBg: 'bg-blue-50' },
               { bg: 'bg-green-100', text: 'text-green-600', iconBg: 'bg-green-50' }
             ];
             const color = colors[index % colors.length];

             return (
              <div 
                key={index} 
                className={`flex flex-col md:flex-row items-center gap-12 lg:gap-20 ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Visual Side */}
                <div className="w-full md:w-1/2">
                   <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-100 border border-gray-100 p-8 md:p-12 relative overflow-hidden group hover:shadow-gray-200 transition-all duration-500">
                      {/* Decorative Background Icon */}
                      <div className={`absolute -bottom-8 -right-8 w-64 h-64 ${color.text} opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700`}>
                        <feature.icon className="w-full h-full" />
                      </div>
                      
                      {/* Main Icon Card */}
                      <div className="relative z-10 flex items-center justify-center min-h-[200px]">
                          <div className={`w-24 h-24 ${color.bg} ${color.text} rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                            <feature.icon className="w-10 h-10" />
                          </div>
                      </div>
                   </div>
                </div>

                {/* Text Side */}
                <div className="w-full md:w-1/2">
                  <h3 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-6 leading-tight">
                    {t(`features.items.${feature.id}.title`)}
                  </h3>
                  <p className="text-lg text-gray-500 leading-relaxed font-medium">
                    {t(`features.items.${feature.id}.description`)}
                  </p>
                </div>
              </div>
             );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;