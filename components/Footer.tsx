import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import { YoutubeIcon, GlobeIcon } from './icons';

const Footer: React.FC = () => {
    const { footerContent } = useContent();
    if (!footerContent) return null;

    const { description, artisticProjectNote, socialLinks, columns, contactInfo, copyrightText, poweredByText } = footerContent;

    return (
        <footer className="bg-brand-dark text-brand-text-secondary border-t border-brand-surface/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-8">
                    {/* Brand Info */}
                    <div className="md:col-span-4 lg:col-span-4">
                        <h3 className="text-xl font-bold text-white mb-2">TeO Music Studio</h3>
                        <p className="text-sm mb-4">{description}</p>
                        <p className="text-xs italic">{artisticProjectNote}</p>
                        <div className="flex space-x-4 mt-6">
                            <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-white"><YoutubeIcon className="w-6 h-6" /></a>
                            <a href={socialLinks.globe} target="_blank" rel="noopener noreferrer" className="hover:text-white"><GlobeIcon className="w-6 h-6" /></a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="md:col-span-4 lg:col-span-5 grid grid-cols-2 gap-8">
                        {columns.map(col => (
                            <div key={col.title}>
                                <h4 className="font-semibold text-white mb-4">{col.title}</h4>
                                <ul className="space-y-2">
                                    {col.links.map(link => (
                                        <li key={link.label}>
                                            <Link to={link.url} className="text-sm hover:text-white transition-colors">{link.label}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Contact */}
                    <div className="md:col-span-4 lg:col-span-3">
                        <h4 className="font-semibold text-white mb-4">{contactInfo.title}</h4>
                        <ul className="space-y-2 text-sm">
                            {contactInfo.items.map(item => (
                                <li key={item.label}>
                                    <strong>{item.label}</strong>{' '}
                                    {item.isLink ? (
                                        <a href={item.value.startsWith('mailto:') ? item.value : `//${item.value}`} target="_blank" rel="noopener noreferrer" className="hover:text-white break-all">{item.value.replace('mailto:', '')}</a>
                                    ) : (
                                        <span>{item.value}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-brand-surface/50 flex flex-col sm:flex-row justify-between items-center text-xs">
                    <p>&copy; {new Date().getFullYear()} {copyrightText}</p>
                    <p className="mt-2 sm:mt-0">{poweredByText}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;