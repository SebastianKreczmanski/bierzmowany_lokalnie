const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const crypto = require('crypto');

/**
 * @route  GET /api/users
 * @desc   Get all users with their roles
 * @access Private (Admin only) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get('/', async (req, res) => {
  try {
    // Query to get all users with their roles
    const query = `
      SELECT u.id, u.username, u.imie, u.nazwisko, u.data_urodzenia, 
             GROUP_CONCAT(r.nazwa) as roles
      FROM user u
      LEFT JOIN user_role ur ON u.id = ur.user_id
      LEFT JOIN role r ON ur.role_id = r.id
      WHERE u.deleted_at IS NULL
      GROUP BY u.id
      ORDER BY u.id DESC
    `;
    
    const users = await db.query(query);
    
    // Format the response
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      imie: user.imie,
      nazwisko: user.nazwisko,
      data_urodzenia: user.data_urodzenia,
      roles: user.roles ? user.roles.split(',') : []
    }));
    
    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania użytkowników',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  GET /api/users/by-role/:roleName
 * @desc   Get users by role
 * @access Private (Admin only) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get('/by-role/:roleName', async (req, res) => {
  try {
    const { roleName } = req.params;
    
    // Query to get users with a specific role
    const query = `
      SELECT u.id, u.username, u.imie, u.nazwisko, u.data_urodzenia, 
             GROUP_CONCAT(r.nazwa) as roles
      FROM user u
      JOIN user_role ur ON u.id = ur.user_id
      JOIN role r ON ur.role_id = r.id
      WHERE u.deleted_at IS NULL AND r.nazwa = ?
      GROUP BY u.id
      ORDER BY u.nazwisko, u.imie
    `;
    
    const users = await db.query(query, [roleName]);
    
    // Format the response
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      imie: user.imie,
      nazwisko: user.nazwisko,
      data_urodzenia: user.data_urodzenia,
      roles: user.roles ? user.roles.split(',') : []
    }));
    
    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error(`Error fetching users with role ${req.params.roleName}:`, error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania użytkowników',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  POST /api/users
 * @desc   Create a new user
 * @access Private (Admin only) - TEMPORARILY PUBLIC FOR TESTING
 */
router.post('/', async (req, res) => {
  try {
    const { 
      username, 
      password, 
      imie, 
      nazwisko, 
      data_urodzenia, 
      email,
      telefon,
      roles,
      adres
    } = req.body;
    
    // Log the received data (excluding password)
    console.log('Creating user with data:', {
      username,
      imie,
      nazwisko,
      data_urodzenia,
      email,
      telefon,
      roles,
      adres
    });
    
    // Validate required fields
    if (!username || !password || !imie || !nazwisko || !roles || !roles.length) {
      return res.status(400).json({
        success: false,
        message: 'Brakuje wymaganych pól'
      });
    }
    
    // Start a transaction
    await db.query('START TRANSACTION');
    
    try {
      // Hash the password
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      
      // Insert the user
      const insertUserQuery = `
        INSERT INTO user (username, password_hash, imie, nazwisko, data_urodzenia)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const userResult = await db.query(insertUserQuery, [
        username, 
        passwordHash, 
        imie, 
        nazwisko, 
        data_urodzenia || null
      ]);
      
      const userId = userResult.insertId;
      
      // Add user roles
      for (const roleName of roles) {
        // Get role ID
        console.log(`Looking up role ID for role: "${roleName}"`);
        const roleQuery = await db.query('SELECT id FROM role WHERE nazwa = ?', [roleName]);
        
        if (roleQuery.length > 0) {
          const roleId = roleQuery[0].id;
          console.log(`Found role ID ${roleId} for "${roleName}", adding to user ${userId}`);
          await db.query('INSERT INTO user_role (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
        } else {
          console.warn(`Role "${roleName}" not found in database, skipping`);
        }
      }
      
      // Add email if provided
      if (email) {
        await db.query(
          'INSERT INTO emaile (user_id, email, glowny) VALUES (?, ?, 1)',
          [userId, email]
        );
      }
      
      // Add phone if provided
      if (telefon) {
        await db.query(
          'INSERT INTO telefony (user_id, numer, glowny) VALUES (?, ?, 1)',
          [userId, telefon]
        );
      }
      
      // Add address if provided
      if (adres && typeof adres === 'object') {
        // Check if needed fields are provided for address
        if (adres.ulica_id && adres.nr_budynku && adres.kod_pocztowy) {
          // Create new address
          const insertAdresQuery = `
            INSERT INTO adresy (ulica_id, nr_budynku, nr_lokalu, kod_pocztowy)
            VALUES (?, ?, ?, ?)
          `;
          
          const adresResult = await db.query(insertAdresQuery, [
            adres.ulica_id,
            adres.nr_budynku,
            adres.nr_lokalu || null,
            adres.kod_pocztowy
          ]);
          
          const adresId = adresResult.insertId;
          
          // Add entry to junction table
          await db.query(
            'INSERT INTO adresy_user (user_id, adres_id) VALUES (?, ?)',
            [userId, adresId]
          );
          
          console.log('Utworzono nowy adres:', adresId, 'i powiązano z użytkownikiem:', userId);
        } else {
          console.warn('Niepełne dane adresu, pomijam tworzenie adresu');
        }
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Użytkownik został utworzony',
        data: { id: userId }
      });
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas tworzenia użytkownika',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  GET /api/users/:id
 * @desc   Get user details by ID
 * @access Private (Admin only) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user details with address from junction table
    const userQuery = `
      SELECT 
        u.id, 
        u.username, 
        u.imie, 
        u.nazwisko, 
        u.data_urodzenia, 
        au.adres_id,
        a.nr_budynku,
        a.nr_lokalu,
        a.kod_pocztowy,
        ul.id as ulica_id,
        ul.nazwa as ulica_nazwa,
        m.id as miejscowosc_id,
        m.nazwa as miejscowosc_nazwa,
        e.email, 
        t.numer as telefon,
        GROUP_CONCAT(DISTINCT r.nazwa) as roles
      FROM 
        user u
      LEFT JOIN 
        adresy_user au ON u.id = au.user_id
      LEFT JOIN 
        adresy a ON au.adres_id = a.id
      LEFT JOIN 
        ulice ul ON a.ulica_id = ul.id
      LEFT JOIN 
        miejscowosci m ON ul.miejscowosc_id = m.id
      LEFT JOIN 
        emaile e ON u.id = e.user_id AND e.glowny = 1
      LEFT JOIN 
        telefony t ON u.id = t.user_id AND t.glowny = 1
      LEFT JOIN 
        user_role ur ON u.id = ur.user_id
      LEFT JOIN 
        role r ON ur.role_id = r.id
      WHERE 
        u.id = ? AND u.deleted_at IS NULL
      GROUP BY 
        u.id
    `;
    
    const users = await db.query(userQuery, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }
    
    const user = users[0];
    
    // Format user data
    const userData = {
      id: user.id,
      username: user.username,
      imie: user.imie,
      nazwisko: user.nazwisko,
      data_urodzenia: user.data_urodzenia,
      email: user.email,
      telefon: user.telefon,
      roles: user.roles ? user.roles.split(',') : []
    };

    // Add address information if available
    if (user.adres_id) {
      userData.adres = {
        id: user.adres_id,
        ulica_id: user.ulica_id,
        ulica_nazwa: user.ulica_nazwa,
        miejscowosc_id: user.miejscowosc_id,
        miejscowosc_nazwa: user.miejscowosc_nazwa,
        nr_budynku: user.nr_budynku || '',
        nr_lokalu: user.nr_lokalu || '',
        kod_pocztowy: user.kod_pocztowy || ''
      };
      
      console.log('Pobrano dane adresowe dla użytkownika:', userData.adres);
    } else {
      console.log('Użytkownik nie ma przypisanego adresu');
    }

    // Get parish information for the user
    const parafiaQuery = `
      SELECT 
        p.id, 
        wp.nazwa as wezwanie,
        p.email,
        p.telefon,
        a.nr_budynku,
        a.nr_lokalu,
        a.kod_pocztowy,
        ul.nazwa as ulica_nazwa,
        m.nazwa as miejscowosc_nazwa
      FROM 
        parafia_user pu
      JOIN 
        parafia p ON pu.parafia_id = p.id
      JOIN 
        wezwania_parafii wp ON p.wezwanie_id = wp.id
      JOIN 
        adresy a ON p.adres_id = a.id
      JOIN 
        ulice ul ON a.ulica_id = ul.id
      JOIN 
        miejscowosci m ON ul.miejscowosc_id = m.id
      WHERE 
        pu.user_id = ?
    `;

    const parafie = await db.query(parafiaQuery, [userId]);
    
    if (parafie.length > 0) {
      const parafia = parafie[0];
      userData.parafia = {
        id: parafia.id,
        wezwanie: parafia.wezwanie,
        email: parafia.email,
        telefon: parafia.telefon,
        adres: {
          ulica: parafia.ulica_nazwa,
          miejscowosc: parafia.miejscowosc_nazwa,
          nr_budynku: parafia.nr_budynku,
          nr_lokalu: parafia.nr_lokalu,
          kod_pocztowy: parafia.kod_pocztowy
        }
      };
    }
    
    // If user has 'rodzic' role, get assigned candidates
    if (userData.roles.includes('rodzic')) {
      const candidatesQuery = `
        SELECT u.id, u.imie, u.nazwisko, u.username
        FROM user u
        JOIN rodzic_kandydat rk ON u.id = rk.kandydat_id
        JOIN rodzic r ON rk.rodzic_id = r.id
        WHERE r.user_id = ?
      `;
      
      const candidates = await db.query(candidatesQuery, [userId]);
      userData.przypisani_kandydaci = candidates;
    }
    
    // If user has 'animator' role, get assigned groups
    if (userData.roles.includes('animator')) {
      const grupyQuery = `
        SELECT g.id, g.nazwa
        FROM grupa g
        WHERE g.animator_id = ?
      `;
      
      const grupy = await db.query(grupyQuery, [userId]);
      userData.przypisane_grupy = grupy;
    }
    
    // If user has 'kandydat' role, get candidate-specific data
    if (userData.roles.includes('kandydat')) {
      // Get school information
      const uczenQuery = `
        SELECT 
          u.id, 
          u.szkola_id, 
          u.klasa, 
          u.rok_szkolny,
          s.nazwa as szkola_nazwa
        FROM 
          uczen u
        JOIN 
          szkola s ON u.szkola_id = s.id
        WHERE 
          u.user_id = ?
      `;
      
      const uczenData = await db.query(uczenQuery, [userId]);
      console.log('Dane ucznia dla kandydata ID:', userId, uczenData);
      
      if (uczenData && uczenData.length > 0) {
        userData.szkola = {
          id: uczenData[0].id,
          szkola_id: uczenData[0].szkola_id,
          nazwa: uczenData[0].szkola_nazwa,
          klasa: uczenData[0].klasa,
          rok_szkolny: uczenData[0].rok_szkolny
        };
      }
      
      // Get parents information
      const rodziceQuery = `
        SELECT 
          r.id, 
          r.imie, 
          r.nazwisko, 
          r.adres_id,
          u.id as user_id,
          e.email,
          t.numer as telefon
        FROM 
          rodzic r
        JOIN 
          rodzic_kandydat rk ON r.id = rk.rodzic_id
        JOIN 
          user u ON r.user_id = u.id
        LEFT JOIN 
          emaile e ON u.id = e.user_id AND e.glowny = 1
        LEFT JOIN 
          telefony t ON u.id = t.user_id AND t.glowny = 1
        WHERE 
          rk.kandydat_id = ?
      `;
      
      const rodzice = await db.query(rodziceQuery, [userId]);
      userData.rodzice = rodzice.length > 0 ? rodzice : [];
      
      // Get witness information
      const swiadekQuery = `
        SELECT 
          s.id, 
          s.imie, 
          s.nazwisko, 
          s.adres_id,
          sk.email,
          sk.telefon
        FROM 
          swiadek s
        LEFT JOIN 
          swiadek_kontakt sk ON s.id = sk.swiadek_id
        WHERE 
          s.user_id = ?
      `;
      
      const swiadkowie = await db.query(swiadekQuery, [userId]);
      userData.swiadkowie = swiadkowie.length > 0 ? swiadkowie : [];
    }
    
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania szczegółów użytkownika',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  PUT /api/users/:id
 * @desc   Update user
 * @access Private (Admin only) - TEMPORARILY PUBLIC FOR TESTING
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use let for all variables that might be modified
    const { 
      username, 
      password, 
      imie, 
      nazwisko,
      roles,
      email,
      telefon,
      parafiaId,
      rodzic,
      swiadek,
      adres
    } = req.body;
    
    // Extract data_urodzenia separately with 'let' since we'll modify it
    let { data_urodzenia } = req.body;
    
    // Dodaj logi dla lepszego debugowania
    console.log('Aktualizacja użytkownika ID:', id);
    console.log('Otrzymane dane:', {
      username,
      password: password ? '[MASKED]' : undefined,
      imie,
      nazwisko,
      data_urodzenia,
      email,
      telefon,
      roles,
      parafiaId: parafiaId || undefined,
      rodzic: rodzic ? '[OBJECT]' : undefined,
      swiadek: swiadek ? '[OBJECT]' : undefined,
      adres: adres ? '[OBJECT]' : undefined
    });
    
    // DODANIE BARDZIEJ SZCZEGÓŁOWEJ WALIDACJI SQL PRZED ROZPOCZĘCIEM TRANSAKCJI
    try {
      if (data_urodzenia) {
        // Zmienne do przechowywania wyodrębnionej daty
        let year, month, day;
        let isValid = false;
        
        // Sprawdź, czy to format YYYY.MM.DD (preferowany format)
        const yyyymmddDotsRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
        const yyyymmddDotsMatch = data_urodzenia.match(yyyymmddDotsRegex);
        
        if (yyyymmddDotsMatch) {
          console.log('Wykryto format YYYY.MM.DD:', data_urodzenia);
          year = parseInt(yyyymmddDotsMatch[1], 10);
          month = parseInt(yyyymmddDotsMatch[2], 10);
          day = parseInt(yyyymmddDotsMatch[3], 10);
          isValid = true;
        } 
        // Sprawdź, czy to format DD.MM.YYYY
        else {
          const ddmmyyyyRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
          const ddmmyyyyMatch = data_urodzenia.match(ddmmyyyyRegex);
          
          if (ddmmyyyyMatch) {
            console.log('Wykryto format DD.MM.YYYY:', data_urodzenia);
            day = parseInt(ddmmyyyyMatch[1], 10);
            month = parseInt(ddmmyyyyMatch[2], 10);
            year = parseInt(ddmmyyyyMatch[3], 10);
            isValid = true;
          } 
          // Sprawdź, czy to format YYYY-MM-DD
          else {
            const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
            const yyyymmddMatch = data_urodzenia.match(yyyymmddRegex);
            
            if (yyyymmddMatch) {
              console.log('Wykryto format YYYY-MM-DD:', data_urodzenia);
              year = parseInt(yyyymmddMatch[1], 10);
              month = parseInt(yyyymmddMatch[2], 10);
              day = parseInt(yyyymmddMatch[3], 10);
              isValid = true;
            }
          }
        }
        
        if (!isValid) {
          console.warn('Nieprawidłowy format daty:', data_urodzenia);
          throw new Error('Nieprawidłowy format daty urodzenia. Wymagany format: YYYY.MM.DD lub DD.MM.YYYY');
        }
        
        // Sprawdź wartości liczbowe
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          console.warn('Data zawiera nieprawidłowe wartości (NaN):', data_urodzenia);
          throw new Error('Data urodzenia zawiera nieprawidłowe wartości');
        }
        
        // Sprawdź zakres wartości
        const isValidRange = (
          year >= 1900 && year <= 2100 &&
          month >= 1 && month <= 12 &&
          day >= 1 && day <= 31
        );
        
        if (!isValidRange) {
          console.warn('Nieprawidłowe wartości daty:', { year, month, day });
          throw new Error(`Data urodzenia zawiera nieprawidłowe wartości: rok=${year}, miesiąc=${month}, dzień=${day}`);
        }
        
        // Sformatuj datę do formatu YYYY-MM-DD dla MySQL
        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Sprawdź czy data faktycznie istnieje (np. 30 lutego nie istnieje)
        const testDate = new Date(formattedDate);
        if (
          testDate.getFullYear() !== year ||
          testDate.getMonth() + 1 !== month ||
          testDate.getDate() !== day
        ) {
          console.warn('Data nie istnieje w kalendarzu:', formattedDate);
          throw new Error('Podana data nie istnieje w kalendarzu');
        }
        
        // Przypisz sformatowaną datę
        data_urodzenia = formattedDate;
        console.log('Sformatowana data do zapisu w bazie:', data_urodzenia);
      }
    } catch (validationError) {
      console.error('Błąd walidacji daty:', validationError.message);
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }
    
    // Start a transaction
    await db.query('START TRANSACTION');
    
    try {
      // Process address update if provided
      let adresId = null;
      
      if (adres && typeof adres === 'object') {
        console.log('Przetwarzanie adresu:', adres);
        
        // Check if needed fields are provided
        if (adres.ulica_id && adres.nr_budynku && adres.kod_pocztowy) {
          // First check if user already has an address in the junction table
          const userAdresQuery = await db.query(
            'SELECT adres_id FROM adresy_user WHERE user_id = ? LIMIT 1', 
            [id]
          );
          
          if (userAdresQuery.length > 0) {
            // Update existing address
            adresId = userAdresQuery[0].adres_id;
            
            const updateAdresQuery = `
              UPDATE adresy 
              SET ulica_id = ?, nr_budynku = ?, nr_lokalu = ?, kod_pocztowy = ?
              WHERE id = ?
            `;
            
            await db.query(updateAdresQuery, [
              adres.ulica_id,
              adres.nr_budynku,
              adres.nr_lokalu || null,
              adres.kod_pocztowy,
              adresId
            ]);
            
            console.log('Zaktualizowano istniejący adres:', adresId);
          } else {
            // Create new address
            const insertAdresQuery = `
              INSERT INTO adresy (ulica_id, nr_budynku, nr_lokalu, kod_pocztowy)
              VALUES (?, ?, ?, ?)
            `;
            
            const adresResult = await db.query(insertAdresQuery, [
              adres.ulica_id,
              adres.nr_budynku,
              adres.nr_lokalu || null,
              adres.kod_pocztowy
            ]);
            
            adresId = adresResult.insertId;
            
            // Add entry to junction table
            await db.query(
              'INSERT INTO adresy_user (user_id, adres_id) VALUES (?, ?)',
              [id, adresId]
            );
            
            console.log('Utworzono nowy adres:', adresId, 'i powiązano z użytkownikiem:', id);
          }
        } else {
          console.warn('Niepełne dane adresu, pomijam aktualizację adresu');
        }
      }

      // Update user basic info
      let updateUserQuery = 'UPDATE user SET ';
      let updateParams = [];
      let updateFields = [];
      
      if (username) {
        updateFields.push('username = ?');
        updateParams.push(username);
      }
      
      if (password) {
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        updateFields.push('password_hash = ?');
        updateParams.push(passwordHash);
      }
      
      if (imie) {
        updateFields.push('imie = ?');
        updateParams.push(imie);
      }
      
      if (nazwisko) {
        updateFields.push('nazwisko = ?');
        updateParams.push(nazwisko);
      }
      
      // Obsługa daty urodzenia
      if (data_urodzenia) {
        // Dodajemy już zwalidowaną i sformatowaną datę
        updateFields.push('data_urodzenia = ?');
        updateParams.push(data_urodzenia);
        console.log('Zapisywanie daty urodzenia do bazy:', data_urodzenia);
      } else if (data_urodzenia === null || data_urodzenia === '') {
        // Jawnie ustawiamy datę urodzenia na NULL, jeśli jej nie ma lub jest pusta
        updateFields.push('data_urodzenia = NULL');
      }
      
      // Note: we don't update adres_id directly in user table anymore
      // instead we use the junction table
      
      if (updateFields.length > 0) {
        updateUserQuery += updateFields.join(', ') + ' WHERE id = ?';
        updateParams.push(id);
        
        console.log('Query SQL:', updateUserQuery);
        console.log('Parametry:', updateParams);
        
        try {
          await db.query(updateUserQuery, updateParams);
          console.log('Aktualizacja podstawowych danych użytkownika zakończona powodzeniem');
        } catch (sqlError) {
          console.error('Błąd SQL podczas aktualizacji użytkownika:', sqlError.message);
          console.error('Błędne zapytanie:', updateUserQuery);
          console.error('Parametry zapytania:', JSON.stringify(updateParams));
          throw new Error(`Błąd SQL: ${sqlError.message}`);
        }
      }
      
      // Update roles if provided - use let for rows
      if (roles && roles.length > 0) {
        // Remove existing roles
        await db.query('DELETE FROM user_role WHERE user_id = ?', [id]);
        
        // Add new roles
        for (const roleName of roles) {
          // Using array destructuring with let
          let roleRows = await db.query('SELECT id FROM role WHERE nazwa = ?', [roleName]);
          
          if (roleRows && roleRows.length > 0) {
            const roleId = roleRows[0].id;
            await db.query('INSERT INTO user_role (user_id, role_id) VALUES (?, ?)', [id, roleId]);
          }
        }
      }
      
      // Update email if provided
      if (email) {
        // Check if user has an email - use let for query results
        let existingEmails = await db.query('SELECT id FROM emaile WHERE user_id = ? AND glowny = 1', [id]);
        
        if (existingEmails && existingEmails.length > 0) {
          // Update existing primary email
          await db.query('UPDATE emaile SET email = ? WHERE user_id = ? AND glowny = 1', [email, id]);
        } else {
          // Add new primary email
          await db.query('INSERT INTO emaile (user_id, email, glowny) VALUES (?, ?, 1)', [id, email]);
        }
      }
      
      // Update phone if provided
      if (telefon) {
        // Check if user has a phone - use let for query results
        let existingPhones = await db.query('SELECT id FROM telefony WHERE user_id = ? AND glowny = 1', [id]);
        
        if (existingPhones && existingPhones.length > 0) {
          // Update existing primary phone
          await db.query('UPDATE telefony SET numer = ? WHERE user_id = ? AND glowny = 1', [telefon, id]);
        } else {
          // Add new primary phone
          await db.query('INSERT INTO telefony (user_id, numer, glowny) VALUES (?, ?, 1)', [id, telefon]);
        }
      }

      // Update parish if provided
      if (parafiaId) {
        console.log('Aktualizacja przypisania parafii:', parafiaId);
        
        // Check if user has a parish assignment
        let existingParafia = await db.query('SELECT id FROM parafia_user WHERE user_id = ?', [id]);
        
        if (existingParafia && existingParafia.length > 0) {
          // Update existing parish assignment
          await db.query('UPDATE parafia_user SET parafia_id = ? WHERE user_id = ?', [parafiaId, id]);
          console.log('Zaktualizowano przypisanie do parafii');
        } else {
          // Add new parish assignment
          await db.query('INSERT INTO parafia_user (user_id, parafia_id) VALUES (?, ?)', [id, parafiaId]);
          console.log('Dodano nowe przypisanie do parafii');
        }
      }

      // Update parent information if provided and user is a kandydat
      if (rodzic && roles && roles.includes('kandydat')) {
        console.log('Aktualizacja danych rodzica:', rodzic);
        
        // Check if this user already has a parent assigned
        const checkRodzicQuery = `
          SELECT r.id, r.user_id
          FROM rodzic r
          JOIN rodzic_kandydat rk ON r.id = rk.rodzic_id
          WHERE rk.kandydat_id = ?
        `;
        
        const existingRodzice = await db.query(checkRodzicQuery, [id]);
        let rodzicId;
        let rodzicUserId;
        
        if (existingRodzice && existingRodzice.length > 0) {
          // Update existing parent
          rodzicId = existingRodzice[0].id;
          rodzicUserId = existingRodzice[0].user_id;
          
          const updateRodzicQuery = `
            UPDATE rodzic
            SET imie = ?, nazwisko = ?, adres_id = ?
            WHERE id = ?
          `;
          
          await db.query(updateRodzicQuery, [
            rodzic.imie,
            rodzic.nazwisko,
            rodzic.adres_id || null,
            rodzicId
          ]);
          
          console.log('Zaktualizowano istniejącego rodzica', rodzicId);
        } else {
          // Create new parent user if needed
          const usernameBase = `rodzic.${rodzic.imie.toLowerCase()}.${rodzic.nazwisko.toLowerCase()}`;
          let username = usernameBase;
          let counter = 1;
          
          // Check if username exists and generate a unique one
          while (true) {
            const checkUsername = await db.query('SELECT id FROM user WHERE username = ?', [username]);
            if (!checkUsername || checkUsername.length === 0) break;
            
            username = `${usernameBase}${counter}`;
            counter++;
          }
          
          // Generate a random password
          const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
          const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
          
          // Insert parent user
          const insertUserQuery = `
            INSERT INTO user (username, password_hash, imie, nazwisko)
            VALUES (?, ?, ?, ?)
          `;
          
          const userResult = await db.query(insertUserQuery, [
            username,
            passwordHash,
            rodzic.imie,
            rodzic.nazwisko
          ]);
          
          rodzicUserId = userResult.insertId;
          
          // Assign parent role
          const roleQuery = await db.query('SELECT id FROM role WHERE nazwa = ?', ['rodzic']);
          if (roleQuery && roleQuery.length > 0) {
            const roleId = roleQuery[0].id;
            await db.query('INSERT INTO user_role (user_id, role_id) VALUES (?, ?)', [rodzicUserId, roleId]);
          }
          
          // Insert parent record
          const insertRodzicQuery = `
            INSERT INTO rodzic (user_id, imie, nazwisko, adres_id)
            VALUES (?, ?, ?, ?)
          `;
          
          const rodzicResult = await db.query(insertRodzicQuery, [
            rodzicUserId,
            rodzic.imie,
            rodzic.nazwisko,
            rodzic.adres_id || null
          ]);
          
          rodzicId = rodzicResult.insertId;
          
          // Link parent to candidate
          await db.query('INSERT INTO rodzic_kandydat (rodzic_id, kandydat_id) VALUES (?, ?)', [rodzicId, id]);
          
          console.log('Utworzono nowego rodzica', rodzicId, 'i powiązano z kandydatem', id);
        }
        
        // Update parent contact information
        if (rodzic.email) {
          const upsertEmailQuery = `
            INSERT INTO emaile (user_id, email, glowny)
            VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE email = VALUES(email)
          `;
          
          await db.query(upsertEmailQuery, [rodzicUserId, rodzic.email]);
        }
        
        if (rodzic.telefon) {
          const upsertTelefonQuery = `
            INSERT INTO telefony (user_id, numer, glowny)
            VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE numer = VALUES(numer)
          `;
          
          await db.query(upsertTelefonQuery, [rodzicUserId, rodzic.telefon]);
        }
      }

      // Update witness information if provided and user is a kandydat
      if (swiadek && roles && roles.includes('kandydat')) {
        console.log('Aktualizacja danych świadka:', swiadek);
        
        // Check if witness already exists for this user
        const checkSwiadekQuery = `
          SELECT id
          FROM swiadek
          WHERE user_id = ?
        `;
        
        const existingSwiadkowie = await db.query(checkSwiadekQuery, [id]);
        let swiadekId;
        
        if (existingSwiadkowie && existingSwiadkowie.length > 0) {
          // Update existing witness
          swiadekId = existingSwiadkowie[0].id;
          
          const updateSwiadekQuery = `
            UPDATE swiadek
            SET imie = ?, nazwisko = ?, adres_id = ?
            WHERE id = ?
          `;
          
          await db.query(updateSwiadekQuery, [
            swiadek.imie,
            swiadek.nazwisko,
            swiadek.adres_id || null,
            swiadekId
          ]);
          
          console.log('Zaktualizowano istniejącego świadka', swiadekId);
        } else {
          // Create new witness
          const insertSwiadekQuery = `
            INSERT INTO swiadek (user_id, imie, nazwisko, adres_id)
            VALUES (?, ?, ?, ?)
          `;
          
          const swiadekResult = await db.query(insertSwiadekQuery, [
            id,
            swiadek.imie,
            swiadek.nazwisko,
            swiadek.adres_id || null
          ]);
          
          swiadekId = swiadekResult.insertId;
          console.log('Utworzono nowego świadka', swiadekId, 'dla kandydata', id);
        }
        
        // Update witness contact information
        const checkKontaktQuery = `
          SELECT id
          FROM swiadek_kontakt
          WHERE swiadek_id = ?
        `;
        
        const existingKontakty = await db.query(checkKontaktQuery, [swiadekId]);
        
        if (existingKontakty && existingKontakty.length > 0) {
          // Update existing contact
          const updateKontaktQuery = `
            UPDATE swiadek_kontakt
            SET telefon = ?, email = ?
            WHERE swiadek_id = ?
          `;
          
          await db.query(updateKontaktQuery, [
            swiadek.telefon || null,
            swiadek.email || null,
            swiadekId
          ]);
        } else {
          // Create new contact
          const insertKontaktQuery = `
            INSERT INTO swiadek_kontakt (swiadek_id, telefon, email)
            VALUES (?, ?, ?)
          `;
          
          await db.query(insertKontaktQuery, [
            swiadekId,
            swiadek.telefon || null,
            swiadek.email || null
          ]);
        }
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Użytkownik został zaktualizowany'
      });
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      console.error('Błąd podczas transakcji:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    // Dodaj szczegółowy log błędu
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas aktualizacji użytkownika',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  DELETE /api/users/:id
 * @desc   Soft delete user
 * @access Private (Admin only) - TEMPORARILY PUBLIC FOR TESTING
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting deleted_at
    await db.query(
      'UPDATE user SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Użytkownik został usunięty'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas usuwania użytkownika',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  GET /api/users/candidates
 * @desc   Get all users with the 'kandydat' role
 * @access Private (Admin, Duszpasterz or Kancelaria only) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get('/candidates', async (req, res) => {
  try {
    // Query to get all users with the 'kandydat' role
    const query = `
      SELECT u.id, u.username, u.imie, u.nazwisko 
      FROM user u
      JOIN user_role ur ON u.id = ur.user_id
      JOIN role r ON ur.role_id = r.id
      WHERE r.nazwa = 'kandydat' AND u.deleted_at IS NULL
      ORDER BY u.nazwisko, u.imie
    `;
    
    const candidates = await db.query(query);
    
    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania kandydatów',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  GET /api/users/dane/rodzice
 * @desc   Get all parents for dropdowns
 * @access Public 
 */
router.get('/dane/rodzice', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id, 
        r.imie,
        r.nazwisko,
        e.email,
        t.numer AS telefon
      FROM 
        rodzic r
      JOIN 
        user u ON r.user_id = u.id
      LEFT JOIN 
        emaile e ON u.id = e.user_id AND e.glowny = 1
      LEFT JOIN 
        telefony t ON u.id = t.user_id AND t.glowny = 1
      WHERE 
        u.deleted_at IS NULL
      ORDER BY 
        r.nazwisko, r.imie
    `;
    
    const rodzice = await db.query(query);
    
    // Format the data for the frontend
    const formattedRodzice = rodzice.map(rodzic => ({
      id: rodzic.id,
      nazwa: `${rodzic.imie} ${rodzic.nazwisko}${rodzic.telefon ? ` (tel: ${rodzic.telefon})` : ''}`,
      imie: rodzic.imie,
      nazwisko: rodzic.nazwisko,
      email: rodzic.email,
      telefon: rodzic.telefon
    }));
    
    res.json({
      success: true,
      data: formattedRodzice
    });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania listy rodziców',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  GET /api/users/dane/swiadkowie
 * @desc   Get all witnesses for dropdowns
 * @access Public 
 */
router.get('/dane/swiadkowie', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id, 
        s.imie,
        s.nazwisko,
        sk.email,
        sk.telefon,
        u.imie AS kandydat_imie,
        u.nazwisko AS kandydat_nazwisko
      FROM 
        swiadek s
      JOIN 
        user u ON s.user_id = u.id
      LEFT JOIN 
        swiadek_kontakt sk ON s.id = sk.swiadek_id
      WHERE 
        u.deleted_at IS NULL
      ORDER BY 
        s.nazwisko, s.imie
    `;
    
    const swiadkowie = await db.query(query);
    
    // Format the data for the frontend
    const formattedSwiadkowie = swiadkowie.map(swiadek => ({
      id: swiadek.id,
      nazwa: `${swiadek.imie} ${swiadek.nazwisko} (świadek ${swiadek.kandydat_imie} ${swiadek.kandydat_nazwisko})`,
      imie: swiadek.imie,
      nazwisko: swiadek.nazwisko,
      email: swiadek.email,
      telefon: swiadek.telefon,
      kandydat_imie: swiadek.kandydat_imie,
      kandydat_nazwisko: swiadek.kandydat_nazwisko
    }));
    
    res.json({
      success: true,
      data: formattedSwiadkowie
    });
  } catch (error) {
    console.error('Error fetching witnesses:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania listy świadków',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  GET /api/users/dane/parafie
 * @desc   Get all parishes for dropdowns
 * @access Public 
 */
router.get('/dane/parafie', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, 
        wp.nazwa AS wezwanie,
        m.nazwa AS miejscowosc
      FROM 
        parafia p
      JOIN 
        wezwania_parafii wp ON p.wezwanie_id = wp.id
      JOIN 
        adresy a ON p.adres_id = a.id
      JOIN 
        ulice u ON a.ulica_id = u.id
      JOIN 
        miejscowosci m ON u.miejscowosc_id = m.id
      ORDER BY 
        wp.nazwa
    `;
    
    const parafie = await db.query(query);
    
    // Format the data for the frontend
    const formattedParafie = parafie.map(parafia => ({
      id: parafia.id,
      nazwa: `${parafia.wezwanie} (${parafia.miejscowosc})`
    }));
    
    res.json({
      success: true,
      data: formattedParafie
    });
  } catch (error) {
    console.error('Error fetching parishes:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania listy parafii',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route  POST /api/users/:id/candidates
 * @desc   Assign candidates to a parent
 * @access Private (Admin, Duszpasterz or Kancelaria only) - TEMPORARILY PUBLIC FOR TESTING
 */
router.post('/:id/candidates', async (req, res) => {
  const parentId = req.params.id;
  const { kandidatIds } = req.body;
  
  if (!Array.isArray(kandidatIds)) {
    return res.status(400).json({
      success: false,
      message: 'Nieprawidłowy format danych. Oczekiwana jest tablica ID kandydatów.'
    });
  }
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Sprawdź, czy użytkownik ma rolę 'rodzic'
    const hasParentRole = await connection.query(
      `SELECT COUNT(*) as count 
       FROM user_role ur 
       JOIN role r ON ur.role_id = r.id 
       WHERE ur.user_id = ? AND r.nazwa = 'rodzic'`,
      [parentId]
    );
    
    if (hasParentRole[0].count === 0) {
      // Dodaj rolę 'rodzic' dla użytkownika
      const roleQuery = await connection.query(
        `SELECT id FROM role WHERE nazwa = 'rodzic' LIMIT 1`
      );
      
      if (roleQuery.length === 0) {
        throw new Error('Rola "rodzic" nie istnieje');
      }
      
      const roleId = roleQuery[0].id;
      
      await connection.query(
        `INSERT INTO user_role (user_id, role_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)`,
        [parentId, roleId]
      );
    }
    
    // Sprawdź, czy istnieje wpis w tabeli 'rodzic'
    const checkParentQuery = await connection.query(
      `SELECT id FROM rodzic WHERE user_id = ? LIMIT 1`,
      [parentId]
    );
    
    let rodzicId;
    
    if (checkParentQuery.length === 0) {
      // Pobierz dane użytkownika
      const userData = await connection.query(
        `SELECT imie, nazwisko FROM user WHERE id = ? LIMIT 1`,
        [parentId]
      );
      
      if (userData.length === 0) {
        throw new Error('Użytkownik nie istnieje');
      }
      
      // Pobierz adres użytkownika z tabeli adresy_user
      const userAddressQuery = await connection.query(
        `SELECT adres_id FROM adresy_user WHERE user_id = ? LIMIT 1`, 
        [parentId]
      );

      const adresId = userAddressQuery.length > 0 ? userAddressQuery[0].adres_id : null;
      
      // Dodaj wpis do tabeli 'rodzic'
      const insertResult = await connection.query(
        `INSERT INTO rodzic (user_id, imie, nazwisko, adres_id) VALUES (?, ?, ?, ?)`,
        [parentId, userData[0].imie, userData[0].nazwisko, adresId]
      );
      
      rodzicId = insertResult.insertId;
    } else {
      rodzicId = checkParentQuery[0].id;
    }
    
    // Usuń istniejące powiązania
    await connection.query(
      `DELETE FROM rodzic_kandydat WHERE rodzic_id = ?`,
      [rodzicId]
    );
    
    // Dodaj nowe powiązania
    if (kandidatIds.length > 0) {
      const values = kandidatIds.map(id => [rodzicId, id]);
      await connection.query(
        `INSERT INTO rodzic_kandydat (rodzic_id, kandydat_id) VALUES ?`,
        [values]
      );
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Kandydaci zostali przypisani do rodzica'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error assigning candidates to parent:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas przypisywania kandydatów do rodzica',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

/**
 * @route  POST /api/users/:id/grupy
 * @desc   Assign groups to an animator
 * @access Private (Admin only) - TEMPORARILY PUBLIC FOR TESTING
 */
router.post('/:id/grupy', async (req, res) => {
  const animatorId = req.params.id;
  const { grupyIds } = req.body;
  
  if (!Array.isArray(grupyIds)) {
    return res.status(400).json({
      success: false,
      message: 'Nieprawidłowy format danych. Oczekiwana jest tablica ID grup.'
    });
  }
  
  try {
    // Sprawdź, czy użytkownik istnieje i ma rolę 'animator'
    const [userWithRole] = await db.query(`
      SELECT u.id
      FROM user u
      JOIN user_role ur ON u.id = ur.user_id
      JOIN role r ON ur.role_id = r.id
      WHERE u.id = ? AND r.nazwa = 'animator' AND u.deleted_at IS NULL
    `, [animatorId]);
    
    if (!userWithRole) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie istnieje lub nie ma roli animatora'
      });
    }
    
    // Rozpocznij transakcję
    await db.query('START TRANSACTION');
    
    try {
      // Usuń przypisanie animatora ze wszystkich grup, do których był przypisany
      await db.query(`
        UPDATE grupa SET animator_id = NULL WHERE animator_id = ?
      `, [animatorId]);
      
      // Przypisz animatora do wybranych grup
      if (grupyIds.length > 0) {
        for (const grupaId of grupyIds) {
          await db.query(`
            UPDATE grupa SET animator_id = ? WHERE id = ?
          `, [animatorId, grupaId]);
        }
      }
      
      // Zatwierdź transakcję
      await db.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Grupy zostały przypisane do animatora'
      });
    } catch (error) {
      // Wycofaj transakcję w przypadku błędu
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error assigning groups to animator:', error);
    res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas przypisywania grup do animatora',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;