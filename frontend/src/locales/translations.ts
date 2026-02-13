export const translations = {
  en: {
    common: { welcome: 'Welcome', save: 'Save', cancel: 'Cancel', delete: 'Delete' },
    dashboard: { title: 'Dashboard', appointments: 'Appointments', revenue: 'Revenue' },
    invoice: {
      approval: 'Invoice Approval',
      approve: 'Approve',
      reject: 'Reject',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      notes: 'Notes',
      items: 'Items',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Tax',
      client: 'Client',
      pet: 'Pet',
      status: 'Status',
      number: 'Invoice Number',
    },
  },
  fr: {
    common: { welcome: 'Bienvenue', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer' },
    dashboard: { title: 'Tableau de bord', appointments: 'Rendez-vous', revenue: 'Revenu' },
    invoice: {
      approval: 'Approbation de facture',
      approve: 'Approuver',
      reject: 'Rejeter',
      edit: 'Modifier',
      save: 'Enregistrer',
      cancel: 'Annuler',
      notes: 'Notes',
      items: 'Articles',
      total: 'Total',
      subtotal: 'Sous-total',
      tax: 'Taxe',
      client: 'Client',
      pet: 'Animal',
      status: 'Statut',
      number: 'Numéro de facture',
    },
  },
  sk: {
    common: { welcome: 'Vitajte', save: 'Uložiť', cancel: 'Zrušiť', delete: 'Vymazať' },
    dashboard: { title: 'Prehľad', appointments: 'Stretnutia', revenue: 'Príjem' },
    invoice: {
      approval: 'Schválenie faktúry',
      approve: 'Schváliť',
      reject: 'Odmietnuť',
      edit: 'Upraviť',
      save: 'Uložiť',
      cancel: 'Zrušiť',
      notes: 'Poznámky',
      items: 'Položky',
      total: 'Celkom',
      subtotal: 'Medzisúčet',
      tax: 'Daň',
      client: 'Klient',
      pet: 'Zviera',
      status: 'Stav',
      number: 'Číslo faktúry',
    },
  },
};

export const t = (key: string, lang: string = 'en') => {
  const keys = key.split('.');
  let value: unknown = translations[lang as keyof typeof translations];
  for (const k of keys) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[k];
    } else {
      value = undefined;
    }
  }
  return (typeof value === "string" && value) || key;
};
