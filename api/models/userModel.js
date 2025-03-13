const { query } = require('../db');
const crypto = require('crypto');

/**
 * Model użytkownika - operacje na bazie danych związane z użytkownikami
 */
const UserModel = {
  /**
   * Pobiera użytkownika po nazwie użytkownika
   * @param {string} username - Nazwa użytkownika
   * @returns {Promise<Object|null>} - Dane użytkownika lub null
   */
  async findByUsername(username) {
    try {
      const sql = `
        SELECT * FROM user 
        WHERE username = ? AND deleted_at IS NULL
      `;
      const results = await query(sql, [username]);
      return results.length ? results[0] : null;
    } catch (error) {
      console.error('Błąd pobierania użytkownika:', error.message);
      throw error;
    }
  },

  /**
   * Pobiera użytkownika po adresie email lub nazwie użytkownika
   * @param {string} identifier - Adres email lub nazwa użytkownika
   * @returns {Promise<Object|null>} - Dane użytkownika lub null
   */
  async findByEmailOrUsername(identifier) {
    try {
      console.log('findByEmailOrUsername called with identifier:', identifier);
      
      // Sprawdzamy, czy identifier jest adresem email (zawiera @)
      const isEmail = identifier.includes('@');
      console.log('isEmail:', isEmail);
      
      if (isEmail) {
        // Jeśli jest to email, szukamy w tabeli 'emaile', a następnie pobieramy dane użytkownika
        const sqlEmail = `
          SELECT u.* 
          FROM user u
          JOIN emaile e ON u.id = e.user_id
          WHERE e.email = ? AND u.deleted_at IS NULL
        `;
        console.log('Executing SQL query for email:', sqlEmail);
        const resultsEmail = await query(sqlEmail, [identifier]);
        console.log('Email query results:', resultsEmail);
        return resultsEmail.length ? resultsEmail[0] : null;
      } else {
        // Jeśli to nie email, szukamy po nazwie użytkownika
        const sqlUsername = `
          SELECT * FROM user 
          WHERE username = ? AND deleted_at IS NULL
        `;
        console.log('Executing SQL query for username:', sqlUsername);
        const resultsUsername = await query(sqlUsername, [identifier]);
        console.log('Username query results:', resultsUsername);
        return resultsUsername.length ? resultsUsername[0] : null;
      }
    } catch (error) {
      console.error('Error in findByEmailOrUsername:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  /**
   * Pobiera role użytkownika
   * @param {number} userId - ID użytkownika
   * @returns {Promise<Array>} - Lista ról użytkownika
   */
  async getUserRoles(userId) {
    try {
      const sql = `
        SELECT r.nazwa 
        FROM role r
        JOIN user_role ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
      `;
      const results = await query(sql, [userId]);
      return results.map(row => row.nazwa);
    } catch (error) {
      console.error('Błąd pobierania ról użytkownika:', error.message);
      throw error;
    }
  },

  /**
   * Weryfikuje hasło użytkownika
   * @param {string} plainPassword - Wprowadzone hasło
   * @param {string} hashedPassword - Zahaszowane hasło z bazy
   * @returns {Promise<boolean>} - Czy hasła się zgadzają
   */
  async verifyPassword(plainPassword, hashedPassword) {
    try {
      console.log('Wprowadzone hasło (plaintext):', plainPassword);
      console.log('Hash z bazy danych:', hashedPassword);
      
      // 1. Standardowy SHA-256
      const standardHash = crypto.createHash('sha256').update(plainPassword).digest('hex');
      console.log('Hash SHA-256 standardowy:', standardHash);
      
      // Sprawdzamy standardowy hash
      if (standardHash === hashedPassword) {
        console.log('Dopasowano: standardowy SHA-256');
        return true;
      }
      
      // 2. Hashowanie z solą jako secret z JWT
      const jwtSecret = process.env.JWT_SECRET || '672a3d3d0b4e96e0f36d314a58974a16c6e934f4a276462bc9f23c9083043e11';
      
      // 2.1. SHA-256 z solą JWT_SECRET na początku
      const hashWithSaltBefore = crypto.createHash('sha256').update(jwtSecret + plainPassword).digest('hex');
      console.log('Hash SHA-256 z solą JWT_SECRET przed hasłem:', hashWithSaltBefore);
      
      if (hashWithSaltBefore === hashedPassword) {
        console.log('Dopasowano: SHA-256 z solą JWT_SECRET przed hasłem');
        return true;
      }
      
      // 2.2. SHA-256 z solą JWT_SECRET na końcu
      const hashWithSaltAfter = crypto.createHash('sha256').update(plainPassword + jwtSecret).digest('hex');
      console.log('Hash SHA-256 z solą JWT_SECRET po haśle:', hashWithSaltAfter);
      
      if (hashWithSaltAfter === hashedPassword) {
        console.log('Dopasowano: SHA-256 z solą JWT_SECRET po haśle');
        return true;
      }
      
      // 2.3. SHA-256 z solą JWT_SECRET przed i po haśle
      const hashWithSaltBeforeAfter = crypto.createHash('sha256').update(jwtSecret + plainPassword + jwtSecret).digest('hex');
      console.log('Hash SHA-256 z solą JWT_SECRET przed i po haśle:', hashWithSaltBeforeAfter);
      
      if (hashWithSaltBeforeAfter === hashedPassword) {
        console.log('Dopasowano: SHA-256 z solą JWT_SECRET przed i po haśle');
        return true;
      }
      
      // 3. Podwójne hashowanie (sha256(sha256(password)))
      const doubleHash = crypto.createHash('sha256').update(standardHash).digest('hex');
      console.log('Hash podwójny SHA-256:', doubleHash);
      
      if (doubleHash === hashedPassword) {
        console.log('Dopasowano: podwójny SHA-256');
        return true;
      }
      
      // 4. Podwójne hashowanie z solą na początku
      const doubleHashWithSaltBefore = crypto.createHash('sha256').update(jwtSecret + standardHash).digest('hex');
      console.log('Hash podwójny SHA-256 z solą JWT_SECRET przed hashem:', doubleHashWithSaltBefore);
      
      if (doubleHashWithSaltBefore === hashedPassword) {
        console.log('Dopasowano: podwójny SHA-256 z solą JWT_SECRET przed hashem');
        return true;
      }
      
      // 5. Podwójne hashowanie z solą na końcu
      const doubleHashWithSaltAfter = crypto.createHash('sha256').update(standardHash + jwtSecret).digest('hex');
      console.log('Hash podwójny SHA-256 z solą JWT_SECRET po hashu:', doubleHashWithSaltAfter);
      
      if (doubleHashWithSaltAfter === hashedPassword) {
        console.log('Dopasowano: podwójny SHA-256 z solą JWT_SECRET po hashu');
        return true;
      }
      
      // 6. Podwójne hashowanie z solą przed i po hashu
      const doubleHashWithSaltBeforeAfter = crypto.createHash('sha256').update(jwtSecret + standardHash + jwtSecret).digest('hex');
      console.log('Hash podwójny SHA-256 z solą JWT_SECRET przed i po hashu:', doubleHashWithSaltBeforeAfter);
      
      if (doubleHashWithSaltBeforeAfter === hashedPassword) {
        console.log('Dopasowano: podwójny SHA-256 z solą JWT_SECRET przed i po hashu');
        return true;
      }
      
      // Nie znaleziono pasującego algorytmu hashowania
      console.log('Nie znaleziono pasującego algorytmu hashowania');
      return false;
    } catch (error) {
      console.error('Błąd weryfikacji hasła:', error.message);
      throw error;
    }
  }
};

module.exports = UserModel; 