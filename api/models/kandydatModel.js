const db = require('../db');
const crypto = require('crypto');

/**
 * Model obsługujący operacje bazodanowe związane z kandydatami
 */
class KandydatModel {
  /**
   * Pobiera dane kandydata na podstawie ID użytkownika
   * @param {number} userId - ID użytkownika
   * @returns {Promise<Object>} - Dane kandydata
   */
  async getKandydatData(userId) {
    try {
      // 1. Pobierz podstawowe dane kandydata
      const kandydatQuery = `
        SELECT 
          u.id,
          u.imie, 
          u.nazwisko, 
          u.data_urodzenia,
          u.adres_id,
          a.ulica_id,
          a.nr_budynku,
          a.nr_lokalu,
          a.kod_pocztowy,
          ul.nazwa AS ulica_nazwa,
          ul.miejscowosc_id,
          m.nazwa AS miejscowosc_nazwa
        FROM 
          user u
        LEFT JOIN 
          adresy a ON u.adres_id = a.id
        LEFT JOIN 
          ulice ul ON a.ulica_id = ul.id
        LEFT JOIN 
          miejscowosci m ON ul.miejscowosc_id = m.id
        WHERE 
          u.id = ?
      `;
      
      const [kandydatRows] = await db.query(kandydatQuery, [userId]);
      
      if (kandydatRows.length === 0) {
        return null;
      }
      
      const kandydat = kandydatRows[0];
      
      // 2. Pobierz dane o grupie
      const grupaQuery = `
        SELECT 
          g.id,
          g.nazwa,
          g.animator_id,
          u.imie AS animator_imie,
          u.nazwisko AS animator_nazwisko
        FROM 
          grupa g
        JOIN 
          grupa_user gu ON g.id = gu.grupa_id
        LEFT JOIN 
          user u ON g.animator_id = u.id
        WHERE 
          gu.user_id = ?
      `;
      
      const grupaRows = await db.query(grupaQuery, [userId]);
      
      // 3. Pobierz dane o rodzicu
      const rodzicQuery = `
        SELECT 
          r.id,
          r.imie,
          r.nazwisko,
          r.adres_id,
          a.ulica_id,
          a.nr_budynku,
          a.nr_lokalu,
          a.kod_pocztowy,
          ul.nazwa AS ulica_nazwa,
          ul.miejscowosc_id,
          m.nazwa AS miejscowosc_nazwa,
          e.email,
          t.numer AS telefon
        FROM 
          rodzic r
        JOIN 
          rodzic_kandydat rk ON r.id = rk.rodzic_id
        LEFT JOIN 
          adresy a ON r.adres_id = a.id
        LEFT JOIN 
          ulice ul ON a.ulica_id = ul.id
        LEFT JOIN 
          miejscowosci m ON ul.miejscowosc_id = m.id
        LEFT JOIN 
          emaile e ON r.user_id = e.user_id AND e.glowny = 1
        LEFT JOIN 
          telefony t ON r.user_id = t.user_id AND t.glowny = 1
        WHERE 
          rk.kandydat_id = ?
      `;
      
      const rodzicRows = await db.query(rodzicQuery, [userId]);
      
      // 4. Pobierz dane o świadku
      const swiadekQuery = `
        SELECT 
          s.id,
          s.imie,
          s.nazwisko,
          s.adres_id,
          a.ulica_id,
          a.nr_budynku,
          a.nr_lokalu,
          a.kod_pocztowy,
          ul.nazwa AS ulica_nazwa,
          ul.miejscowosc_id,
          m.nazwa AS miejscowosc_nazwa,
          sk.email,
          sk.telefon
        FROM 
          swiadek s
        LEFT JOIN 
          adresy a ON s.adres_id = a.id
        LEFT JOIN 
          ulice ul ON a.ulica_id = ul.id
        LEFT JOIN 
          miejscowosci m ON ul.miejscowosc_id = m.id
        LEFT JOIN 
          swiadek_kontakt sk ON s.id = sk.swiadek_id
        WHERE 
          s.user_id = ?
      `;
      
      const swiadekRows = await db.query(swiadekQuery, [userId]);
      
      // 5. Pobierz dane o imieniu bierzmowania
      const imieBierzmowaniaQuery = `
        SELECT 
          id,
          imie,
          uzasadnienie
        FROM 
          imie_bierzmowania
        WHERE 
          user_id = ?
      `;
      
      const imieBierzmowaniaRows = await db.query(imieBierzmowaniaQuery, [userId]);
      
      // 6. Pobierz dane o szkole i klasie
      const uczenQuery = `
        SELECT 
          u.id,
          u.szkola_id,
          u.klasa,
          u.rok_szkolny,
          s.nazwa AS szkola_nazwa
        FROM 
          uczen u
        JOIN 
          szkola s ON u.szkola_id = s.id
        WHERE 
          u.user_id = ?
      `;
      
      const uczenRows = await db.query(uczenQuery, [userId]);
      
      // 7. Pobierz dane o parafii
      const parafiaQuery = `
        SELECT 
          p.id,
          p.email,
          p.telefon,
          wp.nazwa AS wezwanie,
          a.ulica_id,
          a.nr_budynku,
          a.nr_lokalu,
          a.kod_pocztowy,
          ul.nazwa AS ulica_nazwa,
          ul.miejscowosc_id,
          m.nazwa AS miejscowosc_nazwa
        FROM 
          parafia_user pu
        JOIN 
          parafia p ON pu.parafia_id = p.id
        JOIN 
          wezwania_parafii wp ON p.wezwanie_id = wp.id
        LEFT JOIN 
          adresy a ON p.adres_id = a.id
        LEFT JOIN 
          ulice ul ON a.ulica_id = ul.id
        LEFT JOIN 
          miejscowosci m ON ul.miejscowosc_id = m.id
        WHERE 
          pu.user_id = ?
      `;
      
      const parafiaRows = await db.query(parafiaQuery, [userId]);
      
      // 8. Formatuj i zwróć kompletne dane
      return {
        podstawowe: {
          id: kandydat.id,
          imie: kandydat.imie,
          nazwisko: kandydat.nazwisko,
          data_urodzenia: kandydat.data_urodzenia,
          adres: kandydat.adres_id ? {
            id: kandydat.adres_id,
            ulica: kandydat.ulica_nazwa,
            miejscowosc: kandydat.miejscowosc_nazwa,
            nr_budynku: kandydat.nr_budynku,
            nr_lokalu: kandydat.nr_lokalu,
            kod_pocztowy: kandydat.kod_pocztowy
          } : null
        },
        grupa: grupaRows.length > 0 ? {
          id: grupaRows[0].id,
          nazwa: grupaRows[0].nazwa,
          animator: {
            id: grupaRows[0].animator_id,
            imie: grupaRows[0].animator_imie,
            nazwisko: grupaRows[0].animator_nazwisko
          }
        } : null,
        rodzic: rodzicRows.length > 0 ? {
          id: rodzicRows[0].id,
          imie: rodzicRows[0].imie,
          nazwisko: rodzicRows[0].nazwisko,
          email: rodzicRows[0].email,
          telefon: rodzicRows[0].telefon,
          adres: rodzicRows[0].adres_id ? {
            id: rodzicRows[0].adres_id,
            ulica: rodzicRows[0].ulica_nazwa,
            miejscowosc: rodzicRows[0].miejscowosc_nazwa,
            nr_budynku: rodzicRows[0].nr_budynku,
            nr_lokalu: rodzicRows[0].nr_lokalu,
            kod_pocztowy: rodzicRows[0].kod_pocztowy
          } : null
        } : null,
        swiadek: swiadekRows.length > 0 ? {
          id: swiadekRows[0].id,
          imie: swiadekRows[0].imie,
          nazwisko: swiadekRows[0].nazwisko,
          email: swiadekRows[0].email,
          telefon: swiadekRows[0].telefon,
          adres: swiadekRows[0].adres_id ? {
            id: swiadekRows[0].adres_id,
            ulica: swiadekRows[0].ulica_nazwa,
            miejscowosc: swiadekRows[0].miejscowosc_nazwa,
            nr_budynku: swiadekRows[0].nr_budynku,
            nr_lokalu: swiadekRows[0].nr_lokalu,
            kod_pocztowy: swiadekRows[0].kod_pocztowy
          } : null
        } : null,
        imie_bierzmowania: imieBierzmowaniaRows.length > 0 ? {
          id: imieBierzmowaniaRows[0].id,
          imie: imieBierzmowaniaRows[0].imie,
          uzasadnienie: imieBierzmowaniaRows[0].uzasadnienie
        } : null,
        szkola: uczenRows.length > 0 ? {
          id: uczenRows[0].id,
          szkola_id: uczenRows[0].szkola_id,
          szkola_nazwa: uczenRows[0].szkola_nazwa,
          klasa: uczenRows[0].klasa,
          rok_szkolny: uczenRows[0].rok_szkolny
        } : null,
        parafia: parafiaRows.length > 0 ? {
          id: parafiaRows[0].id,
          wezwanie: parafiaRows[0].wezwanie,
          email: parafiaRows[0].email,
          telefon: parafiaRows[0].telefon,
          adres: {
            ulica: parafiaRows[0].ulica_nazwa,
            miejscowosc: parafiaRows[0].miejscowosc_nazwa,
            nr_budynku: parafiaRows[0].nr_budynku,
            nr_lokalu: parafiaRows[0].nr_lokalu,
            kod_pocztowy: parafiaRows[0].kod_pocztowy
          }
        } : null
      };
    } catch (error) {
      console.error('Błąd podczas pobierania danych kandydata:', error);
      throw error;
    }
  }

  /**
   * Dodaje lub aktualizuje dane rodzica kandydata
   * @param {number} kandydatId - ID kandydata
   * @param {Object} rodzicData - Dane rodzica
   * @returns {Promise<Object>} - Dane dodanego/zaktualizowanego rodzica
   */
  async saveRodzic(kandydatId, rodzicData) {
    const connection = await db.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Sprawdź, czy rodzic już istnieje
      const checkQuery = `
        SELECT r.id, r.user_id
        FROM rodzic r
        JOIN rodzic_kandydat rk ON r.id = rk.rodzic_id
        WHERE rk.kandydat_id = ?
      `;
      const [existingRodzice] = await connection.query(checkQuery, [kandydatId]);
      
      let rodzicId;
      let rodzicUserId;
      
      if (existingRodzice.length > 0) {
        // Aktualizuj istniejącego rodzica
        rodzicId = existingRodzice[0].id;
        rodzicUserId = existingRodzice[0].user_id;
        
        // Aktualizuj dane rodzica
        const updateRodzicQuery = `
          UPDATE rodzic
          SET imie = ?, nazwisko = ?, adres_id = ?
          WHERE id = ?
        `;
        await connection.query(updateRodzicQuery, [
          rodzicData.imie,
          rodzicData.nazwisko,
          rodzicData.adres_id,
          rodzicId
        ]);
      } else {
        // Utwórz nowego użytkownika dla rodzica
        const username = `rodzic.${rodzicData.imie.toLowerCase()}.${rodzicData.nazwisko.toLowerCase()}`;
        const password = crypto.randomBytes(8).toString('hex');
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        const createUserQuery = `
          INSERT INTO user (username, password_hash, imie, nazwisko, adres_id)
          VALUES (?, ?, ?, ?, ?)
        `;
        const [userResult] = await connection.query(createUserQuery, [
          username,
          passwordHash,
          rodzicData.imie,
          rodzicData.nazwisko,
          rodzicData.adres_id
        ]);
        
        rodzicUserId = userResult.insertId;
        
        // Przypisz rolę rodzica
        const addRoleQuery = `
          INSERT INTO user_role (user_id, role_id)
          SELECT ?, id FROM role WHERE nazwa = 'rodzic'
        `;
        await connection.query(addRoleQuery, [rodzicUserId]);
        
        // Dodaj email rodzica
        if (rodzicData.email) {
          const addEmailQuery = `
            INSERT INTO emaile (user_id, email, glowny)
            VALUES (?, ?, 1)
          `;
          await connection.query(addEmailQuery, [rodzicUserId, rodzicData.email]);
        }
        
        // Dodaj telefon rodzica
        if (rodzicData.telefon) {
          const addTelefonQuery = `
            INSERT INTO telefony (user_id, numer, glowny)
            VALUES (?, ?, 1)
          `;
          await connection.query(addTelefonQuery, [rodzicUserId, rodzicData.telefon]);
        }
        
        // Utwórz nowego rodzica
        const createRodzicQuery = `
          INSERT INTO rodzic (user_id, imie, nazwisko, adres_id)
          VALUES (?, ?, ?, ?)
        `;
        const [rodzicResult] = await connection.query(createRodzicQuery, [
          rodzicUserId,
          rodzicData.imie,
          rodzicData.nazwisko,
          rodzicData.adres_id
        ]);
        
        rodzicId = rodzicResult.insertId;
        
        // Powiąż rodzica z kandydatem
        const linkRodzicQuery = `
          INSERT INTO rodzic_kandydat (rodzic_id, kandydat_id)
          VALUES (?, ?)
        `;
        await connection.query(linkRodzicQuery, [rodzicId, kandydatId]);
      }
      
      // Zaktualizuj email i telefon rodzica
      if (rodzicData.email) {
        const updateEmailQuery = `
          INSERT INTO emaile (user_id, email, glowny)
          VALUES (?, ?, 1)
          ON DUPLICATE KEY UPDATE email = ?, glowny = 1
        `;
        await connection.query(updateEmailQuery, [rodzicUserId, rodzicData.email, rodzicData.email]);
      }
      
      if (rodzicData.telefon) {
        const updateTelefonQuery = `
          INSERT INTO telefony (user_id, numer, glowny)
          VALUES (?, ?, 1)
          ON DUPLICATE KEY UPDATE numer = ?, glowny = 1
        `;
        await connection.query(updateTelefonQuery, [rodzicUserId, rodzicData.telefon, rodzicData.telefon]);
      }
      
      await connection.commit();
      
      return { id: rodzicId, user_id: rodzicUserId };
    } catch (error) {
      await connection.rollback();
      console.error('Błąd podczas zapisywania danych rodzica:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Przypisuje kandydata do grupy
   * @param {number} kandydatId - ID kandydata
   * @param {number} grupaId - ID grupy
   * @returns {Promise<boolean>} - Czy operacja się powiodła
   */
  async assignToGrupa(kandydatId, grupaId) {
    try {
      // Usuń poprzednie przypisanie do grupy
      const deleteQuery = `
        DELETE FROM grupa_user
        WHERE user_id = ?
      `;
      await db.query(deleteQuery, [kandydatId]);
      
      // Dodaj nowe przypisanie
      const insertQuery = `
        INSERT INTO grupa_user (grupa_id, user_id)
        VALUES (?, ?)
      `;
      await db.query(insertQuery, [grupaId, kandydatId]);
      
      return true;
    } catch (error) {
      console.error('Błąd podczas przypisywania kandydata do grupy:', error);
      throw error;
    }
  }

  /**
   * Dodaje lub aktualizuje dane świadka kandydata
   * @param {number} kandydatId - ID kandydata
   * @param {Object} swiadekData - Dane świadka
   * @returns {Promise<Object>} - Dane dodanego/zaktualizowanego świadka
   */
  async saveSwiadek(kandydatId, swiadekData) {
    const connection = await db.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Sprawdź, czy świadek już istnieje
      const checkQuery = `
        SELECT id
        FROM swiadek
        WHERE user_id = ?
      `;
      const [existingSwiadkowie] = await connection.query(checkQuery, [kandydatId]);
      
      let swiadekId;
      
      if (existingSwiadkowie.length > 0) {
        // Aktualizuj istniejącego świadka
        swiadekId = existingSwiadkowie[0].id;
        
        const updateSwiadekQuery = `
          UPDATE swiadek
          SET imie = ?, nazwisko = ?, adres_id = ?
          WHERE id = ?
        `;
        await connection.query(updateSwiadekQuery, [
          swiadekData.imie,
          swiadekData.nazwisko,
          swiadekData.adres_id,
          swiadekId
        ]);
      } else {
        // Utwórz nowego świadka
        const createSwiadekQuery = `
          INSERT INTO swiadek (user_id, imie, nazwisko, adres_id)
          VALUES (?, ?, ?, ?)
        `;
        const [swiadekResult] = await connection.query(createSwiadekQuery, [
          kandydatId,
          swiadekData.imie,
          swiadekData.nazwisko,
          swiadekData.adres_id
        ]);
        
        swiadekId = swiadekResult.insertId;
      }
      
      // Aktualizuj dane kontaktowe świadka
      const checkKontaktQuery = `
        SELECT id
        FROM swiadek_kontakt
        WHERE swiadek_id = ?
      `;
      const [existingKontakty] = await connection.query(checkKontaktQuery, [swiadekId]);
      
      if (existingKontakty.length > 0) {
        const updateKontaktQuery = `
          UPDATE swiadek_kontakt
          SET telefon = ?, email = ?
          WHERE swiadek_id = ?
        `;
        await connection.query(updateKontaktQuery, [
          swiadekData.telefon,
          swiadekData.email,
          swiadekId
        ]);
      } else {
        const createKontaktQuery = `
          INSERT INTO swiadek_kontakt (swiadek_id, telefon, email)
          VALUES (?, ?, ?)
        `;
        await connection.query(createKontaktQuery, [
          swiadekId,
          swiadekData.telefon,
          swiadekData.email
        ]);
      }
      
      await connection.commit();
      
      return { id: swiadekId };
    } catch (error) {
      await connection.rollback();
      console.error('Błąd podczas zapisywania danych świadka:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Dodaje lub aktualizuje imię bierzmowania kandydata
   * @param {number} kandydatId - ID kandydata
   * @param {Object} imieData - Dane imienia bierzmowania
   * @returns {Promise<Object>} - Dane dodanego/zaktualizowanego imienia
   */
  async saveImieBierzmowania(kandydatId, imieData) {
    try {
      // Sprawdź, czy imię bierzmowania już istnieje
      const checkQuery = `
        SELECT id
        FROM imie_bierzmowania
        WHERE user_id = ?
      `;
      const existingImiona = await db.query(checkQuery, [kandydatId]);
      
      let imieId;
      
      if (existingImiona.length > 0) {
        // Aktualizuj istniejące imię
        imieId = existingImiona[0].id;
        
        const updateImieQuery = `
          UPDATE imie_bierzmowania
          SET imie = ?, uzasadnienie = ?
          WHERE id = ?
        `;
        await db.query(updateImieQuery, [
          imieData.imie,
          imieData.uzasadnienie,
          imieId
        ]);
      } else {
        // Utwórz nowe imię
        const createImieQuery = `
          INSERT INTO imie_bierzmowania (user_id, imie, uzasadnienie)
          VALUES (?, ?, ?)
        `;
        const result = await db.query(createImieQuery, [
          kandydatId,
          imieData.imie,
          imieData.uzasadnienie
        ]);
        
        imieId = result.insertId;
      }
      
      return { id: imieId };
    } catch (error) {
      console.error('Błąd podczas zapisywania imienia bierzmowania:', error);
      throw error;
    }
  }

  /**
   * Dodaje lub aktualizuje dane szkolne kandydata
   * @param {number} kandydatId - ID kandydata
   * @param {Object} szkolaData - Dane szkolne
   * @returns {Promise<Object>} - Dane dodane/zaktualizowane
   */
  async saveSzkola(kandydatId, szkolaData) {
    try {
      // Sprawdź, czy dane szkolne już istnieją
      const checkQuery = `
        SELECT id
        FROM uczen
        WHERE user_id = ?
      `;
      const existingUczniowie = await db.query(checkQuery, [kandydatId]);
      
      let uczenId;
      
      if (existingUczniowie.length > 0) {
        // Aktualizuj istniejące dane
        uczenId = existingUczniowie[0].id;
        
        const updateUczenQuery = `
          UPDATE uczen
          SET szkola_id = ?, klasa = ?, rok_szkolny = ?
          WHERE id = ?
        `;
        await db.query(updateUczenQuery, [
          szkolaData.szkola_id,
          szkolaData.klasa,
          szkolaData.rok_szkolny,
          uczenId
        ]);
      } else {
        // Utwórz nowe dane
        const createUczenQuery = `
          INSERT INTO uczen (user_id, szkola_id, klasa, rok_szkolny)
          VALUES (?, ?, ?, ?)
        `;
        const result = await db.query(createUczenQuery, [
          kandydatId,
          szkolaData.szkola_id,
          szkolaData.klasa,
          szkolaData.rok_szkolny
        ]);
        
        uczenId = result.insertId;
      }
      
      return { id: uczenId };
    } catch (error) {
      console.error('Błąd podczas zapisywania danych szkolnych:', error);
      throw error;
    }
  }

  /**
   * Przypisuje kandydata do parafii
   * @param {number} kandydatId - ID kandydata
   * @param {number} parafiaId - ID parafii
   * @returns {Promise<boolean>} - Czy operacja się powiodła
   */
  async assignToParafia(kandydatId, parafiaId) {
    try {
      // Sprawdź, czy przypisanie już istnieje
      const checkQuery = `
        SELECT id
        FROM parafia_user
        WHERE user_id = ?
      `;
      const existingParafie = await db.query(checkQuery, [kandydatId]);
      
      if (existingParafie.length > 0) {
        // Aktualizuj istniejące przypisanie
        const updateQuery = `
          UPDATE parafia_user
          SET parafia_id = ?
          WHERE user_id = ?
        `;
        await db.query(updateQuery, [parafiaId, kandydatId]);
      } else {
        // Utwórz nowe przypisanie
        const createQuery = `
          INSERT INTO parafia_user (user_id, parafia_id)
          VALUES (?, ?)
        `;
        await db.query(createQuery, [kandydatId, parafiaId]);
      }
      
      return true;
    } catch (error) {
      console.error('Błąd podczas przypisywania kandydata do parafii:', error);
      throw error;
    }
  }
  
  /**
   * Pobiera listę wszystkich szkół
   * @returns {Promise<Array>} - Lista szkół
   */
  async getAllSzkoly() {
    try {
      const query = `
        SELECT id, nazwa
        FROM szkola
        ORDER BY nazwa
      `;
      
      return await db.query(query);
    } catch (error) {
      console.error('Błąd podczas pobierania listy szkół:', error);
      throw error;
    }
  }
  
  /**
   * Pobiera listę wszystkich parafii
   * @returns {Promise<Array>} - Lista parafii
   */
  async getAllParafie() {
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
      
      return await db.query(query);
    } catch (error) {
      console.error('Błąd podczas pobierania listy parafii:', error);
      throw error;
    }
  }
  
  /**
   * Pobiera listę wszystkich grup
   * @returns {Promise<Array>} - Lista grup
   */
  async getAllGrupy() {
    try {
      const query = `
        SELECT 
          g.id, 
          g.nazwa,
          g.animator_id,
          u.imie AS animator_imie,
          u.nazwisko AS animator_nazwisko
        FROM 
          grupa g
        LEFT JOIN 
          user u ON g.animator_id = u.id
        ORDER BY 
          g.nazwa
      `;
      
      return await db.query(query);
    } catch (error) {
      console.error('Błąd podczas pobierania listy grup:', error);
      throw error;
    }
  }
}

module.exports = new KandydatModel(); 