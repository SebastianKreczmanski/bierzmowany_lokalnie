const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * Kontroler uwierzytelniania - obsługuje logowanie, wylogowywanie i sprawdzanie sesji
 */
const AuthController = {
  /**
   * Logowanie użytkownika
   * @param {Object} req - Obiekt żądania
   * @param {Object} res - Obiekt odpowiedzi
   */
  async login(req, res) {
    console.log('Login attempt starting...');
    console.log('Request body:', req.body);
    
    try {
      const { identifier, password } = req.body;
      
      // Sprawdzamy, czy podano dane
      if (!identifier || !password) {
        console.log('Login failed: Missing identifier or password');
        return res.status(400).json({
          success: false,
          message: 'Wymagany jest email/nazwa użytkownika i hasło'
        });
      }

      console.log('Looking up user with identifier:', identifier);
      // Pobieramy użytkownika z bazy (może być login lub email)
      const user = await UserModel.findByEmailOrUsername(identifier);
      
      // Sprawdzamy, czy użytkownik istnieje
      if (!user) {
        console.log('Login failed: User not found');
        return res.status(401).json({
          success: false,
          message: 'Nieprawidłowy login/email lub hasło'
        });
      }
      
      console.log('User found:', { id: user.id, username: user.username });

      // Sprawdzamy hasło
      console.log('Verifying password...');
      const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        console.log('Login failed: Invalid password');
        return res.status(401).json({
          success: false,
          message: 'Nieprawidłowy login/email lub hasło'
        });
      }
      
      console.log('Password verified successfully');

      // Pobieramy role użytkownika
      console.log('Getting user roles...');
      const roles = await UserModel.getUserRoles(user.id);
      console.log('User roles:', roles);

      // Tworzymy payload tokenu JWT
      const payload = {
        id: user.id,
        username: user.username,
        imie: user.imie,
        nazwisko: user.nazwisko,
        roles
      };

      console.log('Creating JWT token...');
      // Generujemy token JWT
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h' // 24 godziny
      });
      
      console.log('JWT token created successfully');

      // Ustawiamy token w ciasteczku
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: parseInt(process.env.TOKEN_EXPIRY || 86400) * 1000, // w milisekundach
        secure: false, // Set to false for development (HTTP)
        sameSite: 'lax',
        path: '/'
      });
      
      console.log('Auth cookie set');

      // Zwracamy dane użytkownika (bez hasła)
      const { password_hash, ...userData } = user;
      
      console.log('Login successful for user:', user.username);
      res.json({
        success: true,
        message: 'Zalogowano pomyślnie',
        user: {
          ...userData,
          roles
        }
      });
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas logowania'
      });
    }
  },

  /**
   * Wylogowanie użytkownika
   * @param {Object} req - Obiekt żądania
   * @param {Object} res - Obiekt odpowiedzi
   */
  logout(req, res) {
    try {
      // Usuwamy ciasteczko z tokenem
      res.clearCookie('auth_token');
      
      res.json({
        success: true,
        message: 'Wylogowano pomyślnie'
      });
    } catch (error) {
      console.error('Błąd wylogowania:', error.message);
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas wylogowania'
      });
    }
  },

  /**
   * Sprawdzanie sesji użytkownika
   * @param {Object} req - Obiekt żądania
   * @param {Object} res - Obiekt odpowiedzi
   */
  checkSession(req, res) {
    try {
      // Dane użytkownika przekazane przez middleware
      const user = req.user;
      
      res.json({
        success: true,
        isLoggedIn: true,
        user
      });
    } catch (error) {
      console.error('Błąd sprawdzania sesji:', error.message);
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas sprawdzania sesji'
      });
    }
  },

  /**
   * Odświeżanie tokenu JWT
   * @param {Object} req - Obiekt żądania
   * @param {Object} res - Obiekt odpowiedzi
   */
  async refreshToken(req, res) {
    try {
      // Pobieramy token z ciasteczka
      const token = req.cookies.auth_token;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Brak tokenu do odświeżenia'
        });
      }
      
      try {
        // Dekodujemy token, aby uzyskać informacje o użytkowniku
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
        
        // Debug: Sprawdzamy informacje o tokenie
        const currentTime = Math.floor(Date.now() / 1000);
        console.log(`Debug token: Wygasa za ${decoded.exp - currentTime} sekund`);
        console.log(`Debug token: Czas serwera: ${currentTime}, czas wygaśnięcia: ${decoded.exp}`);
        
        // Pobieramy ID użytkownika z tokenu
        const userId = decoded.id;
        
        // Pobieramy użytkownika z bazy danych
        const query = 'SELECT * FROM user WHERE id = ? AND deleted_at IS NULL';
        const [users] = await db.query(query, [userId]);
        
        if (users.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'Użytkownik nie istnieje'
          });
        }
        
        const user = users[0];
        
        // Pobieramy role użytkownika
        const rolesQuery = `
          SELECT r.nazwa
          FROM role r
          JOIN user_role ur ON r.id = ur.role_id
          WHERE ur.user_id = ?
        `;
        
        const [userRoles] = await db.query(rolesQuery, [user.id]);
        const roles = userRoles.map(role => role.nazwa);
        
        // Tworzymy nowy token JWT
        const newToken = jwt.sign(
          { 
            id: user.id,
            username: user.username,
            roles: roles
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        // Ustawiamy cookie z nowym tokenem
        res.cookie('auth_token', newToken, {
          httpOnly: true,
          secure: false, // Set to false for development (HTTP)
          maxAge: parseInt(process.env.TOKEN_EXPIRY || 86400) * 1000, // 24 godziny w milisekundach
          sameSite: 'lax',
          path: '/'
        });
        
        // Przygotowujemy dane użytkownika do zwrócenia
        const userData = {
          id: user.id,
          username: user.username,
          imie: user.imie,
          nazwisko: user.nazwisko,
          roles: roles
        };
        
        res.json({
          success: true,
          message: 'Token odświeżony pomyślnie',
          user: userData
        });
      } catch (jwtError) {
        console.error('Błąd JWT podczas odświeżania tokenu:', jwtError);
        
        return res.status(401).json({
          success: false,
          message: 'Nie można odświeżyć tokenu. Zaloguj się ponownie.'
        });
      }
    } catch (error) {
      console.error('Błąd odświeżania tokenu:', error);
      
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas odświeżania tokenu'
      });
    }
  }
};

module.exports = AuthController; 