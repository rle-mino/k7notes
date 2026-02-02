import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        problem: "The Problem",
        solution: "The Solution",
        trust: "Security",
        cta: "Get Access"
      },
      hero: {
        badge: "Architect Intelligence Beta",
        title: "Never lose what's said in a meeting again.",
        subtitle: "K7 generates personalized summaries per participant and lets you find any info in 5 seconds — even for in-person meetings.",
        cta_primary: "Start Recording",
        cta_secondary: "Watch Demo",
        card_summary: {
          title: "Site Visit Summary",
          date: "Today, 10:23 AM • Project Alpha",
          status: "Completed",
          item1: "HVAC ductwork clashes with beam at grid line 4.",
          item2: "Client approved matte black finish for window frames.",
          item3: "Safety rail needed on Level 2 east stairwell immediately.",
          item4: "Contractor to revise electrical plan by Friday."
        },
        card_recording: "Recording...",
        card_search: {
          query: "\"foundation depth\"",
          result: "Found 3 results in 2 projects"
        }
      },
      features: {
        eyebrow: "Features",
        title_start: "Everything you need",
        title_end: "to run efficient sites",
        subtitle: "Powerful tools designed specifically for construction professionals.",
        items: {
          record: { title: "Voice Recording", description: "Capture every detail with high-quality audio recording." },
          transcribe: { title: "Smart Transcription", description: "Automatically convert speech to text with high accuracy." },
          search: { title: "Instant Search", description: "Find any specific detail across all your meetings instantly." },
          action: { title: "Action Items", description: "Automatically detect and assign tasks to your team." }
        }
      },
      process: {
        title: "How it works",
        subtitle: "Simple steps to automate your meeting minutes.",
        steps: {
          record: { title: "Record", description: "Start recording your site meeting with one tap." },
          process: { title: "Process", description: "Our AI analyzes and structures the conversation." },
          distribute: { title: "Distribute", description: "Send personalized summaries to all stakeholders." }
        }
      },
      personas: {
        title: "Designed for you",
        solution_label: "The Solution",
        roles: {
          manager: { label: "Site Manager", pain: "I spend too much time writing reports.", solution: "Automated reporting saves you hours every week." },
          architect: { label: "Architect", pain: "Details get lost in translation.", solution: "Precise transcriptions ensure nothing is missed." },
          client: { label: "Client", pain: "I don't know what's happening on site.", solution: "Clear summaries keep you updated on progress." }
        }
      },
      problem: {
        title: "Sound familiar?",
        items: {
          time: {
            title: "I spend hours on minutes",
            description: "You leave the meeting, and you still have 45 mins of writing ahead of you. Every day. Every week."
          },
          search: {
            title: "Impossible to find info",
            description: "You know it was said. But where? Which meeting? By whom? You search for 20 minutes. Sometimes you find it. Often not."
          },
          ignored: {
            title: "Nobody reads my reports",
            description: "You send a 2-page report. At the next meeting, everyone has forgotten. Your effort is wasted."
          }
        }
      },
      solution: {
        title: "K7 fixes this in 3 clicks",
        items: {
          personalized: {
            title: "Personalized summary per participant",
            description: "Everyone receives only what concerns them."
          },
          search: {
            title: "Full-text search",
            description: "Find any decision in 5 seconds."
          },
          offline: {
            title: "In-person & offline",
            description: "Works from your phone, even without wifi."
          }
        }
      },
      trust: {
        title: "French solution, built for enterprise",
        items: {
          hosting: "Hosted in France",
          encryption: "Data encryption",
          no_training: "No AI training on your meetings"
        }
      },
      cta: {
        title: "Discover how K7 can save you 5h per week",
        subtitle: "Leave your email to access the full presentation (7 min).",
        placeholder: "Professional email",
        button: "Watch presentation →",
        note: "🔒 No spam. You can unsubscribe in 1 click."
      },
      footer: {
        tagline: "Architecture intelligence for the modern site manager.",
        product: "Product",
        company: "Company",
        follow: "Follow Us",
        rights: "K7. All rights reserved.",
        links: {
          features: "Features",
          pricing: "Pricing",
          security: "Security",
          changelog: "Changelog",
          about: "About Us",
          careers: "Careers",
          legal: "Legal",
          contact: "Contact",
          privacy: "Privacy Policy",
          terms: "Terms of Service"
        }
      }
    }
  },
  fr: {
    translation: {
      nav: {
        problem: "Le Problème",
        solution: "La Solution",
        trust: "Sécurité",
        cta: "Voir la démo"
      },
      hero: {
        badge: "Intelligence Architecturale Bêta",
        title: "Ne perds plus jamais ce qui se dit en réunion",
        subtitle: "K7 génère des comptes rendus personnalisés par participant et te permet de retrouver n'importe quelle info en 5 secondes — même pour tes réunions en présentiel.",
        cta_primary: "Commencer l'enregistrement",
        cta_secondary: "Voir la Démo",
        card_summary: {
          title: "Compte-rendu de visite",
          date: "Aujourd'hui, 10:23 • Projet Alpha",
          status: "Terminé",
          item1: "Conflit gaine CVC avec poutre sur la file 4.",
          item2: "Le client a validé la finition noir mat pour les huisseries.",
          item3: "Garde-corps manquant escalier Est Niv 2 (Urgent).",
          item4: "L'électricien doit réviser le plan pour vendredi."
        },
        card_recording: "Enregistrement...",
        card_search: {
          query: "\"profondeur fondations\"",
          result: "3 résultats dans 2 projets"
        }
      },
      features: {
        eyebrow: "Fonctionnalités",
        title_start: "Tout ce dont vous avez besoin",
        title_end: "pour des chantiers efficaces",
        subtitle: "Des outils puissants conçus spécifiquement pour les professionnels du BTP.",
        items: {
          record: { title: "Enregistrement Vocal", description: "Capturez chaque détail avec un enregistrement audio de haute qualité." },
          transcribe: { title: "Transcription Intelligente", description: "Convertissez automatiquement la parole en texte avec une grande précision." },
          search: { title: "Recherche Instantanée", description: "Retrouvez instantanément n'importe quel détail dans toutes vos réunions." },
          action: { title: "Plans d'Action", description: "Détectez et attribuez automatiquement les tâches à votre équipe." }
        }
      },
      process: {
        title: "Comment ça marche",
        subtitle: "Des étapes simples pour automatiser vos comptes rendus.",
        steps: {
          record: { title: "Enregistrer", description: "Lancez l'enregistrement de votre réunion de chantier en un clic." },
          process: { title: "Traiter", description: "Notre IA analyse et structure la conversation." },
          distribute: { title: "Distribuer", description: "Envoyez des résumés personnalisés à toutes les parties prenantes." }
        }
      },
      personas: {
        title: "Conçu pour vous",
        solution_label: "La Solution",
        roles: {
          manager: { label: "Chef de Chantier", pain: "Je passe trop de temps à rédiger des rapports.", solution: "Le reporting automatisé vous fait gagner des heures chaque semaine." },
          architect: { label: "Architecte", pain: "Les détails se perdent dans la communication.", solution: "Des transcriptions précises garantissent que rien n'est oublié." },
          client: { label: "Client", pain: "Je ne sais pas ce qui se passe sur le chantier.", solution: "Des résumés clairs vous tiennent informé de l'avancement." }
        }
      },
      problem: {
        title: "Tu te reconnais ?",
        items: {
          time: {
            title: "\"Je passe des heures sur mes CR\"",
            description: "Tu sors de réunion, et t'as encore 45 min de rédaction devant toi. Chaque jour. Chaque semaine."
          },
          search: {
            title: "\"Impossible de retrouver une info\"",
            description: "Tu sais que c'est été dit. Mais où ? Dans quelle réunion ? Par qui ? Tu cherches 20 minutes. Parfois tu trouves. Souvent non."
          },
          ignored: {
            title: "\"Personne ne lit mes comptes rendus\"",
            description: "Tu envoies un CR de 2 pages. À la prochaine réunion, tout le monde a oublié. Ton effort est perdu."
          }
        }
      },
      solution: {
        title: "K7 règle ça en 3 clics",
        items: {
          personalized: {
            title: "CR personnalisé par participant",
            description: "Chacun reçoit uniquement ce qui le concerne"
          },
          search: {
            title: "Recherche full-text",
            description: "Retrouve n'importe quelle décision en 5 secondes"
          },
          offline: {
            title: "Présentiel & offline",
            description: "Fonctionne depuis ton téléphone, même sans wifi"
          }
        }
      },
      trust: {
        title: "🇫🇷 Solution française, pensée pour l'entreprise",
        items: {
          hosting: "Hébergement en France",
          encryption: "Chiffrement des données",
          no_training: "Pas d'entraînement IA sur tes réunions"
        }
      },
      cta: {
        title: "Découvre comment K7 peut te faire gagner 5h par semaine",
        subtitle: "Laisse ton email pour accéder à la présentation complète (7 min).",
        placeholder: "Email professionnel",
        button: "Voir la présentation →",
        note: "🔒 Pas de spam. Tu peux te désinscrire en 1 clic."
      },
      footer: {
        tagline: "Intelligence architecturale pour le chef de chantier moderne.",
        product: "Produit",
        company: "Entreprise",
        follow: "Suivez-nous",
        rights: "K7. Tous droits réservés.",
        links: {
          features: "Fonctionnalités",
          pricing: "Tarifs",
          security: "Sécurité",
          changelog: "Changelog",
          about: "À propos",
          careers: "Carrières",
          legal: "Légal",
          contact: "Contact",
          privacy: "Politique de Confidentialité",
          terms: "Conditions d'Utilisation"
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    },
    react: {
        useSuspense: false
    }
  });

export default i18n;