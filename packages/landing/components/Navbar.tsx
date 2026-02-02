import React, { useState, useEffect } from 'react';
import { Menu, X, CassetteTape, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '../constants';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'fr';
    // Simple toggle between en and fr, checking for sub-tags like en-US
    const newLang = currentLang.startsWith('en') ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  const getDisplayLanguage = () => {
    return (i18n.language || 'fr').split('-')[0];
  };

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <CassetteTape className={`h-8 w-8 ${scrolled ? 'text-arch-black' : 'text-arch-black'}`} />
              <span className={`font-display font-bold text-xl tracking-tight ${scrolled ? 'text-arch-black' : 'text-arch-black'}`}>
                K7
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <a 
                key={item.id} 
                href={item.href} 
                className="text-gray-600 hover:text-arch-black font-medium text-sm tracking-wide transition-colors"
              >
                {t(`nav.${item.id}`)}
              </a>
            ))}
            
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-gray-600 hover:text-arch-black font-medium text-sm transition-colors cursor-pointer uppercase"
              aria-label="Toggle Language"
            >
              <Globe className="h-4 w-4" />
              <span>{getDisplayLanguage()}</span>
            </button>

            <a 
              href="#contact" 
              className="px-5 py-2.5 bg-arch-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              {t('nav.cta')}
            </a>
          </div>

          <div className="md:hidden flex items-center gap-4">
             <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-gray-600 hover:text-arch-black font-medium text-sm transition-colors cursor-pointer uppercase"
            >
              <span>{getDisplayLanguage()}</span>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-black focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                {t(`nav.${item.id}`)}
              </a>
            ))}
            <a
              href="#contact"
              className="block w-full text-center mt-4 px-5 py-3 bg-arch-black text-white font-medium rounded-md"
              onClick={() => setIsOpen(false)}
            >
               {t('nav.cta')}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;