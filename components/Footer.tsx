
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { MusicNoteIcon, GlobeIcon, YoutubeIcon, HeartIcon } from './icons';
import { useContent } from '../hooks/useContent';
import { FooterContactItem, FooterLinkItem } from '../types';

const FooterLink: React.FC<{ item: FooterLinkItem }> = ({ item }) => (
    <li>
        <ReactRouterDOM.Link to={item.url} className="text-brand-text-secondary hover:text-white transition-colors duration-200">{item.label}</ReactRouterDOM.Link>
    </li>
);

const ContactItem: React.FC<{ item: FooterContactItem }> = ({ item }) => {
    const linkValue = item.isLink && !item.value.startsWith('http') 
        ? (item.value.includes('@') ? `mailto:${item.value}` : `https://${item.value}`)
        : item.value;

    return (
        <li className="flex items-center space-x-2">
            <span>{item.label}</span>
            {item.isLink 
                ? <a href={linkValue} target="_blank" rel="noopener noreferrer" className="hover:text-white">{item.value}</a>
                : <span>{item.value}</span>
            }
        </li>
    );
};


const Footer: React.FC = () => {
  const { footerContent } = useContent();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-bg border-t border-brand-surface/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <ReactRouterDOM.Link to="/" className="flex items-center space-x-3">
                <MusicNoteIcon className="w-8 h-8 text-brand-primary" />
                <div>
                  <span className="text-xl font-bold text-white">TeO Music Studio</span>
                  <p className="text-xs text-brand-text-secondary">S.M.T.</p>
                </div>
            </ReactRouterDOM.Link>
            <p className="text-brand-text-secondary text-sm">
                {footerContent.description}
            </p>
             <p className="text-brand-text-secondary text-xs italic">
                {footerContent.artisticProjectNote}
            </p>
            <div className="flex space-x-4">
              <a href={footerContent.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-brand-text-secondary hover:text-white"><YoutubeIcon className="w-6 h-6" /></a>
              <a href={footerContent.socialLinks.globe} target="_blank" rel="noopener noreferrer" className="text-brand-text-secondary hover:text-white"><GlobeIcon className="w-6 h-6" /></a>
            </div>
          </div>

          {footerContent.columns.map(column => (
              <div key={column.title}>
                <h3 className="text-white font-semibold mb-4">{column.title}</h3>
                <ul className="space-y-2">
                  {column.links.map(link => <FooterLink key={link.label} item={link} />)}
                </ul>
              </div>
          ))}

          <div>
            <h3 className="text-white font-semibold mb-4">{footerContent.contactInfo.title}</h3>
            <ul className="space-y-2 text-sm text-brand-text-secondary">
               {footerContent.contactInfo.items.map(item => <ContactItem key={item.label} item={item} />)}
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-brand-dark py-4 border-t border-brand-surface/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-sm text-brand-text-secondary">
          <p>&copy; {currentYear} {footerContent.copyrightText}</p>
          <p className="flex items-center space-x-1.5">
            <span>Powered by AI</span>
            <HeartIcon className="w-4 h-4 text-brand-secondary" />
            <span>{footerContent.poweredByText}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;