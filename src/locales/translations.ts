export const translations = {
  en: {
    common: { welcome: 'Welcome', save: 'Save', cancel: 'Cancel', delete: 'Delete' },
    dashboard: { title: 'Dashboard', appointments: 'Appointments', revenue: 'Revenue' },
  },
  fr: {
    common: { welcome: 'Bienvenue', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer' },
    dashboard: { title: 'Tableau de bord', appointments: 'Rendez-vous', revenue: 'Revenu' },
  },
  sk: {
    common: { welcome: 'Vitajte', save: 'Uložiť', cancel: 'Zrušiť', delete: 'Vymazať' },
    dashboard: { title: 'Prehľad', appointments: 'Stretnutia', revenue: 'Príjem' },
  },
};

export const t = (key: string, lang: string = 'en') => {
  const keys = key.split('.');
  let value: any = translations[lang as keyof typeof translations];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
};
