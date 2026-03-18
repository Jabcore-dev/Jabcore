import emailjs from '@emailjs/browser'

// EmailJS konfigurace
export const EMAILJS_CONFIG = {
  serviceId: 'service_ownrwtf',
  templateId: 'template_sg2vrey',
  autoReplyTemplateId: 'template_h20k98k',
  publicKey: 'pg8ChGNkF3ay6w8uA',
}

// Inicializace EmailJS
export const initEmailJS = () => {
  emailjs.init(EMAILJS_CONFIG.publicKey)
}

// Typ pro data z formuláře
export interface ContactFormData {
  name: string
  email: string
  company?: string
  phone: string
  message: string
  language: string
}

// Texty pro auto-reply podle jazyka
const autoReplyTexts: Record<string, {
  subject: string
  greeting: string
  thankYou: string
  received: string
  response: string
  meanwhile: string
  signature: string
}> = {
  cs: {
    subject: 'Děkujeme za vaši zprávu | Jabcore',
    greeting: 'Dobrý den',
    thankYou: 'Děkujeme za vaši zprávu!',
    received: 'Vaši zprávu jsme úspěšně přijali a náš tým ji právě zpracovává.',
    response: 'Odpovíme vám do 24 hodin v pracovní dny.',
    meanwhile: 'Mezitím se můžete podívat na naše služby na',
    signature: 'S pozdravem',
  },
  en: {
    subject: 'Thank you for your message | Jabcore',
    greeting: 'Hello',
    thankYou: 'Thank you for your message!',
    received: 'We have successfully received your message and our team is processing it.',
    response: 'We will respond within 24 hours on business days.',
    meanwhile: 'In the meantime, you can check out our services at',
    signature: 'Best regards',
  },
  de: {
    subject: 'Vielen Dank für Ihre Nachricht | Jabcore',
    greeting: 'Guten Tag',
    thankYou: 'Vielen Dank für Ihre Nachricht!',
    received: 'Wir haben Ihre Nachricht erfolgreich erhalten und unser Team bearbeitet sie gerade.',
    response: 'Wir werden Ihnen innerhalb von 24 Stunden an Werktagen antworten.',
    meanwhile: 'In der Zwischenzeit können Sie sich unsere Dienstleistungen ansehen auf',
    signature: 'Mit freundlichen Grüßen',
  },
  sk: {
    subject: 'Ďakujeme za vašu správu | Jabcore',
    greeting: 'Dobrý deň',
    thankYou: 'Ďakujeme za vašu správu!',
    received: 'Vašu správu sme úspešne prijali a náš tím ju práve spracováva.',
    response: 'Odpovieme vám do 24 hodín v pracovné dni.',
    meanwhile: 'Medzitým sa môžete pozrieť na naše služby na',
    signature: 'S pozdravom',
  },
  pl: {
    subject: 'Dziękujemy za wiadomość | Jabcore',
    greeting: 'Dzień dobry',
    thankYou: 'Dziękujemy za wiadomość!',
    received: 'Otrzymaliśmy Twoją wiadomość i nasz zespół właśnie ją przetwarza.',
    response: 'Odpowiemy w ciągu 24 godzin w dni robocze.',
    meanwhile: 'W międzyczasie możesz sprawdzić nasze usługi na',
    signature: 'Z poważaniem',
  },
  fr: {
    subject: 'Merci pour votre message | Jabcore',
    greeting: 'Bonjour',
    thankYou: 'Merci pour votre message !',
    received: 'Nous avons bien reçu votre message et notre équipe le traite actuellement.',
    response: 'Nous vous répondrons dans les 24 heures ouvrables.',
    meanwhile: 'En attendant, vous pouvez consulter nos services sur',
    signature: 'Cordialement',
  },
  es: {
    subject: 'Gracias por su mensaje | Jabcore',
    greeting: 'Hola',
    thankYou: '¡Gracias por su mensaje!',
    received: 'Hemos recibido su mensaje y nuestro equipo lo está procesando.',
    response: 'Le responderemos en un plazo de 24 horas en días laborables.',
    meanwhile: 'Mientras tanto, puede consultar nuestros servicios en',
    signature: 'Saludos cordiales',
  },
  it: {
    subject: 'Grazie per il tuo messaggio | Jabcore',
    greeting: 'Ciao',
    thankYou: 'Grazie per il tuo messaggio!',
    received: 'Abbiamo ricevuto il tuo messaggio e il nostro team lo sta elaborando.',
    response: 'Ti risponderemo entro 24 ore nei giorni lavorativi.',
    meanwhile: 'Nel frattempo, puoi consultare i nostri servizi su',
    signature: 'Cordiali saluti',
  },
  nl: {
    subject: 'Bedankt voor uw bericht | Jabcore',
    greeting: 'Hallo',
    thankYou: 'Bedankt voor uw bericht!',
    received: 'We hebben uw bericht ontvangen en ons team verwerkt het momenteel.',
    response: 'We zullen binnen 24 uur op werkdagen reageren.',
    meanwhile: 'In de tussentijd kunt u onze diensten bekijken op',
    signature: 'Met vriendelijke groet',
  },
  pt: {
    subject: 'Obrigado pela sua mensagem | Jabcore',
    greeting: 'Olá',
    thankYou: 'Obrigado pela sua mensagem!',
    received: 'Recebemos a sua mensagem e a nossa equipa está a processá-la.',
    response: 'Responderemos em até 24 horas em dias úteis.',
    meanwhile: 'Entretanto, pode consultar os nossos serviços em',
    signature: 'Com os melhores cumprimentos',
  },
  hu: {
    subject: 'Köszönjük üzenetét | Jabcore',
    greeting: 'Üdvözöljük',
    thankYou: 'Köszönjük az üzenetét!',
    received: 'Sikeresen megkaptuk üzenetét, csapatunk éppen feldolgozza.',
    response: 'Munkanapokon 24 órán belül válaszolunk.',
    meanwhile: 'Addig is tekintse meg szolgáltatásainkat a',
    signature: 'Üdvözlettel',
  },
  ro: {
    subject: 'Vă mulțumim pentru mesaj | Jabcore',
    greeting: 'Bună ziua',
    thankYou: 'Vă mulțumim pentru mesajul dumneavoastră!',
    received: 'Am primit cu succes mesajul dumneavoastră și echipa noastră îl procesează.',
    response: 'Vă vom răspunde în termen de 24 de ore în zilele lucrătoare.',
    meanwhile: 'Între timp, puteți consulta serviciile noastre pe',
    signature: 'Cu stimă',
  },
}

const getAutoReplyTexts = (language: string) => {
  return autoReplyTexts[language] || autoReplyTexts.en
}

// Funkce pro odeslání emailu
export const sendContactEmail = async (data: ContactFormData): Promise<boolean> => {
  try {
    const year = new Date().getFullYear().toString()
    const texts = getAutoReplyTexts(data.language)
    
    // 1. Pošli notifikaci tobě
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        from_name: data.name,
        from_email: data.email,
        company: data.company || 'Neuvedeno',
        phone: data.phone,
        message: data.message,
        reply_to: data.email,
        year,
      }
    )

    // 2. Pošli auto-reply zákazníkovi
    if (response.status === 200) {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.autoReplyTemplateId,
        {
          to_name: data.name,
          to_email: data.email,
          subject: texts.subject,
          greeting: texts.greeting,
          thank_you: texts.thankYou,
          received: texts.received,
          response: texts.response,
          meanwhile: texts.meanwhile,
          signature: texts.signature,
          year,
        }
      )
    }

    return response.status === 200
  } catch (error) {
    console.error('EmailJS Error:', error)
    return false
  }
}
