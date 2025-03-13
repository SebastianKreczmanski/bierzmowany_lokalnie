const jwt = require('jsonwebtoken');

/**
 * Weryfikuje token JWT z nagłówka lub ciasteczka
 */
const verifyToken = (req, res, next) => {
  try {
    // Pobieramy token z nagłówka Authorization lub z ciasteczka
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Brak tokena uwierzytelniającego'
      });
    }

    try {
      // Weryfikujemy token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Zapisujemy dane użytkownika w obiekcie żądania
      req.user = decoded;
      
      next();
    } catch (jwtError) {
      console.error('Błąd weryfikacji JWT:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Sesja wygasła, zaloguj się ponownie',
          errorType: 'TOKEN_EXPIRED'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Nieprawidłowy token, zaloguj się ponownie',
          errorType: 'INVALID_TOKEN'
        });
      }
      
      res.status(401).json({
        success: false,
        message: 'Błąd uwierzytelniania',
        errorType: 'AUTH_ERROR'
      });
    }
  } catch (error) {
    console.error('Błąd uwierzytelniania:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd serwera podczas uwierzytelniania'
    });
  }
};

/**
 * Weryfikuje czy użytkownik ma wymaganą rolę
 */
const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Nie jesteś zalogowany'
      });
    }

    if (!req.user.roles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Brak uprawnień. Wymagana rola: ${role}`
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  checkRole
}; 