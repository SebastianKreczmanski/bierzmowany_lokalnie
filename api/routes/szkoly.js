const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Wszystkie ścieżki poniżej wymagają autentykacji
router.use(authenticate);

/**
 * @route   POST /api/szkoly
 * @desc    Tworzy nową szkołę
 * @access  Private (administrator, duszpasterz, kancelaria, kandydat)
 */
router.post('/', authorize(['administrator', 'duszpasterz', 'kancelaria', 'kandydat']), async (req, res) => {
  try {
    const { nazwa } = req.body;
    
    // Sprawdź czy nazwa została podana
    if (!nazwa || nazwa.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nazwa szkoły jest wymagana'
      });
    }
    
    // Sprawdź czy szkoła o takiej nazwie już istnieje
    const checkQuery = `
      SELECT id FROM szkola
      WHERE nazwa = ?
    `;
    const existingSchools = await db.query(checkQuery, [nazwa.trim()]);
    
    if (existingSchools.length > 0) {
      // Szkoła już istnieje, zwróć istniejącą
      return res.status(200).json({
        success: true,
        message: 'Szkoła o podanej nazwie już istnieje',
        data: {
          id: existingSchools[0].id,
          nazwa: nazwa.trim()
        }
      });
    }
    
    // Dodaj nową szkołę
    const insertQuery = `
      INSERT INTO szkola (nazwa)
      VALUES (?)
    `;
    const result = await db.query(insertQuery, [nazwa.trim()]);
    
    return res.status(201).json({
      success: true,
      message: 'Szkoła została utworzona',
      data: {
        id: result.insertId,
        nazwa: nazwa.trim()
      }
    });
  } catch (error) {
    console.error('Błąd podczas tworzenia nowej szkoły:', error);
    return res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas tworzenia nowej szkoły',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/szkoly
 * @desc    Pobiera listę wszystkich szkół
 * @access  Private (wszystkie role)
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, nazwa
      FROM szkola
      ORDER BY nazwa
    `;
    
    const szkoly = await db.query(query);
    
    return res.status(200).json({
      success: true,
      data: szkoly
    });
  } catch (error) {
    console.error('Błąd podczas pobierania listy szkół:', error);
    return res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania listy szkół',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 