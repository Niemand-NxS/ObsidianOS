import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

interface CloudSyncRecord {
  userId: string;
  encryptedPayload: string;
  iv: string;
  salt: string;
  checksum: string;
  version: number;
  timestamp: number;
  clientInfo?: string;
}

// In-memory cloud sync vault storage
const cloudSyncVault: Map<string, CloudSyncRecord> = new Map();
const syncHistory: Map<string, CloudSyncRecord[]> = new Map();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      os: "ObsidianOS Cloud Backend",
      version: "2.4.0",
      timestamp: Date.now(),
      vaultCount: cloudSyncVault.size,
    });
  });

  // Cloud Sync: Push encrypted vault data
  app.post("/api/sync/push", (req, res) => {
    try {
      const { userId, encryptedPayload, iv, salt, checksum, clientInfo } = req.body;

      if (!userId || !encryptedPayload) {
        return res.status(400).json({ error: "Missing required sync payload parameters (userId, encryptedPayload)" });
      }

      const existing = cloudSyncVault.get(userId);
      const version = existing ? existing.version + 1 : 1;
      const record: CloudSyncRecord = {
        userId,
        encryptedPayload,
        iv: iv || "",
        salt: salt || "",
        checksum: checksum || "",
        version,
        timestamp: Date.now(),
        clientInfo: clientInfo || "ObsidianOS Web Client",
      };

      cloudSyncVault.set(userId, record);

      // Keep last 10 history points for backup restore
      const userHistory = syncHistory.get(userId) || [];
      userHistory.unshift(record);
      if (userHistory.length > 10) userHistory.pop();
      syncHistory.set(userId, userHistory);

      return res.json({
        success: true,
        message: "Cloud-Synchronisation erfolgreich verschlüsselt gespeichert",
        version,
        timestamp: record.timestamp,
        payloadSize: encryptedPayload.length,
      });
    } catch (err: any) {
      console.error("Sync push error:", err);
      return res.status(500).json({ error: "Cloud sync push failed", details: err?.message });
    }
  });

  // Cloud Sync: Pull encrypted vault data
  app.get("/api/sync/pull/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const record = cloudSyncVault.get(userId);

      if (!record) {
        return res.status(404).json({
          found: false,
          message: "Keine Cloud-Sicherungsdaten für diesen Benutzer gefunden",
        });
      }

      return res.json({
        found: true,
        record,
      });
    } catch (err: any) {
      console.error("Sync pull error:", err);
      return res.status(500).json({ error: "Cloud sync pull failed", details: err?.message });
    }
  });

  // Cloud Sync: Get sync history & restore points
  app.get("/api/sync/history/:userId", (req, res) => {
    const { userId } = req.params;
    const history = syncHistory.get(userId) || [];
    res.json({
      userId,
      count: history.length,
      history: history.map((h) => ({
        version: h.version,
        timestamp: h.timestamp,
        size: h.encryptedPayload.length,
        checksum: h.checksum.substring(0, 12) + "...",
      })),
    });
  });

  // ==========================================
  // ObsidianOS Setup API: Countries
  // ==========================================
  const BASE_COUNTRIES = [
    { id: "de", name: "Deutschland", localName: "Deutschland", flag: "🇩🇪", lang: "de", kb: "de", currency: "EUR (€)", units: "metric", dateFormat: "DD.MM.YYYY" },
    { id: "at", name: "Österreich", localName: "Österreich", flag: "🇦🇹", lang: "de", kb: "de", currency: "EUR (€)", units: "metric", dateFormat: "DD.MM.YYYY" },
    { id: "ch", name: "Schweiz", localName: "Schweiz / Suisse", flag: "🇨🇭", lang: "de", kb: "ch", currency: "CHF", units: "metric", dateFormat: "DD.MM.YYYY" },
    { id: "us", name: "Vereinigte Staaten", localName: "United States", flag: "🇺🇸", lang: "en", kb: "us", currency: "USD ($)", units: "imperial", dateFormat: "MM/DD/YYYY" },
    { id: "gb", name: "Großbritannien", localName: "United Kingdom", flag: "🇬🇧", lang: "en", kb: "us", currency: "GBP (£)", units: "metric", dateFormat: "DD/MM/YYYY" },
    { id: "fr", name: "Frankreich", localName: "France", flag: "🇫🇷", lang: "fr", kb: "fr", currency: "EUR (€)", units: "metric", dateFormat: "DD/MM/YYYY" },
    { id: "es", name: "Spanien", localName: "España", flag: "🇪🇸", lang: "es", kb: "es", currency: "EUR (€)", units: "metric", dateFormat: "DD/MM/YYYY" },
    { id: "it", name: "Italien", localName: "Italia", flag: "🇮🇹", lang: "it", kb: "de", currency: "EUR (€)", units: "metric", dateFormat: "DD/MM/YYYY" },
    { id: "nl", name: "Niederlande", localName: "Nederland", flag: "🇳🇱", lang: "nl", kb: "us", currency: "EUR (€)", units: "metric", dateFormat: "DD-MM-YYYY" },
    { id: "se", name: "Schweden", localName: "Sverige", flag: "🇸🇪", lang: "sv", kb: "de", currency: "SEK (kr)", units: "metric", dateFormat: "YYYY-MM-DD" },
    { id: "jp", name: "Japan", localName: "日本", flag: "🇯🇵", lang: "ja", kb: "us", currency: "JPY (¥)", units: "metric", dateFormat: "YYYY/MM/DD" },
    { id: "ca", name: "Kanada", localName: "Canada", flag: "🇨🇦", lang: "en", kb: "us", currency: "CAD ($)", units: "metric", dateFormat: "YYYY-MM-DD" },
    { id: "br", name: "Brasilien", localName: "Brasil", flag: "🇧🇷", lang: "pt", kb: "us", currency: "BRL (R$)", units: "metric", dateFormat: "DD/MM/YYYY" },
    { id: "au", name: "Australien", localName: "Australia", flag: "🇦🇺", lang: "en", kb: "us", currency: "AUD ($)", units: "metric", dateFormat: "DD/MM/YYYY" },
    { id: "pl", name: "Polen", localName: "Polska", flag: "🇵🇱", lang: "pl", kb: "us", currency: "PLN (zł)", units: "metric", dateFormat: "DD.MM.YYYY" },
    { id: "dk", name: "Dänemark", localName: "Danmark", flag: "🇩🇰", lang: "da", kb: "de", currency: "DKK (kr)", units: "metric", dateFormat: "DD-MM-YYYY" },
    { id: "no", name: "Norwegen", localName: "Norge", flag: "🇳🇴", lang: "no", kb: "de", currency: "NOK (kr)", units: "metric", dateFormat: "DD.MM.YYYY" },
    { id: "fi", name: "Finnland", localName: "Suomi", flag: "🇫🇮", lang: "fi", kb: "de", currency: "EUR (€)", units: "metric", dateFormat: "DD.MM.YYYY" },
    { id: "pt", name: "Portugal", localName: "Portugal", flag: "🇵🇹", lang: "pt", kb: "es", currency: "EUR (€)", units: "metric", dateFormat: "DD/MM/YYYY" },
    { id: "cn", name: "China", localName: "中国", flag: "🇨🇳", lang: "zh", kb: "us", currency: "CNY (¥)", units: "metric", dateFormat: "YYYY-MM-DD" }
  ];

  app.get("/api/setup/countries", async (req, res) => {
    try {
      const search = ((req.query.search as string) || "").trim().toLowerCase();
      let results = [...BASE_COUNTRIES];

      if (search) {
        results = results.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.localName.toLowerCase().includes(search) ||
            c.id.toLowerCase().includes(search)
        );
      }

      res.json({
        success: true,
        source: "ObsidianOS Country Directory API",
        count: results.length,
        countries: results,
      });
    } catch (err: any) {
      console.error("Countries API Error:", err);
      res.status(500).json({ error: "Fehler beim Laden der Länder", details: err?.message });
    }
  });

  // ==========================================
  // ObsidianOS Setup API: Translations
  // ==========================================
  const TRANSLATION_DICTIONARY: Record<string, Record<string, string>> = {
    en: {
      "ObsidianOS Setup-Assistent": "ObsidianOS Setup Assistant",
      "ObsidianOS starten": "Start ObsidianOS",
      "Fortfahren": "Continue",
      "Zurück": "Back",
      "Überspringen": "Skip",
      "Land, Region & Tastatur": "Country, Region & Keyboard",
      "Wähle dein Land oder deine bevorzugte Region": "Choose your country or preferred region",
      "Land & Region": "Country & Region",
      "Länder durchsuchen...": "Search countries...",
      "Tastaturlayout": "Keyboard Layout",
      "Währung": "Currency",
      "Einheiten": "Units",
      "Metrisch (km, °C)": "Metric (km, °C)",
      "Angloamerikanisch (mi, °F)": "Imperial (mi, °F)",
      "Datumsformat": "Date Format",
      "Barrierefreiheit": "Accessibility",
      "Passe ObsidianOS an deine individuellen Bedürfnisse an": "Customize ObsidianOS to your individual needs",
      "Spracheingabe & Diktierfunktion": "Voice Input & Dictation",
      "Diktieren von Texten in allen Apps per Mikrofon oder Tastenkombination (Fn+D)": "Dictate text in all apps via microphone or shortcut (Fn+D)",
      "Sehschärfe": "Visuals",
      "Schriftgröße und Icons um 20% vergrößern": "Enlarge font size and icons by 20%",
      "Hoher Kontrast": "High Contrast",
      "Intensivere Rahmen und stärkere Trennlinien": "Intensified borders and stronger dividers",
      "Bewegung reduzieren": "Reduce Motion",
      "Reduziert Fenstereffekte und Parallaxen": "Reduces window effects and parallax",
      "Farben invertieren": "Invert Colors",
      "Displayfarben zur besseren Lesbarkeit umkehren": "Invert display colors for improved readability",
      "WLAN & Netzwerk": "Wi-Fi & Network",
      "Verbinde dich mit dem Internet, um Updates und Synchronisation zu aktivieren": "Connect to the Internet to enable updates and cloud sync",
      "Daten übertragen": "Transfer Data",
      "Wähle, wie du deine Daten und Apps auf dieses System übertragen möchtest": "Choose how you want to transfer your data and apps to this system",
      "Benutzerkonto & Sicherheit": "User Account & Security",
      "Erstelle deinen lokalen Benutzeraccount für ObsidianOS": "Create your local user account for ObsidianOS",
      "Optic ID & Biometrie": "Optic ID & Biometrics",
      "Richte die Gesichtserkennung für sekundenschnelles Entsperren ein": "Set up facial recognition for instant unlocking",
      "Dienste & Analyse": "Services & Analytics",
      "Konfiguriere optionale Systemdienste und Datenschutzeinstellungen": "Configure optional system services and privacy settings",
      "Erscheinungsbild": "Appearance",
      "Personalisiere deinen Desktop mit Farb- und Oberflächendesigns": "Personalize your desktop with color and surface themes",
      "Lizenzbestimmungen zustimmen": "I agree to the License Terms",
      "Ich akzeptiere die ObsidianOS Endbenutzer-Lizenzvereinbarung (EULA) und die Datenschutzrichtlinien.": "I accept the ObsidianOS End User License Agreement (EULA) and Privacy Policy.",
      "Lizenzvertrag lesen": "Read License Agreement",
      "Bitte stimme den Lizenzbestimmungen zu, um fortzufahren.": "Please accept the license terms to continue.",
      "Vollständiger Name": "Full Name",
      "Benutzername": "Username",
      "Passwort": "Password",
      "Passwort bestätigen": "Confirm Password",
      "Direkt anmelden": "Sign In Directly",
      "System synchronisieren": "Synchronize System",
      "Farbschema": "Color Scheme",
      "Dunkel": "Dark",
      "Hell": "Light",
      "Milchglas": "Glassy",
      "Akzentfarbe": "Accent Color",
      "Hintergrundbild": "Wallpaper",
      "ObsidianOS ist einsatzbereit": "ObsidianOS is ready to use",
      "Klicke auf den Button, um dein neues System zu starten.": "Click the button to start your new system."
    },
    fr: {
      "ObsidianOS Setup-Assistent": "Assistant d'installation ObsidianOS",
      "ObsidianOS starten": "Démarrer ObsidianOS",
      "Fortfahren": "Continuer",
      "Zurück": "Retour",
      "Überspringen": "Ignorer",
      "Land, Region & Tastatur": "Pays, Région & Clavier",
      "Wähle dein Land oder deine bevorzugte Region": "Choisissez votre pays ou région préférée",
      "Land & Region": "Pays & Région",
      "Länder durchsuchen...": "Rechercher des pays...",
      "Tastaturlayout": "Disposition du clavier",
      "Währung": "Devise",
      "Einheiten": "Unités",
      "Metrisch (km, °C)": "Métrique (km, °C)",
      "Angloamerikanisch (mi, °F)": "Impérial (mi, °F)",
      "Datumsformat": "Format de date",
      "Barrierefreiheit": "Accessibilité",
      "Passe ObsidianOS an deine individuellen Bedürfnisse an": "Adaptez ObsidianOS à vos besoins spécifiques",
      "Spracheingabe & Diktierfunktion": "Saisie vocale & Dictée",
      "Diktieren von Texten in allen Apps per Mikrofon oder Tastenkombination (Fn+D)": "Dicter du texte dans toutes les applications par micro ou raccourci (Fn+D)",
      "Sehschärfe": "Vision",
      "Schriftgröße und Icons um 20% vergrößern": "Agrandir la police et les icônes de 20%",
      "Hoher Kontrast": "Contraste élevé",
      "Intensivere Rahmen und stärkere Trennlinien": "Bordures plus intenses et lignes de séparation nettes",
      "Bewegung reduzieren": "Réduire les animations",
      "Reduziert Fenstereffekte und Parallaxen": "Réduit les effets de fenêtre et parallaxe",
      "Farben invertieren": "Inverser les couleurs",
      "Displayfarben zur besseren Lesbarkeit umkehren": "Inverser les couleurs pour une meilleure lisibilité",
      "WLAN & Netzwerk": "Wi-Fi & Réseau",
      "Verbinde dich mit dem Internet, um Updates und Synchronisation zu aktivieren": "Connectez-vous à Internet pour activer les mises à jour et la synchro",
      "Daten übertragen": "Transférer des données",
      "Wähle, wie du deine Daten und Apps auf dieses System übertragen möchtest": "Choisissez comment transférer vos données et applications",
      "Benutzerkonto & Sicherheit": "Compte utilisateur & Sécurité",
      "Erstelle deinen lokalen Benutzeraccount für ObsidianOS": "Créez votre compte utilisateur local pour ObsidianOS",
      "Optic ID & Biometrie": "Optic ID & Biométrie",
      "Richte die Gesichtserkennung für sekundenschnelles Entsperren ein": "Configurez la reconnaissance faciale pour un déverrouillage instantané",
      "Dienste & Analyse": "Services & Confidentialité",
      "Konfiguriere optionale Systemdienste und Datenschutzeinstellungen": "Configurez les services système et la confidentialité",
      "Erscheinungsbild": "Apparence",
      "Personalisiere deinen Desktop mit Farb- und Oberflächendesigns": "Personnalisez votre bureau avec vos couleurs et thèmes",
      "Lizenzbestimmungen zustimmen": "J'accepte les conditions de licence",
      "Ich akzeptiere die ObsidianOS Endbenutzer-Lizenzvereinbarung (EULA) und die Datenschutzrichtlinien.": "J'accepte le contrat de licence utilisateur final (CLUF) et la politique de confidentialité.",
      "Lizenzvertrag lesen": "Lire le contrat de licence",
      "Bitte stimme den Lizenzbestimmungen zu, um fortzufahren.": "Veuillez accepter les termes de licence pour continuer.",
      "Vollständiger Name": "Nom complet",
      "Benutzername": "Nom d'utilisateur",
      "Passwort": "Mot de passe",
      "Passwort bestätigen": "Confirmer le mot de passe",
      "Direkt anmelden": "Connexion directe",
      "System synchronisieren": "Synchroniser le système",
      "Farbschema": "Thème de couleurs",
      "Dunkel": "Sombre",
      "Hell": "Clair",
      "Milchglas": "Verre dépoli",
      "Akzentfarbe": "Couleur d'accent",
      "Hintergrundbild": "Fond d'écran",
      "ObsidianOS ist einsatzbereit": "ObsidianOS est prêt",
      "Klicke auf den Button, um dein neues System zu starten.": "Cliquez sur le bouton pour lancer votre nouveau système."
    },
    es: {
      "ObsidianOS Setup-Assistent": "Asistente de configuración de ObsidianOS",
      "ObsidianOS starten": "Iniciar ObsidianOS",
      "Fortfahren": "Continuar",
      "Zurück": "Atrás",
      "Überspringen": "Omitir",
      "Land, Region & Tastatur": "País, Región y Teclado",
      "Wähle dein Land oder deine bevorzugte Region": "Elige tu país o región preferida",
      "Land & Region": "País y Región",
      "Länder durchsuchen...": "Buscar países...",
      "Tastaturlayout": "Distribución del teclado",
      "Währung": "Moneda",
      "Einheiten": "Unidades",
      "Metrisch (km, °C)": "Métrico (km, °C)",
      "Angloamerikanisch (mi, °F)": "Imperial (mi, °F)",
      "Datumsformat": "Formato de fecha",
      "Barrierefreiheit": "Accesibilidad",
      "Passe ObsidianOS an deine individuellen Bedürfnisse an": "Adapta ObsidianOS a tus necesidades individuales",
      "Spracheingabe & Diktierfunktion": "Entrada de voz y Dictado",
      "Diktieren von Texten in allen Apps per Mikrofon oder Tastenkombination (Fn+D)": "Dictado de texto en todas las apps con micrófono o atajo (Fn+D)",
      "Sehschärfe": "Visión",
      "Schriftgröße und Icons um 20% vergrößern": "Aumentar tamaño de fuente e iconos un 20%",
      "Hoher Kontrast": "Alto contraste",
      "Intensivere Rahmen und stärkere Trennlinien": "Bordes más intensos y líneas divisorias marcadas",
      "Bewegung reduzieren": "Reducir movimiento",
      "Reduziert Fenstereffekte und Parallaxen": "Reduce efectos de ventana y paralaje",
      "Farben invertieren": "Invertir colores",
      "Displayfarben zur besseren Lesbarkeit umkehren": "Invertir colores para mejorar la legibilidad",
      "WLAN & Netzwerk": "Wi-Fi y Red",
      "Verbinde dich mit dem Internet, um Updates und Synchronisation zu aktivieren": "Conéctate a Internet para habilitar actualizaciones y sincronización",
      "Daten übertragen": "Transferir datos",
      "Wähle, wie du deine Daten und Apps auf dieses System übertragen möchtest": "Elige cómo transferir tus datos y apps a este sistema",
      "Benutzerkonto & Sicherheit": "Cuenta de usuario y Seguridad",
      "Erstelle deinen lokalen Benutzeraccount für ObsidianOS": "Crea tu cuenta de usuario local para ObsidianOS",
      "Optic ID & Biometrie": "Optic ID y Biometría",
      "Richte die Gesichtserkennung für sekundenschnelles Entsperren ein": "Configura el reconocimiento facial para desbloquear al instante",
      "Dienste & Analyse": "Servicios y Privacidad",
      "Konfiguriere optionale Systemdienste und Datenschutzeinstellungen": "Configura servicios del sistema y privacidad opcionales",
      "Erscheinungsbild": "Apariencia",
      "Personalisiere deinen Desktop mit Farb- und Oberflächendesigns": "Personaliza tu escritorio con colores y temas",
      "Lizenzbestimmungen zustimmen": "Acepto los términos de la licencia",
      "Ich akzeptiere die ObsidianOS Endbenutzer-Lizenzvereinbarung (EULA) und die Datenschutzrichtlinien.": "Acepto el Acuerdo de Licencia de Usuario Final (EULA) y la Política de Privacidad de ObsidianOS.",
      "Lizenzvertrag lesen": "Leer acuerdo de licencia",
      "Bitte stimme den Lizenzbestimmungen zu, um fortzufahren.": "Por favor, acepta los términos de licencia para continuar.",
      "Vollständiger Name": "Nombre completo",
      "Benutzername": "Nombre de usuario",
      "Passwort": "Contraseña",
      "Passwort bestätigen": "Confirmar contraseña",
      "Direkt anmelden": "Iniciar sesión",
      "System synchronisieren": "Sincronizar sistema",
      "Farbschema": "Tema de color",
      "Dunkel": "Oscuro",
      "Hell": "Claro",
      "Milchglas": "Vidrio esmerilado",
      "Akzentfarbe": "Color de acento",
      "Hintergrundbild": "Fondo de pantalla",
      "ObsidianOS ist einsatzbereit": "ObsidianOS está listo",
      "Klicke auf den Button, um dein neues System zu starten.": "Haz clic en el botón para iniciar tu nuevo sistema."
    },
    it: {
      "ObsidianOS Setup-Assistent": "Assistente di configurazione ObsidianOS",
      "ObsidianOS starten": "Avvia ObsidianOS",
      "Fortfahren": "Continua",
      "Zurück": "Indietro",
      "Überspringen": "Salta",
      "Land, Region & Tastatur": "Paese, Regione e Tastiera",
      "Wähle dein Land oder deine bevorzugte Region": "Scegli il tuo paese o la regione preferita",
      "Land & Region": "Paese e Regione",
      "Länder durchsuchen...": "Cerca paesi...",
      "Tastaturlayout": "Layout tastiera",
      "Währung": "Valuta",
      "Einheiten": "Unità",
      "Metrisch (km, °C)": "Metrico (km, °C)",
      "Angloamerikanisch (mi, °F)": "Imperiale (mi, °F)",
      "Datumsformat": "Formato data",
      "Barrierefreiheit": "Accessibilità",
      "Passe ObsidianOS an deine individuellen Bedürfnisse an": "Personalizza ObsidianOS per le tue esigenze",
      "Spracheingabe & Diktierfunktion": "Dettatura vocale",
      "Diktieren von Texten in allen Apps per Mikrofon oder Tastenkombination (Fn+D)": "Detta testo in tutte le app tramite microfono o scorciatoia (Fn+D)",
      "Sehschärfe": "Vista",
      "Schriftgröße und Icons um 20% vergrößern": "Ingrandisci testo e icone del 20%",
      "Hoher Kontrast": "Contrasto elevato",
      "Intensivere Rahmen und stärkere Trennlinien": "Bordi e divisori più visibili",
      "Bewegung reduzieren": "Riduci movimento",
      "Reduziert Fenstereffekte und Parallaxen": "Riduce gli effetti e il parallasse delle finestre",
      "Farben invertieren": "Inverti colori",
      "Displayfarben zur besseren Lesbarkeit umkehren": "Inverti i colori per migliorare la leggibilità",
      "WLAN & Netzwerk": "Wi-Fi e Rete",
      "Verbinde dich mit dem Internet, um Updates und Synchronisation zu aktivieren": "Connettiti a Internet per abilitare aggiornamenti e sync",
      "Daten übertragen": "Trasferisci dati",
      "Wähle, wie du deine Daten und Apps auf dieses System übertragen möchtest": "Scegli come trasferire dati e app su questo sistema",
      "Benutzerkonto & Sicherheit": "Account utente e Sicurezza",
      "Erstelle deinen lokalen Benutzeraccount für ObsidianOS": "Crea il tuo account locale per ObsidianOS",
      "Optic ID & Biometrie": "Optic ID e Biometria",
      "Richte die Gesichtserkennung für sekundenschnelles Entsperren ein": "Imposta il riconoscimento facciale per lo sblocco immediato",
      "Dienste & Analyse": "Servizi e Privacy",
      "Konfiguriere optionale Systemdienste und Datenschutzeinstellungen": "Configura le preferenze di privacy e i servizi",
      "Erscheinungsbild": "Aspetto",
      "Personalisiere deinen Desktop mit Farb- und Oberflächendesigns": "Personalizza il desktop con temi e colori",
      "Lizenzbestimmungen zustimmen": "Accetto i termini di licenza",
      "Ich akzeptiere die ObsidianOS Endbenutzer-Lizenzvereinbarung (EULA) und die Datenschutzrichtlinien.": "Accetto il Contratto di Licenza con l'Utente Finale (EULA) e l'Informativa sulla Privacy.",
      "Lizenzvertrag lesen": "Leggi accordo di licenza",
      "Bitte stimme den Lizenzbestimmungen zu, um fortzufahren.": "Accetta i termini di licenza per proseguire.",
      "Vollständiger Name": "Nome completo",
      "Benutzername": "Nome utente",
      "Passwort": "Password",
      "Passwort bestätigen": "Conferma password",
      "Direkt anmelden": "Accedi direttamente",
      "System synchronisieren": "Sincronizza sistema",
      "Farbschema": "Tema colore",
      "Dunkel": "Scuro",
      "Hell": "Chiaro",
      "Milchglas": "Vetro satinato",
      "Akzentfarbe": "Colore accento",
      "Hintergrundbild": "Sfondo",
      "ObsidianOS ist einsatzbereit": "ObsidianOS è pronto",
      "Klicke auf den Button, um dein neues System zu starten.": "Clicca sul pulsante per avviare il tuo sistema."
    }
  };

  app.post("/api/translate", async (req, res) => {
    try {
      const { texts, targetLang, sourceLang = "de" } = req.body;
      if (!texts || !targetLang) {
        return res.status(400).json({ error: "Missing 'texts' or 'targetLang' in request body." });
      }

      const langCode = targetLang.toLowerCase().slice(0, 2);

      // If target is German (base language), return as-is
      if (langCode === "de") {
        return res.json({ success: true, translations: texts, targetLang: "de", source: "original" });
      }

      // Check dictionary first
      const dict = TRANSLATION_DICTIONARY[langCode];
      let translated: Record<string, string> = {};

      if (typeof texts === "object" && !Array.isArray(texts)) {
        let allFound = true;
        for (const [key, val] of Object.entries(texts)) {
          if (dict && dict[val as string]) {
            translated[key] = dict[val as string];
          } else {
            allFound = false;
            translated[key] = (val as string);
          }
        }

        // If some strings were missing from dictionary and Gemini is available, call Gemini API
        const ai = getGeminiClient();
        if (!allFound && ai && process.env.GEMINI_API_KEY) {
          const prompt = `You are an OS localization translation engine. Translate the following JSON key-value pairs from ${sourceLang} to language code '${langCode}'. Keep keys identical and return ONLY valid JSON: ${JSON.stringify(texts)}`;
          const candidateModels = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest"];
          for (const model of candidateModels) {
            try {
              const response = await ai.models.generateContent({
                model,
                contents: prompt,
              });
              const textOut = response.text || "";
              const jsonMatch = textOut.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                translated = { ...translated, ...parsed };
                break;
              }
            } catch (aiErr) {
              console.warn(`Gemini (${model}) translate failed, trying next model:`, aiErr);
            }
          }
        }

        return res.json({ success: true, translations: translated, targetLang: langCode, source: "api" });
      } else if (typeof texts === "string") {
        const trans = dict?.[texts] || texts;
        return res.json({ success: true, translation: trans, targetLang: langCode });
      } else if (Array.isArray(texts)) {
        const arr = texts.map((t) => dict?.[t] || t);
        return res.json({ success: true, translations: arr, targetLang: langCode });
      }

      res.json({ success: true, translations: texts });
    } catch (err: any) {
      console.error("Translation API Error:", err);
      res.status(500).json({ error: "Translation failed", details: err?.message });
    }
  });

  // Safe Web Proxy Endpoint for the OS Web Browser
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("Parameter 'url' is required.");
    }

    try {
      let formattedUrl = targetUrl;
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = "https://" + formattedUrl;
      }

      const parsed = new URL(formattedUrl);
      // Disallow local loopback access
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname.startsWith("192.168.")) {
        return res.status(403).send("Zugriff auf lokale Netzwerkadressen blockiert.");
      }

      const response = await fetch(formattedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 ObsidianOS/2.4",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        },
      });

      const contentType = response.headers.get("content-type") || "text/html";
      res.setHeader("Content-Type", contentType);
      res.setHeader("X-Frame-Options", "ALLOWALL");

      if (contentType.includes("text/html")) {
        let html = await response.text();
        // Rewrite base href so relative links and assets load properly
        const baseTag = `<base href="${parsed.origin}${parsed.pathname}">`;
        if (html.includes("<head>")) {
          html = html.replace("<head>", `<head>${baseTag}`);
        } else if (html.includes("<HEAD>")) {
          html = html.replace("<HEAD>", `<HEAD>${baseTag}`);
        } else {
          html = baseTag + html;
        }
        return res.send(html);
      } else {
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    } catch (err: any) {
      console.error("Proxy fetch error:", err);
      return res.status(502).json({
        error: "Webseite konnte nicht geladen werden",
        details: err?.message || "Netzwerkfehler oder blockierte Anfrage",
      });
    }
  });

  // ==========================================
  // YouTube Data API v3 Secure Server-side Proxy
  // ==========================================
  const getYouTubeKey = (req?: express.Request): string => {
    const customHeaderKey = req?.headers["x-youtube-api-key"] as string | undefined;
    const queryKey = req?.query?.apiKey as string | undefined;
    if (customHeaderKey && customHeaderKey.trim()) return customHeaderKey.trim();
    if (queryKey && queryKey.trim()) return queryKey.trim();
    return process.env.YOUTUBE_API_KEY || "AIzaSyDzIw-FDjiwKxSfOc1IGcS08VdgOtfOiZg";
  };

  // Helper to diagnose YouTube API errors
  const parseYouTubeError = (status: number, data: any) => {
    const errObj = data?.error || {};
    const message = errObj.message || "Unbekannter YouTube API-Fehler";
    const reason = errObj.errors?.[0]?.reason || "";
    const isInvalidKey =
      status === 400 ||
      status === 401 ||
      reason === "keyInvalid" ||
      reason === "badRequest" ||
      message.toLowerCase().includes("api key not valid") ||
      message.toLowerCase().includes("api_key_invalid");
    const isQuotaExceeded =
      status === 403 &&
      (reason === "quotaExceeded" ||
        reason === "dailyLimitExceeded" ||
        message.toLowerCase().includes("quota") ||
        message.toLowerCase().includes("limit"));
    const isForbidden =
      status === 403 &&
      (reason === "accessNotConfigured" ||
        reason === "ipRefererBlocked" ||
        message.toLowerCase().includes("not enabled"));

    return {
      status,
      message,
      reason,
      isInvalidKey,
      isQuotaExceeded,
      isForbidden,
    };
  };

  // Helper: Enrich raw video items with channel avatars & thumbnails
  async function enrichItemsWithChannelAvatars(items: any[], apiKey: string) {
    if (!items || items.length === 0 || !apiKey) return items;
    try {
      const channelIds = Array.from(
        new Set(
          items
            .map((item: any) => item.snippet?.channelId || item.channelId)
            .filter(Boolean)
        )
      );

      if (channelIds.length === 0) return items;

      const avatarMap = new Map<string, string>();
      // Batch in chunks of up to 50 channel IDs
      for (let i = 0; i < channelIds.length; i += 50) {
        const chunk = channelIds.slice(i, i + 50).join(",");
        const chRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(
            chunk
          )}&key=${apiKey}`
        );
        if (chRes.ok) {
          const chData = await chRes.json();
          for (const ch of chData.items || []) {
            const avatar =
              ch.snippet?.thumbnails?.medium?.url ||
              ch.snippet?.thumbnails?.default?.url ||
              ch.snippet?.thumbnails?.high?.url;
            if (avatar) {
              avatarMap.set(ch.id, avatar);
            }
          }
        }
      }

      return items.map((item: any) => {
        const cId = item.snippet?.channelId || item.channelId;
        const avatar = cId ? avatarMap.get(cId) : undefined;
        return {
          ...item,
          channelAvatarUrl: avatar || item.channelAvatarUrl || undefined,
        };
      });
    } catch (e) {
      console.warn("Could not enrich items with channel avatars:", e);
      return items;
    }
  }

  // 0. Test YouTube API Key
  app.post("/api/youtube/test-key", async (req, res) => {
    try {
      const testKey = (req.body?.apiKey as string)?.trim() || getYouTubeKey(req);
      if (!testKey) {
        return res.status(400).json({
          valid: false,
          error: "Kein API-Key angegeben",
          message: "Bitte gib einen YouTube API-Key ein.",
        });
      }

      const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${encodeURIComponent(
        testKey
      )}`;
      const response = await fetch(testUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(200).json({
          valid: false,
          diagnostics: diag,
          error: diag.message,
          status: response.status,
        });
      }

      return res.json({
        valid: true,
        message: "YouTube API-Key ist gültig und einsatzbereit!",
        videoSample: data.items?.[0]?.snippet?.title || "OK",
      });
    } catch (err: any) {
      return res.status(500).json({
        valid: false,
        error: "Verbindungsfehler",
        message: err?.message || "Fehler beim Testen des API-Keys",
      });
    }
  });

  // 1. Trending / Most Popular Videos
  app.get("/api/youtube/trending", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const regionCode = (req.query.regionCode as string) || "DE";
      const maxResults = Math.min(50, parseInt((req.query.maxResults as string) || "24", 10));
      const videoCategoryId = req.query.videoCategoryId as string;

      let apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=${encodeURIComponent(
        regionCode
      )}&maxResults=${maxResults}&key=${apiKey}`;

      if (videoCategoryId && videoCategoryId !== "0") {
        apiUrl += `&videoCategoryId=${encodeURIComponent(videoCategoryId)}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      if (data.items && data.items.length > 0) {
        data.items = await enrichItemsWithChannelAvatars(data.items, apiKey);
      }

      return res.json(data);
    } catch (err: any) {
      console.error("YouTube Trending Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden von Trending-Videos", details: err?.message });
    }
  });

  // 2. Search Videos, Channels & Playlists
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const query = (req.query.q as string) || "";
      const maxResults = Math.min(50, parseInt((req.query.maxResults as string) || "24", 10));
      const order = (req.query.order as string) || "relevance";
      const pageToken = (req.query.pageToken as string) || "";

      if (!query.trim()) {
        return res.status(400).json({ error: "Suchbegriff (q) ist erforderlich." });
      }

      let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=${maxResults}&order=${encodeURIComponent(order)}&key=${apiKey}`;

      if (pageToken) {
        searchUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchRes.ok) {
        const diag = parseYouTubeError(searchRes.status, searchData);
        return res.status(searchRes.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: searchData,
        });
      }

      const videoIds = (searchData.items || [])
        .map((item: any) => item.id?.videoId)
        .filter(Boolean)
        .join(",");

      // Fetch statistics and contentDetails for search results
      if (videoIds) {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          const detailsMap = new Map((detailsData.items || []).map((v: any) => [v.id, v]));

          const enrichedItems = searchData.items.map((item: any) => {
            const vId = item.id?.videoId;
            const full = detailsMap.get(vId);
            return full || item;
          });

          searchData.items = await enrichItemsWithChannelAvatars(enrichedItems, apiKey);
          return res.json(searchData);
        }
      }

      if (searchData.items && searchData.items.length > 0) {
        searchData.items = await enrichItemsWithChannelAvatars(searchData.items, apiKey);
      }

      return res.json(searchData);
    } catch (err: any) {
      console.error("YouTube Search Error:", err);
      return res.status(500).json({ error: "Fehler bei der YouTube Suche", details: err?.message });
    }
  });

  // 3. Single Video Details & Statistics
  app.get("/api/youtube/video/:id", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const { id } = req.params;

      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(
        id
      )}&key=${apiKey}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ error: "Video nicht gefunden" });
      }

      const enriched = await enrichItemsWithChannelAvatars([data.items[0]], apiKey);
      return res.json(enriched[0]);
    } catch (err: any) {
      console.error("YouTube Video Detail Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden des Videos", details: err?.message });
    }
  });

  // 4. Video Comments
  app.get("/api/youtube/comments/:id", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const { id } = req.params;
      const maxResults = Math.min(50, parseInt((req.query.maxResults as string) || "20", 10));

      const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(
        id
      )}&maxResults=${maxResults}&order=relevance&key=${apiKey}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      return res.json(data);
    } catch (err: any) {
      console.error("YouTube Comments Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden der Kommentare", details: err?.message });
    }
  });

  // 5. Channel Details (Avatar, Banner, Statistics, Description)
  app.get("/api/youtube/channel/:id", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const { id } = req.params;

      let channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${encodeURIComponent(
        id
      )}&key=${apiKey}`;

      let response = await fetch(channelUrl);
      let data = await response.json();

      // If not found by ID, try searching by handle/custom URL
      if ((!data.items || data.items.length === 0) && id.startsWith("@")) {
        const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&forHandle=${encodeURIComponent(
          id
        )}&key=${apiKey}`;
        const handleRes = await fetch(handleUrl);
        if (handleRes.ok) {
          const handleData = await handleRes.json();
          if (handleData.items && handleData.items.length > 0) {
            data = handleData;
          }
        }
      }

      if (!response.ok && (!data.items || data.items.length === 0)) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status || 404).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      const item = data.items?.[0];
      if (!item) {
        return res.status(404).json({ error: "Kanal nicht gefunden" });
      }

      const snippet = item.snippet || {};
      const stats = item.statistics || {};
      const branding = item.brandingSettings || {};

      const channelObj = {
        id: item.id,
        title: snippet.title || "YouTube Kanal",
        description: snippet.description || "",
        customUrl: snippet.customUrl || `@${(snippet.title || "channel").toLowerCase().replace(/\s+/g, "")}`,
        publishedAt: snippet.publishedAt || "",
        avatarUrl:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          "",
        bannerUrl:
          branding.image?.bannerExternalUrl ||
          branding.image?.bannerTvHighImageUrl ||
          branding.image?.bannerMobileHdImageUrl ||
          undefined,
        subscriberCount: stats.subscriberCount || undefined,
        videoCount: stats.videoCount || undefined,
        viewCount: stats.viewCount || undefined,
        country: snippet.country || undefined,
      };

      return res.json(channelObj);
    } catch (err: any) {
      console.error("YouTube Channel Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden des Kanals", details: err?.message });
    }
  });

  // 6. Channel Latest Videos & Playlists
  app.get("/api/youtube/channel-videos/:id", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const { id } = req.params;
      const maxResults = Math.min(50, parseInt((req.query.maxResults as string) || "30", 10));

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
        id
      )}&order=date&type=video&maxResults=${maxResults}&key=${apiKey}`;

      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      const videoIds = (data.items || [])
        .map((item: any) => item.id?.videoId)
        .filter(Boolean)
        .join(",");

      if (videoIds) {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          const detailsMap = new Map((detailsData.items || []).map((v: any) => [v.id, v]));

          const enrichedItems = data.items.map((item: any) => {
            const vId = item.id?.videoId;
            const full = detailsMap.get(vId);
            return full || item;
          });

          data.items = await enrichItemsWithChannelAvatars(enrichedItems, apiKey);
          return res.json(data);
        }
      }

      if (data.items && data.items.length > 0) {
        data.items = await enrichItemsWithChannelAvatars(data.items, apiKey);
      }

      return res.json(data);
    } catch (err: any) {
      console.error("YouTube Channel Videos Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden der Kanal-Videos", details: err?.message });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ObsidianOS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
