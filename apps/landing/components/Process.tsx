import React from 'react';
import { useTranslation } from 'react-i18next';
import { STEPS_DATA } from '../constants';
import { ArrowRight, ChevronRight } from 'lucide-react';

const Process: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="process" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
                    {t('process.title')}
                </h2>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    {t('process.subtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-[2.5rem] left-[16%] right-[16%] h-0.5 bg-gray-100 -z-10"></div>

                {STEPS_DATA.map((step, index) => (
                    <div key={index} className="relative group">
                        {/* Step Card */}
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-white border-4 border-gray-50 flex items-center justify-center mb-8 shadow-xl shadow-gray-100 group-hover:shadow-2xl group-hover:scale-110 group-hover:border-purple-50 transition-all duration-300 z-10">
                                <span className="text-2xl font-display font-bold text-brand-purple">
                                    {step.number}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                {t(`process.steps.${step.id}.title`)}
                            </h3>
                            <p className="text-gray-500 leading-relaxed max-w-xs text-lg">
                                {t(`process.steps.${step.id}.description`)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default Process;