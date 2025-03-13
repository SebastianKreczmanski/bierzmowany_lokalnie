const jwt = require('jsonwebtoken');

/**
 * Middleware uwierzytelniania - sprawdza, czy użytkownik jest zalogowany
 * @param {Object} req - Obiekt żądania
 * @param {Object} res - Obiekt odpowiedzi
 * @param {Function} next - Funkcja przekazująca kontrolę do następnego middleware
 */
const authenticate = (req, res, next) => {
  try {
    // Pobieramy token z ciasteczka
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Nie jesteś zalogowany'
      });
    }

    // Weryfikujemy token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Zapisujemy dane użytkownika w obiekcie żądania
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Błąd uwierzytelniania:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesja wygasła, zaloguj się ponownie'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Nieprawidłowy token, zaloguj się ponownie'
    });
  }
};

/**
 * Middleware autoryzacji - sprawdza, czy użytkownik ma wymaganą rolę
 * @param {string|Array} roles - Wymagana rola lub tablica ról
 * @returns {Function} Middleware
 */
const authorize = (roles) => {
  return (req, res, next) => {
    try {
      // Najpierw sprawdzamy, czy użytkownik jest zalogowany
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Nie jesteś zalogowany'
        });
      }

      // Pobieramy role użytkownika
      const userRoles = req.user.roles || [];
      
      // Konwertujemy pojedynczą rolę do tablicy
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      // Sprawdzamy, czy użytkownik ma którąkolwiek z wymaganych ról
      const hasRequiredRole = userRoles.some(role => requiredRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'Nie masz uprawnień do wykonania tej akcji'
        });
      }
      
      next();
    } catch (error) {
      console.error('Błąd autoryzacji:', error.message);
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas autoryzacji'
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize
}; 