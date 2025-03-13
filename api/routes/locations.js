const express = require('express');
const router = express.Router();
const db = require('../db/db');
const auth = require('../middleware/auth');

/**
 * Pobieranie wszystkich miejscowości
 * GET /api/locations/cities
 */
router.get('/cities', auth.verifyToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM miejscowosci ORDER BY nazwa';
    const cities = await db.query(query);
    
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Błąd podczas pobierania miejscowości:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania miejscowości',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Pobieranie ulic dla wybranej miejscowości
 * GET /api/locations/streets/:cityId
 */
router.get('/streets/:cityId', auth.verifyToken, async (req, res) => {
  try {
    const { cityId } = req.params;
    
    const query = 'SELECT * FROM ulice WHERE miejscowosc_id = ? ORDER BY nazwa';
    const streets = await db.query(query, [cityId]);
    
    res.json({
      success: true,
      data: streets
    });
  } catch (error) {
    console.error(`Błąd podczas pobierania ulic dla miejscowości ID ${req.params.cityId}:`, error);
    res.status(500).json({
      success: false,
      message: `Wystąpił błąd podczas pobierania ulic dla miejscowości ID ${req.params.cityId}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Dodawanie nowego adresu
 * POST /api/locations/address
 */
router.post('/address', auth.verifyToken, async (req, res) => {
  try {
    const { ulica_id, nr_budynku, nr_lokalu, kod_pocztowy } = req.body;
    
    // Sprawdzenie wymaganych pól
    if (!ulica_id || !nr_budynku || !kod_pocztowy) {
      return res.status(400).json({
        success: false,
        message: 'Brakujące wymagane pola: ulica_id, nr_budynku, kod_pocztowy'
      });
    }
    
    // Sprawdzenie czy ulica istnieje
    const streetCheckQuery = 'SELECT id FROM ulice WHERE id = ?';
    const streetExists = await db.query(streetCheckQuery, [ulica_id]);
    
    if (!streetExists || streetExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Ulica o ID ${ulica_id} nie istnieje`
      });
    }
    
    // Dodanie adresu
    const insertQuery = `
      INSERT INTO adresy (ulica_id, nr_budynku, nr_lokalu, kod_pocztowy)
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await db.query(insertQuery, [ulica_id, nr_budynku, nr_lokalu || null, kod_pocztowy]);
    
    res.json({
      success: true,
      message: 'Adres został pomyślnie dodany',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Błąd podczas dodawania adresu:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas dodawania adresu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Pobieranie szczegółów adresu
 * GET /api/locations/address/:id
 */
router.get('/address/:id', auth.verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT a.*, u.nazwa as ulica_nazwa, m.nazwa as miejscowosc_nazwa
      FROM adresy a
      JOIN ulice u ON a.ulica_id = u.id
      JOIN miejscowosci m ON u.miejscowosc_id = m.id
      WHERE a.id = ?
    `;
    
    const address = await db.query(query, [id]);
    
    if (!address || address.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Adres o ID ${id} nie istnieje`
      });
    }
    
    res.json({
      success: true,
      data: address[0]
    });
  } catch (error) {
    console.error(`Błąd podczas pobierania adresu ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: `Wystąpił błąd podczas pobierania adresu ID ${req.params.id}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Aktualizacja adresu
 * PUT /api/locations/address/:id
 */
router.put('/address/:id', auth.verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { ulica_id, nr_budynku, nr_lokalu, kod_pocztowy } = req.body;
    
    // Sprawdzenie wymaganych pól
    if (!ulica_id || !nr_budynku || !kod_pocztowy) {
      return res.status(400).json({
        success: false,
        message: 'Brakujące wymagane pola: ulica_id, nr_budynku, kod_pocztowy'
      });
    }
    
    // Sprawdzenie czy adres istnieje
    const addressCheckQuery = 'SELECT id FROM adresy WHERE id = ?';
    const addressExists = await db.query(addressCheckQuery, [id]);
    
    if (!addressExists || addressExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Adres o ID ${id} nie istnieje`
      });
    }
    
    // Aktualizacja adresu
    const updateQuery = `
      UPDATE adresy 
      SET ulica_id = ?, nr_budynku = ?, nr_lokalu = ?, kod_pocztowy = ?
      WHERE id = ?
    `;
    
    await db.query(updateQuery, [ulica_id, nr_budynku, nr_lokalu || null, kod_pocztowy, id]);
    
    res.json({
      success: true,
      message: 'Adres został pomyślnie zaktualizowany'
    });
  } catch (error) {
    console.error(`Błąd podczas aktualizacji adresu ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: `Wystąpił błąd podczas aktualizacji adresu ID ${req.params.id}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Dodawanie nowej miejscowości
 * POST /api/locations/cities
 */
router.post('/cities', auth.verifyToken, async (req, res) => {
  try {
    const { nazwa } = req.body;
    
    // Sprawdzenie wymaganych pól
    if (!nazwa) {
      return res.status(400).json({
        success: false,
        message: 'Brakujące wymagane pole: nazwa'
      });
    }
    
    // Sprawdzenie czy miejscowość już istnieje
    const checkQuery = 'SELECT id FROM miejscowosci WHERE LOWER(nazwa) = LOWER(?)';
    const existingCity = await db.query(checkQuery, [nazwa]);
    
    if (existingCity && existingCity.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Miejscowość o nazwie "${nazwa}" już istnieje`
      });
    }
    
    // Dodanie miejscowości
    const insertQuery = 'INSERT INTO miejscowosci (nazwa) VALUES (?)';
    const result = await db.query(insertQuery, [nazwa]);
    
    // Pobranie utworzonej miejscowości
    const getQuery = 'SELECT id, nazwa FROM miejscowosci WHERE id = ?';
    const city = await db.query(getQuery, [result.insertId]);
    
    if (!city || city.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas pobierania utworzonej miejscowości'
      });
    }
    
    res.json({
      success: true,
      message: 'Miejscowość została pomyślnie dodana',
      data: city[0]
    });
  } catch (error) {
    console.error('Błąd podczas dodawania miejscowości:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas dodawania miejscowości',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Dodawanie nowej ulicy
 * POST /api/locations/streets
 */
router.post('/streets', auth.verifyToken, async (req, res) => {
  try {
    const { nazwa, miejscowosc_id } = req.body;
    
    // Sprawdzenie wymaganych pól
    if (!nazwa || !miejscowosc_id) {
      return res.status(400).json({
        success: false,
        message: 'Brakujące wymagane pola: nazwa, miejscowosc_id'
      });
    }
    
    // Sprawdzenie czy miejscowość istnieje
    const cityCheckQuery = 'SELECT id FROM miejscowosci WHERE id = ?';
    const cityExists = await db.query(cityCheckQuery, [miejscowosc_id]);
    
    if (!cityExists || cityExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Miejscowość o ID ${miejscowosc_id} nie istnieje`
      });
    }
    
    // Sprawdzenie czy ulica już istnieje w tej miejscowości
    const streetCheckQuery = 'SELECT id FROM ulice WHERE LOWER(nazwa) = LOWER(?) AND miejscowosc_id = ?';
    const existingStreet = await db.query(streetCheckQuery, [nazwa, miejscowosc_id]);
    
    if (existingStreet && existingStreet.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Ulica o nazwie "${nazwa}" już istnieje w wybranej miejscowości`
      });
    }
    
    // Dodanie ulicy
    const insertQuery = 'INSERT INTO ulice (nazwa, miejscowosc_id) VALUES (?, ?)';
    const result = await db.query(insertQuery, [nazwa, miejscowosc_id]);
    
    // Pobranie utworzonej ulicy
    const getQuery = 'SELECT id, nazwa, miejscowosc_id FROM ulice WHERE id = ?';
    const street = await db.query(getQuery, [result.insertId]);
    
    if (!street || street.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas pobierania utworzonej ulicy'
      });
    }
    
    res.json({
      success: true,
      message: 'Ulica została pomyślnie dodana',
      data: street[0]
    });
  } catch (error) {
    console.error('Błąd podczas dodawania ulicy:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas dodawania ulicy',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Pobieranie wezwań parafii (invocations)
 * GET /api/locations/parish-invocations
 */
router.get('/parish-invocations', auth.verifyToken, async (req, res) => {
  try {
    const query = 'SELECT id, nazwa FROM wezwania_parafii ORDER BY nazwa';
    const invocations = await db.query(query);
    
    // Format the data for the frontend
    const formattedInvocations = invocations.map(invocation => ({
      id: invocation.id,
      nazwa: invocation.nazwa
    }));
    
    res.json({
      success: true,
      data: formattedInvocations
    });
  } catch (error) {
    console.error('Error fetching parish invocations:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania wezwań parafii',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 