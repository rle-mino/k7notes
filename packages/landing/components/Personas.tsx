import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PERSONAS_DATA } from '../constants';
import { Quote, ArrowRight, User } from 'lucide-react';

const Personas: React.FC = () => {
  const [activePersona, setActivePersona] = useState(0);
  const { t } = useTranslation();

  return (
    <section id="personas" className="py-24 bg-cream relative overflow-hidden">
      
      {/* Decorative background shape */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-pastel-orange opacity-30 skew-x-12 translate-x-32 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16">
          <h2 className="text-4xl font-display font-bold text-gray-900">
            {t('personas.title')}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Persona List / Menu */}
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            {PERSONAS_DATA.map((persona, index) => (
              <button
                key={index}
                onClick={() => setActivePersona(index)}
                className={`group flex items-center justify-between p-5 rounded-2xl transition-all duration-300 ${
                  activePersona === index
                    ? 'bg-white shadow-lg shadow-gray-100 ring-1 ring-gray-100 scale-105'
                    : 'hover:bg-white/60 hover:pl-6'
                }`}
              >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activePersona === index ? 'bg-brand-purple text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                        <User className="w-5 h-5" />
                    </div>
                    <span className={`font-bold text-lg ${activePersona === index ? 'text-gray-900' : 'text-gray-500'}`}>
                    {t(`personas.roles.${persona.id}.label`)}
                    </span>
                </div>
                
                {activePersona === index && (
                  <ArrowRight className="w-5 h-5 text-brand-purple" />
                )}
              </button>
            ))}
          </div>

          {/* Active Content Card */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-gray-200 border border-gray-100 relative overflow-hidden h-full min-h-[450px] flex flex-col justify-center transition-all duration-500">
               
               {/* Accent decoration */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-purple rounded-bl-[4rem] opacity-50"></div>

               <div className="relative z-10">
                  <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-safety-orange mb-6">
                         <Quote className="h-6 w-6" />
                    </div>
                    
                    <p className="text-2xl md:text-3xl font-display leading-tight text-gray-900 font-medium">
                      "{t(`personas.roles.${PERSONAS_DATA[activePersona].id}.pain`)}"
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="w-1.5 h-full min-h-[50px] bg-brand-purple rounded-full"></div>
                      <div>
                        <span className="text-xs font-bold text-brand-purple uppercase tracking-wider mb-2 block">
                            {t('personas.solution_label')}
                        </span>
                        <p className="text-gray-600 leading-relaxed text-lg">
                           {t(`personas.roles.${PERSONAS_DATA[activePersona].id}.solution`)}
                        </p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Personas;