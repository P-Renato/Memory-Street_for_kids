// components/Sidebar.tsx
"use client";
import { useLanguage } from '../context/LangaugeContext';
import { cityByLanguage } from '../lib/db';

type Language = keyof typeof cityByLanguage;

export default function Sidebar() {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    // add more languages as needed
  ];

  return (
    <aside className="sidebar">
      <h3>Select Language</h3>
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      
      {/* Add other sidebar content here */}
    </aside>
  );
}