const express = require('express');
const router = express.Router();
const db = require('../db/db');
const auth = require('../middleware/auth');

/**
 * Pobieranie wszystkich wydarzeń
 * GET /api/events
 */
router.get('/', auth.verifyToken, async (req, res) => {
  try {
    // Pobieranie wydarzeń z bazy danych
    const query = `
      SELECT w.*, tw.nazwa as typ_nazwa, tw.kolor as typ_kolor
      FROM wydarzenie w
      JOIN typ_wydarzenia tw ON w.typ_id = tw.id
      ORDER BY w.data_rozpoczecia
    `;
    
    const events = await db.query(query);
    
    // Logi debugowania
    console.log(`Pobrano ${events.length} wydarzeń`);
    
    // Formatowanie odpowiedzi
    const formattedEvents = events.map(event => ({
      id: event.id,
      typ_id: event.typ_id,
      nazwa: event.nazwa,
      opis: event.opis,
      data_rozpoczecia: event.data_rozpoczecia,
      data_zakonczenia: event.data_zakonczenia,
      obowiazkowe: Boolean(event.obowiazkowe),
      dlaroli: event.dlaroli,
      dlagrupy: event.dlagrupy,
      typ: {
        id: event.typ_id,
        nazwa: event.typ_nazwa,
        kolor: event.typ_kolor
      }
    }));
    
    res.json({
      success: true,
      data: formattedEvents
    });
  } catch (error) {
    console.error('Błąd podczas pobierania wydarzeń:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania wydarzeń',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Pobieranie wydarzeń dla określonej roli
 * GET /api/events/role/:role
 */
router.get('/role/:role', auth.verifyToken, async (req, res) => {
  try {
    const { role } = req.params;
    console.log(`Próba pobrania wydarzeń dla roli: ${role}`);
    
    // Dla administratora, duszpasterza i kancelarii zwracamy wszystkie wydarzenia
    if (role === 'administrator' || role === 'duszpasterz' || role === 'kancelaria') {
      console.log(`Rola ${role} ma dostęp do wszystkich wydarzeń - pomijamy filtrowanie`);
      
      const query = `
        SELECT w.*, tw.nazwa as typ_nazwa, tw.kolor as typ_kolor
        FROM wydarzenie w
        JOIN typ_wydarzenia tw ON w.typ_id = tw.id
        ORDER BY w.data_rozpoczecia
      `;
      
      const events = await db.query(query);
      console.log(`Pobrano ${events.length} wszystkich wydarzeń`);
      
      // Formatowanie odpowiedzi
      const formattedEvents = events.map(event => ({
        id: event.id,
        typ_id: event.typ_id,
        nazwa: event.nazwa,
        opis: event.opis,
        data_rozpoczecia: event.data_rozpoczecia,
        data_zakonczenia: event.data_zakonczenia,
        obowiazkowe: Boolean(event.obowiazkowe),
        dlaroli: event.dlaroli,
        dlagrupy: event.dlagrupy,
        typ: {
          id: event.typ_id,
          nazwa: event.typ_nazwa,
          kolor: event.typ_kolor
        }
      }));
      
      return res.json({
        success: true,
        data: formattedEvents
      });
    }
    
    // Dla pozostałych ról pobieramy wydarzenia filtrowane
    let roleId;
    
    // Pobierz ID roli na podstawie nazwy
    const roleQuery = `SELECT id FROM role WHERE nazwa = ?`;
    const roleResult = await db.query(roleQuery, [role]);
    
    console.log(`Wynik zapytania o rolę:`, roleResult);
    
    if (roleResult && roleResult.length > 0) {
      roleId = roleResult[0].id;
      console.log(`Znaleziono ID roli ${role}: ${roleId}`);
    } else {
      console.log(`Nie znaleziono roli o nazwie ${role}`);
      return res.json({
        success: true,
        data: [] // Zwracamy pustą listę jeśli rola nie istnieje
      });
    }
    
    // Pobieranie wydarzeń z bazy danych
    const query = `
      SELECT w.*, tw.nazwa as typ_nazwa, tw.kolor as typ_kolor
      FROM wydarzenie w
      JOIN typ_wydarzenia tw ON w.typ_id = tw.id
      WHERE w.dlaroli = ? OR w.dlaroli = ''
      ORDER BY w.data_rozpoczecia
    `;
    
    console.log(`Wykonuję zapytanie z ID roli: ${roleId}`);
    const events = await db.query(query, [roleId.toString()]);
    console.log(`Pobrano ${events.length} wydarzeń dla roli ${role}`);
    
    // Formatowanie odpowiedzi
    const formattedEvents = events.map(event => ({
      id: event.id,
      typ_id: event.typ_id,
      nazwa: event.nazwa,
      opis: event.opis,
      data_rozpoczecia: event.data_rozpoczecia,
      data_zakonczenia: event.data_zakonczenia,
      obowiazkowe: Boolean(event.obowiazkowe),
      dlaroli: event.dlaroli,
      dlagrupy: event.dlagrupy,
      typ: {
        id: event.typ_id,
        nazwa: event.typ_nazwa,
        kolor: event.typ_kolor
      }
    }));
    
    res.json({
      success: true,
      data: formattedEvents
    });
  } catch (error) {
    console.error(`Błąd podczas pobierania wydarzeń dla roli ${req.params.role}:`, error);
    res.status(500).json({
      success: false,
      message: `Wystąpił błąd podczas pobierania wydarzeń dla roli ${req.params.role}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Pobieranie wydarzeń dla określonej grupy
 * GET /api/events/group/:group
 */
router.get('/group/:group', auth.verifyToken, async (req, res) => {
  try {
    const { group } = req.params;
    
    // Pobieranie wydarzeń z bazy danych
    const query = `
      SELECT w.*, tw.nazwa as typ_nazwa, tw.kolor as typ_kolor
      FROM wydarzenie w
      JOIN typ_wydarzenia tw ON w.typ_id = tw.id
      WHERE w.dlagrupy = ? OR w.dlagrupy = ''
      ORDER BY w.data_rozpoczecia
    `;
    
    const events = await db.query(query, [group]);
    
    // Formatowanie odpowiedzi
    const formattedEvents = events.map(event => ({
      id: event.id,
      typ_id: event.typ_id,
      nazwa: event.nazwa,
      opis: event.opis,
      data_rozpoczecia: event.data_rozpoczecia,
      data_zakonczenia: event.data_zakonczenia,
      obowiazkowe: Boolean(event.obowiazkowe),
      dlaroli: event.dlaroli,
      dlagrupy: event.dlagrupy,
      typ: {
        id: event.typ_id,
        nazwa: event.typ_nazwa,
        kolor: event.typ_kolor
      }
    }));
    
    res.json({
      success: true,
      data: formattedEvents
    });
  } catch (error) {
    console.error(`Błąd podczas pobierania wydarzeń dla grupy ${req.params.group}:`, error);
    res.status(500).json({
      success: false,
      message: `Wystąpił błąd podczas pobierania wydarzeń dla grupy ${req.params.group}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Pobieranie typów wydarzeń
 * GET /api/events/types
 */
router.get('/types', auth.verifyToken, async (req, res) => {
  try {
    // Pobieranie typów wydarzeń z bazy danych
    const query = 'SELECT * FROM typ_wydarzenia';
    const eventTypes = await db.query(query);
    
    res.json({
      success: true,
      data: eventTypes
    });
  } catch (error) {
    console.error('Błąd podczas pobierania typów wydarzeń:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania typów wydarzeń',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Tworzenie nowego typu wydarzenia
 * POST /api/events/types
 */
router.post('/types', auth.verifyToken, async (req, res) => {
  try {
    // Sprawdzenie uprawnień - tylko admin, duszpasterz, kancelaria mogą dodawać typy wydarzeń
    const userRoles = req.user.roles || [];
    const canCreateEventTypes = userRoles.some(role => 
      ['administrator', 'duszpasterz', 'kancelaria'].includes(role)
    );
    
    if (!canCreateEventTypes) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do tworzenia typów wydarzeń'
      });
    }
    
    const { nazwa, kolor } = req.body;
    
    // Walidacja danych
    if (!nazwa || !nazwa.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nazwa typu wydarzenia jest wymagana'
      });
    }
    
    if (!kolor || !kolor.match(/^#([0-9A-F]{3}){1,2}$/i)) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowy format koloru. Wymagany format: #RGB lub #RRGGBB'
      });
    }
    
    // Sprawdzenie czy typ o takiej nazwie już istnieje
    const checkQuery = 'SELECT id FROM typ_wydarzenia WHERE nazwa = ?';
    const existingTypes = await db.query(checkQuery, [nazwa.trim()]);
    
    if (existingTypes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Typ wydarzenia o takiej nazwie już istnieje'
      });
    }
    
    // Dodanie nowego typu wydarzenia
    const insertQuery = 'INSERT INTO typ_wydarzenia (nazwa, kolor) VALUES (?, ?)';
    const insertResult = await db.query(insertQuery, [nazwa.trim(), kolor]);
    
    if (!insertResult || !insertResult.insertId) {
      throw new Error('Nie udało się dodać typu wydarzenia');
    }
    
    // Pobranie utworzonego typu wydarzenia
    const getQuery = 'SELECT * FROM typ_wydarzenia WHERE id = ?';
    const eventTypes = await db.query(getQuery, [insertResult.insertId]);
    
    if (!eventTypes || eventTypes.length === 0) {
      throw new Error('Nie udało się pobrać utworzonego typu wydarzenia');
    }
    
    res.status(201).json({
      success: true,
      message: 'Typ wydarzenia został utworzony',
      data: eventTypes[0]
    });
  } catch (error) {
    console.error('Błąd podczas tworzenia typu wydarzenia:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas tworzenia typu wydarzenia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Pobieranie wszystkich ról z systemu
 * GET /api/roles
 */
router.get('/roles', auth.verifyToken, async (req, res) => {
  try {
    // Pobieranie ról z bazy danych
    const query = 'SELECT * FROM role';
    const roles = await db.query(query);
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Błąd podczas pobierania ról:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania ról',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Pobieranie grup dla animatora
 * GET /api/groups/animator/:id
 */
router.get('/groups/animator/:id', auth.verifyToken, async (req, res) => {
  try {
    const animatorId = req.params.id;
    
    // Pobieranie grup, w których użytkownik jest animatorem
    const query = `
      SELECT id, nazwa
      FROM grupa
      WHERE animator_id = ?
    `;
    
    const groups = await db.query(query, [animatorId]);
    
    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Błąd podczas pobierania grup animatora:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania grup animatora',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Dodawanie nowego wydarzenia
 * POST /api/events
 */
router.post('/', auth.verifyToken, async (req, res) => {
  try {
    // Sprawdzenie uprawnień - kto może dodawać wydarzenia
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('administrator');
    const isDuszpasterz = userRoles.includes('duszpasterz');
    const isKancelaria = userRoles.includes('kancelaria');
    const isAnimator = userRoles.includes('animator');
    
    const canCreateEvents = isAdmin || isDuszpasterz || isKancelaria || isAnimator;
    
    if (!canCreateEvents) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do tworzenia wydarzeń'
      });
    }
    
    // Pobranie danych wydarzenia
    const { 
      nazwa, 
      opis, 
      data_rozpoczecia, 
      data_zakonczenia, 
      typ_id, 
      obowiazkowe = false,
      dlaroli = '',
      dlagrupy = ''
    } = req.body;
    
    // Walidacja danych
    if (!nazwa || !nazwa.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nazwa wydarzenia jest wymagana'
      });
    }
    
    if (!data_rozpoczecia) {
      return res.status(400).json({
        success: false,
        message: 'Data rozpoczęcia jest wymagana'
      });
    }
    
    if (!typ_id) {
      return res.status(400).json({
        success: false,
        message: 'Typ wydarzenia jest wymagany'
      });
    }
    
    // Sprawdzenie czy typ wydarzenia istnieje
    const typeCheckQuery = 'SELECT id FROM typ_wydarzenia WHERE id = ?';
    const types = await db.query(typeCheckQuery, [typ_id]);
    
    if (types.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Wybrany typ wydarzenia nie istnieje'
      });
    }
    
    // Ograniczenia dla animatorów - mogą dodawać wydarzenia tylko dla swojej grupy
    if (isAnimator && !isAdmin && !isDuszpasterz && !isKancelaria) {
      if (!dlagrupy) {
        return res.status(400).json({
          success: false,
          message: 'Jako animator musisz wybrać grupę dla wydarzenia'
        });
      }
      
      // Sprawdzenie czy animator jest przypisany do wybranej grupy
      const animatorCheckQuery = 'SELECT id FROM grupa WHERE id = ? AND animator_id = ?';
      const animatorGroups = await db.query(animatorCheckQuery, [dlagrupy, req.user.id]);
      
      if (animatorGroups.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Możesz tworzyć wydarzenia tylko dla grup, których jesteś animatorem'
        });
      }
    }
    
    // Dodanie wydarzenia do bazy danych
    const insertQuery = `
      INSERT INTO wydarzenie 
      (nazwa, opis, data_rozpoczecia, data_zakonczenia, typ_id, obowiazkowe, dlaroli, dlagrupy, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const insertResult = await db.query(insertQuery, [
      nazwa.trim(),
      opis || null,
      data_rozpoczecia,
      data_zakonczenia || data_rozpoczecia,
      typ_id,
      obowiazkowe ? 1 : 0,
      dlaroli,
      dlagrupy
    ]);
    
    if (!insertResult || !insertResult.insertId) {
      throw new Error('Nie udało się dodać wydarzenia');
    }
    
    // Pobranie utworzonego wydarzenia
    const eventQuery = `
      SELECT w.*, tw.nazwa as typ_nazwa, tw.kolor as typ_kolor
      FROM wydarzenie w
      JOIN typ_wydarzenia tw ON w.typ_id = tw.id
      WHERE w.id = ?
    `;
    
    const events = await db.query(eventQuery, [insertResult.insertId]);
    
    if (!events || events.length === 0) {
      throw new Error('Nie udało się pobrać utworzonego wydarzenia');
    }
    
    // Formatowanie odpowiedzi
    const createdEvent = {
      id: events[0].id,
      typ_id: events[0].typ_id,
      nazwa: events[0].nazwa,
      opis: events[0].opis,
      data_rozpoczecia: events[0].data_rozpoczecia,
      data_zakonczenia: events[0].data_zakonczenia,
      obowiazkowe: Boolean(events[0].obowiazkowe),
      dlaroli: events[0].dlaroli,
      dlagrupy: events[0].dlagrupy,
      typ: {
        id: events[0].typ_id,
        nazwa: events[0].typ_nazwa,
        kolor: events[0].typ_kolor
      }
    };
    
    res.status(201).json({
      success: true,
      message: 'Wydarzenie zostało utworzone',
      data: createdEvent
    });
  } catch (error) {
    console.error('Błąd podczas tworzenia wydarzenia:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas tworzenia wydarzenia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Aktualizacja wydarzenia
 * PUT /api/events/:id
 */
router.put('/:id', auth.verifyToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { 
      nazwa, 
      opis, 
      data_rozpoczecia, 
      data_zakonczenia, 
      obowiazkowe, 
      typ_id, 
      dlaroli, 
      dlagrupy 
    } = req.body;
    
    console.log('Dane aktualizacji wydarzenia:', { 
      eventId, 
      nazwa, 
      opis, 
      data_rozpoczecia, 
      data_zakonczenia, 
      obowiazkowe, 
      typ_id, 
      dlaroli, 
      dlagrupy 
    });
    
    // Sprawdzanie, czy wydarzenie istnieje
    const checkQuery = 'SELECT * FROM wydarzenie WHERE id = ?';
    const [events] = await db.query(checkQuery, [eventId]);
    
    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Wydarzenie o ID ${eventId} nie istnieje`
      });
    }
    
    console.log(`Wydarzenie o ID ${eventId} znalezione, przystępuję do aktualizacji`);
    
    // Przygotowanie danych do aktualizacji z obsługą wartości null
    const dataZakonczenia = data_zakonczenia || null;
    const opisValue = opis !== undefined ? opis : null;
    const dlaroliValue = dlaroli || '';
    const dlagrupyValue = dlagrupy || '';
    
    // Aktualizacja wydarzenia
    const updateQuery = `
      UPDATE wydarzenie
      SET nazwa = ?,
          opis = ?,
          data_rozpoczecia = ?,
          data_zakonczenia = ?,
          obowiazkowe = ?,
          typ_id = ?,
          dlaroli = ?,
          dlagrupy = ?
      WHERE id = ?
    `;
    
    try {
      await db.query(updateQuery, [
        nazwa,
        opisValue,
        data_rozpoczecia,
        dataZakonczenia,
        obowiazkowe ? 1 : 0,
        typ_id,
        dlaroliValue,
        dlagrupyValue,
        eventId
      ]);
      console.log(`Wydarzenie o ID ${eventId} zostało zaktualizowane`);
    } catch (dbError) {
      console.error('Błąd podczas aktualizacji wydarzenia w bazie danych:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas aktualizacji wydarzenia w bazie danych',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
    
    // Pobieranie zaktualizowanego wydarzenia
    try {
      const getUpdatedEventQuery = `
        SELECT w.*, tw.nazwa as typ_nazwa, tw.kolor as typ_kolor
        FROM wydarzenie w
        JOIN typ_wydarzenia tw ON w.typ_id = tw.id
        WHERE w.id = ?
      `;
      
      const [updatedEvents] = await db.query(getUpdatedEventQuery, [eventId]);
      
      if (!updatedEvents || updatedEvents.length === 0) {
        console.error(`Nie znaleziono zaktualizowanego wydarzenia o ID ${eventId}`);
        
        // Zamiast zwracać błąd, zwróć sukces z oryginalnie wysłanymi danymi
        // Typ wydarzenia może nie być dostępny, więc tworzymy obiekt z dostępnymi danymi
        return res.json({
          success: true,
          message: 'Wydarzenie zostało zaktualizowane (nie udało się pobrać zaktualizowanych danych)',
          data: {
            id: parseInt(eventId),
            typ_id: typ_id,
            nazwa: nazwa,
            opis: opisValue,
            data_rozpoczecia: data_rozpoczecia,
            data_zakonczenia: dataZakonczenia,
            obowiazkowe: Boolean(obowiazkowe),
            dlaroli: dlaroliValue,
            dlagrupy: dlagrupyValue,
            // Brak danych typu wydarzenia
            typ: { 
              id: typ_id,
              nazwa: "Typ wydarzenia", // Placeholder
              kolor: "#808080" // Domyślny kolor
            }
          }
        });
      }
      
      console.log(`Pobrano zaktualizowane wydarzenie o ID ${eventId}`);
      
      // Formatowanie odpowiedzi
      const updatedEvent = {
        id: updatedEvents[0].id,
        typ_id: updatedEvents[0].typ_id,
        nazwa: updatedEvents[0].nazwa,
        opis: updatedEvents[0].opis,
        data_rozpoczecia: updatedEvents[0].data_rozpoczecia,
        data_zakonczenia: updatedEvents[0].data_zakonczenia,
        obowiazkowe: Boolean(updatedEvents[0].obowiazkowe),
        dlaroli: updatedEvents[0].dlaroli,
        dlagrupy: updatedEvents[0].dlagrupy,
        typ: {
          id: updatedEvents[0].typ_id,
          nazwa: updatedEvents[0].typ_nazwa,
          kolor: updatedEvents[0].typ_kolor
        }
      };
      
      return res.json({
        success: true,
        message: 'Wydarzenie zostało zaktualizowane',
        data: updatedEvent
      });
    } catch (fetchError) {
      console.error('Błąd podczas pobierania zaktualizowanego wydarzenia:', fetchError);
      
      // Zamiast zwracać błąd, zwróć sukces z oryginalnie wysłanymi danymi
      return res.json({
        success: true,
        message: 'Wydarzenie zostało zaktualizowane (nie udało się pobrać zaktualizowanych danych)',
        data: {
          id: parseInt(eventId),
          typ_id: typ_id,
          nazwa: nazwa,
          opis: opisValue,
          data_rozpoczecia: data_rozpoczecia,
          data_zakonczenia: dataZakonczenia,
          obowiazkowe: Boolean(obowiazkowe),
          dlaroli: dlaroliValue,
          dlagrupy: dlagrupyValue,
          // Brak danych typu wydarzenia
          typ: { 
            id: typ_id,
            nazwa: "Typ wydarzenia", // Placeholder
            kolor: "#808080" // Domyślny kolor
          }
        }
      });
    }
  } catch (error) {
    console.error('Błąd podczas aktualizacji wydarzenia:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas aktualizacji wydarzenia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 