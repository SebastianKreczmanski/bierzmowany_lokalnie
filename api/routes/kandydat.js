const express = require('express');
const router = express.Router();
const kandydatController = require('../controllers/kandydatController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Wszystkie ścieżki poniżej wymagają autentykacji
router.use(authenticate);

/**
 * @route   GET /api/kandydat/:userId
 * @desc    Pobiera dane kandydata
 * @access  Private (kandydat - tylko swoje dane, admin/duszpasterz - wszystkie dane)
 */
router.get('/:userId', authorize(['kandydat', 'administrator', 'duszpasterz', 'kancelaria', 'animator', 'rodzic']), kandydatController.getKandydatData);

/**
 * @route   GET /api/kandydat/szkoly
 * @desc    Pobiera listę wszystkich szkół
 * @access  Private (wszystkie role)
 */
router.get('/dane/szkoly', kandydatController.getSzkoly);

/**
 * @route   GET /api/kandydat/parafie
 * @desc    Pobiera listę wszystkich parafii
 * @access  Private (wszystkie role)
 */
router.get('/dane/parafie', kandydatController.getParafie);

/**
 * @route   GET /api/kandydat/grupy
 * @desc    Pobiera listę wszystkich grup
 * @access  Private (wszystkie role)
 */
router.get('/dane/grupy', kandydatController.getGrupy);

/**
 * @route   POST /api/kandydat/:userId/rodzic
 * @desc    Dodaje lub aktualizuje rodzica kandydata
 * @access  Private (kandydat - tylko swoje dane, admin/duszpasterz/kancelaria - wszystkie dane)
 */
router.post('/:userId/rodzic', authorize(['kandydat', 'administrator', 'duszpasterz', 'kancelaria']), kandydatController.saveRodzic);

/**
 * @route   POST /api/kandydat/:userId/grupa
 * @desc    Przypisuje kandydata do grupy
 * @access  Private (admin/duszpasterz/kancelaria/animator)
 */
router.post('/:userId/grupa', authorize(['administrator', 'duszpasterz', 'kancelaria', 'animator']), kandydatController.assignToGrupa);

/**
 * @route   POST /api/kandydat/:userId/swiadek
 * @desc    Dodaje lub aktualizuje świadka kandydata
 * @access  Private (kandydat - tylko swoje dane, admin/duszpasterz/kancelaria/animator/rodzic - wszystkie dane)
 */
router.post('/:userId/swiadek', authorize(['kandydat', 'administrator', 'duszpasterz', 'kancelaria', 'animator', 'rodzic']), kandydatController.saveSwiadek);

/**
 * @route   POST /api/kandydat/:userId/imie-bierzmowania
 * @desc    Dodaje lub aktualizuje imię bierzmowania kandydata
 * @access  Private (kandydat - tylko swoje dane, admin/duszpasterz/kancelaria - wszystkie dane)
 */
router.post('/:userId/imie-bierzmowania', authorize(['kandydat', 'administrator', 'duszpasterz', 'kancelaria']), kandydatController.saveImieBierzmowania);

/**
 * @route   POST /api/kandydat/:userId/szkola
 * @desc    Dodaje lub aktualizuje dane szkolne kandydata
 * @access  Private (kandydat - tylko swoje dane, admin/duszpasterz/kancelaria - wszystkie dane)
 */
router.post('/:userId/szkola', authorize(['kandydat', 'administrator', 'duszpasterz', 'kancelaria']), async (req, res) => {
  console.log('=== SZKOLA ROUTE RECEIVED REQUEST ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Authenticated user:', req.user ? req.user.id : 'No user');
  
  try {
    // Pass the request to the controller
    await kandydatController.saveSzkola(req, res);
  } catch (error) {
    console.error('ROUTE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas przetwarzania żądania',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/kandydat/:userId/parafia
 * @desc    Przypisuje kandydata do parafii
 * @access  Private (kandydat - tylko swoje dane, admin/duszpasterz/kancelaria - wszystkie dane)
 */
router.post('/:userId/parafia', authorize(['kandydat', 'administrator', 'duszpasterz', 'kancelaria']), kandydatController.assignToParafia);

module.exports = router; 