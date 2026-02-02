import React from 'react';
import { CassetteTape, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-arch-black text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4 text-white">
              <CassetteTape className="h-6 w-6" />
              <span className="font-bold text-lg">K7</span>
            </div>
            <p className="text-sm">
              {t('footer.tagline')}
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.features')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.pricing')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.security')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.changelog')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.about')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.careers')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.legal')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.contact')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">{t('footer.follow')}</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>&copy; {new Date().getFullYear()} {t('footer.rights')}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">{t('footer.links.privacy')}</a>
            <a href="#" className="hover:text-white">{t('footer.links.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;