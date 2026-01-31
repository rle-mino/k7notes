import React from 'react';
import { ArrowRight, Play, CheckCircle2, Mic, FileText, Search, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
      {/* Playful Background Shapes */}
      <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-pastel-orange rounded-full blur-3xl opacity-60 pointer-events-none animate-float-slow"></div>
      <div className="absolute top-40 left-[-10%] w-[400px] h-[400px] bg-pastel-blue rounded-full blur-3xl opacity-60 pointer-events-none animate-float"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl md:text-7xl font-display font-bold text-gray-900 tracking-tight mb-6 leading-[1.1]">
              {t('hero.title')}
            </h1>
            
            <p className="mt-6 text-xl text-gray-500 leading-relaxed font-light max-w-2xl mx-auto lg:mx-0">
              {t('hero.subtitle')}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button className="group shadow-lg shadow-purple-200 bg-brand-purple hover:bg-purple-700 text-white border-transparent">
                {t('hero.cta_primary')}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" className="group bg-white hover:bg-gray-50 border-gray-200 text-gray-700">
                <Play className="mr-2 h-4 w-4 text-brand-purple" />
                {t('hero.cta_secondary')}
              </Button>
            </div>
          </div>

          {/* Right Visual - Floating Cards Composition */}
          <div className="flex-1 w-full max-w-[600px] relative mt-16 lg:mt-0 perspective-1000 hidden md:block">
             
             {/* Decorative Background for Cards */}
             <div className="absolute inset-0 bg-gradient-to-tr from-purple-100 to-orange-50 rounded-full blur-2xl opacity-50 transform scale-90"></div>

             {/* Main Card - Summary */}
             <div className="relative z-20 bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 animate-float">
                <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-purple text-white flex items-center justify-center shadow-lg shadow-purple-200">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-gray-900 text-lg">{t('hero.card_summary.title')}</h3>
                      <p className="text-sm text-gray-400 font-medium">{t('hero.card_summary.date')}</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-green-50 text-green-600 text-xs font-bold uppercase tracking-wider rounded-full border border-green-100">
                    {t('hero.card_summary.status')}
                  </span>
                </div>
                
                <div className="space-y-5">
                  {[
                    t('hero.card_summary.item1'),
                    t('hero.card_summary.item2'),
                    t('hero.card_summary.item3'),
                    t('hero.card_summary.item4')
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blueprint-blue flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blueprint-blue group-hover:text-white transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-600 leading-snug font-medium">{item}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;