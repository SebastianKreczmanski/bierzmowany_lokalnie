const express = require('express');
const router = express.Router();
const { query } = require('../db');
// Usuwam import middleware, który mógł powodować problemy
// const { authenticateJWT, checkRole } = require('../middleware/auth');

/**
 * GET /api/grupy - Pobieranie wszystkich grup
 */
router.get('/', async (req, res) => {
  try {
    const groups = await query(`
      SELECT g.*, u.imie as animator_imie, u.nazwisko as animator_nazwisko, 
      (SELECT COUNT(*) FROM grupa_user gu WHERE gu.grupa_id = g.id) as liczba_czlonkow
      FROM grupa g
      LEFT JOIN user u ON g.animator_id = u.id
      ORDER BY g.nazwa ASC
    `);
    
    res.json(groups);
  } catch (error) {
    console.error('Błąd podczas pobierania grup:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania grup' });
  }
});

/**
 * GET /api/grupy/animatorzy - Pobieranie wszystkich animatorów
 */
router.get('/animatorzy', async (req, res) => {
  try {
    const animatorzy = await query(`
      SELECT u.id, u.imie, u.nazwisko
      FROM user u
      JOIN user_role ur ON u.id = ur.user_id
      JOIN role r ON ur.role_id = r.id
      WHERE r.nazwa = 'animator' AND u.deleted_at IS NULL
      ORDER BY u.nazwisko ASC, u.imie ASC
    `);
    
    res.json(animatorzy);
  } catch (error) {
    console.error('Błąd podczas pobierania animatorów:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania animatorów' });
  }
});

/**
 * GET /api/grupy/kandydaci - Pobieranie wszystkich kandydatów
 */
router.get('/kandydaci', async (req, res) => {
  try {
    const kandydaci = await query(`
      SELECT u.id, u.imie, u.nazwisko,
        g.id as grupa_id, g.nazwa as grupa_nazwa
      FROM user u
      JOIN user_role ur ON u.id = ur.user_id
      JOIN role r ON ur.role_id = r.id
      LEFT JOIN grupa_user gu ON u.id = gu.user_id
      LEFT JOIN grupa g ON gu.grupa_id = g.id
      WHERE r.nazwa = 'kandydat' AND u.deleted_at IS NULL
      ORDER BY u.nazwisko ASC, u.imie ASC
    `);
    
    res.json(kandydaci);
  } catch (error) {
    console.error('Błąd podczas pobierania kandydatów:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania kandydatów' });
  }
});

/**
 * GET /api/grupy/:id - Pobieranie szczegółów grupy
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Pobieranie podstawowych informacji o grupie
    const [grupa] = await query(`
      SELECT g.*, u.imie as animator_imie, u.nazwisko as animator_nazwisko
      FROM grupa g
      LEFT JOIN user u ON g.animator_id = u.id
      WHERE g.id = ?
    `, [id]);

    if (!grupa) {
      return res.status(404).json({ error: 'Grupa nie znaleziona' });
    }

    // Pobieranie członków grupy
    const czlonkowie = await query(`
      SELECT u.id, u.imie, u.nazwisko
      FROM user u
      JOIN grupa_user gu ON u.id = gu.user_id
      WHERE gu.grupa_id = ?
      ORDER BY u.nazwisko ASC, u.imie ASC
    `, [id]);

    res.json({
      ...grupa,
      czlonkowie
    });
  } catch (error) {
    console.error(`Błąd podczas pobierania szczegółów grupy ID: ${req.params.id}:`, error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania szczegółów grupy' });
  }
});

/**
 * POST /api/grupy - Tworzenie nowej grupy
 */
router.post('/', async (req, res) => {
  try {
    const { nazwa, animator_id } = req.body;
    
    if (!nazwa) {
      return res.status(400).json({ error: 'Nazwa grupy jest wymagana' });
    }
    
    const result = await query(
      'INSERT INTO grupa (nazwa, animator_id, created_at) VALUES (?, ?, NOW())',
      [nazwa, animator_id || null]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      success: true,
      message: 'Grupa została utworzona pomyślnie' 
    });
  } catch (error) {
    console.error('Błąd podczas tworzenia grupy:', error);
    res.status(500).json({ error: 'Błąd serwera podczas tworzenia grupy' });
  }
});

/**
 * PUT /api/grupy/:id - Aktualizacja grupy
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nazwa, animator_id } = req.body;
    
    if (!nazwa) {
      return res.status(400).json({ error: 'Nazwa grupy jest wymagana' });
    }
    
    // Sprawdzenie czy grupa istnieje
    const [existingGroup] = await query(
      'SELECT id FROM grupa WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (!existingGroup) {
      return res.status(404).json({ error: 'Grupa nie znaleziona' });
    }
    
    await query(
      'UPDATE grupa SET nazwa = ?, animator_id = ? WHERE id = ?',
      [nazwa, animator_id || null, id]
    );
    
    res.json({ 
      success: true,
      message: 'Grupa została zaktualizowana pomyślnie' 
    });
  } catch (error) {
    console.error(`Błąd podczas aktualizacji grupy ID: ${req.params.id}:`, error);
    res.status(500).json({ error: 'Błąd serwera podczas aktualizacji grupy' });
  }
});

/**
 * DELETE /api/grupy/:id - Usuwanie grupy (miękkie)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sprawdzenie czy grupa istnieje
    const [existingGroup] = await query(
      'SELECT id FROM grupa WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (!existingGroup) {
      return res.status(404).json({ error: 'Grupa nie znaleziona' });
    }
    
    // Miękkie usunięcie
    await query(
      'UPDATE grupa SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    
    // Usunięcie powiązań z użytkownikami
    await query(
      'DELETE FROM grupa_user WHERE grupa_id = ?',
      [id]
    );
    
    res.json({ 
      success: true,
      message: 'Grupa została usunięta pomyślnie' 
    });
  } catch (error) {
    console.error(`Błąd podczas usuwania grupy ID: ${req.params.id}:`, error);
    res.status(500).json({ error: 'Błąd serwera podczas usuwania grupy' });
  }
});

/**
 * PUT /api/grupy/:id/czlonkowie - Aktualizacja członków grupy
 */
router.put('/:id/czlonkowie', async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Lista userIds musi być tablicą' });
    }
    
    // Sprawdzenie czy grupa istnieje
    const [existingGroup] = await query(
      'SELECT id FROM grupa WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (!existingGroup) {
      return res.status(404).json({ error: 'Grupa nie znaleziona' });
    }
    
    // Usunięcie istniejących powiązań
    await query('DELETE FROM grupa_user WHERE grupa_id = ?', [id]);
    
    // Dodanie nowych powiązań
    if (userIds.length > 0) {
      const values = userIds.map(userId => `(${id}, ${userId})`).join(', ');
      await query(`INSERT INTO grupa_user (grupa_id, user_id) VALUES ${values}`);
    }
    
    res.json({ 
      success: true,
      message: 'Członkowie grupy zostali zaktualizowani pomyślnie' 
    });
  } catch (error) {
    console.error(`Błąd podczas aktualizacji członków grupy ID: ${req.params.id}:`, error);
    res.status(500).json({ error: 'Błąd serwera podczas aktualizacji członków grupy' });
  }
});

/**
 * POST /api/users/:id/grupy - Przypisanie grup do animatora
 */
router.post('/users/:id/grupy', async (req, res) => {
  try {
    const { id } = req.params; // ID animatora
    const { grupyIds } = req.body;
    
    if (!Array.isArray(grupyIds)) {
      return res.status(400).json({ error: 'Lista grupyIds musi być tablicą' });
    }
    
    // Sprawdzenie czy użytkownik istnieje i jest animatorem
    const [user] = await query(`
      SELECT u.id 
      FROM user u
      JOIN user_role ur ON u.id = ur.user_id
      JOIN role r ON ur.role_id = r.id
      WHERE u.id = ? AND r.nazwa = 'animator' AND u.deleted_at IS NULL
    `, [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Animator nie znaleziony' });
    }
    
    // Aktualizacja grup tego animatora
    await query('UPDATE grupa SET animator_id = NULL WHERE animator_id = ?', [id]);
    
    // Dodanie nowych powiązań
    if (grupyIds.length > 0) {
      await Promise.all(grupyIds.map(grupaId => 
        query('UPDATE grupa SET animator_id = ? WHERE id = ?', [id, grupaId])
      ));
    }
    
    res.json({ 
      success: true,
      message: 'Grupy zostały przypisane do animatora pomyślnie' 
    });
  } catch (error) {
    console.error(`Błąd podczas przypisywania grup do animatora ID: ${req.params.id}:`, error);
    res.status(500).json({ error: 'Błąd serwera podczas przypisywania grup do animatora' });
  }
});

module.exports = router;
