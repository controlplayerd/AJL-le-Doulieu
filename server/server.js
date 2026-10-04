const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const NOTIFICATION_EMAIL = 'ajlledoulieu@gmail.com';
const PHOTO_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const PHOTO_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, '../data'));
const photoDir = path.resolve(process.env.PHOTO_DIR || path.join(__dirname, '../photo'));
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT doit être un entier compris entre 1 et 65535.');
}
const photoExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const photoAccessSalt = Buffer.from('uTSXYJou5XOjRnTzUH/NwA==', 'base64');
const photoAccessHash = Buffer.from('t/tsD1yBibg7gY5iQEknxP0lMr12KABQEoWDCXYUn/E=', 'base64');
const photoSessions = new Map();

// Middleware
app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProduction && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(express.static(path.join(__dirname, '../public')));

function getPhotoSessionToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)photo_access=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function requirePhotoAccess(req, res, next) {
  const token = getPhotoSessionToken(req);
  const expiresAt = token && photoSessions.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    if (token) photoSessions.delete(token);
    return res.status(401).json({ success: false, message: 'Accès à la galerie non autorisé.' });
  }
  next();
}

function isPhotoPasswordValid(password) {
  if (typeof password !== 'string' || !password) return false;
  const candidate = crypto.pbkdf2Sync(password, photoAccessSalt, 240000, 32, 'sha256');
  return crypto.timingSafeEqual(candidate, photoAccessHash);
}

async function sendNotificationEmail({ subject, text, replyTo }) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('La configuration SMTP est absente.');
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || user,
    to: process.env.MAIL_TO || NOTIFICATION_EMAIL,
    replyTo,
    subject,
    text
  });
}

// Fichiers de données
const animatorsFile = path.join(dataDir, 'animators.json');
const planningFile = path.join(dataDir, 'planning.json');

function listGalleryPhotos() {
  fs.mkdirSync(photoDir, { recursive: true });
  const now = Date.now();
  const photos = [];

  fs.readdirSync(photoDir, { withFileTypes: true }).forEach(entry => {
    if (!entry.isFile() || !photoExtensions.has(path.extname(entry.name).toLowerCase())) return;

    const photoPath = path.join(photoDir, entry.name);
    const stats = fs.statSync(photoPath);
    const addedAt = stats.birthtimeMs > 0 ? stats.birthtimeMs : stats.mtimeMs;
    const expiresAt = addedAt + PHOTO_RETENTION_MS;

    if (now >= expiresAt) {
      fs.unlinkSync(photoPath);
      return;
    }

    photos.push({
      fileName: entry.name,
      date: new Date(addedAt).toISOString().split('T')[0],
      expiresAt: new Date(expiresAt).toISOString()
    });
  });

  return photos;
}

function cleanupExpiredPhotos() {
  try {
    listGalleryPhotos();
  } catch (error) {
    console.error('Erreur lors du nettoyage des photos expirées:', error);
  }
}

// Initialiser les fichiers de données
function initializeDataFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(animatorsFile)) {
    const defaultAnimators = isProduction ? [] : [
      {
        id: 1,
        name: 'Sophie Martin',
        role: 'Directrice',
        photo: '/assets/images/placeholder-1.jpg'
      },
      {
        id: 2,
        name: 'Jean Dupont',
        role: 'Animateur principal',
        photo: '/assets/images/placeholder-2.jpg'
      },
      {
        id: 3,
        name: 'Marie Lefevre',
        role: 'Animatrice',
        photo: '/assets/images/placeholder-3.jpg'
      },
      {
        id: 4,
        name: 'Claude Bernard',
        role: 'Animateur',
        photo: '/assets/images/placeholder-4.jpg'
      }
    ];
    fs.writeFileSync(animatorsFile, JSON.stringify(defaultAnimators, null, 2));
  }

  if (!fs.existsSync(planningFile)) {
    const defaultPlanning = {
      week: isProduction ? '' : '2024-01-22',
      activities: [
        ...(isProduction ? [] : [
          { day: 'Lundi', time: '9h-12h', activity: 'Ateliers créatifs' },
          { day: 'Mardi', time: '9h-12h', activity: 'Sports et jeux collectifs' },
          { day: 'Mercredi', time: '9h-17h', activity: 'Excursion à la nature' },
          { day: 'Jeudi', time: '9h-12h', activity: 'Musique et danse' },
          { day: 'Vendredi', time: '9h-12h', activity: 'Jeux d\'équipe et cohésion' }
        ])
      ],
      canteenMenu: isProduction ? { week: '', days: [] } : {
        week: 'Semaine du 19 au 23 octobre 2026',
        days: [
          { day: 'Lundi', date: '19 octobre', starter: 'Céleri rémoulade', main: 'Blanquette de poisson MSC', accompaniments: 'Riz, sauce', dessert: 'Yaourt' },
          { day: 'Mardi', date: '20 octobre', starter: 'Coleslaw', main: 'Escalope de poulet', accompaniments: 'Farfalles, sauce forestière, emmental râpé', dessert: 'Fruit de saison' },
          { day: 'Mercredi', date: '21 octobre', starter: '—', main: 'Hamburger', accompaniments: 'Pommes américaines, salade, ketchup', dessert: 'Flan vanille' },
          { day: 'Jeudi', date: '22 octobre', starter: 'Salade de haricots verts', main: 'Volaille à la provençale', accompaniments: 'Boulgour, ratatouille', dessert: 'Yaourt brassé aux fruits' },
          { day: 'Vendredi', date: '23 octobre', starter: '—', main: 'Pique-nique', accompaniments: 'À ramener', dessert: '—' }
        ]
      },
      pedagogicProject: 'projet-pedagogique.pdf'
    };
    fs.writeFileSync(planningFile, JSON.stringify(defaultPlanning, null, 2));
  }
}

// API Routes

// Mot de passe partagé pour la galerie photos
app.post('/api/photos/login', (req, res) => {
  const { password } = req.body;

  if (!isPhotoPasswordValid(password)) {
    return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  photoSessions.set(token, Date.now() + PHOTO_SESSION_MAX_AGE_MS);
  const secureAttribute = isProduction ? '; Secure' : '';
  res.setHeader('Set-Cookie', `photo_access=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${PHOTO_SESSION_MAX_AGE_MS / 1000}${secureAttribute}`);
  res.json({ success: true });
});

// Récupérer les animateurs
app.get('/api/animators', (req, res) => {
  const animators = JSON.parse(fs.readFileSync(animatorsFile, 'utf8'));
  res.json(animators);
});

// Récupérer les photos accessibles avec le mot de passe unique.
app.get('/api/photos', requirePhotoAccess, (req, res) => {
  res.json(listGalleryPhotos());
});

app.use('/photo', requirePhotoAccess, express.static(photoDir));

// Récupérer le planning
app.get('/api/planning', (req, res) => {
  const planning = JSON.parse(fs.readFileSync(planningFile, 'utf8'));
  res.json(planning);
});

// Formulaire de contact
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  // En production, envoyer un email
  // Pour la démo, on affiche juste dans la console
  console.log('Message de contact reçu:');
  console.log({ name, email, message, date: new Date() });

  // Sauvegarder les messages
  const contactsFile = path.join(dataDir, 'contacts.json');
  let contacts = [];
  if (fs.existsSync(contactsFile)) {
    contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
  }

  contacts.push({
    id: Date.now(),
    name,
    email,
    message,
    date: new Date().toISOString()
  });

  fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2));

  try {
    await sendNotificationEmail({
      subject: `Nouveau message de contact de ${name}`,
      text: `Nom : ${name}\nEmail : ${email}\n\nMessage :\n${message}`,
      replyTo: email
    });
    res.json({ success: true, message: 'Votre message a été envoyé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l’envoi du message de contact:', error.message);
    res.status(500).json({ success: false, message: 'Le message a été enregistré, mais son envoi par e-mail a échoué.' });
  }
});

// Formulaire de candidature
app.post('/api/candidature', async (req, res) => {
  const { name, email, phone, experience, motivation, availability } = req.body;

  const candidaturesFile = path.join(dataDir, 'candidatures.json');
  let candidatures = [];
  if (fs.existsSync(candidaturesFile)) {
    candidatures = JSON.parse(fs.readFileSync(candidaturesFile, 'utf8'));
  }

  candidatures.push({
    id: Date.now(),
    name,
    email,
    phone,
    experience,
    motivation,
    availability,
    date: new Date().toISOString()
  });

  fs.writeFileSync(candidaturesFile, JSON.stringify(candidatures, null, 2));

  try {
    await sendNotificationEmail({
      subject: `Nouvelle candidature de ${name}`,
      text: `Nom : ${name}\nEmail : ${email}\nTéléphone : ${phone || 'Non renseigné'}\n\nExpérience :\n${experience}\n\nMotivation :\n${motivation}\n\nDisponibilités :\n${availability || 'Non renseignées'}`,
      replyTo: email
    });
    res.json({ success: true, message: 'Votre candidature a été reçue' });
  } catch (error) {
    console.error('Erreur lors de l’envoi de la candidature:', error.message);
    res.status(500).json({ success: false, message: 'La candidature a été enregistrée, mais son envoi par e-mail a échoué.' });
  }
});

// Initialiser et démarrer le serveur
initializeDataFiles();
fs.mkdirSync(photoDir, { recursive: true });
cleanupExpiredPhotos();
const photoCleanupInterval = setInterval(cleanupExpiredPhotos, 5 * 60 * 1000);
photoCleanupInterval.unref();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
